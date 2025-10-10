/* worldclock.js — vClock-style World Clock
 * Shows live time for multiple world cities
 */

const vWorldClock = (() => {
  const cities = [
    { name: "New York", tz: "America/New_York" },
    { name: "London", tz: "Europe/London" },
    { name: "Paris", tz: "Europe/Paris" },
    { name: "Tokyo", tz: "Asia/Tokyo" },
    { name: "Sydney", tz: "Australia/Sydney" },
    { name: "Dubai", tz: "Asia/Dubai" },
    { name: "Los Angeles", tz: "America/Los_Angeles" },
    { name: "Moscow", tz: "Europe/Moscow" },
  ];

  let timer;

  // Utility: format time nicely
  function formatTime(date, tz) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: tz,
    });
  }

  // Utility: format date
  function formatDate(date, tz) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: tz,
    });
  }

  // Create city blocks
  function buildClockElements() {
    const container = document.getElementById("world-clock");
    if (!container) return;
    container.innerHTML = "";

    cities.forEach((city) => {
      const block = document.createElement("div");
      block.className = "clock-item panel panel-default";

      const inner = document.createElement("div");
      inner.className = "panel-body text-center colored";

      const title = document.createElement("h3");
      title.textContent = city.name;
      title.className = "city-name main-title";

      const timeEl = document.createElement("div");
      timeEl.id = `time-${city.tz.replace(/\//g, "-")}`;
      timeEl.className = "city-time digit font-digit";

      const dateEl = document.createElement("div");
      dateEl.id = `date-${city.tz.replace(/\//g, "-")}`;
      dateEl.className = "city-date digit-text";

      inner.appendChild(title);
      inner.appendChild(timeEl);
      inner.appendChild(dateEl);
      block.appendChild(inner);
      container.appendChild(block);
    });
  }

  // Update each clock
  function updateTimes() {
    const now = new Date();
    cities.forEach((city) => {
      const timeEl = document.getElementById(`time-${city.tz.replace(/\//g, "-")}`);
      const dateEl = document.getElementById(`date-${city.tz.replace(/\//g, "-")}`);
      if (timeEl) timeEl.textContent = formatTime(now, city.tz);
      if (dateEl) dateEl.textContent = formatDate(now, city.tz);
    });
  }

  // Init and start ticking
  function init() {
    buildClockElements();
    updateTimes();
    timer = setInterval(updateTimes, 1000);
  }

  return { init };
})();

// Auto-init when DOM ready
document.addEventListener("DOMContentLoaded", vWorldClock.init);
