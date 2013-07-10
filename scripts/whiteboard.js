var canvas = document.getElementById('whiteboard');
var ctx = canvas.getContext('2d');
var drawing = false;
var current_stroke = [];

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function startStroke(canvas_ctx, pt) {
  drawing = true;
  current_stroke.push(pt);
}

function endStroke(canvas_ctx) {
  drawing = false;
  current_stroke = [];
}

canvas.addEventListener('resize', function (evt) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

canvas.addEventListener('mousemove', function (evt) {
  if (!drawing) {
    return;
  }
  if (!current_stroke.length) {
    return;
  }
  var prev = current_stroke[current_stroke.length - 1];
  var pos = getMousePos(canvas, evt);
  current_stroke.push(pos);

  ctx.beginPath();
  ctx.moveTo(prev.x, prev.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener('mousedown', function (evt) {
  var pt = getMousePos(canvas, evt);
  startStroke(ctx, pt)
});

canvas.addEventListener('mouseup', function (evt) {
  endStroke(ctx);
});

canvas.addEventListener('mouseout', function (evt) {
  endStroke(ctx);
});
