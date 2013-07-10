var express = require('express');
var WebSocket = require('ws');
var app = express();

var stroke_history = [];

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
  console.log('got new connection, id = ' + wss.clients.length);

  ws.send(JSON.stringify({
    type: 'history',
    strokes: stroke_history,
    client_id: wss.clients.length
  }));

  ws.on('message', function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke') {
      console.log('broadcasting stroke');
      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'stroke_finished') {
      stroke_history.push(msg.stroke);
      broadcastMessage(wss, raw_msg, ws);
    } else if (msg.type == 'reset') {
      stroke_history = [];
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
