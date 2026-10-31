(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const body=document.body,wrap=$('#carWrap'),car=$('#car'),refl=$('#car-reflection'),speedEl=$('#speed'),rpmEl=$('#rpm');
let spins=[],idle=800,parked=false;
if(reduce)body.classList.add('noanim');

/* --- load the SVG inline so wheels can be rotated --- */
fetch('assets/car.svg').then(r=>r.text()).then(t=>{
  car.innerHTML=t; refl.innerHTML=t.replace(/ id="/g,' data-id="').replace(/href="#/g,'href="#').replace(/clip-path="url\(#clipBody\)"/g,'clip-path="url(#clipBody)"');
  spins=[...car.querySelectorAll('.spin'),...refl.querySelectorAll('.spin')];
  const done=()=>setTimeout(start,reduce?0:350);
  (document.fonts?document.fonts.ready:Promise.resolve()).then(done);
}).catch(()=>{$('#loader').classList.add('out');body.classList.add('typed');parked=true;});

const rotate=a=>spins.forEach(s=>s.setAttribute('transform','rotate('+a%360+')'));
const ease=t=>1-Math.pow(1-t,3.4);

function start(){
  $('#loader').classList.add('out');
  if(reduce){parked=true;body.classList.add('typed');return;}
  const W=wrap.offsetWidth,scale=W/900,startX=-(innerWidth+W*.2),D=3000;
  let t0=null,prev=startX,angle=0,last=0;
  wrap.style.transform='translateX('+startX+'px)';
  const arrive=ts=>{
    if(t0===null){t0=ts;last=ts}
    const p=Math.min((ts-t0)/D,1),x=startX*(1-ease(p)),dt=Math.max(ts-last,1);last=ts;
    const dx=x-prev;prev=x;angle+=dx/(50*scale)*180/Math.PI;
    wrap.style.transform='translateX('+x+'px)';rotate(angle);
    const v=Math.min(dx/dt*1000/ (innerWidth/110),140);   // px/s -> km/h feel
    speedEl.textContent=Math.max(0,Math.round(v));rpmEl.textContent=Math.round(idle+Math.max(0,v)*38);
    if(p<1)requestAnimationFrame(arrive);else settle();
  };
  requestAnimationFrame(arrive);
}
function settle(){
  parked=true;speedEl.textContent=0;rpmEl.textContent=idle;
  let t0=null;
  const f=ts=>{ if(t0===null)t0=ts;const t=(ts-t0)/1000;
    const d=Math.exp(-t*4.5),s=Math.sin(t*13);
    car.style.transform='rotate('+(s*.7*d)+'deg) translateY('+(s*-2*d)+'px)';
    if(t<1.1)requestAnimationFrame(f);else car.style.transform='';};
  requestAnimationFrame(f);
  body.classList.add('typed');
}
setInterval(()=>{if(parked)rpmEl.textContent=idle+Math.round((Math.random()-.5)*26)},140);

/* --- drive mode --- */
const modes=[['Performance',800],['Comfort',700],['Track',950]];let mi=0;
$('#mode').addEventListener('click',()=>{mi=(mi+1)%3;$('#modeName').textContent=modes[mi][0];idle=modes[mi][1];if(parked)rpmEl.textContent=idle;});

/* --- sound: optional file via data-audio on #sound, otherwise a soft synthesised idle --- */
const sBtn=$('#sound');let ctx,gain,audio,on=false;
function setSound(v){
  on=v;sBtn.setAttribute('aria-pressed',v);$('#soundLabel').textContent=v?'Sound On':'Sound Off';
  const src=sBtn.dataset.audio;
  if(src){audio=audio||Object.assign(new Audio(src),{loop:true,volume:.25});v?audio.play().catch(()=>{}):audio.pause();return;}
  if(v&&!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();gain=ctx.createGain();gain.gain.value=0;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;
    [46,69,92].forEach((f,i)=>{const o=ctx.createOscillator();o.type=i?'triangle':'sawtooth';o.frequency.value=f;const g=ctx.createGain();g.gain.value=i?.5:1;o.connect(g).connect(lp);o.start();});
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=7;lg.gain.value=.008;lfo.connect(lg).connect(gain.gain);lfo.start();
    lp.connect(gain).connect(ctx.destination);}
  if(ctx){v?ctx.resume():null;gain.gain.setTargetAtTime(v?.04:0,ctx.currentTime,.15);if(!v)setTimeout(()=>!on&&ctx.suspend(),600);}
}
sBtn.addEventListener('click',()=>setSound(!on));

/* --- menu --- */
const mb=$('#menuBtn'),mp=$('#menu');
const toggleMenu=o=>{mp.hidden=!o;mb.setAttribute('aria-expanded',o)};
mb.addEventListener('click',()=>toggleMenu(mp.hidden));
mp.addEventListener('click',e=>e.target.tagName==='A'&&toggleMenu(false));
addEventListener('keydown',e=>e.key==='Escape'&&toggleMenu(false));

/* --- section progress + nav state --- */
const secs=$$('[data-sec]'),dots=$$('.rail .d'),links=$$('.nav a');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;
  const i=+e.target.dataset.sec;$('#secNum').textContent='0'+(i+1);
  dots.forEach((d,j)=>d.classList.toggle('on',j===i));
  links.forEach(l=>l.classList.toggle('on',l.getAttribute('href')==='#'+e.target.id));}),{threshold:.5});
secs.forEach(s=>io.observe(s));
})();
