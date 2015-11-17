/* globals Util, Ph */
var CONST = {
  densityAir: 1.225,
  sailArea: 7.5,
  accelGravity: 9.8,
  displayPrecision: 4,
  wstroke: {
    lengthCoeff: 1,
    speedCoeff: 1
  }
};
var n2l = {};
function disp(n, p) {
  if (p) {
    return n.toPrecision(CONST.displayPrecision);
  }
  return Number(n.toPrecision(CONST.displayPrecision));
}
var WindStroke = function(direction) {
  // direction = 0; upward
  // direction = 1; rightward
  this.direction = direction;
  this.position = new Ph.Vector2();
  this.position.x = Math.random() * n2l.stage.width;
  this.position.y = Math.random() * n2l.stage.height;
  this.offscreen = false;
};
WindStroke.prototype.draw = function() {
  if (this.offscreen) this.offscreen = false;
  var ctx = n2l.ctx;
  ctx.beginPath();
  ctx.moveTo(this.position.x, this.position.y);
  if (this.direction) {
    ctx.lineTo(this.position.x - 10 * CONST.wstroke.lengthCoeff * n2l.boat.windSpeed,
      this.position.y);
  } else {
    ctx.lineTo(this.position.x,
      this.position.y + CONST.wstroke.lengthCoeff * n2l.active.velocity);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0, 4 - 1E-2 * n2l.active.velocity);
  ctx.stroke();
  if (this.direction) {
    this.position.x += 5 * CONST.wstroke.speedCoeff * n2l.boat.windSpeed;
    if (this.position.x - 10 * CONST.wstroke.lengthCoeff * n2l.boat.windSpeed > n2l.stage.width) {
      this.offscreen = true;
      this.position.x -= (1 + Math.random()) * n2l.stage.width;
      this.position.y = Math.random() * n2l.stage.height;
    }
  } else {
    this.position.y -= CONST.wstroke.speedCoeff * n2l.active.velocity;
    if (this.position.y + CONST.wstroke.lengthCoeff * n2l.active.velocity < 0) {
      this.offscreen = true;
      this.position.x = Math.random() * n2l.stage.width;
      this.position.y += (1 + Math.random()) * n2l.stage.height;
    }
  }
};
n2l.$stage = document.getElementById('stage');
n2l.stage = {
  width: 0, height: 0,
  mouse: {
    x: 0, y: 0
  }
};
n2l.$canvas = document.getElementById('c');
n2l.ctx = n2l.$canvas.getContext('2d');
n2l.ctx.globalCompositeOperation = 'destination-atop';
n2l.windStrokes = [];


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
n2l.falling.imageStates = ["marble","brick","bowling ball","anvil","piano","rhino"];
(function() {
  // preload all the images, hopefully
  n2l.falling.imageStates.forEach(function(imageName) {
    var $img = document.createElement('img');
    $img.src = 'assets/falling/' + imageName.replace(' ', '-') + '.png';
  });

  n2l.falling.$img = document.createElement('img');
  n2l.falling.$img.style.transform = 'translate(-9999px, -9999px)';
  n2l.$stage.appendChild(n2l.falling.$img);

  n2l.falling.init = function() {
    n2l.windStrokes.forEach(function(stroke) {
      stroke.direction = 0;
    });
  };
  n2l.falling.rot = new Ph.DVASystem2(0, 0, 0, 0, 0, 0);
  n2l.falling.lastImage = '';
  n2l.falling.draw = function() {
    n2l.falling.rot.acceleration.x += 0.01 * (0.5 - Math.random());
    if (Math.abs(n2l.falling.rot.velocity.x) > 2) {
      n2l.falling.rot.acceleration.x -= Math.sign(n2l.falling.rot.velocity.x) * 0.02;
      n2l.falling.rot.acceleration.x *= 0.25;
    }
    var mass = n2l.falling.fma.mass;
    var image = n2l.falling.getMassType(mass).replace(' ', '-');
    if (image !== n2l.falling.lastImage) {
      n2l.falling.$img.src = 'assets/falling/' + image + '.png';
      n2l.falling.lastImage = image;
    }
    // i assure you, this is all quite a bit crappier than I wanted it to be
    n2l.falling.rot.tick();
    var rotate = n2l.falling.rot.displacement.x;
    var scale = 1 + (0.2 * Math.log10(n2l.falling.fma.mass));
    n2l.falling.$img.style.transform =
      'scale(' + scale + ') ' +
      'rotate(' + rotate + 'deg) ';

    // now, draw all the wind strokes
    n2l.ctx.clearRect(0, 0, n2l.stage.width, n2l.stage.height);
    n2l.windStrokes.forEach(function(stroke) {
      stroke.draw();
    });
  };
  n2l.falling.cleanUp = function() {
    n2l.falling.$img.style.transform = 'translate(-9999px, -9999px)';
  };

}());
n2l.falling.getMassNumber = function(mass) {
  var n = 0;
  if (mass >= 0.5) n++;
  if (mass >= 4) n++;
  if (mass >= 10) n++;
  if (mass >= 200) n++;
  if (mass >= 1000) n++;
  return n;
};
n2l.falling.getMassType = function(mass) {
  return n2l.falling.imageStates[n2l.falling.getMassNumber(mass)];
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
(function() {
  n2l.boat.$img = document.createElement('img');
  n2l.boat.$img.src = 'assets/boat.png';
  n2l.boat.$img.style.display = 'none';
  n2l.boat.$img.style.transform = 'translate(-9999px, -9999px)';
  n2l.boat.$img.style.transformOrigin = 'bottom center';
  n2l.$stage.appendChild(n2l.boat.$img);
  n2l.boat.init = function() {
    n2l.windStrokes.forEach(function(stroke) {
      stroke.direction = 1;
    });
    n2l.boat.$img.style.display = 'block';
    n2l.boat.tick = 0;
    n2l.boat.pos = 0;
  };
  n2l.boat.draw = function() {
    n2l.boat.tick++;
    n2l.boat.windSpeed = Math.sqrt(n2l.active.fma.force / (CONST.densityAir * CONST.sailArea));
    // now, draw all the wind strokes
    n2l.ctx.clearRect(0, 0, n2l.stage.width, n2l.stage.height);
    n2l.windStrokes.forEach(function(stroke) {
      stroke.draw();
    });
    n2l.boat.pos += n2l.boat.velocity * n2l.timing.delta * 0.1;
    var rotation = Math.min(2 * n2l.boat.windSpeed, 15) * Math.sin(n2l.boat.tick / 80);
    var scale = 0.66 + n2l.boat.fma.mass / 7200;
    n2l.boat.$img.style.transform = 'translate(' +
       n2l.boat.pos + 'px, 0) scale(' + scale + ') rotate(' + rotation + 'deg)';
  };
  n2l.boat.cleanUp = function() {
    n2l.boat.$img.style.display = 'none';
    n2l.boat.$img.style.transform = 'translate(-9999px, -9999px)';
  };
}());
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
n2l.active = n2l.falling;

function doTransition() {
  document.body.classList.remove('scene-falling', 'scene-boat');
  document.body.classList.add('scene-transitioning');
  n2l.active.cleanUp();
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
  n2l.active.init();
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
    n2l.boat.pos = 0;
  });
  n2l.updateDisplays = function() {
    if (n2l.scene === 1) {
      var vel = Math.sqrt(n2l.active.fma.force / (CONST.densityAir * CONST.sailArea));
      n2l.boat.windSpeed = vel;
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

// going with 800 for now. can change on the spot if super laggy
// by setting localstorage.wind
for (var i = (Number(localStorage.getItem('wind')) || 800); i >= 0; i--) {
  n2l.windStrokes.push(new WindStroke(0));
}

n2l.timing = {};
n2l.timing.last = Date.now();
n2l.timing.runningFPS = 60;
doTransition();
function draw() {
  // raf, timing
  requestAnimationFrame(draw);
  n2l.timing.this = Date.now();
  n2l.timing.delta = n2l.timing.this - n2l.timing.last;
  n2l.timing.last = n2l.timing.this;
  n2l.timing.fps = 1000 / n2l.timing.delta;
  var runningFPS = (49 * n2l.timing.runningFPS + n2l.timing.fps) / 50;
  if (runningFPS !== n2l.timing.runningFPS) {
    n2l.timing.runningFPS = runningFPS;
    document.getElementById('fps').innerText = Math.floor(runningFPS);
  }
  // main loop!

  n2l.active.draw();
  n2l.active.velocity += n2l.active.fma.acceleration * n2l.timing.delta * 1E-3;
  n2l.updateDisplays();
}
requestAnimationFrame(draw);