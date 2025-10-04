/* js/timer.js - simple countdown timer (uses vcAlarm.play) */
(function(){
  const display = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-timer');
  const pauseBtn = document.getElementById('pause-timer');
  const resetBtn = document.getElementById('reset-timer');
  const minutesInput = document.getElementById('timer-minutes');
  const secondsInput = document.getElementById('timer-seconds');

  let timerInterval = null;
  let remaining = 0;

  function formatHMS(sec){
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
    if (h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function render(){
    if (display) display.textContent = formatHMS(remaining);
  }

  function startTimerFromValue(){
    const m = parseInt(minutesInput.value||'0',10); const s = parseInt(secondsInput.value||'0',10);
    remaining = Math.max(0, (m*60) + (s));
    if (!remaining) { alert('Enter duration'); return; }
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remaining--;
      render();
      if (remaining <= 0) {
        clearInterval(timerInterval); timerInterval = null;
        if (window.vcAlarm && typeof window.vcAlarm.play === 'function') window.vcAlarm.play();
      }
    }, 1000);
    render();
  }

  if (startBtn) startBtn.addEventListener('click', startTimerFromValue);
  if (pauseBtn) pauseBtn.addEventListener('click', ()=>{ if (timerInterval) { clearInterval(timerInterval); timerInterval=null; } });
  if (resetBtn) resetBtn.addEventListener('click', ()=>{ if (timerInterval) { clearInterval(timerInterval); timerInterval=null; } remaining=0; render(); });

  if (display) display.textContent = '00:00:00';
})();
