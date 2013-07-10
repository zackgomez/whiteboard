function createSocket() {
  var handleMessage = function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke_progress') {
      renderLine(msg.prev, msg.pos);
    } else if (msg.type == 'history') {
      client_id = msg.client_id;
      setHistory(msg.commits);
      head = msg.head;
      renderCommit(head);
    } else if (msg.type == 'stroke_commit') {
      stroke_history.push(msg.stroke);
    } else if (msg.type == 'stroke_begin') {
      if (current_stroke && msg.stroke_id === current_stroke.id) {
        current_stroke.parent_id = msg.parent_id;
      }
      if (msg.stroke_id in commits) {
        commits[msg.stroke_id].parent_id = msg.parent_id;
      }
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
var current_stroke = null;
var ws = createSocket();
var commits = {};
var head = null;
var client_id = null;
var local_stroke_count = 0;

function clearWhiteboard(canvas, ctx) {
  var rect = getBoundingRect(canvas);
  ctx.clearRect(0, 0, rect.right, rect.bottom);
}

function localReset() {
  clearWhiteboard(canvas, ctx);
  commits = {};
}

function reset() {
  localReset();
  ws.send(JSON.stringify({
    type: 'reset',
  }));
}

function setHistory(new_history) {
  clearWhiteboard(canvas, ctx);
  commits = new_history;
}

function renderCommit(commit_id) {
  if (commit_id === null) {
    return;
  }
  var commit = commits[commit_id];
  if (!commit) {
    throw new Error('commit id ' + commit_id + ' not found');
  }

  renderCommit(commit.parent_id);
  if (commit.data.points) {
    renderPoints(commit.data.points);
  }
}

function startStroke(pt) {
  drawing = true;
  current_stroke = {
    id: client_id + '.' + local_stroke_count++,
    parent_id: head,
    data: {
      points: [pt]
    }
  }
  head = current_stroke.id;
  
  var msg = {
    type: 'stroke_new',
    id: current_stroke.id,
    parent_id: current_stroke.parent_id
  };
  ws.send(JSON.stringify(msg));
}

function endStroke(canvas_ctx) {
  if (!drawing) {
    return;
  }
    
  var msg = {
    type: 'stroke_commit',
    stroke: current_stroke
  };
  ws.send(JSON.stringify(msg));

  commits[current_stroke.id] = current_stroke;

  drawing = false;
  current_stroke = null;
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
  if (!drawing || !current_stroke) {
    drawing = false;
    current_stroke = null;
    return;
  }
  var prev = current_stroke.data.points[current_stroke.data.points.length - 1];
  var pos = getMousePos(canvas, evt);
  current_stroke.data.points.push(pos);

  renderLine(prev, pos);
  var msg = {
    type: 'stroke_progress',
    prev: prev,
    pos: pos
  };
  ws.send(JSON.stringify(msg));
});

canvas.addEventListener('mousedown', function (evt) {
  var pt = getMousePos(canvas, evt);
  startStroke(pt)
});

canvas.addEventListener('mouseup', function (evt) {
  endStroke(ctx);
});

canvas.addEventListener('mouseout', function (evt) {
  endStroke(ctx);
});

attachControls();
