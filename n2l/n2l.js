var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var stage = {
  width: 0, height: 0,
  mouse: {
    x: 0, y: 0
  }
};

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
var i = 0;
function draw() {
  requestAnimationFrame(draw);
  ctx.fillStyle = 'hsl(' + (i=i+0.25) + ', 80%, 75%)';
  ctx.fillRect(0, 0, stage.width, stage.height);
}
draw();