const layers = [
  { el: document.getElementById("layer-back"), intensity: 35 },
  { el: document.getElementById("layer-mid"), intensity: 60 },
  { el: document.getElementById("layer-front"), intensity: 50 }
];

document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  layers.forEach(layer => {
    const moveX = -x * 5 * layer.intensity;
    const moveY = -y * 2 * layer.intensity;
    layer.el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
  });
});
