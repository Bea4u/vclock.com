function updateClock() {
  const now = new Date();
  let hours = now.getHours().toString().padStart(2, "0");
  let minutes = now.getMinutes().toString().padStart(2, "0");
  let seconds = now.getSeconds().toString().padStart(2, "0");

  document.getElementById("clock").innerText = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock();

// Theme Toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Fullscreen
document.getElementById("fullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Zoom controls
let zoom = 1;
document.getElementById("zoom-in").addEventListener("click", () => {
  zoom += 0.1;
  document.getElementById("clock").style.transform = `scale(${zoom})`;
});
document.getElementById("zoom-out").addEventListener("click", () => {
  zoom = Math.max(0.5, zoom - 0.1);
  document.getElementById("clock").style.transform = `scale(${zoom})`;
});

// Share button (copy URL)
document.getElementById("share").addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied to clipboard!");
});
