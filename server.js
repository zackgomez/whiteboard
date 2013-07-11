var express = require('express');
var WebSocket = require('ws');
var Repository = require('./scripts/repository');
var app = express();

var last_client_id = 10;
var repositories = {};

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
  var repo = null;
  ws.on('message', function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'connect') {
      console.log(repositories);

      var new_id = last_client_id++;
      var repo_id = msg.repo_id;
      if (repo_id in repositories) {
        repo = repositories[repo_id];
      } else {
        repo_id = Math.random().toString(16).substring(2);
        repo = new Repository();
        repositories[repo_id] = repo;
      }
      ws.send(JSON.stringify({
        type: 'history',
        repo_id: repo_id,
        commits: repo.getCommits(),
        client_id: new_id,
        head: repo.getHead()
      }));
    } else if (msg.type == 'stroke_progress') {
      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'stroke_new') {
      var stroke = msg.stroke;
      if (!stroke) {
        return;
      }
      stroke = repo.appendCommit(stroke);

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
      // Update commit
      repo.updateCommitData(stroke.id, stroke.data);

      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'reset') {
      repo.reset();
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
