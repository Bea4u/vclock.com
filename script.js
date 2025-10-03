/* Full vClock clone script — alarms, timer, stopwatch, presets, recent, settings, donate links, WebAudio beep */

/* small helpers */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* Elements */
const clockEl = $('#clock');
const dateLine = $('#date-line');
const navItems = $$('.nav-item');
const views = $$('.view');
const howtoEl = $('#howto');

const alarmPresetGrid = $('#alarm-preset-grid');
const alarmsListEl = $('#alarms-list');
const alarmTimeInput = $('#alarm-time');
const alarmLabelInput = $('#alarm-label');
const addAlarmBtn = $('#add-alarm');
const testAlarmBtn = $('#test-alarm');
const recentAlarmsEl = $('#recent-alarms');

const timerDisplay = $('#timer-display');
const timerMin = $('#timer-min');
const timerSec = $('#timer-sec');
const timerStart = $('#timer-start');
const timerPause = $('#timer-pause');
const timerReset = $('#timer-reset');
const presetTimerBtns = $$('.preset-timer');
const recentTimersEl = $('#recent-timers');

const swDisplay = $('#stopwatch-display');
const swStart = $('#sw-start');
const swLap = $('#sw-lap');
const swStop = $('#sw-stop');
const swReset = $('#sw-reset');
const lapsEl = $('#laps');

const donateBtns = $$('.donate-btn');

const themeToggle = $('#theme-toggle');
const settingsBtn = $('#settings-btn');
const settingsModal = $('#settings-modal');
const saveSettings = $('#save-settings');
const resetSettings = $('#reset-settings');
const closeSettings = $('#close-settings');

const formatSelect = $('#format-select');
const toggleSeconds = $('#toggle-seconds');
const clockColorInput = $('#clock-color');
const bgColorInput = $('#bg-color');
const fontScale = $('#font-scale');

const fullscreenBtn = $('#fullscreen');
const zoomInBtn = $('#zoom-in');
const zoomOutBtn = $('#zoom-out');
const shareBtn = $('#share-btn');

/* settings default */
let settings = {
  format: localStorage.getItem('vc_format') || '24',
  showSeconds: localStorage.getItem('vc_secs') === 'false' ? false : true,
  clockColor: localStorage.getItem('vc_color') || '#FF8C00',
  bgColor: localStorage.getItem('vc_bg') || '#000000',
  scale: parseFloat(localStorage.getItem('vc_scale')) || 1.1
};

/* WebAudio beep */
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function beep(duration=300, freq=880, vol=0.12, type='sine'){
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  setTimeout(()=> { try{ o.stop(); }catch(e){} }, duration);
}

/* Clock build & update */
function buildClock() {
  clockEl.innerHTML = '';
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const showSeconds = settings.showSeconds;
  const timeStr = hh + mm + (showSeconds ? ss : '');
  for (let i=0;i<timeStr.length;i++){
    const ch = timeStr[i];
    const d = document.createElement('div'); d.className='flip-digit'; d.textContent = ch; clockEl.appendChild(d);
    if (i === 1 || (showSeconds && i === 3)) {
      const sep = document.createElement('div'); sep.className='flip-sep'; sep.textContent = ':'; clockEl.appendChild(sep);
    }
  }
}
function updateClockAnimation(){
  const now = new Date();
  const hh = formatHour(now.getHours());
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const showSeconds = settings.showSeconds;
  const timeStr = hh + mm + (showSeconds ? ss : '');
  const digits = Array.from(clockEl.querySelectorAll('.flip-digit'));
  if (digits.length !== timeStr.length){ buildClock(); return; }
  let idx = 0;
  for (let i=0;i<clockEl.children.length;i++){
    const child = clockEl.children[i];
    if (child.classList && child.classList.contains('flip-digit')) {
      const c = timeStr[idx++];
      if (child.textContent !== c) {
        child.style.transform = 'rotateX(180deg)';
        setTimeout(()=>{ child.textContent = c; child.style.transform = 'rotateX(0deg)'; }, 180);
      }
    }
  }
  const today = new Date();
  dateLine.textContent = today.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}
function formatHour(h){ if (settings.format==='24') return String(h).padStart(2,'0'); let hh = h%12; if (hh===0) hh=12; return String(hh).padStart(2,'0'); }
buildClock(); setInterval(updateClockAnimation, 1000); updateClockAnimation();

/* Navigation */
navItems.forEach(btn => btn.addEventListener('click', () => {
  navItems.forEach(n=>n.classList.remove('active'));
  btn.classList.add('active');
  const view = btn.dataset.view;
  views.forEach(v => v.hidden = v.dataset.view !== view);
  showHowTo(view);
}));

/* How-to content */
const HOW = {
  alarm: `<strong>Alarm:</strong> Click a quick-pick or choose a time and press Set Alarm. Keep this tab open for alarms to ring.`,
  timer: `<strong>Timer:</strong> Enter minutes/seconds or use presets. Press Start to begin countdown.`,
  stopwatch: `<strong>Stopwatch:</strong> Start the stopwatch, record laps, pause and reset.`,
  time: `<strong>Time:</strong> Full-screen digital display & world clock references.`
};
function showHowTo(view){ howtoEl.innerHTML = HOW[view] || ''; }
showHowTo('alarm');

/* Alarm presets builder */
function buildAlarmPresetGrid(){
  alarmPresetGrid.innerHTML = '';
  const times = [];
  for (let h=4; h<=14; h++){
    [0,30].forEach(m => {
      const hh = String(h).padStart(2,'0'), mm = String(m).padStart(2,'0');
      times.push(`${hh}:${mm}`);
    });
  }
  times.forEach(t => {
    const btn = document.createElement('button'); btn.className='preset-btn'; btn.dataset.time = t;
    btn.textContent = (settings.format==='24') ? t : convertTo12(t);
    btn.addEventListener('click', ()=> { alarmTimeInput.value = t; addAlarmImmediate(); });
    alarmPresetGrid.appendChild(btn);
  });
}
function convertTo12(t){ const [hh,mm]=t.split(':'); const h=parseInt(hh,10); const am = h<12; let hh12 = h%12; if (hh12===0) hh12=12; return `${hh12}:${mm} ${am?'AM':'PM'}`; }
buildAlarmPresetGrid();

/* Alarms localStorage and UI */
let alarms = JSON.parse(localStorage.getItem('vc_alarms')||'[]');
let recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms')||'[]');
function saveRecentAlarm(time,label){
  const entry={time,label,at:Date.now()};
  if (!recentAlarms.length || recentAlarms[0].time !== time || recentAlarms[0].label !== label){
    recentAlarms.unshift(entry); if (recentAlarms.length>12) recentAlarms.pop();
    localStorage.setItem('vc_recent_alarms', JSON.stringify(recentAlarms));
  }
  renderRecentAlarms();
}
function renderRecentAlarms(){
  recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms')||'[]');
  recentAlarmsEl.innerHTML = '';
  if (!recentAlarms.length) { recentAlarmsEl.innerHTML = '<li style="color:var(--muted)">No recent alarms</li>'; return; }
  recentAlarms.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="recent-reuse" data-time="${r.time}" data-label="${r.label||''}">${prettyTime(r.time)} ${r.label?'- '+r.label:''}</button>`;
    recentAlarmsEl.appendChild(li);
  });
  $$('.recent-reuse').forEach(b => b.addEventListener('click', e => {
    alarmTimeInput.value = e.currentTarget.dataset.time;
    alarmLabelInput.value = e.currentTarget.dataset.label;
  }));
}

function renderAlarms(){
  alarmsListEl.innerHTML = '';
  if (!alarms.length) { alarmsListEl.innerHTML = '<div style="color:var(--muted)">No alarms set</div>'; return; }
  alarms.forEach((a,i) => {
    const item = document.createElement('div'); item.className='alarm-item';
    item.innerHTML = `<div><strong>${prettyTime(a.time)}</strong> ${a.label?'- '+a.label:''}</div>
      <div style="display:flex;gap:8px">
        <button data-i="${i}" class="alarm-toggle">${a.enabled ? 'On' : 'Off'}</button>
        <button data-del="${i}" class="alarm-delete">✖</button>
      </div>`;
    alarmsListEl.appendChild(item);
  });
  $$('.alarm-delete').forEach(b=> b.addEventListener('click', e => {
    const i = parseInt(e.currentTarget.dataset.del,10); alarms.splice(i,1); localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms();
  }));
  $$('.alarm-toggle').forEach(b=> b.addEventListener('click', e => {
    const i = parseInt(e.currentTarget.dataset.i,10); alarms[i].enabled = !alarms[i].enabled; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms();
  }));
}
renderAlarms(); renderRecentAlarms();

function prettyTime(t){ const [hh,mm] = t.split(':'); return (settings.format==='24') ? `${hh}:${mm}` : convertTo12(t); }

function addAlarmImmediate(){
  const t = alarmTimeInput.value; if (!t){ alert('Choose a time'); return; }
  const label = alarmLabelInput.value.trim();
  alarms.push({time:t,label,enabled:true});
  localStorage.setItem('vc_alarms', JSON.stringify(alarms));
  saveRecentAlarm(t,label);
  alarmTimeInput.value=''; alarmLabelInput.value='';
  renderAlarms();
}
addAlarmBtn.addEventListener('click', addAlarmImmediate);

testAlarmBtn && testAlarmBtn.addEventListener('click', ()=> {
  beep(220,880); setTimeout(()=>beep(220,660),260); setTimeout(()=>beep(180,440),520);
  setTimeout(()=> alert('Test alarm played (preview).'), 80);
});

/* Alarm loop: checks every second */
setInterval(()=> {
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  alarms.forEach((a,i) => {
    if (a.enabled && a.time === cur){
      alert(`Alarm: ${a.label || a.time}`);
      beep(350,880); setTimeout(()=>beep(350,880),420); setTimeout(()=>beep(300,660),900);
      a.enabled = false; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms();
      setTimeout(()=>{ a.enabled = true; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms(); }, 61000);
    }
  });
},1000);

/* Timer */
let timerInterval = null, timerRemaining = 0;
function formatHMS(sec){ const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':'); }

timerStart && timerStart.addEventListener('click', ()=>{
  const m = parseInt(timerMin.value || '0',10); const s = parseInt(timerSec.value || '0',10);
  timerRemaining = m*60 + s; if (!timerRemaining) return alert('Set minutes or seconds');
  timerDisplay.textContent = formatHMS(timerRemaining); saveRecentTimer(timerRemaining, `${m}m ${s}s`);
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=> {
    timerRemaining--; timerDisplay.textContent = formatHMS(timerRemaining);
    if (timerRemaining<=0){ clearInterval(timerInterval); timerInterval=null; alert('Timer finished'); beep(400,880); setTimeout(()=>beep(350,660),420); setTimeout(()=>beep(300,440),820); }
  },1000);
});
timerPause && timerPause.addEventListener('click', ()=> { if (timerInterval){ clearInterval(timerInterval); timerInterval=null; }});
timerReset && timerReset.addEventListener('click', ()=> { if (timerInterval) clearInterval(timerInterval); timerInterval=null; timerRemaining=0; timerDisplay.textContent='00:00:00'; });

presetTimerBtns.forEach(btn => btn.addEventListener('click', e=>{
  const sec = parseInt(e.currentTarget.dataset.sec,10);
  timerMin.value = Math.floor(sec/60); timerSec.value = sec%60;
  // optional: start automatically when preset clicked (match user preference); here we set values only
}));

/* Recent timers */
let recentTimers = JSON.parse(localStorage.getItem('vc_recent_timers')||'[]');
function saveRecentTimer(sec,label){
  const entry={sec,label,at:Date.now()};
  if (!recentTimers.length || recentTimers[0].sec !== sec){ recentTimers.unshift(entry); if (recentTimers.length>12) recentTimers.pop(); localStorage.setItem('vc_recent_timers', JSON.stringify(recentTimers)); }
  renderRecentTimers();
}
function renderRecentTimers(){
  recentTimers = JSON.parse(localStorage.getItem('vc_recent_timers')||'[]'); recentTimersEl.innerHTML = '';
  if (!recentTimers.length){ recentTimersEl.innerHTML = '<li style="color:var(--muted)">No recent timers</li>'; return; }
  recentTimers.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="recent-timer" data-sec="${r.sec}">${r.label}</button>`;
    recentTimersEl.appendChild(li);
  });
  $$('.recent-timer').forEach(b => b.addEventListener('click', e => {
    const sec = parseInt(e.currentTarget.dataset.sec,10); timerMin.value = Math.floor(sec/60); timerSec.value = sec%60;
  }));
}
renderRecentTimers();

/* Stopwatch */
let swStartTs = 0, swElapsed = 0, swTimer = null, lapCount = 0;
swStart && swStart.addEventListener('click', ()=> {
  if (!swTimer){
    swStartTs = Date.now(); swTimer = setInterval(()=> {
      const now = Date.now(); const t = swElapsed + (now - swStartTs); const total = t/1000;
      const hh = Math.floor(total/3600), mm = Math.floor((total%3600)/60), ss = (total%60).toFixed(1);
      swDisplay.textContent = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(4,'0')}`;
    },100);
    swStart.textContent = 'Pause';
  } else {
    clearInterval(swTimer); swTimer = null; swElapsed += (Date.now() - swStartTs); swStart.textContent = 'Resume';
  }
});
swLap && swLap.addEventListener('click', ()=> {
  lapCount++; const d = document.createElement('div'); d.textContent = `${lapCount}. ${swDisplay.textContent}`; lapsEl.prepend(d);
});
swStop && swStop.addEventListener('click', ()=> {
  if (swTimer) clearInterval(swTimer); swTimer=null; swStart.textContent='Start'; swElapsed = 0; swStartTs = 0; swDisplay.textContent='00:00:00.0'; lapsEl.innerHTML=''; lapCount=0;
});
swReset && swReset.addEventListener('click', ()=> {
  if (swTimer) clearInterval(swTimer); swTimer=null; swStart.textContent='Start'; swElapsed = 0; swStartTs = 0; swDisplay.textContent='00:00:00.0'; lapsEl.innerHTML=''; lapCount=0;
});

/* World clocks update */
function updateWorldClocks(){ const now = new Date(); $('#wc-local').textContent = now.toLocaleTimeString(); $('#wc-utc').textContent = now.toLocaleString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit'}); $('#wc-ny').textContent = now.toLocaleString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',second:'2-digit'}); $('#wc-lon').textContent = now.toLocaleString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
setInterval(updateWorldClocks,1000); updateWorldClocks();

/* Settings UI */
function applySettings(){
  clockEl.style.color = settings.clockColor;
  document.body.style.background = `linear-gradient(180deg, ${shadeColor(settings.bgColor,-6)} 0%, ${settings.bgColor} 100%)`;
  document.getElementById('clock-container').style.transform = `scale(${settings.scale})`;
  formatSelect.value = settings.format; toggleSeconds.checked = settings.showSeconds;
  clockColorInput.value = settings.clockColor; bgColorInput.value = settings.bgColor; fontScale.value = settings.scale;
  buildAlarmPresetGrid(); renderAlarms(); renderRecentAlarms(); renderRecentTimers();
}
function shadeColor(hex,pct){ const f = hex.slice(1), t = pct<0?0:255, p = Math.abs(pct)/100; const R = parseInt(f.substring(0,2),16), G = parseInt(f.substring(2,4),16), B = parseInt(f.substring(4,6),16); const newR = Math.round((t-R)*p)+R, newG = Math.round((t-G)*p)+G, newB = Math.round((t-B)*p)+B; return `rgb(${newR}, ${newG}, ${newB})`; }

settingsBtn && settingsBtn.addEventListener('click', ()=> settingsModal.classList.toggle('hidden'));
closeSettings && closeSettings.addEventListener('click', ()=> settingsModal.classList.add('hidden'));
saveSettings && saveSettings.addEventListener('click', ()=> {
  settings.format = formatSelect.value; settings.showSeconds = toggleSeconds.checked; settings.clockColor = clockColorInput.value; settings.bgColor = bgColorInput.value; settings.scale = parseFloat(fontScale.value||1.1);
  localStorage.setItem('vc_format', settings.format); localStorage.setItem('vc_secs', settings.showSeconds); localStorage.setItem('vc_color', settings.clockColor); localStorage.setItem('vc_bg', settings.bgColor); localStorage.setItem('vc_scale', settings.scale);
  applySettings(); settingsModal.classList.add('hidden');
});
resetSettings && resetSettings.addEventListener('click', ()=> {
  settings = { format:'24', showSeconds:true, clockColor:'#FF8C00', bgColor:'#000000', scale:1.1 };
  localStorage.removeItem('vc_format'); localStorage.removeItem('vc_secs'); localStorage.removeItem('vc_color'); localStorage.removeItem('vc_bg'); localStorage.removeItem('vc_scale');
  applySettings();
});
applySettings();

/* Floating controls */
let zoomLevel = 1;
zoomInBtn && zoomInBtn.addEventListener('click', ()=> { zoomLevel = Math.min(2.2, zoomLevel + 0.1); document.getElementById('clock-container').style.transform = `scale(${zoomLevel * settings.scale})`; });
zoomOutBtn && zoomOutBtn.addEventListener('click', ()=> { zoomLevel = Math.max(0.6, zoomLevel - 0.1); document.getElementById('clock-container').style.transform = `scale(${zoomLevel * settings.scale})`; });
shareBtn && shareBtn.addEventListener('click', async ()=> { try { if (navigator.share) await navigator.share({title:'vClock clone', url:location.href}); else { await navigator.clipboard.writeText(location.href); alert('Link copied to clipboard'); } } catch(e){ alert('Unable to share'); }});
fullscreenBtn && fullscreenBtn.addEventListener('click', async ()=> { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); });

/* Donate buttons */
donateBtns.forEach(b => b.addEventListener('click', e => {
  const link = e.currentTarget.dataset.link; window.open(link, '_blank', 'noopener');
  setTimeout(()=> alert('🙏 Thank you for your support! You keep this clock alive ⏰'), 900);
}));

/* Init view state */
(function init(){
  const active = document.querySelector('.nav-item.active')?.dataset.view || 'alarm';
  views.forEach(v=> v.hidden = v.dataset.view !== active);
  showHowTo(active);
})();
