const zoom = () => {
  const zoomX = window.innerWidth / 425;
  const zoomY = window.innerHeight / 687;
  document.documentElement.style.zoom = Math.max(Math.min(zoomX, zoomY, 1), 0.5);
};
zoom();
window.addEventListener("resize", zoom);
