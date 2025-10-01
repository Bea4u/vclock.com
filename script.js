// vClock clone with topbar, sidebar, floating actions, tools (world clock, online timer, pomodoro)
// Keep files separated: index.html / style.css / script.js

(() => {
  // UI elements
  const tabsButtons = document.querySelectorAll('.nav-item');
  const topTabs = document.querySelectorAll('.tab'); // not used (sidebar handles)
  const panels = {
    clock: document.getElementById('clock'),
    alarm: document.getElementById('alarm'),
    timer: document.getElementById('timer'),
    stopwatch: document.getElementById('stopwatch')
  };

  // topbar tools
  const toolsBtn = document.getElementById('toolsBtn');
  const toolsMenu = document.getElementById('toolsMenu');
  const toolsOverlay = document.getElementById('toolsOverlay');
  const toolContent = document.getElementById('toolContent');
  const closeTools = document.getElementById('closeTools');

  // theme & settings
  const themeToggle = document.getElementById('themeToggle');
  const nightMode = document.getElementById('nightMode');
  const toggle24 = document.getElementById('toggle24');
  const showDate = document.getElementById('showDate');

  // clock elements
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');

  // alarm
  const alarmListEl = document.getElementById('alarmList');
  const addAlarmForm = document.getElementById('addAlarmForm');
  const alarmTimeInput = document.getElementById('alarmTime');
  const alarmLabelInput = document.getElementById('alarmLabel');
  const alarmRepeat = document.getElementById('alarmRepeat');

  // timer
  const timerTime = document.getElementById('timerTime');
  const timerMinutes = document.getElementById('timerMinutes');
  const startTimerBtn = document.getElementById('startTimer');
  const pauseTimerBtn = document.getElementById('pauseTimer');
  const resetTimerBtn = document.getElementById('resetTimer');

  // stopwatch
  const swTime = document.getElementById('swTime');
  const swStart = document.getElementById('swStart');
  const swLap = document.getElementById('swLap');
  const swStop = document.getElementById('swStop');
  const swReset = document.getElementById('swReset');
  const lapsEl = document.getElementById('laps');

  // floating actions
  const shareBtn = document.getElementById('shareBtn');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const fullScreenBtn = document.getElementById('fullScreen');

  // state
  let alarms = JSON.parse(localStorage.getItem('vc_alarms') || '[]');
  let uiSettings = JSON.parse(localStorage.getItem('vc_ui') || '{}');
  let alarmSoundCtx = null;
  let alarmPlaying = false;

  // timer state
  let timerRemaining = 0;
  let timerInterval = null;
  let timerTarget = null;

  // stopwatch state
  let swRunning = false;
  let swStartTs = 0;
  let swElapsed = 0;
  let swInterval = null;

  // helpers
  const pad = n => (n < 10 ? '0' + n : String(n));
  function formatDate(d) {
    return d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'short', day:'numeric' });
  }
  function formatClock(d, use24 = false) {
    let hh = d.getHours(), mm = d.getMinutes(), ss = d.getSeconds();
    if (!use24) {
      const ampm = hh >= 12 ? 'PM':'AM';
      hh = hh % 12 || 12;
      return `${pad(hh)}:${pad(mm)}:${pad(ss)} ${ampm}`;
    }
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  // UI: switch panel by data-tab
  function setActiveTab(tabName) {
    Object.keys(panels).forEach(k => {
      panels[k].classList.toggle('hidden', k !== tabName);
    });
    tabsButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
  }

  tabsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.dataset.tab);
    });
  });

  // Clock tick
  function tickClock() {
    const now = new Date();
    const use24 = toggle24.checked;
    timeEl.textContent = formatClock(now, use24);
    dateEl.textContent = showDate.checked ? formatDate(now) : '';
    checkAlarms(now);
  }
  setInterval(tickClock, 1000);
  tickClock();

  // Alarms
  function renderAlarms() {
    alarmListEl.innerHTML = '';
    if (!alarms.length) {
      alarmListEl.innerHTML = '<div style="color:rgba(200,200,200,0.4)">No alarms set</div>';
      return;
    }
    alarms.forEach((a, i) => {
      const it = document.createElement('div'); it.className = 'alarm-item';
      const left = document.createElement('div');
      left.innerHTML = `<strong>${a.label || 'Alarm'}</strong><div style="color:rgba(200,200,200,0.5);font-size:13px">${a.time} • ${a.repeat}</div>`;
      const right = document.createElement('div');
      const del = document.createElement('button'); del.className = 'btn'; del.textContent = 'Delete';
      del.addEventListener('click', () => { alarms.splice(i,1); saveAlarms(); renderAlarms(); });
      right.appendChild(del);
      it.appendChild(left); it.appendChild(right);
      alarmListEl.appendChild(it);
    });
  }
  function saveAlarms(){ localStorage.setItem('vc_alarms', JSON.stringify(alarms)); }
  addAlarmForm && addAlarmForm.addEventListener('submit', e => {
    e.preventDefault();
    const t = alarmTimeInput.value;
    if (!t) return;
    alarms.push({ time: t, label: alarmLabelInput.value || 'Alarm', repeat: alarmRepeat.value || 'once', active: true });
    saveAlarms(); renderAlarms(); addAlarmForm.reset();
  });

  function checkAlarms(now) {
    if (!alarms.length) return;
    const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    alarms.forEach((a, i) => {
      if (a.active && a.time === hhmm && now.getSeconds() === 0) {
        if (a.repeat === 'once') { a.active = false; saveAlarms(); renderAlarms(); }
        else if (a.repeat === 'weekdays') { const d = now.getDay(); if (d === 0 || d === 6) return; }
        triggerAlarm(a);
      }
    });
  }

  function ensureAudioCtx(){
    if (!alarmSoundCtx) alarmSoundCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playAlarmSound(){
    ensureAudioCtx();
    const ctx = alarmSoundCtx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'sine'; o2.type = 'triangle';
    o1.frequency.value = 880; o2.frequency.value = 440;
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    g.gain.value = 0;
    const now = ctx.currentTime;
    o1.start(now); o2.start(now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.05);
    o1.frequency.linearRampToValueAtTime(440, now + 1);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 6);
    o1.stop(now + 6); o2.stop(now + 6);
  }
  function triggerAlarm(a){
    if (alarmPlaying) return;
    alarmPlaying = true;
    playAlarmSound();
    const stop = confirm(`${a.label || 'Alarm'}\n\nStop alarm?`);
    alarmPlaying = false;
  }

  renderAlarms();

  // Timer
  function renderTimer(){
    const mm = Math.floor(timerRemaining / 60), ss = timerRemaining % 60;
    timerTime.textContent = `${pad(mm)}:${pad(ss)}`;
  }
  startTimerBtn && startTimerBtn.addEventListener('click', () => {
    if (timerInterval) return;
    const minutes = Math.max(0, parseInt(timerMinutes.value, 10) || 0);
    timerRemaining = Math.round(minutes * 60);
    if (timerRemaining <= 0) return;
    timerTarget = Date.now() + timerRemaining * 1000;
    timerInterval = setInterval(() => {
      timerRemaining = Math.max(0, Math.round((timerTarget - Date.now()) / 1000));
      renderTimer();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval); timerInterval = null;
        ensureAudioCtx(); playAlarmSound(); alert('Timer finished');
      }
    }, 250);
  });
  pauseTimerBtn && pauseTimerBtn.addEventListener('click', () => {
    if (!timerInterval) return;
    clearInterval(timerInterval); timerInterval = null;
  });
  resetTimerBtn && resetTimerBtn.addEventListener('click', () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerRemaining = 0; renderTimer();
  });
  renderTimer();

  // Stopwatch
  function renderStopwatch(){
    const total = swElapsed + (swRunning ? (Date.now() - swStartTs) : 0);
    const s = Math.floor(total / 1000), ms = Math.floor((total % 1000) / 10);
    const mm = Math.floor(s/60), ss = s % 60;
    swTime.textContent = `${pad(mm)}:${pad(ss)}.${pad(ms)}`;
  }
  swStart && swStart.addEventListener('click', () => {
    if (swRunning) return;
    swRunning = true; swStartTs = Date.now();
    swInterval = setInterval(renderStopwatch, 50);
  });
  swStop && swStop.addEventListener('click', () => {
    if (!swRunning) return; swRunning = false; clearInterval(swInterval); swElapsed += Date.now() - swStartTs; renderStopwatch();
  });
  swReset && swReset.addEventListener('click', () => { swRunning = false; clearInterval(swInterval); swElapsed = 0; swStartTs = 0; lapsEl.innerHTML = ''; renderStopwatch(); });
  swLap && swLap.addEventListener('click', () => {
    const total = swElapsed + (swRunning ? (Date.now() - swStartTs) : 0);
    const s = Math.floor(total / 1000), ms = Math.floor((total % 1000) / 10);
    const mm = Math.floor(s/60), ss = s % 60;
    const li = document.createElement('li'); li.textContent = `${pad(mm)}:${pad(ss)}.${pad(ms)}`; lapsEl.prepend(li);
  });

  // UI settings persistence
  function saveUI(){
    localStorage.setItem('vc_ui', JSON.stringify({
      use24: toggle24.checked,
      showDate: showDate.checked,
      nightMode: nightMode.checked
    }));
  }
  function loadUI(){
    const s = JSON.parse(localStorage.getItem('vc_ui') || '{}');
    if (s.use24) toggle24.checked = s.use24;
    if (typeof s.showDate !== 'undefined') showDate.checked = s.showDate;
    if (s.nightMode) nightMode.checked = s.nightMode;
    applyNightMode();
  }
  toggle24 && toggle24.addEventListener('change', saveUI);
  showDate && showDate.addEventListener('change', saveUI);
  nightMode && nightMode.addEventListener('change', () => { saveUI(); applyNightMode(); });

  function applyNightMode(){
    if (nightMode.checked) document.body.style.background = 'linear-gradient(180deg,#000012 0%, #06061a 60%)';
    else document.body.style.background = 'var(--bg)';
  }
  loadUI();

  // Tools dropdown toggle
  toolsBtn.addEventListener('click', (e) => {
    const open = toolsMenu.style.display === 'block';
    toolsMenu.style.display = open ? 'none' : 'block';
    toolsMenu.setAttribute('aria-hidden', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) { toolsMenu.style.display = 'none'; toolsMenu.setAttribute('aria-hidden','true'); }
  });

  // Tools menu actions
  toolsMenu.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      const tool = b.dataset.tool;
      openTool(tool);
      toolsMenu.style.display = 'none';
    });
  });

  function openTool(tool){
    toolsOverlay.classList.remove('hidden');
    document.getElementById('toolContent').innerHTML = ''; // clear
    if (tool === 'world') showWorldClock();
    else if (tool === 'online-timer') showOnlineTimer();
    else if (tool === 'pomodoro') showPomodoro();
  }

  closeTools && closeTools.addEventListener('click', () => { toolsOverlay.classList.add('hidden'); });
  toolsOverlay.addEventListener('click', (e) => { if (e.target === toolsOverlay) toolsOverlay.classList.add('hidden'); });

  // World clock simple implementation
  function showWorldClock(){
    const content = document.getElementById('toolContent');
    content.innerHTML = `
      <h3>World Clock</h3>
      <p>Add timezone (IANA) e.g. "America/New_York" or "Europe/London"</p>
      <div style="display:flex;gap:8px"><input id="tzInput" placeholder="America/New_York"><button id="addTz" class="btn">Add</button></div>
      <div id="tzList" style="margin-top:12px"></div>
    `;
    const tzList = document.getElementById('tzList');
    const saved = JSON.parse(localStorage.getItem('vc_tz') || '[]');
    saved.forEach(t => appendTZ(tzList, t));
    document.getElementById('addTz').addEventListener('click', () => {
      const val = document.getElementById('tzInput').value.trim();
      if (!val) return;
      const arr = JSON.parse(localStorage.getItem('vc_tz') || '[]'); arr.push(val); localStorage.setItem('vc_tz', JSON.stringify(arr)); appendTZ(tzList, val);
    });
    function appendTZ(container, tz){
      const el = document.createElement('div'); el.style.marginBottom = '8px';
      const span = document.createElement('div'); span.innerHTML = `<strong>${tz}</strong> — <span class="tzTime">loading...</span>`;
      const del = document.createElement('button'); del.textContent = 'Remove'; del.className='btn'; del.style.marginLeft='8px';
      del.addEventListener('click', () => {
        const arr = JSON.parse(localStorage.getItem('vc_tz')||'[]').filter(x => x !== tz); localStorage.setItem('vc_tz', JSON.stringify(arr)); el.remove();
      });
      el.appendChild(span); el.appendChild(del); container.appendChild(el);
      // update time periodically
      function update(){
        try {
          const time = new Intl.DateTimeFormat(undefined,{timeZone:tz, hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date());
          span.querySelector('.tzTime').textContent = time;
        } catch (err) {
          span.querySelector('.tzTime').textContent = 'Invalid timezone';
        }
      }
      update(); setInterval(update, 1000);
    }
  }

  // Online timer: reuse timer UI inside overlay
  function showOnlineTimer(){
    const content = document.getElementById('toolContent');
    content.innerHTML = `
      <h3>Online Timer</h3>
      <p>Start a quick online timer (this runs while page is open)</p>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="otMinutes" type="number" value="5" style="width:80px;padding:8px;border-radius:6px">
        <span>minutes</span>
        <button id="otStart" class="btn">Start</button>
        <button id="otStop" class="btn">Stop</button>
        <div id="otDisplay" style="margin-left:12px;font-weight:700">00:00</div>
      </div>
    `;
    let otRemaining = 0; let otInterval = null; const d = document.getElementById('otDisplay');
    document.getElementById('otStart').addEventListener('click', () => {
      const m = Math.max(0, parseInt(document.getElementById('otMinutes').value,10) || 0);
      otRemaining = m * 60;
      if (otInterval) clearInterval(otInterval);
      otInterval = setInterval(() => {
        otRemaining = Math.max(0, otRemaining - 1);
        const mm = Math.floor(otRemaining/60), ss = otRemaining%60; d.textContent = `${pad(mm)}:${pad(ss)}`;
        if (otRemaining <= 0) { clearInterval(otInterval); ensureAudioCtx(); playAlarmSound(); alert('Online timer finished'); }
      },1000);
    });
    document.getElementById('otStop').addEventListener('click', () => { if (otInterval) clearInterval(otInterval); otRemaining = 0; d.textContent='00:00'; });
  }

  // Pomodoro basics
  function showPomodoro(){
    const content = document.getElementById('toolContent');
    content.innerHTML = `
      <h3>Pomodoro</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="workMin" type="number" value="25" style="width:80px;padding:8px">
        <span>work</span>
        <input id="breakMin" type="number" value="5" style="width:80px;padding:8px">
        <span>break</span>
        <button id="startPom" class="btn">Start</button>
        <button id="stopPom" class="btn">Stop</button>
        <div id="pomDisplay" style="margin-left:12px;font-weight:700">00:00</div>
      </div>
    `;
    let pomRemaining = 0; let pomInterval = null; let isWork = true;
    const disp = document.getElementById('pomDisplay');
    document.getElementById('startPom').addEventListener('click', () => {
      const w = Math.max(1, parseInt(document.getElementById('workMin').value,10)||25);
      const b = Math.max(1, parseInt(document.getElementById('breakMin').value,10)||5);
      isWork = true; pomRemaining = w * 60; disp.textContent = `${pad(Math.floor(pomRemaining/60))}:${pad(pomRemaining%60)}`;
      if (pomInterval) clearInterval(pomInterval);
      pomInterval = setInterval(() => {
        pomRemaining = Math.max(0, pomRemaining-1); disp.textContent = `${pad(Math.floor(pomRemaining/60))}:${pad(pomRemaining%60)}`;
        if (pomRemaining <= 0) {
          ensureAudioCtx(); playAlarmSound();
          if (isWork) { isWork = false; pomRemaining = b*60; alert('Work session done — break time!'); }
          else { isWork = true; pomRemaining = w*60; alert('Break finished — start work!'); }
        }
      },1000);
    });
    document.getElementById('stopPom').addEventListener('click', () => { if (pomInterval) clearInterval(pomInterval); disp.textContent='00:00'; });
  }

  // Floating actions
  shareBtn && shareBtn.addEventListener('click', async () => {
    const shareData = { title: 'vClock clone', text: 'Check out this online clock', url: location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { alert('Share canceled or not supported'); }
    } else {
      // fallback: copy URL
      try { await navigator.clipboard.writeText(location.href); alert('Link copied to clipboard'); } catch { prompt('Copy link', location.href); }
    }
  });

  // zoom in/out (increase font-size of .time)
  zoomIn && zoomIn.addEventListener('click', () => {
    const el = document.querySelector('.time');
    const cur = parseFloat(window.getComputedStyle(el).fontSize);
    el.style.fontSize = Math.min(200, cur + 8) + 'px';
  });
  zoomOut && zoomOut.addEventListener('click', () => {
    const el = document.querySelector('.time');
    const cur = parseFloat(window.getComputedStyle(el).fontSize);
    el.style.fontSize = Math.max(24, cur - 8) + 'px';
  });

  // fullscreen
  fullScreenBtn && fullScreenBtn.addEventListener('click', async () => {
    const doc = document.documentElement;
    if (!document.fullscreenElement) {
      try { await doc.requestFullscreen(); } catch (err) { alert('Cannot enter fullscreen'); }
    } else { if (document.exitFullscreen) await document.exitFullscreen(); }
  });

  // Theme toggle quick handler
  themeToggle && themeToggle.addEventListener('click', () => {
    nightMode.checked = !nightMode.checked; saveUI(); applyNightMode();
  });

  // Load settings on open
  function init() {
    // apply stored ui
    if (uiSettings.use24) toggle24.checked = uiSettings.use24;
    if (typeof uiSettings.showDate !== 'undefined') showDate.checked = uiSettings.showDate;
    if (uiSettings.nightMode) nightMode.checked = uiSettings.nightMode;
    applyNightMode();
    renderAlarms();
  }
  init();

  // small helper: make sidebar nav reflect initial panel
  setActiveTab('alarm');

  // click outside tools overlay closes etc.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toolsOverlay.classList.add('hidden');
      toolsMenu.style.display = 'none';
    }
  });

})();
