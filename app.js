const $ = s => document.querySelector(s);
const APP_HTML = document.getElementById('app').outerHTML;
const OFFLINE = Array.isArray(window.SMC_OFFLINE);
const SAMPLES = {
ode:`X:1
T:Ode to Joy
C:Ludwig van Beethoven
M:4/4
L:1/4
Q:1/4=100
K:C
E E F G | G F E D | C C D E | E3/2 D/ D2 |
E E F G | G F E D | C C D E | D3/2 C/ C2 |
D D E C | D E/F/ E C | D E/F/ E D | C D G,2 |
E E F G | G F E D | C C D E | D3/2 C/ C2 |]`,
ode2:`X:1
T:Ode to Joy (both hands)
C:Ludwig van Beethoven
M:4/4
L:1/4
Q:1/4=96
%%score {1 2}
V:1 clef=treble
V:2 clef=bass
K:C
[V:1] E E F G | G F E D | C C D E | E3/2 D/ D2 |
[V:2] C,4 | G,,4 | C,4 | G,,4 |
[V:1] E E F G | G F E D | C C D E | D3/2 C/ C2 |
[V:2] C,4 | G,,4 | C,4 | G,,2 C,2 |
[V:1] D D E C | D E/F/ E C | D E/F/ E D | C D G,2 |
[V:2] G,,4 | C,4 | G,,4 | C,2 G,,2 |
[V:1] E E F G | G F E D | C C D E | D3/2 C/ C2 |]
[V:2] C,4 | G,,4 | C,4 | G,,2 C,2 |]`,
twinkle:`X:1
T:Twinkle, Twinkle, Little Star
C:Traditional
M:4/4
L:1/4
Q:1/4=96
K:C
C C G G | A A G2 | F F E E | D D C2 |
G G F F | E E D2 | G G F F | E E D2 |
C C G G | A A G2 | F F E E | D D C2 |]`,
minuet:`X:1
T:Minuet in G
C:Christian Petzold
M:3/4
L:1/8
Q:1/4=108
K:G
d2 G A B c | d2 G2 G2 | e2 c d e f | g2 G2 G2 |
c2 d c B A | B2 c B A G | F2 G A B G | A6 |
d2 G A B c | d2 G2 G2 | e2 c d e f | g2 G2 G2 |
c2 d c B A | B2 c B A G | A2 B A G F | G6 |]`
};

const SH=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const FL=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const SOLF={C:'Do',D:'Re',E:'Mi',F:'Fa',G:'Sol',A:'La',B:'Ti'};
const FIND={
  C:'the white key just to the left of a pair of two black keys',
  D:'the white key in the middle of the two black keys',
  E:'the white key just to the right of the two black keys',
  F:'the white key just to the left of a group of three black keys',
  G:'the white key between the 1st and 2nd of the three black keys',
  A:'the white key between the 2nd and 3rd of the three black keys',
  B:'the white key just to the right of the three black keys'
};

let notes=[], currentSong=null, imgLimits=null, downloadsCap=null, speedF=1;
let vis=null, events=[], cur=0, meter={num:4,den:4}, msPerMeasure=2400, keyPref='sharp', clefs=['treble'], keyName='C major', tuneBpm=100;
let ctx=null, master=null, play=null, sampleFn=null, kbRange=[48,84];

/* ---------- audio ---------- */
// Recorded grand piano (Fluid R3 GM, every third note; the notes between are pitch-shifted),
// a soft room reverb, and a gentle limiter. Falls back to a clean additive tone until samples load.
let pianoBuf={}, pianoState='idle', pedalIn=null;
function audio(){
  if(!ctx){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    const comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-14; comp.knee.value=12; comp.ratio.value=3; comp.attack.value=.004; comp.release.value=.25;
    comp.connect(ctx.destination);
    master=ctx.createGain(); master.gain.value=.85;
    const dry=ctx.createGain(); dry.gain.value=.9;
    const wet=ctx.createGain(); wet.gain.value=.16;
    const verb=ctx.createConvolver(); verb.buffer=roomImpulse(1.8);
    master.connect(dry); dry.connect(comp);
    master.connect(verb); verb.connect(wet); wet.connect(comp);
    // sustain pedal: with the dampers up the other strings ring along, a longer and richer resonance
    pedalIn=ctx.createGain(); pedalIn.gain.value=1;
    const res=ctx.createConvolver(); res.buffer=roomImpulse(3.4);
    const resWet=ctx.createGain(); resWet.gain.value=.3;
    pedalIn.connect(res); res.connect(resWet); resWet.connect(comp);
    loadPiano();
  }
  if(ctx.state!=='running') ctx.resume().catch(()=>{}); // also covers Safari's "interrupted" state
  return ctx;
}
/* Apple devices: Safari only starts sound from a tap/click (not touchstart), and the
   ring/silent switch mutes Web Audio unless the page is marked as media playback. */
let unlocked=false, silentEl=null;
function silentWav(){
  const n=4410, b=new ArrayBuffer(44+n*2), v=new DataView(b), w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVEfmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,44100,true); v.setUint32(28,88200,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));
}
function unlockAudio(){
  try{ if(navigator.audioSession&&!(typeof MIC!=='undefined'&&MIC.on)) navigator.audioSession.type='playback'; }catch(e){}
  audio();
  try{ // play one silent sample inside the gesture: older iOS needs it to really start
    const s=ctx.createBufferSource(); s.buffer=ctx.createBuffer(1,1,22050); s.connect(ctx.destination); s.start(0);
  }catch(e){}
  if(!silentEl){
    silentEl=document.createElement('audio'); silentEl.setAttribute('playsinline',''); silentEl.setAttribute('x-webkit-airplay','deny');
    silentEl.preload='auto'; silentEl.loop=false; silentEl.src=silentWav();
  }
  try{ silentEl.currentTime=0; }catch(e){}
  const p=silentEl.play(); if(p&&p.catch) p.catch(()=>{});
  if(ctx.state==='running') unlocked=true;
}
/* iPhone/iPad: after the tab or app has been in the background, Safari often leaves the old
   audio context "interrupted", or "running" but silent. So the first tap after coming back
   builds a fresh context inside that tap (the piano samples are kept, nothing reloads). */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
let wasAway=false;
function freshAudio(){
  if(!ctx||(typeof MIC!=='undefined'&&MIC.on)||pianoState==='loading') return;
  if(play) stopDemo();
  const old=ctx; ctx=null; master=null; pedalIn=null; unlocked=false;
  try{ old.close().catch(()=>{}); }catch(e){}
  if(pianoState==='failed') pianoState='idle';
  audio();
}
['touchend','click','pointerup','keydown'].forEach(ev=>addEventListener(ev,()=>{
  if(wasAway){ wasAway=false; if(IOS) freshAudio(); }
  if(!unlocked||!ctx||ctx.state!=='running') unlockAudio();
},{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ wasAway=true; if(play&&!(typeof MIC!=='undefined'&&MIC.on)) pauseDemo(); return; }
  unlocked=false;
  if(ctx&&ctx.state!=='running') ctx.resume().catch(()=>{});
});
addEventListener('pageshow',e=>{ if(e.persisted){ wasAway=true; unlocked=false; } });
function roomImpulse(sec){
  const rate=ctx.sampleRate, len=Math.floor(rate*sec), buf=ctx.createBuffer(2,len,rate);
  for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++){ const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,3.2)*(i<rate*.012?i/(rate*.012):1); } }
  return buf;
}
async function loadPiano(){
  if(pianoState!=='idle') return; pianoState='loading';
  try{
    const data=window.SMC_PIANO || await fetch('piano.json').then(r=>{ if(!r.ok) throw 0; return r.json(); });
    await Promise.all(Object.entries(data).map(async([m,b64])=>{
      const bin=atob(b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
      pianoBuf[m]=await new Promise((ok,bad)=>ctx.decodeAudioData(u.buffer,ok,bad));
    }));
    pianoState='ready';
  }catch(e){ pianoState='failed'; }
}
function tone(midi, when, dur, dest, vel=.6, pedal=false){
  const end=when+Math.max(.12,dur), out=dest||master;
  if(MIC.on&&!dest?.isMicTest) MIC.ignoreUntil=Math.max(MIC.ignoreUntil,end+0.35);
  const g=ctx.createGain(); g.connect(out);
  const near=Math.min(108,Math.max(21,Math.round(midi/3)*3)), buf=pianoState==='ready'&&pianoBuf[near];
  if(buf){
    const src=ctx.createBufferSource(); src.buffer=buf; src.playbackRate.value=Math.pow(2,(midi-near)/12);
    src.connect(g);
    g.gain.setValueAtTime(vel,when);
    if(pedal&&end-when>.5){
      // pedal held: the recorded note fades fast, so lift its tail to keep it ringing under what follows
      const top=Math.min(end, when+buf.duration/src.playbackRate.value-.05);
      g.gain.setValueAtTime(vel,when+.25);
      g.gain.linearRampToValueAtTime(vel*Math.min(3.2,1+(top-when-.25)*1.1),top);
      g.gain.setTargetAtTime(0,end,.22);        // pedal up: dampers fall a little more softly
      if(!dest&&pedalIn) g.connect(pedalIn);
    } else g.gain.setTargetAtTime(0,end,.11);   // damper: smooth release, no click
    src.start(when); src.stop(end+(pedal?1.6:1.2));
    return;
  }
  // fallback: soft additive tone with a smooth envelope
  const f=440*Math.pow(2,(midi-69)/12), lp=ctx.createBiquadFilter();
  lp.type='lowpass'; lp.Q.value=.3;
  lp.frequency.setValueAtTime(Math.min(8000,f*6),when); lp.frequency.setTargetAtTime(Math.min(4000,f*2.5),when,.4);
  lp.connect(g);
  const parts=[[1,1],[2,.32],[3,.12],[4,.05]], oscs=[];
  parts.forEach(([h,a])=>{ if(f*h>16000) return; const o=ctx.createOscillator(), og=ctx.createGain(); o.type='sine'; o.frequency.value=f*h*(1+.0004*h*h); og.gain.value=a*.32; o.connect(og); og.connect(lp); oscs.push(o); });
  g.gain.setValueAtTime(0,when);
  g.gain.linearRampToValueAtTime(vel*.55,when+.006);
  g.gain.setTargetAtTime(vel*.2,when+.006,.35);
  g.gain.setTargetAtTime(0,end,.1);
  oscs.forEach(o=>{ o.start(when); o.stop(end+1); });
}
function hear(midis, dur=.7, pedal=false){ audio(); midis.forEach(m=>tone(m,ctx.currentTime+.02,dur,undefined,.6,pedal)); }

/* ---------- music helpers ---------- */
function info(midi){
  const pc=((midi%12)+12)%12, oct=Math.floor(midi/12)-1, name=(keyPref==='flat'?FL:SH)[pc];
  return {midi,pc,oct,name,letter:name[0],acc:name.length>1?(name[1]==='♯'?'sharp':'flat'):null,full:name+oct};
}
function clefFor(midi){ if(clefs.length===1) return clefs[0]; return midi>=60?'treble':'bass'; }
function stepOf(n, clef){ return n.oct*7+'CDEFGAB'.indexOf(n.letter) - (clef==='bass'?18:30); }
function posText(s){
  if(s>=0&&s<=8) return s%2===0 ? `on line ${s/2+1} of the staff (count lines from the bottom)` : `in space ${(s+1)/2} of the staff (count spaces from the bottom)`;
  if(s===-1) return 'in the space just under the bottom line';
  if(s===9) return 'in the space just above the top line';
  if(s<0){const n=Math.floor(-s/2); return s%2===0?`on ledger line ${n} below the staff (a short extra line)`:`just under ledger line ${n} below the staff`;}
  const n=Math.floor((s-8)/2); return s%2===0?`on ledger line ${n} above the staff (a short extra line)`:`just above ledger line ${n} above the staff`;
}
function relMiddleC(n){
  if(n.midi===60) return 'This is middle C, the C nearest the centre of the piano.';
  const d=n.oct-4;
  if(d===0) return `It is in the same octave as middle C, just above it.`;
  if(d>0) return `It is ${d===1?'one octave':d+' octaves'} above the middle-C octave (higher, to the right).`;
  return `It is ${d===-1?'one octave':(-d)+' octaves'} below the middle-C octave (lower, to the left).`;
}
function durName(w){
  const t=[[1.5,'dotted whole'],[1,'whole'],[.75,'dotted half'],[.5,'half'],[.375,'dotted quarter'],[.25,'quarter'],[.1875,'dotted eighth'],[.125,'eighth'],[.0625,'sixteenth']];
  for(const [v,n] of t) if(Math.abs(v-w)<.004) return n;
  return null;
}
function fmtBeats(b){
  const r=Math.round(b*4)/4, whole=Math.floor(r), frac=r-whole;
  const f=frac===.5?'½':frac===.25?'¼':frac===.75?'¾':'';
  const s=(whole?whole:'')+f||String(Math.round(b*100)/100);
  return s+(r===1?' beat':' beats');
}
function beatUnit(){ return {1:'whole',2:'half',4:'quarter',8:'eighth',16:'sixteenth'}[meter.den]||'quarter'; }

/* ---------- loading ---------- */
function setStatus(html, kind){ const s=$('#status'); if(!html){s.hidden=true;return;} s.hidden=false; s.className='status'+(kind?' '+kind:''); s.innerHTML=html; }

// Number every bar (small figure above each bar line) unless the notation already sets its own numbering.
function withBarNumbers(abc){
  if(/^%%(barnumbers|measurenb)\b/m.test(abc)) return abc;
  return /^X:.*$/m.test(abc) ? abc.replace(/^(X:.*)$/m,'$1\n%%barnumbers 1') : '%%barnumbers 1\n'+abc;
}
function loadAbc(abc){
  stopDemo(); resumeIdx=null; if(typeof setPlayBtn==='function'&&$('#dockPlay')) setPlayBtn(false);
  const out=ABCJS.renderAbc('score', withBarNumbers(abc), {add_classes:true, responsive:'resize', staffwidth:760,
    wrap:{minSpacing:1.8,maxSpacing:2.7,preferredMeasuresPerLine:4}, clickListener:onNoteClick, paddingleft:4, paddingright:4});
  const v=out&&out[0];
  if(!v||!v.lines||!v.lines.some(l=>l.staff)) throw new Error('No music found in that notation.');
  const hasTempo=!!(v.metaText&&v.metaText.tempo);
  try{ v.setUpAudio(hasTempo?{}:{qpm:100}); }catch(e){}
  const timer=new ABCJS.TimingCallbacks(v, hasTempo?{}:{qpm:100});
  const nt=(timer.noteTimings||[]).filter(e=>e.type==='event');
  if(!nt.length) throw new Error('The notation has no notes to play.');
  vis=v; $('#abcText').value=abc;
  tuneBpm=hasTempo&&v.getBpm?v.getBpm():100;
  setSpeed(1,'load');
  msPerMeasure=timer.millisecondsPerMeasure|| (nt[1]?nt[1].milliseconds*4:2400);
  meter=(v.getMeterFraction&&v.getMeterFraction())||{num:4,den:4};
  const first=v.lines.find(l=>l.staff);
  const st=first.staff;
  clefs=st.map(s=>/bass/.test((s.clef&&s.clef.type)||'')?'bass':'treble');
  const k=st[0].key||{};
  keyPref=(k.accidentals||[]).some(a=>a.acc==='flat')?'flat':'sharp';
  const root=(k.root||'C')+(k.acc==='#'?'♯':k.acc==='b'?'♭':'');
  keyName=root+(k.mode==='m'?' minor':' major');
  const nAcc=(k.accidentals||[]).length;
  events=nt.map((e,i)=>{
    const next=nt[i+1], gap=next?next.milliseconds-e.milliseconds:msPerMeasure/meter.num;
    const measureWhole=meter.num/meter.den;
    const pitches=(e.midiPitches||[]).filter(p=>p.cmd!=='rest'&&typeof p.pitch==='number').map(p=>{
      const whole=typeof p.duration==='number'?p.duration:gap/msPerMeasure*measureWhole;
      return {midi:p.pitch, ms:whole/measureWhole*msPerMeasure, whole, vol:typeof p.volume==='number'?p.volume:95};
    }).sort((a,b)=>b.midi-a.midi);
    return {ms:e.milliseconds, gap, els:(e.elements||[]).flat(), pitches, startChars:e.startCharArray||[e.startChar]};
  });
  // meta
  const title=(v.metaText&&v.metaText.title)||'Untitled';
  const comp=(v.metaText&&v.metaText.composer)||'';
  const noteCount=events.filter(e=>e.pitches.length).length;
  $('#meta').innerHTML=`<span><b>${esc(title)}</b>${comp?' · '+esc(comp):''}</span>
    <span>Time <b>${meter.num}/${meter.den}</b>: ${meter.num} beats per bar, a ${beatUnit()} note gets 1 beat</span>
    <span>Key <b>${keyName}</b>: ${nAcc?nAcc+' '+(keyPref==='flat'?'flat':'sharp')+(nAcc>1?'s':'')+' in the key signature':'no sharps or flats'}</span>
    <span><b>${noteCount}</b> notes</span>`;
  // keyboard range
  const all=events.flatMap(e=>e.pitches.map(p=>p.midi));
  // full 88-key piano: A0 (21) to C8 (108); widen only if a song goes beyond it
  const lo=Math.min(21,...all), hi=Math.max(109,...all.map(m=>m+1));
  kbRange=[lo,hi]; buildKeyboard();
  notes=events.flatMap(e=>e.pitches.map(p=>({midi:p.midi,start:e.ms,dur:Math.max(60,p.ms-20),hand:handOf(p.midi)})));
  rollHead=rollTarget=0; requestAnimationFrame(measureKeys);
  goTo(firstNoteIndex(), false);
}
function firstNoteIndex(){ const i=events.findIndex(e=>e.pitches.length); return i<0?0:i; }
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ---------- keyboard ---------- */
const BLACK=new Set([1,3,6,8,10]);
function buildKeyboard(){
  const kb=$('#kb'); kb.innerHTML='';
  const [lo,hi]=kbRange; const whites=[];
  for(let m=lo;m<hi;m++) if(!BLACK.has(m%12)) whites.push(m);
  kb.style.minWidth=(whites.length*18)+'px';
  whites.forEach(m=>{
    const d=document.createElement('div'); d.className='kw'+(m===60?' mid':''); d.dataset.midi=m;
    d.textContent=m%12===0?'C'+(m/12-1):'';
    kb.appendChild(d);
  });
  const W=100/whites.length;
  for(let m=lo;m<hi;m++) if(BLACK.has(m%12)){
    const wi=whites.indexOf(m+1);
    const d=document.createElement('div'); d.className='kbk'; d.dataset.midi=m;
    d.style.left=(wi*W - W*.32)+'%'; d.style.width=(W*.64)+'%';
    kb.appendChild(d);
  }
}
function lightKeys(midis, cls='on'){
  document.querySelectorAll('#kb .'+cls).forEach(k=>k.classList.remove(cls,'lh'));
  let firstEl=null;
  midis.forEach(m=>{const k=$(`#kb [data-midi="${m}"]`); if(k){k.classList.add(cls); if(handOf(m)==='L') k.classList.add('lh'); firstEl=firstEl||k;}});
  if(firstEl){
    const sc=$('#kbScroll'), r=firstEl.getBoundingClientRect(), sr=sc.getBoundingClientRect();
    if(r.left<sr.left+20||r.right>sr.right-20) sc.scrollLeft+= (r.left-sr.left)-sr.width/2;
  }
}
function flash(m, cls){ const k=$(`#kb [data-midi="${m}"]`); if(!k) return; k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),450); }

let pointerDown=false;
$('#kb').addEventListener('pointerdown',e=>{
  const k=e.target.closest('[data-midi]'); if(!k) return;
  e.preventDefault();
  const m=+k.dataset.midi; hear([m],pedalMode==='off'?.9:2.8,pedalMode!=='off'); onKeyPlayed(m);
});

function onKeyPlayed(m){
  if(play||MIC.on) return;
  const ev=events[cur], fb=$('#feedback');
  if(!$('#practice').checked||!ev||!ev.pitches.length){ fb.textContent='That key is '+info(m).full+'.'; fb.className='feedback'; return; }
  const targets=ev.pitches.map(p=>p.midi);
  if(targets.includes(m)){
    flash(m,'ok');
    ev._hit=(ev._hit||new Set()); ev._hit.add(m);
    if(targets.every(t=>ev._hit.has(t))){
      ev._hit=null; fb.textContent='Correct! '+(targets.length>1?'Chord complete.':info(m).full+'.'); fb.className='feedback good';
      setTimeout(()=>{ if(cur<events.length-1) goTo(nextIdx(cur,1),false); else {fb.textContent='You played the whole song. Press Play demo to hear it at full speed.';} },450);
    } else { fb.textContent=`Good, now the other note${targets.length-ev._hit.size>1?'s':''} of the chord.`; fb.className='feedback good'; }
  } else {
    flash(m,'bad');
    fb.textContent=`That was ${info(m).full}. Look for ${targets.map(t=>info(t).full).join(' + ')}, the glowing key.`; fb.className='feedback bad';
  }
}

/* ---------- lesson ---------- */
function nextIdx(i,dir){ let j=i+dir; while(j>=0&&j<events.length&&!events[j].pitches.length&&events[j].els.length===0) j+=dir; return Math.max(0,Math.min(events.length-1,j)); }

let litEls=[];
function highlight(ev){
  litEls.forEach(e=>e.classList.remove('hl'));
  litEls=ev.els.filter(e=>e&&e.classList); litEls.forEach(e=>e.classList.add('hl'));
  const el=ev.els[0]; if(!el||!$('#view-score').offsetParent) return;
  const sc=$('#scroller'), r=el.getBoundingClientRect(), sr=sc.getBoundingClientRect();
  if(r.top<sr.top+60) sc.scrollBy({top:r.top-sr.top-80,behavior:'smooth'});
  else if(r.bottom>sr.bottom-20) sc.scrollBy({top:r.bottom-sr.bottom+60,behavior:'smooth'});
}

function goTo(i, sound=true){
  if(!events.length) return;
  cur=Math.max(0,Math.min(events.length-1,i));
  const ev=events[cur];
  highlight(ev);
  if(play) lessonSoon(ev); else renderLesson(ev);
  lightKeys(ev.pitches.map(p=>p.midi));
  if(!play) rollTarget=ev.ms+1;
  if(!play){ $('#feedback').textContent=''; $('#feedback').className='feedback'; }
  if(sound&&ev.pitches.length) hear(ev.pitches.map(p=>p.midi), Math.min(1.4,Math.max(.4,ev.pitches[0].ms/1000)));
}

let lessonAt=0, lessonTimer=0;
function lessonSoon(ev){
  const now=performance.now(); clearTimeout(lessonTimer);
  if(now-lessonAt>=200){ lessonAt=now; renderLesson(ev); }
  else lessonTimer=setTimeout(()=>{ lessonAt=performance.now(); renderLesson(events[cur]); },200-(now-lessonAt));
}
function renderLesson(ev){
  const total=events.length;
  $('#counter').textContent=`Step ${cur+1} of ${total}`;
  const steps=[];
  if(!ev.pitches.length){
    const beats=ev.gap/msPerMeasure*meter.num;
    $('#bigName').innerHTML='𝄽'.length? 'Rest':'Rest';
    $('#bigName').style.fontSize='2.4rem';
    $('#heroTitle').textContent='A rest: silence';
    $('#heroSub').textContent=`Stay silent for ${fmtBeats(beats)}.`;
    $('#chips').innerHTML='';
    $('#staffBox').innerHTML='';
    steps.push(['Lift your hands',`A rest means no sound. Keep counting the beat (${fmtBeats(beats)}) so you come back in on time.`]);
    $('#steps').innerHTML=steps.map((s,i)=>`<li><span class="n">${i+1}</span><span><b>${s[0]}.</b> ${s[1]}</span></li>`).join('');
    $('#dockNow').textContent='Rest';
    return;
  }
  $('#bigName').style.fontSize='';
  const top=ev.pitches[0], n=info(top.midi), clef=clefFor(top.midi), s=stepOf(n,clef);
  $('#bigName').innerHTML=esc(n.name)+`<small>${n.oct}</small>`;
  const chord=ev.pitches.length>1;
  const rh=ev.pitches.filter(p=>clefFor(p.midi)==='treble'), lh=ev.pitches.filter(p=>clefFor(p.midi)==='bass');
  const twoHands=clefs.length>1&&rh.length&&lh.length;
  $('#heroTitle').textContent= twoHands ? `Right hand ${rh.map(p=>info(p.midi).full).join('+')}, left hand ${lh.map(p=>info(p.midi).full).join('+')}` : chord ? `${ev.pitches.length} notes together` : (n.midi===60?'Middle C':`${n.name} (${SOLF[n.letter]}${n.acc?' '+n.acc:''})`);
  const dn=durName(top.whole), beats=top.whole*meter.den;
  $('#heroSub').textContent=`${dn?dn[0].toUpperCase()+dn.slice(1)+' note':'Note'}: hold for ${fmtBeats(beats)}`;
  const hand=clefs.length>1?(clef==='treble'?'Right hand':'Left hand'):(clef==='bass'?'Left hand':'Right hand');
  $('#chips').innerHTML=[n.full, clef==='bass'?'Bass clef':'Treble clef', hand].concat(chord?['Chord: '+ev.pitches.map(p=>info(p.midi).full).join(' + ')]:[]).map(c=>`<span class="chip">${esc(c)}</span>`).join('');
  $('#staffBox').innerHTML=staffSvg(s,clef,n,top.whole);

  // 1. read it
  const lines=clef==='bass'?'G B D F A ("Good Boys Do Fine Always")':'E G B D F ("Every Good Boy Does Fine")';
  const spaces=clef==='bass'?'A C E G ("All Cows Eat Grass")':'F A C E (spells "FACE")';
  let read=`The note head sits ${posText(s)}. On the ${clef} staff the lines from the bottom are ${lines}; the spaces are ${spaces}.`;
  if(n.midi===60) read+=` Middle C needs its own short line ${clef==='treble'?'below the treble':'above the bass'} staff.`;
  if(n.acc) read+=` The ${n.acc==='sharp'?'sharp (♯)':'flat (♭)'} ${keyHas(n)?'comes from the key signature at the start of each line':'is written next to the note'}, so play the black key ${n.acc==='sharp'?'just to the right of':'just to the left of'} ${n.letter}.`;
  steps.push(['Read it',read]);
  // 2. find it
  let find = n.acc ? `${n.name} is a black key: start from ${n.letter} (${FIND[n.letter]}) and move one key ${n.acc==='sharp'?'right':'left'}.` : `${n.name} is ${FIND[n.letter]}.`;
  find+=' '+relMiddleC(n);
  if(twoHands){
    const l=info(lh[0].midi), ls=stepOf(l,'bass');
    find+=` At the same time your left hand plays ${l.full} from the bass staff, where it sits ${posText(ls)}. ${l.acc?'':l.name+' is '+FIND[l.letter]+'.'} Hold it for ${fmtBeats(lh[0].whole*meter.den)}.`;
  } else if(chord) find+=` Press ${ev.pitches.map(p=>info(p.midi).full).join(', ')} at the same time.`;
  steps.push(['Find it on the piano',find]);
  // 3. count it
  let count=`${dn?'A '+dn+' note':'This note'} lasts ${fmtBeats(beats)} in ${meter.num}/${meter.den} time.`;
  if(dn&&dn.startsWith('dotted')) count+=' The dot adds half the note\'s value again.';
  if(beats>=1) count+=` Count out loud: "${Array.from({length:Math.max(1,Math.round(beats))},(_,i)=>i+1).join(', ')}" while you hold the key.`;
  else count+=' It is shorter than one beat, so play it quickly and move on.';
  steps.push(['Count it',count]);
  steps.push(['Play it', $('#practice').checked?'Press the glowing key on the piano below (or your own piano). The lesson moves on when you get it right.':'Press "Hear it", then play it yourself and press Next.']);
  $('#steps').innerHTML=steps.map((t,i)=>`<li><span class="n">${i+1}</span><span><b>${t[0]}.</b> ${esc(t[1])}</span></li>`).join('');
  $('#dockNow').textContent='Now: '+ev.pitches.map(p=>info(p.midi).full).join(' + ');
}
function keyHas(n){
  const k=vis&&vis.lines.find(l=>l.staff).staff[0].key; if(!k) return false;
  return (k.accidentals||[]).some(a=>a.note&&a.note.toUpperCase()===n.letter&&(a.acc==='sharp')===(n.acc==='sharp'));
}

function staffSvg(step, clef, n, whole){
  const lo=Math.min(-2,step-2), hi=Math.max(10,step+2), sp=7;
  const y=s=>(hi-s)*sp+12, H=(hi-lo)*sp+24, W=250;
  const ink='var(--ink)', mut='var(--muted)', now='var(--now)';
  let g='';
  g+=`<text x="10" y="${y(8)-9}" font-size="10" fill="${mut}" font-family="Inter,sans-serif">${clef==='bass'?'Bass clef (F clef)':'Treble clef (G clef)'}</text>`;
  for(let s=0;s<=8;s+=2) g+=`<line x1="10" x2="196" y1="${y(s)}" y2="${y(s)}" stroke="${ink}" stroke-width="1.2"/>`;
  if(step<=-2) for(let s=-2;s>=step;s-=2) g+=`<line x1="98" x2="134" y1="${y(s)}" y2="${y(s)}" stroke="${ink}" stroke-width="1.4"/>`;
  if(step>=10) for(let s=10;s<=step;s+=2) g+=`<line x1="98" x2="134" y1="${y(s)}" y2="${y(s)}" stroke="${ink}" stroke-width="1.4"/>`;
  const L=clef==='bass'?'GABCDEFGA':'EFGABCDEF';
  for(let s=0;s<=8;s++){
    const on=s===step;
    g+=`<text x="${s%2?222:206}" y="${y(s)+3.5}" font-size="9.5" font-weight="${s%2?400:700}" fill="${on?now:mut}" font-family="Inter,sans-serif">${L[s]}</text>`;
  }
  const cy=y(step), hollow=whole>=.5;
  g+=`<ellipse cx="116" cy="${cy}" rx="8.2" ry="5.8" transform="rotate(-20 116 ${cy})" fill="${hollow?'none':now}" stroke="${now}" stroke-width="${hollow?2.4:1}"/>`;
  if(whole<1){ const up=step<4; g+= up?`<line x1="123.6" x2="123.6" y1="${cy-1}" y2="${cy-40}" stroke="${now}" stroke-width="1.8"/>`:`<line x1="108.4" x2="108.4" y1="${cy+1}" y2="${cy+40}" stroke="${now}" stroke-width="1.8"/>`; }
  if(n.acc) g+=`<text x="90" y="${cy+6}" font-size="18" text-anchor="end" fill="${now}">${n.acc==='sharp'?'♯':'♭'}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(n.full)} on the ${clef} staff">${g}</svg>`;
}

function onNoteClick(abcelem){
  const sc=abcelem.startChar;
  let i=events.findIndex(e=>e.startChars.includes(sc));
  if(i<0) i=events.findIndex(e=>e.els.some(el=>el===abcelem.abselem?.elemset?.[0]));
  if(i>=0){ if(play) stopDemo(); goTo(i,true); }
}

/* ---------- demo playback ---------- */
function speed(){ return speedF; }
// one speed value drives the slider, the % label and the BPM box
let pedalMode=(()=>{ try{ return localStorage.getItem('smc.pedal')||'off'; }catch(e){ return 'off'; } })();
function setPedal(mode){
  pedalMode=['off','bar','half'].includes(mode)?mode:'off';
  try{ localStorage.setItem('smc.pedal',pedalMode); }catch(e){}
  const sel=$('#pedalSel'); if(sel) sel.value=pedalMode;
  const lbl=$('#pedalLbl'); if(lbl) lbl.classList.toggle('on',pedalMode!=='off');
  if(play){ const i=Math.max(play.idx,0); startDemo(i); } // hear the change straight away
}
function setSpeed(f, from){
  speedF=Math.max(.05,Math.min(10,f));
  if(from!=='slider') $('#speed').value=String(Math.round(Math.max(40,Math.min(150,speedF*100))/5)*5);
  $('#speedOut').textContent=Math.round(speedF*100)+'%';
  if(from!=='bpm') $('#bpmIn').value=String(Math.round(tuneBpm*speedF));
  if(play&&from!=='load'){ const i=Math.max(play.idx,0); startDemo(i); }
}
function startDemo(from=firstNoteIndex()){
  if(!events.length) return;
  if(MIC.on) micStop();
  stopDemo(); audio();
  const sp=speed(), bus=ctx.createGain(); bus.connect(master);
  const t0=ctx.currentTime+.15, base=events[from].ms;
  // sustain pedal: each note rings on until the next pedal change (every bar or half bar), and a key
  // struck again cuts its own earlier ringing, as the damper does on a real piano
  const win=pedalMode==='bar'?msPerMeasure:pedalMode==='half'?msPerMeasure/2:0, list=[];
  for(let i=from;i<events.length;i++){
    const ev=events[i];
    ev.pitches.forEach(p=>{
      let endMs=ev.ms+Math.max(100,p.ms-20);
      if(win>0){ const change=(Math.floor((ev.ms+1)/win)+1)*win-30; endMs=Math.max(endMs,change); }
      list.push({midi:p.midi,start:ev.ms,end:endMs,vel:.35+.4*(p.vol/127)});
    });
  }
  if(win>0){ const last={}; list.slice().sort((a,b)=>a.start-b.start).forEach(n=>{ const prev=last[n.midi]; if(prev&&prev.end>n.start) prev.end=Math.max(prev.start+60,n.start-10); last[n.midi]=n; }); }
  if(win>0&&pedalIn) bus.connect(pedalIn); // the demo's notes share the pedal resonance (and stop with the demo)
  // notes are handed to the audio engine a few seconds ahead as the song plays, not all at once:
  // a long piece would otherwise create thousands of sound objects up front, which makes phones and
  // iPads stutter and can crash the page
  list.sort((a,b)=>a.start-b.start);
  const last=events[events.length-1];
  const endT=t0+((last.ms-base)+last.gap)/1000/sp+.3;
  play={bus,t0,base,sp,idx:from-1,endT,raf:0,list,next:0,pedal:win>0,timer:0};
  scheduleAhead();
  play.timer=setInterval(scheduleAhead,200); // keeps the sound going even when the screen skips frames
  $('#lessonMode').textContent='Demo: follow along';
  setPlayBtn(true);
  const tick=()=>{
    if(!play) return;
    const now=ctx.currentTime;
    if(now>=play.endT){ resumeIdx=null; stopDemo(); return; }
    scheduleAhead();
    const ms=(now-play.t0)*1000*play.sp+play.base;
    rollHead=rollTarget=Math.max(play.base,ms);
    let j=play.idx;
    while(j+1<events.length&&events[j+1].ms<=ms) j++;
    if(j!==play.idx&&j>=from){ play.idx=j; goTo(j,false); }
    play.raf=requestAnimationFrame(tick);
  };
  play.raf=requestAnimationFrame(tick);
}
const LOOKAHEAD=2.5; // seconds of music queued in the audio engine
function scheduleAhead(){
  if(!play) return;
  const p=play, until=ctx.currentTime+LOOKAHEAD;
  while(p.next<p.list.length){
    const n=p.list[p.next], at=p.t0+(n.start-p.base)/1000/p.sp;
    if(at>until) break;
    if(at>=ctx.currentTime-0.05) tone(n.midi,at,Math.max(.1,(n.end-n.start)/1000/p.sp),p.bus,n.vel,p.pedal);
    p.next++;
  }
}
let resumeIdx=null; // where Play continues after a pause
function pauseDemo(){ if(!play) return; resumeIdx=Math.max(0,play.idx); stopDemo(); goTo(resumeIdx,false); setPlayBtn(false); }
function playOrResume(){ if(play) return pauseDemo(); const from=resumeIdx!=null?resumeIdx:firstNoteIndex(); resumeIdx=null; startDemo(from); }
function stopDemo(){
  if(!play) return;
  cancelAnimationFrame(play.raf); clearInterval(play.timer);
  const b=play.bus; try{ b.gain.setTargetAtTime(0,ctx.currentTime,.03); setTimeout(()=>b.disconnect(),300);}catch(e){}
  play=null; setPlayBtn(false);
  $('#lessonMode').textContent='Learn note by note';
}
const ICON_PAUSE='<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
const ICON_PLAY='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>';
function setPlayBtn(on){
  const paused=!on&&resumeIdx!=null;
  $('#playBtn').innerHTML=on?ICON_PAUSE+'<span>Pause</span>':ICON_PLAY+'<span>'+(paused?'Resume':'Play demo')+'</span>';
  // the same control in the bottom bar, always on screen while you scroll the score
  const d=$('#dockPlay'); if(d){ d.innerHTML=on?ICON_PAUSE+'<span>Pause</span>':ICON_PLAY+'<span>'+(paused?'Resume':'Play')+'</span>'; d.setAttribute('aria-pressed',String(on)); d.title=on?'Pause the demo (Space)':'Play the demo (Space)'; }
  const b=$('#dockRestart'); if(b) b.hidden=!on&&!paused;
}
$('#playBtn').onclick=playOrResume;
$('#dockPlay').onclick=playOrResume;
$('#dockRestart').onclick=()=>{ resumeIdx=null; startDemo(firstNoteIndex()); };
$('#fromHereBtn').onclick=()=>{ resumeIdx=null; startDemo(cur); };
$('#speed').oninput=()=>setSpeed(+$('#speed').value/100,'slider');
$('#pedalSel').onchange=e=>setPedal(e.target.value);
setPedal(pedalMode);
$('#bpmIn').onchange=()=>{
  const b=parseFloat($('#bpmIn').value);
  if(!(b>0)){ $('#bpmIn').value=String(Math.round(tuneBpm*speedF)); return; }
  const c=Math.max(20,Math.min(300,Math.round(b)));
  $('#bpmIn').value=String(c);
  setSpeed(c/tuneBpm,'bpm');
};
$('#bpmIn').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#bpmIn').blur(); } });
$('#prevBtn').onclick=()=>{ stopDemo(); goTo(nextIdx(cur,-1)); };
$('#nextBtn').onclick=()=>{ stopDemo(); goTo(nextIdx(cur,1)); };
$('#hearBtn').onclick=()=>{ stopDemo(); goTo(cur); };
$('#practice').onchange=()=>renderLesson(events[cur]);
document.addEventListener('keydown',e=>{
  if(e.target.closest('textarea,input,select')) return;
  if(e.key==='ArrowRight'){e.preventDefault(); $('#nextBtn').click();}
  else if(e.key==='ArrowLeft'){e.preventDefault(); $('#prevBtn').click();}
  else if(e.key===' '){e.preventDefault(); $('#playBtn').click();}
});

/* ---------- tabs ---------- */
function showView(v){
  document.querySelectorAll('.tabs [role=tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===v)));
  ['score','orig','text'].forEach(k=>$('#view-'+k).hidden=k!==v);
}
document.querySelectorAll('.tabs [role=tab]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('#applyBtn').onclick=()=>{
  try{ loadAbc($('#abcText').value); $('#applyMsg').textContent='Updated.'; showView('score'); }
  catch(e){ $('#applyMsg').textContent=e.message+' Check the notation for typos.'; }
};

/* ---------- intake: files, paste, drop, camera ---------- */
let ctl=null;
const PROMPT=`The image shows sheet music. It may be a phone photo taken at an angle, a screenshot, or a scan.
Transcribe it into valid ABC notation (version 2.1) that the abcjs library can render and play.
Rules:
- Header lines in this order: X:1, T: (the printed title, or "Untitled"), C: (composer if printed), M: (time signature), L: (default note length), Q: (tempo marking if printed, else a sensible one such as 1/4=90), K: (key signature).
- Transcribe every measure in order: correct pitches and octaves, accidentals, note lengths, rests, ties, repeats and bar lines. Every bar must add up to the time signature (pickup bars excepted). Put about 4 bars on each line.
- For two staves (piano grand staff) write: %%score {1 2}, V:1 clef=treble, V:2 clef=bass (before K:), then alternate [V:1] and [V:2] lines covering the same bars.
- Add lyrics with w: lines only if lyrics are printed under the notes.
- If a passage is hard to read, make your best guess rather than leaving it out.
- If the image does not contain sheet music, reply with exactly NOT_SHEET_MUSIC.
Reply with only the ABC notation inside a single \`\`\`abc code block.`;

function extractAbc(t){
  const m=t.match(/```(?:abc)?\s*\n([\s\S]*?)```/i); let s=(m?m[1]:t).trim();
  const x=s.search(/^X:/m); if(x>0) s=s.slice(x);
  return s;
}
function isAbc(t){ return /^\s*K:/m.test(t) && /^\s*[XTML]:/m.test(t); }

async function askClaude(prompt, opts, label){
  if(!sampleFn){ setStatus('Reading sheet music needs the app opened on claude.ai. For now, load a sample song or paste ABC notation into the Notation tab.','err'); return null; }
  ctl?.abort(); ctl=new AbortController();
  setStatus(`<span class="spin"></span><span>${label}</span><button class="btn" id="stopRead" type="button">Stop</button>`);
  $('#stopRead').onclick=()=>ctl.abort();
  try{
    const {text}=await sampleFn(prompt,{...opts,signal:ctl.signal,
      onText:({text})=>{ const st=$('#status span:nth-child(2)'); if(st) st.textContent=`${label} (${text.split('\n').length} lines so far)`; }});
    return text;
  }catch(e){
    const msg={cancelled:'Stopped.',not_granted:'Claude access was declined, so photos cannot be read. You can still paste ABC notation.',
      rate_limited:'Too many requests right now. Wait a minute and try again.',image_rejected:'That image could not be used. Try a JPG or PNG under 20 MB.',
      images_unavailable:'This view cannot send images to Claude. Paste ABC notation instead.',refused:'Claude could not read that image. Try a clearer photo.'}[e.code]
      ||'Something went wrong while reading the music. Try again.';
    setStatus(msg, e.code==='cancelled'?'':'err');
    return null;
  }
}
async function finishAbc(text){
  if(text==null) return;
  if(/NOT_SHEET_MUSIC/.test(text)){ setStatus('That image does not look like sheet music. Try a photo where the staff lines are clear and fill the frame.','err'); return; }
  const abc=extractAbc(text);
  try{ loadAbc(abc); saveSong(abc); showView('score'); setStatus(`Saved to My songs. Check the score against your original; if a note looks wrong, fix it in the Notation tab. <button class="btn" type="button" onclick="this.parentNode.hidden=true">OK</button>`); }
  catch(e){ $('#abcText').value=abc; showView('text'); setStatus('The music was read but could not be drawn. Look over the notation and press Apply changes.','err'); }
}
function readMode(){ return (sampleFn&&imgLimits)?'claude':(OMR_HERE?'local':null); }
function pageLimit(){ return readMode()==='local'?10:Math.min((imgLimits&&imgLimits.maxCount)||4, 6); }
function noReader(){ setStatus(OFFLINE?'Reading photos and PDFs needs the online Musisc. Open it, read the music there, then make a new offline copy.':'Reading photos and PDFs needs the app opened on claude.ai.','err'); }
// blobs: page images in order; total: how many pages there were before the limit
async function readPages(blobs, name, total=blobs.length){
  const mode=readMode(); if(!mode) return noReader();
  $('#orig').innerHTML=blobs.map((b,i)=>`<img alt="Page ${i+1} of your sheet music" src="${URL.createObjectURL(b)}" style="margin-bottom:12px">`).join('');
  $('#tab-orig').hidden=false;
  if(mode==='local') return offlineRead(blobs, name);
  const note=total>blobs.length?` Only the first ${blobs.length} of ${total} pages are read.`:'';
  const prompt=(blobs.length>1?`The ${blobs.length} images are consecutive pages of one piece, in order. Transcribe them as one continuous tune.\n`:'')+PROMPT;
  const text=await askClaude(prompt,{images:blobs},(blobs.length>1?`Reading ${blobs.length} pages… this can take a minute or two.`:'Reading your sheet music… this can take up to a minute.')+note);
  finishAbc(text);
}
async function handleImage(file){
  if(!file.type.startsWith('image/')){ setStatus('Please use an image (JPG, PNG, WebP or GIF), or a PDF.','err'); return; }
  return readPages([file], file.name);
}
async function handleText(t){
  t=t.trim(); if(!t) return;
  if(isAbc(t)){ try{ loadAbc(t); saveSong(t); showView('score'); setStatus(''); }catch(e){ $('#abcText').value=t; showView('text'); setStatus(e.message,'err'); } return; }
  if(/<score-partwise/.test(t)){ try{ const abc=musicXmlToAbc(t); loadAbc(abc); saveSong(abc); showView('score'); setStatus('Opened your MusicXML on this device, no internet needed.'); return; }catch(e){ if(!sampleFn){ setStatus(esc(e.message),'err'); return; } } }
  const kind=/<score-partwise|<\?xml|<score-timewise/.test(t)?'MusicXML':'text';
  const text=await askClaude(`Convert this ${kind} music into valid ABC notation 2.1 that abcjs can render and play. Use headers X:, T:, M:, L:, Q:, K:. For two staves use %%score {1 2} with V:1 clef=treble and V:2 clef=bass. If it is not music, reply exactly NOT_SHEET_MUSIC. Reply with only the ABC inside one \`\`\`abc code block.\n\n${t.slice(0,120000)}`,{},'Converting your music…');
  finishAbc(text);
}
async function handleFile(f){
  if(!f) return;
  if(/\.mxl$/i.test(f.name)) return importLocal(async()=>musicXmlToAbc(await unzipMusicXml(await f.arrayBuffer())), f.name);
  if(/\.(mid|midi|kar)$/i.test(f.name)||/midi|mid$/.test(f.type)) return importLocal(async()=>midiToAbc(await f.arrayBuffer(), f.name), f.name);
  if(/\.(musicxml|xml)$/i.test(f.name)) return importLocal(async()=>musicXmlToAbc(await f.text()), f.name);
  if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)) return handlePdf(f);
  if(f.type.startsWith('image/')) return handleImage(f);
  if(/\.(abc|txt|xml|musicxml)$/i.test(f.name)||f.type.startsWith('text/')) return handleText(await f.text());
  setStatus('That file type is not supported. Use a photo, screenshot or PDF of the sheet, or a MusicXML (.musicxml, .mxl), MIDI (.mid) or ABC (.abc) file.','err');
}
const isPageFile=f=>f.type.startsWith('image/')||f.type==='application/pdf'||/\.pdf$/i.test(f.name);
// MusicXML, MIDI and ABC files -> ABC, all on this device
async function scoreFileToAbc(f){
  if(/\.mxl$/i.test(f.name)) return musicXmlToAbc(await unzipMusicXml(await f.arrayBuffer()));
  if(/\.(mid|midi|kar)$/i.test(f.name)||/midi|mid$/.test(f.type)) return midiToAbc(await f.arrayBuffer(), f.name);
  const t=(await f.text()).trim();
  if(/<score-partwise/.test(t)) return musicXmlToAbc(t);
  if(isAbc(t)) return t;
  throw new Error('not a MusicXML, MIDI or ABC file');
}
async function handleFiles(list){
  const files=[...(list||[])].filter(Boolean);
  if(files.length<=1) return handleFile(files[0]);
  files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
  const pages=files.filter(isPageFile), scores=files.filter(f=>!isPageFile(f));
  let done='';
  if(scores.length){
    const ok=[], bad=[];
    for(const f of scores){
      setStatus(`<span class="spin"></span><span>Opening ${esc(f.name)}…</span>`);
      try{ const abc=await scoreFileToAbc(f); loadAbc(abc); saveSong(abc); ok.push(f.name); }catch(e){ bad.push(f.name); }
    }
    if(ok.length) showView('score');
    done=(ok.length?`Opened ${ok.length} file${ok.length>1?'s':''} and saved ${ok.length>1?'them':'it'} to My songs (showing ${esc(ok[ok.length-1])}).`:'')
      +(bad.length?` Could not open: ${bad.map(esc).join(', ')}. Use MusicXML, MIDI, ABC, photos or PDFs.`:'');
    if(!pages.length){ setStatus(done.trim(), ok.length?'':'err'); return; }
  }
  if(!readMode()) return noReader();
  // photos and PDF pages, in file-name order, are read as the pages of one piece
  const max=pageLimit(), blobs=[]; let total=0;
  try{
    for(const f of pages){
      if(f.type.startsWith('image/')){ total++; if(blobs.length<max) blobs.push(f); }
      else { const r=await pdfPages(f,Math.max(1,max-blobs.length)); total+=r.total; blobs.push(...r.blobs.slice(0,max-blobs.length)); }
    }
  }catch(e){ setStatus(e.message,'err'); return; }
  if(done) setStatus(done.trim());
  return readPages(blobs, pages[0].name, total);
}
$('#fileIn').onchange=e=>{ handleFiles(e.target.files); e.target.value=''; };
$('#camIn').onchange=e=>{ handleFile(e.target.files[0]); e.target.value=''; };
$('#pasteBtn').onclick=()=>setStatus('Copy an image of sheet music (or ABC text), then press Ctrl+V here. On a phone, long-press the Notation box and choose Paste.');
document.addEventListener('paste',e=>{
  if(e.target.closest('textarea,input')) return;
  const items=[...(e.clipboardData?.items||[])];
  const imgs=items.filter(i=>i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);
  if(imgs.length){ e.preventDefault(); imgs.length>1?handleFiles(imgs):handleImage(imgs[0]); return; }
  const t=e.clipboardData?.getData('text'); if(t){ e.preventDefault(); handleText(t); }
});
let dragDepth=0;
addEventListener('dragenter',e=>{ if([...e.dataTransfer.types].includes('Files')){dragDepth++; $('#dropOv').hidden=false;} });
addEventListener('dragleave',()=>{ if(--dragDepth<=0){dragDepth=0;$('#dropOv').hidden=true;} });
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{
  e.preventDefault(); dragDepth=0; $('#dropOv').hidden=true;
  if(e.dataTransfer.files.length) return handleFiles(e.dataTransfer.files);
  const t=e.dataTransfer.getData('text'); if(t) handleText(t);
});

/* ---------- falling notes ---------- */
let rollHead=0, rollTarget=0, keyGeom={}, rollW=0, rollH=0, rollDirty=true, rollOn=true;
const roll=$('#roll'), rctx=roll.getContext('2d');
function handOf(midi){ if(clefs.length>1) return clefFor(midi)==='bass'?'L':'R'; return clefs[0]==='bass'?'L':'R'; }
function measureKeys(){
  const kb=$('#kb'), kr=kb.getBoundingClientRect(); keyGeom={};
  kb.querySelectorAll('[data-midi]').forEach(k=>{ const r=k.getBoundingClientRect(); keyGeom[k.dataset.midi]={x:r.left-kr.left,w:r.width,black:k.classList.contains('kbk')}; });
  const dpr=window.devicePixelRatio||1;
  rollW=kb.offsetWidth; rollH=roll.clientHeight||230;
  roll.style.width=rollW+'px';
  roll.width=Math.round(rollW*dpr); roll.height=Math.round(rollH*dpr);
  rctx.setTransform(dpr,0,0,dpr,0,0);
  rollDirty=true;
}
addEventListener('resize',()=>requestAnimationFrame(measureKeys));
function rr(x,y,w,h,r){ r=Math.min(r,w/2,h/2); rctx.beginPath(); rctx.moveTo(x+r,y); rctx.arcTo(x+w,y,x+w,y+h,r); rctx.arcTo(x+w,y+h,x,y+h,r); rctx.arcTo(x,y+h,x,y,r); rctx.arcTo(x,y,x+w,y,r); rctx.closePath(); }
const COL={R:{w:'#38D6F5',b:'#1A8FE0'},L:{w:'#5BE07A',b:'#1FB33F'}};
function drawRoll(){
  if(!rollOn||!rollW) return;
  const W=rollW,H=rollH, msBeat=msPerMeasure/meter.num, ppm=74/msBeat, head=rollHead;
  rctx.fillStyle='#14171D'; rctx.fillRect(0,0,W,H);
  for(const m in keyGeom){ const g=keyGeom[m], pc=m%12; if(pc===0||pc===5){ rctx.fillStyle=pc===0?'rgba(255,255,255,.10)':'rgba(255,255,255,.05)'; rctx.fillRect(Math.round(g.x),0,1,H); } }
  rctx.font='11px Inter, system-ui, sans-serif'; rctx.textBaseline='bottom';
  const first=Math.floor(head/msPerMeasure), last=Math.ceil((head+H/ppm)/msPerMeasure);
  for(let b=Math.max(0,first);b<=last;b++){
    const y=H-(b*msPerMeasure-head)*ppm; if(y<0||y>H) continue;
    rctx.fillStyle='rgba(255,255,255,.22)'; rctx.fillRect(0,Math.round(y),W,1);
    rctx.fillStyle='rgba(255,255,255,.55)'; rctx.fillText(String(b+1),6,y-3);
  }
  // white-key notes first so black-key notes sit on top
  for(const pass of [false,true]) for(const n of notes){
    const g=keyGeom[n.midi]; if(!g||g.black!==pass) continue;
    const yb=H-(n.start-head)*ppm, yt=yb-n.dur*ppm;
    if(yt>H||yb<0) continue;
    const active=head>=n.start&&head<n.start+n.dur, c=COL[n.hand][g.black?'b':'w'];
    const x=g.x+(g.black?1:2), w=g.w-(g.black?2:4);
    rctx.save();
    if(active){ rctx.shadowColor=c; rctx.shadowBlur=14; }
    rctx.globalAlpha=active?1:(n.start+n.dur<head?.35:.92);
    rctx.fillStyle=c;
    const top=Math.max(-4,yt), bot=Math.min(yb,H+4);
    rr(x,top,w,Math.max(5,bot-top),4); rctx.fill();
    rctx.restore();
  }
  const grd=rctx.createLinearGradient(0,H-14,0,H); grd.addColorStop(0,'rgba(255,255,255,0)'); grd.addColorStop(1,'rgba(255,255,255,.16)');
  rctx.fillStyle=grd; rctx.fillRect(0,H-14,W,14);
}
function rollLoop(){
  if(!play){ const d=rollTarget-rollHead; if(Math.abs(d)>.5){ rollHead+=d*.18; rollDirty=true; } else if(rollHead!==rollTarget){ rollHead=rollTarget; rollDirty=true; } }
  else rollDirty=true;
  if(rollDirty){ drawRoll(); rollDirty=false; }
  requestAnimationFrame(rollLoop);
}
function setRoll(on){
  rollOn=on; roll.hidden=!on;
  $('#rollBtn').textContent=on?'Hide falling notes':'Show falling notes';
  $('#rollBtn').setAttribute('aria-pressed',String(on));
  try{ localStorage.setItem('smc.roll',on?'1':'0'); }catch(e){}
  if(on) requestAnimationFrame(measureKeys);
}
$('#rollBtn').onclick=()=>setRoll(!rollOn);
let pianoOpen=true;
function setPiano(open){
  pianoOpen=open;
  $('.dock').classList.toggle('collapsed',!open);
  $('#pianoBtn').textContent=open?'Hide piano ▾':'Show piano ▴';
  $('#pianoBtn').setAttribute('aria-expanded',String(open));
  $('#rollBtn').hidden=!open;
  $('#dockLabel').hidden=!open;
  try{ localStorage.setItem('smc.piano',open?'1':'0'); }catch(e){}
  if(open) requestAnimationFrame(measureKeys);
}
$('#pianoBtn').onclick=()=>setPiano(!pianoOpen);

/* ---------- choosing the microphone (built-in or another one) ---------- */
const BUILTIN=/built-?in|internal|integrated|array|macbook|iphone|ipad|front|back|bottom|top|speakerphone|handset|phone mic|default.*(mic|input)|realtek/i;
function micPref(){ try{ return localStorage.getItem('smc.mic')||''; }catch(e){ return ''; } }
function setMicPref(id){ try{ id?localStorage.setItem('smc.mic',id):localStorage.removeItem('smc.mic'); }catch(e){} }
// iPhone/iPad: with the mic on, Safari would route sound to the quiet earpiece unless the page says it
// plays and records at once. Phones: keep the screen awake, a locked screen stops the microphone.
function setAudioSession(type){ try{ if(navigator.audioSession) navigator.audioSession.type=type; }catch(e){} }
let wakeLock=null;
async function keepAwake(on){
  try{
    if(on&&'wakeLock' in navigator&&!wakeLock){ wakeLock=await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release',()=>{ wakeLock=null; }); }
    else if(!on&&wakeLock){ await wakeLock.release(); wakeLock=null; }
  }catch(e){ wakeLock=null; }
}
// coming back to the tab: the screen lock (and the wake lock) may have been lost
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&MIC.on) keepAwake(true); });
async function openMic(id){
  const audio={echoCancellation:false,noiseSuppression:false,autoGainControl:false};
  if(id) audio.deviceId={exact:id};
  try{ return await navigator.mediaDevices.getUserMedia({audio}); }
  catch(e){
    // the remembered mic was unplugged: fall back to the device's default one
    if(id&&(e.name==='OverconstrainedError'||e.name==='NotFoundError')){ setMicPref(''); delete audio.deviceId; return await navigator.mediaDevices.getUserMedia({audio}); }
    throw e;
  }
}
async function fillMicList(){
  const sel=$('#micDev'); if(!sel||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices) return;
  let devs=[]; try{ devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput'&&d.deviceId&&d.deviceId!=='default'&&d.deviceId!=='communications'); }catch(e){}
  const using=MIC.stream&&MIC.stream.getAudioTracks()[0], usingId=using&&using.getSettings?using.getSettings().deviceId:'';
  const pref=micPref();
  sel.innerHTML='<option value="">Device default</option>'+devs.map((d,i)=>{
    const name=d.label||('Microphone '+(i+1)), builtin=BUILTIN.test(name);
    return `<option value="${esc(d.deviceId)}">${esc(name.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i,''))}${builtin?' (built-in)':''}</option>`;
  }).join('');
  sel.value=pref&&devs.some(d=>d.deviceId===pref)?pref:'';
  const lbl=$('#micDevLbl'); if(lbl) lbl.hidden=devs.length<1;
  if(using&&!pref) sel.title='Now using: '+(using.label||'the default microphone');
}
if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange',()=>{ if(MIC.on) fillMicList(); });

/* ---------- microphone practice: hears you play and guides you note by note ----------
   Detection: an FFT of the mic signal. A note starts when the level jumps (onset); the spectrum just
   after the onset minus the one just before it is the sound of the newly struck keys, so notes still
   ringing under the pedal do not count. Each candidate key gets a harmonic-sum score; keys are picked
   one at a time, removing the partials of each pick, which finds single notes and chords. */
const MIC={on:false, mode:'wait', stream:null, src:null, an:null, td:null, fd:null, mag:null, hist:[], raf:0,
  noise:1e-4, rmsHist:[], lastOnset:0, pending:null, ignoreUntil:0, idx:0, tries:0, stats:null, tempo:null, test:null};
const midiHz=m=>440*Math.pow(2,(m-69)/12);
function micSalience(mag, m, binHz){
  const f0=midiHz(m); let s=0;
  for(let h=1;h<=8;h++){
    const f=f0*h; if(f>5000) break;
    const c=f/binHz, w=Math.max(1,c*0.012);           // piano partials run a little sharp: widen with height
    let best=0; for(let b=Math.floor(c-w);b<=Math.ceil(c+w);b++) if(b>0&&b<mag.length&&mag[b]>best) best=mag[b];
    s+=best/Math.pow(h,0.6);
  }
  return s;
}
// returns [{midi, s}] strongest first; lo/hi limit the keys considered
function micDetect(mag, binHz, maxNotes=4, lo=28, hi=100){
  mag=Float32Array.from(mag); const found=[];
  let first=0;
  for(let n=0;n<maxNotes;n++){
    let best=-1, bestS=0;
    for(let m=lo;m<=hi;m++){ if(found.some(f=>f.midi===m)) continue; const s=micSalience(mag,m,binHz); if(s>bestS){ bestS=s; best=m; } }
    if(best<0) break;
    // a key an octave below a found note scores from its even partials: prefer the found one
    if(n===0) first=bestS; else if(bestS<first*0.3) break;
    found.push({midi:best,s:bestS});
    const f0=midiHz(best);
    for(let h=1;h<=12;h++){ const c=f0*h/binHz, w=Math.max(1.5,c*0.015); for(let b=Math.floor(c-w);b<=Math.ceil(c+w);b++) if(b>0&&b<mag.length) mag[b]*=0.15; }
  }
  // octave check for the strongest note: if the note an octave up explains it as well, and the
  // fundamental bin itself is weak, it is probably that higher note
  return found;
}
function micSpectrum(){
  MIC.an.getFloatFrequencyData(MIC.fd);
  const mag=MIC.mag; for(let i=0;i<mag.length;i++) mag[i]=Math.pow(10,MIC.fd[i]/20);
  return Float32Array.from(mag);
}
function micRms(){
  MIC.an.getFloatTimeDomainData(MIC.td);
  let s=0; const n=1024, o=MIC.td.length-n; for(let i=o;i<MIC.td.length;i++) s+=MIC.td[i]*MIC.td[i];
  return Math.sqrt(s/n);
}
function keyWord(n){ return n===1?'1 key':n+' keys'; }
function describeMiss(played, target){
  const d=target-played, p=info(played).full, t=info(target).full;
  if(d%12===0) return `That was ${p}: the right note, but in another octave. Play the ${t} ${d>0?'higher up':'lower down'} (the glowing key).`;
  return `That was ${p}. This note is ${t}: ${keyWord(Math.abs(d))} ${d>0?'higher (to the right)':'lower (to the left)'}, counting black keys.`;
}
const micSay=(html,cls='')=>{ const m=$('#micMsg'); if(m){ m.innerHTML=html; m.className='mic-msg'+(cls?' '+cls:''); } const fb=$('#feedback'); if(fb){ fb.innerHTML=html; fb.className='feedback'+(cls==='ok'?' good':cls==='bad'?' bad':''); } };
function micTargets(i){ const ev=events[i]; return ev?ev.pitches.map(p=>p.midi):[]; }
function nextNoteIdx(i){ for(let j=i;j<events.length;j++) if(events[j].pitches.length) return j; return -1; }
function barOf(ev){ return Math.max(1,Math.floor((ev.ms+1)/msPerMeasure)+1); }
function micMark(ev, cls){ (ev.els||[]).forEach(e=>{ if(e&&e.classList){ e.classList.remove('note-ok','note-bad','note-late'); if(cls) e.classList.add(cls); } }); }
function micClearMarks(){ document.querySelectorAll('#score .note-ok,#score .note-bad,#score .note-late').forEach(e=>e.classList.remove('note-ok','note-bad','note-late')); }
function promptFor(i){
  const t=micTargets(i); if(!t.length) return '';
  const names=t.slice().sort((a,b)=>a-b).map(m=>`<b>${info(m).full}</b>`);
  return t.length>1?`Play together: ${names.join(' + ')}`:`Play ${names[0]} (${SOLF[info(t[0]).letter]||''}), the glowing key.`;
}

// ----- judging one struck sound against what the score expects -----
function peakAt(mag, f, binHz){ const c=f/binHz, w=Math.max(1,c*0.012); let b=0; for(let i=Math.floor(c-w);i<=Math.ceil(c+w);i++) if(i>0&&i<mag.length&&mag[i]>b) b=mag[i]; return b; }
const ratioK=(hi,lo)=>{ const k=midiHz(hi)/midiHz(lo), kr=Math.round(k); return kr>=2&&kr<=8&&Math.abs(k/kr-1)<0.012?kr:0; };
// is key t sounding? Its pitch must be clearly stronger than what a lower sounding key's overtone would give
// there (G4 is also the 4th overtone of G2, so in G2+G4 it must stand out from G2's 3rd and 5th overtones)
function micPresent(mag, binHz, t, others, top, strict){
  const sal=micSalience(mag,t,binHz), pk=peakAt(mag,midiHz(t),binHz);
  let overtone=false;
  for(const o of others){
    if(o>=t) continue; const k=ratioK(t,o); if(!k) continue;
    overtone=true;
    // a lone low key's overtones fall off smoothly, so its k-th one is about the average of its neighbours
    const fo=midiHz(o), expect=(peakAt(mag,fo*(k-1),binHz)+peakAt(mag,fo*(k+1),binHz))/2;
    if(pk<expect*1.3) return false;
  }
  if(sal<top*(overtone&&!strict?0.05:0.15)) return false;
  // a key must sound at its own pitch (or its first overtone): otherwise a higher key's sound, which
  // lines up with this key's upper overtones, would make it look played (G4 ringing is G2's 4th overtone)
  let max=0; const lo=Math.floor(50/binHz), hi=Math.min(mag.length,Math.ceil(4000/binHz)); for(let i=lo;i<hi;i++) if(mag[i]>max) max=mag[i];
  return pk>=0.08*max||(!others.includes(t+12)&&peakAt(mag,2*midiHz(t),binHz)>=0.12*max);
}
function bandSum(mag, binHz){ let s=0; const lo=Math.floor(60/binHz), hi=Math.min(mag.length,Math.ceil(4000/binHz)); for(let i=lo;i<hi;i++) s+=mag[i]; return s; }
function micJudge(fresh, post, targets, binHz, pre){
  const found=micDetect(fresh, binHz, Math.min(6,targets.length+2));
  if(!found.length) return {kind:'none'};
  // little new sound: the same key struck again while it still rings, or just noise. Accept it only
  // if every wanted key clearly sounds now; never call it a mistake
  const quiet=post&&bandSum(fresh,binHz)<0.12*bandSum(post,binHz);
  const check=(mag, f, strict)=>{
    const top=Math.max(f.length?f[0].s:0, ...targets.map(t=>micSalience(mag,t,binHz)));
    const others=[...new Set([...targets, ...f.map(x=>x.midi)])];
    const has=t=>micPresent(mag,binHz,t,others,top,strict)||f.some(x=>Math.abs(x.midi-t)===12&&x.s>=top*0.5);
    // a key an octave (or other overtone) above another wanted key sounds at the same pitch as that key's
    // overtone, so it cannot be told apart reliably: if the lower key sounds, give it the benefit of the doubt
    return t=>has(t)||targets.some(o=>o<t&&ratioK(t,o)&&has(o));
  };
  const top=Math.max(found[0].s, ...targets.map(t=>micSalience(fresh,t,binHz)));
  // a found key that is not wanted and is not just an overtone of a wanted key
  const maxPk=Math.max(...found.map(f=>peakAt(fresh,midiHz(f.midi),binHz)),1e-12);
  // ...and that just got louder: a key still ringing under the pedal only fades (or swells a little)
  const isNew=m=>!pre||!post||peakAt(post,midiHz(m),binHz)>1.3*peakAt(pre,midiHz(m),binHz);
  const wrong=found.filter(f=>f.s>=top*0.45&&isNew(f.midi)&&peakAt(fresh,midiHz(f.midi),binHz)>=maxPk*0.25&&!targets.includes(f.midi)&&!targets.some(t=>Math.abs(f.midi-t)===12||ratioK(f.midi,t)));
  // wanted keys may be heard in everything that sounds now (a key struck again while it still rings
  // cancels out of the "new" spectrum); wrong keys only count if they were just struck
  const inFresh=check(fresh, found), inPostRaw=post?check(post, micDetect(post,binHz,Math.min(8,targets.length+3)), true):()=>false;
  const inPost=inPostRaw;
  if(quiet) return targets.every(inPost)?{kind:'ok'}:{kind:'none'};
  // right note, wrong octave: an octave up leaves nothing at the wanted pitch; an octave down has a
  // strong pitch of its own an octave below the wanted one
  const pf=x=>peakAt(fresh,midiHz(x),binHz);
  for(const t of targets){
    // skip while the wanted key was already ringing: striking it again shows up mostly at its overtones
    if(pre&&peakAt(pre,midiHz(t),binHz)>0.25*Math.max(1e-12,peakAt(post||fresh,midiHz(t),binHz))) continue;
    for(const up of [12,24]) if(!targets.includes(t+up)&&found[0].midi===t+up&&pf(t)<0.2*pf(t+up)) return {kind:'wrong', played:t+up, missing:[t]};
    if(!targets.includes(t-12)&&found[0].midi===t-12&&pf(t-12)>pf(t)) return {kind:'wrong', played:t-12, missing:[t]};
  }
  const missing=targets.filter(t=>!inFresh(t)&&!inPost(t));
  if(!missing.length&&!wrong.length) return {kind:'ok'};
  if(!wrong.length) return {kind:'partial', missing};
  // name the wrong key in the right octave: a key whose own pitch is weak next to the pitch an octave up
  // was probably that higher key (its overtones made the lower one look plausible)
  let w=wrong[0].midi;
  for(let k=0;k<2&&peakAt(fresh,midiHz(w),binHz)<0.35*peakAt(fresh,midiHz(w+12),binHz);k++) w+=12;
  return {kind:'wrong', played:w, missing};
}
// ----- the listening loop -----
function micLoop(){
  if(!MIC.on) return;
  MIC.raf=requestAnimationFrame(micLoop);
  micStep(ctx.currentTime);
}
// one analysis step at audio time `now` (also driven by the self-test with a simulated mic)
function micStep(now){
  const rms=micRms(), raw=micSpectrum();
  // first ~1 s: learn the room (its level and its noise at each frequency)
  if(MIC.calib){
    const c=MIC.calib; c.rms.push(rms); for(let i=0;i<raw.length;i++) c.spec[i]+=raw[i]; c.n++;
    if(now>=c.until){
      c.rms.sort((a,b)=>a-b); MIC.noise=Math.max(2e-4,c.rms[Math.floor(c.rms.length*0.6)]||2e-4);
      MIC.noiseSpec=c.spec.map(v=>v/Math.max(1,c.n)); MIC.calib=null; MIC.lastOnset=now; MIC.rmsHist=[]; MIC.hist=[];
      if(c.done) c.done();
    }
    return;
  }
  const ns=MIC.noiseSpec, spec=ns?raw.map((v,i)=>Math.max(0,v-1.6*ns[i])):raw;
  MIC.hist.push({t:now,spec}); while(MIC.hist.length&&now-MIC.hist[0].t>0.6) MIC.hist.shift();
  MIC.rmsHist.push({t:now,rms}); while(MIC.rmsHist.length&&now-MIC.rmsHist[0].t>0.25) MIC.rmsHist.shift();
  const lvl=$('#micLevel'); if(lvl) lvl.style.width=Math.min(100,Math.max(0,(20*Math.log10(rms/MIC.noise+1e-9))*3))+'%';
  if(MIC.mode==='tempo') tempoTick(now);
  if(now<MIC.ignoreUntil&&!MIC.sim) return;
  // onset: a clear rise over the quietest level of the last 0.25 s
  // a new note: the level rises over the quietest moment of the last 0.25 s, or jumps within 60 ms,
  // or the spectrum suddenly gains energy (a key struck while others still ring under the pedal)
  const recentMin=Math.min(...MIC.rmsHist.map(r=>r.rms));
  const ago=MIC.rmsHist.filter(r=>now-r.t>=0.05).pop(), agoSpec=MIC.hist.filter(h=>now-h.t>=0.05).pop();
  let flux=0;
  if(agoSpec){ let up=0, base=1e-9; const a=agoSpec.spec, lo=Math.floor(60/(MIC.an.context.sampleRate/MIC.an.fftSize)), hi=Math.min(spec.length, Math.ceil(4000/(MIC.an.context.sampleRate/MIC.an.fftSize)));
    for(let i=lo;i<hi;i++){ const d=spec[i]-a[i]; if(d>0) up+=d; base+=a[i]; } flux=up/base; }
  const rising=rms>recentMin*1.8||(ago&&rms>ago.rms*1.22)||(flux>0.45&&ago&&rms>ago.rms*1.06);
  if(!MIC.pending&&now-MIC.lastOnset>0.11&&rms>MIC.noise*2.2&&rising){
    const pre=MIC.hist.find(h=>now-h.t<=0.16)||MIC.hist[0];
    MIC.lastOnset=now; MIC.pending={t:now, pre:pre.spec, frames:[]};
  }
  const p=MIC.pending;
  if(p){
    const age=now-p.t;
    if(age>=0.13) p.frames.push(spec);
    if(age>=0.24&&p.frames.length){
      MIC.pending=null;
      const post=new Float32Array(spec.length); p.frames.forEach(f=>{ for(let i=0;i<f.length;i++) post[i]+=f[i]/p.frames.length; });
      const fresh=new Float32Array(spec.length); for(let i=0;i<fresh.length;i++) fresh[i]=Math.max(0,post[i]-0.85*p.pre[i]);
      const binHz=MIC.an.context.sampleRate/MIC.an.fftSize;
      onHeard(fresh, binHz, p.t, post, p.pre);
    }
  }
}
function onHeard(fresh, binHz, t, post, pre){
  if(MIC.mode==='tempo') return tempoHeard(fresh, binHz, t, post, pre);
  const i=events[cur]&&events[cur].pitches.length?cur:MIC.idx, targets=micTargets(i); if(!targets.length) return;
  if(i!==MIC.idx){ MIC.idx=i; MIC.tries=0; }
  const j=micJudge(fresh, post, targets, binHz, pre), ev=events[i];
  if(j.kind==='none') return;
  if(j.kind==='ok'){
    targets.forEach(m=>flash(m,'ok'));
    if(!MIC.tries) MIC.stats.first++;
    MIC.stats.done++; micMark(ev, MIC.tries?'note-late':'note-ok');
    micSay(['Correct!','Yes!','Nice.','Good.'][MIC.stats.done%4]+(targets.length>1?' Chord complete.':''),'ok');
    MIC.tries=0; micStats();
    if(MIC.sim) micAdvance(i+1); else setTimeout(()=>{ if(MIC.on&&MIC.mode==='wait') micAdvance(i+1); },260);
  } else if(j.kind==='partial'){
    micSay(`Almost: also play ${j.missing.map(m=>`<b>${info(m).full}</b>`).join(' + ')} at the same time.`,'bad');
    MIC.tries++; MIC.stats.wrong++; micMark(ev,'note-bad'); micStats();
  } else {
    flash(j.played,'bad');
    MIC.tries++; MIC.stats.wrong++; micMark(ev,'note-bad');
    (MIC.stats.badBars[barOf(ev)]=(MIC.stats.badBars[barOf(ev)]||0)+1);
    const near=targets.reduce((a,b)=>Math.abs(b-j.played)<Math.abs(a-j.played)?b:a);
    let msg=describeMiss(j.played, near);
    if(MIC.tries>=3){ msg+=' Listen: here it is.'; micHint(targets); }
    micSay(msg,'bad'); micStats();
  }
}
function micHint(targets){ MIC.ignoreUntil=ctx.currentTime+1.6; hear(targets,1); }
function micAdvance(i){
  const j=nextNoteIdx(i);
  if(j<0) return micFinish();
  MIC.idx=j; MIC.tries=0; goTo(j,false); micSay(promptFor(j));
}
function micStats(){
  const s=MIC.stats, el=$('#micStats'); if(!el||!s) return;
  el.innerHTML=MIC.mode==='tempo'
    ?`<span class="g">✓ ${s.first}</span> <span class="y">late/early ${s.late}</span> <span class="r">✗ ${s.wrong+s.missed}</span>`
    :`<span class="g">✓ ${s.done}</span> <span class="r">✗ ${s.wrong}</span> <span>${s.total-s.done} to go</span>`;
}

// ----- play-along mode: the score moves at the chosen speed -----
function tempoStart(from){
  const sp=speed(), base=events[from].ms, beat=msPerMeasure/meter.num/sp/1000, countIn=meter.num;
  const t0=ctx.currentTime+0.4+countIn*beat;
  // count-in clicks (the mic ignores them)
  for(let k=0;k<countIn;k++){ const at=ctx.currentTime+0.4+k*beat; const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=k?1000:1500; g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(0.25,at+0.005); g.gain.exponentialRampToValueAtTime(0.0001,at+0.08); o.connect(g); g.connect(master); o.start(at); o.stop(at+0.1); }
  MIC.ignoreUntil=t0-0.12;
  const list=[]; for(let i=from;i<events.length;i++) if(events[i].pitches.length) list.push({i,at:t0+(events[i].ms-base)/1000/sp,done:false});
  MIC.tempo={t0,base,sp,list,next:0,shown:-1};
  micSay(`Get ready… ${countIn} beats to count you in, then play along as the notes reach the keys.`);
}
function tempoTick(now){
  const T=MIC.tempo; if(!T) return;
  const ms=T.base+(now-T.t0)*1000*T.sp;
  rollHead=rollTarget=Math.max(T.base,ms); rollDirty=true;
  // show the note that is due now
  let k=T.list.findIndex(n=>n.at>now-0.05); if(k<0) k=T.list.length-1;
  if(k!==T.shown&&now>=T.t0-0.05){ T.shown=k; const n=T.list[k]; cur=n.i; highlight(events[n.i]); lightKeys(micTargets(n.i)); renderLesson(events[n.i]); }
  // notes whose window has passed without being played are misses
  const win=n=>Math.min(0.35,Math.max(0.15,(events[n.i].gap/1000/T.sp)*0.5));
  for(const n of T.list){ if(!n.done&&now>n.at+win(n)+0.3&&!(MIC.pending&&Math.abs(MIC.pending.t-n.at)<=win(n)+0.1)){ n.done=true; MIC.stats.missed++; micMark(events[n.i],'note-bad'); (MIC.stats.badBars[barOf(events[n.i])]=(MIC.stats.badBars[barOf(events[n.i])]||0)+1); micStats(); } }
  if(T.list.every(n=>n.done)&&now>T.list[T.list.length-1].at+0.9) micFinish();
}
function tempoHeard(fresh, binHz, t, post, pre){
  const T=MIC.tempo; if(!T) return;
  // the closest unplayed note in time
  let best=null; for(const n of T.list){ if(n.done) continue; const d=t-n.at; const w=Math.min(0.35,Math.max(0.15,(events[n.i].gap/1000/T.sp)*0.5))+0.1; if(Math.abs(d)<=w&&(!best||Math.abs(d)<Math.abs(best.d))) best={n,d}; }
  if(!best) return;
  const targets=micTargets(best.n.i), j=micJudge(fresh,post,targets,binHz,pre), ev=events[best.n.i];
  if(j.kind==='none') return;
  best.n.done=true;
  if(j.kind==='ok'){
    const ms=Math.round(best.d*1000);
    targets.forEach(m=>flash(m,'ok'));
    if(Math.abs(ms)<=90){ MIC.stats.first++; micMark(ev,'note-ok'); micSay('On time ✓','ok'); }
    else { MIC.stats.late++; micMark(ev,'note-late'); micSay(ms>0?`Right note, a little late (${ms} ms)`:`Right note, a little early (${-ms} ms)`,'ok'); }
  } else {
    if(j.played!=null) flash(j.played,'bad');
    MIC.stats.wrong++; micMark(ev,'note-bad'); (MIC.stats.badBars[barOf(ev)]=(MIC.stats.badBars[barOf(ev)]||0)+1);
    micSay(j.kind==='partial'?`Missing ${j.missing.map(m=>info(m).full).join(' + ')}`:`Wrong note: ${info(j.played).full} instead of ${targets.map(m=>info(m).full).join(' + ')}`,'bad');
  }
  micStats();
}

// ----- start, stop and the end-of-song summary -----
async function micStart(from=cur){
  if(MIC.on) return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ setStatus('This browser cannot use the microphone.','err'); return; }
  stopDemo(); audio();
  try{
    if(!MIC.test){
      setAudioSession('play-and-record');
      MIC.stream=await openMic(micPref());
      MIC.src=ctx.createMediaStreamSource(MIC.stream);
    } else MIC.src=MIC.test;
  }catch(e){
    setAudioSession('playback');
    const blocked=e&&(e.name==='NotAllowedError'||e.name==='SecurityError');
    setStatus(blocked?(sampleFn?'The microphone is not available inside claude.ai. Open the <a href="https://al3nafk.github.io/musisc/" target="_blank" rel="noopener">GitHub version of Musisc</a> to practice with the mic.':'Musisc needs permission to use the microphone. Allow it in your browser (the icon next to the address), then press Practice with mic again.'):'No microphone was found. Plug one in or use a device with a mic.','err');
    return;
  }
  if(!MIC.test){ fillMicList(); keepAwake(true); }
  MIC.an=ctx.createAnalyser(); MIC.an.fftSize=8192; MIC.an.smoothingTimeConstant=0;
  MIC.td=new Float32Array(MIC.an.fftSize); MIC.fd=new Float32Array(MIC.an.frequencyBinCount); MIC.mag=new Float32Array(MIC.an.frequencyBinCount);
  MIC.src.connect(MIC.an);
  MIC.mode=$('#micMode').value; MIC.on=true; MIC.hist=[]; MIC.rmsHist=[]; MIC.pending=null; MIC.tries=0; MIC.tempo=null;
  const total=events.slice(from).filter(e=>e.pitches.length).length;
  MIC.stats={first:0,done:0,wrong:0,late:0,missed:0,total,badBars:{},from,t0:Date.now()};
  micClearMarks(); $('#micBar').hidden=false; $('#micBtn').classList.add('active'); $('#micBtn').lastChild.textContent=' Stop practice';
  $('#lessonMode').textContent=MIC.mode==='tempo'?'Play along with the mic':'Practice with the mic';
  micStats();
  // a short quiet moment to learn the room's noise
  micSay('Listening… stay quiet for a second while Musisc measures the room.');
  const first=nextNoteIdx(from); if(first<0){ micStop(); return; }
  MIC.noiseSpec=null;
  MIC.calib={until:ctx.currentTime+0.9, rms:[], spec:new Float32Array(MIC.an.frequencyBinCount), n:0, done:()=>{
    if(MIC.mode==='tempo') tempoStart(first); else { MIC.idx=first; goTo(first,false); micSay(promptFor(first)); }
  }};
  micLoop();
}
function micStop(quiet){
  if(!MIC.on) return;
  MIC.on=false; cancelAnimationFrame(MIC.raf);
  try{ MIC.src&&MIC.src.disconnect(); }catch(e){}
  if(MIC.stream) MIC.stream.getTracks().forEach(t=>t.stop());
  MIC.stream=null; MIC.src=null; MIC.tempo=null;
  keepAwake(false); setAudioSession('playback');
  $('#micBtn').classList.remove('active'); $('#micBtn').lastChild.textContent=' Practice with mic';
  $('#lessonMode').textContent='Learn note by note';
  if(!quiet){ $('#micBar').hidden=true; }
}
function micFinish(){
  const s=MIC.stats, mode=MIC.mode; micStop(true);
  const secs=Math.round((Date.now()-s.t0)/1000);
  const bars=Object.entries(s.badBars).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([b])=>+b).sort((a,b)=>a-b);
  const pct=s.total?Math.round(100*s.first/s.total):0;
  const head=mode==='tempo'
    ?`You played along to the end. <b>${pct}%</b> on time and right (${s.first} of ${s.total}), ${s.late} a little early or late, ${s.wrong} wrong, ${s.missed} missed.`
    :`You played the whole piece in ${secs} s. <b>${pct}%</b> right first time (${s.first} of ${s.total}), ${s.wrong} mistake${s.wrong===1?'':'s'}.`;
  const tip=bars.length?` Tricky spots: bar${bars.length>1?'s':''} ${bars.join(', ')}.`:(pct>=90?' Excellent! Try Play along, or raise the speed.':'');
  micSay(head+tip+` <span class="mic-actions"><button class="btn mini primary" type="button" id="micAgain">Practice again</button>${bars.length?` <button class="btn mini" type="button" id="micBars">Practice bar ${bars[0]}</button>`:''} <button class="btn mini" type="button" id="micClose">Close</button></span>`, pct>=80?'ok':'');
  $('#micAgain').onclick=()=>micStart(s.from);
  if($('#micBars')) $('#micBars').onclick=()=>{ const i=events.findIndex(e=>e.pitches.length&&barOf(e)>=bars[0]); micStart(i<0?s.from:i); };
  $('#micClose').onclick=()=>{ $('#micBar').hidden=true; micClearMarks(); };
}
$('#micBtn').onclick=()=> MIC.on?micStop():micStart(cur>0?cur:firstNoteIndex());
$('#micStop').onclick=()=>micStop();
$('#micMode').onchange=()=>{ if(MIC.on){ const from=MIC.stats.from; micStop(true); micStart(from); } };
$('#micDev').onchange=e=>{ setMicPref(e.target.value); if(MIC.on){ const from=MIC.stats.from; micStop(true); micStart(from); } };

/* ---------- song library ---------- */
const SAMPLE_NAMES={ode:'Ode to Joy (melody)',ode2:'Ode to Joy (both hands)',twinkle:'Twinkle, Twinkle, Little Star',minuet:'Minuet in G'};
let memSongs=null; // fallback when browser storage is unavailable
function getSongs(){ try{ return JSON.parse(localStorage.getItem('smc.songs')||'[]'); }catch(e){ return memSongs||[]; } }
function putSongs(list){ memSongs=list; try{ localStorage.setItem('smc.songs',JSON.stringify(list)); }catch(e){} }
function songs(){ const l=getSongs(); return l.length?l:(memSongs||[]); }
function saveSong(abc, replaceCurrent=false){
  const title=(vis&&vis.metaText&&vis.metaText.title)||'Untitled';
  const list=songs();
  let s=list.find(x=>x.abc===abc) || (replaceCurrent&&(currentSong||'').startsWith('m:')&&list.find(x=>'m:'+x.id===currentSong));
  if(s){ s.abc=abc; s.title=title; }
  else { s={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title,abc,added:new Date().toISOString().slice(0,10)}; list.unshift(s); }
  putSongs(list); currentSong='m:'+s.id; fillSongs();
}
function fillSongs(){
  const list=songs();
  let h='<option value="">Open a song…</option>';
  if(list.length) h+='<optgroup label="My songs">'+list.map(s=>`<option value="m:${s.id}">${esc(s.title)}</option>`).join('')+'</optgroup>';
  h+='<optgroup label="Samples">'+Object.keys(SAMPLES).map(k=>`<option value="s:${k}">${esc(SAMPLE_NAMES[k])}</option>`).join('')+'</optgroup>';
  if((currentSong||'').startsWith('m:')) h+='<optgroup label="This song"><option value="del">Remove from My songs</option></optgroup>';
  $('#songSel').innerHTML=h;
}
$('#songSel').onchange=e=>{
  const v=e.target.value; e.target.value=''; if(!v) return;
  if(v==='del'){
    const list=songs(), gone=list.find(s=>'m:'+s.id===currentSong);
    putSongs(list.filter(s=>'m:'+s.id!==currentSong)); currentSong=null; fillSongs();
    setStatus(`Removed "${esc(gone?gone.title:'song')}" from My songs. <button class="btn" type="button" id="undoDel">Undo</button>`);
    $('#undoDel').onclick=()=>{ const l=songs(); l.unshift(gone); putSongs(l); currentSong='m:'+gone.id; fillSongs(); setStatus(''); };
    return;
  }
  try{
    if(v.startsWith('s:')) loadAbc(SAMPLES[v.slice(2)]);
    else { const s=songs().find(x=>'m:'+x.id===v); if(!s) return; loadAbc(s.abc); }
    currentSong=v; fillSongs(); showView('score'); setStatus('');
  }catch(err){ setStatus(esc(err.message),'err'); }
};
$('#applyBtn').onclick=()=>{
  try{ const t=$('#abcText').value; loadAbc(t); if(!(currentSong||'').startsWith('s:')) saveSong(t, true); $('#applyMsg').textContent='Updated.'; showView('score'); }
  catch(e){ $('#applyMsg').textContent=e.message+' Check the notation for typos.'; }
};

/* ---------- online search: four free, legal libraries ----------
   Mutopia Project piano scores (public domain / Creative Commons MIDI, mirrored on the Musisc site),
   OpenScore Lieder songs for voice and piano (CC0, converted to .mxl with MuseScore, mirrored too),
   Wikimedia Commons MIDI files (searched live), and The Session folk tunes (ABC, searched live). */
const TS='https://thesession.org', WM='https://commons.wikimedia.org/w/api.php';
const LIB=(/github\.io$/.test(location.hostname)||location.protocol==='http:')?'library/':'https://al3nafk.github.io/musisc/library/';
const TS_METER={reel:'4/4',hornpipe:'4/4',barndance:'4/4',strathspey:'4/4',march:'4/4',jig:'6/8','slip jig':'9/8',slide:'12/8',polka:'2/4',waltz:'3/4',mazurka:'3/4','three-two':'3/2'};
const TS_MODE={major:'maj',minor:'min',dorian:'dor',mixolydian:'mix',lydian:'lyd',phrygian:'phr',locrian:'loc'};
const PER=12;
let findQ='', findGen=0, mutopia=null, openscore=null;
function findFoot(){
  const q=$('#findIn').value.trim();
  const imslp='https://imslp.org/index.php?title=Special:Search&search='+encodeURIComponent(q||'piano');
  $('#findFoot').innerHTML=navigator.onLine
    ? `Searches <a href="https://www.mutopiaproject.org" target="_blank" rel="noopener">Mutopia</a> piano scores, <a href="https://github.com/OpenScore/Lieder" target="_blank" rel="noopener">OpenScore</a> songs, <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a> and <a href="${TS}" target="_blank" rel="noopener">The Session</a>: about 30,000 free pieces. Still not there? <a href="${imslp}" target="_blank" rel="noopener">Search IMSLP</a> and drop the PDF in.`
    : 'You are offline. Search needs an internet connection; your saved songs still open from the menu above.';
  $('#findBtn').disabled=!navigator.onLine;
}
const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const words=q=>fold(q).split(/[^a-z0-9]+/).filter(Boolean);
function retitle(abc, title, extra){
  abc=abc.replace(/^T:.*$/m,'T:'+cleanTitle(title));
  return extra? abc.replace(/^(T:.*)$/m,'$1\n'+extra.map(cleanTitle).join('\n')) : abc;
}
const SOURCES={
  mutopia:{
    name:'Piano scores', note:'Mutopia Project',
    async search(q,page){
      if(!mutopia){ const r=await fetch(LIB+'mutopia.json',{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); mutopia=await r.json(); mutopia.forEach(m=>m._k=fold([m.t,m.by,m.o,m.i,m.s].join(' '))); }
      const w=words(q), fq=fold(q);
      const hits=mutopia.filter(m=>w.every(x=>m._k.includes(x)))
        .map(m=>({m,score:(fold(m.t).includes(fq)?2:0)+(m.i==='Piano'?1:0)})).sort((a,b)=>b.score-a.score).map(x=>x.m);
      return {total:hits.length, more:hits.length>page*PER, items:hits.slice((page-1)*PER,page*PER).map(m=>({key:m.f,title:m.t,sub:`${m.by} · ${m.i}`}))};
    },
    async open(key){
      const m=mutopia.find(x=>x.f===key);
      const r=await fetch(LIB+'mutopia/'+key); if(!r.ok) throw new Error('HTTP '+r.status);
      const abc=midiToAbc(await r.arrayBuffer(), m.t);
      return {title:m.t, abc:retitle(abc,m.t,[`C:${m.by}`,`N:From the Mutopia Project (mutopiaproject.org, piece ${m.id}), ${m.l}`])};
    }
  },
  openscore:{
    name:'Songs with piano', note:'OpenScore Lieder',
    async search(q,page){
      if(!openscore){ const r=await fetch(LIB+'openscore.json',{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status); openscore=await r.json(); openscore.forEach(m=>m._k=fold([m.t,m.by,m.a,m.set,m.i].join(' '))); }
      const w=words(q), fq=fold(q);
      const hits=openscore.filter(m=>w.every(x=>m._k.includes(x)))
        .map(m=>({m,score:fold(m.t).includes(fq)?1:0})).sort((a,b)=>b.score-a.score).map(x=>x.m);
      return {total:hits.length, more:hits.length>page*PER, items:hits.slice((page-1)*PER,page*PER).map(m=>({key:m.f,title:m.t,sub:m.by+(m.set?` · ${m.set}`:'')}))};
    },
    async open(key){
      const m=openscore.find(x=>x.f===key);
      const r=await fetch(LIB+'openscore/'+key); if(!r.ok) throw new Error('HTTP '+r.status);
      const abc=musicXmlToAbc(await unzipMusicXml(await r.arrayBuffer()));
      return {title:m.t, abc:retitle(abc,m.t,[`C:${m.by}`,`N:From OpenScore Lieder (github.com/OpenScore/Lieder), CC0 public domain`].filter(x=>!(x.startsWith('C:')&&/^C:/m.test(abc))))};
    }
  },
  commons:{
    name:'Wikimedia Commons', note:'free MIDI files',
    async search(q,page){
      const u=`${WM}?action=query&format=json&origin=*&list=search&srnamespace=6&srlimit=${PER}&sroffset=${(page-1)*PER}&srinfo=totalhits&srprop=&srsearch=${encodeURIComponent(q+' filemime:audio/midi')}`;
      const r=await fetch(u); if(!r.ok) throw new Error('HTTP '+r.status); const d=await r.json();
      const total=(d.query&&d.query.searchinfo&&d.query.searchinfo.totalhits)||0, list=(d.query&&d.query.search)||[];
      return {total, more:!!d.continue, items:list.map(s=>({key:s.title, title:commonsName(s.title), sub:'MIDI file'}))};
    },
    async open(key){
      const r=await fetch(`${WM}?action=query&format=json&origin=*&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(key)}`); const d=await r.json();
      const pg=Object.values(d.query.pages)[0], url=pg&&pg.imageinfo&&pg.imageinfo[0].url; if(!url) throw new Error('file not found');
      const f=await fetch(url.split('?')[0]); if(!f.ok) throw new Error('HTTP '+f.status);
      const title=commonsName(key);
      return {title, abc:retitle(midiToAbc(await f.arrayBuffer(), title), title, [`N:From Wikimedia Commons: commons.wikimedia.org/wiki/${key.replace(/ /g,'_')}`])};
    }
  },
  session:{
    name:'Folk tunes', note:'The Session',
    async search(q,page){
      const r=await fetch(`${TS}/tunes/search?q=${encodeURIComponent(q)}&format=json&perpage=${PER}&page=${page}`); if(!r.ok) throw new Error('HTTP '+r.status);
      const d=await r.json();
      return {total:d.total||0, more:d.page<d.pages, items:(d.tunes||[]).map(t=>({key:String(+t.id), title:t.name, sub:(t.type||'tune')+(t.alias&&t.alias!==t.name?' · also “'+t.alias+'”':'')}))};
    },
    async open(id){
      const r=await fetch(`${TS}/tunes/${id}?format=json`); if(!r.ok) throw new Error('HTTP '+r.status);
      const t=await r.json(); const st=(t.settings||[])[0]; if(!st) throw new Error('this tune has no notation yet.');
      return {title:t.name, abc:sessionAbc(t,st)};
    }
  }
};
function commonsName(t){ return t.replace(/^File:/,'').replace(/\.(mid|midi|kar)$/i,'').replace(/_/g,' '); }
function sessionAbc(tune, setting){
  const meter=TS_METER[tune.type]||'4/4', compound=/\/8$/.test(meter);
  const m=/^([A-G][b#]?)(\w+)$/.exec(setting.key||'')||[];
  const key=(m[1]||'C')+(TS_MODE[(m[2]||'').toLowerCase()]||'');
  const body=String(setting.abc||'').replace(/\r/g,'').replace(/!(?![A-Za-z<>+.()]+!)/g,'\n').replace(/\n{2,}/g,'\n').trim();
  return `X:1\nT:${tune.name}\nC:Traditional (thesession.org/tunes/${tune.id})\nR:${tune.type||''}\nM:${meter}\nL:1/8\nQ:${compound?'3/8=72':'1/4=110'}\nK:${key}\n${body}\n`;
}
async function searchSource(id, q, page, gen){
  const src=SOURCES[id], sec=$(`#findResults [data-src="${id}"]`); if(!sec) return 0;
  const grid=sec.querySelector('.grid'), head=sec.querySelector('h3 span');
  const old=sec.querySelector('.more'); if(old) old.remove();
  try{
    const res=await src.search(q,page); if(gen!==findGen) return 0;
    if(!res.items.length&&page===1){ sec.hidden=true; return 0; }
    head.textContent=`${res.total.toLocaleString()} found · ${src.note}`;
    grid.insertAdjacentHTML('beforeend',res.items.map(it=>`<button type="button" class="hit" data-src="${id}" data-key="${esc(it.key)}" title="${esc(it.title)}"><b>${esc(it.title)}</b><span>${esc(it.sub)}</span></button>`).join(''));
    if(res.more){ grid.insertAdjacentHTML('afterend','<button class="btn mini more" type="button">More</button>'); sec.querySelector('.more').onclick=()=>searchSource(id,q,page+1,gen); }
    return res.total;
  }catch(e){ if(gen!==findGen) return 0; if(page===1) sec.hidden=true; return -1; }
}
async function searchOnline(q){
  if(!navigator.onLine){ findFoot(); return; }
  findQ=q; const gen=++findGen;
  $('#findResults').innerHTML=Object.keys(SOURCES).map(id=>`<section data-src="${id}"><h3>${SOURCES[id].name} <span>searching…</span></h3><div class="grid"></div></section>`).join('');
  setStatus('<span class="spin"></span><span>Searching for "'+esc(q)+'"…</span>');
  const totals=await Promise.all(Object.keys(SOURCES).map(id=>searchSource(id,q,1,gen)));
  if(gen!==findGen) return;
  const found=totals.filter(n=>n>0).reduce((a,b)=>a+b,0);
  if(found) setStatus(`${found.toLocaleString()} result${found==1?'':'s'} for "${esc(q)}". Pick one to open it.`);
  else if(totals.every(n=>n<0)) setStatus('Could not reach the online libraries. Check your internet connection'+(sampleFn?', or open Musisc from its GitHub link (al3nafk.github.io/musisc), where search always works':'')+'.','err');
  else setStatus(`No sheet music found for "${esc(q)}". Try a shorter name, the composer, or a different spelling.`);
}
async function openOnline(id, key, btn){
  setStatus('<span class="spin"></span><span>Opening the sheet music…</span>');
  try{
    const {title, abc}=await SOURCES[id].open(key);
    loadAbc(abc); saveSong(abc); showView('score');
    document.querySelectorAll('#findResults .hit').forEach(b=>b.removeAttribute('aria-current')); if(btn) btn.setAttribute('aria-current','true');
    setStatus(`Opened "${esc(title)}" and saved it to My songs, so it also works offline.`);
  }catch(e){ setStatus('Could not open that piece: '+esc(e.message||'unknown error'),'err'); }
}
$('#findForm').onsubmit=e=>{ e.preventDefault(); const q=$('#findIn').value.trim(); if(q) searchOnline(q); };
$('#findIn').oninput=findFoot;
$('#findResults').onclick=e=>{ const b=e.target.closest('.hit'); if(b) openOnline(b.dataset.src, b.dataset.key, b); };
addEventListener('online',findFoot); addEventListener('offline',findFoot);
if(OFFLINE) $('#find').hidden=true; else findFoot();

/* ---------- PDF ---------- */
function loadScript(src){ return new Promise((ok,bad)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>bad(new Error('load')); document.head.appendChild(s); }); }
async function pdfLib(){
  if(window.pdfjsLib&&window.pdfjsWorker) return window.pdfjsLib;
  const base=OMR_HERE?OMR_BASE+'runtime/pdfjs/':'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  if(!window.pdfjsLib) await loadScript(base+'pdf.min.js');
  if(!window.pdfjsWorker) await loadScript(base+'pdf.worker.min.js'); // runs the PDF engine on the page itself
  return window.pdfjsLib;
}
async function pdfPages(file, max){
  setStatus('<span class="spin"></span><span>Opening '+esc(file.name||'your PDF')+'…</span>');
  let lib;
  try{ lib=await pdfLib(); }catch(e){ throw new Error('Could not load the PDF reader. Check your internet connection and try again.'); }
  let pdf;
  try{ pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise; }
  catch(e){ throw new Error(esc(file.name||'That PDF')+' could not be opened. If it is password-protected, remove the password or take a screenshot of the page instead.'); }
  const n=Math.min(pdf.numPages,max), blobs=[];
  for(let i=1;i<=n;i++){
    setStatus(`<span class="spin"></span><span>Preparing page ${i} of ${n}…</span>`);
    const page=await pdf.getPage(i), base=page.getViewport({scale:1});
    const vp=page.getViewport({scale:Math.min(3,1800/base.width)});
    const c=document.createElement('canvas'); c.width=Math.round(vp.width); c.height=Math.round(vp.height);
    const cx=c.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,c.width,c.height);
    await page.render({canvasContext:cx,viewport:vp}).promise;
    blobs.push(await new Promise(r=>c.toBlob(r,'image/jpeg',.92)));
  }
  return {blobs,total:pdf.numPages};
}
async function handlePdf(file){
  if(!readMode()) return noReader();
  try{ const {blobs,total}=await pdfPages(file,pageLimit()); return readPages(blobs,file.name,total); }
  catch(e){ setStatus(e.message,'err'); }
}

/* ---------- offline reader: photos and PDFs read on this device ----------
   homr (github.com/liebharc/homr, AGPL-3.0) runs in a worker through Pyodide + onnxruntime-web.
   Its files (~195 MB) are downloaded once into the browser cache, then reading works with no internet.
   Only where the files are served from the same site (the GitHub Pages app); claude.ai uses Claude instead. */
const OMR_HERE=!OFFLINE&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&'caches' in window
  &&(location.protocol==='http:'||/github\.io$/.test(location.hostname));
const OMR_BASE='library/omr/';
let omrMan=null, omrWorker=null, omrSeq=0; const omrJobs={};
async function omrManifest(){
  if(omrMan) return omrMan;
  const r=await fetch(OMR_BASE+'manifest.json',{cache:'no-cache'}).catch(()=>caches.match(OMR_BASE+'manifest.json'));
  if(!r||!r.ok) throw new Error('offline reader files not found');
  return omrMan=await r.json();
}
const omrCacheName=m=>'musisc-omr-'+m.version;
async function omrMissing(){
  const m=await omrManifest(), c=await caches.open(omrCacheName(m));
  const miss=[]; for(const f of m.files) if(!(await c.match(OMR_BASE+f.f))) miss.push(f);
  return miss;
}
async function omrDownload(onProgress){
  const m=await omrManifest(), c=await caches.open(omrCacheName(m));
  try{ await navigator.storage?.persist?.(); }catch(e){}
  for(const k of await caches.keys()) if(k.startsWith('musisc-omr-')&&k!==omrCacheName(m)) await caches.delete(k);
  const miss=await omrMissing(), total=miss.reduce((a,f)=>a+f.size,0); let done=0;
  const man=await fetch(OMR_BASE+'manifest.json',{cache:'no-cache'}); await c.put(OMR_BASE+'manifest.json',man);
  for(const f of miss){
    const r=await fetch(OMR_BASE+f.f,{cache:'no-cache'}); if(!r.ok) throw new Error('download failed: '+f.f);
    const reader=r.body.getReader(), parts=[];
    for(;;){ const {done:end,value}=await reader.read(); if(end) break; parts.push(value); done+=value.length; onProgress(done,total); }
    await c.put(OMR_BASE+f.f,new Response(new Blob(parts),{headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}}));
  }
}
function omrRead(pages, onProgress){
  if(!omrWorker){
    omrWorker=new Worker(OMR_BASE+'omr-worker.js',{type:'module'});
    omrWorker.onmessage=e=>{ const m=e.data, job=omrJobs[m.id]; if(!job) return;
      if(m.type==='progress') job.progress(m);
      else { delete omrJobs[m.id]; m.type==='done'?job.ok(m.xml):job.bad(new Error(m.message)); } };
    omrWorker.onerror=e=>{ for(const k in omrJobs){ omrJobs[k].bad(new Error(e.message||'the reader stopped')); delete omrJobs[k]; } omrWorker=null; };
  }
  return new Promise((ok,bad)=>{ const id=++omrSeq; omrJobs[id]={ok,bad,progress:onProgress}; omrWorker.postMessage({type:'read',id,pages}); });
}
const mb=n=>Math.round(n/1048576);
function askToDownload(size){
  return new Promise(res=>{
    setStatus(`Reading sheet music on this device needs a one-time download of about ${mb(size)} MB. After that it works even with no internet. <button class="btn primary" type="button" id="omrYes">Download</button> <button class="btn" type="button" id="omrNo">Not now</button>`);
    $('#omrYes').onclick=()=>res(true); $('#omrNo').onclick=()=>{ setStatus(''); res(false); };
  });
}
async function ensureOmr(ask=true){
  let miss;
  try{ miss=await omrMissing(); }catch(e){ setStatus('The offline reader could not be found. Connect to the internet and reload Musisc once.','err'); return false; }
  if(!miss.length) return true;
  if(!navigator.onLine){ setStatus('Reading photos offline needs a one-time download first. Connect to the internet once and open a photo, or press "Offline reading" above.','err'); return false; }
  if(ask&&!(await askToDownload(miss.reduce((a,f)=>a+f.size,0)))) return false;
  try{
    await omrDownload((d,t)=>setStatus(`<span class="spin"></span><span>Downloading the offline reader… ${mb(d)} of ${mb(t)} MB</span>`));
    updateOmrBtn(); return true;
  }catch(e){ setStatus('The download stopped: '+esc(e.message)+'. Check your connection and try again.','err'); return false; }
}
async function offlineRead(blobs, name){
  if(!(await ensureOmr())) return;
  const t0=Date.now();
  setStatus('<span class="spin"></span><span>Reading your sheet music on this device… the first time can take a few minutes. Keep this tab open.</span>');
  try{
    const pages=await Promise.all(blobs.map(async b=>new Uint8Array(await b.arrayBuffer())));
    const xml=await omrRead(pages, m=>setStatus(`<span class="spin"></span><span>${esc(m.text)}${m.pct!=null?` (${m.pct}%)`:''} Keep this tab open.</span>`));
    let abc=musicXmlToAbc(xml);
    if(/^T:\s*(Untitled)?\s*$/m.test(abc)) abc=retitle(abc, sheetName(name)); // homr does not read titles
    loadAbc(abc); saveSong(abc); showView('score');
    setStatus(`Read on this device in ${Math.round((Date.now()-t0)/1000)} s and saved to My songs. Offline reading can get some notes wrong: compare with the Original tab, and fix any mistakes in the Notation tab.`);
  }catch(e){ setStatus('Could not read that sheet music: '+esc(e.message||'unknown error')+'. Try a sharper, flatter photo with the whole page in view.','err'); }
}
function sheetName(file){
  const n=String(file||'').replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').trim();
  return (!n||/^(img|pxl|dsc|dcim|image|photo|scan|screenshot|whatsapp)\b/i.test(n)||/^\d[\d ]*$/.test(n))?'Sheet music '+new Date().toLocaleDateString():n;
}
async function updateOmrBtn(){
  const b=$('#omrBtn'); if(!b) return;
  if(!OMR_HERE||sampleFn){ b.hidden=true; return; }
  b.hidden=false;
  try{ const miss=await omrMissing(); b.dataset.ready=miss.length?'':'1';
    b.lastChild.textContent=miss.length?` Offline reading (${mb(miss.reduce((a,f)=>a+f.size,0))} MB)`:' Offline reading ready';
    b.title=miss.length?'Download the photo and PDF reader so it works without internet':'Photos and PDFs are read on this device, even offline';
  }catch(e){ b.hidden=true; }
}
if($('#omrBtn')) $('#omrBtn').onclick=async()=>{
  if($('#omrBtn').dataset.ready){ setStatus('Offline reading is ready: drop in a photo, screenshot or PDF of sheet music, even without internet.'); return; }
  if(await ensureOmr(false)) setStatus('Offline reading is ready: photos, screenshots and PDFs are now read on this device, even without internet.');
};

/* ---------- offline import: MusicXML (.musicxml/.xml/.mxl) and MIDI ---------- */
// Both are turned into ABC notation on this device, so the rest of the app works unchanged.
const SHARP_ORDER='FCGDAEB', FLAT_ORDER='BEADGCF';
function keyAlters(f){ const m={C:0,D:0,E:0,F:0,G:0,A:0,B:0}; if(f>0) for(let i=0;i<f;i++) m[SHARP_ORDER[i]]=1; else for(let i=0;i<-f;i++) m[FLAT_ORDER[i]]=-1; return m; }
const KEY_MAJ={'-7':'Cb','-6':'Gb','-5':'Db','-4':'Ab','-3':'Eb','-2':'Bb','-1':'F','0':'C','1':'G','2':'D','3':'A','4':'E','5':'B','6':'F#','7':'C#'};
const KEY_MIN={'-7':'Abm','-6':'Ebm','-5':'Bbm','-4':'Fm','-3':'Cm','-2':'Gm','-1':'Dm','0':'Am','1':'Em','2':'Bm','3':'F#m','4':'C#m','5':'G#m','6':'D#m','7':'A#m'};
function abcKey(f,mode){ f=Math.max(-7,Math.min(7,Math.round(f)||0)); return (mode==='minor'?KEY_MIN:KEY_MAJ)[f]; }
function abcPitch(n,bar,keyMap){
  const id=n.step+n.oct, expect=(id in bar)?bar[id]:keyMap[n.step];
  let acc='';
  if(n.alter!==expect){ acc={'-2':'__','-1':'_','0':'=','1':'^','2':'^^'}[n.alter]||''; bar[id]=n.alter; }
  return acc+(n.oct>=5 ? n.step.toLowerCase()+"'".repeat(n.oct-5) : n.step+",".repeat(Math.max(0,4-n.oct)));
}
function gcdN(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
function lcmN(a,b){ return a/gcdN(a,b)*b; }
const cleanTitle=s=>String(s||'').replace(/[\r\n]+/g,' ').trim();

// Render voices -> ABC. voices: [{id, name, clef, bars:[[token...]]}], token: {kind:'note'|'rest'|'space'|'raw', notes, len, tie, pre}
function renderAbc({title,composer,meter,unitDen,tempo,key,score,voices,barCount,barMeta}){
  let g=0;
  voices.forEach(v=>v.bars.forEach(b=>b&&b.forEach(t=>{ if(t.len) g=gcdN(g,t.len); })));
  g=gcdN(g||1,unitDen);
  const L=unitDen/g; // lengths are in 1/unitDen of a whole note
  const head=['X:1','T:'+(cleanTitle(title)||'Untitled')];
  if(composer) head.push('C:'+cleanTitle(composer));
  head.push('M:'+meter, (Number.isInteger(L)?'L:1/'+L:'L:1/'+unitDen), 'Q:1/4='+Math.round(tempo||100));
  if(voices.length>1) head.push('%%score '+score);
  voices.forEach(v=>head.push(`V:${v.id} clef=${v.clef}${v.name?` name="${v.name.replace(/"/g,'')}"`:''}`));
  head.push('K:'+key);
  const div=Number.isInteger(L)?g:1;
  const out=[...head];
  for(let start=0;start<barCount;start+=4){
    voices.forEach(v=>{
      let line=voices.length>1?`[V:${v.id}] `:'';
      for(let b=start;b<Math.min(barCount,start+4);b++){
        const meta=barMeta[b]||{}; let s='';
        if(b>0&&meta.key) s+=`[K:${meta.key}] `;
        if(b>0&&meta.meter) s+=`[M:${meta.meter}] `;
        s+=(v.bars[b]||[]).map(t=>{
          if(t.kind==='raw') return t.text;
          const n=t.len/div, len=n===1?'':String(n);
          return (t.pre||'')+t.body+len+(t.tie?'-':'');
        }).join(' ');
        line+=s+(b===barCount-1?' |]':' | ');
      }
      out.push(line.trim());
    });
  }
  return out.join('\n');
}

/* MusicXML */
function musicXmlToAbc(xmlText){
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  if(doc.querySelector('parsererror')) throw new Error('This MusicXML file could not be read. It may be damaged.');
  const root=doc.documentElement;
  if(root.nodeName==='score-timewise') throw new Error('This MusicXML uses the "timewise" layout. Export it again as standard MusicXML.');
  if(root.nodeName!=='score-partwise') throw new Error('This is not a MusicXML score.');
  const kids=(el,name)=>[...el.children].filter(c=>c.nodeName===name);
  const kid=(el,name)=>[...el.children].find(c=>c.nodeName===name);
  const txt=(el,sel)=>{ const e=el&&el.querySelector(sel); return e?e.textContent.trim():''; };
  const title=txt(root,'work > work-title')||txt(root,'movement-title')||txt(root,'credit-words')||'Untitled';
  const composer=txt(root,'identification > creator[type="composer"]');
  const partNames={}; root.querySelectorAll('part-list > score-part').forEach(sp=>partNames[sp.getAttribute('id')]=txt(sp,'part-name'));
  const parts=kids(root,'part').slice(0,4);
  if(!parts.length) throw new Error('This MusicXML file has no music in it.');
  // common tick unit for all parts
  let TPQ=1; root.querySelectorAll('divisions').forEach(d=>{ const v=parseInt(d.textContent,10); if(v>0&&v<100000) TPQ=lcmN(TPQ,v); });
  if(TPQ>100000) TPQ=100000;
  let tempo=null, firstKey=null, firstMeter=null;
  const barMeta=[], barLen=[], voiceMap=new Map(), order=[];
  parts.forEach((part,pi)=>{
    let scale=TPQ, beats=4, beatType=4; const clefs={};
    kids(part,'measure').forEach((m,mi)=>{
      let cursor=0, maxC=0; const last={};
      for(const el of m.children){
        if(el.nodeName==='attributes'){
          const dv=txt(el,'divisions'); if(dv) scale=TPQ/parseInt(dv,10);
          const k=kid(el,'key'); if(k){ const f=parseInt(txt(k,'fifths')||'0',10), md=txt(k,'mode')||'major', ks=abcKey(f,md);
            if(pi===0){ if(!firstKey) firstKey={f,ks}; else if(mi>0){ (barMeta[mi]=barMeta[mi]||{}).key=ks; (barMeta[mi]).fifths=f; } } }
          const t=kid(el,'time'); if(t){ beats=parseInt(txt(t,'beats'),10)||4; beatType=parseInt(txt(t,'beat-type'),10)||4;
            if(pi===0){ if(!firstMeter) firstMeter=beats+'/'+beatType; else if(mi>0) (barMeta[mi]=barMeta[mi]||{}).meter=beats+'/'+beatType; } }
          kids(el,'clef').forEach(c=>{ const s=txt(c,'sign'); clefs[c.getAttribute('number')||'1']= s==='F'?'bass':s==='C'?'alto':'treble'; });
        } else if(el.nodeName==='direction'||el.nodeName==='sound'){
          const snd=el.nodeName==='sound'?el:el.querySelector('sound');
          if(tempo==null&&snd&&snd.getAttribute('tempo')) tempo=parseFloat(snd.getAttribute('tempo'));
          if(tempo==null){ const pm=txt(el,'metronome per-minute'), bu=txt(el,'metronome beat-unit'); if(pm&&(!bu||bu==='quarter')) tempo=parseFloat(pm); }
        } else if(el.nodeName==='backup'){ cursor-=Math.round(parseInt(txt(el,'duration')||'0',10)*scale); if(cursor<0) cursor=0; }
        else if(el.nodeName==='forward'){ cursor+=Math.round(parseInt(txt(el,'duration')||'0',10)*scale); maxC=Math.max(maxC,cursor); }
        else if(el.nodeName==='note'){
          if(kid(el,'grace')||kid(el,'cue')) continue;
          const dur=Math.round(parseInt(txt(el,'duration')||'0',10)*scale);
          const staff=txt(el,'staff')||'1', voice=txt(el,'voice')||'1', key=pi+':'+staff+':'+voice;
          if(!voiceMap.has(key)){ voiceMap.set(key,{key,pi,staff,voice,clef:clefs[staff]||'treble',bars:[],notes:0}); order.push(key); }
          const v=voiceMap.get(key), evs=(v.bars[mi]=v.bars[mi]||[]);
          const pe=kid(el,'pitch');
          const pitch=pe?{step:txt(pe,'step'),alter:Math.round(parseFloat(txt(pe,'alter')||'0')),oct:parseInt(txt(pe,'octave'),10)}:null;
          const tie=!!el.querySelector(':scope > tie[type="start"], notations > tied[type="start"]');
          if(kid(el,'chord')&&last[key]&&pitch){ last[key].notes.push(pitch); if(tie) last[key].tie=true; continue; }
          const tm=kid(el,'time-modification');
          const ev={pos:cursor,dur,notes:pitch?[pitch]:[],tie,
            tm:tm?[parseInt(txt(tm,'actual-notes'),10)||3,parseInt(txt(tm,'normal-notes'),10)||2]:null,
            tStart:!!el.querySelector('notations > tuplet[type="start"]'),tStop:!!el.querySelector('notations > tuplet[type="stop"]')};
          if(pitch) v.notes++;
          evs.push(ev); last[key]=ev; cursor+=dur; maxC=Math.max(maxC,cursor);
        }
      }
      const nominal=Math.round(beats*(4/beatType)*TPQ);
      const len=m.getAttribute('implicit')==='yes'?maxC:Math.max(nominal,maxC);
      barLen[mi]=Math.max(barLen[mi]||0,len);
    });
  });
  // keep voices that have notes, plus one voice per staff that has none
  const staffHas={}; order.forEach(k=>{ const v=voiceMap.get(k); const s=v.pi+':'+v.staff; if(v.notes) staffHas[s]=true; });
  const seenStaff={};
  const kept=order.map(k=>voiceMap.get(k)).filter(v=>{ const s=v.pi+':'+v.staff; if(v.notes) return true; if(staffHas[s]||seenStaff[s]) return false; seenStaff[s]=true; return true; })
    .sort((a,b)=>a.pi-b.pi||a.staff-b.staff||a.voice-b.voice).slice(0,8);
  if(!kept.some(v=>v.notes)) throw new Error('No notes were found in this MusicXML file.');
  const barCount=barLen.length;
  let fifths=firstKey?firstKey.f:0;
  const keyAt=[]; for(let b=0;b<barCount;b++){ if(barMeta[b]&&barMeta[b].fifths!=null) fifths=barMeta[b].fifths; keyAt[b]=keyAlters(fifths); }
  const voices=kept.map((v,i)=>{
    const id=i+1, bars=[];
    for(let b=0;b<barCount;b++){
      const evs=(v.bars[b]||[]).slice().sort((x,y)=>x.pos-y.pos), toks=[], bar={}; let t=0;
      for(let i2=0;i2<evs.length;i2++){
        const ev=evs[i2];
        if(ev.pos>t) toks.push({kind:'rest',body:'x',len:ev.pos-t});
        let start=Math.max(ev.pos,t), dur=ev.dur-(start-ev.pos); if(dur<=0) continue;
        let pre='', len=dur;
        if(ev.tm&&ev.tStart){
          let cnt=0; for(let j=i2;j<evs.length;j++){ cnt++; if(evs[j].tStop) break; }
          pre=`(${ev.tm[0]}:${ev.tm[1]}:${cnt}`;
        }
        if(ev.tm){ const w=dur*ev.tm[0]/ev.tm[1]; if(Number.isInteger(w)) len=w; else pre=''; }
        const body=ev.notes.length? (ev.notes.length>1?'['+ev.notes.map(n=>abcPitch(n,bar,keyAt[b])).join('')+']':abcPitch(ev.notes[0],bar,keyAt[b])) : 'z';
        toks.push({kind:ev.notes.length?'note':'rest',body,len,tie:ev.tie&&ev.notes.length>0,pre});
        t=start+dur;
      }
      if(t<barLen[b]) toks.push({kind:'rest',body:'x',len:barLen[b]-t});
      bars.push(toks);
    }
    return {id,clef:v.clef,name:'',bars,pi:v.pi,staff:v.staff};
  });
  // %%score grouping: voices on one staff in ( ), staves of one part in { }
  const score=[...new Set(voices.map(v=>v.pi))].map(pi=>{
    const vs=voices.filter(v=>v.pi===pi), staves=[...new Set(vs.map(v=>v.staff))];
    const grp=staves.map(s=>{ const ids=vs.filter(v=>v.staff===s).map(v=>v.id); return ids.length>1?'('+ids.join(' ')+')':String(ids[0]); });
    return staves.length>1?'{'+grp.join(' ')+'}':grp.join(' ');
  }).join(' ');
  if(parts.length===1&&partNames[parts[0].getAttribute('id')]) {} // single instrument: no voice names needed
  return renderAbc({title,composer,meter:firstMeter||'4/4',unitDen:4*TPQ,tempo,key:firstKey?firstKey.ks:'C',score,voices,barCount,barMeta});
}

/* Compressed MusicXML (.mxl is a zip file) */
async function unzipMusicXml(buf){
  const d=new DataView(buf), u8=new Uint8Array(buf);
  let e=-1; for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--) if(d.getUint32(i,true)===0x06054b50){ e=i; break; }
  if(e<0) throw new Error('This .mxl file is damaged.');
  const count=d.getUint16(e+10,true); let p=d.getUint32(e+16,true); const files={};
  for(let i=0;i<count;i++){
    if(d.getUint32(p,true)!==0x02014b50) break;
    const method=d.getUint16(p+10,true), csize=d.getUint32(p+20,true), nl=d.getUint16(p+28,true), xl=d.getUint16(p+30,true), cl=d.getUint16(p+32,true), off=d.getUint32(p+42,true);
    files[new TextDecoder().decode(u8.subarray(p+46,p+46+nl))]={method,csize,off}; p+=46+nl+xl+cl;
  }
  const read=async f=>{
    const start=f.off+30+d.getUint16(f.off+26,true)+d.getUint16(f.off+28,true), data=u8.slice(start,start+f.csize);
    if(f.method===0) return new TextDecoder().decode(data);
    if(f.method!==8) throw new Error('This .mxl file uses an unsupported compression.');
    if(typeof DecompressionStream==='undefined') throw new Error('This browser cannot open .mxl files. Export the score as uncompressed MusicXML (.musicxml) instead.');
    return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
  let target=null;
  if(files['META-INF/container.xml']){ const m=(await read(files['META-INF/container.xml'])).match(/full-path="([^"]+)"/); if(m&&files[m[1]]) target=m[1]; }
  if(!target) target=Object.keys(files).find(k=>!k.startsWith('META-INF')&&/\.(xml|musicxml)$/i.test(k));
  if(!target) throw new Error('No score was found inside this .mxl file.');
  return read(files[target]);
}

/* MIDI */
function midiToAbc(buf, fileName){
  const d=new DataView(buf); let p=0;
  const str=n=>{ let s=''; for(let i=0;i<n;i++) s+=String.fromCharCode(d.getUint8(p+i)); p+=n; return s; };
  if(buf.byteLength<14||str(4)!=='MThd') throw new Error('This is not a MIDI file.');
  const hl=d.getUint32(p); p+=4; const ntr=d.getUint16(p+2), div=d.getUint16(p+4); p+=hl;
  if(div&0x8000) throw new Error('This MIDI file uses a timing format that is not supported.');
  const notes=[]; let tempo=null, ts=null, ks=null, trackName='';
  for(let t=0;t<ntr&&p+8<=d.byteLength;t++){
    const id=str(4), len=d.getUint32(p); p+=4; const end=Math.min(d.byteLength,p+len);
    if(id!=='MTrk'){ p=end; continue; }
    let tick=0, status=0; const on={};
    const vlq=()=>{ let v=0,b; do{ b=d.getUint8(p++); v=(v*128)+(b&0x7f); }while(b&0x80&&p<end); return v; };
    try{
      while(p<end){
        tick+=vlq(); let b=d.getUint8(p);
        if(b&0x80){ status=b; p++; }
        if(status===0xff){ const mt=d.getUint8(p++), ml=vlq();
          if(mt===0x51&&tempo==null) tempo=60000000/((d.getUint8(p)<<16)|(d.getUint8(p+1)<<8)|d.getUint8(p+2));
          else if(mt===0x58&&!ts) ts=[d.getUint8(p),Math.pow(2,d.getUint8(p+1))];
          else if(mt===0x59&&!ks) ks=[d.getInt8(p),d.getUint8(p+1)];
          else if((mt===0x03||mt===0x01)&&!trackName&&t===0) trackName=new TextDecoder().decode(new Uint8Array(buf,p,ml)).trim();
          p+=ml; if(mt===0x2f) break; continue; }
        if(status===0xf0||status===0xf7){ p+=vlq(); continue; }
        const type=status&0xf0, ch=status&0x0f;
        if(type===0x90||type===0x80){ const n=d.getUint8(p), v=d.getUint8(p+1); p+=2; const k=ch*128+n;
          if(type===0x90&&v>0) (on[k]=on[k]||[]).push(tick);
          else { const s=on[k]&&on[k].shift(); if(s!=null&&ch!==9) notes.push({midi:n,start:s,end:tick,track:t}); }
          continue; }
        p+= (type===0xc0||type===0xd0)?1:2;
      }
    }catch(e){ /* truncated track: keep what was read */ }
    p=end;
  }
  if(!notes.length) throw new Error('No playable notes were found in this MIDI file.');
  // quantize to a sixteenth-note grid
  const grid=div/4, q=t=>Math.round(t/grid);
  notes.forEach(n=>{ n.s=q(n.start); n.e=Math.max(n.s+1,q(n.end)); });
  const [num,den]=ts||[4,4]; let bar=num*16/den; if(!Number.isInteger(bar)||bar<=0) bar=16;
  const offset=Math.floor(Math.min(...notes.map(n=>n.s))/bar)*bar;
  notes.forEach(n=>{ n.s-=offset; n.e-=offset; });
  // split into right hand / left hand
  const tracks=[...new Set(notes.map(n=>n.track))];
  let hands;
  if(tracks.length===2){
    const avg=t=>{ const ns=notes.filter(n=>n.track===t); return ns.reduce((a,n)=>a+n.midi,0)/ns.length; };
    const hi=avg(tracks[0])>=avg(tracks[1])?tracks[0]:tracks[1];
    hands=[notes.filter(n=>n.track===hi),notes.filter(n=>n.track!==hi)];
  } else hands=[notes.filter(n=>n.midi>=60),notes.filter(n=>n.midi<60)];
  hands=hands.map((h,i)=>({notes:h,clef:i===0?'treble':'bass'})).filter(h=>h.notes.length);
  const fifths=ks?ks[0]:0, minor=ks?ks[1]===1:false, flat=fifths<0;
  const SPELL_S=[['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
  const SPELL_F=[['C',0],['D',-1],['D',0],['E',-1],['E',0],['F',0],['G',-1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
  const spell=m=>{ const [step,alter]=(flat?SPELL_F:SPELL_S)[m%12]; return {step,alter,oct:Math.floor(m/12)-1}; };
  const keyMap=keyAlters(fifths);
  const STD=[16,12,8,6,4,3,2,1]; // whole, dotted half, half, dotted quarter, quarter, dotted eighth, eighth, sixteenth
  const pieces=n=>{ const out=[]; for(const s of STD) while(n>=s){ out.push(s); n-=s; } return out; };
  const lastEnd=Math.max(...notes.map(n=>n.e)), barCount=Math.max(1,Math.ceil(lastEnd/bar));
  const voices=hands.map((h,hi)=>{
    // segments: chords at each onset, cut off by the next onset
    const byStart=new Map(); h.notes.forEach(n=>{ (byStart.get(n.s)||byStart.set(n.s,[]).get(n.s)).push(n); });
    const starts=[...byStart.keys()].sort((a,b)=>a-b), segs=[];
    starts.forEach((s,i)=>{ const ns=byStart.get(s), next=i+1<starts.length?starts[i+1]:Infinity;
      const e=Math.min(next,Math.max(...ns.map(n=>n.e)));
      segs.push({s,e,midis:[...new Set(ns.map(n=>n.midi))].sort((a,b)=>a-b)}); });
    const bars=Array.from({length:barCount},()=>[]), barAcc=Array.from({length:barCount},()=>({}));
    let t=0;
    const emit=(s,e,midis)=>{ // split at bar lines and into standard lengths, tying notes across the pieces
      while(s<e){
        const b=Math.floor(s/bar), stop=Math.min(e,(b+1)*bar), ps=pieces(stop-s);
        ps.forEach((len,i)=>{
          const last=(i===ps.length-1)&&stop>=e;
          const body=midis? (midis.length>1?'['+midis.map(m=>abcPitch(spell(m),barAcc[b],keyMap)).join('')+']':abcPitch(spell(midis[0]),barAcc[b],keyMap)) : 'z';
          bars[b].push({kind:midis?'note':'rest',body,len,tie:!!midis&&!last});
        });
        s=stop;
      }
    };
    segs.forEach(sg=>{ if(sg.s>t) emit(t,sg.s,null); emit(sg.s,sg.e,sg.midis); t=sg.e; });
    if(t<barCount*bar) emit(t,barCount*bar,null);
    return {id:hi+1,clef:h.clef,name:'',bars};
  });
  const title=(fileName||'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()||trackName||'MIDI song';
  return renderAbc({title,composer:'',meter:num+'/'+den,unitDen:16,tempo:tempo||100,key:abcKey(fifths,minor?'minor':'major'),
    score:voices.length>1?'{'+voices.map(v=>v.id).join(' ')+'}':'1',voices,barCount,barMeta:[]});
}

async function importLocal(make, label){
  try{
    const abc=await make();
    loadAbc(abc); saveSong(abc); showView('score');
    setStatus(`Opened ${esc(label)} on this device, no internet needed. Saved to My songs.`);
  }catch(e){ setStatus(esc(e.message||'This file could not be opened.'),'err'); }
}

/* ---------- offline copy ---------- */
async function exportOffline(){
  const btn=$('#offlineBtn'); btn.disabled=true;
  try{
    const [lib,app,piano]=await Promise.all(['abcjs-basic-min.js','app.js','piano.json'].map(f=>fetch(f).then(r=>{ if(!r.ok) throw new Error(f); return r.text(); })));
    const css=$('#smc-css').textContent, safe=t=>t.replace(/<\/script/gi,'<\\/script');
    const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Musisc (offline)</title><style>'+css+'</style></head><body>'
      +APP_HTML+'<script>'+safe(lib)+'</'+'script><script>window.SMC_OFFLINE='+safe(JSON.stringify(songs()))+';window.SMC_PIANO='+piano+';</'+'script><script>'+safe(app)+'</'+'script></body></html>';
    const name='Musisc (offline).html';
    if(downloadsCap) await downloadsCap.save({filename:name,data:new Blob([html],{type:'text/html'})});
    else { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([html],{type:'text/html'})); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
    const n=songs().length;
    setStatus(`Offline copy saved${n?` with ${n} of your song${n>1?'s':''}`:''}. Open the file in any browser, no internet needed. Make a new copy after you add songs.`);
  }catch(e){
    if(e&&e.code==='declined') setStatus('');
    else setStatus('Could not make the offline copy. Try again in a moment.','err');
  }finally{ btn.disabled=false; }
}
$('#offlineBtn').onclick=exportOffline;

/* ---------- boot ---------- */
try{ if(localStorage.getItem('smc.roll')==='0') setRoll(false); if(localStorage.getItem('smc.piano')==='0') setPiano(false); }catch(e){}
addEventListener('pointerdown',()=>audio(),{once:true,capture:true}); // start loading the piano on first touch
addEventListener('keydown',()=>audio(),{once:true,capture:true});
if(OFFLINE){
  // merge the songs carried inside this file into this browser's library
  const have=getSongs(), ids=new Set(have.map(s=>s.id));
  putSongs(have.concat(window.SMC_OFFLINE.filter(s=>!ids.has(s.id))));
  $('#offlineBtn').hidden=true;
  $('#intakeHint').textContent='Offline copy: your saved songs, lessons and demo work without internet, and MusicXML, MIDI and ABC files open here too. Reading photos and PDFs needs the online version.';
}
const startSong=OFFLINE&&songs()[0];
if(startSong){ loadAbc(startSong.abc); currentSong='m:'+startSong.id; } else { loadAbc(SAMPLES.ode); currentSong='s:ode'; }
fillSongs();
requestAnimationFrame(()=>{ measureKeys(); rollLoop(); });
(async()=>{
  if(OFFLINE||!(window.claude&&window.claude.use)){
    if(OMR_HERE){ $('#intakeHint').textContent='Drop a photo, screenshot or PDF of sheet music anywhere on this page, or press Ctrl+V. It is read on this device, even offline. MusicXML and MIDI files open instantly.'; updateOmrBtn(); return; }
    if(!OFFLINE) $('#intakeHint').innerHTML='To read photos and PDFs, use the <a href="https://claude.ai/artifact/LdkHDji7A11UdAEjTqhjWy" target="_blank" rel="noopener">claude.ai version</a>. Here you can open your saved songs, the samples, and MusicXML, MIDI or ABC files, even offline.';
    return;
  }
  try{
    [sampleFn,downloadsCap]=await Promise.all([window.claude.use('sample'),window.claude.use('downloads')]);
    const lim=sampleFn?await sampleFn.limits().catch(()=>null):null;
    imgLimits=(lim&&lim.images)||null;
    if(!imgLimits) $('#intakeHint').textContent='Reading photos is unavailable here. Open ABC notation or MusicXML, or pick a song.';
  }catch(e){ sampleFn=null; }
})();
