import fs from 'fs';
import {promise as sleep} from 'es6-sleep';
import {SMTPConnector} from '..';

(async function() {

  let s = new SMTPConnector({
    host: 'mx6.mail.icloud.com',
    port: 25
  });

  await s.connect({
    handler: (m) => console.log('[S][connect]', m),
    timeout: 3000
  });

  await s.write('EHLO mx.me.com\r\n', {
    handler: (m) => console.log('[S][write]', m)
  });
  await s.write('MAIL FROM:me@domain.com\r\n', {
    handler: (m) => console.log('[S][write]', m)
  });
  await s.write('RCPT TO:k.sedlak@icloud.com\r\n', {
    handler: (m) => console.log('[S][write]', m)
  });
  await s.write('DATA\r\n', {
    handler: (m) => console.log('[S][write]', m)
  });

  let eolNormalizer = require('convert-newline')("crlf").stream();
  let dataStream = fs.createReadStream(__dirname + '/email.txt', {encoding: 'utf8'});
  dataStream.pipe(eolNormalizer);
  await s.write(eolNormalizer, {
    handler: (m) => console.log('[S][write]', m)
  });

  await s.write('RSET\r\n', {
    handler: (m) => console.log('[S][write]', m)
  });

  // await s.close({
  //   timeout: 1000
  // });

})().catch((error) => {
  console.error('ERROR CATCH:', error);
});












// import {LineBuffer} from '..';
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






// // s.on('write', (command) => console.log('C:', command));
// s.on('reply', (line) => console.log('S:', line));
// // s.on('error', (error) => console.log('ERROR:', error));
//
// let options = {
//   onReply: console.log,
//   timeout: 120000
// };
//
// try {
//   await s.write(`EHLO mx1.mailbull.apzetra.com`, options); // ok
//   await s.write(`MAIL FROM:<info@mailbull.apzetra.com>`, options); // ok
//   await s.write(`RCPT TO:<xpepermint@gmail.com>`, options); // ok
//   await s.write(`DATA`, options); // ok
//
//   let stream = new DataStream([
//     `From: <info@mailbull.apzetra.com>`,
//     `To: <xpepermint@gmail.com>`,
//     `Date: ${new Date()}`,
//     `Subject: test`,
//     ``,
//     `Si dobil tole?`
//   ].join('\r\n'));
//   await s.write(stream, options); // ok
//   await s.write(`.`, options); // ok
// }
// catch(error) {
//   console.log('CATCH-ERROR:', error);
// }

/*

try {
  await c.connect();
}
catch(error) {
  console.log('Unable to connect:' error);
}

for (let recipient on recipients) {
  try {
    await s.send({
      sender: 'from@domain.com',
      recipient: 'to@domain.com',
      source: 'Mail message.'
    });
  }
  catch(error) {
    console.log('Recipient unable to deliver:' error);
  }
}



*/



// await s.write(
//   `From: <info@mailbull.apzetra.com>\r\n` +
//   `To: <xpepermint@gmail.com>\r\n` +
//   `Date: ${new Date()}\r\n` +
//   `Subject: test\r\n` +
//   `\r\n` +
//   `Si dobil tole?\r\n` +
//   `.`
// , {onReply});

// await s.write(
//   `From: <info@mailbull.apzetra.com>\r\n` +
//   `To: <xpepermint@gmail.com>\r\n` +
//   `Date: ${new Date()}\r\n` +
//   `Subject: test\r\n` +
//   `\r\n` +
//   `Si dobil tole?\r\n`
//   `.\r\n`
//   , {waitReply: false, onReply});
// await s.write(`QUIT`, {onReply});
// await s.close({onReply});


// let s = new SMTPSocket({
//   host: 'alt1.gmail-smtp-in.l.google.com',
//   port: 25,
//   tls: true,
//   key: fs.readFileSync(`${__dirname}/key.pem`),
//   cert: fs.readFileSync(`${__dirname}/cert.pem`),
//   passphrase: '1234',
//   timeout: 60000 // time of inactivity until the connection is closed
// });

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
