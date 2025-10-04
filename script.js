// Shared script for vClock clone

// Clock update
function updateClock() {
  const now = new Date();
  const big = document.getElementById('clock-flat');
  if (big) big.textContent = now.toLocaleTimeString([], {hour12:false});
  const dl = document.getElementById('date-line');
  if (dl) dl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// Audio element for alarm looping
let alarmAudio = new Audio('assets/alarm.wav');
alarmAudio.loop = true;
let alarmPlaying = false;
function playAlarmLoop() {
  try {
    alarmAudio.currentTime = 0;
    alarmAudio.play();
    alarmPlaying = true;
    showStopAlarmButton();
  } catch (e) {
    // fallback beep via WebAudio
    startFallbackBeep();
    alarmPlaying = true;
    showStopAlarmButton();
  }
}
function stopAlarmLoop() {
  try { alarmAudio.pause(); alarmAudio.currentTime = 0; } catch(e){}
  stopFallbackBeep();
  alarmPlaying = false;
  hideStopAlarmButton();
}

// fallback beep using WebAudio if audio file cannot autoplay
let fallbackOsc=null, fallbackCtx=null;
function startFallbackBeep() {
  if (!window.AudioContext) return;
  fallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
  fallbackOsc = fallbackCtx.createOscillator();
  const gain = fallbackCtx.createGain();
  fallbackOsc.type = 'sine';
  fallbackOsc.frequency.value = 880;
  gain.gain.value = 0.08;
  fallbackOsc.connect(gain);
  gain.connect(fallbackCtx.destination);
  fallbackOsc.start();
}
function stopFallbackBeep() {
  try { if (fallbackOsc) fallbackOsc.stop(); if (fallbackCtx) fallbackCtx.close(); } catch(e){}
  fallbackOsc = null; fallbackCtx = null;
}

// show/hide stop alarm control overlay
function showStopAlarmButton(){
  if (document.getElementById('stop-alarm-overlay')) return;
  const btn = document.createElement('button');
  btn.id = 'stop-alarm-overlay';
  btn.textContent = 'Stop Alarm';
  btn.style.position='fixed';
  btn.style.left='50%'; btn.style.top='10%';
  btn.style.transform='translateX(-50%)';
  btn.style.zIndex=1000; btn.style.padding='12px 18px'; btn.style.background='#ff4444'; btn.style.color='#fff'; btn.style.border='none'; btn.style.borderRadius='8px';
  btn.onclick = ()=> stopAlarmLoop();
  document.body.appendChild(btn);
}
function hideStopAlarmButton(){ const b=document.getElementById('stop-alarm-overlay'); if(b) b.remove(); }

// Alarms logic (minute precision)
let alarms = JSON.parse(localStorage.getItem('vc_alarms')||'[]');
function saveAlarms(){ localStorage.setItem('vc_alarms', JSON.stringify(alarms)); }
function renderAlarms(){
  const list = document.getElementById('alarms-list');
  if (!list) return;
  list.innerHTML = '';
  if (!alarms.length) { list.innerHTML = '<div style="color:#999">No alarms set</div>'; return; }
  alarms.forEach((a,i)=>{
    const div=document.createElement('div'); div.className='alarm-item';
    div.innerHTML = '<div>'+a.time+' '+(a.label?('- '+a.label):'')+'</div><div style="display:flex;gap:6px"><button data-i="'+i+'" class="toggle">'+(a.enabled? 'On':'Off')+'</button><button data-del="'+i+'" class="del">✖</button></div>';
    list.appendChild(div);
  });
  // attach events
  document.querySelectorAll('.del').forEach(b=> b.addEventListener('click', e=>{ const i=parseInt(e.currentTarget.dataset.del,10); alarms.splice(i,1); saveAlarms(); renderAlarms(); }));
  document.querySelectorAll('.toggle').forEach(b=> b.addEventListener('click', e=>{ const i=parseInt(e.currentTarget.dataset.i,10); alarms[i].enabled=!alarms[i].enabled; saveAlarms(); renderAlarms(); }));
}
renderAlarms();

// set alarm from presets or input
document.addEventListener('click', function(e){
  if (e.target.matches('.alarm-grid button')){
    const t = e.target.dataset.time;
    addAlarm(t,'');
  }
});
const setAlarmBtn = document.getElementById('set-alarm');
if (setAlarmBtn) setAlarmBtn.addEventListener('click', ()=>{ const t = document.getElementById('alarm-time').value; const l = document.getElementById('alarm-label')?document.getElementById('alarm-label').value:''; if(t) addAlarm(t,l); });
function addAlarm(time,label){ alarms.push({time, label: label||'', enabled:true}); saveAlarms(); renderAlarms(); addRecent(time,label); }

// recent
let recent = JSON.parse(localStorage.getItem('vc_recent')||'[]');
function addRecent(time,label){ recent.unshift({time,label,at:Date.now()}); if(recent.length>12) recent.pop(); localStorage.setItem('vc_recent', JSON.stringify(recent)); renderRecent(); }
function renderRecent(){ const el=document.getElementById('recent-alarms'); if(!el) return; el.innerHTML=''; if(!recent.length){ el.innerHTML='<li style="color:#999">No recent alarms</li>'; return;} recent.forEach(r=>{ const li=document.createElement('li'); li.textContent = r.time + (r.label? ' - '+r.label:''); el.appendChild(li); }); }
renderRecent();

// alarm checker
setInterval(()=>{
  const now=new Date();
  const cur = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  alarms.forEach((a,idx)=>{
    if (a.enabled && a.time === cur){
      // play alarm loop until stopped
      playAlarmLoop();
      // disable temporarily to prevent repeat in same minute
      a.enabled = false; saveAlarms(); renderAlarms();
      setTimeout(()=>{ a.enabled = true; saveAlarms(); renderAlarms(); }, 61*1000);
    }
  });
}, 1000);

// Test alarm button
const testBtn = document.getElementById('test-alarm');
if (testBtn) testBtn.addEventListener('click', ()=> { playAlarmLoop(); setTimeout(()=> stopAlarmLoop(), 2000); });
// stop overlay created

// Timer functionality
let timerInterval=null, timerRemaining=0;
function formatHMS(sec){ const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':'); }
const startTimerBtn = document.getElementById('start-timer');
if (startTimerBtn) startTimerBtn.addEventListener('click', ()=>{
  const m = parseInt(document.getElementById('timer-minutes').value||'0',10);
  const s = parseInt(document.getElementById('timer-seconds').value||'0',10);
  timerRemaining = m*60 + s;
  if (!timerRemaining) return alert('Set duration');
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{ timerRemaining--; const disp = document.querySelector('.timer-display'); if(disp) disp.textContent = formatHMS(timerRemaining); if (timerRemaining<=0){ clearInterval(timerInterval); playAlarmLoop(); } }, 1000);
});
const pauseTimerBtn = document.getElementById('pause-timer');
if (pauseTimerBtn) pauseTimerBtn.addEventListener('click', ()=>{ if (timerInterval) clearInterval(timerInterval); timerInterval=null; });
const resetTimerBtn = document.getElementById('reset-timer');
if (resetTimerBtn) resetTimerBtn.addEventListener('click', ()=>{ if (timerInterval) clearInterval(timerInterval); timerInterval=null; timerRemaining=0; const disp=document.querySelector('.timer-display'); if(disp) disp.textContent='00:00:00'; });

// Stopwatch basic
let swInterval=null, swStartTs=0, swElapsed=0;
const swDisplay = document.querySelector('.stopwatch-display');
const startSwBtn = document.getElementById('start-stopwatch');
if (startSwBtn) startSwBtn.addEventListener('click', ()=>{
  if (!swInterval){
    swStartTs = Date.now(); swInterval = setInterval(()=>{ const t = swElapsed + (Date.now()-swStartTs); const total = Math.floor(t/1000); const h=Math.floor(total/3600), m=Math.floor((total%3600)/60), s=total%60; if(swDisplay) swDisplay.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }, 200);
    startSwBtn.textContent='Pause';
  } else { clearInterval(swInterval); swInterval=null; swElapsed += Date.now()-swStartTs; startSwBtn.textContent='Start'; }
});
const lapBtn = document.getElementById('lap-stopwatch');
if (lapBtn) lapBtn.addEventListener('click', ()=>{ const l=document.getElementById('laps'); if (l) { const li=document.createElement('li'); li.textContent = swDisplay?swDisplay.textContent:''; l.prepend(li); } });
const stopSwBtn = document.getElementById('stop-stopwatch');
if (stopSwBtn) stopSwBtn.addEventListener('click', ()=>{ if(swInterval) clearInterval(swInterval); swInterval=null; swElapsed=0; if(swDisplay) swDisplay.textContent='00:00:00.0'; const l=document.getElementById('laps'); if(l) l.innerHTML=''; startSwBtn.textContent='Start'; });
const resetSwBtn = document.getElementById('reset-stopwatch');
if (resetSwBtn) resetSwBtn.addEventListener('click', ()=>{ if(swInterval) clearInterval(swInterval); swInterval=null; swElapsed=0; if(swDisplay) swDisplay.textContent='00:00:00.0'; const l=document.getElementById('laps'); if(l) l.innerHTML=''; startSwBtn.textContent='Start'; });

// World clock functionality for time.html
const worldListEl = document.getElementById('world-times');
let worldCities = JSON.parse(localStorage.getItem('vc_cities')||'[]');
if (!worldCities || !worldCities.length) {
  worldCities = [{name:'Local', zone:Intl.DateTimeFormat().resolvedOptions().timeZone},{name:'UTC', zone:'UTC'},{name:'New York', zone:'America/New_York'},{name:'London', zone:'Europe/London'},{name:'Lagos', zone:'Africa/Lagos'},{name:'Tokyo', zone:'Asia/Tokyo'}];
}
function renderWorldClock(){
  if(!worldListEl) return;
  worldListEl.innerHTML = '';
  worldCities.forEach(c=>{
    const now = new Date().toLocaleTimeString('en-US',{timeZone:c.zone, hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
    const li = document.createElement('li');
    li.innerHTML = `<strong>${c.name}</strong> — ${now}`;
    worldListEl.appendChild(li);
  });
}
setInterval(renderWorldClock,1000); renderWorldClock();
const addCityBtn = document.getElementById('add-city');
if (addCityBtn) addCityBtn.addEventListener('click', ()=>{
  const name = prompt('City name (e.g. Paris)'); const zone = prompt('Timezone (e.g. Europe/Paris)');
  if (name && zone) { worldCities.push({name,zone}); localStorage.setItem('vc_cities', JSON.stringify(worldCities)); renderWorldClock(); }
});

// Donate buttons open PayPal
document.querySelectorAll('.donate-btn').forEach(b=> b.addEventListener('click', e=>{ const link = e.currentTarget.dataset.link || 'https://www.paypal.me/JoyNance576'; window.open(link,'_blank'); }));

// Settings theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) themeToggle.addEventListener('click', ()=> document.body.classList.toggle('dark'));

// Floating controls: fullscreen & zoom & share
const fsBtn = document.getElementById('fullscreen');
if (fsBtn) fsBtn.addEventListener('click', ()=>{ if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); });
const shareBtn = document.getElementById('share');
if (shareBtn) shareBtn.addEventListener('click', async ()=>{ try{ if (navigator.share) await navigator.share({title:'vClock clone', url:location.href}); else { await navigator.clipboard.writeText(location.href); alert('Link copied'); } } catch(e){ alert('Share failed'); } });
