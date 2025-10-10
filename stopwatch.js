/* stopwatch.js — vClock-style stopwatch
 * Features: start, pause, reset, lap tracking, elapsed time display
 */

const vStopwatch = (() => {
  const stopwatch = {
    startTime: 0,
    elapsed: 0,
    running: false,
    intervalId: null,
    laps: [],
  };

  // Elements
  const elDisplay = document.getElementById("lbl-time") || document.querySelector(".stopwatch-display");
  const elStart = document.getElementById("btn-start-stopwatch");
  const elPause = document.getElementById("btn-pause-stopwatch");
  const elReset = document.getElementById("btn-reset-stopwatch");
  const elLap = document.getElementById("btn-lap-stopwatch");
  const elLaps = document.getElementById("pnl-laps");

  // Format elapsed time
  function format(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const msPart = Math.floor((ms % 1000) / 10);
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(msPart).padStart(2, "0")}`;
  }

  // Update display
  function render() {
    if (!elDisplay) return;
    elDisplay.textContent = format(stopwatch.elapsed);
  }

  // Start stopwatch
  function start() {
    if (stopwatch.running) return;
    stopwatch.running = true;
    stopwatch.startTime = Date.now() - stopwatch.elapsed;
    stopwatch.intervalId = setInterval(() => {
      stopwatch.elapsed = Date.now() - stopwatch.startTime;
      render();
    }, 31);
  }

  // Pause stopwatch
  function pause() {
    stopwatch.running = false;
    clearInterval(stopwatch.intervalId);
  }

  // Reset stopwatch
  function reset() {
    pause();
    stopwatch.elapsed = 0;
    stopwatch.laps = [];
    render();
    renderLaps();
  }

  // Record a lap
  function lap() {
    if (!stopwatch.running) return;
    stopwatch.laps.unshift(stopwatch.elapsed);
    renderLaps();
  }

  // Render laps list
  function renderLaps() {
    if (!elLaps) return;
    elLaps.innerHTML = "";
    stopwatch.laps.forEach((t, i) => {
      const li = document.createElement("div");
      li.className = "lap-entry";
      li.textContent = `Lap ${stopwatch.laps.length - i}: ${format(t)}`;
      elLaps.appendChild(li);
    });
  }

  // Event bindings
  function bindEvents() {
    if (elStart) elStart.addEventListener("click", start);
    if (elPause) elPause.addEventListener("click", pause);
    if (elReset) elReset.addEventListener("click", reset);
    if (elLap) elLap.addEventListener("click", lap);
  }

  function init() {
    render();
    renderLaps();
    bindEvents();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", vStopwatch.init);
