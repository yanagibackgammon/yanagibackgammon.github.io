(() => {
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  function placeShapes() {
    const shapes = Array.from(document.querySelectorAll('.bg-art .shape'));
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const safeZone = {
      left: vw * 0.24,
      right: vw * 0.76,
      top: vh * 0.18,
      bottom: vh * 0.82,
    };

    shapes.forEach((shape) => {
      const style = getComputedStyle(shape);
      if (style.display === 'none') return;

      const isTriangle = shape.classList.contains('triangle');
      const width = isTriangle
        ? parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
        : shape.offsetWidth;
      const height = isTriangle
        ? parseFloat(style.borderBottomWidth)
        : shape.offsetHeight;

      let left = 0;
      let top = 0;
      let centerX = 0;
      let centerY = 0;
      let attempts = 0;

      do {
        left = randomBetween(-width * 0.38, vw - width * 0.62);
        top = randomBetween(-height * 0.38, vh - height * 0.62);
        centerX = left + width / 2;
        centerY = top + height / 2;
        attempts += 1;
      } while (
        centerX > safeZone.left &&
        centerX < safeZone.right &&
        centerY > safeZone.top &&
        centerY < safeZone.bottom &&
        attempts < 30
      );

      const rotation = randomBetween(0, 360);
      const scale = isTriangle ? randomBetween(0.75, 1.22) : randomBetween(0.82, 1.24);
      const opacity = isTriangle ? randomBetween(0.12, 0.34) : randomBetween(0.55, 0.96);

      shape.style.left = `${left}px`;
      shape.style.top = `${top}px`;
      shape.style.right = 'auto';
      shape.style.bottom = 'auto';
      shape.style.opacity = opacity.toFixed(2);
      shape.style.transform = `rotate(${rotation.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
    });
  }

  let resizeTimer = null;
  window.addEventListener('DOMContentLoaded', placeShapes);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placeShapes, 120);
  });
})();
