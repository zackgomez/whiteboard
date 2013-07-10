var express = require('express');
var redis = require('redis');
var WebSocket = require('ws');
var db = redis.createClient();
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
  console.log('got new connection');

  ws.send(JSON.stringify({
    type: 'history',
    strokes: stroke_history
  }));

  ws.on('message', function (raw_msg) {
    var msg = JSON.parse(raw_msg);
    if (msg.type == 'stroke') {
      stroke_history.push(msg.stroke);
      console.log('broadcasting stroke');
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

app.use(function(req, res, next){
  var ua = req.headers['user-agent'];
  db.zadd('online', Date.now(), ua, next);
});

app.use(function(req, res, next){
  var min = 60 * 1000;
  var ago = Date.now() - min;
  db.zrevrangebyscore('online', '+inf', ago, function(err, users){
    if (err) return next(err);
    req.online = users;
    next();
  });
});

app.get('/online', function(req, res){
    res.send(req.online.length + ' users online');
});

app.listen(8080);
console.log('listening on 8080');
