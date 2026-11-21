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
let pianoBuf={}, pianoState='idle';
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
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  audio();
  try{ // play one silent sample inside the gesture: older iOS needs it to really start
    const s=ctx.createBufferSource(); s.buffer=ctx.createBuffer(1,1,22050); s.connect(ctx.destination); s.start(0);
  }catch(e){}
  if(!silentEl){
    silentEl=document.createElement('audio'); silentEl.setAttribute('playsinline',''); silentEl.setAttribute('x-webkit-airplay','deny');
    silentEl.preload='auto'; silentEl.loop=false; silentEl.src=silentWav();
  }
  const p=silentEl.play(); if(p&&p.catch) p.catch(()=>{});
  if(ctx.state==='running') unlocked=true;
}
['touchend','click','pointerup','keydown'].forEach(ev=>addEventListener(ev,()=>{ if(!unlocked||!ctx||ctx.state!=='running') unlockAudio(); },{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&ctx&&ctx.state!=='running') ctx.resume().catch(()=>{}); });
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
function tone(midi, when, dur, dest, vel=.6){
  const end=when+Math.max(.12,dur), out=dest||master;
  const g=ctx.createGain(); g.connect(out);
  const near=Math.min(108,Math.max(21,Math.round(midi/3)*3)), buf=pianoState==='ready'&&pianoBuf[near];
  if(buf){
    const src=ctx.createBufferSource(); src.buffer=buf; src.playbackRate.value=Math.pow(2,(midi-near)/12);
    src.connect(g);
    g.gain.setValueAtTime(vel,when);
    g.gain.setTargetAtTime(0,end,.11);          // damper: smooth release, no click
    src.start(when); src.stop(end+1.2);
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
function hear(midis, dur=.7){ audio(); midis.forEach(m=>tone(m,ctx.currentTime+.02,dur)); }

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

function loadAbc(abc){
  stopDemo();
  const out=ABCJS.renderAbc('score', abc, {add_classes:true, responsive:'resize', staffwidth:760,
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
  const m=+k.dataset.midi; hear([m],.9); onKeyPlayed(m);
});

function onKeyPlayed(m){
  if(play) return;
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

function highlight(ev){
  document.querySelectorAll('#score .hl').forEach(e=>e.classList.remove('hl'));
  ev.els.forEach(e=>e&&e.classList&&e.classList.add('hl'));
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
  renderLesson(ev);
  lightKeys(ev.pitches.map(p=>p.midi));
  if(!play) rollTarget=ev.ms+1;
  if(!play){ $('#feedback').textContent=''; $('#feedback').className='feedback'; }
  if(sound&&ev.pitches.length) hear(ev.pitches.map(p=>p.midi), Math.min(1.4,Math.max(.4,ev.pitches[0].ms/1000)));
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
function setSpeed(f, from){
  speedF=Math.max(.05,Math.min(10,f));
  if(from!=='slider') $('#speed').value=String(Math.round(Math.max(40,Math.min(150,speedF*100))/5)*5);
  $('#speedOut').textContent=Math.round(speedF*100)+'%';
  if(from!=='bpm') $('#bpmIn').value=String(Math.round(tuneBpm*speedF));
  if(play&&from!=='load'){ const i=Math.max(play.idx,0); startDemo(i); }
}
function startDemo(from=firstNoteIndex()){
  if(!events.length) return;
  stopDemo(); audio();
  const sp=speed(), bus=ctx.createGain(); bus.connect(master);
  const t0=ctx.currentTime+.15, base=events[from].ms;
  for(let i=from;i<events.length;i++){
    const ev=events[i], at=t0+(ev.ms-base)/1000/sp;
    ev.pitches.forEach(p=>tone(p.midi,at,Math.max(.1,p.ms/1000/sp-.02),bus,.35+.4*(p.vol/127)));
  }
  const last=events[events.length-1];
  const endT=t0+((last.ms-base)+last.gap)/1000/sp+.3;
  play={bus,t0,base,sp,idx:from-1,endT,raf:0};
  $('#lessonMode').textContent='Demo: follow along';
  setPlayBtn(true);
  const tick=()=>{
    if(!play) return;
    const now=ctx.currentTime;
    if(now>=play.endT){ stopDemo(); return; }
    const ms=(now-play.t0)*1000*play.sp+play.base;
    rollHead=rollTarget=Math.max(play.base,ms);
    let j=play.idx;
    while(j+1<events.length&&events[j+1].ms<=ms) j++;
    if(j!==play.idx&&j>=from){ play.idx=j; goTo(j,false); }
    play.raf=requestAnimationFrame(tick);
  };
  play.raf=requestAnimationFrame(tick);
}
function stopDemo(){
  if(!play) return;
  cancelAnimationFrame(play.raf);
  const b=play.bus; try{ b.gain.setTargetAtTime(0,ctx.currentTime,.03); setTimeout(()=>b.disconnect(),300);}catch(e){}
  play=null; setPlayBtn(false);
  $('#lessonMode').textContent='Learn note by note';
}
function setPlayBtn(on){
  $('#playBtn').innerHTML= on ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg><span>Stop</span>'
                              : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg><span>Play demo</span>';
}
$('#playBtn').onclick=()=> play?stopDemo():startDemo();
$('#fromHereBtn').onclick=()=> startDemo(cur);
$('#speed').oninput=()=>setSpeed(+$('#speed').value/100,'slider');
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
async function handleImage(file){
  if(!file.type.startsWith('image/')){ setStatus('Please use an image (JPG, PNG, WebP or GIF). For a PDF, take a screenshot of the page.','err'); return; }
  const url=URL.createObjectURL(file);
  $('#orig').innerHTML=`<img alt="Your original sheet music" src="${url}">`; $('#tab-orig').hidden=false;
  const text=await askClaude(PROMPT,{images:[file]},'Reading your sheet music… this can take up to a minute');
  finishAbc(text);
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
$('#fileIn').onchange=e=>{ handleFile(e.target.files[0]); e.target.value=''; };
$('#camIn').onchange=e=>{ handleFile(e.target.files[0]); e.target.value=''; };
$('#pasteBtn').onclick=()=>setStatus('Copy an image of sheet music (or ABC text), then press Ctrl+V here. On a phone, long-press the Notation box and choose Paste.');
document.addEventListener('paste',e=>{
  if(e.target.closest('textarea,input')) return;
  const items=[...(e.clipboardData?.items||[])];
  const img=items.find(i=>i.type.startsWith('image/'));
  if(img){ e.preventDefault(); handleImage(img.getAsFile()); return; }
  const t=e.clipboardData?.getData('text'); if(t){ e.preventDefault(); handleText(t); }
});
let dragDepth=0;
addEventListener('dragenter',e=>{ if([...e.dataTransfer.types].includes('Files')){dragDepth++; $('#dropOv').hidden=false;} });
addEventListener('dragleave',()=>{ if(--dragDepth<=0){dragDepth=0;$('#dropOv').hidden=true;} });
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{
  e.preventDefault(); dragDepth=0; $('#dropOv').hidden=true;
  const f=e.dataTransfer.files[0]; if(f) return handleFile(f);
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

/* ---------- online search: three free, legal libraries ----------
   Mutopia Project piano scores (public domain / Creative Commons MIDI, mirrored on the Musisc site),
   Wikimedia Commons MIDI files (searched live), and The Session folk tunes (ABC, searched live). */
const TS='https://thesession.org', WM='https://commons.wikimedia.org/w/api.php';
const LIB=(/github\.io$/.test(location.hostname)||location.protocol==='http:')?'library/':'https://al3nafk.github.io/musisc/library/';
const TS_METER={reel:'4/4',hornpipe:'4/4',barndance:'4/4',strathspey:'4/4',march:'4/4',jig:'6/8','slip jig':'9/8',slide:'12/8',polka:'2/4',waltz:'3/4',mazurka:'3/4','three-two':'3/2'};
const TS_MODE={major:'maj',minor:'min',dorian:'dor',mixolydian:'mix',lydian:'lyd',phrygian:'phr',locrian:'loc'};
const PER=12;
let findQ='', findGen=0, mutopia=null;
function findFoot(){
  const q=$('#findIn').value.trim();
  const imslp='https://imslp.org/index.php?title=Special:Search&search='+encodeURIComponent(q||'piano');
  $('#findFoot').innerHTML=navigator.onLine
    ? `Searches <a href="https://www.mutopiaproject.org" target="_blank" rel="noopener">Mutopia</a> piano scores, <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a> and <a href="${TS}" target="_blank" rel="noopener">The Session</a>: about 28,000 free pieces. Still not there? <a href="${imslp}" target="_blank" rel="noopener">Search IMSLP</a> and drop the PDF in.`
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
      if(!mutopia){ const r=await fetch(LIB+'mutopia.json'); if(!r.ok) throw new Error('HTTP '+r.status); mutopia=await r.json(); mutopia.forEach(m=>m._k=fold([m.t,m.by,m.o,m.i,m.s].join(' '))); }
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
  const base='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  if(!window.pdfjsLib) await loadScript(base+'pdf.min.js');
  if(!window.pdfjsWorker) await loadScript(base+'pdf.worker.min.js'); // runs the PDF engine on the page itself
  return window.pdfjsLib;
}
async function handlePdf(file){
  if(!sampleFn||!imgLimits){ setStatus(OFFLINE?'Reading PDFs needs internet. Open the online Musisc on claude.ai to read it, then make a new offline copy.':'Reading PDFs needs the app opened on claude.ai.','err'); return; }
  setStatus('<span class="spin"></span><span>Opening your PDF…</span>');
  let lib;
  try{ lib=await pdfLib(); }catch(e){ setStatus('Could not load the PDF reader. Check your internet connection and try again.','err'); return; }
  try{
    const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
    const max=Math.min(pdf.numPages, imgLimits.maxCount||4, 6);
    const blobs=[], urls=[];
    for(let i=1;i<=max;i++){
      setStatus(`<span class="spin"></span><span>Preparing page ${i} of ${max}…</span>`);
      const page=await pdf.getPage(i), base=page.getViewport({scale:1});
      const vp=page.getViewport({scale:Math.min(3,1800/base.width)});
      const c=document.createElement('canvas'); c.width=Math.round(vp.width); c.height=Math.round(vp.height);
      const cx=c.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,c.width,c.height);
      await page.render({canvasContext:cx,viewport:vp}).promise;
      const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.92)); blobs.push(b); urls.push(URL.createObjectURL(b));
    }
    $('#orig').innerHTML=urls.map((u,i)=>`<img alt="Page ${i+1} of your PDF" src="${u}" style="margin-bottom:12px">`).join('');
    $('#tab-orig').hidden=false;
    const note=pdf.numPages>max?` Only the first ${max} of ${pdf.numPages} pages are read.`:'';
    const prompt=(blobs.length>1?`The ${blobs.length} images are consecutive pages of one piece, in order. Transcribe them as one continuous tune.\n`:'')+PROMPT;
    const text=await askClaude(prompt,{images:blobs},`Reading ${blobs.length>1?blobs.length+' pages':'your PDF'}… this can take a minute or two.${note}`);
    finishAbc(text);
  }catch(e){ setStatus('That PDF could not be opened. If it is password-protected, remove the password or take a screenshot of the page instead.','err'); }
}

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
