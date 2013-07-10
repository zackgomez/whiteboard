var canvas = document.getElementById('whiteboard');
var ctx = canvas.getContext('2d');
var drawing = false;
var current_stroke = [];
var ws = new WebSocket('ws://localhost:8081');
var stroke_history = [];

ws.onmessage = function (evt) { handleMessage(evt.data); }

function handleMessage(msg) {
  stroke = JSON.parse(msg);
  renderStroke(ctx, stroke);
}

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
  if (current_stroke.length > 1) {
    stroke_history.push(current_stroke);
    ws.send(JSON.stringify(current_stroke));
  }

  drawing = false;
  current_stroke = [];
}

function renderStroke(canvas_ctx, stroke) {
  if (stroke.length < 2) {
    return;
  }
  var prev = stroke[0];
  for (var i = 1; i < stroke.length; i++) {
    var cur = stroke[i];
    canvas_ctx.beginPath();
    canvas_ctx.moveTo(prev.x, prev.y);
    canvas_ctx.lineTo(cur.x, cur.y);
    canvas_ctx.stroke();
    prev = cur;
  }
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
