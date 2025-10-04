/* js/script.js - shared engine for vClock clone (live time, theme toggle, alarm audio, helpers) */
(function(){
  // Live header clock update
  function updateNow() {
    const nowbigEls = document.querySelectorAll('#nowbig');
    const nowdateEls = document.querySelectorAll('#nowdate');
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const dateStr = now.toLocaleDateString();
    nowbigEls.forEach(e=> e.textContent = timeStr);
    nowdateEls.forEach(e=> e.textContent = dateStr);
  }
  setInterval(updateNow, 1000);
  updateNow();

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('invert-theme');
    });
  }

  // Floating controls (fullscreen, zoom, share) - only present on index.html
  const fsBtn = document.getElementById('fullscreen');
  if (fsBtn) fsBtn.addEventListener('click', ()=> { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); });
  const zoomIn = document.getElementById('zoom-in');
  const zoomOut = document.getElementById('zoom-out');
  if (zoomIn) zoomIn.addEventListener('click', ()=> { document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toString(); });
  if (zoomOut) zoomOut.addEventListener('click', ()=> { document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) - 0.1).toString(); });
  const shareBtn = document.getElementById('share');
  if (shareBtn) shareBtn.addEventListener('click', async ()=> {
    try {
      if (navigator.share) await navigator.share({ title: 'vClock clone', url: location.href });
      else { await navigator.clipboard.writeText(location.href); alert('Link copied'); }
    } catch(e){ alert('Share failed'); }
  });

  // Alarm audio + fallback oscillator
  const audioPath = 'assets/alarm.wav';
  let alarmAudio = null;
  try { alarmAudio = new Audio(audioPath); alarmAudio.loop = true; } catch(e) { alarmAudio = null; }

  let fallbackCtx=null, fallbackOsc=null;
  function startFallbackBeep(){
    if (!window.AudioContext && !window.webkitAudioContext) return;
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
  function stopFallbackBeep(){
    try { if (fallbackOsc) fallbackOsc.stop(); if (fallbackCtx) fallbackCtx.close(); } catch(e){}
    fallbackOsc = null; fallbackCtx = null;
  }

  function playAlarmLoop(){
    if (alarmAudio) {
      const p = alarmAudio.play();
      if (p && p.catch) p.catch(()=> startFallbackBeep());
    } else startFallbackBeep();
    showStopAlarmButton();
  }
  function stopAlarmLoop(){
    try { if (alarmAudio) { alarmAudio.pause(); alarmAudio.currentTime = 0; } } catch(e){}
    stopFallbackBeep();
    hideStopAlarmButton();
  }

  function showStopAlarmButton(){
    if (document.getElementById('stop-alarm-overlay')) return;
    const btn = document.createElement('button');
    btn.id = 'stop-alarm-overlay';
    btn.textContent = 'Stop Alarm';
    Object.assign(btn.style, { position:'fixed', left:'50%', top:'10%', transform:'translateX(-50%)', zIndex:10000, padding:'12px 18px', background:'#ff4444', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' });
    btn.addEventListener('click', ()=> stopAlarmLoop());
    document.body.appendChild(btn);
  }
  function hideStopAlarmButton(){ const b=document.getElementById('stop-alarm-overlay'); if(b) b.remove(); }

  window.vcAlarm = { play: playAlarmLoop, stop: stopAlarmLoop };

  // Donate buttons
  document.querySelectorAll('.donate-btn').forEach(b=> b.addEventListener('click', e=> {
    const link = e.currentTarget.dataset.link || 'https://www.paypal.me/JoyNance576';
    window.open(link, '_blank');
  }));

})();
