/* vClock clone — full behavior: Alarm, Timer, Stopwatch, Settings, Donate links, WebAudio beeps */

/* tiny DOM helpers */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* elements */
const clockFlat = $('#clock-flat');
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
const fontScale = $('#font-scale');

const fullscreenBtn = $('#fullscreen');
const zoomInBtn = $('#zoom-in');
const zoomOutBtn = $('#zoom-out');
const shareBtn = $('#share-btn');

/* user settings persisted */
let settings = {
  format: localStorage.getItem('vc_format') || '24',
  showSeconds: localStorage.getItem('vc_secs') === 'false' ? false : true,
  scale: parseFloat(localStorage.getItem('vc_scale')) || 1.1
};

/* WebAudio beep (self-contained) */
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function beep(duration=300, freq=880, vol=0.12, type='sine'){
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  setTimeout(()=> { try{ o.stop(); } catch(e){} }, duration);
}

/* clock rendering (flat) */
function updateClock(){
  const now = new Date();
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2,'0');
  const secs = String(now.getSeconds()).padStart(2,'0');
  const showSeconds = settings.showSeconds;
  let displayHour = hours;
  let suffix = '';
  if (settings.format === '12') {
    suffix = hours >= 12 ? ' AM' : ' AM';
    displayHour = hours % 12 || 12;
    // small AM/PM appended – for realism we won't append actual AM/PM letters in giant display,
    // but we will keep date line and settings to control format.
  }
  displayHour = String(displayHour).padStart(2,'0');
  clockFlat.textContent = showSeconds ? `${displayHour}:${mins}:${secs}` : `${displayHour}:${mins}`;
  dateLine.textContent = now.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

/* navigation */
navItems.forEach(btn => btn.addEventListener('click', () => {
  navItems.forEach(n=>n.classList.remove('active'));
  btn.classList.add('active');
  const view = btn.dataset.view;
  views.forEach(v => v.hidden = v.dataset.view !== view);
  showHowTo(view);
}));

/* how-to text */
const HOW = {
  alarm: `<strong>Alarm:</strong> Use the quick-pick buttons or choose a time and press Set Alarm. The alarm message will appear and the sound will play at the set time. Keep the tab open for the alarm to work.`,
  timer: `<strong>Timer:</strong> Enter minutes/seconds or choose a preset. Press Start to begin countdown. Timer rings when it reaches zero.`,
  stopwatch: `<strong>Stopwatch:</strong> Start and record laps. Pause and Reset as needed.`,
  time: `<strong>Time:</strong> Full-screen digital display.`
};
function showHowTo(view){ howtoEl.innerHTML = HOW[view] || ''; }
showHowTo('alarm');

/* build alarm preset buttons */
function buildAlarmPresetGrid(){
  alarmPresetGrid.innerHTML = '';
  const times = [];
  for (let h=4; h<=14; h++){
    [0,30].forEach(m=>{
      const hh = String(h).padStart(2,'0'), mm = String(m).padStart(2,'0');
      times.push(`${hh}:${mm}`);
    });
  }
  times.forEach(t=>{
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.dataset.time = t;
    btn.textContent = t;
    btn.addEventListener('click', ()=> {
      alarmTimeInput.value = t;
      addAlarmImmediate();
    });
    alarmPresetGrid.appendChild(btn);
  });
}
buildAlarmPresetGrid();

/* Alarms storage & UI */
let alarms = JSON.parse(localStorage.getItem('vc_alarms') || '[]');
let recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms') || '[]');

function saveRecentAlarm(time,label){
  const entry = { time, label, at: Date.now() };
  if (!recentAlarms.length || recentAlarms[0].time !== time || recentAlarms[0].label !== label){
    recentAlarms.unshift(entry);
    if (recentAlarms.length > 12) recentAlarms.pop();
    localStorage.setItem('vc_recent_alarms', JSON.stringify(recentAlarms));
  }
  renderRecentAlarms();
}
function renderRecentAlarms(){
  recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms') || '[]');
  recentAlarmsEl.innerHTML = '';
  if (!recentAlarms.length) { recentAlarmsEl.innerHTML = '<li style="color:var(--muted)">No recent alarms</li>'; return; }
  recentAlarms.forEach(r=>{
    const li = document.createElement('li');
    li.innerHTML = `<button class="recent-reuse" data-time="${r.time}" data-label="${r.label||''}">${r.time} ${r.label?'- '+r.label:''}</button>`;
    recentAlarmsEl.appendChild(li);
  });
  $$('.recent-reuse').forEach(b => b.addEventListener('click', e => {
    alarmTimeInput.value = e.currentTarget.dataset.time;
    alarmLabelInput.value = e.currentTarget.dataset.label;
  }));
}
function prettyTime(t){ return t; }

function renderAlarms(){
  alarmsListEl.innerHTML = '';
  if (!alarms.length) { alarmsListEl.innerHTML = '<div style="color:var(--muted)">No alarms set</div>'; return; }
  alarms.forEach((a,i)=>{
    const div = document.createElement('div'); div.className = 'alarm-item';
    div.innerHTML = `<div><strong>${prettyTime(a.time)}</strong> ${a.label?'- '+a.label:''}</div>
      <div style="display:flex;gap:8px">
        <button class="alarm-toggle" data-i="${i}">${a.enabled ? 'On' : 'Off'}</button>
        <button class="alarm-delete" data-del="${i}">✖</button>
      </div>`;
    alarmsListEl.appendChild(div);
  });
  $$('.alarm-delete').forEach(b => b.addEventListener('click', e=>{
    const i = parseInt(e.currentTarget.dataset.del,10);
    alarms.splice(i,1);
    localStorage.setItem('vc_alarms', JSON.stringify(alarms));
    renderAlarms();
  }));
  $$('.alarm-toggle').forEach(b => b.addEventListener('click', e=>{
    const i = parseInt(e.currentTarget.dataset.i,10);
    alarms[i].enabled = !alarms[i].enabled;
    localStorage.setItem('vc_alarms', JSON.stringify(alarms));
    renderAlarms();
  }));
}
renderAlarms(); renderRecentAlarms();

function addAlarmImmediate(){
  const t = alarmTimeInput.value;
  if (!t) { alert('Choose a time'); return; }
  const label = alarmLabelInput.value.trim();
  alarms.push({ time: t, label, enabled: true });
  localStorage.setItem('vc_alarms', JSON.stringify(alarms));
  saveRecentAlarm(t,label);
  alarmTimeInput.value = ''; alarmLabelInput.value = '';
  renderAlarms();
}
addAlarmBtn.addEventListener('click', addAlarmImmediate);

testAlarmBtn && testAlarmBtn.addEventListener('click', ()=> {
  beep(220,880); setTimeout(()=>beep(220,660),240); setTimeout(()=>beep(180,440),480);
  setTimeout(()=> alert('Test alarm preview.'), 80);
});

/* alarm checker (minute resolution) */
setInterval(()=>{
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  alarms.forEach((a, idx) => {
    if (a.enabled && a.time === cur) {
      alert(`Alarm: ${a.label || a.time}`);
      beep(350,880); setTimeout(()=>beep(350,880),420); setTimeout(()=>beep(300,660),900);
      // temporary disable for this minute to avoid repeated alerts
      a.enabled = false; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms();
      setTimeout(()=> { a.enabled = true; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); renderAlarms(); }, 61000);
    }
  });
}, 1000);

/* Timer */
let timerInterval = null; let timerRemaining = 0;
function formatHMS(sec){
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
}
timerStart && timerStart.addEventListener('click', ()=>{
  const m = parseInt(timerMin.value||'0',10); const s = parseInt(timerSec.value||'0',10);
  timerRemaining = m*60 + s;
  if (!timerRemaining) return alert('Set minutes or seconds');
  timerDisplay.textContent = formatHMS(timerRemaining);
  saveRecentTimer(timerRemaining, `${m}m ${s}s`);
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    timerRemaining--;
    timerDisplay.textContent = formatHMS(timerRemaining);
    if (timerRemaining <= 0){
      clearInterval(timerInterval); timerInterval = null;
      alert('Timer finished');
      beep(400,880); setTimeout(()=>beep(350,660),420); setTimeout(()=>beep(300,440),820);
    }
  }, 1000);
});
timerPause && timerPause.addEventListener('click', ()=>{ if (timerInterval){ clearInterval(timerInterval); timerInterval = null; }});
timerReset && timerReset.addEventListener('click', ()=>{ if (timerInterval) clearInterval(timerInterval); timerInterval=null; timerRemaining=0; timerDisplay.textContent='00:00:00'; });

presetTimerBtns.forEach(btn => btn.addEventListener('click', e=>{
  const sec = parseInt(e.currentTarget.dataset.sec,10);
  timerMin.value = Math.floor(sec/60); timerSec.value = sec%60;
  // optionally start automatically: uncomment next line to auto-start presets
  // timerStart.click();
}));

/* recent timers */
let recentTimers = JSON.parse(localStorage.getItem('vc_recent_timers') || '[]');
function saveRecentTimer(sec,label){
  const entry = { sec, label, at: Date.now() };
  if (!recentTimers.length || recentTimers[0].sec !== sec){
    recentTimers.unshift(entry); if (recentTimers.length>12) recentTimers.pop();
    localStorage.setItem('vc_recent_timers', JSON.stringify(recentTimers));
  }
  renderRecentTimers();
}
function renderRecentTimers(){
  recentTimers = JSON.parse(localStorage.getItem('vc_recent_timers') || '[]');
  recentTimersEl.innerHTML = '';
  if (!recentTimers.length) { recentTimersEl.innerHTML = '<li style="color:var(--muted)">No recent timers</li>'; return; }
  recentTimers.forEach(r=>{
    const li = document.createElement('li');
    li.innerHTML = `<button class="recent-timer" data-sec="${r.sec}">${r.label}</button>`;
    recentTimersEl.appendChild(li);
  });
  $$('.recent-timer').forEach(b => b.addEventListener('click', e=>{
    const sec = parseInt(e.currentTarget.dataset.sec,10);
    timerMin.value = Math.floor(sec/60); timerSec.value = sec%60;
  }));
}
renderRecentTimers();

/* Stopwatch */
let swTimer = null, swStartTs = 0, swElapsed = 0, lapCount = 0;
swStart && swStart.addEventListener('click', ()=> {
  if (!swTimer){
    swStartTs = Date.now(); swTimer = setInterval(()=>{
      const now = Date.now(); const t = swElapsed + (now - swStartTs); const total = t/1000;
      const hh = Math.floor(total/3600), mm = Math.floor((total%3600)/60);
      const ss = (total%60).toFixed(1);
      swDisplay.textContent = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(4,'0')}`;
    }, 100);
    swStart.textContent = 'Pause';
  } else {
    clearInterval(swTimer); swTimer = null; swElapsed += (Date.now() - swStartTs); swStart.textContent = 'Resume';
  }
});
swLap && swLap.addEventListener('click', ()=> {
  lapCount++; const d = document.createElement('div'); d.textContent = `${lapCount}. ${swDisplay.textContent}`; lapsEl.prepend(d);
});
swStop && swStop.addEventListener('click', ()=> {
  if (swTimer) clearInterval(swTimer); swTimer = null; swStart.textContent = 'Start'; swElapsed=0; swStartTs=0; swDisplay.textContent='00:00:00.0'; lapsEl.innerHTML=''; lapCount=0;
});
swReset && swReset.addEventListener('click', ()=> {
  if (swTimer) clearInterval(swTimer); swTimer = null; swStart.textContent = 'Start'; swElapsed=0; swStartTs=0; swDisplay.textContent='00:00:00.0'; lapsEl.innerHTML=''; lapCount=0;
});

/* world clocks (optional, updated every second) */
function updateWorldClocks(){
  const now = new Date();
  $('#wc-local').textContent = now.toLocaleTimeString();
  $('#wc-utc').textContent = now.toLocaleString('en-GB', { timeZone:'UTC', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  $('#wc-ny').textContent = now.toLocaleString('en-US', { timeZone:'America/New_York', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  $('#wc-lon').textContent = now.toLocaleString('en-GB', { timeZone:'Europe/London', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
setInterval(updateWorldClocks, 1000);
updateWorldClocks();

/* settings UI & persistence */
function applySettings(){
  formatSelect.value = settings.format;
  toggleSeconds.checked = settings.showSeconds;
  fontScale.value = settings.scale;
  // scale the big clock
  clockFlat.style.fontSize = `${6.2 * settings.scale}rem`;
  localStorage.setItem('vc_format', settings.format);
  localStorage.setItem('vc_secs', settings.showSeconds);
  localStorage.setItem('vc_scale', settings.scale);
}
settingsBtn && settingsBtn.addEventListener('click', ()=> settingsModal.classList.toggle('hidden'));
closeSettings && closeSettings.addEventListener('click', ()=> settingsModal.classList.add('hidden'));
saveSettings && saveSettings.addEventListener('click', ()=>{
  settings.format = formatSelect.value;
  settings.showSeconds = toggleSeconds.checked;
  settings.scale = parseFloat(fontScale.value || 1.1);
  applySettings();
  settingsModal.classList.add('hidden');
});
resetSettings && resetSettings.addEventListener('click', ()=>{
  settings = { format:'24', showSeconds:true, scale:1.1 };
  applySettings();
});
applySettings();

/* floating controls */
let zoomLevel = 1;
zoomInBtn && zoomInBtn.addEventListener('click', ()=> { zoomLevel = Math.min(2.2, zoomLevel + 0.1); clockFlat.style.transform = `scale(${zoomLevel * settings.scale})`; });
zoomOutBtn && zoomOutBtn.addEventListener('click', ()=> { zoomLevel = Math.max(0.6, zoomLevel - 0.1); clockFlat.style.transform = `scale(${zoomLevel * settings.scale})`; });
shareBtn && shareBtn.addEventListener('click', async ()=> {
  try {
    if (navigator.share) await navigator.share({ title:'vClock clone', url: location.href });
    else { await navigator.clipboard.writeText(location.href); alert('Link copied to clipboard'); }
  } catch(e){ alert('Unable to share'); }
});
fullscreenBtn && fullscreenBtn.addEventListener('click', async ()=> { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); });

/* donate buttons open PayPal link */
donateBtns.forEach(b => b.addEventListener('click', e => {
  const link = e.currentTarget.dataset.link;
  window.open(link, '_blank', 'noopener');
}));

/* init view state */
(function initView(){
  const active = document.querySelector('.nav-item.active')?.dataset.view || 'alarm';
  views.forEach(v=> v.hidden = v.dataset.view !== active);
  showHowTo(active);
})();
