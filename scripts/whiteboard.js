function createSocket() {
  var handleMessage = function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke_progress') {
      var stroke = commits[msg.id];
      if (!stroke) {
        return;
      }
      Canvas.renderLine(msg.prev, msg.pos, stroke.data.width, stroke.data.color);
    } else if (msg.type == 'history') {
      client_id = msg.client_id;
      setHistory(msg.commits);
      head = msg.head;
      renderCommitAndAddToGallery(head);
    } else if (msg.type == 'stroke_commit') {
      var stroke = msg.stroke;
      if (!stroke || !commits[stroke.parent_id]) {
        return;
      }
      commits[stroke.id] = stroke;
      addCommitToGallery(stroke);
    } else if (msg.type == 'stroke_new') {
      var stroke = msg.stroke;
      if (current_stroke && stroke.id === current_stroke.id) {
        current_stroke.parent_id = stroke.parent_id;
      }
      if (stroke.id in commits) {
        commits[stroke.id].parent_id = stroke.parent_id;
      } else {
        commits[stroke.id] = stroke;
      }

    } else if (msg.type == 'reset') {
      setHistory({});
    } else {
      console.log('unknown message', raw_msg);
    }
  }

  var wsurl = 'ws://' + window.location.hostname + ':8081';
  var ws = new WebSocket(wsurl);
  ws.onmessage = function (evt) { handleMessage(evt.data); }
  return ws;
}

var current_stroke = null;
var ws = createSocket();
var commits = {};
var head = null;
var client_id = null;
var local_stroke_count = 0;
var line_width = 3;
var line_color = '#000000';

function reset() {
  setHistory({});
  ws.send(JSON.stringify({
    type: 'reset',
  }));
}

function setHistory(new_history) {
  Canvas.clear();
  clearGallery();
  commits = new_history;
}

function renderCommit(commit_id) {
  traverseCommits(commit_id, function(commit) {
    if (commit.data.points) {
      renderPoints(commit.data.points, commit.data.width, commit.data.color);
    }
  });
}

function renderCommitAndAddToGallery(commit_id) {
  traverseCommits(commit_id, function(commit) {
    if (commit.data.points) {
      renderPoints(commit.data.points, commit.data.width, commit.data.color);
      addCommitToGallery(commit);
    }
  });
}

function traverseCommits(commit_id, cb) {
  if (commit_id === null) {
    return;
  }
  var commit = commits[commit_id];
  if (!commit) {
    throw new Error('commit id ' + commit_id + ' not found');
  }

  traverseCommits(commit.parent_id, cb);
  cb(commit);
}

function startStroke(pt) {
  current_stroke = {
    id: client_id + '.' + local_stroke_count++,
    parent_id: head,
    data: {
      width: line_width,
      color: line_color,
      points: [pt]
    }
  }
  head = current_stroke.id;
  
  var msg = {
    type: 'stroke_new',
    stroke: current_stroke
  };
  ws.send(JSON.stringify(msg));
}

function endStroke() {
  if (!current_stroke) {
    return;
  }
    
  var msg = {
    type: 'stroke_commit',
    stroke: current_stroke
  };
  ws.send(JSON.stringify(msg));

  addCommitToGallery(current_stroke);
  gallery.scrollLeft = gallery.scrollWidth;

  commits[current_stroke.id] = current_stroke;

  current_stroke = null;
}

function strokeProgress(pt) {
  if (!current_stroke) {
    current_stroke = null;
    return;
  }
  var prev = current_stroke.data.points[current_stroke.data.points.length - 1];
  current_stroke.data.points.push(pt);

  Canvas.renderLine(prev, pt, current_stroke.data.width, current_stroke.data.color);
  var msg = {
    type: 'stroke_progress',
    prev: prev,
    pos: pt,
    id: current_stroke.id
  };
  ws.send(JSON.stringify(msg));
}

function getBoundingRect(canvas) {
  return canvas.getBoundingClientRect();
}

function renderPoints(points, width, color) {
  if (points.length < 2) {
    return;
  }
  var prev = points[0];
  for (var i = 1; i < points.length; i++) {
    var cur = points[i];
    Canvas.renderLine(prev, cur, width, color);
    prev = cur;
  }
}

function attachControls() {
  var controls = document.getElementById('controls');
  controls.onmousedown = function (evt) {
    var target = evt.target;
    if (target.getAttribute('data-reset')) {
      reset();
    } else if (target.getAttribute('data-width')) {
      line_width = target.getAttribute('data-width');
    } else if (target.getAttribute('data-color')) {
      line_color = target.getAttribute('data-color');
    }
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

attachControls();

var callbacks = {
  mousemove: strokeProgress,
  mousedown: startStroke,
  mouseup: endStroke,
  mouseout: endStroke
};
Canvas.init("whiteboard", callbacks);
