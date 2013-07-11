var express = require('express');
var WebSocket = require('ws');
var app = express();

var commits = {};
var head_commit_id = null;
var last_client_id = 10;

function broadcastMessage(wss, raw_msg, exclude_client) {
  for (var i = 0; i < wss.clients.length; i++) {
    var client = wss.clients[i];
    if (client !== exclude_client) {
      client.send(raw_msg);
    }
  }
}

var wss = new WebSocket.Server({port: 8081});
wss.on('connection', function (ws) {
  var new_id = last_client_id++;

  ws.send(JSON.stringify({
    type: 'history',
    commits: commits,
    client_id: new_id,
    head: head_commit_id
  }));

  ws.on('message', function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke_progress') {
      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'stroke_new') {
      var stroke = msg.stroke;
      if (!stroke) {
        return;
      }
      if (stroke.parent_id !== head_commit_id) {
        stroke.parent_id = head_commit_id;
      }

      commits[stroke.id] = stroke;
      head_commit_id = stroke.id;

      var updated_msg = {
        type: 'stroke_new',
        stroke: stroke
      };
      broadcastMessage(wss, JSON.stringify(updated_msg));
    } else if (msg.type == 'stroke_commit') {
      var stroke = msg.stroke;
      if (!stroke) {
        return;
      }
      var id = stroke.id;
      var commit = commits[id];
      if (!commit) {
        return;
      }
      // Update commit
      var parent_id = commit.parent_id;
      commits[id] = msg.stroke;
      commits[id].parent_id = parent_id;

      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'reset') {
      commits = {}
      head_commit_id = null;
      broadcastMessage(wss, raw_msg, ws);
    } else {
      console.log('unknown message', raw_msg);
    }
  });
});

app.use('/', express.static(__dirname));
app.use(express.bodyParser());

app.listen(8080);
console.log('listening on 8080');
