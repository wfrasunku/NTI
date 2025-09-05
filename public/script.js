const layers = [
  { el: document.getElementById("layer-back"), intensity: 50 },
  { el: document.getElementById("layer-front"), intensity: 100 },
  { el: document.getElementById("layer-objects"), intensity: 100 }
];

document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  layers.forEach(layer => {
    const moveX = -x * 3 * layer.intensity;
    const moveY = -y * 1.5 * layer.intensity;
    layer.el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
  });
});
