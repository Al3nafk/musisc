# Musisc offline reader: runs homr (github.com/liebharc/homr, AGPL-3.0) inside Pyodide.
# homr's neural networks run on onnxruntime-web through the stand-in "onnxruntime" module below;
# the worker (omr-worker.js) provides self.ORTB, the JavaScript side of that bridge.
import os
import sys
import types
import xml.etree.ElementTree as ET

import js
import numpy as np
from pyodide.ffi import to_js

# ---------- stand-in onnxruntime: same API homr uses, every run is awaited ----------
_TO_JS = {
    np.dtype("float32"): "float32",
    np.dtype("float16"): "float16",
    np.dtype("int64"): "int64",
    np.dtype("int32"): "int32",
    np.dtype("uint8"): "uint8",
    np.dtype("bool"): "bool",
}
_TO_NP = {"float32": np.float32, "float16": np.float16, "int64": np.int64, "int32": np.int32, "uint8": np.uint8, "bool": np.bool_}


def _tensor(a):
    a = np.ascontiguousarray(a)
    return js.ORTB.tensor(_TO_JS[a.dtype], to_js(a.tobytes()), to_js([int(s) for s in a.shape]))


class OrtValue:
    def __init__(self, t):
        self._t = t  # stays a JavaScript tensor until homr asks for numbers

    @staticmethod
    def ortvalue_from_numpy(a, *args, **kwargs):
        return OrtValue(_tensor(a))

    def numpy(self):
        o = js.ORTB.out(self._t)
        return np.frombuffer(o.bytes.to_bytes(), dtype=_TO_NP[o.type]).reshape(tuple(o.dims.to_py())).copy()


class IOBinding:
    def __init__(self):
        self.inputs = {}
        self.outputs = []
        self.result = None

    def bind_cpu_input(self, name, arr):
        self.inputs[name] = _tensor(arr)

    def bind_ortvalue_input(self, name, value):
        self.inputs[name] = value._t

    def bind_output(self, name, *args, **kwargs):
        if name not in self.outputs:
            self.outputs.append(name)

    def get_outputs(self):
        return [OrtValue(getattr(self.result, n)) for n in self.outputs]


def _feeds(d):
    return to_js(d, dict_converter=js.Object.fromEntries)


class InferenceSession:
    def __init__(self, path, *args, **kwargs):
        self.name = os.path.basename(path)  # the worker loads models/<name> on first use

    def io_binding(self):
        return IOBinding()

    def get_providers(self):
        return ["CPUExecutionProvider"]

    async def run_with_iobinding(self, io=None, iobinding=None):
        io = io or iobinding
        res = await js.ORTB.run(self.name, _feeds(io.inputs), to_js(io.outputs))
        io.result = res.values

    async def run(self, output_names, feeds):
        res = await js.ORTB.run(self.name, _feeds({k: _tensor(v) for k, v in feeds.items()}), to_js(output_names) if output_names else None)
        return [OrtValue(getattr(res.values, n)).numpy() for n in res.order.to_py()]


_ort = types.ModuleType("onnxruntime")
_ort.InferenceSession = InferenceSession
_ort.OrtValue = OrtValue
_ort.get_available_providers = lambda: ["CPUExecutionProvider"]
_ort.set_default_logger_severity = lambda *a: None
_ort.preload_dlls = lambda *a, **k: None
_ort.SessionOptions = type("SessionOptions", (), {})
sys.modules["onnxruntime"] = _ort

# ---------- stubs for desktop-only extras homr imports but this reader never uses ----------
_rapid = types.ModuleType("rapidocr")
_rapid.RapidOCR = type("RapidOCR", (), {})
_rapid_utils = types.ModuleType("rapidocr.utils")
_rapid_out = types.ModuleType("rapidocr.utils.output")
_rapid_out.RapidOCROutput = type("RapidOCROutput", (), {})
sys.modules.update({"rapidocr": _rapid, "rapidocr.utils": _rapid_utils, "rapidocr.utils.output": _rapid_out})
for _name in ("requests", "pypdfium2"):
    sys.modules[_name] = types.ModuleType(_name)

sys.path.insert(0, "/omr")
from homr.main import ProcessingConfig, process_image  # noqa: E402
from homr.music_xml_generator import XmlGeneratorArguments, last_time_signatures  # noqa: E402
from homr.relieur import process_concat  # noqa: E402

CONFIG = ProcessingConfig(
    enable_debug=False,
    enable_cache=False,
    write_staff_positions=False,
    read_staff_positions=False,
    selected_staff=-1,
    transformer_use_gpu=False,
    segnet_use_gpu=False,
    coreml_encoder=False,
    title_detection=False,
)


async def read_pages(pages):
    """pages: list of PNG/JPEG bytes (JS Uint8Array). Returns MusicXML text."""
    paths = []
    times = None
    os.makedirs("/tmp/omr", exist_ok=True)
    for i, page in enumerate(pages):
        name = f"/tmp/omr/page{i}.png"
        with open(name, "wb") as f:
            f.write(page.to_bytes())
        js.omrPage(i, len(pages))
        xml_path = await process_image(name, CONFIG, XmlGeneratorArguments(), times)
        paths.append(xml_path)
        times = last_time_signatures(ET.parse(xml_path).getroot())  # noqa: S314
    if len(paths) > 1:
        merged, _, _ = process_concat(paths)
        return ET.tostring(merged, encoding="unicode")
    with open(paths[0], encoding="utf-8") as f:
        return f.read()
