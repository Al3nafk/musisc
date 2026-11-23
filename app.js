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

/* One sample piece per instrument, written at concert pitch (Musisc shows them at each instrument's
   written pitch). Traditional and public-domain tunes, plus two short exercises written for Musisc.
   Most carry chord symbols, so they also work as lead sheets. */
Object.assign(SAMPLES,{
canon:`X:1
T:Canon in D (theme)
C:after Johann Pachelbel
M:4/4
L:1/4
Q:1/4=72
K:D
"D"f2 "A"e2 | "Bm"d2 "F#m"c2 | "G"B2 "D"A2 | "G"B2 "A"c2 |
"D"d A "A"c e | "Bm"d F "F#m"A c | "G"B G "D"F A | "G"G B "A"A c |
"D"f2 "A"e2 | "Bm"d2 "F#m"c2 | "G"B2 "D"A2 | "G"B2 "A"c2 | "D"d4 |]`,
greensleeves:`X:1
T:Greensleeves
C:Traditional (English)
M:6/8
L:1/8
Q:3/8=60
K:Am
A, | "Am"C2 D "C"E>FE | "G"D2 B, "Em"G,>A,B, | "Am"C2 A, "F"A,>^G,A, | "E"B,2 ^G, E,2 A, |
"Am"C2 D "C"E>FE | "G"D2 B, "Em"G,>A,B, | "Am"C>B,A, "E"^G,>^F,G, | "Am"A,3 A,2 |]`,
mountainking:`X:1
T:In the Hall of the Mountain King (riff)
C:after Edvard Grieg
M:4/4
L:1/8
Q:1/4=110
K:Em
"Em"E, F, G, A, B, G, B,2 | "B7"^A, F, ^A,2 "Am"=A, F, A,2 | "Em"E, F, G, A, B, G, B, E | "B7"D B, G, B, "Em"D4 |
"Em"E, F, G, A, B, G, B,2 | "B7"^A, F, ^A,2 "Am"=A, F, A,2 | "Em"E, F, G, A, B, G, B, E | "B7"D B, G, B, "Em"E4 |]`,
bluesbass:`X:1
T:Walking Blues in A (bass line)
C:Exercise written for Musisc
M:4/4
L:1/4
Q:1/4=100
K:A clef=bass
"A7"A,,, C,, E,, F,, | A,,, C,, E,, F,, | A,,, C,, E,, F,, | A,,, C,, E,, F,, |
"D7"D,, F,, A,, B,, | D,, F,, A,, B,, | "A7"A,,, C,, E,, F,, | A,,, C,, E,, F,, |
"E7"E,, G,, B,, C, | "D7"D,, F,, A,, B,, | "A7"A,,, C,, E,, F,, | "E7"E,, G,, B,, E,, |]`,
jingle:`X:1
T:Jingle Bells (chorus)
C:James Lord Pierpont
M:4/4
L:1/4
Q:1/4=120
K:C
"C"E E E2 | E E E2 | E G C3/2 D/ | E4 |
"F"F F F3/2 F/ | "C"F E E E/E/ | "G7"E D D E | D2 G2 |
"C"E E E2 | E E E2 | E G C3/2 D/ | E4 |
"F"F F F3/2 F/ | "C"F E E E/E/ | "G7"G G F D | "C"C4 |]`,
lightlyrow:`X:1
T:Lightly Row
C:Traditional (German)
M:4/4
L:1/4
Q:1/4=104
K:D
"D"A F F2 | "A7"G E E2 | "D"D E F G | A A A2 |
A F F F | "A7"G E E E | "D"D F A A | D4 |
"A7"E E E E | E F G2 | "D"F F F F | F G A2 |
A F F2 | "A7"G E E2 | "D"D F A A | D4 |]`,
canonbass:`X:1
T:Canon in D (cello part)
C:Johann Pachelbel
M:4/4
L:1/4
Q:1/4=66
K:D clef=bass
"D"D,2 "A"A,,2 | "Bm"B,,2 "F#m"F,,2 | "G"G,,2 "D"D,,2 | "G"G,,2 "A"A,,2 |
"D"D,2 "A"A,,2 | "Bm"B,,2 "F#m"F,,2 | "G"G,,2 "D"D,,2 | "G"G,,2 "A"A,,2 |
"D"D,2 "A"A,,2 | "Bm"B,,2 "F#m"F,,2 | "G"G,,2 "D"D,,2 | "G"G,,2 "A"A,,2 | "D"D,4 |]`,
morningmood:`X:1
T:Morning Mood (theme)
C:after Edvard Grieg
M:6/8
L:1/8
Q:3/8=56
K:C
"C"g e d c d e | g e d c d e | "Am"d e g e g a | "F"e a g e d c |
"C"g e d c d e | g e d c d e | "G"d e g e g a | "C"c'6 |]`,
frere:`X:1
T:Frère Jacques
C:Traditional (French)
M:4/4
L:1/4
Q:1/4=100
K:C
"C"C D E C | C D E C | E F G2 | E F G2 |
G/A/G/F/ E C | G/A/G/F/ E C | C "G"G, "C"C2 | C "G"G, "C"C2 |]`,
amazing:`X:1
T:Amazing Grace
C:Traditional (John Newton, words)
M:3/4
L:1/4
Q:1/4=80
K:Eb
B, | "Eb"E2 G/E/ | G2 F | "Ab"E2 C | "Eb"B,2 B, | E2 G/E/ | G2 F/G/ | "Bb"B3- | B2 G |
"Eb"B2 G/E/ | G2 F | "Ab"E2 C | "Eb"B,2 B, | E2 G/E/ | "Bb"G2 F | "Eb"E3- | E2 |]`,
auldlang:`X:1
T:Auld Lang Syne
C:Traditional (Scottish)
M:4/4
L:1/4
Q:1/4=84
K:Bb
F | "Bb"B3/2 B/ B d | "F7"c3/2 B/ c d | "Bb"B3/2 B/ d f | "Eb"g3 g |
"Bb"f3/2 d/ d B | "F7"c3/2 B/ c d | "Gm"B3/2 G/ "Eb"G F | "Bb"B3 |]`,
saints:`X:1
T:When the Saints Go Marching In
C:Traditional (spiritual)
M:4/4
L:1/4
Q:1/4=112
K:Bb
z B, D E | "Bb"F4 | z B, D E | F4 | z B, D E | F2 D2 | B,2 D2 | "F7"C4 |
z D D C | "Bb"B,3 B, | "Bb7"D2 F2 | "Eb"F E3 | z D E F | "Bb"D2 B,2 | "F7"C2 C2 | "Bb"B,4 |]`,
goinghome:`X:1
T:Goin' Home (Largo theme)
C:after Antonín Dvořák
M:4/4
L:1/4
Q:1/4=60
K:C clef=bass
"C"E, G, G,2 | E, D, C,2 | "G"D, E, G, E, | D,4 |
"C"E, G, G,2 | E, D, C,2 | "G"D, E, D, C, | "C"C,4 |]`,
birthday:`X:1
T:Happy Birthday
C:Mildred and Patty Hill
M:3/4
L:1/8
Q:1/4=100
K:C
G>G | "C"A2 G2 c2 | "G"B4 G>G | A2 G2 d2 | "C"c4 G>G |
w:Hap-py birth-day to you, Hap-py birth-day to you, Hap-py
"F"g2 e2 c2 | B2 A2 f>f | "C"e2 c2 "G"d2 | "C"c4 |]
w:birth-day dear Mu-sisc, Hap-py birth-day to you!`
});
// which instrument each sample is for (the piano ones are listed under Piano)
const SAMPLE_FOR={ode:'piano',ode2:'piano',twinkle:'piano',minuet:'piano',canon:'keys',greensleeves:'guitar',mountainking:'eguitar',bluesbass:'bass',
  jingle:'uke',lightlyrow:'violin',canonbass:'cello',morningmood:'flute',frere:'clarinet',amazing:'asax',auldlang:'tsax',saints:'trumpet',goinghome:'trombone',birthday:'voice'};

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
function tone(midi, when, dur, dest, vel=.6, pedal=false, tb){
  const end=when+Math.max(.12,dur), out=dest||master;
  if(MIC.on&&!dest?.isMicTest) MIC.ignoreUntil=Math.max(MIC.ignoreUntil,end+0.35);
  tb=tb||INST.sound;
  if(tb!=='piano') return instTone(tb,midi,when,end,out,vel);
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

/* ---------- your instrument ----------
   Musisc can coach any band instrument, not only piano. Picking one changes:
   - the sound of the demo and of "Hear it" (synthesised; the piano keeps its recorded samples),
   - the part you learn: piano and keyboard play everything; melody instruments take the tune (the top
     line) and the bass guitar takes the bass line, moved by octaves into the instrument's range, while
     the rest of the score plays softly on piano as backing,
   - the notes you read: transposing instruments (B♭ clarinet, trumpet and tenor sax, E♭ alto sax,
     guitars and bass sounding an octave lower) see the score at their written pitch, and bass-clef
     instruments get a bass clef on one-line music,
   - the lesson wording and the guide under the score: a fretboard (guitar, bass, ukulele), a
     fingerboard (violin, cello), valves (trumpet), slide positions (trombone) or the register to
     play in (flute, clarinet, saxophones, voice). Mic practice listens for your instrument's notes. */
const INSTRUMENTS=[
  {id:'piano',name:'Piano',group:'Keys',part:'both',view:'piano',sound:'piano',transpose:0,range:[21,108]},
  {id:'keys',name:'Keyboard / synth',group:'Keys',part:'both',view:'piano',sound:'epiano',transpose:0,range:[28,103]},
  {id:'guitar',name:'Acoustic guitar',group:'Strings',part:'top',view:'fret',sound:'guitar',transpose:12,range:[40,83],strings:[64,59,55,50,45,40],frets:15,
    note:'Guitar music is written an octave higher than it sounds, so the score shows guitar pitch.'},
  {id:'eguitar',name:'Electric guitar',group:'Strings',part:'top',view:'fret',sound:'eguitar',transpose:12,range:[40,86],strings:[64,59,55,50,45,40],frets:17,
    note:'Guitar music is written an octave higher than it sounds, so the score shows guitar pitch.'},
  {id:'bass',name:'Bass guitar',group:'Strings',part:'bass',view:'fret',sound:'bass',transpose:12,range:[28,67],strings:[43,38,33,28],frets:15,clef:'bass',
    note:'You get the bass line, in bass clef, written an octave higher than it sounds as bass music always is.'},
  {id:'uke',name:'Ukulele',group:'Strings',part:'top',view:'fret',sound:'uke',transpose:0,range:[60,81],strings:[69,64,60,67],frets:12,
    note:'Standard G-C-E-A tuning with the high G string.'},
  {id:'violin',name:'Violin',group:'Strings',part:'top',view:'fret',fretless:true,sound:'violin',transpose:0,range:[55,96],strings:[76,69,62,55],frets:7},
  {id:'cello',name:'Cello',group:'Strings',part:'top',view:'fret',fretless:true,sound:'cello',transpose:0,range:[36,72],strings:[57,50,43,36],frets:7,clef:'bass'},
  {id:'flute',name:'Flute',group:'Woodwind',part:'top',view:'wind',sound:'flute',transpose:0,range:[60,93]},
  {id:'clarinet',name:'Clarinet (B♭)',group:'Woodwind',part:'top',view:'wind',sound:'clarinet',transpose:2,range:[50,86],
    note:'A B♭ clarinet sounds a tone lower than written, so the score is shown a tone higher.'},
  {id:'asax',name:'Alto sax (E♭)',group:'Woodwind',part:'top',view:'wind',sound:'sax',transpose:9,range:[49,80],
    note:'An E♭ alto sax sounds a 6th lower than written, so the score is shown at alto sax pitch.'},
  {id:'tsax',name:'Tenor sax (B♭)',group:'Woodwind',part:'top',view:'wind',sound:'sax',transpose:14,range:[44,75],
    note:'A B♭ tenor sax sounds a 9th lower than written, so the score is shown at tenor sax pitch.'},
  {id:'trumpet',name:'Trumpet (B♭)',group:'Brass',part:'top',view:'valves',sound:'trumpet',transpose:2,range:[52,82],
    note:'A B♭ trumpet sounds a tone lower than written, so the score is shown a tone higher.'},
  {id:'trombone',name:'Trombone',group:'Brass',part:'top',view:'slide',sound:'trombone',transpose:0,range:[40,72],clef:'bass'},
  {id:'voice',name:'Voice (singing)',group:'Voice',part:'top',view:'voice',sound:'voice',transpose:0,range:[53,79]},
];
let INST=INSTRUMENTS[0];
try{ INST=INSTRUMENTS.find(i=>i.id===localStorage.getItem('smc.instrument'))||INSTRUMENTS[0]; }catch(e){}
let partShift=0;

// ---- sounds ----
const ksCache={};
function ksBuffer(midi,kind){ // Karplus-Strong plucked string, rendered once per note and kept
  const key=kind+midi; if(ksCache[key]) return ksCache[key];
  const sr=ctx.sampleRate, f=440*Math.pow(2,(midi-69)/12);
  const len=Math.floor(sr*(kind==='uke'?1.3:kind==='bass'?2.4:2.8)), N=Math.max(2,Math.round(sr/f-.5));
  const buf=ctx.createBuffer(1,len,sr), d=buf.getChannelData(0), ring=new Float32Array(N);
  let lp=0; const soft=kind==='bass'?.45:kind==='guitar'?.25:kind==='uke'?.2:.1;
  for(let i=0;i<N;i++){ lp=lp*soft+(Math.random()*2-1)*(1-soft); ring[i]=lp; }
  const damp=kind==='bass'?.9975:kind==='uke'?.991:kind==='eguitar'?.9985:.996;
  for(let i=0,k=0;i<len;i++){ const a=ring[k], b=ring[(k+1)%N]; d[i]=a; ring[k]=damp*.5*(a+b); k=(k+1)%N; }
  const res={buf, rate:f/(sr/(N+.5))}; ksCache[key]=res; return res;
}
const SYNTH={
  violin:{wave:'sawtooth',lp:f=>Math.min(6000,f*6),q:.8,vib:.006,att:.09,sus:.85,rel:.18,level:.2},
  cello:{wave:'sawtooth',lp:f=>Math.min(3600,f*6),q:.8,vib:.005,att:.11,sus:.85,rel:.26,level:.26},
  flute:{wave:'sine',lp:f=>Math.min(9000,f*4),q:.5,vib:.004,att:.07,sus:.9,rel:.12,level:.42,breath:.05,second:.25},
  clarinet:{wave:'square',lp:f=>Math.min(3200,f*4.5),q:.6,vib:0,att:.04,sus:.92,rel:.1,level:.14},
  sax:{wave:'sawtooth',lp:f=>Math.min(3400,f*4),q:2.2,vib:.004,att:.035,sus:.9,rel:.12,level:.17},
  trumpet:{wave:'sawtooth',lp:f=>Math.min(7000,f*7),q:1.2,vib:.002,att:.03,sus:.9,rel:.1,level:.17,brass:1.3},
  trombone:{wave:'sawtooth',lp:f=>Math.min(3800,f*5),q:1,vib:.002,att:.05,sus:.9,rel:.14,level:.22,brass:1},
  voice:{wave:'sawtooth',lp:f=>4000,q:.5,vib:.007,att:.08,sus:.9,rel:.2,level:.5,formants:[[800,1,6],[1150,.5,8],[2900,.22,10]]},
};
function instTone(tb,midi,when,end,out,vel){
  const f=440*Math.pow(2,(midi-69)/12), g=ctx.createGain(); g.connect(out);
  if(tb==='guitar'||tb==='eguitar'||tb==='bass'||tb==='uke'){
    const ks=ksBuffer(midi,tb), src=ctx.createBufferSource(); src.buffer=ks.buf; src.playbackRate.value=ks.rate;
    let node=src;
    if(tb==='eguitar'){ const sh=ctx.createWaveShaper(), c=new Float32Array(256); for(let i=0;i<256;i++){ const x=i/128-1; c[i]=Math.tanh(x*2.2)/Math.tanh(2.2); } sh.curve=c; const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3600; src.connect(sh); sh.connect(lp); node=lp; }
    if(tb==='bass'){ const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400; src.connect(lp); node=lp; }
    node.connect(g);
    const lvl=vel*(tb==='bass'?1.5:tb==='eguitar'?.7:1.1);
    g.gain.setValueAtTime(lvl,when); g.gain.setTargetAtTime(0,end,tb==='uke'?.06:.09);
    src.start(when); src.stop(Math.min(when+ks.buf.duration/ks.rate,end+.8));
    return;
  }
  if(tb==='epiano'){ // two soft sines and a quick bell partial: an electric-piano tone
    [[1,1,1.6],[2,.35,.9],[7.02,.12,.12]].forEach(([h,a,dec])=>{ if(f*h>14000) return; const o=ctx.createOscillator(), og=ctx.createGain(); o.frequency.value=f*h; og.gain.setValueAtTime(a*vel*.45,when); og.gain.setTargetAtTime(a*vel*.12,when+.01,dec); og.gain.setTargetAtTime(0,end,.12); o.connect(og); og.connect(g); o.start(when); o.stop(end+1); });
    g.gain.value=1; return;
  }
  const s=SYNTH[tb]||SYNTH.flute, osc=ctx.createOscillator(); osc.type=s.wave; osc.frequency.value=f;
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.Q.value=s.q; lp.frequency.value=s.lp(f);
  if(s.brass){ lp.frequency.setValueAtTime(f*1.4,when); lp.frequency.exponentialRampToValueAtTime(s.lp(f),when+.07*s.brass); }
  if(s.formants){ s.formants.forEach(([fr,a,q])=>{ const bp=ctx.createBiquadFilter(), bg=ctx.createGain(); bp.type='bandpass'; bp.frequency.value=fr; bp.Q.value=q; bg.gain.value=a; osc.connect(bp); bp.connect(bg); bg.connect(lp); }); }
  else osc.connect(lp);
  lp.connect(g);
  const stops=[osc];
  if(s.second){ const o2=ctx.createOscillator(), g2=ctx.createGain(); o2.type='triangle'; o2.frequency.value=f*2; g2.gain.value=s.second; o2.connect(g2); g2.connect(lp); stops.push(o2); }
  if(s.vib){ const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=5.3; lg.gain.setValueAtTime(0,when); lg.gain.linearRampToValueAtTime(f*s.vib,when+.4); lfo.connect(lg); stops.forEach(o=>lg.connect(o.frequency)); stops.push(lfo); }
  if(s.breath){ const nb=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate), nd=nb.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
    const ns=ctx.createBufferSource(); ns.buffer=nb; ns.loop=true; const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*2; bp.Q.value=1.5; const ng=ctx.createGain(); ng.gain.value=s.breath; ns.connect(bp); bp.connect(ng); ng.connect(g); stops.push(ns); }
  const top=vel*s.level;
  g.gain.setValueAtTime(0,when); g.gain.linearRampToValueAtTime(top,when+s.att); g.gain.setTargetAtTime(top*s.sus,when+s.att,.3); g.gain.setTargetAtTime(0,end,s.rel);
  stops.forEach(o=>{ o.start(when); o.stop(end+s.rel*6); });
}

// ---- the part you play ----
function pickPart(ev,maxV){ // the note of this moment that belongs to your part, or null
  if(!ev.pitches.length) return null;
  const cls=e=>(e&&e.getAttribute&&e.getAttribute('class'))||'';
  if(INST.part==='top'){ if(!ev.els.some(e=>/abcjs-note/.test(cls(e))&&/\babcjs-v0\b/.test(cls(e)))) return null; return ev.pitches[0]; }
  const re=new RegExp('\\babcjs-v'+maxV+'\\b');
  if(!ev.els.some(e=>/abcjs-note/.test(cls(e))&&re.test(cls(e)))) return null;
  return ev.pitches[ev.pitches.length-1];
}
function maxVoice(evs){ let m=0; evs.forEach(ev=>ev.els.forEach(e=>{ const c=(e&&e.getAttribute&&e.getAttribute('class'))||'', x=c.match(/\babcjs-v(\d+)/); if(x) m=Math.max(m,+x[1]); })); return m; }
// the octave shift that puts most of the part inside the instrument's range
function fitOctave(midis){
  if(!midis.length) return 0;
  // most notes inside the range first; among nearly-as-good octaves, the one nearest the middle of the range
  const [lo,hi]=INST.range, mid=(lo+hi)/2, sorted=midis.slice().sort((a,b)=>a-b), med=sorted[Math.floor(sorted.length/2)];
  const opts=[-3,-2,-1,0,1,2,3].map(k=>({k, n:midis.filter(m=>m+12*k>=lo&&m+12*k<=hi).length/midis.length, d:Math.abs(med+12*k-mid)}));
  const top=Math.max(...opts.map(o=>o.n)), good=opts.filter(o=>o.n>=top-.03);
  if(good.some(o=>o.k===0)) return 0;
  return good.sort((a,b)=>a.d-b.d)[0].k*12;
}
// quick look at the rendered score to choose the octave before drawing it at written pitch
function partShiftFor(v,opts){
  try{ v.setUpAudio(opts); }catch(e){}
  const nt=(new ABCJS.TimingCallbacks(v,opts).noteTimings||[]).filter(e=>e.type==='event');
  const evs=nt.map(e=>({els:(e.elements||[]).flat(), pitches:(e.midiPitches||[]).filter(p=>p.cmd!=='rest'&&typeof p.pitch==='number').map(p=>({midi:p.pitch+transposeSemis})).sort((a,b)=>b.midi-a.midi)}));
  const mv=maxVoice(evs);
  return fitOctave(evs.map(ev=>pickPart(ev,mv)).filter(Boolean).map(p=>p.midi));
}
function withInstClef(src,v){
  if(!INST.clef||!v||v.lines.find(l=>l.staff).staff.length!==1) return src;
  const set=line=>/clef=\S+/.test(line)?line.replace(/clef=\S+/,'clef='+INST.clef):line+' clef='+INST.clef;
  let out=src.replace(/^(K:[^\n%]*)/m,(m)=>set(m.replace(/\s+$/,'')));
  out=out.replace(/^(V:[^\n%]*)/gm,(m)=>set(m.replace(/\s+$/,'')));
  return out;
}
function applyPart(evs){ // keeps only your part as the notes to learn; the rest becomes backing
  if(INST.part==='both'){ evs.forEach(ev=>{ ev.accomp=[]; }); return; }
  const mv=maxVoice(evs);
  evs.forEach(ev=>{
    const p=pickPart(ev,mv), all=ev.pitches;
    ev.accomp=p?all.filter(x=>x!==p):all.slice();
    ev.pitches=p?[Object.assign({},p,{midi:p.midi+partShift,orig:p.midi})]:[];
    ev.backingOnly=!p&&all.length>0;
  });
}

// ---- picker ----
function buildInstPicker(){
  const box=$('#instList'); if(!box) return;
  const groups=[...new Set(INSTRUMENTS.map(i=>i.group))];
  box.innerHTML=groups.map(g=>`<div class="inst-group"><span class="inst-g">${g}</span>${INSTRUMENTS.filter(i=>i.group===g).map(i=>`<button type="button" class="btn mini toggle" data-inst="${i.id}" aria-pressed="${i===INST}">${esc(i.name)}</button>`).join('')}</div>`).join('');
  box.onclick=e=>{ const b=e.target.closest('[data-inst]'); if(b) setInstrument(b.dataset.inst); };
}
function setInstrument(id,noReload){
  const next=INSTRUMENTS.find(i=>i.id===id)||INSTRUMENTS[0];
  if(next===INST&&$('#instList [aria-pressed="true"]')) return;
  INST=next; try{ localStorage.setItem('smc.instrument',INST.id); }catch(e){}
  document.querySelectorAll('#instList [data-inst]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.inst===INST.id)));
  applyInstUI();
  if(play) stopDemo(); if(MIC.on) micStop();
  if(vis&&!noReload) reloadKeep();
}
function instNoun(){ return INST.id==='voice'?'voice':INST.name.replace(/ \(.*\)$/,'').replace(/^Acoustic |^Electric /,'').toLowerCase(); }
function applyInstUI(){
  if(typeof fillSongs==='function'&&$('#songSel')) fillSongs();
  const piano=INST.view==='piano';
  const part=INST.part==='both'?'You play every note of the score.':INST.part==='bass'?'You play the bass line; the rest plays softly as backing.':'You play the melody (the top line); the rest plays softly as backing.';
  $('#instNote').textContent=part+(INST.note?' '+INST.note:'');
  const sk=Object.keys(SAMPLE_FOR).filter(k=>SAMPLE_FOR[k]===INST.id), sb=$('#instSample');
  if(sb){ const k=INST.id==='piano'?'ode2':sk[0]; sb.hidden=!k; if(k){ sb.dataset.k=k; sb.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M7 4v16l13-8z"/></svg> Try a sample: '+esc(SAMPLE_NAMES[k]); } }
  $('#kbScroll').hidden=!piano;
  $('#instView').hidden=piano;
  $('#rollBtn').style.display=piano?'':'none';
  const lbl=$('#dockLabel');
  lbl.innerHTML=piano?'<i class="sw r"></i>Right hand <i class="sw l"></i>Left hand · notes fall onto the key to press':esc(INST.name)+' guide: where to play the current note';
  const pc=$('#practice'); if(pc) pc.closest('label').hidden=!piano;
  $('#micBtn').title=`Play on your own ${piano?'piano':instNoun()}: Musisc listens and guides you`;
  $('#pedalLbl').hidden=!(INST.sound==='piano');
  if(typeof setPiano==='function') setPiano(pianoOpen);
  if(!piano) requestAnimationFrame(()=>drawInstView(events[cur]));
  if(typeof renderChordPanel==='function'&&$('#chordsPanel')) renderChordPanel();
}

// ---- the guide under the score ----
const TRUMPET_VALVES={54:'123',55:'13',56:'23',57:'12',58:'1',59:'2',60:'',61:'123',62:'13',63:'23',64:'12',65:'1',66:'2',67:'',68:'23',69:'12',70:'1',71:'2',72:'',73:'12',74:'1',75:'2',76:'',77:'1',78:'2',79:'',80:'23',81:'12',82:'1',83:'2',84:''};
function fretSpots(m){ return INST.strings.map((s,i)=>({string:i,fret:m-s})).filter(x=>x.fret>=0&&x.fret<=(INST.fretless?12:INST.frets)); }
function bestSpot(m){ const sp=fretSpots(m); if(!sp.length) return null; return sp.reduce((a,b)=>b.fret<a.fret?b:a); }
function slidePos(m){ const P=[46,53,58,62,65,68,70,72,74,75,77]; let best=null; P.forEach(p=>{ const d=p-m; if(d>=0&&d<=6&&(best==null||d<best)) best=d; }); return best==null?null:best+1; }
function stringName(i){ return info(INST.strings[i]).name.replace(/[0-9]/g,''); }
function fingerFor(fret){
  if(fret===0) return 'open string, no finger';
  if(INST.id==='violin') return {1:'low 1st finger',2:'1st finger',3:'low 2nd finger',4:'2nd finger',5:'3rd finger',6:'4th finger (or high 3rd)',7:'4th finger'}[fret]||'a higher position';
  if(INST.id==='cello') return {1:'1st finger, stretched back',2:'1st finger',3:'2nd finger',4:'3rd finger',5:'4th finger',6:'shift up a position',7:'shift up a position'}[fret]||'a higher position';
  if(fret<=4) return `finger ${fret}`;
  return `a higher position (move your hand up the neck)`;
}
function regInfo(w){ // w = written midi
  const id=INST.id;
  if(id==='flute') return w<=61?['Low register','relaxed lips and slow, warm air']:w<=73?['Middle register','mostly the same fingers as the low octave, with faster, narrower air']:['High register','fast, focused air; some notes use special fingerings'];
  if(id==='clarinet') return w<=66?['Low (chalumeau) register','no register key; cover the holes fully']:w<=70?['Throat tones','few fingers down; keep the air steady']:w<=84?['Upper (clarion) register','press the register key with your left thumb and finger the note a 12th lower']:['Altissimo','very high; special fingerings'];
  if(id==='asax'||id==='tsax') return w<=73?['Low register','no octave key']:w<=90?['Upper register','press the octave key with your left thumb; same fingers as an octave lower']:['Altissimo','very high; special fingerings'];
  if(id==='voice') return w<60?['Low','sing it gently, it is low for most voices']:w<=74?['Comfortable middle','most voices can sing this easily']:['High','take a good breath and keep it light'];
  return ['',''];
}
function drawInstView(ev){
  const box=$('#instView'); if(!box||INST.view==='piano') return;
  let e=ev; if(e&&!e.pitches.length){ for(let j=cur;j>=0;j--) if(events[j]&&events[j].pitches.length){ e=events[j]; break; } }
  const p=e&&e.pitches[0];
  if(!p){ box.innerHTML='<div class="iv-text">No note to play here.</div>'; return; }
  const m=p.midi, w=m+INST.transpose, n=info(m);
  const out=m<INST.range[0]||m>INST.range[1];
  let svg='', text='';
  if(INST.view==='fret'){
    const S=INST.strings.length, F=INST.fretless?7:Math.min(12,INST.frets), W=640, H=28+S*22, x0=44, fw=(W-x0-14)/F;
    const best=bestSpot(m), spots=fretSpots(m);
    svg+=`<rect x="${x0}" y="14" width="${W-x0-14}" height="${(S-1)*22}" rx="3" fill="var(--board)"/>`;
    if(!INST.fretless) [3,5,7,9,12].filter(k=>k<=F).forEach(k=>{ const cx=x0+(k-.5)*fw; svg+=k===12?`<circle cx="${cx}" cy="${14+(S-1)*22*.3}" r="4" fill="var(--inlay)"/><circle cx="${cx}" cy="${14+(S-1)*22*.7}" r="4" fill="var(--inlay)"/>`:`<circle cx="${cx}" cy="${14+(S-1)*11}" r="4" fill="var(--inlay)"/>`; });
    for(let k=0;k<=F;k++){ const x=x0+k*fw; svg+=`<line x1="${x}" x2="${x}" y1="14" y2="${14+(S-1)*22}" stroke="${k===0?'var(--ink)':INST.fretless?'transparent':'var(--fret)'}" stroke-width="${k===0?4:2}"/>`; if(k>0) svg+=`<text x="${x-fw/2}" y="${H-2}" font-size="10" text-anchor="middle" fill="var(--muted)">${INST.fretless?k:k}</text>`; }
    for(let i=0;i<S;i++){ const y=14+i*22; svg+=`<line x1="${x0}" x2="${W-14}" y1="${y}" y2="${y}" stroke="var(--string)" stroke-width="${1+i*.45}"/><text x="${x0-12}" y="${y+4}" font-size="12" font-weight="600" text-anchor="end" fill="var(--muted)">${esc(stringName(i))}</text>`; }
    spots.forEach(s=>{ if(s.fret>F) return; const isB=best&&s.string===best.string; const x=s.fret===0?x0-24+6:x0+(s.fret-.5)*fw, y=14+s.string*22;
      svg+=s.fret===0?`<circle cx="${x0-26}" cy="${y}" r="7" fill="none" stroke="${isB?'var(--now)':'var(--muted)'}" stroke-width="2.5" opacity="${isB?1:.5}"/>`:`<circle cx="${x}" cy="${y}" r="${isB?9:7}" fill="${isB?'var(--now)':'var(--muted)'}" opacity="${isB?1:.35}"/>`; });
    svg=`<svg viewBox="0 0 ${W} ${H}" class="iv-svg" role="img" aria-label="${esc(INST.name)} fingerboard">${svg}</svg>`;
    text=best?`<b>${esc(n.full)}</b>: ${esc(stringName(best.string))} string, ${best.fret===0?'open':(INST.fretless?'about '+best.fret+' semitone'+(best.fret>1?'s':'')+' up':'fret '+best.fret)} · ${esc(fingerFor(best.fret))}`:`<b>${esc(n.full)}</b> is out of reach on this ${instNoun()}.`;
  } else if(INST.view==='valves'){
    const v=TRUMPET_VALVES[w];
    [1,2,3].forEach((k,i)=>{ const down=v!=null&&v.includes(String(k)); svg+=`<g transform="translate(${40+i*70},10)"><rect x="-16" y="0" width="32" height="70" rx="8" fill="var(--board)"/><circle cx="0" cy="${down?48:22}" r="14" fill="${down?'var(--now)':'var(--panel)'}" stroke="var(--ink)" stroke-width="2"/><text x="0" y="${down?52:26}" font-size="13" font-weight="700" text-anchor="middle" fill="${down?'#fff':'var(--ink)'}">${k}</text></g>`; });
    svg=`<svg viewBox="0 0 220 90" class="iv-svg small" role="img" aria-label="Trumpet valves">${svg}</svg>`;
    text=v==null?`<b>${esc(n.full)}</b> is outside the usual trumpet chart.`:`<b>${esc(n.full)}</b>: ${v===''?'open, no valves down':'valves '+v.split('').join(' + ')+' down'}. Same fingering can give several notes; your lips and air choose which.`;
  } else if(INST.view==='slide'){
    const pos=slidePos(m);
    for(let k=1;k<=7;k++){ const x=30+(k-1)*60; svg+=`<line x1="${x}" x2="${x}" y1="20" y2="54" stroke="var(--fret)" stroke-width="2"/><text x="${x}" y="72" font-size="12" text-anchor="middle" fill="${k===pos?'var(--now)':'var(--muted)'}" font-weight="${k===pos?700:400}">${k}</text>`; }
    svg+=`<rect x="10" y="30" width="${pos?30+(pos-1)*60:20}" height="14" rx="7" fill="var(--board)" stroke="var(--ink)"/>`;
    if(pos) svg+=`<circle cx="${30+(pos-1)*60}" cy="37" r="11" fill="var(--now)"/>`;
    svg=`<svg viewBox="0 0 420 80" class="iv-svg" role="img" aria-label="Trombone slide position">${svg}</svg>`;
    text=pos?`<b>${esc(n.full)}</b>: slide position ${pos}${pos===1?' (slide all the way in)':pos>=6?' (arm stretched out)':''}.`:`<b>${esc(n.full)}</b> is outside the usual slide chart.`;
  } else { // wind and voice: where the note sits in your range
    const [lo,hi]=INST.range.map(x=>x+INST.transpose), pct=Math.max(0,Math.min(1,(w-lo)/(hi-lo))), [reg,tip]=regInfo(w);
    svg=`<svg viewBox="0 0 420 46" class="iv-svg" role="img" aria-label="Where the note sits in the ${esc(INST.name)} range"><rect x="10" y="16" width="400" height="12" rx="6" fill="var(--board)"/><circle cx="${10+pct*400}" cy="22" r="10" fill="var(--now)"/><text x="10" y="44" font-size="11" fill="var(--muted)">${esc(info(lo-INST.transpose).full)} (lowest)</text><text x="410" y="44" font-size="11" text-anchor="end" fill="var(--muted)">${esc(info(hi-INST.transpose).full)} (highest)</text></svg>`;
    text=`<b>${esc(n.full)}</b>${INST.id==='voice'?' · sing "'+SOLF[n.letter]+'"':''}${reg?' · '+esc(reg)+': '+esc(tip):''}.`;
  }
  if(out) text+=` <span class="iv-warn">This note is outside the normal ${esc(INST.name)} range.</span>`;
  box.innerHTML=svg+`<div class="iv-text">${text}</div>`;
}

// ---- the lesson, worded for your instrument ----
function renderInstLesson(ev){
  $('#counter').textContent=`Step ${cur+1} of ${events.length}`;
  let e=ev, holding=false;
  if(!ev.pitches.length&&ev.backingOnly){ for(let j=cur;j>=0;j--) if(events[j].pitches.length){ e=events[j]; holding=true; break; } }
  drawInstView(ev);
  if(!e.pitches.length){
    const beats=ev.gap/msPerMeasure*meter.num;
    $('#bigName').innerHTML='Rest'; $('#bigName').style.fontSize='2.4rem';
    $('#heroTitle').textContent='A rest: silence'; $('#heroSub').textContent=`Stay silent for ${fmtBeats(beats)}.`;
    $('#chips').innerHTML=''; $('#staffBox').innerHTML='';
    $('#steps').innerHTML=`<li><span class="n">1</span><span><b>Wait.</b> Keep counting the beat (${fmtBeats(beats)}) so you come back in on time.</span></li>`;
    $('#dockNow').textContent='Rest'; return;
  }
  $('#bigName').style.fontSize='';
  const p=e.pitches[0], n=info(p.midi), clef=INST.clef||(clefs.length>1&&INST.part==='bass'?'bass':clefs[0]||'treble'), s=stepOf(n,clef);
  const dn=durName(p.whole), beats=p.whole*meter.den, noun=instNoun();
  $('#bigName').innerHTML=esc(n.name)+`<small>${n.oct}</small>`;
  $('#heroTitle').textContent=holding?`Keep holding ${n.full}`:INST.id==='voice'?`Sing ${n.name} (${SOLF[n.letter]})`:`${n.name} on the ${noun}`;
  $('#heroSub').textContent=holding?'The backing moves here while your note rings on.':`${dn?dn[0].toUpperCase()+dn.slice(1)+' note':'Note'}: hold for ${fmtBeats(beats)}`;
  const concert=INST.transpose?(()=>{ const t=INST.transpose; INST.transpose=0; const c=info(p.midi).full; INST.transpose=t; return c; })():'';
  const chips=[n.full, clef==='bass'?'Bass clef':'Treble clef', INST.name];
  if(concert&&INST.transpose!==12) chips.push('Sounds as '+concert);
  if(p.midi<INST.range[0]||p.midi>INST.range[1]) chips.push('Out of range');
  $('#chips').innerHTML=chips.map(c=>`<span class="chip">${esc(c)}</span>`).join('');
  $('#staffBox').innerHTML=staffSvg(s,clef,n,p.whole);
  const steps=[];
  const lines=clef==='bass'?'G B D F A ("Good Boys Do Fine Always")':'E G B D F ("Every Good Boy Does Fine")';
  const spaces=clef==='bass'?'A C E G ("All Cows Eat Grass")':'F A C E (spells "FACE")';
  let read=`The note head sits ${posText(s)}. On the ${clef} staff the lines from the bottom are ${lines}; the spaces are ${spaces}.`;
  if(n.acc) read+=` The ${n.acc==='sharp'?'sharp (♯)':'flat (♭)'} ${keyHas(n)?'comes from the key signature':'is written next to the note'}.`;
  steps.push(['Read it',read]);
  let find='';
  if(INST.view==='fret'){ const b=bestSpot(p.midi); find=b?`Play the ${stringName(b.string)} string ${b.fret===0?'open (no finger)':INST.fretless?`with your ${fingerFor(b.fret)}`:`at fret ${b.fret}, ${fingerFor(b.fret)}`}. The guide below shows the spot (other places that give the same note are shown faintly).`:`This note is out of reach here; skip it or play it an octave ${p.midi<INST.range[0]?'higher':'lower'}.`; }
  else if(INST.view==='valves'){ const v=TRUMPET_VALVES[p.midi+INST.transpose]; find=v==null?'This note is outside the usual trumpet chart.':`${v===''?'Keep all valves up (open)':'Press valves '+v.split('').join(' + ')}, then buzz the pitch: ${p.midi+INST.transpose>=72?'higher notes need faster air and firmer lips':p.midi+INST.transpose<=60?'low notes need relaxed lips and lots of air':'a steady, comfortable buzz'}.`; }
  else if(INST.view==='slide'){ const pos=slidePos(p.midi); find=pos?`Move the slide to position ${pos} and buzz the pitch.`:'This note is outside the usual slide chart.'; }
  else { const [reg,tip]=regInfo(p.midi+INST.transpose); find=INST.id==='voice'?`Hear it first, then sing "${SOLF[n.letter]}" on the same pitch. ${reg}: ${tip}.`:`${reg}: ${tip}. Check a fingering chart for ${n.full} if you are unsure.`; }
  steps.push([INST.id==='voice'?'Find the pitch':'Find it on the '+noun, find]);
  let count=`${dn?'A '+dn+' note':'This note'} lasts ${fmtBeats(beats)} in ${meter.num}/${meter.den} time.`;
  if(beats>=1) count+=` Count "${Array.from({length:Math.max(1,Math.round(beats))},(_,i)=>i+1).join(', ')}" while it sounds.`;
  steps.push(['Count it',count]);
  steps.push(['Play it',`Press "Hear it", then ${INST.id==='voice'?'sing':'play'} it and press Next. Or press "Practice with mic" and Musisc will listen to your ${noun}.`]);
  $('#steps').innerHTML=steps.map((t,i)=>`<li><span class="n">${i+1}</span><span><b>${t[0]}.</b> ${esc(t[1])}</span></li>`).join('');
  $('#dockNow').textContent='Now: '+n.full;
}

/* ---------- music helpers ---------- */
function info(midi){
  const w=midi+(INST.transpose||0), pc=((w%12)+12)%12, oct=Math.floor(w/12)-1, name=(keyPref==='flat'?FL:SH)[pc];
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

// Number the first bar of every row (abcjs "barnumbers 0") unless the notation already sets its own numbering.
function withBarNumbers(abc){
  if(/^%%(barnumbers|measurenb)\b/m.test(abc)) return abc;
  return /^X:.*$/m.test(abc) ? abc.replace(/^(X:.*)$/m,'$1\n%%barnumbers 0') : '%%barnumbers 0\n'+abc;
}
// Phones: draw the score at the screen's own width with fewer bars per row, so notes stay big
// enough to read instead of a desktop-width score shrunk to fit.
let lastLayout='';
function scoreLayout(){
  const w=($('#score')&&$('#score').clientWidth)||760;
  const bars=4, width=Math.round(Math.max(560,Math.min(760,w-8))); // always 4 bars a row; narrow screens draw at 560+ and scale down
  return {bars, width, key:bars+':'+(w<640?Math.round(width/40):'w')};
}
function reloadKeep(){ // redraw the current score, keeping the place and speed
  if(!vis) return;
  const at=cur, sp=speedF;
  try{ loadAbc($('#abcText').value); setSpeed(sp,'load'); if(events[at]) goTo(at,false); }catch(e){}
}
let relayoutT=0;
addEventListener('resize',()=>{ clearTimeout(relayoutT); relayoutT=setTimeout(()=>{
  if(!vis||play||(typeof MIC!=='undefined'&&MIC.on)||!$('#score').clientWidth) return;
  if(scoreLayout().key===lastLayout) return;
  reloadKeep();
},300); });
// 4 bars a row: abcjs drops to fewer bars on busy music, so redraw wider (the score is then
// scaled down to fit the screen) until no row except the last has fewer than 4 bars.
function renderScore(src,L,vt=0){
  let v=null;
  for(const k of [1,1.4,1.9,2.6]){
    const out=ABCJS.renderAbc('score', src, {add_classes:true, responsive:'resize', staffwidth:Math.round(L.width*k),
      wrap:{minSpacing:1.4,maxSpacing:3.2,preferredMeasuresPerLine:L.bars}, clickListener:onNoteClick, paddingleft:4, paddingright:4, visualTranspose:vt||0});
    v=out&&out[0];
    if(!v||!v.lines) break;
    const rows=v.lines.filter(l=>l.staff).map(l=>(l.staff[0].voices[0]||[]).filter(e=>e.el_type==='bar').length);
    if(rows.slice(0,-1).every(n=>n>=L.bars)) break;
  }
  return v;
}

let chordsOn=(()=>{ try{ return localStorage.getItem('smc.chords')!=='off'; }catch(e){ return true; } })();
const CHORD_KIND={'':[0,4,7], m:[0,3,7], '7':[0,4,7,10]};
// chords that belong to the key (step above the key note, kind, how readily a song uses it)
const KEY_CHORDS={
  major:[[0,'',.15],[7,'',.10],[5,'',.09],[7,'7',.03],[9,'m',0],[2,'m',-.04],[4,'m',-.14],
         [2,'',-.2],[2,'7',-.2],[4,'',-.22],[4,'7',-.22],[0,'7',-.22],[10,'',-.22],[5,'m',-.24]],
  minor:[[0,'m',.15],[7,'',.10],[7,'7',.04],[5,'m',.09],[8,'',0],[3,'',-.03],[10,'',-.06],[7,'m',-.08],
         [5,'',-.2],[0,'',-.22],[0,'7',-.22],[2,'7',-.22]]
};
function hasChordSymbols(v){
  return v.lines.some(l=>l.staff&&l.staff.some(s=>(s.voices||[]).some(vo=>vo.some(e=>e.chord&&e.chord.some(c=>!c.position||c.position==='default')))));
}
// abcjs reports a 4-beat bar length even in 3/4, so work it out: ms per beat x bar length / beat length
function barMsOf(v,t){
  const mpb=t.millisecondsPerBeat, bl=v.getBeatLength&&v.getBeatLength(), bar=v.getBarLength&&v.getBarLength();
  return mpb&&bl&&bar?mpb*bar/bl:(t.millisecondsPerMeasure||2400);
}
/* ---------- chord names ----------
   Gives every bar (every half bar in 4/4, 6/8 and 12/8) the chord that best fits the notes sounding
   in it, the way a lead sheet harmonises a tune: chords of the piece's key are preferred (I, IV, V, V7,
   vi ...), notes on the beat count most, a note held in the bass counts extra, and a whole-song pass
   (Viterbi) favours natural progressions (V to I, IV to V, keeping a chord) and ending on the home
   chord. Other chords are allowed but must fit clearly, so music that changes key still gets named.
   Written into the rendered copy as ABC chord symbols; scores that have their own keep them. */
function addChords(v,src,opts){
  try{ v.setUpAudio(opts); }catch(e){}
  const timer=new ABCJS.TimingCallbacks(v,opts);
  const nt=(timer.noteTimings||[]).filter(e=>e.type==='event'); if(!nt.length) return null;
  const mpm=barMsOf(v,timer), mf=(v.getMeterFraction&&v.getMeterFraction())||{num:4,den:4};
  const measureWhole=mf.num/mf.den, halves=[4,6,12].includes(mf.num);
  const key=v.lines.find(l=>l.staff).staff[0].key||{};
  const LET={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const tonic=((LET[(key.root||'C')[0]]??0)+(key.acc==='#'?1:key.acc==='b'?-1:0)+12)%12;
  const minor=/^m/i.test(key.mode||'')&&!/^maj/i.test(key.mode||'');
  // chord spelling the way lead sheets write it (Bb, Eb, F#); sharp keys use C#, G#, D#, flat keys Db, Gb
  const acc=key.accidentals||[], nSharp=acc.filter(a=>a.acc==='sharp').length, nFlat=acc.filter(a=>a.acc==='flat').length;
  const names=['C',nFlat>=4?'Db':'C#','D',nSharp>=4?'D#':'Eb','E','F',nFlat>=5?'Gb':'F#','G',nSharp>=2?'G#':'Ab','A','Bb','B'];
  // candidate chords: the key's own (with their bonus), then every other major, minor and 7th chord (with a cost)
  const cands=[], seen=new Set(), poly=nt.some(e=>(e.midiPitches||[]).filter(p=>p.cmd!=='rest').length>1);
  KEY_CHORDS[minor?'minor':'major'].forEach(([st,kind,bonus])=>{ const r=(tonic+st)%12; seen.add(r+kind); cands.push({r,kind,bonus,tones:CHORD_KIND[kind].map(i=>(r+i)%12)}); });
  for(let r=0;r<12;r++) for(const kind of ['','m','7']) if(!seen.has(r+kind)) cands.push({r,kind,bonus:poly?-.4:-.45,tones:CHORD_KIND[kind].map(i=>(r+i)%12)});
  cands.forEach(c=>{ c.name=names[c.r]+c.kind; c.home=c.r===tonic&&c.kind===(minor?'m':''); c.dom=c.r===(tonic+7)%12&&(c.kind===''||c.kind==='7'); });

  const mstart={};
  const evs=nt.map(e=>{
    const parts=(e.startCharArray||[e.startChar]).map((sc,i)=>{
      const el=e.elements&&e.elements[i]&&e.elements[i][0], c=el&&el.getAttribute?el.getAttribute('class')||'':'';
      return {sc, v:+((c.match(/abcjs-v(\d+)/)||[0,99])[1]), mm:+((c.match(/abcjs-mm(\d+)/)||[0,-1])[1]), line:+((c.match(/abcjs-l(\d+)/)||[0,-1])[1])};
    }).filter(p=>typeof p.sc==='number'&&p.sc>=0).sort((a,b)=>a.v-b.v);
    const mm=parts.length?parts[0].mm:-1;
    if(mm>=0) mstart[mm]=Math.min(mstart[mm]??Infinity,e.milliseconds);
    const pitches=(e.midiPitches||[]).filter(p=>p.cmd!=='rest'&&typeof p.pitch==='number')
      .map(p=>({midi:p.pitch, dur:(typeof p.duration==='number'?p.duration:.25)/measureWhole*mpm}));
    return {ms:e.milliseconds, parts, pitches};
  });
  const beat=mpm/((mf.den===8&&mf.num%3===0&&mf.num>3)?mf.num/3:mf.num);
  const mms=Object.keys(mstart).map(Number).sort((a,b)=>a-b), segs=[];
  const seg=(s,e)=>({s,e,on:new Array(12).fill(0),off:new Array(12).fill(0),bass:null,bassOv:0,total:0});
  mms.forEach((m,i)=>{
    const s=mstart[m], end=i+1<mms.length?mstart[mms[i+1]]:s+mpm;
    if(halves&&end-s>mpm*.75){ const mid=s+(end-s)/2; segs.push(seg(s,mid),seg(mid,end)); } else segs.push(seg(s,end));
  });
  let first=0;
  evs.forEach(ev=>{
    while(first<segs.length-1&&segs[first].e<=ev.ms) first++;
    ev.pitches.forEach(p=>{
      const en=ev.ms+p.dur;
      for(let k=first;k<segs.length&&segs[k].s<en;k++){
        const g=segs[k], ov=Math.min(en,g.e)-Math.max(ev.ms,g.s); if(ov<=0) continue;
        const startsHere=ev.ms>=g.s-1, off=(ev.ms-g.s)%beat, onBeat=!startsHere||off<25||off>beat-25;
        const wgt=ov*(startsHere&&Math.abs(ev.ms-g.s)<25?2:1);   // the note that starts the bar or half bar matters most
        (onBeat?g.on:g.off)[p.midi%12]+=wgt; g.total+=wgt;
        if(poly&&ov>=(g.e-g.s)*.2&&(g.bass==null||p.midi<g.bass)){ g.bass=p.midi; g.bassOv=ov; }
      }
    });
  });
  // how well chord c fits segment g: chord tones count for it, other notes against it
  // (much more when they fall on the beat than when they pass between beats)
  const fit=(g,c)=>{
    if(g.total<=0) return 0;
    let f=0;
    for(let pc=0;pc<12;pc++){
      const at=c.tones.indexOf(pc), w=g.on[pc]+g.off[pc];
      f+=at<0?-(g.on[pc]*.55+g.off[pc]*.2):at===3?w*.5:w;                // a 7th counts only half as a chord note
    }
    f/=g.total;
    if(c.kind==='7'&&!(g.on[c.tones[3]]+g.off[c.tones[3]]>g.total*.12)) f-=.1;    // a 7th chord only when its 7th is heard
    if(g.bass!=null){ const b=g.bass%12; f+=b===c.r?.45:c.tones.includes(b)?-.1:-.45; }
    return f;
  };
  const trans=(a,b)=>{
    if(a===b) return .1;
    let t=0;
    if(a.dom&&b.home) t+=.1;
    if(b.dom&&(a.r===(tonic+5)%12||a.r===(tonic+2)%12)) t+=.07;          // IV or ii going to V
    if(a.r===b.r) t-=.04;                                                 // C to C7, G to Gm: only if the notes say so
    return t;
  };
  // Viterbi through the song
  const N=segs.length, C=cands.length; if(!N) return null;
  const lastNote=(()=>{ for(let i=N-1;i>=0;i--) if(segs[i].total>0) return i; return N-1; })();
  let score=cands.map(c=>fit(segs[0],c)+c.bonus+(c.home?.12:0)), back=[];
  for(let i=1;i<N;i++){
    const ns=new Array(C), bk=new Array(C);
    for(let j=0;j<C;j++){
      let best=-1e9, arg=0;
      for(let k=0;k<C;k++){ const s=score[k]+trans(cands[k],cands[j]); if(s>best){ best=s; arg=k; } }
      ns[j]=best+fit(segs[i],cands[j])+cands[j].bonus*(segs[i].total>0?1:0)+(i===lastNote&&cands[j].home?.3:0);
      bk[j]=arg;
    }
    score=ns; back.push(bk);
  }
  let j=score.indexOf(Math.max(...score)); const path=new Array(N); path[N-1]=j;
  for(let i=N-2;i>=0;i--){ j=back[i][j]; path[i]=j; }
  // label each change (and the first chord on every row), at the first note in that bar or half bar
  const ins=[]; let prev=null, prevLine=-1, e=0;
  segs.forEach((g,i)=>{
    const c=cands[path[i]];
    if(g.total<=0) return;
    while(e<evs.length&&evs[e].ms<g.s-1) e++;
    let ev=null;
    for(let k=e;k<evs.length&&evs[k].ms<g.e-1;k++) if(evs[k].parts.length){ ev=evs[k]; break; }
    if(!ev) return;
    const part=ev.parts[0];
    let name=c.name;
    if(g.bass!=null&&g.bassOv>=(g.e-g.s)*.45){ const b=g.bass%12; if(b!==c.r&&c.tones.includes(b)) name+='/'+names[b]; }
    if(name===prev&&part.line===prevLine) return;
    prev=name; prevLine=part.line;
    ins.push({sc:part.sc, text:'"'+name+'"'});
  });
  if(!ins.length) return null;
  let out=src; const used=new Set();
  ins.sort((a,b)=>b.sc-a.sc).forEach(x=>{ if(used.has(x.sc)) return; used.add(x.sc); out=out.slice(0,x.sc)+x.text+out.slice(x.sc); });
  return out;
}
/* Lead sheets (scores that come with chord symbols written in) show their own chords, and the button
   shows or hides them. Other scores get chords suggested from the notes, and the button turns the
   suggestions on or off. Each has its own remembered setting. */
let leadSheet=false, leadOn=(()=>{ try{ return localStorage.getItem('smc.leadChords')!=='off'; }catch(e){ return true; } })();
let keyTonic=0, keyMinor=false;
function setChords(on){
  if(leadSheet){ leadOn=!!on; try{ localStorage.setItem('smc.leadChords',leadOn?'on':'off'); }catch(e){} }
  else { chordsOn=!!on; try{ localStorage.setItem('smc.chords',chordsOn?'on':'off'); }catch(e){} }
  updateChordBtn();
}
function updateChordBtn(){
  const b=$('#chordBtn'); if(!b) return;
  const on=leadSheet?leadOn:chordsOn;
  b.setAttribute('aria-pressed',String(on));
  b.querySelector('span').textContent=leadSheet?'Chords':'Suggest chords';
  b.title=leadSheet?'This is a lead sheet: show or hide its chord symbols':'Suggest chord names worked out from the notes';
  $('#score').classList.toggle('hide-chords',leadSheet&&!leadOn);
  if(typeof updateChordPlayBtn==='function') updateChordPlayBtn();
}

/* ---------- chord explanations (shown when you hover over, or tap, a chord symbol) ---------- */
const CHORD_TYPES=[ // longest spellings first
  [/^(maj7|M7|Δ7|Δ)$/,'major seventh',[0,4,7,11],'a major chord with a 7th on top: soft and dreamy'],
  [/^(m7b5|m7♭5|ø7?)$/,'half-diminished',[0,3,6,10],'a tense chord that usually leads to the V chord'],
  [/^(dim7|°7)$/,'diminished seventh',[0,3,6,9],'a very tense chord that wants to move on'],
  [/^(m7|min7|-7)$/,'minor seventh',[0,3,7,10],'a minor chord with a 7th: mellow and smooth'],
  [/^(m6|min6)$/,'minor sixth',[0,3,7,9],'a minor chord with an added 6th'],
  [/^(m9|min9)$/,'minor ninth',[0,3,7,10,14],'a rich, jazzy minor chord'],
  [/^(madd9)$/,'minor add 9',[0,3,7,14],'a minor chord with an added 9th'],
  [/^(m|min|-)$/,'minor',[0,3,7],'sounds darker or sadder than a major chord'],
  [/^(dim|°)$/,'diminished',[0,3,6],'a tense, unstable chord'],
  [/^(aug|\+)$/,'augmented',[0,4,8],'a stretched, restless sound'],
  [/^(sus4|sus)$/,'suspended 4th',[0,5,7],'the 3rd is replaced by the 4th: open, waiting to resolve'],
  [/^(sus2)$/,'suspended 2nd',[0,2,7],'the 3rd is replaced by the 2nd: open and airy'],
  [/^(7sus4|7sus)$/,'seventh suspended 4th',[0,5,7,10],'a dominant chord holding off its 3rd'],
  [/^(add9|add2)$/,'add 9',[0,4,7,14],'a major chord with an added 9th: bright and open'],
  [/^(9)$/,'dominant ninth',[0,4,7,10,14],'a fuller dominant seventh chord'],
  [/^(6)$/,'major sixth',[0,4,7,9],'a major chord with an added 6th: sweet, a little old-fashioned'],
  [/^(7)$/,'dominant seventh',[0,4,7,10],'a major chord with a flat 7th: it wants to move to the chord a 5th below'],
  [/^(5)$/,'power chord',[0,7],'just the root and 5th, neither major nor minor'],
  [/^()$/,'major',[0,4,7],'bright and stable'],
];
function parseChordName(t){
  const m=String(t).trim().replace(/♭/g,'b').replace(/♯/g,'#').match(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/);
  if(!m) return null;
  const LET={C:0,D:2,E:4,F:5,G:7,A:9,B:11}, pcOf=(l,a)=>(LET[l]+(a==='#'?1:a==='b'?-1:0)+12)%12;
  const type=CHORD_TYPES.find(([re])=>re.test(m[3]));
  if(!type) return null;
  return {root:pcOf(m[1],m[2]), rootName:m[1]+m[2], type, bass:m[4]?pcOf(m[4],m[5]):null, bassName:m[4]?m[4]+m[5]:''};
}
function chordExplain(t){
  const c=parseChordName(t); if(!c) return null;
  const flat=/b/.test(c.rootName)||c.rootName==='F'||(keyMinor&&[2,5,7,0].includes(keyTonic)&&!/#/.test(c.rootName));
  const NM=flat?['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B']:['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const pretty=s=>s.replace(/b/g,'♭').replace(/#/g,'♯');
  const [,typeName,iv,feel]=c.type;
  const notes=iv.map(i=>NM[(c.root+i)%12]);
  // its job in the key, as a Roman numeral (capitals for major chords, small letters for minor ones)
  const deg=(c.root-keyTonic+12)%12;
  const ROM=keyMinor?{0:'i',2:'ii',3:'III',5:'iv',7:'v',8:'VI',10:'VII'}:{0:'I',2:'ii',4:'iii',5:'IV',7:'V',9:'vi',11:'vii'};
  const minorish=/minor|diminished|half/.test(typeName);
  let role='';
  if(ROM[deg]!=null){
    let r=ROM[deg]; r=minorish?r.toLowerCase():r.toUpperCase();
    if(/diminished/.test(typeName)) r+='°';
    if(/seventh/.test(typeName)&&!/major seventh/.test(typeName)) r+='7';
    const why={
      I:'the home chord: music feels settled here', i:'the home chord: music feels settled here',
      IV:'moves away from home; it often leads to V or back to I', iv:'moves away from home; it often leads to V or back to i',
      V:'the dominant: it pulls strongly back to the home chord', V7:'the dominant seventh: the strongest pull back to the home chord',
      v:'a softer dominant', vi:'the relative minor: a gentler, sadder colour of the home key',
      ii:'often comes just before V', ii7:'often comes just before V', iii:'a soft link chord',
      VI:'a warm chord that often follows i or V', III:'the relative major of this key', VII:'often leads to III or back to i',
      'vii°':'a tense chord that leads to the home chord'
    }[r]||'';
    role=`<b>${r}</b> in ${esc(keyName.replace('♯','♯'))}${why?': '+why:''}.`;
  } else role=`Not one of the main chords of ${esc(keyName)}: borrowed from another key for colour.`;
  const bass=c.bass!=null&&c.bass!==c.root?`<div>Play it with <b>${NM[c.bass]}</b> as the lowest note (the "/${pretty(c.bassName)}").</div>`:'';
  return `<div class="ct-name"><b>${esc(pretty(t))}</b> · ${esc(NM[c.root])} ${typeName}</div>
    <div>Notes: <b>${notes.join(' · ')}</b></div>
    <div class="ct-feel">${feel[0].toUpperCase()+feel.slice(1)}.</div>${bass}
    <div class="ct-role">${role}</div>
    <div class="ct-src">${leadSheet?'Written in this lead sheet.':'Suggested by Musisc from the notes, so treat it as a guide.'}</div>`;
}
let chordTipT=0;
function showChordTip(el){
  const html=chordExplain(el.textContent); if(!html) return;
  let tip=$('#chordTip');
  if(!tip){ tip=document.createElement('div'); tip.id='chordTip'; tip.className='chord-tip'; tip.setAttribute('role','tooltip'); document.body.appendChild(tip); }
  tip.innerHTML=html; tip.hidden=false;
  const r=el.getBoundingClientRect(), tw=Math.min(300,innerWidth-24);
  tip.style.width=tw+'px';
  const left=Math.max(12,Math.min(innerWidth-tw-12,r.left+r.width/2-tw/2));
  const th=tip.offsetHeight, top=r.top-th-8>8?r.top-th-8:r.bottom+8;
  tip.style.left=left+'px'; tip.style.top=top+'px';
  clearTimeout(chordTipT);
}
function hideChordTip(){ const tip=$('#chordTip'); if(tip) tip.hidden=true; }
function wireChordTips(){
  document.querySelectorAll('#score .abcjs-chord').forEach(el=>{
    el.addEventListener('pointerenter',e=>{ if(e.pointerType==='mouse'&&!popState) showChordTip(el); });
    el.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse') hideChordTip(); });
    // a click or tap opens the chord pop-up instead of selecting the note under it
    ['pointerdown','mousedown','touchstart','mouseup','pointerup'].forEach(t=>el.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
    el.addEventListener('click',e=>{ e.stopPropagation(); openChordPop(el); });
  });
}
addEventListener('scroll',hideChordTip,true);
/* ---------- chord pop-up and chord backing ----------
   Click (or tap) a chord symbol: a pop-up shows where the chord is (piano keys, or a chord shape for
   guitar players), lets you step through its inversions, and plays it. "Chord backing" also plays the
   chords along with the demo, each one held until the next chord symbol. Chord names on the page are at
   your instrument's written pitch; the sound is always at concert pitch. */
let chordLine=[], chordPlayOn=(()=>{ try{ return localStorage.getItem('smc.chordPlay')!=='off'; }catch(e){ return true; } })();
function writtenOffset(){ return INST.part!=='both'?partShift+INST.transpose:0; }
function chordTones(name){ // pitch classes and intervals of a chord name, at written pitch
  const c=parseChordName(name); if(!c) return null;
  return {c, ivs:c.type[2]};
}
// a comfortable piano voicing around the middle of the keyboard; inv moves the lowest notes up an octave
function chordVoicing(name, inv=0, withBass=false, offset=0){
  const t=chordTones(name); if(!t) return null;
  const root=((t.c.root-offset)%12+12)%12;
  let base=48+root; if(base>55) base-=12;
  let notes=t.ivs.map(i=>base+i).sort((a,b)=>a-b);
  const n=Math.min(inv,notes.length-1);
  for(let k=0;k<n;k++){ notes.push(notes.shift()+12); }
  notes.sort((a,b)=>a-b);
  let bass=null;
  if(t.c.bass!=null){ const bp=((t.c.bass-offset)%12+12)%12; bass=notes[0]-((notes[0]-bp)%12+12)%12; if(bass===notes[0]) bass-=12; }
  else if(withBass){ bass=base-12; }
  if(bass!=null&&(withBass||t.c.bass!=null)) notes=[bass].concat(notes.filter(m=>m!==bass));
  return {notes, bass, max:Math.min(3,t.ivs.length-1)};
}
// guitar chord shapes, low E string first (-1 = don't play that string)
const GTR_OPEN={
  'C':[-1,3,2,0,1,0],'D':[-1,-1,0,2,3,2],'E':[0,2,2,1,0,0],'G':[3,2,0,0,0,3],'A':[-1,0,2,2,2,0],
  'Am':[-1,0,2,2,1,0],'Dm':[-1,-1,0,2,3,1],'Em':[0,2,2,0,0,0],
  'A7':[-1,0,2,0,2,0],'B7':[-1,2,1,2,0,2],'C7':[-1,3,2,3,1,0],'D7':[-1,-1,0,2,1,2],'E7':[0,2,0,1,0,0],'G7':[3,2,0,0,0,1],
  'Am7':[-1,0,2,0,1,0],'Em7':[0,2,0,0,0,0],'Dm7':[-1,-1,0,2,1,1],
  'Cmaj7':[-1,3,2,0,0,0],'Fmaj7':[-1,-1,3,2,1,0],'Gmaj7':[3,2,0,0,0,2],'Amaj7':[-1,0,2,1,2,0],'Dmaj7':[-1,-1,0,2,2,2],'Emaj7':[0,2,1,1,0,0],
  'Dsus4':[-1,-1,0,2,3,3],'Asus4':[-1,0,2,2,3,0],'Esus4':[0,2,2,2,0,0],'Dsus2':[-1,-1,0,2,3,0],'Asus2':[-1,0,2,2,0,0]
};
const GTR_E={'':[0,2,2,1,0,0],m:[0,2,2,0,0,0],'7':[0,2,0,1,0,0],m7:[0,2,0,0,0,0],sus4:[0,2,2,2,0,0]};
const GTR_A={'':[-1,0,2,2,2,0],m:[-1,0,2,2,1,0],'7':[-1,0,2,0,2,0],m7:[-1,0,2,0,1,0],maj7:[-1,0,2,1,2,0],sus4:[-1,0,2,2,3,0],sus2:[-1,0,2,2,0,0]};
function guitarShape(name){
  const c=parseChordName(name); if(!c) return null;
  const kind={'major':'','minor':'m','dominant seventh':'7','minor seventh':'m7','major seventh':'maj7','suspended 4th':'sus4','suspended 2nd':'sus2'}[c.type[1]];
  if(kind==null) return null;
  const SH=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'], FL=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  for(const nm of [SH[c.root]+kind, FL[c.root]+kind]) if(GTR_OPEN[nm]) return {frets:GTR_OPEN[nm], barre:0};
  const opts=[];
  if(GTR_E[kind]){ const r=((c.root-4)%12+12)%12||12; opts.push({frets:GTR_E[kind].map(f=>f<0?-1:f+r), barre:r}); }
  if(GTR_A[kind]){ const r=((c.root-9)%12+12)%12||12; opts.push({frets:GTR_A[kind].map(f=>f<0?-1:f+r), barre:r}); }
  return opts.sort((a,b)=>a.barre-b.barre)[0]||null;
}
const GTR_STRINGS=[40,45,50,55,59,64];
function guitarSvg(shape){
  const fr=shape.frets, used=fr.filter(f=>f>0), lo=Math.min(...used,99), start=Math.max(...fr)<=4?1:lo, W=150, H=150, x0=22, y0=28, sw=(W-2*x0)/5, fh=22;
  let g='';
  for(let i=0;i<6;i++) g+=`<line x1="${x0+i*sw}" x2="${x0+i*sw}" y1="${y0}" y2="${y0+5*fh}" stroke="var(--ink)" stroke-width="1.2"/>`;
  for(let k=0;k<=5;k++) g+=`<line x1="${x0}" x2="${x0+5*sw}" y1="${y0+k*fh}" y2="${y0+k*fh}" stroke="var(--ink)" stroke-width="${k===0&&start===1?4:1.2}"/>`;
  if(start>1) g+=`<text x="${x0-6}" y="${y0+fh*.65}" font-size="11" text-anchor="end" fill="var(--muted)">${start}fr</text>`;
  if(shape.barre){ const bs=fr.findIndex(f=>f===shape.barre); g+=`<rect x="${x0+bs*sw-7}" y="${y0+(shape.barre-start+.5)*fh-7}" width="${(5-bs)*sw+14}" height="14" rx="7" fill="var(--accent)"/>`; }
  fr.forEach((f,i)=>{ const x=x0+i*sw;
    if(f<0) g+=`<text x="${x}" y="${y0-8}" font-size="12" text-anchor="middle" fill="var(--muted)">×</text>`;
    else if(f===0) g+=`<circle cx="${x}" cy="${y0-12}" r="4.5" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
    else if(!(shape.barre&&f===shape.barre)) g+=`<circle cx="${x}" cy="${y0+(f-start+.5)*fh}" r="7" fill="var(--accent)"/>`; });
  'EADGBE'.split('').forEach((s,i)=>g+=`<text x="${x0+i*sw}" y="${H-4}" font-size="10" text-anchor="middle" fill="var(--muted)">${s}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="150" height="150" role="img" aria-label="Guitar chord shape">${g}</svg>`;
}
function keysSvg(notes, bass){ // a small keyboard with a dot on each key of the chord
  const lo=Math.floor((Math.min(...notes))/12)*12, hi=Math.max(lo+24,Math.ceil((Math.max(...notes)+1)/12)*12);
  const whites=[]; for(let m=lo;m<hi;m++) if(!BLACK.has(m%12)) whites.push(m);
  const kw=Math.min(22,300/whites.length), W=whites.length*kw, H=78;
  let g='';
  whites.forEach((m,i)=>{ g+=`<rect x="${i*kw}" y="0" width="${kw}" height="${H}" fill="#fff" stroke="#555" stroke-width="1"/>`; if(m%12===0) g+=`<text x="${i*kw+kw/2}" y="${H-5}" font-size="8" text-anchor="middle" fill="#777">C${m/12-1}</text>`; });
  const dots=[];
  for(let m=lo;m<hi;m++) if(BLACK.has(m%12)){ const wi=whites.indexOf(m+1); g+=`<rect x="${wi*kw-kw*.32}" y="0" width="${kw*.64}" height="${H*.6}" fill="#1B2130"/>`; }
  notes.forEach(m=>{ const blk=BLACK.has(m%12), wi=blk?whites.indexOf(m+1):whites.indexOf(m); if(wi<0) return; const x=blk?wi*kw:wi*kw+kw/2, y=blk?H*.6-9:H-18; dots.push(`<circle cx="${x}" cy="${y}" r="${Math.min(6,kw*.3)}" fill="${m===bass?'var(--lh-b)':'var(--accent)'}"/>`); });
  return `<svg viewBox="-1 -1 ${W+2} ${H+2}" width="${W+2}" height="${H+2}" role="img" aria-label="Piano keys of the chord">${g}${dots.join('')}</svg>`;
}
const INV_NAME=['Root position','1st inversion','2nd inversion','3rd inversion'];
let popState=null;
function chordSoundTb(){ return ['guitar','eguitar','uke'].includes(INST.sound)?INST.sound:INST.sound==='epiano'?'epiano':'piano'; }
function playChordNotes(midis, strum){ audio(); const t=ctx.currentTime+.03; midis.forEach((m,i)=>tone(m,t+(strum?i*.03:0),1.6,undefined,.42,false,chordSoundTb())); }
function openChordPop(el,given){
  hideChordTip();
  const name=(given||el.textContent).trim(); if(!parseChordName(name)) return;
  popState={el,name,inv:0};
  let pop=$('#chordPop');
  if(!pop){
    pop=document.createElement('div'); pop.id='chordPop'; pop.className='chord-pop'; pop.setAttribute('role','dialog'); pop.setAttribute('aria-label','Chord');
    document.body.appendChild(pop);
    pop.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b||!popState) return;
      if(b.dataset.act==='close') return closeChordPop();
      if(b.dataset.act==='prev'||b.dataset.act==='next'){ const v=chordVoicing(popState.name); popState.inv=(popState.inv+(b.dataset.act==='next'?1:-1)+v.max+1)%(v.max+1); fillChordPop(); playPopChord(); }
      if(b.dataset.act==='play') playPopChord();
    });
  }
  fillChordPop(); pop.hidden=false; placeChordPop(); playPopChord();
}
function popGuitar(){ return plucked()&&frettedShape(popState.name); }
function fillChordPop(){
  const pop=$('#chordPop'), s=popState, v=chordVoicing(s.name,s.inv), shape=popGuitar(), t=chordTones(s.name);
  const pretty=x=>x.replace(/b(?=\d|m|M|$|\/|s|a|d|7|6|9)/g,'♭').replace(/#/g,'♯');
  const notes=t.ivs.map(i=>info(((t.c.root+i)%12)+60-(INST.transpose||0)).name).join(' · ');
  const diagram=shape?stringsSvg(shape):keysSvg(v.notes,v.bass);
  const inv=shape?`<div class="cp-inv"><span>${capo?'Capo '+capo+': play the '+esc(pretty(shape.shapeName))+' shape. ':''}${shape.barre?'Barre chord: lay one finger across fret '+shape.barre:'Open chord shape'}</span></div>`
    :`<div class="cp-inv"><button type="button" class="cp-arrow" data-act="prev" aria-label="Previous inversion">‹</button><span>${INV_NAME[s.inv]}</span><button type="button" class="cp-arrow" data-act="next" aria-label="Next inversion">›</button></div>`;
  pop.innerHTML=`<button type="button" class="cp-close" data-act="close" aria-label="Close">×</button>
    <div class="cp-name">${esc(pretty(s.name))}</div>
    <div class="cp-diagram">${diagram}</div>${inv}
    <div class="cp-notes">Notes: <b>${esc(notes)}</b>${t.c.bass!=null?` · lowest note <b>${esc(info(t.c.bass+60-(INST.transpose||0)).name)}</b>`:''}</div>
    <div class="cp-explain">${(chordExplain(s.name)||'').replace(/<div class="ct-name">[\s\S]*?<\/div>\s*<div>Notes:[\s\S]*?<\/div>/,'')}</div>
    <button type="button" class="btn primary cp-play" data-act="play"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 4v16l13-8z"/></svg> Play</button>`;
}
function playPopChord(){
  const s=popState; if(!s) return;
  const shape=popGuitar();
  if(shape){ playChordNotes(shape.notes,true); return; }
  const v=chordVoicing(s.name,s.inv,false,writtenOffset()); if(v) playChordNotes(v.notes,false);
}
function placeChordPop(){
  const pop=$('#chordPop'), el=popState&&popState.el; if(!pop||!el) return;
  const r=el.getBoundingClientRect(), pw=Math.min(320,innerWidth-24); pop.style.width=pw+'px';
  const left=Math.max(12,Math.min(innerWidth-pw-12,r.left+r.width/2-pw/2)), ph=pop.offsetHeight;
  pop.style.left=left+'px'; pop.style.top=(r.bottom+8+ph<innerHeight-8?r.bottom+8:Math.max(8,r.top-ph-8))+'px';
}
function closeChordPop(){ const p=$('#chordPop'); if(p) p.hidden=true; popState=null; }
document.addEventListener('pointerdown',e=>{ if(popState&&!e.target.closest('#chordPop')&&!e.target.closest('#score .abcjs-chord')&&!e.target.closest('.cg-item')) closeChordPop(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeChordPop(); });
$('#scroller').addEventListener('scroll',()=>{ if(popState) closeChordPop(); },{passive:true});

// the chord symbols of the score with the time each one starts (for chord backing)
function buildChordLine(v){
  chordLine=[];
  const at={}; events.forEach(ev=>ev.startChars.forEach(sc=>{ if(at[sc]==null) at[sc]=ev.ms; }));
  v.lines.forEach(l=>l.staff&&l.staff.forEach(st=>(st.voices||[]).forEach(vo=>vo.forEach(e=>{
    const c=e.chord&&e.chord.find(c=>!c.position||c.position==='default');
    if(c&&at[e.startChar]!=null&&parseChordName(c.name)) chordLine.push({ms:at[e.startChar],name:c.name});
  }))));
  chordLine.sort((a,b)=>a.ms-b.ms);
  chordLine=chordLine.filter((c,i)=>!i||c.ms!==chordLine[i-1].ms);
  updateChordPlayBtn();
  if(typeof renderChordPanel==='function') setTimeout(renderChordPanel,0);
}
function chordsShowing(){ return chordLine.length>0&&(leadSheet?leadOn:chordsOn); }
function updateChordPlayBtn(){
  const b=$('#chordPlayBtn'); if(!b) return;
  b.hidden=!chordsShowing();
  b.setAttribute('aria-pressed',String(chordPlayOn));
}
// adds the chord backing to the demo's note list: each chord held until the next one (at most two bars)
function addChordBacking(list, fromMs){
  if(!chordPlayOn||!chordsShowing()) return;
  const off=writtenOffset(), last=events[events.length-1], songEnd=last?last.ms+last.gap:0;
  const tb=chordSoundTb();
  chordLine.forEach((c,i)=>{
    const end=Math.min(i+1<chordLine.length?chordLine[i+1].ms:songEnd, c.ms+msPerMeasure*2);
    if(end<=fromMs) return;
    const start=Math.max(c.ms,fromMs);
    if(plucked()&&strumUse){ addStrums(list,c.name,start,i+1<chordLine.length?Math.min(chordLine[i+1].ms,songEnd):songEnd); return; }
    let notes=null, strum=false;
    if(plucked()){ const fsh=frettedShape(c.name); if(fsh){ notes=fsh.notes; strum=true; } }
    if(!notes){ const v=chordVoicing(c.name,0,true,off); notes=v&&v.notes; }
    if(!notes) return;
    notes.forEach((m,k)=>list.push({midi:m,start:start+(strum?k*25:0),end:end-30,vel:.26,tb}));
  });
}
function setChordPlay(on){
  chordPlayOn=!!on; try{ localStorage.setItem('smc.chordPlay',chordPlayOn?'on':'off'); }catch(e){}
  updateChordPlayBtn();
  if(play){ const at=Math.max(0,play.idx); stopDemo(); startDemo(at); }
}

/* ---------- chord tools: transpose, capo, simplify, the song's chords, strumming ---------- */
let transposeSemis=0, lastAbcLoaded=null;
let capo=0, simplifyOn=(()=>{ try{ return localStorage.getItem('smc.simplify')==='on'; }catch(e){ return false; } })();
const UKE_SHAPES={ // G C E A strings
  C:[0,0,0,3],G:[0,2,3,2],Am:[2,0,0,0],F:[2,0,1,0],D:[2,2,2,0],Em:[0,4,3,2],A:[2,1,0,0],E:[4,4,4,2],Bb:[3,2,1,1],Bm:[4,2,2,2],
  Dm:[2,2,1,0],Gm:[0,2,3,1],Cm:[0,3,3,3],Fm:[1,0,1,3],'F#m':[2,1,2,0],
  E7:[1,2,0,2],G7:[0,2,1,2],C7:[0,0,0,1],A7:[0,1,0,0],D7:[2,2,2,3],B7:[2,3,2,2],
  Am7:[0,0,0,0],Dm7:[2,2,1,3],Em7:[0,2,0,2],Cmaj7:[0,0,0,2]
};
const UKE_STRINGS=[67,60,64,69];
const SHARP_N=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
function transposeName(name,semis){ // "Am7/G" up 2 -> "Bm7/A"
  const c=parseChordName(name); if(!c||!semis) return name;
  const m=String(name).replace(/♭/g,'b').replace(/♯/g,'#').match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  const r=SHARP_N[(c.root+semis+120)%12];
  return r+m[2]+(c.bass!=null?'/'+SHARP_N[(c.bass+semis+120)%12]:'');
}
function simplifyName(name){ // the plain chord a beginner would play
  const c=parseChordName(name); if(!c) return name;
  const t=c.type[1], q=/minor|half-diminished/.test(t)?'m':/^diminished/.test(t)?'dim':'';
  return c.rootName+q;
}
function simplifySrc(src){ // rewrites the chord symbols of the notation (annotations like "^text" are left alone)
  return src.replace(/"([A-G][#b♯♭]?[^"]*)"/g,(all,ch)=>parseChordName(ch)?'"'+simplifyName(ch)+'"':all);
}
function plucked(){ return ['guitar','eguitar','uke'].includes(INST.id); }
// the shape to finger (with a capo, a shape lower than the chord that sounds) and the notes it sounds
function frettedShape(name){
  const shapeName=capo?transposeName(name,-capo):name;
  if(INST.id==='uke'){ const s=simplifyName(shapeName), k=Object.keys(UKE_SHAPES).find(n=>n===shapeName.replace(/♭/g,'b').replace(/♯/g,'#'))||(UKE_SHAPES[s]?s:null);
    if(!k) return null; const frets=UKE_SHAPES[k]; return {shapeName:k, frets, barre:0, strings:UKE_STRINGS, names:'GCEA', notes:frets.map((f,i)=>UKE_STRINGS[i]+f+capo)}; }
  if(INST.id==='guitar'||INST.id==='eguitar'){ const sh=guitarShape(shapeName); if(!sh) return null;
    return {shapeName, frets:sh.frets, barre:sh.barre, strings:GTR_STRINGS, names:'EADGBE', notes:sh.frets.map((f,i)=>f<0?null:GTR_STRINGS[i]+f+capo).filter(m=>m!=null)}; }
  return null;
}
function stringsSvg(shape,size=150){ // chord box for any number of strings
  const fr=shape.frets, N=fr.length, used=fr.filter(f=>f>0), lo=Math.min(...used,99), start=Math.max(...fr)<=4?1:lo;
  const W=150, H=150, x0=N>4?22:34, y0=28, sw=(W-2*x0)/(N-1), fh=22;
  let g='';
  for(let i=0;i<N;i++) g+=`<line x1="${x0+i*sw}" x2="${x0+i*sw}" y1="${y0}" y2="${y0+5*fh}" stroke="var(--ink)" stroke-width="1.2"/>`;
  for(let k=0;k<=5;k++) g+=`<line x1="${x0}" x2="${x0+(N-1)*sw}" y1="${y0+k*fh}" y2="${y0+k*fh}" stroke="var(--ink)" stroke-width="${k===0&&start===1?4:1.2}"/>`;
  if(start>1) g+=`<text x="${x0-6}" y="${y0+fh*.65}" font-size="11" text-anchor="end" fill="var(--muted)">${start}fr</text>`;
  if(shape.barre){ const bs=fr.findIndex(f=>f===shape.barre); g+=`<rect x="${x0+bs*sw-7}" y="${y0+(shape.barre-start+.5)*fh-7}" width="${(N-1-bs)*sw+14}" height="14" rx="7" fill="var(--accent)"/>`; }
  fr.forEach((f,i)=>{ const x=x0+i*sw;
    if(f<0) g+=`<text x="${x}" y="${y0-8}" font-size="12" text-anchor="middle" fill="var(--muted)">×</text>`;
    else if(f===0) g+=`<circle cx="${x}" cy="${y0-12}" r="4.5" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
    else if(!(shape.barre&&f===shape.barre)) g+=`<circle cx="${x}" cy="${y0+(f-start+.5)*fh}" r="7" fill="var(--accent)"/>`; });
  shape.names.split('').forEach((s,i)=>g+=`<text x="${x0+i*sw}" y="${H-4}" font-size="10" text-anchor="middle" fill="var(--muted)">${s}</text>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${size}" height="${size}" role="img" aria-label="Chord shape">${g}</svg>`;
}

// ---- strumming patterns (D = down, U = up, x = muted "chick", . = miss the strings) ----
const STRUMS=[
  {id:'folk',name:'Folk pop',meter:'4/4',sub:2,steps:'D.DU.UDU',acc:[0,4]},
  {id:'downs',name:'Steady down strums',meter:'4/4',sub:2,steps:'D.D.D.D.',acc:[0]},
  {id:'rock',name:'Rock eighths',meter:'4/4',sub:2,steps:'DUDUDUDU',acc:[2,6]},
  {id:'ballad',name:'Ballad',meter:'4/4',sub:2,steps:'D.D.DUDU',acc:[0]},
  {id:'chop',name:'Reggae off-beat',meter:'4/4',sub:2,steps:'.U.U.U.U',acc:[]},
  {id:'funk',name:'Muted groove',meter:'4/4',sub:2,steps:'DxDUxUDU',acc:[0]},
  {id:'triplet',name:'Triplet ballad',meter:'4/4',sub:3,steps:'D..D..D..DDD',acc:[0]},
  {id:'shuffle',name:'Shuffle',meter:'4/4',sub:3,steps:'D.UD.UD.UD.U',acc:[3,9]},
  {id:'waltz',name:'Waltz',meter:'3/4',sub:2,steps:'D.DUDU',acc:[0]},
  {id:'waltz2',name:'Waltz, down strums',meter:'3/4',sub:2,steps:'D.D.D.',acc:[0]},
  {id:'six8',name:'6/8 lilt',meter:'6/8',sub:3,steps:'DDUDDU',acc:[0,3]},
  {id:'six8b',name:'6/8 basic',meter:'6/8',sub:3,steps:'D..D..',acc:[0,3]},
  {id:'two4',name:'Polka',meter:'2/4',sub:2,steps:'D.DU',acc:[0]},
  {id:'twelve8',name:'12/8 slow blues',meter:'12/8',sub:3,steps:'D.UD.UD.UD.U',acc:[0,6]},
];
let strumId=(()=>{ try{ return localStorage.getItem('smc.strum')||''; }catch(e){ return ''; } })();
let strumUse=(()=>{ try{ return localStorage.getItem('smc.strumUse')!=='off'; }catch(e){ return true; } })();
function meterKey(){ return meter.num+'/'+meter.den; }
function strumsForMeter(){ const k=meterKey(); const l=STRUMS.filter(s=>s.meter===k); return l.length?l:STRUMS.filter(s=>s.meter==='4/4'); }
function currentStrum(){ const l=strumsForMeter(); return l.find(s=>s.id===strumId)||l[0]; }
function strumSvg(p){
  const n=p.steps.length, sw=26, W=n*sw+8, H=p.sub===3?84:74, beats=n/p.sub;
  let g='';
  [...p.steps].forEach((c,i)=>{
    const x=6+i*sw+sw/2;
    if(c==='D'||c==='U'){ const y1=c==='D'?16:46, y2=c==='D'?46:16; g+=`<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2-(c==='D'?6:-6)}" stroke="var(--ink)" stroke-width="2"/><path d="${c==='D'?`M${x-5} ${y2-7} L${x} ${y2} L${x+5} ${y2-7}`:`M${x-5} ${y2+7} L${x} ${y2} L${x+5} ${y2+7}`}" fill="var(--ink)"/>`; }
    if(c==='x') g+=`<text x="${x}" y="38" font-size="16" text-anchor="middle" fill="var(--ink)">×</text>`;
    if(p.acc.includes(i)&&c!=='.') g+=`<text x="${x}" y="11" font-size="12" text-anchor="middle" fill="var(--now)" font-weight="700">&gt;</text>`;
    const beat=Math.floor(i/p.sub)+1, pos=i%p.sub;
    const lbl=p.sub===2?(pos?'&':beat):p.sub===4?(pos===0?beat:['','e','&','a'][pos]):(pos?'':beat);
    if(lbl!=='') g+=`<text x="${x}" y="62" font-size="12" text-anchor="middle" fill="var(--muted)">${lbl}</text>`;
  });
  for(let b=0;b<beats;b++){ const x1=6+b*p.sub*sw+6, x2=6+(b+1)*p.sub*sw-6;
    if(p.sub===3) g+=`<path d="M${x1} 68 v6 H${x2} v-6" fill="none" stroke="var(--muted)"/><text x="${(x1+x2)/2}" y="83" font-size="10" text-anchor="middle" fill="var(--muted)">3</text>`;
    else g+=`<line x1="${x1}" x2="${x2}" y1="68" y2="68" stroke="var(--muted)" stroke-width="2"/>`; }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Strumming pattern ${esc(p.name)}">${g}</svg>`;
}
function strumNotes(name){ // notes of one strum, lowest string first
  const fs=plucked()&&frettedShape(name); if(fs) return fs.notes;
  const v=chordVoicing(name,0,false,writtenOffset()); return v?v.notes:null;
}
// puts one bar-worth (or more) of strums into a note list, in score milliseconds
function addStrums(list,name,startMs,endMs,velMul=1){
  const notes=strumNotes(name); if(!notes) return;
  const p=currentStrum(), bm=beatMs(), stepMs=bm/p.sub, n=p.steps.length, tb=chordSoundTb();
  let k=Math.ceil((startMs-barOrigin)/stepMs-1e-6);
  for(;;k++){
    const at=barOrigin+k*stepMs; if(at>=endMs-10) break;
    const c=p.steps[((k%n)+n)%n]; if(c==='.') continue;
    const acc=p.acc.includes(((k%n)+n)%n), vel=(acc?.34:.24)*velMul;
    let nxt=k+1; while(nxt<k+n&&p.steps[((nxt%n)+n)%n]==='.') nxt++;
    const until=Math.min(endMs-20,barOrigin+nxt*stepMs+40);
    if(c==='x'){ notes.forEach((m,i)=>list.push({midi:m,start:at+i*6,end:at+60,vel:vel*.5,tb})); continue; }
    const order=c==='D'?notes:notes.slice().reverse().slice(0,Math.min(notes.length,4));
    order.forEach((m,i)=>list.push({midi:m,start:at+i*(c==='D'?11:9),end:until,vel:vel*(c==='U'?.8:1),tb}));
  }
}
function previewStrum(){
  audio();
  const at=events[cur]?events[cur].ms:0, c=chordLine.filter(x=>x.ms<=at+1).pop()||chordLine[0];
  const name=c?c.name:(keyMinor?SHARP_N[keyTonic]+'m':SHARP_N[keyTonic]);
  const list=[]; addStrums(list,name,barOrigin,barOrigin+msPerMeasure*2-1,1.2);
  const t0=ctx.currentTime+.08, sp=speed();
  list.forEach(n=>tone(n.midi,t0+(n.start-barOrigin)/1000/sp,Math.max(.08,(n.end-n.start)/1000/sp),undefined,n.vel,false,n.tb));
}

// ---- the panel ----
function renderChordPanel(){
  const box=$('#chordsPanel'); if(!box) return;
  $('#trVal').textContent=(transposeSemis>0?'+':'')+transposeSemis;
  $('#capoLbl').hidden=!plucked();
  $('#capoSel').value=String(capo);
  $('#simplifyBtn').setAttribute('aria-pressed',String(simplifyOn));
  const names=[...new Set(chordLine.map(c=>c.name))];
  const grid=$('#chordGrid');
  if(!names.length){ grid.innerHTML='<p class="small">No chord symbols in this score. Turn on "Suggest chords" to add some.</p>'; }
  else grid.innerHTML=names.map(n=>{
    const fs=plucked()&&frettedShape(n), v=chordVoicing(n,0);
    const pic=fs?stringsSvg(fs,96):v?keysSvg(v.notes,v.bass):'';
    const sub=fs&&capo?`<span class="cg-sub">${esc(fs.shapeName.replace(/b/g,'♭').replace(/#/g,'♯'))} shape</span>`:'';
    return `<button type="button" class="cg-item" data-chord="${esc(n)}"><b>${esc(n.replace(/b(?=$|m|7|6|9|\/|s|a|d|M)/g,'♭').replace(/#/g,'♯'))}</b>${sub}<span class="cg-pic">${pic}</span></button>`;
  }).join('');
  const sb=$('#strumBox'); sb.hidden=!plucked();
  if(plucked()){
    const l=strumsForMeter(), p=currentStrum();
    $('#strumSel').innerHTML=l.map(s=>`<option value="${s.id}"${s===p?' selected':''}>${esc(s.name)}</option>`).join('');
    $('#strumDiagram').innerHTML=strumSvg(p);
    $('#strumBpm').textContent=Math.round(tuneBpm*speedF)+' bpm';
    $('#strumUse').checked=strumUse;
  }
}
function wireChordPanel(){
  $('#trDown').onclick=()=>{ transposeSemis=Math.max(-11,transposeSemis-1); reloadKeep(); };
  $('#trUp').onclick=()=>{ transposeSemis=Math.min(11,transposeSemis+1); reloadKeep(); };
  $('#trReset').onclick=()=>{ if(transposeSemis){ transposeSemis=0; reloadKeep(); } };
  $('#capoSel').onchange=e=>{ capo=+e.target.value; renderChordPanel(); if(popState) fillChordPop(); };
  $('#simplifyBtn').onclick=()=>{ simplifyOn=!simplifyOn; try{ localStorage.setItem('smc.simplify',simplifyOn?'on':'off'); }catch(e){} reloadKeep(); };
  $('#chordGrid').onclick=e=>{ const b=e.target.closest('[data-chord]'); if(b) openChordPop(b,b.dataset.chord); };
  $('#strumSel').onchange=e=>{ strumId=e.target.value; try{ localStorage.setItem('smc.strum',strumId); }catch(x){} renderChordPanel(); previewStrum(); };
  $('#strumPlay').onclick=previewStrum;
  $('#strumUse').onchange=e=>{ strumUse=e.target.checked; try{ localStorage.setItem('smc.strumUse',strumUse?'on':'off'); }catch(x){} };
}

// abcjs's automatic line wrapping numbers every bar even when asked for row starts only,
// so keep just the number at the left edge of each row and drop the rest.
function trimBarNumbers(){
  const rows={};
  document.querySelectorAll('#score .abcjs-bar-number').forEach(el=>{
    const row=[...el.classList].find(c=>/^abcjs-l\d+$/.test(c))||'x';
    const x=parseFloat(el.getAttribute('x'));
    (rows[row]=rows[row]||[]).push({el, x:isNaN(x)?el.getBBox().x:x});
  });
  Object.values(rows).forEach(list=>{
    list.sort((a,b)=>a.x-b.x);
    list.forEach((n,i)=>{ if(i>0||n.x>60) n.el.remove(); });
  });
}
function loadAbc(abc){
  stopDemo(); resumeIdx=null; if(typeof setPlayBtn==='function'&&$('#dockPlay')) setPlayBtn(false);
  const L=scoreLayout(); lastLayout=L.key;
  if(abc!==lastAbcLoaded){ transposeSemis=0; lastAbcLoaded=abc; }
  const src=withBarNumbers(simplifyOn?simplifySrc(abc):abc), opts0=/^Q:/m.test(src)?{}:{qpm:100};
  let v=renderScore(src,L), drawn=src;
  leadSheet=!!(v&&v.lines&&hasChordSymbols(v));
  if(chordsOn&&!leadSheet&&v&&v.lines&&v.lines.some(l=>l.staff)){
    try{ const withCh=addChords(v,src,opts0); if(withCh){ const v2=renderScore(withCh,L); if(v2&&v2.lines&&v2.lines.some(l=>l.staff)){ v=v2; drawn=withCh; } else v=renderScore(src,L); } }
    catch(e){ console.warn('chords',e); v=renderScore(src,L); }
  }
  partShift=0;
  if(v&&v.lines&&v.lines.some(l=>l.staff)){
    try{
      let src2=drawn, vt=transposeSemis;
      if(INST.part!=='both'){ partShift=partShiftFor(v,opts0); src2=withInstClef(drawn,v); vt+=partShift+INST.transpose; }
      if(vt||src2!==drawn){ const v3=renderScore(src2,L,vt); if(v3&&v3.lines&&v3.lines.some(l=>l.staff)) v=v3; }
    }catch(e){ console.warn('instrument',e); }
  }
  if(!v||!v.lines||!v.lines.some(l=>l.staff)) throw new Error('No music found in that notation.');
  trimBarNumbers(); hideChordTip(); wireChordTips(); updateChordBtn();
  { const k=v.lines.find(l=>l.staff).staff[0].key||{}, LET={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    keyTonic=((LET[(k.root||'C')[0]]??0)+(k.acc==='#'?1:k.acc==='b'?-1:0)+12)%12; keyMinor=k.mode==='m'; }
  const hasTempo=!!(v.metaText&&v.metaText.tempo);
  try{ v.setUpAudio(hasTempo?{}:{qpm:100}); }catch(e){}
  const timer=new ABCJS.TimingCallbacks(v, hasTempo?{}:{qpm:100});
  const nt=(timer.noteTimings||[]).filter(e=>e.type==='event');
  if(!nt.length) throw new Error('The notation has no notes to play.');
  vis=v; $('#abcText').value=abc;
  tuneBpm=hasTempo&&v.getBpm?v.getBpm():100;
  setSpeed(1,'load');
  msPerMeasure=barMsOf(v,timer)|| (nt[1]?nt[1].milliseconds*4:2400);
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
      return {midi:p.pitch+transposeSemis, ms:whole/measureWhole*msPerMeasure, whole, vol:typeof p.volume==='number'?p.volume:95};
    }).sort((a,b)=>b.midi-a.midi);
    return {ms:e.milliseconds, gap, els:(e.elements||[]).flat(), pitches, startChars:e.startCharArray||[e.startChar]};
  });
  applyPart(events);
  closeChordPop(); buildChordLine(v);
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
  // where bar 1's downbeat falls (after a pickup bar), so metronome clicks line up with the bars
  const mmStart={};
  events.forEach(e=>{ const el=e.els[0], c=(el&&el.getAttribute&&el.getAttribute('class'))||'', m=c.match(/abcjs-mm(\d+)/); if(m) mmStart[m[1]]=Math.min(mmStart[m[1]]??Infinity,e.ms); });
  barOrigin=mmStart[1]!=null?mmStart[1]-msPerMeasure:0;
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
function nextIdx(i,dir){ let j=i+dir; while(j>=0&&j<events.length&&!events[j].pitches.length&&(events[j].els.length===0||events[j].backingOnly)) j+=dir; return Math.max(0,Math.min(events.length-1,j)); }

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
  if(INST.view!=='piano') return renderInstLesson(ev);
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
    const add=(p,tb,mul)=>{
      let endMs=ev.ms+Math.max(100,p.ms-20);
      if(win>0&&tb==='piano'){ const change=(Math.floor((ev.ms+1)/win)+1)*win-30; endMs=Math.max(endMs,change); }
      list.push({midi:p.midi,start:ev.ms,end:endMs,vel:(.35+.4*(p.vol/127))*mul,tb});
    };
    ev.pitches.forEach(p=>add(p,INST.sound,1));
    (ev.accomp||[]).forEach(p=>add(p,'piano',.45));
  }
  addChordBacking(list, base);
  if(win>0){ const last={}; list.filter(n=>n.tb==='piano').sort((a,b)=>a.start-b.start).forEach(n=>{ const prev=last[n.midi]; if(prev&&prev.end>n.start) prev.end=Math.max(prev.start+60,n.start-10); last[n.midi]=n; }); }
  if(win>0&&pedalIn) bus.connect(pedalIn); // the demo's notes share the pedal resonance (and stop with the demo)
  // notes are handed to the audio engine a few seconds ahead as the song plays, not all at once:
  // a long piece would otherwise create thousands of sound objects up front, which makes phones and
  // iPads stutter and can crash the page
  list.sort((a,b)=>a.start-b.start);
  const last=events[events.length-1];
  const endT=t0+((last.ms-base)+last.gap)/1000/sp+.3;
  metroStopFree();
  play={bus,t0,base,sp,idx:from-1,endT,endMs:last.ms+last.gap,raf:0,list,next:0,pedal:win>0,timer:0,beat:null};
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
/* ---------- metronome ----------
   Clicks every beat, the first beat of each bar higher. While the demo plays, the clicks are scheduled
   with the music (same lookahead) so they stay exactly on the beat; otherwise it ticks on its own at the
   current tempo. Compound time (6/8, 9/8, 12/8) clicks the dotted-quarter beat. */
let metroOn=false, metroFree=null, metroBus=null, barOrigin=0;
function beatsPerBar(){ return (meter.den===8&&meter.num%3===0&&meter.num>3)?meter.num/3:meter.num; }
function beatMs(){ return msPerMeasure/beatsPerBar(); }
function metroOut(){ if(!metroBus){ metroBus=ctx.createGain(); metroBus.gain.value=1; metroBus.connect(master); } return metroBus; }
function metroCut(){ if(!metroBus) return; const b=metroBus; metroBus=null; try{ b.gain.setTargetAtTime(0,ctx.currentTime,.01); setTimeout(()=>b.disconnect(),200); }catch(e){} }
function metroClick(at,accent){
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type='triangle'; o.frequency.value=accent?1760:1175;
  g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(accent?.55:.35,at+.002); g.gain.exponentialRampToValueAtTime(0.0001,at+.06);
  o.connect(g); g.connect(metroOut()); o.start(at); o.stop(at+.08);
  const b=$('#metroBtn'); if(b) setTimeout(()=>{ if(!metroOn) return; b.classList.toggle('accent',accent); b.classList.add('tick'); setTimeout(()=>b.classList.remove('tick'),90); },Math.max(0,(at-ctx.currentTime)*1000));
}
function metroDemo(p,until){ // called from scheduleAhead while the demo plays
  if(!metroOn){ p.beat=null; return; }
  const bm=beatMs(), bpb=beatsPerBar();
  if(p.beat==null){ const nowMs=Math.max(p.base,(ctx.currentTime-p.t0)*1000*p.sp+p.base); p.beat=Math.ceil((nowMs-barOrigin)/bm-1e-6); }
  for(;;){
    const ms=barOrigin+p.beat*bm; if(ms>p.endMs) break;
    const at=p.t0+(ms-p.base)/1000/p.sp; if(at>until) break;
    if(at>=ctx.currentTime-.02) metroClick(at,((p.beat%bpb)+bpb)%bpb===0);
    p.beat++;
  }
}
function metroFreeTick(){
  const f=metroFree; if(!f) return;
  if(!metroOn||play||MIC.on){ metroStopFree(); return; }
  while(f.next<ctx.currentTime+.3){ metroClick(f.next,f.k%beatsPerBar()===0); f.k++; f.next+=beatMs()/1000/speed(); }
}
function metroStartFree(){ if(metroFree||!metroOn||play||MIC.on||!events.length) return; audio(); metroFree={next:ctx.currentTime+.12,k:0,timer:setInterval(metroFreeTick,50)}; metroFreeTick(); }
function metroStopFree(){ if(!metroFree) return; clearInterval(metroFree.timer); metroFree=null; metroCut(); }
function setMetro(on){
  metroOn=!!on;
  const b=$('#metroBtn'); if(b){ b.setAttribute('aria-pressed',String(metroOn)); b.classList.remove('tick','accent'); }
  if(!metroOn){ metroStopFree(); metroCut(); if(play) play.beat=null; }
  else if(!play) metroStartFree();
}
const LOOKAHEAD=2.5; // seconds of music queued in the audio engine
function scheduleAhead(){
  if(!play) return;
  const p=play, until=ctx.currentTime+LOOKAHEAD;
  while(p.next<p.list.length){
    const n=p.list[p.next], at=p.t0+(n.start-p.base)/1000/p.sp;
    if(at>until) break;
    if(at>=ctx.currentTime-0.05) tone(n.midi,at,Math.max(.1,(n.end-n.start)/1000/p.sp),p.bus,n.vel,p.pedal&&n.tb==='piano',n.tb);
    p.next++;
  }
  metroDemo(p,until);
}
let resumeIdx=null; // where Play continues after a pause
function pauseDemo(){ if(!play) return; resumeIdx=Math.max(0,play.idx); stopDemo(); goTo(resumeIdx,false); setPlayBtn(false); }
function playOrResume(){ if(play) return pauseDemo(); const from=resumeIdx!=null?resumeIdx:firstNoteIndex(); resumeIdx=null; startDemo(from); }
function stopDemo(){
  if(!play) return;
  cancelAnimationFrame(play.raf); clearInterval(play.timer); metroCut();
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
$('#metroBtn').onclick=()=>setMetro(!metroOn);
$('#chordPlayBtn').onclick=()=>setChordPlay(!chordPlayOn);
$('#chordBtn').onclick=()=>{
  if(leadSheet){ setChords(!leadOn); return; }      // the sheet's own chords: just show or hide them
  if(play) pauseDemo(); setChords(!chordsOn); reloadKeep();
};
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
  $('#rollBtn').innerHTML=(on?'Hide':'Show')+' <span class="opt">falling </span>notes';
  $('#rollBtn').setAttribute('aria-pressed',String(on));
  try{ localStorage.setItem('smc.roll',on?'1':'0'); }catch(e){}
  if(on) requestAnimationFrame(measureKeys);
}
$('#rollBtn').onclick=()=>setRoll(!rollOn);
let pianoOpen=true;
function setPiano(open){
  pianoOpen=open;
  $('.dock').classList.toggle('collapsed',!open);
  const what=INST.view==='piano'?'piano':'guide';
  $('#pianoBtn').textContent=open?'Hide '+what+' ▾':'Show '+what+' ▴';
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
Object.keys(SAMPLES).forEach(k=>{ if(!SAMPLE_NAMES[k]) SAMPLE_NAMES[k]=(SAMPLES[k].match(/^T:(.*)$/m)||[0,k])[1].trim(); });
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
  // only the samples for the instrument you picked (pick another instrument to see its samples)
  const ks=Object.keys(SAMPLES).filter(k=>(SAMPLE_FOR[k]||'piano')===INST.id);
  if(ks.length) h+=`<optgroup label="Samples for ${esc(INST.name)}">`+ks.map(k=>`<option value="s:${k}">${esc(SAMPLE_NAMES[k])}</option>`).join('')+'</optgroup>';
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
    if(v.startsWith('s:')){ const k=v.slice(2), want=SAMPLE_FOR[k]; if(want&&want!==INST.id&&want!=='piano') setInstrument(want,true); loadAbc(SAMPLES[k]); }
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

// your instrument: build the picker and set up the page for it
wireChordPanel(); buildInstPicker(); applyInstUI();
$('#instSample').onclick=e=>{ const k=e.currentTarget.dataset.k; if(!k) return; try{ loadAbc(SAMPLES[k]); currentSong='s:'+k; fillSongs(); showView('score'); setStatus(''); }catch(err){ setStatus(esc(err.message),'err'); } };
