var Ph = {};

// Vector 2D
Ph.Vector2 = function(x, y) {
  if (x !== undefined) {
    this.x = x;
  }
  if (y !== undefined) {
    this.y = y;
  }
};
  Ph.Vector2.prototype.magnitude = function() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
  };
  Ph.Vector2.prototype.angle = function() {
    return Math.atan(this.y / this.x);
  };

// Displacement-Velocity-Acceleration System
Ph.DVASystem2 = function(dx, dy, vx, vy, ax, ay) {
  this.displacement = new Ph.Vector2(dx, dy);
  this.velocity = new Ph.Vector2(vx, vy);
  this.acceleration = new Ph.Vector2(ax, ay);
};
  Ph.DVASystem2.tick = function() {
    this.displacement.x += this.velocity.x;
    this.displacement.y += this.velocity.y;
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
  };

// Force/Mass/Acceleration Relationship
Ph.FMARelationship = function(params) {
  params = params || {};
  this.force = params.force;
  this.mass = params.mass;
  this.acceleration = params.acceleration;
};
  Ph.FMARelationship.prototype.force = function(params, set) {
    params = params || {};
    var mass = params.mass || this.mass;
    var acceleration = params.acceleration || this.acceleration;
    var force = mass * acceleration;
    if (set) {
      this.force = force;
    }
    return force;
  };
  Ph.FMARelationship.prototype.mass = function(params, set) {
    params = params || {};
    var force = params.force || this.force;
    var acceleration = params.acceleration || this.acceleration;
    var mass = force / acceleration;
    if (set) {
      this.mass = mass;
    }
    return mass;
  };
  Ph.FMARelationship.prototype.acceleration = function(params, set) {
    params = params || {};
    var force = params.force || this.force;
    var mass = params.mass || this.mass;
    var acceleration = force / mass;
    if (set) {
      this.acceleration = acceleration;
    }
    return acceleration;
  };