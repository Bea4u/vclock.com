/* -------------------------------------------------
   vClock — Local Clock Script
   Author: vClock
   Updated: 2025
-------------------------------------------------- */

(function() {
  const clockEl = document.getElementById('local-clock');
  if (!clockEl) return;

  // Function to update the local time
  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString();
    // Schedule next update exactly on the next second boundary
    setTimeout(updateClock, 1000 - now.getMilliseconds());
  }

  // Start updating when DOM is ready
  document.addEventListener('DOMContentLoaded', updateClock);
})();
