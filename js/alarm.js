/* js/alarm.js - set/test/trigger alarms (stores in localStorage); uses vcAlarm from script.js */
(function(){
  const STORAGE_KEY = 'vc_alarms_v1';
  let alarms = [];
  const listEl = document.getElementById('alarms-list');
  const presetGrid = document.getElementById('preset-grid');

  const presets = ["04:00","04:30","05:00","06:00","07:00","08:00","09:00","12:00","15:00","18:00"];
  function renderPresets(){
    if (!presetGrid) return;
    presetGrid.innerHTML = '';
    presets.forEach(p=>{
      const b = document.createElement('button');
      b.textContent = p;
      b.dataset.time = p;
      b.className = 'btn-ghost';
      b.addEventListener('click', ()=> addAlarm(p,'Preset'));
      presetGrid.appendChild(b);
    });
  }

  function load() {
    try { alarms = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ alarms = []; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms)); }

  function renderAlarms(){
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!alarms.length) { listEl.innerHTML = '<div style="color:#999">No alarms set</div>'; return; }
    alarms.forEach((a,i)=>{
      const div = document.createElement('div'); div.className = 'alarm-item';
      div.innerHTML = `<div><strong>${a.time}</strong> ${a.label?('- '+escapeHtml(a.label)):''}</div>
        <div style="display:flex;gap:8px">
          <button data-i="${i}" class="btn-ghost toggle">${a.enabled? 'On':'Off'}</button>
          <button data-del="${i}" class="btn-ghost del">✖</button>
        </div>`;
      listEl.appendChild(div);
    });
    // attach events
    listEl.querySelectorAll('.del').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const i = parseInt(e.currentTarget.dataset.del,10);
        alarms.splice(i,1); save(); renderAlarms();
      });
    });
    listEl.querySelectorAll('.toggle').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const i = parseInt(e.currentTarget.dataset.i,10);
        alarms[i].enabled = !alarms[i].enabled; save(); renderAlarms();
      });
    });
  }

  function addAlarm(time,label){
    if (!time) return alert('Invalid time');
    alarms.push({ time, label: label||'', enabled:true });
    save(); renderAlarms();
    addRecent(time,label||'');
    alert('Alarm set: ' + time);
  }

  function addRecent(time,label){
    try {
      const key = 'vc_recent_v1';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift({time,label,at:Date.now()});
      if (arr.length>12) arr.pop();
      localStorage.setItem(key, JSON.stringify(arr));
    }catch(e){}
  }

  function tickCheck() {
    const now = new Date();
    const cur = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    alarms.forEach((a,idx)=>{
      if (a.enabled && a.time === cur) {
        if (window.vcAlarm && typeof window.vcAlarm.play === 'function') window.vcAlarm.play();
        a.enabled = false; save(); renderAlarms();
        setTimeout(()=>{ a.enabled = true; save(); renderAlarms(); }, 61*1000);
      }
    });
  }

  const setBtn = document.getElementById('set-alarm');
  if (setBtn) setBtn.addEventListener('click', ()=> {
    const t = document.getElementById('alarm-time').value;
    const l = document.getElementById('alarm-label').value || '';
    if (!t) return alert('Pick a time');
    addAlarm(t, l);
  });
  const testBtn = document.getElementById('test-alarm');
  if (testBtn) testBtn.addEventListener('click', ()=> {
    if (window.vcAlarm && typeof window.vcAlarm.play === 'function') {
      window.vcAlarm.play();
      setTimeout(()=> window.vcAlarm.stop(), 2000);
    }
  });

  // escape HTML helper
  function escapeHtml(s){ return String(s).replace(/[&<>"'`=\/]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[c]; }); }

  renderPresets();
  load();
  renderAlarms();
  setInterval(tickCheck, 10000);
  tickCheck();
})();
