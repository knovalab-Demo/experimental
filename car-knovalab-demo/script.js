(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,body=document.body;
const speedEl=$('#speed'),rpmEl=$('#rpm'),car=$('#car'),wrap=$('#carWrap'),refl=$('#car-reflection');
let spins=[],idle=800,parked=false,ang=0;

/* ---------- sound: on by default, ignition once per visit ---------- */
const SK='ckd-snd',sBtn=$('#sound');let on=localStorage.getItem(SK)!=='0',ctx,master,idleG,idleO=[];
const MASTER=.3;
function build(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();
  master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;idleG=ctx.createGain();idleG.gain.value=0;
  [[46,'sawtooth',1],[69,'triangle',.5],[92,'sawtooth',.3]].forEach(([f,t,g])=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type=t;o.frequency.value=f;og.gain.value=g;o.connect(og).connect(lp);o.start();idleO.push([o,f]);});
  const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=7;lg.gain.value=.12;lfo.connect(lg).connect(idleG.gain);lfo.start();
  lp.connect(idleG).connect(master);}
function ignition(){const t=ctx.currentTime;   // starter crank, catch, rev blip, settle to idle
  const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(24,t);o.frequency.linearRampToValueAtTime(38,t+1);f.type='lowpass';f.frequency.value=420;
  l.frequency.value=10;lg.gain.value=.5;g.gain.setValueAtTime(.6,t);g.gain.setValueAtTime(.6,t+.95);g.gain.linearRampToValueAtTime(0,t+1.1);
  l.connect(lg).connect(g.gain);o.connect(f).connect(g).connect(master);o.start(t);l.start(t);o.stop(t+1.2);l.stop(t+1.2);
  idleG.gain.cancelScheduledValues(t);idleG.gain.setValueAtTime(0,t);idleG.gain.setValueAtTime(0,t+1);idleG.gain.linearRampToValueAtTime(1,t+1.12);
  idleO.forEach(([x,b])=>{x.frequency.setValueAtTime(b*1.8,t+1);x.frequency.linearRampToValueAtTime(b*3,t+1.35);x.frequency.exponentialRampToValueAtTime(b,t+2.4);});}
function play(){if(!on)return;build();ctx.resume().then(()=>{if(ctx.state!=='running')return;
  master.gain.setTargetAtTime(MASTER,ctx.currentTime,.1);
  if(!sessionStorage.getItem('ckd-ign')){sessionStorage.setItem('ckd-ign','1');ignition();}else idleG.gain.setTargetAtTime(1,ctx.currentTime,.3);
  ['pointerdown','keydown','touchend','click'].forEach(e=>removeEventListener(e,play));}).catch(()=>{});}
function paint(){sBtn.setAttribute('aria-pressed',on);$('#soundLabel').textContent=on?'Sound On':'Sound Off';}
sBtn.addEventListener('click',e=>{e.stopPropagation();on=!on;localStorage.setItem(SK,on?'1':'0');paint();
  if(on){build();ctx.resume();master.gain.setTargetAtTime(MASTER,ctx.currentTime,.1);idleG.gain.setTargetAtTime(1,ctx.currentTime,.3);sessionStorage.getItem('ckd-ign')||play();}
  else if(ctx){master.gain.setTargetAtTime(0,ctx.currentTime,.1);}});
paint();
if(on){play();['pointerdown','keydown','touchend','click'].forEach(e=>addEventListener(e,play));} // browsers need one gesture if autoplay is blocked

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
if(bg&&!reduce){const sp=()=>{bg.style.transform='rotate('+(scrollY*.18+performance.now()/220)%360+'deg)';requestAnimationFrame(sp)};requestAnimationFrame(sp);}

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
wrap.addEventListener('click',()=>spinUp(2400,1200));
setInterval(()=>{if(parked&&!busy)rpmEl.textContent=idle+Math.round((Math.random()-.5)*26)},140);
const modes=[['Performance',800],['Comfort',700],['Track',950]];let mi=0;
$('#mode').addEventListener('click',()=>{mi=(mi+1)%3;$('#modeName').textContent=modes[mi][0];idle=modes[mi][1];rpmEl.textContent=idle;});
})();
