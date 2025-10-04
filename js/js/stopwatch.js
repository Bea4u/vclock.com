/* js/stopwatch.js - stopwatch with laps */
(function(){
  const startBtn = document.getElementById('start-stopwatch');
  const lapBtn = document.getElementById('lap-stopwatch');
  const stopBtn = document.getElementById('stop-stopwatch');
  const resetBtn = document.getElementById('reset-stopwatch');
  const lapsEl = document.getElementById('laps');
  const displayEl = document.querySelector('#nowbig') || document.querySelector('.nowbig');

  let running = false;
  let startTs = 0;
  let elapsed = 0; // ms
  let intervalId = null;

  function formatMS(ms){
    const total = Math.floor(ms/1000);
    const h = Math.floor(total/3600);
    const m = Math.floor((total%3600)/60);
    const s = total%60;
    if (h>0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function render(){
    const ms = elapsed + (running ? (Date.now() - startTs) : 0);
    if (displayEl) displayEl.textContent = (ms<1000) ? '00:00:00' : formatMS(ms);
  }

  if (startBtn) startBtn.addEventListener('click', ()=>{
    if (!running) {
      running = true;
      startTs = Date.now();
      startBtn.textContent = 'Pause';
      intervalId = setInterval(render, 200);
    } else {
      running = false;
      elapsed += (Date.now() - startTs);
      startBtn.textContent = 'Start';
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  if (lapBtn) lapBtn.addEventListener('click', ()=>{
    const ms = elapsed + (running ? (Date.now()-startTs) : 0);
    const li = document.createElement('li');
    li.textContent = formatMS(ms);
    if (lapsEl) lapsEl.prepend(li);
  });

  if (stopBtn) stopBtn.addEventListener('click', ()=>{
    running = false;
    elapsed = 0;
    clearInterval(intervalId); intervalId = null;
    render();
    if (lapsEl) lapsEl.innerHTML = '';
    startBtn.textContent = 'Start';
  });

  if (resetBtn) resetBtn.addEventListener('click', ()=>{
    running = false; elapsed = 0; clearInterval(intervalId); intervalId = null; render(); if (lapsEl) lapsEl.innerHTML = ''; startBtn.textContent='Start';
  });

  render();
})();
