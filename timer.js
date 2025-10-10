/* timer.js — vClock-style countdown timer
 * Features: Start, pause, reset, and sound alert when complete
 */

const vTimer = (() => {
  const timer = {
    total: 0,       // total milliseconds
    remaining: 0,
    running: false,
    intervalId: null,
    audio: null,
  };

  // Elements
  const elDisplay = document.getElementById("lbl-time") || document.querySelector(".timer-display");
  const elStart = document.getElementById("btn-start-timer");
  const elPause = document.getElementById("btn-pause-timer");
  const elReset = document.getElementById("btn-reset-timer");
  const elSet = document.getElementById("btn-set-timer");

  // Format time (HH:MM:SS)
  function format(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Render display
  function render() {
    if (!elDisplay) return;
    elDisplay.textContent = format(timer.remaining);
  }

  // Countdown tick
  function tick() {
    if (!timer.running) return;
    timer.remaining -= 1000;
    render();

    if (timer.remaining <= 0) {
      clearInterval(timer.intervalId);
      timer.running = false;
      render();
      triggerEnd();
    }
  }

  // When timer completes
  function triggerEnd() {
    alert("⏰ Time's up!");
    playSound();
  }

  // Start timer
  function start() {
    if (timer.remaining <= 0) {
      alert("Please set a valid time first.");
      return;
    }
    if (timer.running) return;
    timer.running = true;
    timer.intervalId = setInterval(tick, 1000);
  }

  // Pause timer
  function pause() {
    timer.running = false;
    clearInterval(timer.intervalId);
  }

  // Reset timer
  function reset() {
    pause();
    timer.remaining = timer.total;
    render();
  }

  // Set timer manually (via prompt)
  function setTimer() {
    const mins = parseInt(prompt("Enter minutes:"), 10);
    if (isNaN(mins) || mins <= 0) {
      alert("Invalid input.");
      return;
    }
    timer.total = mins * 60 * 1000;
    timer.remaining = timer.total;
    render();
  }

  // Sound
  function playSound() {
    if (!timer.audio) {
      timer.audio = new Audio("/sounds/timer.mp3");
    }
    timer.audio.play();
  }

  // Event listeners
  function bindEvents() {
    if (elStart) elStart.addEventListener("click", start);
    if (elPause) elPause.addEventListener("click", pause);
    if (elReset) elReset.addEventListener("click", reset);
    if (elSet) elSet.addEventListener("click", setTimer);
  }

  function init() {
    render();
    bindEvents();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", vTimer.init);
