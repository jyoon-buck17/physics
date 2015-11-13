var util = {};

util.Color = function() {
  return this.parse.apply(this, arguments);
};
// usage: .parse("#RRGGBB")
// usage: .parse("RRGGBB")
// usage: .parse(0xRRGGBB)
// usage: .parse("RR", "GG", "BB")
// usage: .parse(0xRR, 0xGG, 0xBB)
// usage: .parse(rrr, ggg, bbb)
util.Color.prototype.parse = function(r, g, b) {
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
util.Color.prototype.hex = function() {
  // http://stackoverflow.com/a/5624139
  return ((1 << 24) + (this.r << 16) + (this.g << 8) + this.b).toString(16).slice(1);
};