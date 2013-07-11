var Canvas = function () {
  var exports = {};

  var canvas = null;
  var ctx = null;

  var getMousePos = function (canvas, evt) {
    var rect = getBoundingRect(canvas);
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  };

  exports.init = function (id, callbacks) {
    canvas = document.getElementById(id);
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousemove', function (evt) {
      var pt = getMousePos(canvas, evt);
      callbacks.mousemove(pt);
    });

    canvas.addEventListener('mousedown', function (evt) {
      var pt = getMousePos(canvas, evt);
      callbacks.mousedown(pt);
    });

    canvas.addEventListener('mouseup', function (evt) {
      var pt = getMousePos(canvas, evt);
      callbacks.mouseup(pt);
    });

    canvas.addEventListener('mouseout', function (evt) {
      var pt = getMousePos(canvas, evt);
      callbacks.mouseout(pt);
    });
  };

  exports.getCanvas = function () {
    return canvas;
  };

  exports.getContext = function () {
    return ctx;
  };

  exports.clear = function () {
    var rect = getBoundingRect(canvas);
    ctx.clearRect(0, 0, rect.right, rect.bottom);
  };

  exports.renderLine = function (start, end, width) {
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  return exports;
}();
