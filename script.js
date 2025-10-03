// ========== CLOCK ==========
function updateClock() {
  const now = new Date();
  document.getElementById("clock-flat").textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateLine = document.querySelector(".subline");
  if (dateLine) {
    dateLine.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  }
}
setInterval(updateClock, 1000);
updateClock();

// ========== ALARMS ==========
let alarms = [];
const alarmsList = document.getElementById("alarms-list");
const recentAlarms = document.getElementById("recent-alarms");

function renderAlarms() {
  if (!alarmsList) return;
  alarmsList.innerHTML = alarms.map(a => `<div>${a}</div>`).join("");
}
document.querySelectorAll(".alarm-grid button").forEach(btn => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.time;
    alarms.push(t);
    renderAlarms();
    if (recentAlarms) recentAlarms.innerHTML += `<li>${t}</li>`;
  });
});
const setAlarmBtn = document.getElementById("set-alarm");
if (setAlarmBtn) {
  setAlarmBtn.addEventListener("click", () => {
    const time = document.getElementById("alarm-time").value;
    if (time) {
      alarms.push(time);
      renderAlarms();
    }
  });
}

// ========== TIMER ==========
let timerInterval, timerSeconds = 0;
const timerDisplay = document.querySelector(".timer-display");
function renderTimer() {
  if (timerDisplay) {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2,'0');
    const s = String(timerSeconds % 60).padStart(2,'0');
    timerDisplay.textContent = `${m}:${s}`;
  }
}
const startTimer = document.getElementById("start-timer");
if (startTimer) {
  startTimer.addEventListener("click", () => {
    timerSeconds = parseInt(document.getElementById("timer-minutes").value) * 60;
    renderTimer();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) clearInterval(timerInterval);
      renderTimer();
    }, 1000);
  });
}
const stopTimer = document.getElementById("stop-timer");
if (stopTimer) stopTimer.addEventListener("click", () => clearInterval(timerInterval));
const resetTimer = document.getElementById("reset-timer");
if (resetTimer) resetTimer.addEventListener("click", () => { timerSeconds=0; renderTimer(); });

// ========== STOPWATCH ==========
let swInterval, swSeconds = 0;
const swDisplay = document.querySelector(".stopwatch-display");
const laps = document.getElementById("laps");
function renderSW() {
  if (swDisplay) {
    const h = String(Math.floor(swSeconds/3600)).padStart(2,'0');
    const m = String(Math.floor(swSeconds/60)%60).padStart(2,'0');
    const s = String(swSeconds%60).padStart(2,'0');
    swDisplay.textContent = `${h}:${m}:${s}`;
  }
}
const startSW = document.getElementById("start-stopwatch");
if (startSW) startSW.addEventListener("click", () => {
  clearInterval(swInterval);
  swInterval = setInterval(() => { swSeconds++; renderSW(); }, 1000);
});
const stopSW = document.getElementById("stop-stopwatch");
if (stopSW) stopSW.addEventListener("click", () => clearInterval(swInterval));
const resetSW = document.getElementById("reset-stopwatch");
if (resetSW) resetSW.addEventListener("click", () => { swSeconds=0; renderSW(); if(laps) laps.innerHTML=""; });
const lapSW = document.getElementById("lap-stopwatch");
if (lapSW) lapSW.addEventListener("click", () => { if(laps) laps.innerHTML += `<li>${swDisplay.textContent}</li>`; });

// ========== WORLD CLOCK ==========
const worldList = document.getElementById("world-times");
function updateWorld() {
  if (!worldList) return;
  const zones = ["UTC","America/New_York","Europe/London","Africa/Lagos","Asia/Tokyo"];
  worldList.innerHTML = zones.map(z=>{
    const now = new Date().toLocaleTimeString("en-US",{timeZone:z,hour12:false});
    return `<li>${z}: ${now}</li>`;
  }).join("");
}
setInterval(updateWorld, 1000);
updateWorld();

// ========== THEME / SETTINGS ==========
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

// ========== FLOATING BUTTONS ==========
const fsBtn = document.getElementById("fullscreen");
if (fsBtn) fsBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
const zoomIn = document.getElementById("zoom-in");
if (zoomIn) zoomIn.addEventListener("click", () => {
  document.body.style.fontSize = "larger";
});
const zoomOut = document.getElementById("zoom-out");
if (zoomOut) zoomOut.addEventListener("click", () => {
  document.body.style.fontSize = "smaller";
});
