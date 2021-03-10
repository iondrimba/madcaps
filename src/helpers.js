const radians = (degrees) => {
  return degrees * Math.PI / 180;
}

function hexToRgb(h) {
  let r = 0, g = 0, b = 0;

  // 3 digits
  if (h.length == 4) {
    r = "0x" + h[1] + h[1];
    g = "0x" + h[2] + h[2];
    b = "0x" + h[3] + h[3];

    // 6 digits
  } else if (h.length == 7) {
    r = "0x" + h[1] + h[2];
    g = "0x" + h[3] + h[4];
    b = "0x" + h[5] + h[6];
  }

  return { r: +r, g: +g, b: +b };
}

const rgbToHex = s => s.match(/[0-9]+/g).reduce((a, b) => a + (b | 256).toString(16).slice(1), '#')

const rInterval = function (callback, delay) {
  const dateNow = Date.now;
  const requestAnimation = window.requestAnimationFrame;
  let start = dateNow();
  let stop;

  const intervalFunc = function () {
    dateNow() - start < delay || (start += delay, callback());
    stop || requestAnimation(intervalFunc);
  };

  requestAnimation(intervalFunc);

  return {
    clear: function () { stop = 1 },
  };
}

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}
function lerpColor(a, b, amount) {

  var ah = parseInt(a.replace(/#/g, ''), 16),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ''), 16),
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

export {
  rInterval,
  distance,
  radians,
  rgbToHex,
  hexToRgb,
  lerpColor,
};
