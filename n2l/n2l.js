/* globals Util, Ph */
var CONST = {
  densityAir: 1.225,
  sailArea: 7.5,
  accelGravity: 9.8,
  displayPrecision: 4
};
function disp(n, p) {
  if (p) {
    return n.toPrecision(CONST.displayPrecision);
  }
  return Number(n.toPrecision(CONST.displayPrecision));
}
var n2l = {};
n2l.stage = {
  width: 0, height: 0,
  mouse: {
    x: 0, y: 0
  }
};
n2l.$canvas = document.getElementById('c');
n2l.ctx = n2l.$canvas.getContext('2d');
// falling setup
n2l.falling = {velocity: 0};
n2l.falling.fma = new Ph.FMARelationship();
n2l.falling.fma.getForce({
  mass: 1,
  acceleration: CONST.accelGravity
}, true);
n2l.falling.dynamic = ["mass"];
n2l.falling.find = 'getForce';
n2l.falling.range = {
  mass: {
    max: 3000,
    min: 0.1
  }
};
n2l.falling.getMassType = function(mass) {
  return [
    "marble","brick","bowling ball","anvil","piano","rhino"
  ][(function() {
    var n = 0;
    if (mass >= 0.5) n++;
    if (mass >= 4) n++;
    if (mass >= 10) n++;
    if (mass >= 200) n++;
    if (mass >= 1000) n++;
    return n;
  }())];
};

// boat setup
n2l.boat = {velocity: 0};
n2l.boat.fma = new Ph.FMARelationship();
n2l.boat.fma.getAcceleration({
  mass: 2000,
  force: 1 * CONST.densityAir * CONST.sailArea
}, true);
n2l.boat.dynamic = ["force", "mass"];
n2l.boat.find = 'getAcceleration';
n2l.boat.range = {
  force: {
    min: 0.1 * 0.1 * CONST.densityAir * CONST.sailArea,
    max: 32.75 * 32.75 * CONST.densityAir * CONST.sailArea
  },
  mass: {
    min: 1800,
    max: 3600
  }
};
n2l.boat.getBeaufortNumber = function(windSpeed) {
  var n = 0;
  if (windSpeed >= 0.278) n++;
  if (windSpeed >= 1.667) n++;
  if (windSpeed >= 3.333) n++;
  if (windSpeed >= 5.556) n++;
  if (windSpeed >= 8.056) n++;
  if (windSpeed >= 10.83) n++;
  if (windSpeed >= 13.89) n++;
  if (windSpeed >= 17.22) n++;
  if (windSpeed >= 20.83) n++;
  if (windSpeed >= 24.72) n++;
  if (windSpeed >= 28.61) n++;
  if (windSpeed >= 32.50) n++;
  return n;
};
n2l.boat.getBeaufortDesc = function(number) {
  return [
    "calm","light air","light breeze","gentle breeze","moderate breeze","fresh breeze","strong breeze","near gale","gale","strong gale","storm","violent storm","hurricane"
  ][number];
};

// update the mouse x and y when the mouse moves
window.addEventListener('mousemove', function(event) {
  n2l.stage.mouse.x = event.clientX;
  n2l.stage.mouse.y = event.clientY;
});
// update the stage and canvas size when the window's resized
// IIFE magic to make this run once anyway
window.addEventListener('resize', (function resizeListener() {
  n2l.$canvas.width = n2l.stage.width = window.innerWidth;
  n2l.$canvas.height = n2l.stage.height = window.innerHeight;
  return resizeListener;
}()));


// delete when used, for now just to make jshint shut up
(function(){}(Util));

n2l.scene = 0; // 0: falling
               // 1: boat

function doTransition() {
  document.body.classList.remove('scene-falling', 'scene-boat');
  document.body.classList.add('scene-transitioning');
  n2l.active = n2l[['falling', 'boat'][n2l.scene]];
  // do assorted transitioney stuff
  // since I'm on quite the time constraint, probably no nifty transitions for
  // now, but we'll at least switch out all the things that need switching out.
  n2l.active.velocity = 0;
  ['force', 'mass', 'accel'].forEach(function(type) {
    n2l.$[type].classList.remove('can-edit');
  });
  n2l.active.dynamic.forEach(function(type) {
    n2l.$[type].classList.add('can-edit');
  });

  document.body.classList.remove('scene-transitioning');
  document.body.classList.add('scene-' + ['falling', 'boat'][n2l.scene]);
}

(function setupSceneButton() {
  n2l.$sceneToggle = document.getElementById('scene-toggle');
  n2l.$sceneToggle.addEventListener('click', function() {
    n2l.scene = 1^n2l.scene;
    doTransition();
  });
}());

(function setupDisplayPanel() {
  // everything in the big object, please
  n2l.$ = {};
  // left panel: wind speed
  n2l.$.ws = {};
  n2l.$.ws.beaufortNumber = document.getElementById('ws-beaufort');
  n2l.$.ws.beaufortDescription = document.getElementById('ws-description');
  n2l.$.ws.value = document.getElementById('ws-value');
  // force-mass-acceleration
  n2l.$.force = document.getElementById('value-force');
  n2l.$.mass = document.getElementById('value-mass');
  n2l.$.massType = document.getElementById('type-mass');
  // accel and acceleration alias for compatibility with FMARelationship
  n2l.$.accel = n2l.$.acceleration = document.getElementById('value-accel');
  // right panel: velocity
  n2l.$.velocity = document.getElementById('vel-value');
  n2l.$.velocityReset = document.getElementById('vel-reset');

  n2l.$.velocityReset.addEventListener('click', function() {
    n2l.active.velocity = 0;
  });
  n2l.updateDisplays = function() {
    if (n2l.scene === 1) {
      var vel = Math.sqrt(n2l.active.fma.force / (CONST.densityAir * CONST.sailArea));
      var bn = n2l.boat.getBeaufortNumber(vel);
      n2l.$.ws.beaufortNumber.innerText = bn;
      n2l.$.ws.beaufortDescription.innerText = n2l.boat.getBeaufortDesc(bn);
      n2l.$.ws.value.innerText = disp(vel);
      n2l.$.massType.innerText = '';
    } else {
      n2l.$.massType.innerText = n2l.falling.getMassType(n2l.active.fma.mass);
    }
    n2l.$.force.innerText = disp(n2l.active.fma.force);
    n2l.$.mass.innerText = disp(n2l.active.fma.mass);
    n2l.$.accel.innerText = disp(n2l.active.fma.acceleration);

    n2l.$.velocity.innerText = disp(n2l.active.velocity, 1);
  };

  n2l.changing = '';
  n2l.changingStartX = 0;
  n2l.changingStart = 0;
  ['force', 'mass', 'acceleration'].forEach(function(type) {
    n2l.$[type].addEventListener('mousedown', function() {
      if (this.classList.contains('can-edit')) {
        n2l.changing = type;
        n2l.changingStart = n2l.active.fma[type];
      }
    });
  });
  document.body.addEventListener('mouseup', function() {
    n2l.changing = '';
  });
  document.body.addEventListener('mousemove', function(event) {
    if (n2l.changing) {
      // this is awesome:
      var change = Math.exp(8 * (event.clientX - n2l.changingStartX) / n2l.stage.width);
      // this is awesomer:
      n2l.active.fma[n2l.active.find]((function(obj){
        // math.max and math.min: clamp the new value to between the given max and min
        obj[n2l.changing] = Math.max(
          Math.min(
            change * n2l.changingStart,
            n2l.active.range[n2l.changing].max
          ),
          n2l.active.range[n2l.changing].min
        );
        return obj;
      }({})), true);
    } else {
      n2l.changingStartX = event.clientX;
    }
  });
}());

n2l.timing = {};
n2l.timing.last = Date.now();
n2l.timing.runningFPS = 60;
doTransition();
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

  n2l.active.velocity += n2l.active.fma.acceleration * n2l.timing.delta * 1E-3;
  n2l.updateDisplays();
}
requestAnimationFrame(draw);