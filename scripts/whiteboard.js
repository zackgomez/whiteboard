var canvas = document.getElementById('whiteboard');
var ctx = canvas.getContext('2d');
var drawing = false;
var current_stroke = [];
var ws = new WebSocket('ws://localhost:8081');
var stroke_history = [];

ws.onmessage = function (evt) { handleMessage(evt.data); }

function handleMessage(raw_msg) {
  var msg = JSON.parse(raw_msg);
  if (msg.type == 'stroke') {
    renderStroke(msg.stroke);
  } else if (msg.type == 'history') {
    setHistory(msg.strokes);
  } else if (msg.type == 'reset') {
    localReset();
  } else {
    console.log('unknown message', raw_msg);
  }
}

function clearWhiteboard(canvas, ctx) {
  var rect = getBoundingRect(canvas);
  ctx.clearRect(0, 0, rect.right, rect.bottom);
}

function localReset() {
  clearWhiteboard(canvas, ctx);
  stroke_history = [];
}

function reset() {
  localReset();
  ws.send(JSON.stringify({
    type: 'reset',
  }));
}

function setHistory(strokes) {
  clearWhiteboard(canvas, ctx);
  stroke_history = strokes;
  for (var i = 0; i < stroke_history.length; i++) {
    renderStroke(stroke_history[i]);
  }
}

function getBoundingRect(canvas) {
  return canvas.getBoundingClientRect();
}

function renderStroke(stroke) {
  if (stroke.length < 2) {
    return;
  }
  var prev = stroke[0];
  for (var i = 1; i < stroke.length; i++) {
    var cur = stroke[i];
    renderLine(prev, cur);
    prev = cur;
  }
}

function renderLine(start, end) {
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function getMousePos(canvas, evt) {
  var rect = getBoundingRect(canvas);
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
    var msg = {
      type: 'stroke',
      stroke: current_stroke
    };
    ws.send(JSON.stringify(msg));
  }

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

  renderLine(prev, pos);
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

canvas.addEventListener('keydown', function (evt) {
  if (evt.keyCode === 67) {
    reset();
  }
});
