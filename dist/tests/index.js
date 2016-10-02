'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _es6Sleep = require('es6-sleep');

var _ = require('..');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // import {LineBuffer} from '..';
//
// let buffer = new LineBuffer();
//
// console.log('STARTED -------------')
// console.log('>', buffer.feed());
// console.log('>', buffer.feed('aaa'));
// console.log('>', buffer.feed('bb'));
// console.log('>', buffer.feed('b\n111'));
// console.log('>', buffer.feed('222\r'));
// console.log('>', buffer.feed('\naaabbb\r\n'));
// console.log('>', buffer.feed('\n111\r\n'));


// import fs from 'fs';
// import {SMTPClient} from '..';
//
// let smtp = new SMTPClient({
//   name: 'mx.testing.com',
//   host: 'alt1.gmail-smtp-in.l.google.com',
//   port: 25,
//   tls: {
//     key: fs.readFileSync(`${__dirname}/key.pem`),
//     cert: fs.readFileSync(`${__dirname}/cert.pem`),
//     passphrase: '1234'
//   }
// });
//
// smtp.connect();
// // smtp.send();


_asyncToGenerator(function* () {

  let s = new _.SMTPSocket({
    host: 'mx6.mail.icloud.com',
    port: 25,
    tls: true,
    key: _fs2.default.readFileSync(`${ __dirname }/key.pem`),
    cert: _fs2.default.readFileSync(`${ __dirname }/cert.pem`),
    passphrase: '1234',
    greetingTimeout: 10000, // time to wait in ms until greeting message is received from the server
    connectionTimeout: 5000, // how many milliseconds to wait for the connection to establish
    socketTimeout: 60000 });
  s.on('write', function (command) {
    return console.log('C:', command);
  });
  s.on('reply', function (line) {
    return console.log('S:', line);
  });
  s.on('error', function (error) {
    return console.log('ERROR:', error);
  });

  // s.can('starttls');
  console.log('connecting ...');
  console.log('--->', (yield s.connect({ timeout: 3000 })));

  console.log('EHLO ...');
  console.log('--->', (yield s.write('EHLO mx.domain.com', { timeout: 3000 })));

  console.log('RSET ...');
  console.log('--->', (yield s.write('RSET', { timeout: 3000 })));

  // await s.ehlo('mx.testing.com');
  // await s.starttls({opportunistic: true});
  // await s.mail({from: 'info@mx1.mailbull.apzetra.com'});
  // await s.rcpt({to: 'info@apzetra.com'});
  // await s.rcpt({to: 'xpepermint@gmail.com'});
  // await s.rset();
  // await s.noop();
  yield (0, _es6Sleep.promise)(2000);
  console.log((yield s.close()));
})().catch(err => {
  console.error(err);
});

// s.on('response', async (command, status, lines) => {
//   switch(command) {
//     case null:
//       if (status.success) {
//         return this.command('EHLO');
//       }
//       else {
//         // error
//       }
//       break;
//     case 'EHLO':
//       if (status.success) {
//
//         for (let line of lines) {
//           switch(line[1]) {
//             case 'STARTTLS':
//               return this.command('STARTTLS');
//             case 'SIZE':
//               this._sizeLimit = parseInt(line[2]);
//               break;
//             case 'PIPELINING':
//               this._pipelining = true;
//               break;
//             case 'DSN':
//               this._dns = true;
//               break;
//             case 'SMTPUTF8':
//               this._smtputf8 = true;
//           }
//         }
//
//         this.emit('ready');
//       }
//       else {
//         return this.command('HELO');
//       }
//       break;
//     case 'HELO':
//       if (status.success) {
//         this.emit('ready');
//       }
//       else {
//         // error
//       }
//       break;
//     case 'STARTTLS':
//       if (status.success) {
//         return this.startTLS();
//       }
//       else {
//         this.emit('ready');
//       }
//     case 'QUIT':
//       if (!status.success) {
//         // error
//       }
//     default:
//       // error
//   }
// });
// s.on('closed', () => {
//   console.log('closed');
// });
// s.on('error', (e) => {
//   console.log('Error:', e);
// });
//
// await s.connect();
// await s.greet(); // EHLO or HELO
// await s.command(`EHLO mx.domain.com`);

// s.sendCommand();
// s.disconnect();