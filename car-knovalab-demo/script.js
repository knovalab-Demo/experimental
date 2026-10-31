(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,body=document.body;
const speedEl=$('#speed'),rpmEl=$('#rpm'),car=$('#car'),wrap=$('#carWrap'),refl=$('#car-reflection');
let spins=[],idle=800,parked=false,ang=0;

/* ---------- sound: ignition button starts the engine; speaker button mutes ---------- */
const SK='ckd-snd',sBtn=$('#sound'),iBtn=$('#ignite');let soundOn=localStorage.getItem(SK)!=='0',engine=false,ctx,master,idleG,idleO=[];
const MASTER=.32;let mi=+localStorage.getItem('ckd-mode')||0,lpF,lfoO,lfoG,revT;
// Performance = balanced, Comfort = deep and heavy, Track = high-pitched, raspy, fast
const PR=[{pitch:1,lp:260,lfo:7,lg:.12,vol:1,rev:0},{pitch:.62,lp:170,lfo:3,lg:.07,vol:1.45,rev:0},{pitch:2.3,lp:1100,lfo:24,lg:.22,vol:1.1,rev:1}];
function applyMode(){if(!ctx)return;const p=PR[mi],t=ctx.currentTime;
  idleO.forEach(([o,f])=>o.frequency.setTargetAtTime(f*p.pitch,t,.15));lpF.frequency.setTargetAtTime(p.lp,t,.15);
  lfoO.frequency.setTargetAtTime(p.lfo,t,.15);lfoG.gain.setTargetAtTime(p.lg,t,.15);
  if(engine&&soundOn)master.gain.setTargetAtTime(Math.min(MASTER*p.vol,.5),t,.1);
  clearInterval(revT);if(p.rev&&engine)revT=setInterval(()=>{if(!engine)return;const n=ctx.currentTime;
    idleO.forEach(([o,f])=>{o.frequency.cancelScheduledValues(n);o.frequency.setValueAtTime(o.frequency.value,n);o.frequency.linearRampToValueAtTime(f*p.pitch*1.9,n+.18);o.frequency.exponentialRampToValueAtTime(f*p.pitch,n+.55);});},900);}
function build(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();
  master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lpF=lp;lp.frequency.value=PR[mi].lp;idleG=ctx.createGain();idleG.gain.value=0;
  [[46,'sawtooth',1],[69,'triangle',.5],[92,'sawtooth',.3],[23,'sine',.9]].forEach(([f,t,g])=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type=t;o.frequency.value=f*PR[mi].pitch;og.gain.value=g;o.connect(og).connect(lp);o.start();idleO.push([o,f]);});
  const lfo=ctx.createOscillator(),lg=ctx.createGain();lfoO=lfo;lfoG=lg;lfo.frequency.value=PR[mi].lfo;lg.gain.value=PR[mi].lg;lfo.connect(lg).connect(idleG.gain);lfo.start();lp.connect(idleG).connect(master);}
function ignition(){const t=ctx.currentTime;
  const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();
  o.type='sawtooth';const P=PR[mi];o.frequency.setValueAtTime(24*Math.min(P.pitch,1.4),t);o.frequency.linearRampToValueAtTime(38*Math.min(P.pitch,1.4),t+1);f.type='lowpass';f.frequency.value=420;
  l.frequency.value=10;lg.gain.value=.5;g.gain.setValueAtTime(.6,t);g.gain.setValueAtTime(.6,t+.95);g.gain.linearRampToValueAtTime(0,t+1.1);
  l.connect(lg).connect(g.gain);o.connect(f).connect(g).connect(master);o.start(t);l.start(t);o.stop(t+1.2);l.stop(t+1.2);
  idleG.gain.cancelScheduledValues(t);idleG.gain.setValueAtTime(0,t);idleG.gain.setValueAtTime(0,t+1);idleG.gain.linearRampToValueAtTime(1,t+1.12);
  idleO.forEach(([x,f])=>{const b=f*P.pitch;x.frequency.cancelScheduledValues(t);x.frequency.setValueAtTime(b*1.8,t+1);x.frequency.linearRampToValueAtTime(b*(P.rev?2.6:3),t+1.35);x.frequency.exponentialRampToValueAtTime(b,t+2.4);});setTimeout(applyMode,2500);}
function paint(){sBtn.setAttribute('aria-pressed',soundOn);$('#soundLabel').textContent=soundOn?'Sound On':'Sound Off';
  iBtn.setAttribute('aria-pressed',engine);iBtn.classList.toggle('run',engine);$('#ignLabel').textContent=engine?'Engine on':'Ignition';}
iBtn.addEventListener('click',e=>{e.stopPropagation();build();
  if(!engine){soundOn=true;localStorage.setItem(SK,'1');ctx.resume().then(()=>{master.gain.setTargetAtTime(Math.min(MASTER*PR[mi].vol,.5),ctx.currentTime,.05);ignition();});engine=true;dispatchEvent(new Event('ckd-ignite'));}
  else{engine=false;clearInterval(revT);idleG.gain.setTargetAtTime(0,ctx.currentTime,.25);}
  paint();});
sBtn.addEventListener('click',e=>{e.stopPropagation();soundOn=!soundOn;localStorage.setItem(SK,soundOn?'1':'0');if(ctx)master.gain.setTargetAtTime(soundOn?Math.min(MASTER*PR[mi].vol,.5):0,ctx.currentTime,.08);paint();});
paint();

/* ---------- menu ---------- */
const mb=$('#menuBtn'),mp=$('#menu'),tm=o=>{mp.hidden=!o;mb.setAttribute('aria-expanded',o)};
mb.addEventListener('click',e=>{e.stopPropagation();tm(mp.hidden)});addEventListener('click',e=>{if(!mp.contains(e.target))tm(false)});
addEventListener('keydown',e=>e.key==='Escape'&&tm(false));

/* ---------- page transition ---------- */
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.metaKey||e.ctrlKey||a.target)return;
  const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname||!/\.html$|\/$/.test(u.pathname))return;
  e.preventDefault();body.classList.add('leaving');setTimeout(()=>location.href=a.href,reduce?0:260);});
addEventListener('pageshow',e=>e.persisted&&body.classList.remove('leaving'));

/* ---------- reveal, section progress, background tire ---------- */
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target)}}),{threshold:.15});
$$('.rv').forEach(n=>rio.observe(n));
const dots=$$('.rail .d');
if(dots.length){const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const i=+e.target.dataset.sec;$('#secNum').textContent='0'+(i+1);dots.forEach((d,j)=>d.classList.toggle('on',j===i));}),{threshold:.5});$$('[data-sec]').forEach(s=>io.observe(s));}
const bg=$('.bgspin');let tick=false;
if(bg&&!reduce){const sp=()=>{bg.style.transform='rotate('+(scrollY*.12)%360+'deg)';requestAnimationFrame(sp)};requestAnimationFrame(sp);}

/* ---------- contact form (opens the visitor's email app) ---------- */
const cf=$('#cform');if(cf)cf.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(cf);
  location.href='mailto:sidddmailbox@gmail.com?subject='+encodeURIComponent('car.k.d enquiry from '+d.get('n'))+'&body='+encodeURIComponent(d.get('m')+'\n\n'+d.get('n')+'\n'+d.get('e'));
  $('#fnote').textContent='Opening your email app. If nothing opens, write to sidddmailbox@gmail.com.';});

/* ---------- home hero: rolling wheels (car stays parked) ---------- */
if(!car)return;
const rot=a=>spins.forEach(s=>s.setAttribute('transform','rotate('+a%360+')'));
fetch('assets/car.svg').then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>{
  if(!/<svg/i.test(t))throw 0;car.innerHTML=t;refl.innerHTML=t.replace(/ id="/g,' data-id="');
  spins=[...car.querySelectorAll('.spin'),...refl.querySelectorAll('.spin')];
  (document.fonts?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(start,reduce?0:300));
}).catch(()=>{$('#loader').classList.add('out');body.classList.add('typed');});
let busy=false;
function spinUp(dur,peak){if(busy||reduce)return;busy=true;const t0=performance.now();
  const f=ts=>{const p=Math.min((ts-t0)/dur,1),v=peak*Math.pow(1-p,2.2)+0,dt=1/60;ang+=v*dt;rot(ang);
    const kmh=Math.round(v/peak*120);speedEl.textContent=kmh;rpmEl.textContent=Math.round(idle+kmh*38);
    if(p<1)requestAnimationFrame(f);else{busy=false;speedEl.textContent=0;rpmEl.textContent=idle;}};requestAnimationFrame(f);}
function start(){$('#loader').classList.add('out');
  wrap.style.cssText+=';opacity:0;transform:translateY(30px);transition:opacity 1s,transform 1.2s cubic-bezier(.2,.7,.2,1)';
  requestAnimationFrame(()=>{wrap.style.opacity=1;wrap.style.transform='none'});
  spinUp(3200,1500);setTimeout(()=>{body.classList.add('typed');parked=true},reduce?0:900);}
wrap.addEventListener('click',()=>spinUp(2400,1200));addEventListener('ckd-ignite',()=>spinUp(2600,1400));
setInterval(()=>{if(parked&&!busy)rpmEl.textContent=idle+Math.round((Math.random()-.5)*26)},140);
const modes=[['Performance',800],['Comfort',700],['Track',950]];$('#modeName').textContent=modes[mi][0];idle=modes[mi][1];rpmEl.textContent=idle;
$('#mode').addEventListener('click',()=>{mi=(mi+1)%3;localStorage.setItem('ckd-mode',mi);applyMode();$('#modeName').textContent=modes[mi][0];idle=modes[mi][1];rpmEl.textContent=idle;});
})();
