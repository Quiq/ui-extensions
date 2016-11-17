// Promise polyfill from https://github.com/taylorhakes/promise-polyfill
!function(t){function e(){}function n(t,e){return function(){t.apply(e,arguments)}}function o(t){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof t)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],s(t,this)}function r(t,e){for(;3===t._state;)t=t._value;return 0===t._state?void t._deferreds.push(e):(t._handled=!0,void a(function(){var n=1===t._state?e.onFulfilled:e.onRejected;if(null===n)return void(1===t._state?i:f)(e.promise,t._value);var o;try{o=n(t._value)}catch(r){return void f(e.promise,r)}i(e.promise,o)}))}function i(t,e){try{if(e===t)throw new TypeError("A promise cannot be resolved with itself.");if(e&&("object"==typeof e||"function"==typeof e)){var r=e.then;if(e instanceof o)return t._state=3,t._value=e,void u(t);if("function"==typeof r)return void s(n(r,e),t)}t._state=1,t._value=e,u(t)}catch(i){f(t,i)}}function f(t,e){t._state=2,t._value=e,u(t)}function u(t){2===t._state&&0===t._deferreds.length&&a(function(){t._handled||d(t._value)});for(var e=0,n=t._deferreds.length;n>e;e++)r(t,t._deferreds[e]);t._deferreds=null}function c(t,e,n){this.onFulfilled="function"==typeof t?t:null,this.onRejected="function"==typeof e?e:null,this.promise=n}function s(t,e){var n=!1;try{t(function(t){n||(n=!0,i(e,t))},function(t){n||(n=!0,f(e,t))})}catch(o){if(n)return;n=!0,f(e,o)}}var l=setTimeout,a="function"==typeof setImmediate&&setImmediate||function(t){l(t,0)},d=function(t){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",t)};o.prototype["catch"]=function(t){return this.then(null,t)},o.prototype.then=function(t,n){var o=new this.constructor(e);return r(this,new c(t,n,o)),o},o.all=function(t){var e=Array.prototype.slice.call(t);return new o(function(t,n){function o(i,f){try{if(f&&("object"==typeof f||"function"==typeof f)){var u=f.then;if("function"==typeof u)return void u.call(f,function(t){o(i,t)},n)}e[i]=f,0===--r&&t(e)}catch(c){n(c)}}if(0===e.length)return t([]);for(var r=e.length,i=0;i<e.length;i++)o(i,e[i])})},o.resolve=function(t){return t&&"object"==typeof t&&t.constructor===o?t:new o(function(e){e(t)})},o.reject=function(t){return new o(function(e,n){n(t)})},o.race=function(t){return new o(function(e,n){for(var o=0,r=t.length;r>o;o++)t[o].then(e,n)})},o._setImmediateFn=function(t){a=t},o._setUnhandledRejectionFn=function(t){d=t},"undefined"!=typeof module&&module.exports?module.exports=o:t.Promise||(t.Promise=o)}(this);

/**
* The SDK for creating Centricient Messaging add-ins
*/
(function() {
'use strict';

var Centricient = {};
// TODO: Figure out how to get this dynamically
var centricientHost;
var eventHandlers = {};
var extensionId;
var conversationId;
var conversation = {};
var userId, tenantId, extensionData;

function postMessageToApp(eventType, data) {
  if (!centricientHost) {
    throw new Error('You need to call `init` before posting messages to Centricient');
  }
  window.parent.postMessage({eventType: eventType, data: data }, centricientHost);
}

function checkConversationId() {
  if (!conversationId) {
    console.error('Can\'t send a message without a conversationId. '
      + 'Verify addIn initialized properly');
  }
}

Centricient.init = function(host) {
  if (!host) {
    throw new Error('Init needs to be called with the hostname of the site that will run ')
  }
  centricientHost = host;
};

Centricient.on = function(eventName, handler) {
  eventHandlers[eventName] = eventHandlers[eventName] || [];
  eventHandlers[eventName].push(handler);
};

// TODO: We might want to create a way to register an object of handlers all at once

/**
 * Adds a message to the conversation that the add-in is attached to, but doesn't send it
 * @param  {string} message - The message to send
 * @param  {='replace' | 'append' | 'prepend'} method - Whether the text should replace the current text
 *   or be appended or prepended to it
 */
Centricient.prepareMessage = function(message, method) {
  checkConversationId();
  postMessageToApp('prepareMessage', { conversationId: conversationId, message: message, method: method });
}

/**
 * Sets a message to be sent when the user ends the conversation
 * @param {string} message - The message to send at the end
 */
Centricient.sendOnClose = function(message) {
  checkConversationId();
  postMessageToApp('sendOnClose', { conversationId: conversationId, message: message });
}

/**
 * Gets the current conversation object
 * @return {object} The conversation object
 */
Centricient.getConversation = function() {
  // TODO: Should we just add `conversation` to Centricient instead of making a getter?
  return conversation;
};

/**
 * Gets the userId for the agent currently logged in
 */
Centricient.getUserId = function() {
  return userId;
};

/**
 * Gets the id for the centricient tenant running the extension
 */
Centricient.getTenantId = function() {
  return tenantId;
};

var requestCounter = 0;

function asyncRequest(requestType, data) {
  return new Promise(function(resolve, reject) {
    Centricient.on(requestType + '.success' + requestCounter, function(data) {
      resolve(data.data);
    });

    Centricient.on(requestType + '.error' + requestCounter, function(error) {
      reject(error);
    });

    postMessageToApp(requestType, {
      requestCounter: requestCounter,
      conversationId: conversationId,
      extensionId: extensionId,
      data: data,
    });
    requestCounter++;
  })
}

// Just a test of async data fetching for addins. We probably won't use this one
Centricient.fetchUsers = function() {
  return asyncRequest('fetchUsers');
};

/**
 * Gets the conversation extension data for the current extension
 * @returns {Promise}
 */
Centricient.getExtensionData = function() {
  return extensionData;
}

/**
 * Sets the field of external data that we have on a conversation for extensions
 * @param {string} data - The blob of data to add to the conversation
 * @returns {Promise} A promise so you can know if the request succeeded or failed
 */
Centricient.setExtensionData = function(data) {
  var oldExtensionData = extensionData;
  extensionData = data;

  return new Promise(function(resolve, reject) {
    asyncRequest('setExtensionData', data).then(resolve)
      .catch(function(error) {
        extensionData = oldExtensionData;
        reject(error);
      });
  });
}


function handleEvent(event) {
  var eventType = event.data.eventType;
  var data = event.data.data;

  if (eventType === 'init') {
    conversationId = data.conversationId;
    conversation = data.conversation;
    userId = data.userId;
    tenantId = data.tenantId;
    extensionId = data.extensionId;
    extensionData = data.extensionData;
  }
  else if (eventType === 'extensionDataChanged') {
    extensionData = data.data;
  }

  console.log('Handling event', event);

  var handlers = eventHandlers[eventType];
  if (handlers) {
    handlers.forEach(function(handler) {
      handler(data);
    });
  }
}

window.addEventListener('message', handleEvent, false);

// Export to global namespace. This feels yucky
window.Centricient = Centricient;
})()
