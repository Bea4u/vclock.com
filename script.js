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
/* script.js - vClock clone: clocks, alarms, world time grid, add/move/delete */
"use strict";

/* ---------- small utility ---------- */
function el(tag, html){ const d=document.createElement(tag); if(html!==undefined) d.innerHTML=html; return d; }
function q(sel,root=document){ return root.querySelector(sel); }
function qa(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }

/* ---------- persistent storage ---------- */
const STORAGE_KEYS = {
  CITIES: 'vc_world_cities_v1'
};
function loadCities(){
  const saved = localStorage.getItem(STORAGE_KEYS.CITIES);
  if (saved) {
    try { return JSON.parse(saved); } catch(e){}
  }
  // default: replicate popular order from vClock
  return [
    {name:'Local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, href:'#'},
    {name:'UTC', tz:'UTC', href:'#'},
    {name:'New York, USA', tz:'America/New_York', href:'new-york-united-states/'},
    {name:'London, United Kingdom', tz:'Europe/London', href:'london-united-kingdom/'},
    {name:'Tokyo, Japan', tz:'Asia/Tokyo', href:'tokyo-japan/'},
    {name:'Sydney, Australia', tz:'Australia/Sydney', href:'sydney-australia/'},
    {name:'Toronto, Canada', tz:'America/Toronto', href:'toronto-canada/'},
    {name:'Beijing, China', tz:'Asia/Shanghai', href:'beijing-china/'},
    {name:'Singapore, Singapore', tz:'Asia/Singapore', href:'singapore-singapore/'},
    {name:'Berlin, Germany', tz:'Europe/Berlin', href:'berlin-germany/'},
    {name:'Lagos, Nigeria', tz:'Africa/Lagos', href:'lagos-nigeria/'},
    {name:'Hong Kong, China', tz:'Asia/Hong_Kong', href:'hong-kong-china/'}
  ];
}
function saveCities(list){
  localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(list));
}

/* ---------- render / grid management ---------- */
let worldCities = loadCities();

function buildClockCol(city, idx){
  const col = el('div');
  col.className = 'clock-col panel';
  col.dataset.idx = idx;
  col.innerHTML = `
    <div class="panel-heading colored" style="padding:10px;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-weight:700"><a class="colored ext-link" href="${city.href}" style="color:inherit;text-decoration:none;">${city.name}</a></div>
      <div class="tools" style="display:flex;gap:8px;align-items:center">
        <a class="colored ext-link open-link" href="${city.href}" title="Open clock">⛶</a>
        <span class="pm-menu">
          <button class="pm-toggle" aria-label="Options">⋯</button>
          <div class="dropdown-menu">
            <a class="pm-edit" href="javascript:;">Edit</a>
            <div class="divider" style="height:6px"></div>
            <a class="pm-move-top" href="javascript:;">Move to Top</a>
            <a class="pm-move-up" href="javascript:;">Move Up</a>
            <a class="pm-move-down" href="javascript:;">Move Down</a>
            <div class="divider" style="height:6px"></div>
            <a class="pm-delete" href="javascript:;">Delete</a>
          </div>
        </span>
      </div>
    </div>
    <div class="panel-body clock-body" data-tz="${city.tz}" style="padding:12px;">
      <div class="colored digit text-nowrap text-center font-digit" style="font-size:30px">--:--:--</div>
      <div class="colored text-center" style="font-size:14px;opacity:0.85;margin-top:6px">–</div>
    </div>
  `;
  // add event handlers for menu
  const menu = col.querySelector('.pm-menu');
  const toggle = col.querySelector('.pm-toggle');
  toggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  // actions
  col.querySelector('.pm-edit').addEventListener('click', ()=> { openEditDialog(idx); menu.classList.remove('open'); });
  col.querySelector('.pm-move-top').addEventListener('click', ()=> { moveCity(idx,0); menu.classList.remove('open'); });
  col.querySelector('.pm-move-up').addEventListener('click', ()=> { moveCity(idx, Math.max(0, idx-1)); menu.classList.remove('open'); });
  col.querySelector('.pm-move-down').addEventListener('click', ()=> { moveCity(idx, Math.min(worldCities.length-1, idx+1)); menu.classList.remove('open'); });
  col.querySelector('.pm-delete').addEventListener('click', ()=> { deleteCity(idx); menu.classList.remove('open'); });
  // close menus when clicking outside
  document.addEventListener('click', ()=> { menu.classList.remove('open'); });
  return col;
}

function renderWorldGrid(){
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.innerHTML = '';
  worldCities.forEach((c,i) => grid.appendChild(buildClockCol(c,i)));
  saveCities(worldCities);
}
renderWorldGrid();

/* ---------- time update loop ---------- */
function updateAllClocks(){
  const bodies = document.querySelectorAll('.clock-body');
  bodies.forEach(b=>{
    const tz = b.dataset.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    try {
      const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour12:true, hour:'2-digit', minute:'2-digit', second:'2-digit' });
      b.querySelector('.font-digit').textContent = timeStr;
      const dateStr = now.toLocaleDateString('en-US', { timeZone: tz, weekday:'short', month:'short', day:'numeric' });
      b.querySelector('.text-center').textContent = dateStr;
    } catch(e){
      b.querySelector('.font-digit').textContent = 'n/a';
      b.querySelector('.text-center').textContent = tz;
    }
  });
  // also update big clock top-right if present
  const big = document.getElementById('nowbig');
  if (big) big.textContent = new Date().toLocaleTimeString();
}
setInterval(updateAllClocks, 1000);
updateAllClocks();

/* ---------- city operations ---------- */
function moveCity(oldIdx, newIdx){
  if (oldIdx === newIdx) return;
  const [item] = worldCities.splice(oldIdx,1);
  worldCities.splice(newIdx,0,item);
  renderWorldGrid();
}
function deleteCity(idx){
  if (!confirm('Delete this city?')) return;
  worldCities.splice(idx,1);
  renderWorldGrid();
}
function openEditDialog(idx){
  const c = worldCities[idx];
  const newName = prompt('Edit city display name:', c.name);
  if (newName === null) return; // cancelled
  const newTz = prompt('Edit IANA timezone (e.g. Europe/Paris):', c.tz);
  if (newTz === null) return;
  c.name = newName.trim() || c.name;
  c.tz = newTz.trim() || c.tz;
  worldCities[idx] = c;
  saveCities(worldCities);
  renderWorldGrid();
}

/* ---------- add city UI ---------- */
const addBtn = document.getElementById('add-city-btn');
const quickInput = document.getElementById('quick-search');
if (addBtn && quickInput){
  addBtn.addEventListener('click', ()=>{
    const v = quickInput.value.trim();
    if (!v) { alert('Enter a city display name or timezone'); quickInput.focus(); return; }
    // If value looks like a timezone (contains '/'), treat as tz
    if (v.includes('/')) {
      const guessedName = v.split('/').pop().replace(/_/g,' ');
      worldCities.push({ name: guessedName + ' ('+v+')', tz: v, href:'#' });
    } else {
      // try to guess timezone by searching known list (simple heuristic)
      const guess = guessTZFromName(v);
      if (guess) {
        worldCities.push({ name: v, tz: guess, href:'#' });
      } else {
        const tz = prompt('Timezone not recognized. Enter IANA timezone for "'+v+'", e.g. Europe/Paris:');
        if (!tz) return;
        worldCities.push({ name: v, tz: tz.trim(), href:'#' });
      }
    }
    saveCities(worldCities);
    renderWorldGrid();
    quickInput.value = '';
  });
}

function guessTZFromName(name){
  // crude mapping for common cities - extendable
  const map = {
    'new york':'America/New_York','london':'Europe/London','paris':'Europe/Paris',
    'tokyo':'Asia/Tokyo','sydney':'Australia/Sydney','lagos':'Africa/Lagos',
    'beijing':'Asia/Shanghai','singapore':'Asia/Singapore','toronto':'America/Toronto',
    'berlin':'Europe/Berlin','hong kong':'Asia/Hong_Kong','los angeles':'America/Los_Angeles'
  };
  const key = name.toLowerCase();
  return map[key] || null;
}

/* ---------- optional: expose render function for time.html simple bootstrap ---------- */
function renderWorldClock(){ renderWorldGrid(); updateAllClocks(); }

/* ---------- allow other pages to import worldCities if needed ---------- */
window.vc = window.vc || {};
window.vc.worldCities = worldCities;
window.renderWorldGrid = renderWorldGrid;
window.renderWorldClock = renderWorldClock;

