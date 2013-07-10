function createSocket() {
  var handleMessage = function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke') {
      renderLine(msg.prev, msg.pos);
    } else if (msg.type == 'history') {
      setHistory(msg.strokes);
      client_id = msg.client_id;
      replayStrokes(msg.strokes);
    } else if (msg.type == 'stroke_finished') {
      stroke_history.push(msg.stroke);
    } else if (msg.type == 'reset') {
      localReset();
    } else {
      console.log('unknown message', raw_msg);
    }
  }

  var wsurl = 'ws://' + window.location.hostname + ':8081';
  var ws = new WebSocket(wsurl);
  ws.onmessage = function (evt) { handleMessage(evt.data); }
  return ws;
}

var canvas = document.getElementById('whiteboard');
var ctx = canvas.getContext('2d');
var drawing = false;
var current_stroke = { points : [], id : null };
var ws = createSocket();
var stroke_history = [];
var client_id = null;
var local_stroke_count = 0;

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
    renderPoints(stroke_history[i].points);
  }
}

function getBoundingRect(canvas) {
  return canvas.getBoundingClientRect();
}

function renderPoints(points) {
  if (points.length < 2) {
    return;
  }
  var prev = points[0];
  for (var i = 1; i < points.length; i++) {
    var cur = points[i];
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
  current_stroke.id = client_id + '.' + local_stroke_count++;
  current_stroke.points.push(pt);
}

function endStroke(canvas_ctx) {
  if (current_stroke.points.length > 1) {
    stroke_history.push(current_stroke);
    var msg = {
      type: 'stroke_finished',
      stroke: current_stroke 
    };
    ws.send(JSON.stringify(msg));
  }

  drawing = false;
  current_stroke.points = [];
}

function attachControls() {
  var reset_button = document.getElementById('reset_button');
  reset_button.onmousedown = function (evt) {
    reset();
  }

  // hotkeys
  document.onkeydown = function (evt) {
    if (evt.keyCode === 67) {
      reset();
    }
  };
  if (document.layers) {
    document.captureEvents(Event.KEYPRESS);
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
  if (!current_stroke.points.length) {
    return;
  }
  var prev = current_stroke.points[current_stroke.points.length - 1];
  var pos = getMousePos(canvas, evt);
  current_stroke.points.push(pos);

  renderLine(prev, pos);
  var msg = {
    type: 'stroke',
    prev: prev,
    pos: pos
  };
  ws.send(JSON.stringify(msg));
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

attachControls();
