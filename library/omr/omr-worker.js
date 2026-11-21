// Musisc offline reader worker: Pyodide runs homr's Python, onnxruntime-web runs its models.
// Messages in:  {type:'read', id, pages:[Uint8Array]}  (PNG/JPEG bytes, one per page)
// Messages out: {type:'progress', id, text, pct} | {type:'done', id, xml} | {type:'error', id, message}
// Runs as a module worker: new Worker(url, {type: 'module'})
import * as ort from './runtime/ort/ort.wasm.min.mjs';
import { loadPyodide } from './runtime/pyodide/pyodide.mjs';
const BASE = new URL('./', import.meta.url).href;

ort.env.wasm.wasmPaths = BASE + 'runtime/ort/';
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
ort.env.logLevel = 'error';

let current = null; // id of the job being read
const post = (m) => self.postMessage(Object.assign({ id: current }, m));
const progress = (text, pct) => post({ type: 'progress', text, pct });

// JavaScript half of glue.py's stand-in onnxruntime
const ARR = { float32: Float32Array, float16: Uint16Array, int64: BigInt64Array, int32: Int32Array, uint8: Uint8Array, bool: Uint8Array };
self.ORTB = {
  sessions: {},
  async session(name) {
    // the page segmentation model is only needed first; free its memory before the transformer loads
    if (/^(encoder|decoder)/.test(name)) await this.drop('segnet');
    if (!this.sessions[name]) {
      progress('Loading the reading model…');
      this.sessions[name] = ort.InferenceSession.create(BASE + 'models/' + name, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }
    return this.sessions[name];
  },
  async drop(prefix) {
    for (const k of Object.keys(this.sessions)) if (k.startsWith(prefix)) {
      const s = await this.sessions[k]; delete this.sessions[k];
      try { await s.release(); } catch (e) {}
    }
  },
  tensor(type, bytes, dims) {
    const buf = bytes.slice().buffer; // own, aligned copy
    return new ort.Tensor(type, new ARR[type](buf), Array.from(dims));
  },
  out(t) {
    const d = t.data;
    return { type: t.type, dims: Array.from(t.dims), bytes: new Uint8Array(d.buffer, d.byteOffset, d.byteLength) };
  },
  async run(name, feeds, outs) {
    const s = await this.session(name);
    const fetches = outs ? Array.from(outs) : undefined;
    const values = await s.run(feeds, fetches);
    return { order: fetches || s.outputNames, values };
  },
};

// homr's log lines double as progress
let pageNo = 0, pages = 1, staffsSeen = 0, staffsTotal = 0;
self.omrPage = (i, n) => { pageNo = i; pages = n; staffsSeen = 0; staffsTotal = 0; };
function log(line) {
  const p = (x) => Math.round(((pageNo + x) / pages) * 100);
  let m;
  if (/Starting Inference/.test(line)) progress(`Page ${pageNo + 1} of ${pages}: finding the staves…`, p(0.05));
  else if ((m = /Found (\d+) connected staffs/.exec(line))) { staffsTotal = 0; progress(`Page ${pageNo + 1} of ${pages}: found the music lines…`, p(0.3)); }
  else if ((m = /Running TrOmr inference on staff image (\d+)/.exec(line))) {
    staffsSeen = +m[1] + 1;
    progress(`Page ${pageNo + 1} of ${pages}: reading line ${staffsSeen}…`, p(Math.min(0.95, 0.3 + staffsSeen * 0.07)));
  }
}

let ready = null;
function boot() {
  if (ready) return ready;
  ready = (async () => {
    progress('Starting the offline reader…', 0);
    const py = await loadPyodide({ indexURL: BASE + 'runtime/pyodide/', stdout: () => {}, stderr: log });
    progress('Loading the image tools…', 0);
    await py.loadPackage(['numpy', 'opencv-python', 'pillow', 'typing-extensions'], { messageCallback: () => {}, errorCallback: () => {} });
    const zip = await (await fetch(BASE + 'homr.zip')).arrayBuffer();
    py.unpackArchive(zip, 'zip', { extractDir: '/omr' });
    py.runPython(await (await fetch(BASE + 'glue.py')).text());
    return py;
  })();
  ready.catch(() => { ready = null; });
  return ready;
}

// Photos and screenshots: honour the camera's rotation, put transparent areas on white
// (homr's OpenCV would read them as black) and hand Python a PNG.
async function toPng(bytes) {
  const bmp = await createImageBitmap(new Blob([bytes]), { imageOrientation: 'from-image' });
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0); bmp.close();
  return new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
}

let queue = Promise.resolve();
self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === 'warm') { boot().catch(() => {}); return; }
  if (msg.type !== 'read') return;
  queue = queue.then(async () => {
    current = msg.id;
    try {
      const py = await boot();
      const readPages = py.globals.get('read_pages');
      try {
        const pngs = [];
        for (const p of msg.pages) pngs.push(await toPng(p));
        const xml = await readPages(pngs); // Python sees a JS array of Uint8Arrays
        post({ type: 'done', xml });
      } finally { readPages.destroy(); }
    } catch (err) {
      post({ type: 'error', message: String((err && err.message) || err).split('\n').filter(Boolean).slice(-3).join(' ') });
    }
  });
};
