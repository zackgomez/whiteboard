var express = require('express');
var WebSocket = require('ws');
var Repository = require('./scripts/repository');
var app = express();

var last_client_id = 10;
var repositories = {};
var client

function broadcastMessage(wss, raw_msg, repo_id, exclude_client) {
  for (var i = 0; i < wss.clients.length; i++) {
    var client = wss.clients[i];
    if (client.repo_id === repo_id && client !== exclude_client) {
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
      this.client_id = last_client_id++;
      this.repo_id = msg.repo_id;
      if (this.repo_id in repositories) {
        repo = repositories[this.repo_id];
      } else {
        this.repo_id = Math.random().toString(16).substring(2);
        repo = new Repository({}, null);
        repositories[this.repo_id] = repo;
      }
      ws.send(JSON.stringify({
        type: 'history',
        repo_id: this.repo_id,
        commits: repo.getCommits(),
        client_id: this.client_id,
        head: repo.getHeadId()
      }));
    } else if (msg.type == 'stroke_progress') {
      broadcastMessage(wss, raw_msg, this.repo_id, ws);
    } else if (msg.type == 'stroke_commit') {
      if (!msg.stroke) {
        return;
      }
      repo.appendCommit(msg.stroke);

      broadcastMessage(wss, JSON.stringify(msg), this.repo_id, ws);
    } else if (msg.type == 'reset') {
      repo.reset();
      broadcastMessage(wss, raw_msg, this.repo_id, ws);
    } else {
      console.log('unknown message', raw_msg);
    }
  });
});

app.use('/', express.static(__dirname));
app.use(express.bodyParser());

app.listen(8080);
console.log('listening on 8080');
