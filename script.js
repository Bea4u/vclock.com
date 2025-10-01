  // Elements
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const toggle24 = document.getElementById('toggle24');
  const showDate = document.getElementById('showDate');
  const nightMode = document.getElementById('nightMode');

  // Alarm
  const alarmListEl = document.getElementById('alarmList');
  const addAlarmForm = document.getElementById('addAlarmForm');
  const alarmTimeInput = document.getElementById('alarmTime');
  const alarmLabelInput = document.getElementById('alarmLabel');
  const alarmRepeat = document.getElementById('alarmRepeat');

  // Timer
  const timerTime = document.getElementById('timerTime');
  const timerMinutes = document.getElementById('timerMinutes');
  const startTimerBtn = document.getElementById('startTimer');
  const pauseTimerBtn = document.getElementById('pauseTimer');
  const resetTimerBtn = document.getElementById('resetTimer');

  // Stopwatch
  const swTime = document.getElementById('swTime');
  const swStart = document.getElementById('swStart');
  const swLap = document.getElementById('swLap');
  const swStop = document.getElementById('swStop');
  const swReset = document.getElementById('swReset');
  const lapsEl = document.getElementById('laps');

  // state
  let alarms = JSON.parse(localStorage.getItem('vc_alarms') || '[]');
  let alarmSoundCtx = null;
  let alarmPlaying = false;

  // Timer state
  let timerRemaining = 0;
  let timerInterval = null;
  let timerPaused = false;
  let timerTarget = null;

  // Stopwatch state
  let swRunning = false;
  let swStartTs = 0;
  let swElapsed = 0;
  let swInterval = null;

  // Helpers
  function formatTime(date, use24 = false) {
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    if (!use24) {
      const ampm = hh >= 12 ? 'PM' : 'AM';
      hh = hh % 12 || 12;
      return `${pad(hh)}:${pad(mm)}:${pad(ss)} ${ampm}`;
    }
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }
  function pad(n){ return n < 10 ? '0'+n : n }
  function formatDate(date){
    return date.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'short', day:'numeric' });
  }

  // Tabs
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('visible'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('visible');
  }));

  // Clock loop (1s)
  function tickClock() {
    const now = new Date();
    const use24 = toggle24.checked;
    timeEl.textContent = formatTime(now, use24);
    dateEl.textContent = showDate.checked ? formatDate(now) : '';
    // check alarms
    checkAlarms(now);
  }
  setInterval(tickClock, 1000);
  tickClock();

  // Alarm: save / render / check
  function renderAlarms(){
    alarmListEl.innerHTML = '';
    if (!alarms.length){
      alarmListEl.innerHTML = '<div style="color:var(--muted)">No alarms set</div>';
      return;
    }
    alarms.forEach((a, i) => {
      const item = document.createElement('div');
      item.className = 'alarm-item';
      item.innerHTML = `<div><strong>${a.label||'Alarm'}</strong><div style="color:var(--muted);font-size:13px">${a.time} • ${a.repeat}</div></div>
        <div><button data-i="${i}" class="del">Delete</button></div>`;
      alarmListEl.appendChild(item);
    });
    alarmListEl.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.i,10);
      alarms.splice(idx,1);
      saveAlarms();
      renderAlarms();
    }));
  }
  function saveAlarms(){ localStorage.setItem('vc_alarms', JSON.stringify(alarms)); }

  addAlarmForm.addEventListener('submit', e => {
    e.preventDefault();
    const time = alarmTimeInput.value;
    if(!time) return;
    alarms.push({ time, label: alarmLabelInput.value || 'Alarm', repeat: alarmRepeat.value || 'once', active:true });
    saveAlarms();
    renderAlarms();
    addAlarmForm.reset();
  });

  function checkAlarms(now){
    if (!alarms.length) return;
    const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    alarms.forEach((a, idx) => {
      // a.time stored as hh:mm (24h from input)
      if (a.active && a.time === hhmm && now.getSeconds() === 0) {
        // handle repeats
        if (a.repeat === 'once') {
          a.active = false;
          saveAlarms();
          renderAlarms();
        } else if (a.repeat === 'weekdays') {
          const d = now.getDay(); // 0 sunday
          if (d === 0 || d === 6) return;
        }
        triggerAlarm(a);
      }
    });
  }

  function triggerAlarm(alarmObj){
    if (alarmPlaying) return;
    alarmPlaying = true;
    playAlarmSound();
    const label = alarmObj.label || 'Alarm';
    // show simple alert UI
    const stop = confirm(`${label}\n\nStop alarm?`);
    stopAlarm();
  }

  function stopAlarm(){
    stopAlarmSound();
    alarmPlaying = false;
  }

  // Web Audio beep
  function ensureAudioCtx(){
    if (!alarmSoundCtx) alarmSoundCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playAlarmSound(){
    ensureAudioCtx();
    const ctx = alarmSoundCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0;
    const now = ctx.currentTime;
    o.start(now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.05);
    o.frequency.linearRampToValueAtTime(440, now + 1);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 6);
    o.stop(now + 6);
  }
  function stopAlarmSound(){
    // no persistent node to stop; above stops automatically after ramp
    // create short burst to clear audio (no-op)
  }

  // Timer logic
  function renderTimer(){
    const mm = Math.floor(timerRemaining / 60);
    const ss = timerRemaining % 60;
    timerTime.textContent = `${pad(mm)}:${pad(ss)}`;
  }
  startTimerBtn.addEventListener('click', () => {
    if (timerInterval) return;
    const minutes = Math.max(0, parseInt(timerMinutes.value,10) || 0);
    timerRemaining = Math.round(minutes * 60);
    if (timerRemaining <= 0) return;
    timerTarget = Date.now() + timerRemaining*1000;
    timerInterval = setInterval(() => {
      timerRemaining = Math.max(0, Math.round((timerTarget - Date.now())/1000));
      renderTimer();
      if (timerRemaining <= 0){
        clearInterval(timerInterval);
        timerInterval = null;
        playAlarmSound();
        alert('Timer finished');
      }
    }, 250);
  });
  pauseTimerBtn.addEventListener('click', () => {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
  });
  resetTimerBtn.addEventListener('click', () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval=null; }
    timerRemaining = 0;
    renderTimer();
  });
  // init
  renderTimer();

  // Stopwatch
  function renderStopwatch(){
    const total = swElapsed + (swRunning ? (Date.now() - swStartTs) : 0);
    const s = Math.floor(total / 1000);
    const ms = Math.floor((total % 1000) / 10);
    const mm = Math.floor(s/60);
    const ss = s % 60;
    swTime.textContent = `${pad(mm)}:${pad(ss)}.${pad(ms)}`;
  }
  swStart.addEventListener('click', () => {
    if (swRunning) return;
    swRunning = true;
    swStartTs = Date.now();
    swInterval = setInterval(renderStopwatch, 50);
  });
  swStop.addEventListener('click', () => {
    if (!swRunning) return;
    swRunning = false;
    clearInterval(swInterval);
    swElapsed += Date.now() - swStartTs;
    renderStopwatch();
  });
  swReset.addEventListener('click', () => {
    swRunning = false;
    clearInterval(swInterval);
    swElapsed = 0; swStartTs = 0;
    lapsEl.innerHTML = '';
    renderStopwatch();
  });
  swLap.addEventListener('click', () => {
    const total = swElapsed + (swRunning ? (Date.now() - swStartTs) : 0);
    const s = Math.floor(total / 1000);
    const ms = Math.floor((total % 1000) / 10);
    const mm = Math.floor(s/60);
    const ss = s % 60;
    const li = document.createElement('li');
    li.textContent = `${pad(mm)}:${pad(ss)}.${pad(ms)}`;
    lapsEl.prepend(li);
  });

  // Settings persistence
  function saveUISettings(){
    localStorage.setItem('vc_ui', JSON.stringify({
      use24: toggle24.checked,
      showDate: showDate.checked,
      night: nightMode.checked
    }));
  }
  function loadUISettings(){
    const s = JSON.parse(localStorage.getItem('vc_ui')||'{}');
    if (s.use24) toggle24.checked = s.use24;
    if (s.showDate !== undefined) showDate.checked = s.showDate;
    if (s.night) nightMode.checked = s.night;
    applyNightMode();
  }
  toggle24.addEventListener('change', saveUISettings);
  showDate.addEventListener('change', saveUISettings);
  nightMode.addEventListener('change', () => { saveUISettings(); applyNightMode(); });

  function applyNightMode(){
    if (nightMode.checked) document.body.style.background = 'linear-gradient(180deg,#000012 0%, #06061a 60%)';
    else document.body.style.background = 'linear-gradient(180deg,#06070a 0%, #0b0c10 60%)';
  }

  // init
  loadUISettings();
  renderAlarms();

  // small embedding helper
  window.vClockCloneEmbed = {
    setAlarmLink: (hhmm, label = 'Alarm') => {
      // returns an anchor-like URL with query string? we will create a simple link scheme
      return `${location.origin}${location.pathname}?setAlarm=${encodeURIComponent(hhmm)}&label=${encodeURIComponent(label)}`;
    }
  };

  // On load check querystring to set alarm (embed usage)
  (function handleQueryAlarm(){
    const params = new URLSearchParams(location.search);
    const set = params.get('setAlarm');
    const label = params.get('label') || '';
    if (set) {
      // set alarm if valid hh:mm
      if (/^\d{1,2}:\d{2}$/.test(set)) {
        const hhmm = set.split(':').map(n => pad(Number(n))).slice(0,2).join(':');
        alarms.push({ time: hhmm, label, repeat: 'once', active:true });
        saveAlarms(); renderAlarms();
      }
    }
  })();

})();
