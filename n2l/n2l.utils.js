var Util = {};

Util.Color = function() {
  return this.parse.apply(this, arguments);
};
  // usage: .parse("#RRGGBB")
  // usage: .parse("RRGGBB")
  // usage: .parse(0xRRGGBB)
  // usage: .parse("RR", "GG", "BB")
  // usage: .parse(0xRR, 0xGG, 0xBB)
  // usage: .parse(rrr, ggg, bbb)
  Util.Color.prototype.parse = function(r, g, b) {
    if (typeof r === 'string') {
      // remove the "#" if there's one
      if (r.slice(0, 1) === '#') r = r.slice(1);
      // parse as hex
      r = parseInt(r, 16);
    }
    if (typeof g === 'string') g = parseInt(g, 16);
    if (typeof b === 'string') b = parseInt(b, 16);
    if (r !== undefined && g === undefined && b === undefined) {
      // most likely we got a color of the form 0xRRGGBB (or 'rrggbb')
      var hex = r;
      r = (hex >> 16);
      g = (hex >> 8);
      b = hex;
    }
    if (r !== undefined) {
      this.r = r & 255;
      this.g = g & 255;
      this.b = b & 255;
    }
    return this;
  };
  Util.Color.prototype.hex = function() {
    // http://stackoverflow.com/a/5624139
    return ((1 << 24) + (this.r << 16) + (this.g << 8) + this.b).toString(16).slice(1);
  };


Util.Color.lerp = function(color1, color2, level) {
  level = (level === undefined ? 0.5 : Number(level));
  return Util.Color.weightedAverage(
    [color1, color2],
    [1 - level, level]
  );
};
Util.Color.weightedAverage = function(colors, weights) {
  var outputColor = new Util.Color();
  ['r', 'g', 'b'].forEach(function(channel) {
    var channelArray = [];
    colors.forEach(function(color) {
      channelArray.push(color[channel]);
    });
    var wAvgValue = Util.weightedAverage(channelArray, weights);
    outputColor[channel] = Math.floor(wAvgValue);
  });
  return outputColor;
};
Util.lerp = function(number1, number2, level) {
  level = (level === undefined ? 0.5 : Number(level));
  return Util.weightedAverage(
    [number1, number2],
    [1 - level, level]
  );
};
Util.sum = function(array) {
  if (typeof array === 'number') {
    return array;
  }
  array.push(0);
  // now, the value on the right will always be a number.
  return array.reduceRight(function(right, left) {
    return right + Util.sum(left);
  });
};
Util.weightedAverage = function(values, weights) {
  return (Util.sum(values.map(function(number, index) {
    return number * weights[index];
  })) / Util.sum(weights));
};