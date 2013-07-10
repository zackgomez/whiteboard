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
  console.log('commits', commits);
  console.log('got new connection, id = ' + new_id);

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
      console.log('new stroke msg', msg);
      var updated_msg = {
        type: 'stroke_begin',
        id: msg.id,
        parent_id: msg.parent_id
      };
      if (head_commit_id && msg.parent_id !== head_commit_id) {
        updated_msg.parent_id = head_commit_id;
      }

      commits[msg.id] = {
        id: updated_msg.id,
        parent_id: updated_msg.parent_id,
        data: {}
      };
      console.log('after adding', commits);
      head_commit_id = msg.id;

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
