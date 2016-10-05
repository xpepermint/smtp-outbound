"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promiseWithTimeout = promiseWithTimeout;
/*
* A timeout helper function executes the provider promise but throws an error
* if the operation takes more thent the provided `timeout`.
*
* NOTE: The native Promise.race method doesn't clear the timer of the timeout
* promise after the actual promise completes thus the process will wait until
* the timeout promise is also complete. This means that if you set the timeout
* to 1h and the our promise is completed after a 1min then the process will
* still wait for 59min before it exits.
*/

function promiseWithTimeout(_ref) {
  let promise = _ref.promise;
  var _ref$timeout = _ref.timeout;
  let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;
  let error = _ref.error;

  let timer = null;

  let sleep = new Promise((resolve, reject) => {
    timer = setTimeout(reject, timeout, error);
    return timer;
  });

  let run = promise.then(value => {
    clearTimeout(timer);
    return value;
  });

  let promises = [run, timeout > 0 ? sleep : null].filter(p => !!p);

  return Promise.race(promises);
}