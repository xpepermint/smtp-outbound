'use strict';

/*
In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp
server, but for some reason omit a client connecting to it.  I added an
example at the bottom.
Save the following server in example.js:
*/

var net = require('net');

var server = net.createServer(function (socket) {
  socket.write('Echo server\r\n');
  socket.pipe(socket);
});

server.listen(1337, '127.0.0.1');

/*
And connect with a tcp client from the command line using netcat, the *nix
utility for reading and writing across tcp/udp network connections.  I've only
used it for debugging myself.
$ netcat 127.0.0.1 1337
You should see:
> Echo server
*/

/* Or use this example tcp client written in node.js.  (Originated with
example code from
http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */

var net = require('net');
var stream = require('stream');

var client = new net.Socket();
client.connect(1337, '127.0.0.1', function () {
  console.log('Connected');

  setTimeout(() => {

    var s = new stream.Transform();
    s._transform = function (chunk, encoding, done) {
      this.push(chunk);
      done();
    };
    s._flush = function (done) {
      this.push('---DONE---');
      done();
    };
    s.pipe(client);
    s.write('XXXXXXX');
    s.end();
  }, 2000);

  // client.write('Hello, server! Love, Client.');
});

client.on('data', function (data) {
  console.log('Received: ' + data);
  // client.destroy(); // kill client after server's response
});

client.on('close', function () {
  console.log('Connection closed');
});