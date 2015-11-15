/* globals Util, Ph */
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var n2l = {};
n2l.stage = {
  width: 0, height: 0,
  mouse: {
    x: 0, y: 0
  }
};

// update the mouse x and y when the mouse moves
window.addEventListener('mousemove', function(event) {
  n2l.stage.mouse.x = event.clientX;
  n2l.stage.mouse.y = event.clientY;
});
// update the stage and canvas size when the window's resized
// IIFE magic to make this run once anyway
window.addEventListener('resize', (function resizeListener() {
  canvas.width = n2l.stage.width = window.innerWidth;
  canvas.height = n2l.stage.height = window.innerHeight;
  return resizeListener;
}()));


// delete when used, for now just to make jshint shut up
(function(){}(Util,Ph,ctx));

n2l.scene = 0; // 0: falling
               // 1: boat
document.body.classList.add('scene-falling');

function doTransition() {
  document.body.classList.remove('scene-falling', 'scene-boat');
  document.body.classList.add('scene-transitioning');
  // do assorted transitioney stuff
  document.body.classList.remove('scene-transitioning');
  document.body.classList.add('scene-' + (n2l.scene ? 'boat' : 'falling'));
}

(function setupSceneButton() {
  n2l.$sceneToggle = document.getElementById('scene-toggle');
  n2l.$sceneToggle.addEventListener('click', function() {
    n2l.scene = 1^n2l.scene;
    doTransition();
  });
}());

(function setupDisplayPanel() {

}());

n2l.timing = {};
n2l.timing.last = Date.now();
n2l.timing.runningFPS = 60;
function draw() {
  // raf, timing
  requestAnimationFrame(draw);
  var thisTime = Date.now();
  n2l.timing.delta = thisTime - n2l.timing.last;
  n2l.timing.last = thisTime;
  n2l.timing.fps = 1000 / n2l.timing.delta;
  var runningFPS = (49 * n2l.timing.runningFPS + n2l.timing.fps) / 50;
  if (runningFPS !== n2l.timing.runningFPS) {
    n2l.timing.runningFPS = runningFPS;
    document.getElementById('fps').innerText = Math.floor(runningFPS);
  }
  // main loop!


}
requestAnimationFrame(draw);