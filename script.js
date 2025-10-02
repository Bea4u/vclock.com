// ----------------- Utilities -----------------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* --------- Elements --------- */
const clockEl = $('#clock');
const containerEl = $('#clock-container');
const tzLabel = $('#timezone-label');
const fmtLabel = $('#format-label');

const navItems = $$('.nav-item');
const views = $$('.view');

const themeToggle = $('#theme-toggle');
const settingsBtn = $('#settings-btn');
const settingsModal = $('#settings-modal');
const closeSettings = $('#close-settings');
const saveSettings = $('#save-settings');
const resetSettings = $('#reset-settings');

const formatSelect = $('#format-select');
const toggleSeconds = $('#toggle-seconds');
const clockColorInput = $('#clock-color');
const bgColorInput = $('#bg-color');
const fontScale = $('#font-scale');

const fullscreenBtn = $('#fullscreen');
const zoomInBtn = $('#zoom-in');
const zoomOutBtn = $('#zoom-out');
const shareBtn = $('#share-btn');

/* Alarm / Timer / Stopwatch elements */
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

const swDisplay = $('#stopwatch-display');
const swStart = $('#sw-start');
const swStop = $('#sw-stop');
const swLap = $('#sw-lap');
const swReset = $('#sw-reset');
const lapsEl = $('#laps');

const wcLocal = $('#wc-local');
const wcUtc = $('#wc-utc');
const wcNY = $('#wc-ny');
const wcLon = $('#wc-lon');

const howtoEl = $('#howto');

/* ---------- State & Defaults ---------- */
let settings = {
  format: localStorage.getItem('vc_format') || '24',
  showSeconds: localStorage.getItem('vc_secs') === 'false' ? false : true,
  clockColor: localStorage.getItem('vc_color') || '#00FF00',
  bgColor: localStorage.getItem('vc_bg') || '#000000',
  scale: parseFloat(localStorage.getItem('vc_scale')) || 1.2
};
let zoomLevel = 1;

/* ---------- Clock Rendering ---------- */
function buildClockDigits(showSeconds = settings.showSeconds) {
  clockEl.innerHTML = '';
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const timeStr = hh + mm + (showSeconds ? ss : '');

  for (let i=0; i < timeStr.length; i++) {
    const ch = timeStr[i];
    const digit = document.createElement('div');
    digit.className = 'flip-digit';
    digit.textContent = ch;
    clockEl.appendChild(digit);
    // insert separator after HH and after MM (if seconds)
    if (i === 1 || (showSeconds && i === 3)) {
      const sep = document.createElement('div');
      sep.className = 'flip-sep';
      sep.textContent = ':';
      clockEl.appendChild(sep);
    }
  }
}
function updateClockAnimation() {
  const showSeconds = settings.showSeconds;
  const now = new Date();
  const hh = formatHour(now.getHours(), settings.format);
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const timeStr = hh + mm + (showSeconds ? ss : '');
  const digits = Array.from(clockEl.querySelectorAll('.flip-digit'));

  // If structure length mismatched (e.g., toggled seconds), rebuild
  if (digits.length !== timeStr.length) {
    buildClockDigits(showSeconds);
    return;
  }

  let idx = 0;
  for (let i=0;i<clockEl.children.length;i++){
    const child = clockEl.children[i];
    if (child.classList.contains('flip-digit')) {
      const newChar = timeStr[idx];
      if (child.textContent !== newChar) {
        // flip animation
        child.style.transform = 'rotateX(180deg)';
        setTimeout(()=> {
          child.textContent = newChar;
          child.style.transform = 'rotateX(0deg)';
        },180);
      }
      idx++;
    }
  }

  // update sub labels
  try {
    tzLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch(e) {
    tzLabel.textContent = '';
  }
  fmtLabel.textContent = `${settings.format}h ${showSeconds ? 'with' : 'no'} seconds`;
}

/* format helper */
function formatHour(h, fmt) {
  if (fmt === '24') return String(h).padStart(2,'0');
  // 12-hour
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return String(hh).padStart(2,'0');
}

/* start loop */
buildClockDigits(settings.showSeconds);
setInterval(updateClockAnimation, 1000);
updateClockAnimation();

/* ---------- UI: nav switch ---------- */
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(i=>i.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    views.forEach(v => v.hidden = v.dataset.view !== view);
    showHowToFor(view);
  });
});

/* ---------- How to Use content ---------- */
const HOWTO = {
  alarm: `<h4>How to use the Alarm Clock</h4>
  <p>Pick a time and optionally add a label. The alarm will trigger a browser alert and can play a sound if you enable it (playback depends on your browser's autoplay settings). Keep this tab open for the alarm to fire.</p>
  <p>Use the "Test" button to preview the alarm sound and volume. Recent alarms are saved for quick reuse.</p>`,

  timer: `<h4>How to use the Timer</h4>
  <p>Set minutes and seconds (or use presets) and press Start. You can pause or reset the timer. Timer works while the tab is open.</p>`,

  stopwatch: `<h4>How to use the Stopwatch</h4>
  <p>Start the stopwatch, record laps, pause, and reset. Laps are saved only during the session.</p>`,

  time: `<h4>How to use World Time</h4>
  <p>View local time, UTC and sample world clocks. Use this to compare zones quickly.</p>`
};

function showHowToFor(view) {
  howtoEl.innerHTML = HOWTO[view] || '';
}
showHowToFor('alarm');

/* ---------- Theme & Settings ---------- */
function applySettingsToUI() {
  clockEl.style.color = settings.clockColor;
  document.body.style.background = `linear-gradient(180deg, ${shadeColor(settings.bgColor, -6)} 0%, ${settings.bgColor} 100%)`;
  containerEl.style.transform = `scale(${settings.scale})`;
  formatSelect.value = settings.format;
  toggleSeconds.checked = settings.showSeconds;
  clockColorInput.value = settings.clockColor;
  bgColorInput.value = settings.bgColor;
  fontScale.value = settings.scale;
}
function shadeColor(hex, percent) {
  const f = hex.slice(1), t = percent<0?0:255, p = Math.abs(percent)/100;
  const R = parseInt(f.substring(0,2),16), G = parseInt(f.substring(2,4),16), B = parseInt(f.substring(4,6),16);
  const newR = Math.round((t-R)*p)+R, newG = Math.round((t-G)*p)+G, newB = Math.round((t-B)*p)+B;
  return `rgb(${newR}, ${newG}, ${newB})`;
}

/* settings open/close */
settingsBtn.addEventListener('click', ()=> {
  settingsModal.classList.toggle('hidden');
});
$('#close-settings') && $('#close-settings').addEventListener('click', ()=> settingsModal.classList.add('hidden'));

/* save settings */
saveSettings && saveSettings.addEventListener('click', () => {
  settings.format = formatSelect.value;
  settings.showSeconds = toggleSeconds.checked;
  settings.clockColor = clockColorInput.value;
  settings.bgColor = bgColorInput.value;
  settings.scale = parseFloat(fontScale.value);
  localStorage.setItem('vc_format', settings.format);
  localStorage.setItem('vc_secs', settings.showSeconds);
  localStorage.setItem('vc_color', settings.clockColor);
  localStorage.setItem('vc_bg', settings.bgColor);
  localStorage.setItem('vc_scale', settings.scale);
  applySettingsToUI();
  settingsModal.classList.add('hidden');
});

/* reset */
resetSettings && resetSettings.addEventListener('click', ()=> {
  settings = { format:'24', showSeconds:true, clockColor:'#00FF00', bgColor:'#000000', scale:1.2 };
  localStorage.removeItem('vc_format');
  localStorage.removeItem('vc_secs');
  localStorage.removeItem('vc_color');
  localStorage.removeItem('vc_bg');
  localStorage.removeItem('vc_scale');
  applySettingsToUI();
});

/* initial apply */
applySettingsToUI();

/* ---------- Theme toggle (light/dark) ---------- */
themeToggle.addEventListener('click', ()=> {
  document.body.classList.toggle('light-mode');
  if (document.body.classList.contains('light-mode')) {
    document.body.style.background = '#f7faf7';
    document.body.style.color = '#041';
  } else {
    applySettingsToUI();
  }
});

/* ---------- Zoom controls ---------- */
zoomInBtn.addEventListener('click', ()=> {
  zoomLevel = Math.min(2.4, zoomLevel + 0.1);
  containerEl.style.transform = `scale(${zoomLevel * settings.scale})`;
});
zoomOutBtn.addEventListener('click', ()=> {
  zoomLevel = Math.max(0.6, zoomLevel - 0.1);
  containerEl.style.transform = `scale(${zoomLevel * settings.scale})`;
});

/* share */
shareBtn.addEventListener('click', async ()=> {
  const url = location.href;
  try{
    if (navigator.share) {
      await navigator.share({ title: 'vClock clone', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    }
  }catch(e){ console.warn(e); alert('Unable to share'); }
});

/* fullscreen (toggle UI chrome) */
fullscreenBtn.addEventListener('click', async ()=> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    document.body.classList.add('fullscreen-mode');
  } else {
    await document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', ()=> {
  if (!document.fullscreenElement) document.body.classList.remove('fullscreen-mode');
});

/* ---------- World clocks update ---------- */
function updateWorldClocks(){
  const now = new Date();
  wcLocal.textContent = now.toLocaleTimeString();
  wcUtc.textContent = now.toLocaleString('en-GB', { timeZone: 'UTC', hour:'2-digit', minute:'2-digit', second: '2-digit' });
  wcNY.textContent = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  wcLon.textContent = now.toLocaleString('en-GB', { timeZone: 'Europe/London', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
setInterval(updateWorldClocks,1000);
updateWorldClocks();

/* ---------- Alarm system with recent entries ---------- */
let alarms = JSON.parse(localStorage.getItem('vc_alarms') || '[]');
let recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms') || '[]');

function saveRecentAlarm(time, label) {
  const entry = { time, label, at: Date.now() };
  // dedupe identical last item
  if (!recentAlarms.length || recentAlarms[0].time !== time || recentAlarms[0].label !== label) {
    recentAlarms.unshift(entry);
    if (recentAlarms.length > 8) recentAlarms.pop();
    localStorage.setItem('vc_recent_alarms', JSON.stringify(recentAlarms));
  }
  renderRecentAlarms();
}

function renderRecentAlarms(){
  recentAlarms = JSON.parse(localStorage.getItem('vc_recent_alarms') || '[]');
  recentAlarmsEl.innerHTML = '';
  if (!recentAlarms.length) {
    recentAlarmsEl.innerHTML = '<li style="color:var(--muted)">No recent alarms</li>';
    return;
  }
  recentAlarms.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<button class="recent-reuse" data-time="${r.time}" data-label="${(r.label||'')}">${r.time} ${r.label ? '- '+r.label : ''}</button>`;
    recentAlarmsEl.appendChild(li);
  });
  $$('.recent-reuse').forEach(b => b.addEventListener('click', e => {
    const t = e.currentTarget.dataset.time;
    const l = e.currentTarget.dataset.label;
    alarmTimeInput.value = t;
    alarmLabelInput.value = l;
  }));
}

function renderAlarms(){
  alarmsListEl.innerHTML = '';
  if (alarms.length === 0) {
    alarmsListEl.innerHTML = '<div class="alarm-empty" style="color:var(--muted)">No alarms set</div>';
    return;
  }
  alarms.forEach((a, idx) => {
    const item = document.createElement('div');
    item.className = 'alarm-item';
    item.innerHTML = `<div><strong>${a.time}</strong> ${a.label?('- '+a.label):''}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button data-idx="${idx}" class="alarm-toggle">${a.enabled? 'On':'Off'}</button>
        <button data-del="${idx}" class="alarm-delete">✖</button>
      </div>`;
    alarmsListEl.appendChild(item);
  });
  // wire events
  $$('.alarm-delete').forEach(b => b.addEventListener('click', e => {
    const i = parseInt(e.target.dataset.del,10);
    alarms.splice(i,1);
    localStorage.setItem('vc_alarms', JSON.stringify(alarms));
    renderAlarms();
  }));
  $$('.alarm-toggle').forEach(b => b.addEventListener('click', e => {
    const i = parseInt(e.target.dataset.idx,10);
    alarms[i].enabled = !alarms[i].enabled;
    localStorage.setItem('vc_alarms', JSON.stringify(alarms));
    renderAlarms();
  }));
}
renderAlarms();
renderRecentAlarms();

addAlarmBtn.addEventListener('click', ()=> {
  const t = alarmTimeInput.value;
  if (!t) { alert('Choose a time'); return; }
  const label = alarmLabelInput.value.trim();
  alarms.push({ time: t, label, enabled: true });
  localStorage.setItem('vc_alarms', JSON.stringify(alarms));
  saveRecentAlarm(t, label);
  alarmTimeInput.value=''; alarmLabelInput.value='';
  renderAlarms();
});

testAlarmBtn && testAlarmBtn.addEventListener('click', ()=> {
  alert('Test alarm: This is how the alarm will sound.');
  // if you'd like: play a beep here (note: browsers may block autoplay)
});

/* check alarms every 1 second */
setInterval(()=> {
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  alarms.forEach(a => {
    if (a.enabled && a.time === cur) {
      // simple throttle: mark fired by toggling enabled off for 1 minute to avoid repeats
      alert(`Alarm: ${a.label || a.time}`);
      // Optionally play sound here
      a.enabled = false;
      setTimeout(()=>{ a.enabled = true; localStorage.setItem('vc_alarms', JSON.stringify(alarms)); }, 60000);
      localStorage.setItem('vc_alarms', JSON.stringify(alarms));
      renderAlarms();
    }
  });
},1000);

/* ---------- Timer ---------- */
let timerInterval = null;
let timerRemaining = 0;

function formatHMS(sec) {
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
}
timerStart.addEventListener('click', ()=> {
  const m = parseInt(timerMin.value || '0',10);
  const s = parseInt(timerSec.value || '0',10);
  timerRemaining = m*60 + s;
  if (!timerRemaining) return alert('Set minutes or seconds');
  timerDisplay.textContent = formatHMS(timerRemaining);
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=> {
    timerRemaining--;
    timerDisplay.textContent = formatHMS(timerRemaining);
    if (timerRemaining<=0) {
      clearInterval(timerInterval);
      alert('Timer finished');
    }
  },1000);
});
timerPause.addEventListener('click', ()=> {
  if (timerInterval) { clearInterval(timerInterval); timerInterval=null; }
});
timerReset.addEventListener('click', ()=> {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = 0;
  timerDisplay.textContent = '00:00:00';
});

/* preset timer buttons */
presetTimerBtns.forEach(btn => {
  btn.addEventListener('click', e=>{
    const sec = parseInt(e.currentTarget.dataset.sec,10);
    timerMin.value = Math.floor(sec/60);
    timerSec.value = sec % 60;
  });
});

/* ---------- Stopwatch ---------- */
let swStartTs = 0, swElapsed = 0, swTimer = null, lapCount=0;
swStart.addEventListener('click', ()=> {
  if (!swTimer) {
    swStartTs = Date.now();
    swTimer = setInterval(()=> {
      const now = Date.now();
      const t = swElapsed + Math.floor((now - swStartTs)/100);
      const secs = Math.floor(t/10)/10;
      const hh = Math.floor(secs/3600), mm = Math.floor((secs%3600)/60), ss = (secs%60).toFixed(1);
      swDisplay.textContent = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(4,'0')}`;
    },100);
    swStart.textContent = 'Pause';
  } else {
    // pause
    clearInterval(swTimer);
    swTimer = null;
    swElapsed += Math.floor((Date.now() - swStartTs)/100);
    swStart.textContent = 'Resume';
  }
});
swStop.addEventListener('click', ()=> {
  if (swTimer) { clearInterval(swTimer); swTimer=null; }
  swStart.textContent = 'Start';
  swElapsed = 0; swStartTs = 0;
  swDisplay.textContent = '00:00:00.0';
  lapsEl.innerHTML = '';
  lapCount = 0;
});
swLap.addEventListener('click', ()=> {
  lapCount++;
  const div = document.createElement('div');
  div.textContent = `${lapCount}. ${swDisplay.textContent}`;
  lapsEl.prepend(div);
});
swReset.addEventListener('click', ()=> {
  if (swTimer) clearInterval(swTimer);
  swTimer = null; swStart.textContent='Start'; swElapsed=0; swStartTs=0;
  swDisplay.textContent = '00:00:00.0'; lapsEl.innerHTML=''; lapCount=0;
});

/* ---------- Init view sizes & persistence ---------- */
containerEl.style.transform = `scale(${settings.scale})`;

window.addEventListener('DOMContentLoaded', ()=> {
  // load settings into controls
  formatSelect.value = settings.format;
  toggleSeconds.checked = settings.showSeconds;
  clockColorInput.value = settings.clockColor;
  bgColorInput.value = settings.bgColor;
  fontScale.value = settings.scale;

  applySettingsToUI();
  renderAlarms();
  renderRecentAlarms();
});

/* ---------- Helpers: show how-to for initial active nav ---------- */
const initialView = document.querySelector('.nav-item.active').dataset.view || 'alarm';
showHowToFor(initialView);
