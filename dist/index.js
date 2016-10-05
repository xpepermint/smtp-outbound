'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SMTPConnector = undefined;

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _tls = require('tls');

var _tls2 = _interopRequireDefault(_tls);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _lineBuffer = require('./line-buffer');

var _dataStream = require('./data-stream');

var _promises = require('./promises');

var _events = require('events');

var _intoStream = require('into-stream');

var _intoStream2 = _interopRequireDefault(_intoStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class SMTPConnector extends _events.EventEmitter {

  /*
  * Class constructor.
  */

  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    super();

    this._config = config; // class and socket configuration

    this._socket = null; // the socket connecting to the server
    this._buffer = new _lineBuffer.LineBuffer(); // for reading socket data in lines
  }

  /*
  * Returns a Promise which connects to the SMTP server and starts socket
  * I/O activity. We can abort the operating after a certain number of
  * milliseconds by passing the optional `timeout` parameter. We can also read
  * server replies by passing the `handler`.
  */

  connect() {
    var _this = this,
        _arguments = arguments;

    return _asyncToGenerator(function* () {
      var _ref = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : {};

      var _ref$handler = _ref.handler;
      let handler = _ref$handler === undefined ? null : _ref$handler;
      var _ref$timeout = _ref.timeout;
      let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

      return yield (0, _promises.promiseWithTimeout)({
        timeout,
        promise: _this._connectAsPromised({ handler }),
        error: new Error('connect operation timeout')
      });
    })();
  }

  /*
  * Returns a Promise which destroys the socket and ensures that no more I/O
  * activity happens on this socket. We can abort the operating after a certain
  * time of milliseconds by passing the optional `timeout` parameter.
  */

  close() {
    var _this2 = this,
        _arguments2 = arguments;

    return _asyncToGenerator(function* () {
      var _ref2 = _arguments2.length > 0 && _arguments2[0] !== undefined ? _arguments2[0] : {};

      var _ref2$timeout = _ref2.timeout;
      let timeout = _ref2$timeout === undefined ? 0 : _ref2$timeout;

      return yield (0, _promises.promiseWithTimeout)({
        timeout,
        promise: _this2._closeAsPromised(),
        error: new Error('close operation timeout')
      });
    })();
  }

  /*
  * Returns a promise which sends a new command to the SMTP server. The `data`
  * attribute can be a string or a stream. We can abort the operating after a
  * certain number of milliseconds by passing the optional `timeout` parameter.
  * We can also read server replies by passing the `handler`.
  */

  write(data) {
    var _this3 = this,
        _arguments3 = arguments;

    return _asyncToGenerator(function* () {
      var _ref3 = _arguments3.length > 1 && _arguments3[1] !== undefined ? _arguments3[1] : {};

      var _ref3$handler = _ref3.handler;
      let handler = _ref3$handler === undefined ? null : _ref3$handler;
      var _ref3$timeout = _ref3.timeout;
      let timeout = _ref3$timeout === undefined ? 0 : _ref3$timeout;

      return yield (0, _promises.promiseWithTimeout)({
        timeout,
        promise: _this3._writeAsPromised(data, { handler }),
        error: new Error('close operation timeout')
      });
    })();
  }

  /*
  * Returns a Promise which connects to the SMTP server and starts socket
  * I/O activity.
  *
  * NOTES: Normally, a receiver will send a 220 "Service ready" reply when the
  * connection is completed. The sender should wait for this greeting message
  * before sending any commands.
  */

  _connectAsPromised(_ref4) {
    let handler = _ref4.handler;

    return new Promise((resolve, reject) => {
      if (this._socket) {
        return resolve();
      }

      this._socket = _net2.default.connect(this._config);

      this._socket.on('connect', () => {
        // when connection to the server succeeds
        this._socket.removeAllListeners('error');
        this._socket.on('data', this._onData.bind(this));
        this._socket.on('error', this._onError.bind(this));
      });

      this._socket.on('error', error => {
        // unable to connect
        this._socket.removeAllListeners('connect');
        this._buffer.removeAllListeners('line');
        reject(error);
      });

      this._buffer.on('line', line => {
        // handling request
        let isLast = this._isLastReply(line);
        let code = this._parseReplyCode(line);
        let isSuccess = this._isSuccessReplyCode(code);

        Promise.resolve(line, { code, isLast, isSuccess }).then(handler).then(() => {
          if (isLast) resolve(code);
        });

        if (isLast) {
          this._buffer.removeAllListeners('line');
        }
      });
    });
  }

  /*
  * Returns a Promise which destroys the socket and ensures that no more I/O
  * activity happens on this socket.
  */

  _closeAsPromised() {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        return resolve();
      }

      this._socket.once('close', resolve);
      this._socket.destroy();

      this._socket = null;
    });
  }

  /*
  * Returns a promise which sends a new command to the SMTP server. The `data`
  * attribute can be a string or a stream.
  */

  _writeAsPromised(data, _ref5) {
    let handler = _ref5.handler;

    return new Promise((resolve, reject) => {
      if (!this._socket) {
        return reject(new Error('no connection to execute a write operation'));
      }

      this._socket.on('error', error => {
        // socket write error
        this._buffer.removeAllListeners('line');
        reject(error);
      });

      this._buffer.on('line', line => {
        // handling request
        let isLast = this._isLastReply(line);
        let code = this._parseReplyCode(line);
        let isSuccess = this._isSuccessReplyCode(code);

        Promise.resolve(line, { code, isLast, isSuccess }).then(handler).then(() => {
          if (isLast) resolve(code);
        });

        if (isLast) {
          this._buffer.removeAllListeners('line');
        }
      });

      this._intoReadableStream(data).pipe(this._socket, { end: false });
    });
  }

  _intoReadableStream(data) {
    if (data.pipe) {
      return data;
    }

    let chars = data.split('');
    return new _stream2.default.Readable({
      read: function (size) {
        this.push(chars.shift());
      }
    });
  }

  /*
  * A handler which is triggered when a chunk of data is received from the
  * SMTP server.
  */

  _onData(chunk) {
    let lines = this._buffer.feed(chunk); // returns only completed response lines
    if (!lines.length) {
      return;
    }

    for (let line of lines) {
      this._onReply(line);
    }
  }

  /*
  * A handler which is triggered on socket error.
  */

  _onError(error) {}

  /*
  * A handler which is triggered on each reply from the server.
  */

  _onReply(line) {
    // let isLast = this._isLastReply(line);
    // let code = this._parseReplyCode(line);
    // let isSuccess = this._isSuccessReplyCode

    console.log('AAAA');
    // this.emit('reply', line, {code, isLast, isSuccess});
  }

  /*
  * Returns the reply code of the provided reply line.
  *
  * NOTES: According to the rfc5321 specification, the line will always begin
  * with the reply code.
  */

  _parseReplyCode(line) {
    return line.substr(0, 3);
  }

  /*
  * Returns `true` if the provided reply line represents the last reply from the
  * SMTP server.
  *
  * NOTE: According to the rfc5321 specification, the last line will begin with
  * the reply code, followed immediately by <SP>.
  */

  _isLastReply(line) {
    return line.charAt(3) === ' ';
  }

  /*
  * Returns `true` if the provided reply code represents a success code.
  *
  * NOTE: According to the rfc821 specification, the 2xx codes represent a
  * positive completion reply which means that the requested action has been
  * successfully completed and a new request may be initiated.
  */

  _isSuccessReplyCode(code) {
    return code.charAt(0) === '2';
  }

}

exports.SMTPConnector = SMTPConnector; // /*
// * Parses the reply string.
// *
// * NOTE: According to the rfc5321 specification, the last line will always
// * begin with the reply code, followed immediately by <SP>, optionally some
// * text, and <CRLF>.
// */
//
// _parseReplyText(line) {
//   return line.charAt(3) === ' ';
// }

/*
* Returns a hostname of a client machine.
*
* NOTES: According to rfc2821, the domain name given in the EHLO command must
* be either a primary host name (a domain name that resolves to an A RR) or,
* if the host has no name, an address IPv4/IPv6 literal enclosed by brackets
* (e.g. [192.168.1.1]).
*/

// _getHostname() {
//   let host = os.hostname() || '';
//
//   if (host.indexOf('.') < 0) { // ignore if not FQDN
//     host = '[127.0.0.1]';
//   }
//   else if (host.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) { // IP mut be enclosed in []
//     host = '[' + host + ']';
//   }
//
//   return host;
// }

/*
* Upgrades the existing socket connection to TLS.
*/

// secure() {
//   return new Promise((resolve, reject) => {
//
//   });
// }

/*
* Parses the client's command string and returns an object with data.
*
* NOTES: According to the rfc821, command codes and the argument fields are
* separated by one or more spaces.
*/

// _parseCommand(str) {
//   let [code, text] = str.split(/[\s](.+)?/, 2);
//   code = code.trim().toUpperCase();
//   text = text.trim();
//
//   return {code, text};
// }

/*
* Parses the server's reply string and returns an object with data.
*
* NOTES: According to the rfc5321 specification, all replies begin with a
* three digit numeric code. Multiline replies requires that every line, except
* the last, begin with the reply code, followed immediately by a `-`,
* followed by text. The last line will begin with the reply code, followed
* immediately by <SP>, optionally some text, and <CRLF>.
*/

// _parseReply(str) {
//   let code = str.substr(0, 3); // status code
//   let isLast = str.charAt(3) === ' '; // is the last line from the server
//   let text = str.substr(4).trim();
//
//   return {code, text, isLast};
// }

/*
* Returns `true` if the passed reply string includes the enhanced status code.
*
* NOTES: Servers supporting the Enhanced-Status-Codes extension must preface
* the text part of almost all response lines with a status code (e.g. 2.5.0).
* These codes must appear in all 2xx, 4xx, and 5xx response lines other than
* initial greeting and any response to HELO or EHLO.
*/
// _isEnhancedReply(str) {
//   return (
//     [2, 4, 5].indexOf(str.charAt(0)) !== -1 // match 2xx, 4xx, or 5xx codes
//     && [null, 'EHLO', 'HELO'].indexOf(this._command) === -1 // match initial greeting, HELO or EHLO
//   );
// }


//
//
//
//
//
// export class SMTPClient extends EventEmitter {
//
//   constructor({name, host='127.0.0.1', port=25, tls={}}={}) {
//     super();
//
//     this._name = name;
//     this._host = host;
//     this._port = port;
//     this._tls = tls;
//
//     this._socket = null; // the socket connecting to the server
//     this._buffer = new LineBuffer(); // for reading socket data in lines
//     this._command = null; // the last command sent to the server
//
//     this._sizeLimit = 0; // the maximum allowed message size (got from EHLO)
//     this._utf8 = false; // allow UTF-8 encoding in mailbox names and header fields
//
//
//     this.on('connect', function() {
//       console.log('CONNECteD!!!!');
//     })
//   }
//
//   /*
//   * Connects to the remote server.
//   */
//
//   connect() {
//     this._socket = net.connect({
//       host: this._host,
//       port: this._port
//     });
//     // this._socket.once('connect', this._onConnect.bind(this));
//     // this._socket.once('close', this._onClose.bind(this));
//     // this._socket.once('end', this._onEnd.bind(this));
//     // this._socket.once('timeout', this._onTimeout.bind(this));
//     this._socket.on('data', this._onData.bind(this));
//     this._socket.on('error', this._onError.bind(this));
//
//     this._socket.setTimeout(30000);
//   }
//
//   /*
//   * Disconnects from the remote server.
//   */
//
//   disconnect() {
//     this._sendCommand('QUIT');
//   }
//
//   /*
//   * Logger
//   */
//
//   _log(role, lines) {
//     lines.forEach(l => console.log(role, l));
//   }
//
//   /*
//   * Send a command to the server.
//   */
//
//   _sendCommand(str) {
//     this._command = str.split(' ')[0];
//     this._socket.write(new Buffer(str + '\r\n', 'utf-8'));
//     this._log('C:', [str]);
//   }
//
//   /*
//   * A socket listener which listens for data coming from remote a server.
//   */
//
//   _onData(chunk) {
//     let lines = this._buffer.feed(chunk);
//     if (lines.length === 0) {
//       return;
//     }
//
//     this._log('S:', lines);
//
//     switch(this._command) {
//       case null: // start conversation
//         return this._sendCommand(`EHLO ${this._name}`);
//       case 'EHLO':
//         return this._onEHLO(lines);
//       case 'HELO':
//         return this._onHELO(lines);
//       case 'STARTTLS':
//         return this._onSTARTTLS(lines);
//     }
//   }
//
//   /*
//   * EHLO response handler.
//   */
//
//   _onEHLO(lines) {
//     for (let line of lines) {
//       let [code, extension] = line.split(/[-|\s](.+)?/, 2);
//
//       if (code.charAt(0) !== '2') {
//         return this._sendCommand(`HELO ${this._name}`);
//       }
//
//       switch(extension) {
//         case 'STARTTLS':
//           this._sendCommand('STARTTLS');
//           return;
//         case 'SMTPUTF8':
//           this._utf8 = true;
//           break;
//         case 'SIZE':
//           this._sizeLimit = parseInt(extension.split(' ')[1]);
//           break;
//       }
//     }
//
//     this.emit('ready');
//   }
//
//   /*
//   * HELO response handler.
//   */
//
//   _onHELO(lines) {
//     let [code, extension] = lines[0];
//
//     if (code.charAt(0) !== '2') { // try HELO instead
//       return this._sendCommand(`HELO ${this._name}`);
//     }
//
//     this.emit('ready');
//   }
//
//   /*
//   * STARTTLS response handler.
//   */
//
//   _onSTARTTLS(lines) {
//     let str = lines[0];
//
//     if (str.charAt(0) !== '2') {
//       // opportunistic TLS
//       this.emit('ready');
//       return;
//     }
//
//     this._socket.removeAllListeners('data'); // incoming data is going to be gibberish from this point onwards
//     this._socket.removeAllListeners('timeout'); // timeout will be re-set for the new socket object
//
//     let socketPlain = this._socket;
//
//     this._socket = tls.connect({
//       socket: this._socket,
//       // key: this._tls.key,
//       // cert: this._tls.cert,
//       // passphrase: this._tls.passphrase,
//       // rejectUnauthorized: false
//     }, () => {
//       this._socket.on('data', this._onData.bind(this));
//
//       this._sendCommand('EHLO ' + this.name);
//     });
//     this._socket.on('error', this._onError.bind(this));
//
//     // resume in case the socket was paused
//     socketPlain.resume();
//   }
//
//   /*
//   * A socket listener which is triggered in case of an error.
//   */
//
//   _onError(err) {
//     console.log('error:', err);
//   }
//
// }