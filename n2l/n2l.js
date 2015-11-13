var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var stage = {
  width: 0, height: 0,
  mouse: {
    x: 0, y: 0
  }
};

canvas.style.cursor = 'none';

// update the mouse x and y when the mouse moves
window.addEventListener('mousemove', function(event) {
  stage.mouse.x = event.clientX;
  stage.mouse.y = event.clientY;
});
// update the stage and canvas size when the window's resized
// IIFE magic to make this run once anyway
window.addEventListener('resize', (function resizeListener() {
  canvas.width = stage.width = window.innerWidth;
  canvas.height = stage.height = window.innerHeight;
  return resizeListener;
}()));
var color = new util.Color();
function draw() {
  requestAnimationFrame(draw);
  color.parse(
    255 * stage.mouse.x / stage.width,
    160,
    255 * stage.mouse.y / stage.height);
  ctx.fillStyle = "#" + color.hex();
  ctx.strokeStyle = 'white';
  ctx.fillRect(0, 0, stage.width, stage.height);
  ctx.beginPath();
  ctx.moveTo(0.5, stage.mouse.y + 0.5);
  ctx.lineTo(stage.width + 0.5, stage.mouse.y + 0.5);
  ctx.moveTo(stage.mouse.x + 0.5, 0.5);
  ctx.lineTo(stage.mouse.x + 0.5, stage.height + 0.5);
  ctx.stroke();
}
draw();