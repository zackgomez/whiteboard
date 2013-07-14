function createSocket() {
  var handleMessage = function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke_progress') {
      Canvas.renderLine(msg.prev, msg.pos, msg.width, msg.color);
    } else if (msg.type == 'history') {
      client_id = msg.client_id;

      setRepoHistory(msg.commits, msg.head);
      gallery.selectCommit(msg.head);

      window.location.hash = msg.repo_id;
    } else if (msg.type == 'stroke_commit') {
      var stroke = msg.stroke;
      if (!stroke) {
        return;
      }
      repo.appendCommit(stroke);

      gallery.addCommit(stroke);
    } else if (msg.type == 'reset') {
      reset();
    } else {
      console.log('unknown message', raw_msg);
    }
  }

  var repo_id = window.location.hash ? window.location.hash.substring(1) : null;
  var wsurl = 'ws://' + window.location.hostname + ':8081';
  var ws = new WebSocket(wsurl);
  ws.onopen = function (evt) {
    ws.send(JSON.stringify({type: 'connect', repo_id: repo_id}));
  };
  ws.onmessage = function (evt) { handleMessage(evt.data); };
  return ws;
}

var current_stroke = null;
var repo = new Repository({}, null);
var client_id = null;
var ws = createSocket();

var local_stroke_count = 0;
var line_width = 3;
var line_color = '#000000';
var gallery = new Gallery();
console.log(gallery);

function reset() {
  setRepoHistory({}, null);
  ws.send(JSON.stringify({
    type: 'reset',
  }));
}

function setRepoHistory(new_history, new_head) {
  Canvas.clear();
  gallery.clearGallery();
  repo = new Repository(new_history, new_head);
  renderCommit(new_head, true);
}

function renderCommit(commit_id, add_to_gallery) {
  repo.traverseCommits(commit_id, function(commit) {
    if (commit.data.points) {
      renderPoints(commit.data.points, commit.data.width, commit.data.color);
      if (add_to_gallery) {
        gallery.addCommit(commit);
      }
    }
  });
}

function startStroke(pt) {
  current_stroke = {
    id: client_id + '.' + local_stroke_count++,
    data: {
      width: line_width,
      color: line_color,
      points: [pt]
    }
  }
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
  repo.appendCommit(current_stroke);
  gallery.addCommit(current_stroke);

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
    width: current_stroke.data.width,
    color: current_stroke.data.color
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
