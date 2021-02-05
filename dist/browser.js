(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acebaseclient = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * Socket.IO v2.1.1
 * (c) 2014-2018 Guillermo Rauch
 * Released under the MIT License.
 */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.io=e():t.io=e()}(this,function(){return function(t){function e(n){if(r[n])return r[n].exports;var o=r[n]={exports:{},id:n,loaded:!1};return t[n].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var r={};return e.m=t,e.c=r,e.p="",e(0)}([function(t,e,r){"use strict";function n(t,e){"object"===("undefined"==typeof t?"undefined":o(t))&&(e=t,t=void 0),e=e||{};var r,n=i(t),s=n.source,h=n.id,p=n.path,u=c[h]&&p in c[h].nsps,f=e.forceNew||e["force new connection"]||!1===e.multiplex||u;return f?r=a(s,e):(c[h]||(c[h]=a(s,e)),r=c[h]),n.query&&!e.query&&(e.query=n.query),r.socket(n.path,e)}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(1),s=r(4),a=r(9);r(3)("socket.io-client");t.exports=e=n;var c=e.managers={};e.protocol=s.protocol,e.connect=n,e.Manager=r(9),e.Socket=r(34)},function(t,e,r){(function(e){"use strict";function n(t,r){var n=t;r=r||e.location,null==t&&(t=r.protocol+"//"+r.host),"string"==typeof t&&("/"===t.charAt(0)&&(t="/"===t.charAt(1)?r.protocol+t:r.host+t),/^(https?|wss?):\/\//.test(t)||(t="undefined"!=typeof r?r.protocol+"//"+t:"https://"+t),n=o(t)),n.port||(/^(http|ws)$/.test(n.protocol)?n.port="80":/^(http|ws)s$/.test(n.protocol)&&(n.port="443")),n.path=n.path||"/";var i=n.host.indexOf(":")!==-1,s=i?"["+n.host+"]":n.host;return n.id=n.protocol+"://"+s+":"+n.port,n.href=n.protocol+"://"+s+(r&&r.port===n.port?"":":"+n.port),n}var o=r(2);r(3)("socket.io-client:url");t.exports=n}).call(e,function(){return this}())},function(t,e){var r=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,n=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];t.exports=function(t){var e=t,o=t.indexOf("["),i=t.indexOf("]");o!=-1&&i!=-1&&(t=t.substring(0,o)+t.substring(o,i).replace(/:/g,";")+t.substring(i,t.length));for(var s=r.exec(t||""),a={},c=14;c--;)a[n[c]]=s[c]||"";return o!=-1&&i!=-1&&(a.source=e,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a}},function(t,e){"use strict";t.exports=function(){return function(){}}},function(t,e,r){function n(){}function o(t){var r=""+t.type;if(e.BINARY_EVENT!==t.type&&e.BINARY_ACK!==t.type||(r+=t.attachments+"-"),t.nsp&&"/"!==t.nsp&&(r+=t.nsp+","),null!=t.id&&(r+=t.id),null!=t.data){var n=i(t.data);if(n===!1)return m;r+=n}return r}function i(t){try{return JSON.stringify(t)}catch(t){return!1}}function s(t,e){function r(t){var r=l.deconstructPacket(t),n=o(r.packet),i=r.buffers;i.unshift(n),e(i)}l.removeBlobs(t,r)}function a(){this.reconstructor=null}function c(t){var r=0,n={type:Number(t.charAt(0))};if(null==e.types[n.type])return u("unknown packet type "+n.type);if(e.BINARY_EVENT===n.type||e.BINARY_ACK===n.type){for(var o="";"-"!==t.charAt(++r)&&(o+=t.charAt(r),r!=t.length););if(o!=Number(o)||"-"!==t.charAt(r))throw new Error("Illegal attachments");n.attachments=Number(o)}if("/"===t.charAt(r+1))for(n.nsp="";++r;){var i=t.charAt(r);if(","===i)break;if(n.nsp+=i,r===t.length)break}else n.nsp="/";var s=t.charAt(r+1);if(""!==s&&Number(s)==s){for(n.id="";++r;){var i=t.charAt(r);if(null==i||Number(i)!=i){--r;break}if(n.id+=t.charAt(r),r===t.length)break}n.id=Number(n.id)}if(t.charAt(++r)){var a=h(t.substr(r)),c=a!==!1&&(n.type===e.ERROR||d(a));if(!c)return u("invalid payload");n.data=a}return n}function h(t){try{return JSON.parse(t)}catch(t){return!1}}function p(t){this.reconPack=t,this.buffers=[]}function u(t){return{type:e.ERROR,data:"parser error: "+t}}var f=(r(3)("socket.io-parser"),r(5)),l=r(6),d=r(7),y=r(8);e.protocol=4,e.types=["CONNECT","DISCONNECT","EVENT","ACK","ERROR","BINARY_EVENT","BINARY_ACK"],e.CONNECT=0,e.DISCONNECT=1,e.EVENT=2,e.ACK=3,e.ERROR=4,e.BINARY_EVENT=5,e.BINARY_ACK=6,e.Encoder=n,e.Decoder=a;var m=e.ERROR+'"encode error"';n.prototype.encode=function(t,r){if(e.BINARY_EVENT===t.type||e.BINARY_ACK===t.type)s(t,r);else{var n=o(t);r([n])}},f(a.prototype),a.prototype.add=function(t){var r;if("string"==typeof t)r=c(t),e.BINARY_EVENT===r.type||e.BINARY_ACK===r.type?(this.reconstructor=new p(r),0===this.reconstructor.reconPack.attachments&&this.emit("decoded",r)):this.emit("decoded",r);else{if(!y(t)&&!t.base64)throw new Error("Unknown type: "+t);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");r=this.reconstructor.takeBinaryData(t),r&&(this.reconstructor=null,this.emit("decoded",r))}},a.prototype.destroy=function(){this.reconstructor&&this.reconstructor.finishedReconstruction()},p.prototype.takeBinaryData=function(t){if(this.buffers.push(t),this.buffers.length===this.reconPack.attachments){var e=l.reconstructPacket(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null},p.prototype.finishedReconstruction=function(){this.reconPack=null,this.buffers=[]}},function(t,e,r){function n(t){if(t)return o(t)}function o(t){for(var e in n.prototype)t[e]=n.prototype[e];return t}t.exports=n,n.prototype.on=n.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},n.prototype.once=function(t,e){function r(){this.off(t,r),e.apply(this,arguments)}return r.fn=e,this.on(t,r),this},n.prototype.off=n.prototype.removeListener=n.prototype.removeAllListeners=n.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var r=this._callbacks["$"+t];if(!r)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var n,o=0;o<r.length;o++)if(n=r[o],n===e||n.fn===e){r.splice(o,1);break}return this},n.prototype.emit=function(t){this._callbacks=this._callbacks||{};var e=[].slice.call(arguments,1),r=this._callbacks["$"+t];if(r){r=r.slice(0);for(var n=0,o=r.length;n<o;++n)r[n].apply(this,e)}return this},n.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},n.prototype.hasListeners=function(t){return!!this.listeners(t).length}},function(t,e,r){(function(t){function n(t,e){if(!t)return t;if(s(t)){var r={_placeholder:!0,num:e.length};return e.push(t),r}if(i(t)){for(var o=new Array(t.length),a=0;a<t.length;a++)o[a]=n(t[a],e);return o}if("object"==typeof t&&!(t instanceof Date)){var o={};for(var c in t)o[c]=n(t[c],e);return o}return t}function o(t,e){if(!t)return t;if(t&&t._placeholder)return e[t.num];if(i(t))for(var r=0;r<t.length;r++)t[r]=o(t[r],e);else if("object"==typeof t)for(var n in t)t[n]=o(t[n],e);return t}var i=r(7),s=r(8),a=Object.prototype.toString,c="function"==typeof t.Blob||"[object BlobConstructor]"===a.call(t.Blob),h="function"==typeof t.File||"[object FileConstructor]"===a.call(t.File);e.deconstructPacket=function(t){var e=[],r=t.data,o=t;return o.data=n(r,e),o.attachments=e.length,{packet:o,buffers:e}},e.reconstructPacket=function(t,e){return t.data=o(t.data,e),t.attachments=void 0,t},e.removeBlobs=function(t,e){function r(t,a,p){if(!t)return t;if(c&&t instanceof Blob||h&&t instanceof File){n++;var u=new FileReader;u.onload=function(){p?p[a]=this.result:o=this.result,--n||e(o)},u.readAsArrayBuffer(t)}else if(i(t))for(var f=0;f<t.length;f++)r(t[f],f,t);else if("object"==typeof t&&!s(t))for(var l in t)r(t[l],l,t)}var n=0,o=t;r(o),n||e(o)}}).call(e,function(){return this}())},function(t,e){var r={}.toString;t.exports=Array.isArray||function(t){return"[object Array]"==r.call(t)}},function(t,e){(function(e){function r(t){return n&&e.Buffer.isBuffer(t)||o&&(t instanceof e.ArrayBuffer||i(t))}t.exports=r;var n="function"==typeof e.Buffer&&"function"==typeof e.Buffer.isBuffer,o="function"==typeof e.ArrayBuffer,i=function(){return o&&"function"==typeof e.ArrayBuffer.isView?e.ArrayBuffer.isView:function(t){return t.buffer instanceof e.ArrayBuffer}}()}).call(e,function(){return this}())},function(t,e,r){"use strict";function n(t,e){if(!(this instanceof n))return new n(t,e);t&&"object"===("undefined"==typeof t?"undefined":o(t))&&(e=t,t=void 0),e=e||{},e.path=e.path||"/socket.io",this.nsps={},this.subs=[],this.opts=e,this.reconnection(e.reconnection!==!1),this.reconnectionAttempts(e.reconnectionAttempts||1/0),this.reconnectionDelay(e.reconnectionDelay||1e3),this.reconnectionDelayMax(e.reconnectionDelayMax||5e3),this.randomizationFactor(e.randomizationFactor||.5),this.backoff=new f({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(null==e.timeout?2e4:e.timeout),this.readyState="closed",this.uri=t,this.connecting=[],this.lastPing=null,this.encoding=!1,this.packetBuffer=[];var r=e.parser||c;this.encoder=new r.Encoder,this.decoder=new r.Decoder,this.autoConnect=e.autoConnect!==!1,this.autoConnect&&this.open()}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(10),s=r(34),a=r(5),c=r(4),h=r(36),p=r(37),u=(r(3)("socket.io-client:manager"),r(33)),f=r(38),l=Object.prototype.hasOwnProperty;t.exports=n,n.prototype.emitAll=function(){this.emit.apply(this,arguments);for(var t in this.nsps)l.call(this.nsps,t)&&this.nsps[t].emit.apply(this.nsps[t],arguments)},n.prototype.updateSocketIds=function(){for(var t in this.nsps)l.call(this.nsps,t)&&(this.nsps[t].id=this.generateId(t))},n.prototype.generateId=function(t){return("/"===t?"":t+"#")+this.engine.id},a(n.prototype),n.prototype.reconnection=function(t){return arguments.length?(this._reconnection=!!t,this):this._reconnection},n.prototype.reconnectionAttempts=function(t){return arguments.length?(this._reconnectionAttempts=t,this):this._reconnectionAttempts},n.prototype.reconnectionDelay=function(t){return arguments.length?(this._reconnectionDelay=t,this.backoff&&this.backoff.setMin(t),this):this._reconnectionDelay},n.prototype.randomizationFactor=function(t){return arguments.length?(this._randomizationFactor=t,this.backoff&&this.backoff.setJitter(t),this):this._randomizationFactor},n.prototype.reconnectionDelayMax=function(t){return arguments.length?(this._reconnectionDelayMax=t,this.backoff&&this.backoff.setMax(t),this):this._reconnectionDelayMax},n.prototype.timeout=function(t){return arguments.length?(this._timeout=t,this):this._timeout},n.prototype.maybeReconnectOnOpen=function(){!this.reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect()},n.prototype.open=n.prototype.connect=function(t,e){if(~this.readyState.indexOf("open"))return this;this.engine=i(this.uri,this.opts);var r=this.engine,n=this;this.readyState="opening",this.skipReconnect=!1;var o=h(r,"open",function(){n.onopen(),t&&t()}),s=h(r,"error",function(e){if(n.cleanup(),n.readyState="closed",n.emitAll("connect_error",e),t){var r=new Error("Connection error");r.data=e,t(r)}else n.maybeReconnectOnOpen()});if(!1!==this._timeout){var a=this._timeout,c=setTimeout(function(){o.destroy(),r.close(),r.emit("error","timeout"),n.emitAll("connect_timeout",a)},a);this.subs.push({destroy:function(){clearTimeout(c)}})}return this.subs.push(o),this.subs.push(s),this},n.prototype.onopen=function(){this.cleanup(),this.readyState="open",this.emit("open");var t=this.engine;this.subs.push(h(t,"data",p(this,"ondata"))),this.subs.push(h(t,"ping",p(this,"onping"))),this.subs.push(h(t,"pong",p(this,"onpong"))),this.subs.push(h(t,"error",p(this,"onerror"))),this.subs.push(h(t,"close",p(this,"onclose"))),this.subs.push(h(this.decoder,"decoded",p(this,"ondecoded")))},n.prototype.onping=function(){this.lastPing=new Date,this.emitAll("ping")},n.prototype.onpong=function(){this.emitAll("pong",new Date-this.lastPing)},n.prototype.ondata=function(t){this.decoder.add(t)},n.prototype.ondecoded=function(t){this.emit("packet",t)},n.prototype.onerror=function(t){this.emitAll("error",t)},n.prototype.socket=function(t,e){function r(){~u(o.connecting,n)||o.connecting.push(n)}var n=this.nsps[t];if(!n){n=new s(this,t,e),this.nsps[t]=n;var o=this;n.on("connecting",r),n.on("connect",function(){n.id=o.generateId(t)}),this.autoConnect&&r()}return n},n.prototype.destroy=function(t){var e=u(this.connecting,t);~e&&this.connecting.splice(e,1),this.connecting.length||this.close()},n.prototype.packet=function(t){var e=this;t.query&&0===t.type&&(t.nsp+="?"+t.query),e.encoding?e.packetBuffer.push(t):(e.encoding=!0,this.encoder.encode(t,function(r){for(var n=0;n<r.length;n++)e.engine.write(r[n],t.options);e.encoding=!1,e.processPacketQueue()}))},n.prototype.processPacketQueue=function(){if(this.packetBuffer.length>0&&!this.encoding){var t=this.packetBuffer.shift();this.packet(t)}},n.prototype.cleanup=function(){for(var t=this.subs.length,e=0;e<t;e++){var r=this.subs.shift();r.destroy()}this.packetBuffer=[],this.encoding=!1,this.lastPing=null,this.decoder.destroy()},n.prototype.close=n.prototype.disconnect=function(){this.skipReconnect=!0,this.reconnecting=!1,"opening"===this.readyState&&this.cleanup(),this.backoff.reset(),this.readyState="closed",this.engine&&this.engine.close()},n.prototype.onclose=function(t){this.cleanup(),this.backoff.reset(),this.readyState="closed",this.emit("close",t),this._reconnection&&!this.skipReconnect&&this.reconnect()},n.prototype.reconnect=function(){if(this.reconnecting||this.skipReconnect)return this;var t=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitAll("reconnect_failed"),this.reconnecting=!1;else{var e=this.backoff.duration();this.reconnecting=!0;var r=setTimeout(function(){t.skipReconnect||(t.emitAll("reconnect_attempt",t.backoff.attempts),t.emitAll("reconnecting",t.backoff.attempts),t.skipReconnect||t.open(function(e){e?(t.reconnecting=!1,t.reconnect(),t.emitAll("reconnect_error",e.data)):t.onreconnect()}))},e);this.subs.push({destroy:function(){clearTimeout(r)}})}},n.prototype.onreconnect=function(){var t=this.backoff.attempts;this.reconnecting=!1,this.backoff.reset(),this.updateSocketIds(),this.emitAll("reconnect",t)}},function(t,e,r){t.exports=r(11),t.exports.parser=r(18)},function(t,e,r){(function(e){function n(t,r){if(!(this instanceof n))return new n(t,r);r=r||{},t&&"object"==typeof t&&(r=t,t=null),t?(t=h(t),r.hostname=t.host,r.secure="https"===t.protocol||"wss"===t.protocol,r.port=t.port,t.query&&(r.query=t.query)):r.host&&(r.hostname=h(r.host).host),this.secure=null!=r.secure?r.secure:e.location&&"https:"===location.protocol,r.hostname&&!r.port&&(r.port=this.secure?"443":"80"),this.agent=r.agent||!1,this.hostname=r.hostname||(e.location?location.hostname:"localhost"),this.port=r.port||(e.location&&location.port?location.port:this.secure?443:80),this.query=r.query||{},"string"==typeof this.query&&(this.query=p.decode(this.query)),this.upgrade=!1!==r.upgrade,this.path=(r.path||"/engine.io").replace(/\/$/,"")+"/",this.forceJSONP=!!r.forceJSONP,this.jsonp=!1!==r.jsonp,this.forceBase64=!!r.forceBase64,this.enablesXDR=!!r.enablesXDR,this.timestampParam=r.timestampParam||"t",this.timestampRequests=r.timestampRequests,this.transports=r.transports||["polling","websocket"],this.transportOptions=r.transportOptions||{},this.readyState="",this.writeBuffer=[],this.prevBufferLen=0,this.policyPort=r.policyPort||843,this.rememberUpgrade=r.rememberUpgrade||!1,this.binaryType=null,this.onlyBinaryUpgrades=r.onlyBinaryUpgrades,this.perMessageDeflate=!1!==r.perMessageDeflate&&(r.perMessageDeflate||{}),!0===this.perMessageDeflate&&(this.perMessageDeflate={}),this.perMessageDeflate&&null==this.perMessageDeflate.threshold&&(this.perMessageDeflate.threshold=1024),this.pfx=r.pfx||null,this.key=r.key||null,this.passphrase=r.passphrase||null,this.cert=r.cert||null,this.ca=r.ca||null,this.ciphers=r.ciphers||null,this.rejectUnauthorized=void 0===r.rejectUnauthorized||r.rejectUnauthorized,this.forceNode=!!r.forceNode;var o="object"==typeof e&&e;o.global===o&&(r.extraHeaders&&Object.keys(r.extraHeaders).length>0&&(this.extraHeaders=r.extraHeaders),r.localAddress&&(this.localAddress=r.localAddress)),this.id=null,this.upgrades=null,this.pingInterval=null,this.pingTimeout=null,this.pingIntervalTimer=null,this.pingTimeoutTimer=null,this.open()}function o(t){var e={};for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r]);return e}var i=r(12),s=r(5),a=(r(3)("engine.io-client:socket"),r(33)),c=r(18),h=r(2),p=r(27);t.exports=n,n.priorWebsocketSuccess=!1,s(n.prototype),n.protocol=c.protocol,n.Socket=n,n.Transport=r(17),n.transports=r(12),n.parser=r(18),n.prototype.createTransport=function(t){var e=o(this.query);e.EIO=c.protocol,e.transport=t;var r=this.transportOptions[t]||{};this.id&&(e.sid=this.id);var n=new i[t]({query:e,socket:this,agent:r.agent||this.agent,hostname:r.hostname||this.hostname,port:r.port||this.port,secure:r.secure||this.secure,path:r.path||this.path,forceJSONP:r.forceJSONP||this.forceJSONP,jsonp:r.jsonp||this.jsonp,forceBase64:r.forceBase64||this.forceBase64,enablesXDR:r.enablesXDR||this.enablesXDR,timestampRequests:r.timestampRequests||this.timestampRequests,timestampParam:r.timestampParam||this.timestampParam,policyPort:r.policyPort||this.policyPort,pfx:r.pfx||this.pfx,key:r.key||this.key,passphrase:r.passphrase||this.passphrase,cert:r.cert||this.cert,ca:r.ca||this.ca,ciphers:r.ciphers||this.ciphers,rejectUnauthorized:r.rejectUnauthorized||this.rejectUnauthorized,perMessageDeflate:r.perMessageDeflate||this.perMessageDeflate,extraHeaders:r.extraHeaders||this.extraHeaders,forceNode:r.forceNode||this.forceNode,localAddress:r.localAddress||this.localAddress,requestTimeout:r.requestTimeout||this.requestTimeout,protocols:r.protocols||void 0});return n},n.prototype.open=function(){var t;if(this.rememberUpgrade&&n.priorWebsocketSuccess&&this.transports.indexOf("websocket")!==-1)t="websocket";else{if(0===this.transports.length){var e=this;return void setTimeout(function(){e.emit("error","No transports available")},0)}t=this.transports[0]}this.readyState="opening";try{t=this.createTransport(t)}catch(t){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t)},n.prototype.setTransport=function(t){var e=this;this.transport&&this.transport.removeAllListeners(),this.transport=t,t.on("drain",function(){e.onDrain()}).on("packet",function(t){e.onPacket(t)}).on("error",function(t){e.onError(t)}).on("close",function(){e.onClose("transport close")})},n.prototype.probe=function(t){function e(){if(u.onlyBinaryUpgrades){var t=!this.supportsBinary&&u.transport.supportsBinary;p=p||t}p||(h.send([{type:"ping",data:"probe"}]),h.once("packet",function(t){if(!p)if("pong"===t.type&&"probe"===t.data){if(u.upgrading=!0,u.emit("upgrading",h),!h)return;n.priorWebsocketSuccess="websocket"===h.name,u.transport.pause(function(){p||"closed"!==u.readyState&&(c(),u.setTransport(h),h.send([{type:"upgrade"}]),u.emit("upgrade",h),h=null,u.upgrading=!1,u.flush())})}else{var e=new Error("probe error");e.transport=h.name,u.emit("upgradeError",e)}}))}function r(){p||(p=!0,c(),h.close(),h=null)}function o(t){var e=new Error("probe error: "+t);e.transport=h.name,r(),u.emit("upgradeError",e)}function i(){o("transport closed")}function s(){o("socket closed")}function a(t){h&&t.name!==h.name&&r()}function c(){h.removeListener("open",e),h.removeListener("error",o),h.removeListener("close",i),u.removeListener("close",s),u.removeListener("upgrading",a)}var h=this.createTransport(t,{probe:1}),p=!1,u=this;n.priorWebsocketSuccess=!1,h.once("open",e),h.once("error",o),h.once("close",i),this.once("close",s),this.once("upgrading",a),h.open()},n.prototype.onOpen=function(){if(this.readyState="open",n.priorWebsocketSuccess="websocket"===this.transport.name,this.emit("open"),this.flush(),"open"===this.readyState&&this.upgrade&&this.transport.pause)for(var t=0,e=this.upgrades.length;t<e;t++)this.probe(this.upgrades[t])},n.prototype.onPacket=function(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emit("packet",t),this.emit("heartbeat"),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"pong":this.setPing(),this.emit("pong");break;case"error":var e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emit("data",t.data),this.emit("message",t.data)}},n.prototype.onHandshake=function(t){this.emit("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.onOpen(),"closed"!==this.readyState&&(this.setPing(),this.removeListener("heartbeat",this.onHeartbeat),this.on("heartbeat",this.onHeartbeat))},n.prototype.onHeartbeat=function(t){clearTimeout(this.pingTimeoutTimer);var e=this;e.pingTimeoutTimer=setTimeout(function(){"closed"!==e.readyState&&e.onClose("ping timeout")},t||e.pingInterval+e.pingTimeout)},n.prototype.setPing=function(){var t=this;clearTimeout(t.pingIntervalTimer),t.pingIntervalTimer=setTimeout(function(){t.ping(),t.onHeartbeat(t.pingTimeout)},t.pingInterval)},n.prototype.ping=function(){var t=this;this.sendPacket("ping",function(){t.emit("ping")})},n.prototype.onDrain=function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emit("drain"):this.flush()},n.prototype.flush=function(){"closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length&&(this.transport.send(this.writeBuffer),this.prevBufferLen=this.writeBuffer.length,this.emit("flush"))},n.prototype.write=n.prototype.send=function(t,e,r){return this.sendPacket("message",t,e,r),this},n.prototype.sendPacket=function(t,e,r,n){if("function"==typeof e&&(n=e,e=void 0),"function"==typeof r&&(n=r,r=null),"closing"!==this.readyState&&"closed"!==this.readyState){r=r||{},r.compress=!1!==r.compress;var o={type:t,data:e,options:r};this.emit("packetCreate",o),this.writeBuffer.push(o),n&&this.once("flush",n),this.flush()}},n.prototype.close=function(){function t(){n.onClose("forced close"),n.transport.close()}function e(){n.removeListener("upgrade",e),n.removeListener("upgradeError",e),t()}function r(){n.once("upgrade",e),n.once("upgradeError",e)}if("opening"===this.readyState||"open"===this.readyState){this.readyState="closing";var n=this;this.writeBuffer.length?this.once("drain",function(){this.upgrading?r():t()}):this.upgrading?r():t()}return this},n.prototype.onError=function(t){n.priorWebsocketSuccess=!1,this.emit("error",t),this.onClose("transport error",t)},n.prototype.onClose=function(t,e){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState){var r=this;clearTimeout(this.pingIntervalTimer),clearTimeout(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),this.readyState="closed",this.id=null,this.emit("close",t,e),r.writeBuffer=[],r.prevBufferLen=0}},n.prototype.filterUpgrades=function(t){for(var e=[],r=0,n=t.length;r<n;r++)~a(this.transports,t[r])&&e.push(t[r]);return e}}).call(e,function(){return this}())},function(t,e,r){(function(t){function n(e){var r,n=!1,a=!1,c=!1!==e.jsonp;if(t.location){var h="https:"===location.protocol,p=location.port;p||(p=h?443:80),n=e.hostname!==location.hostname||p!==e.port,a=e.secure!==h}if(e.xdomain=n,e.xscheme=a,r=new o(e),"open"in r&&!e.forceJSONP)return new i(e);if(!c)throw new Error("JSONP disabled");return new s(e)}var o=r(13),i=r(15),s=r(30),a=r(31);e.polling=n,e.websocket=a}).call(e,function(){return this}())},function(t,e,r){(function(e){var n=r(14);t.exports=function(t){var r=t.xdomain,o=t.xscheme,i=t.enablesXDR;try{if("undefined"!=typeof XMLHttpRequest&&(!r||n))return new XMLHttpRequest}catch(t){}try{if("undefined"!=typeof XDomainRequest&&!o&&i)return new XDomainRequest}catch(t){}if(!r)try{return new(e[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(t){}}}).call(e,function(){return this}())},function(t,e){try{t.exports="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(e){t.exports=!1}},function(t,e,r){(function(e){function n(){}function o(t){if(c.call(this,t),this.requestTimeout=t.requestTimeout,this.extraHeaders=t.extraHeaders,e.location){var r="https:"===location.protocol,n=location.port;n||(n=r?443:80),this.xd=t.hostname!==e.location.hostname||n!==t.port,this.xs=t.secure!==r}}function i(t){this.method=t.method||"GET",this.uri=t.uri,this.xd=!!t.xd,this.xs=!!t.xs,this.async=!1!==t.async,this.data=void 0!==t.data?t.data:null,this.agent=t.agent,this.isBinary=t.isBinary,this.supportsBinary=t.supportsBinary,this.enablesXDR=t.enablesXDR,this.requestTimeout=t.requestTimeout,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.extraHeaders=t.extraHeaders,this.create()}function s(){for(var t in i.requests)i.requests.hasOwnProperty(t)&&i.requests[t].abort()}var a=r(13),c=r(16),h=r(5),p=r(28);r(3)("engine.io-client:polling-xhr");t.exports=o,t.exports.Request=i,p(o,c),o.prototype.supportsBinary=!0,o.prototype.request=function(t){return t=t||{},t.uri=this.uri(),t.xd=this.xd,t.xs=this.xs,t.agent=this.agent||!1,t.supportsBinary=this.supportsBinary,t.enablesXDR=this.enablesXDR,t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized,t.requestTimeout=this.requestTimeout,t.extraHeaders=this.extraHeaders,new i(t)},o.prototype.doWrite=function(t,e){var r="string"!=typeof t&&void 0!==t,n=this.request({method:"POST",data:t,isBinary:r}),o=this;n.on("success",e),n.on("error",function(t){o.onError("xhr post error",t)}),this.sendXhr=n},o.prototype.doPoll=function(){var t=this.request(),e=this;t.on("data",function(t){e.onData(t)}),t.on("error",function(t){e.onError("xhr poll error",t)}),this.pollXhr=t},h(i.prototype),i.prototype.create=function(){var t={agent:this.agent,xdomain:this.xd,xscheme:this.xs,enablesXDR:this.enablesXDR};t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized;var r=this.xhr=new a(t),n=this;try{r.open(this.method,this.uri,this.async);try{if(this.extraHeaders){r.setDisableHeaderCheck&&r.setDisableHeaderCheck(!0);for(var o in this.extraHeaders)this.extraHeaders.hasOwnProperty(o)&&r.setRequestHeader(o,this.extraHeaders[o])}}catch(t){}if("POST"===this.method)try{this.isBinary?r.setRequestHeader("Content-type","application/octet-stream"):r.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(t){}try{r.setRequestHeader("Accept","*/*")}catch(t){}"withCredentials"in r&&(r.withCredentials=!0),this.requestTimeout&&(r.timeout=this.requestTimeout),this.hasXDR()?(r.onload=function(){n.onLoad()},r.onerror=function(){n.onError(r.responseText)}):r.onreadystatechange=function(){if(2===r.readyState)try{var t=r.getResponseHeader("Content-Type");n.supportsBinary&&"application/octet-stream"===t&&(r.responseType="arraybuffer")}catch(t){}4===r.readyState&&(200===r.status||1223===r.status?n.onLoad():setTimeout(function(){n.onError(r.status)},0))},r.send(this.data)}catch(t){return void setTimeout(function(){n.onError(t)},0)}e.document&&(this.index=i.requestsCount++,i.requests[this.index]=this)},i.prototype.onSuccess=function(){this.emit("success"),this.cleanup()},i.prototype.onData=function(t){this.emit("data",t),this.onSuccess()},i.prototype.onError=function(t){this.emit("error",t),this.cleanup(!0)},i.prototype.cleanup=function(t){if("undefined"!=typeof this.xhr&&null!==this.xhr){if(this.hasXDR()?this.xhr.onload=this.xhr.onerror=n:this.xhr.onreadystatechange=n,t)try{this.xhr.abort()}catch(t){}e.document&&delete i.requests[this.index],this.xhr=null}},i.prototype.onLoad=function(){var t;try{var e;try{e=this.xhr.getResponseHeader("Content-Type")}catch(t){}t="application/octet-stream"===e?this.xhr.response||this.xhr.responseText:this.xhr.responseText}catch(t){this.onError(t)}null!=t&&this.onData(t)},i.prototype.hasXDR=function(){return"undefined"!=typeof e.XDomainRequest&&!this.xs&&this.enablesXDR},i.prototype.abort=function(){this.cleanup()},i.requestsCount=0,i.requests={},e.document&&(e.attachEvent?e.attachEvent("onunload",s):e.addEventListener&&e.addEventListener("beforeunload",s,!1))}).call(e,function(){return this}())},function(t,e,r){function n(t){var e=t&&t.forceBase64;h&&!e||(this.supportsBinary=!1),o.call(this,t)}var o=r(17),i=r(27),s=r(18),a=r(28),c=r(29);r(3)("engine.io-client:polling");t.exports=n;var h=function(){var t=r(13),e=new t({xdomain:!1});return null!=e.responseType}();a(n,o),n.prototype.name="polling",n.prototype.doOpen=function(){this.poll()},n.prototype.pause=function(t){function e(){r.readyState="paused",t()}var r=this;if(this.readyState="pausing",this.polling||!this.writable){var n=0;this.polling&&(n++,this.once("pollComplete",function(){--n||e()})),this.writable||(n++,this.once("drain",function(){--n||e()}))}else e()},n.prototype.poll=function(){this.polling=!0,this.doPoll(),this.emit("poll")},n.prototype.onData=function(t){var e=this,r=function(t,r,n){return"opening"===e.readyState&&e.onOpen(),"close"===t.type?(e.onClose(),!1):void e.onPacket(t)};s.decodePayload(t,this.socket.binaryType,r),"closed"!==this.readyState&&(this.polling=!1,this.emit("pollComplete"),"open"===this.readyState&&this.poll())},n.prototype.doClose=function(){function t(){e.write([{type:"close"}])}var e=this;"open"===this.readyState?t():this.once("open",t)},n.prototype.write=function(t){var e=this;this.writable=!1;var r=function(){e.writable=!0,e.emit("drain")};s.encodePayload(t,this.supportsBinary,function(t){e.doWrite(t,r)})},n.prototype.uri=function(){var t=this.query||{},e=this.secure?"https":"http",r="";!1!==this.timestampRequests&&(t[this.timestampParam]=c()),this.supportsBinary||t.sid||(t.b64=1),t=i.encode(t),this.port&&("https"===e&&443!==Number(this.port)||"http"===e&&80!==Number(this.port))&&(r=":"+this.port),t.length&&(t="?"+t);var n=this.hostname.indexOf(":")!==-1;return e+"://"+(n?"["+this.hostname+"]":this.hostname)+r+this.path+t}},function(t,e,r){function n(t){this.path=t.path,this.hostname=t.hostname,this.port=t.port,this.secure=t.secure,this.query=t.query,this.timestampParam=t.timestampParam,this.timestampRequests=t.timestampRequests,this.readyState="",this.agent=t.agent||!1,this.socket=t.socket,this.enablesXDR=t.enablesXDR,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.forceNode=t.forceNode,this.extraHeaders=t.extraHeaders,this.localAddress=t.localAddress}var o=r(18),i=r(5);t.exports=n,i(n.prototype),n.prototype.onError=function(t,e){var r=new Error(t);return r.type="TransportError",r.description=e,this.emit("error",r),this},n.prototype.open=function(){return"closed"!==this.readyState&&""!==this.readyState||(this.readyState="opening",this.doOpen()),this},n.prototype.close=function(){return"opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this},n.prototype.send=function(t){if("open"!==this.readyState)throw new Error("Transport not open");this.write(t)},n.prototype.onOpen=function(){this.readyState="open",this.writable=!0,this.emit("open")},n.prototype.onData=function(t){var e=o.decodePacket(t,this.socket.binaryType);this.onPacket(e)},n.prototype.onPacket=function(t){this.emit("packet",t)},n.prototype.onClose=function(){this.readyState="closed",this.emit("close")}},function(t,e,r){(function(t){function n(t,r){var n="b"+e.packets[t.type]+t.data.data;return r(n)}function o(t,r,n){if(!r)return e.encodeBase64Packet(t,n);
var o=t.data,i=new Uint8Array(o),s=new Uint8Array(1+o.byteLength);s[0]=v[t.type];for(var a=0;a<i.length;a++)s[a+1]=i[a];return n(s.buffer)}function i(t,r,n){if(!r)return e.encodeBase64Packet(t,n);var o=new FileReader;return o.onload=function(){t.data=o.result,e.encodePacket(t,r,!0,n)},o.readAsArrayBuffer(t.data)}function s(t,r,n){if(!r)return e.encodeBase64Packet(t,n);if(g)return i(t,r,n);var o=new Uint8Array(1);o[0]=v[t.type];var s=new w([o.buffer,t.data]);return n(s)}function a(t){try{t=d.decode(t,{strict:!1})}catch(t){return!1}return t}function c(t,e,r){for(var n=new Array(t.length),o=l(t.length,r),i=function(t,r,o){e(r,function(e,r){n[t]=r,o(e,n)})},s=0;s<t.length;s++)i(s,t[s],o)}var h,p=r(19),u=r(20),f=r(21),l=r(22),d=r(23);t&&t.ArrayBuffer&&(h=r(25));var y="undefined"!=typeof navigator&&/Android/i.test(navigator.userAgent),m="undefined"!=typeof navigator&&/PhantomJS/i.test(navigator.userAgent),g=y||m;e.protocol=3;var v=e.packets={open:0,close:1,ping:2,pong:3,message:4,upgrade:5,noop:6},b=p(v),k={type:"error",data:"parser error"},w=r(26);e.encodePacket=function(e,r,i,a){"function"==typeof r&&(a=r,r=!1),"function"==typeof i&&(a=i,i=null);var c=void 0===e.data?void 0:e.data.buffer||e.data;if(t.ArrayBuffer&&c instanceof ArrayBuffer)return o(e,r,a);if(w&&c instanceof t.Blob)return s(e,r,a);if(c&&c.base64)return n(e,a);var h=v[e.type];return void 0!==e.data&&(h+=i?d.encode(String(e.data),{strict:!1}):String(e.data)),a(""+h)},e.encodeBase64Packet=function(r,n){var o="b"+e.packets[r.type];if(w&&r.data instanceof t.Blob){var i=new FileReader;return i.onload=function(){var t=i.result.split(",")[1];n(o+t)},i.readAsDataURL(r.data)}var s;try{s=String.fromCharCode.apply(null,new Uint8Array(r.data))}catch(t){for(var a=new Uint8Array(r.data),c=new Array(a.length),h=0;h<a.length;h++)c[h]=a[h];s=String.fromCharCode.apply(null,c)}return o+=t.btoa(s),n(o)},e.decodePacket=function(t,r,n){if(void 0===t)return k;if("string"==typeof t){if("b"===t.charAt(0))return e.decodeBase64Packet(t.substr(1),r);if(n&&(t=a(t),t===!1))return k;var o=t.charAt(0);return Number(o)==o&&b[o]?t.length>1?{type:b[o],data:t.substring(1)}:{type:b[o]}:k}var i=new Uint8Array(t),o=i[0],s=f(t,1);return w&&"blob"===r&&(s=new w([s])),{type:b[o],data:s}},e.decodeBase64Packet=function(t,e){var r=b[t.charAt(0)];if(!h)return{type:r,data:{base64:!0,data:t.substr(1)}};var n=h.decode(t.substr(1));return"blob"===e&&w&&(n=new w([n])),{type:r,data:n}},e.encodePayload=function(t,r,n){function o(t){return t.length+":"+t}function i(t,n){e.encodePacket(t,!!s&&r,!1,function(t){n(null,o(t))})}"function"==typeof r&&(n=r,r=null);var s=u(t);return r&&s?w&&!g?e.encodePayloadAsBlob(t,n):e.encodePayloadAsArrayBuffer(t,n):t.length?void c(t,i,function(t,e){return n(e.join(""))}):n("0:")},e.decodePayload=function(t,r,n){if("string"!=typeof t)return e.decodePayloadAsBinary(t,r,n);"function"==typeof r&&(n=r,r=null);var o;if(""===t)return n(k,0,1);for(var i,s,a="",c=0,h=t.length;c<h;c++){var p=t.charAt(c);if(":"===p){if(""===a||a!=(i=Number(a)))return n(k,0,1);if(s=t.substr(c+1,i),a!=s.length)return n(k,0,1);if(s.length){if(o=e.decodePacket(s,r,!1),k.type===o.type&&k.data===o.data)return n(k,0,1);var u=n(o,c+i,h);if(!1===u)return}c+=i,a=""}else a+=p}return""!==a?n(k,0,1):void 0},e.encodePayloadAsArrayBuffer=function(t,r){function n(t,r){e.encodePacket(t,!0,!0,function(t){return r(null,t)})}return t.length?void c(t,n,function(t,e){var n=e.reduce(function(t,e){var r;return r="string"==typeof e?e.length:e.byteLength,t+r.toString().length+r+2},0),o=new Uint8Array(n),i=0;return e.forEach(function(t){var e="string"==typeof t,r=t;if(e){for(var n=new Uint8Array(t.length),s=0;s<t.length;s++)n[s]=t.charCodeAt(s);r=n.buffer}e?o[i++]=0:o[i++]=1;for(var a=r.byteLength.toString(),s=0;s<a.length;s++)o[i++]=parseInt(a[s]);o[i++]=255;for(var n=new Uint8Array(r),s=0;s<n.length;s++)o[i++]=n[s]}),r(o.buffer)}):r(new ArrayBuffer(0))},e.encodePayloadAsBlob=function(t,r){function n(t,r){e.encodePacket(t,!0,!0,function(t){var e=new Uint8Array(1);if(e[0]=1,"string"==typeof t){for(var n=new Uint8Array(t.length),o=0;o<t.length;o++)n[o]=t.charCodeAt(o);t=n.buffer,e[0]=0}for(var i=t instanceof ArrayBuffer?t.byteLength:t.size,s=i.toString(),a=new Uint8Array(s.length+1),o=0;o<s.length;o++)a[o]=parseInt(s[o]);if(a[s.length]=255,w){var c=new w([e.buffer,a.buffer,t]);r(null,c)}})}c(t,n,function(t,e){return r(new w(e))})},e.decodePayloadAsBinary=function(t,r,n){"function"==typeof r&&(n=r,r=null);for(var o=t,i=[];o.byteLength>0;){for(var s=new Uint8Array(o),a=0===s[0],c="",h=1;255!==s[h];h++){if(c.length>310)return n(k,0,1);c+=s[h]}o=f(o,2+c.length),c=parseInt(c);var p=f(o,0,c);if(a)try{p=String.fromCharCode.apply(null,new Uint8Array(p))}catch(t){var u=new Uint8Array(p);p="";for(var h=0;h<u.length;h++)p+=String.fromCharCode(u[h])}i.push(p),o=f(o,c)}var l=i.length;i.forEach(function(t,o){n(e.decodePacket(t,r,!0),o,l)})}}).call(e,function(){return this}())},function(t,e){t.exports=Object.keys||function(t){var e=[],r=Object.prototype.hasOwnProperty;for(var n in t)r.call(t,n)&&e.push(n);return e}},function(t,e,r){(function(e){function n(t){if(!t||"object"!=typeof t)return!1;if(o(t)){for(var r=0,i=t.length;r<i;r++)if(n(t[r]))return!0;return!1}if("function"==typeof e.Buffer&&e.Buffer.isBuffer&&e.Buffer.isBuffer(t)||"function"==typeof e.ArrayBuffer&&t instanceof ArrayBuffer||s&&t instanceof Blob||a&&t instanceof File)return!0;if(t.toJSON&&"function"==typeof t.toJSON&&1===arguments.length)return n(t.toJSON(),!0);for(var c in t)if(Object.prototype.hasOwnProperty.call(t,c)&&n(t[c]))return!0;return!1}var o=r(7),i=Object.prototype.toString,s="function"==typeof e.Blob||"[object BlobConstructor]"===i.call(e.Blob),a="function"==typeof e.File||"[object FileConstructor]"===i.call(e.File);t.exports=n}).call(e,function(){return this}())},function(t,e){t.exports=function(t,e,r){var n=t.byteLength;if(e=e||0,r=r||n,t.slice)return t.slice(e,r);if(e<0&&(e+=n),r<0&&(r+=n),r>n&&(r=n),e>=n||e>=r||0===n)return new ArrayBuffer(0);for(var o=new Uint8Array(t),i=new Uint8Array(r-e),s=e,a=0;s<r;s++,a++)i[a]=o[s];return i.buffer}},function(t,e){function r(t,e,r){function o(t,n){if(o.count<=0)throw new Error("after called too many times");--o.count,t?(i=!0,e(t),e=r):0!==o.count||i||e(null,n)}var i=!1;return r=r||n,o.count=t,0===t?e():o}function n(){}t.exports=r},function(t,e,r){var n;(function(t,o){!function(i){function s(t){for(var e,r,n=[],o=0,i=t.length;o<i;)e=t.charCodeAt(o++),e>=55296&&e<=56319&&o<i?(r=t.charCodeAt(o++),56320==(64512&r)?n.push(((1023&e)<<10)+(1023&r)+65536):(n.push(e),o--)):n.push(e);return n}function a(t){for(var e,r=t.length,n=-1,o="";++n<r;)e=t[n],e>65535&&(e-=65536,o+=k(e>>>10&1023|55296),e=56320|1023&e),o+=k(e);return o}function c(t,e){if(t>=55296&&t<=57343){if(e)throw Error("Lone surrogate U+"+t.toString(16).toUpperCase()+" is not a scalar value");return!1}return!0}function h(t,e){return k(t>>e&63|128)}function p(t,e){if(0==(4294967168&t))return k(t);var r="";return 0==(4294965248&t)?r=k(t>>6&31|192):0==(4294901760&t)?(c(t,e)||(t=65533),r=k(t>>12&15|224),r+=h(t,6)):0==(4292870144&t)&&(r=k(t>>18&7|240),r+=h(t,12),r+=h(t,6)),r+=k(63&t|128)}function u(t,e){e=e||{};for(var r,n=!1!==e.strict,o=s(t),i=o.length,a=-1,c="";++a<i;)r=o[a],c+=p(r,n);return c}function f(){if(b>=v)throw Error("Invalid byte index");var t=255&g[b];if(b++,128==(192&t))return 63&t;throw Error("Invalid continuation byte")}function l(t){var e,r,n,o,i;if(b>v)throw Error("Invalid byte index");if(b==v)return!1;if(e=255&g[b],b++,0==(128&e))return e;if(192==(224&e)){if(r=f(),i=(31&e)<<6|r,i>=128)return i;throw Error("Invalid continuation byte")}if(224==(240&e)){if(r=f(),n=f(),i=(15&e)<<12|r<<6|n,i>=2048)return c(i,t)?i:65533;throw Error("Invalid continuation byte")}if(240==(248&e)&&(r=f(),n=f(),o=f(),i=(7&e)<<18|r<<12|n<<6|o,i>=65536&&i<=1114111))return i;throw Error("Invalid UTF-8 detected")}function d(t,e){e=e||{};var r=!1!==e.strict;g=s(t),v=g.length,b=0;for(var n,o=[];(n=l(r))!==!1;)o.push(n);return a(o)}var y="object"==typeof e&&e,m=("object"==typeof t&&t&&t.exports==y&&t,"object"==typeof o&&o);m.global!==m&&m.window!==m||(i=m);var g,v,b,k=String.fromCharCode,w={version:"2.1.2",encode:u,decode:d};n=function(){return w}.call(e,r,e,t),!(void 0!==n&&(t.exports=n))}(this)}).call(e,r(24)(t),function(){return this}())},function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children=[],t.webpackPolyfill=1),t}},function(t,e){!function(){"use strict";for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",r=new Uint8Array(256),n=0;n<t.length;n++)r[t.charCodeAt(n)]=n;e.encode=function(e){var r,n=new Uint8Array(e),o=n.length,i="";for(r=0;r<o;r+=3)i+=t[n[r]>>2],i+=t[(3&n[r])<<4|n[r+1]>>4],i+=t[(15&n[r+1])<<2|n[r+2]>>6],i+=t[63&n[r+2]];return o%3===2?i=i.substring(0,i.length-1)+"=":o%3===1&&(i=i.substring(0,i.length-2)+"=="),i},e.decode=function(t){var e,n,o,i,s,a=.75*t.length,c=t.length,h=0;"="===t[t.length-1]&&(a--,"="===t[t.length-2]&&a--);var p=new ArrayBuffer(a),u=new Uint8Array(p);for(e=0;e<c;e+=4)n=r[t.charCodeAt(e)],o=r[t.charCodeAt(e+1)],i=r[t.charCodeAt(e+2)],s=r[t.charCodeAt(e+3)],u[h++]=n<<2|o>>4,u[h++]=(15&o)<<4|i>>2,u[h++]=(3&i)<<6|63&s;return p}}()},function(t,e){(function(e){function r(t){for(var e=0;e<t.length;e++){var r=t[e];if(r.buffer instanceof ArrayBuffer){var n=r.buffer;if(r.byteLength!==n.byteLength){var o=new Uint8Array(r.byteLength);o.set(new Uint8Array(n,r.byteOffset,r.byteLength)),n=o.buffer}t[e]=n}}}function n(t,e){e=e||{};var n=new i;r(t);for(var o=0;o<t.length;o++)n.append(t[o]);return e.type?n.getBlob(e.type):n.getBlob()}function o(t,e){return r(t),new Blob(t,e||{})}var i=e.BlobBuilder||e.WebKitBlobBuilder||e.MSBlobBuilder||e.MozBlobBuilder,s=function(){try{var t=new Blob(["hi"]);return 2===t.size}catch(t){return!1}}(),a=s&&function(){try{var t=new Blob([new Uint8Array([1,2])]);return 2===t.size}catch(t){return!1}}(),c=i&&i.prototype.append&&i.prototype.getBlob;t.exports=function(){return s?a?e.Blob:o:c?n:void 0}()}).call(e,function(){return this}())},function(t,e){e.encode=function(t){var e="";for(var r in t)t.hasOwnProperty(r)&&(e.length&&(e+="&"),e+=encodeURIComponent(r)+"="+encodeURIComponent(t[r]));return e},e.decode=function(t){for(var e={},r=t.split("&"),n=0,o=r.length;n<o;n++){var i=r[n].split("=");e[decodeURIComponent(i[0])]=decodeURIComponent(i[1])}return e}},function(t,e){t.exports=function(t,e){var r=function(){};r.prototype=e.prototype,t.prototype=new r,t.prototype.constructor=t}},function(t,e){"use strict";function r(t){var e="";do e=s[t%a]+e,t=Math.floor(t/a);while(t>0);return e}function n(t){var e=0;for(p=0;p<t.length;p++)e=e*a+c[t.charAt(p)];return e}function o(){var t=r(+new Date);return t!==i?(h=0,i=t):t+"."+r(h++)}for(var i,s="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),a=64,c={},h=0,p=0;p<a;p++)c[s[p]]=p;o.encode=r,o.decode=n,t.exports=o},function(t,e,r){(function(e){function n(){}function o(t){i.call(this,t),this.query=this.query||{},a||(e.___eio||(e.___eio=[]),a=e.___eio),this.index=a.length;var r=this;a.push(function(t){r.onData(t)}),this.query.j=this.index,e.document&&e.addEventListener&&e.addEventListener("beforeunload",function(){r.script&&(r.script.onerror=n)},!1)}var i=r(16),s=r(28);t.exports=o;var a,c=/\n/g,h=/\\n/g;s(o,i),o.prototype.supportsBinary=!1,o.prototype.doClose=function(){this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),this.form&&(this.form.parentNode.removeChild(this.form),this.form=null,this.iframe=null),i.prototype.doClose.call(this)},o.prototype.doPoll=function(){var t=this,e=document.createElement("script");this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),e.async=!0,e.src=this.uri(),e.onerror=function(e){t.onError("jsonp poll error",e)};var r=document.getElementsByTagName("script")[0];r?r.parentNode.insertBefore(e,r):(document.head||document.body).appendChild(e),this.script=e;var n="undefined"!=typeof navigator&&/gecko/i.test(navigator.userAgent);n&&setTimeout(function(){var t=document.createElement("iframe");document.body.appendChild(t),document.body.removeChild(t)},100)},o.prototype.doWrite=function(t,e){function r(){n(),e()}function n(){if(o.iframe)try{o.form.removeChild(o.iframe)}catch(t){o.onError("jsonp polling iframe removal error",t)}try{var t='<iframe src="javascript:0" name="'+o.iframeId+'">';i=document.createElement(t)}catch(t){i=document.createElement("iframe"),i.name=o.iframeId,i.src="javascript:0"}i.id=o.iframeId,o.form.appendChild(i),o.iframe=i}var o=this;if(!this.form){var i,s=document.createElement("form"),a=document.createElement("textarea"),p=this.iframeId="eio_iframe_"+this.index;s.className="socketio",s.style.position="absolute",s.style.top="-1000px",s.style.left="-1000px",s.target=p,s.method="POST",s.setAttribute("accept-charset","utf-8"),a.name="d",s.appendChild(a),document.body.appendChild(s),this.form=s,this.area=a}this.form.action=this.uri(),n(),t=t.replace(h,"\\\n"),this.area.value=t.replace(c,"\\n");try{this.form.submit()}catch(t){}this.iframe.attachEvent?this.iframe.onreadystatechange=function(){"complete"===o.iframe.readyState&&r()}:this.iframe.onload=r}}).call(e,function(){return this}())},function(t,e,r){(function(e){function n(t){var e=t&&t.forceBase64;e&&(this.supportsBinary=!1),this.perMessageDeflate=t.perMessageDeflate,this.usingBrowserWebSocket=p&&!t.forceNode,this.protocols=t.protocols,this.usingBrowserWebSocket||(u=o),i.call(this,t)}var o,i=r(17),s=r(18),a=r(27),c=r(28),h=r(29),p=(r(3)("engine.io-client:websocket"),e.WebSocket||e.MozWebSocket);if("undefined"==typeof window)try{o=r(32)}catch(t){}var u=p;u||"undefined"!=typeof window||(u=o),t.exports=n,c(n,i),n.prototype.name="websocket",n.prototype.supportsBinary=!0,n.prototype.doOpen=function(){if(this.check()){var t=this.uri(),e=this.protocols,r={agent:this.agent,perMessageDeflate:this.perMessageDeflate};r.pfx=this.pfx,r.key=this.key,r.passphrase=this.passphrase,r.cert=this.cert,r.ca=this.ca,r.ciphers=this.ciphers,r.rejectUnauthorized=this.rejectUnauthorized,this.extraHeaders&&(r.headers=this.extraHeaders),this.localAddress&&(r.localAddress=this.localAddress);try{this.ws=this.usingBrowserWebSocket?e?new u(t,e):new u(t):new u(t,e,r)}catch(t){return this.emit("error",t)}void 0===this.ws.binaryType&&(this.supportsBinary=!1),this.ws.supports&&this.ws.supports.binary?(this.supportsBinary=!0,this.ws.binaryType="nodebuffer"):this.ws.binaryType="arraybuffer",this.addEventListeners()}},n.prototype.addEventListeners=function(){var t=this;this.ws.onopen=function(){t.onOpen()},this.ws.onclose=function(){t.onClose()},this.ws.onmessage=function(e){t.onData(e.data)},this.ws.onerror=function(e){t.onError("websocket error",e)}},n.prototype.write=function(t){function r(){n.emit("flush"),setTimeout(function(){n.writable=!0,n.emit("drain")},0)}var n=this;this.writable=!1;for(var o=t.length,i=0,a=o;i<a;i++)!function(t){s.encodePacket(t,n.supportsBinary,function(i){if(!n.usingBrowserWebSocket){var s={};if(t.options&&(s.compress=t.options.compress),n.perMessageDeflate){var a="string"==typeof i?e.Buffer.byteLength(i):i.length;a<n.perMessageDeflate.threshold&&(s.compress=!1)}}try{n.usingBrowserWebSocket?n.ws.send(i):n.ws.send(i,s)}catch(t){}--o||r()})}(t[i])},n.prototype.onClose=function(){i.prototype.onClose.call(this)},n.prototype.doClose=function(){"undefined"!=typeof this.ws&&this.ws.close()},n.prototype.uri=function(){var t=this.query||{},e=this.secure?"wss":"ws",r="";this.port&&("wss"===e&&443!==Number(this.port)||"ws"===e&&80!==Number(this.port))&&(r=":"+this.port),this.timestampRequests&&(t[this.timestampParam]=h()),this.supportsBinary||(t.b64=1),t=a.encode(t),t.length&&(t="?"+t);var n=this.hostname.indexOf(":")!==-1;return e+"://"+(n?"["+this.hostname+"]":this.hostname)+r+this.path+t},n.prototype.check=function(){return!(!u||"__initialize"in u&&this.name===n.prototype.name)}}).call(e,function(){return this}())},function(t,e){},function(t,e){var r=[].indexOf;t.exports=function(t,e){if(r)return t.indexOf(e);for(var n=0;n<t.length;++n)if(t[n]===e)return n;return-1}},function(t,e,r){"use strict";function n(t,e,r){this.io=t,this.nsp=e,this.json=this,this.ids=0,this.acks={},this.receiveBuffer=[],this.sendBuffer=[],this.connected=!1,this.disconnected=!0,this.flags={},r&&r.query&&(this.query=r.query),this.io.autoConnect&&this.open()}var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i=r(4),s=r(5),a=r(35),c=r(36),h=r(37),p=(r(3)("socket.io-client:socket"),r(27)),u=r(20);t.exports=e=n;var f={connect:1,connect_error:1,connect_timeout:1,connecting:1,disconnect:1,error:1,reconnect:1,reconnect_attempt:1,reconnect_failed:1,reconnect_error:1,reconnecting:1,ping:1,pong:1},l=s.prototype.emit;s(n.prototype),n.prototype.subEvents=function(){if(!this.subs){var t=this.io;this.subs=[c(t,"open",h(this,"onopen")),c(t,"packet",h(this,"onpacket")),c(t,"close",h(this,"onclose"))]}},n.prototype.open=n.prototype.connect=function(){return this.connected?this:(this.subEvents(),this.io.open(),"open"===this.io.readyState&&this.onopen(),this.emit("connecting"),this)},n.prototype.send=function(){var t=a(arguments);return t.unshift("message"),this.emit.apply(this,t),this},n.prototype.emit=function(t){if(f.hasOwnProperty(t))return l.apply(this,arguments),this;var e=a(arguments),r={type:(void 0!==this.flags.binary?this.flags.binary:u(e))?i.BINARY_EVENT:i.EVENT,data:e};return r.options={},r.options.compress=!this.flags||!1!==this.flags.compress,"function"==typeof e[e.length-1]&&(this.acks[this.ids]=e.pop(),r.id=this.ids++),this.connected?this.packet(r):this.sendBuffer.push(r),this.flags={},this},n.prototype.packet=function(t){t.nsp=this.nsp,this.io.packet(t)},n.prototype.onopen=function(){if("/"!==this.nsp)if(this.query){var t="object"===o(this.query)?p.encode(this.query):this.query;this.packet({type:i.CONNECT,query:t})}else this.packet({type:i.CONNECT})},n.prototype.onclose=function(t){this.connected=!1,this.disconnected=!0,delete this.id,this.emit("disconnect",t)},n.prototype.onpacket=function(t){var e=t.nsp===this.nsp,r=t.type===i.ERROR&&"/"===t.nsp;if(e||r)switch(t.type){case i.CONNECT:this.onconnect();break;case i.EVENT:this.onevent(t);break;case i.BINARY_EVENT:this.onevent(t);break;case i.ACK:this.onack(t);break;case i.BINARY_ACK:this.onack(t);break;case i.DISCONNECT:this.ondisconnect();break;case i.ERROR:this.emit("error",t.data)}},n.prototype.onevent=function(t){var e=t.data||[];null!=t.id&&e.push(this.ack(t.id)),this.connected?l.apply(this,e):this.receiveBuffer.push(e)},n.prototype.ack=function(t){var e=this,r=!1;return function(){if(!r){r=!0;var n=a(arguments);e.packet({type:u(n)?i.BINARY_ACK:i.ACK,id:t,data:n})}}},n.prototype.onack=function(t){var e=this.acks[t.id];"function"==typeof e&&(e.apply(this,t.data),delete this.acks[t.id])},n.prototype.onconnect=function(){this.connected=!0,this.disconnected=!1,this.emit("connect"),this.emitBuffered()},n.prototype.emitBuffered=function(){var t;for(t=0;t<this.receiveBuffer.length;t++)l.apply(this,this.receiveBuffer[t]);for(this.receiveBuffer=[],t=0;t<this.sendBuffer.length;t++)this.packet(this.sendBuffer[t]);this.sendBuffer=[]},n.prototype.ondisconnect=function(){this.destroy(),this.onclose("io server disconnect")},n.prototype.destroy=function(){if(this.subs){for(var t=0;t<this.subs.length;t++)this.subs[t].destroy();this.subs=null}this.io.destroy(this)},n.prototype.close=n.prototype.disconnect=function(){return this.connected&&this.packet({type:i.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this},n.prototype.compress=function(t){return this.flags.compress=t,this},n.prototype.binary=function(t){return this.flags.binary=t,this}},function(t,e){function r(t,e){var r=[];e=e||0;for(var n=e||0;n<t.length;n++)r[n-e]=t[n];return r}t.exports=r},function(t,e){"use strict";function r(t,e,r){return t.on(e,r),{destroy:function(){t.removeListener(e,r)}}}t.exports=r},function(t,e){var r=[].slice;t.exports=function(t,e){if("string"==typeof e&&(e=t[e]),"function"!=typeof e)throw new Error("bind() requires a function");var n=r.call(arguments,2);return function(){return e.apply(t,n.concat(r.call(arguments)))}}},function(t,e){function r(t){t=t||{},this.ms=t.min||100,this.max=t.max||1e4,this.factor=t.factor||2,this.jitter=t.jitter>0&&t.jitter<=1?t.jitter:0,this.attempts=0}t.exports=r,r.prototype.duration=function(){var t=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),r=Math.floor(e*this.jitter*t);t=0==(1&Math.floor(10*e))?t-r:t+r}return 0|Math.min(t,this.max)},r.prototype.reset=function(){this.attempts=0},r.prototype.setMin=function(t){this.ms=t},r.prototype.setMax=function(t){this.max=t},r.prototype.setJitter=function(t){this.jitter=t}}])});

},{}],2:[function(require,module,exports){
const { AceBaseBase, DebugLogger, ColorStyle } = require('acebase-core');
const { WebApi } = require('./api-web');
const { AceBaseClientAuth } = require('./auth');
const { setServerBias } = require('./server-date');

class AceBaseClientConnectionSettings {

    /**
     * Settings to connect to a remote AceBase server
     * @param {object} settings 
     * @param {string} settings.dbname Name of the database you want to access
     * @param {string} settings.host Host name, eg "localhost", or "mydb.domain.com"
     * @param {number} settings.port Port number the server is running on
     * @param {boolean} [settings.https=true] Use SSL (https) to access the server or not. Default: true
     * @param {boolean} [settings.autoConnect=true] Automatically connect to the server, or wait until .connect is called
     * @param {object} [settings.cache] Settings for local cache
     * @param {AceBase} [settings.cache.db] AceBase database instance to use for local cache
     * @param {'verbose'|'log'|'warn'|'error'} [settings.logLevel='log'] debug logging level
     * 
     */
    constructor(settings) {
        this.dbname = settings.dbname;
        this.host = settings.host;
        this.port = settings.port;
        this.https = typeof settings.https === 'boolean' ? settings.https : true;
        this.autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.cache = typeof settings.cache === 'object' && typeof settings.cache.db === 'object' ? settings.cache : null; //  && settings.cache.db.constructor.name.startsWith('AceBase')
        this.logLevel = typeof settings.logLevel === 'string' ? settings.logLevel : 'log';
    }
}

/**
 * AceBaseClient lets you connect to a remote (or local) AceBase server over http(s)
 * @extends module:acebase-core/AceBaseBase
 */
class AceBaseClient extends AceBaseBase {

    /**
     * Create a client to access an AceBase server
     * @param {AceBaseClientConnectionSettings} settings
     */
    constructor(settings) {
        if (typeof settings !== 'object') {
            // Use old constructor signature: host, port, dbname, https = true
            settings = {};
            settings.host = arguments[0];
            settings.port = arguments[1];
            settings.dbname = arguments[2];
            settings.https = arguments[3];
        }
        if (!(settings instanceof AceBaseClientConnectionSettings)) {
            settings = new AceBaseClientConnectionSettings(settings);
        }
        super(settings.dbname, { info: 'realtime database client' });

        /*
            TODO: improve init flow with await/async (requires Node 7.6+) 
        */

        const cacheDb = settings.cache && settings.cache.db;
        const cacheReadyPromise = cacheDb ? cacheDb.ready() : Promise.resolve();

        let ready = false;
        this.on('ready', () => { ready = true; });
        this._connected = false;
        this.debug = new DebugLogger(settings.logLevel, `[${settings.dbname}]`.colorize(ColorStyle.blue)); // `[ ${settings.dbname} ]`

        this.on('connect', () => {
            // Synchronize date/time
            // const start = Date.now(); // performance.now();
            this.api.getServerInfo()
            .then(info => {
                const now = Date.now(),
                    // roundtrip = now - start, //performance.now() - start,
                    // expectedTime = now - Math.floor(roundtrip / 2),
                    // bias = info.time - expectedTime;
                    bias = info.time - now;
                setServerBias(bias);
            });
        });

        let syncRunning = false;
        const syncPendingChanges = () => {
            if (syncRunning) { 
                // Already syncing
                return; 
            }
            if (!this._connected) {
                return; // We'll retry once connected
            }
            syncRunning = true;
            return cacheReadyPromise.then(() => {
                return this.api.sync({
                    fetchFreshData: ready,
                    eventCallback: (eventName, args) => {
                        this.debug.log(eventName, args || '');
                        this.emit(eventName, args); // this.emit('cache_sync_event', { name: eventName, args });
                    }
                });
            })
            .catch(err => {
                // Sync failed for some reason
                console.error(`Failed to synchronize:`, err);
            })
            .then(() => {
                syncRunning = false;
            });
        }
        let syncTimeout = 0;
        this.on('connect', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncTimeout = setTimeout(syncPendingChanges, 1000); // Start sync with a short delay to allow client to sign in first
        });
        this.on('signin', () => {
            syncTimeout && clearTimeout(syncTimeout);
            syncPendingChanges();
        });
        if (cacheDb) {
            const remoteConnectPromise = new Promise(resolve => this.once('connect', resolve));
            const syncDonePromise = new Promise(resolve => this.once('sync_done', resolve));
            cacheReadyPromise.then(() => {
                // Cache database is ready. Is remote database ready?
                let waitForSyncEvent = true;
                return promiseTimeout(
                    1000, 
                    remoteConnectPromise, 
                    'remote connection'
                )
                .catch(err => {
                    // If the connect promise timed out, we'll emit the ready event and use the cache.
                    // Any other error should halt execution
                    if (err instanceof PromiseTimeoutError) {
                        waitForSyncEvent = false;
                    }
                    else {
                        this.debug.error(`Error: ${err.message}`);
                        throw err;
                    }
                })
                .then(() => {
                    if (waitForSyncEvent) {
                        return syncDonePromise;
                    }
                })
                .then(() => {
                    this.emit('ready');
                });
            });
        }

        this.api = new WebApi(settings.dbname, { logLevel: settings.logLevel, debug: this.debug, url: `http${settings.https ? 's' : ''}://${settings.host}:${settings.port}`, autoConnect: settings.autoConnect, cache: settings.cache }, evt => {
            if (evt === 'connect') {
                this._connected = true;
                this.emit('connect');
                if (!ready) {
                    // If no local cache is used, we can emit the ready event now.
                    if (!settings.cache) {
                        this.emit('ready');
                    }
                }
            }
            else if (evt === 'disconnect') {
                this._connected = false;
                this.emit('disconnect');
            }
        });
        this.auth = new AceBaseClientAuth(this, (event, arg) => {
            this.emit(event, arg);
        });
    }

    get connected() {
        return this._connected;
    }

    connect() {
        return this.api.connect();
    }

    disconnect() {
        this.api.disconnect();
    }

    callExtension(method, path, data) {
        return this.api.callExtension(method, path, data);
    }
}

class PromiseTimeoutError extends Error {}
function promiseTimeout(ms, promise, comment) {
    let id;
    if (!promise) { promise = new Promise(() => { /* never resolves */}); }
    let timeout = new Promise((resolve, reject) => {
      id = setTimeout(() => {
        reject(new PromiseTimeoutError(`Promise timed out after ${ms}ms: ${comment}`))
      }, ms)
    })
  
    return Promise.race([
      promise,
      timeout
    ])
    .then((result) => {
      clearTimeout(id)
  
      /**
       * ... we also need to pass the result back
       */
      return result
    })
}

module.exports = { AceBaseClient, AceBaseClientConnectionSettings };
},{"./api-web":3,"./auth":4,"./server-date":10,"acebase-core":23}],3:[function(require,module,exports){
(function (Buffer){(function (){
const { Api, Transport, ID, PathInfo, ColorStyle } = require('acebase-core');
const connectSocket = require('socket.io-client');

const { AceBaseRequestError, NOT_CONNECTED_ERROR_MESSAGE } = require('./request/error');
const _request = require('./request');
const _websocketRequest = (socket, event, data, accessToken) => {

    const requestId = ID.generate();
    const request = data;
    request.req_id = requestId;
    request.access_token = accessToken;

    socket.emit(event, request);

    let resolve, reject;
    let promise = new Promise((res, rej) => { resolve = res; reject = rej; });

    const timeout = setTimeout(() => { 
        socket.off("result", handle);
        const err = new AceBaseRequestError(request, null, 'timeout', `Server did not respond "${event}" request in a timely fashion`);
        reject(err);
    }, 10000);
    const handle = response => {
        if (response.req_id === requestId) {
            clearTimeout(timeout);
            socket.off("result", handle);
            if (response.success) {
                resolve(response);
            }
            else {
                // Access denied?
                const code = typeof response.reason === 'object' ? response.reason.code : response.reason;
                const message = typeof response.reason === 'object' ? response.reason.message : `request failed: ${code}`;
                const err = new AceBaseRequestError(request, response, code, message);
                reject(err);
            }
        }
    };
    socket.on("result", handle);

    return promise;
}

/**
 * Api to connect to a remote AceBase server over http(s)
 */
class WebApi extends Api {

    constructor(dbname = "default", settings, callback) {
        // operations are done through http calls,
        // events are triggered through a websocket
        super();

        this._id = ID.generate(); // For mutation contexts, not using websocket client id because that might cause security issues
        this.url = settings.url;
        this._autoConnect = typeof settings.autoConnect === 'boolean' ? settings.autoConnect : true;
        this.dbname = dbname;
        this._connected = false;
        this._connecting = false;
        if (settings.cache && settings.cache.enabled !== false) {
            this._cache = {
                db: settings.cache.db,
                priority: settings.cache.priority || 'server'
            };
        }
        this._realtimeQueries = {};
        this.debug = settings.debug;
        this._connectHooks = [];
        const eventCallback = (name, ...args) => {
            if (name === 'connect') {
                const callbacks = this._connectHooks;
                this._connectHooks = [];
                callbacks.forEach(callback => {
                    try { callback(); }
                    catch(err) {}
                });
            }
            callback(name, ...args);
        };

        let subscriptions = this._subscriptions = {};
        let accessToken;

        this.connect = () => {            
            if (this.socket !== null && typeof this.socket === 'object') {
                this.disconnect();
            }
            this._connecting = true;
            this.debug.log(`Connecting to AceBase server "${this.url}"`);
            if (!this.url.startsWith('https')) {
                this.debug.warn(`WARNING: The server you are connecting to does not use https, any data transferred may be intercepted!`.colorize(ColorStyle.red))
            }
    
            return new Promise((resolve, reject) => {
                const socket = this.socket = connectSocket(this.url);

                socket.on("reconnect_attempt", () => {
                    this._connecting = true;
                });

                socket.on("reconnect_error", (err) => {
                    this._connecting = false;
                });

                socket.on("reconnect_failed", (err) => {
                    // Reconnecting failed
                    const scheduleRetry = () => {
                        // Try connecting again in a minute
                        setTimeout(() => { this.connect().catch(err => { scheduleRetry(); }); }, 60 * 1000);
                    };
                    if (typeof window !== 'undefined') {
                        // Monitor browser online event
                        const listener = () => {
                            window.removeEventListener('online', listener);
                            scheduleRetry();
                        }
                        window.addEventListener('online', listener);
                    }
                    else {
                        scheduleRetry();
                    }
                });

                socket.on("connect_error", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection error: ${data}`);
                    reject(new Error(`connect_error: ${data}`));
                });

                socket.on("connect_timeout", (data) => {
                    // New connection failed to establish
                    this._connected = false;
                    this.debug.error(`Websocket connection timeout`);
                    reject(new Error(`connect_timeout`));
                });

                socket.on("connect", (data) => {
                    this._connecting = false;
                    this._connected = true;
                    // eventCallback && eventCallback('connect');

                    // Sign in
                    let signInPromise = Promise.resolve();
                    if (accessToken) {
                        // User must be signed in again (NOTE: this does not trigger "signin" event)
                        signInPromise = this.signInWithToken(accessToken);
                    }
                    signInPromise.then(() => {
                        // (re)subscribe to any active subscriptions
                        const subscribePromises = [];
                        Object.keys(subscriptions).forEach(path => {
                            const events = [];
                            subscriptions[path].forEach(subscr => {
                                if (subscr.event === 'mutated') { return; } // Skip mutated events for now
                                const serverAlreadyNotifying = events.includes(subscr.event);
                                if (!serverAlreadyNotifying) {
                                    events.push(subscr.event);
                                    const promise = _websocketRequest(this.socket, 'subscribe', { path, event: subscr.event }, accessToken);
                                    subscribePromises.push(promise.catch(err => { console.error(err); }));
                                }
                            });
                        });
                        // Now, subscribe to all top path mutated events
                        Object.keys(subscriptions)
                            .filter(path => subscriptions[path].some(sub => sub.event === 'mutated'))
                            .filter((path, i, arr) => !arr.some(otherPath => PathInfo.get(otherPath).isAncestorOf(path)))
                            .forEach(topEventPath => {
                                const promise = _websocketRequest(this.socket, 'subscribe', { path: topEventPath, event: 'mutated' }, accessToken);
                                subscribePromises.push(promise.catch(err => { console.error(err); }));
                            });
                        return Promise.all(subscribePromises);
                    })
                    .then(() => {
                        eventCallback && eventCallback('connect'); // Safe to let client know we're connected
                        resolve(); // Resolve the .connect() promise
                    });
                });

                socket.on("disconnect", (data) => {
                    // Existing connection was broken, by us or network
                    this._connected = false;
                    eventCallback && eventCallback('disconnect');
                });

                socket.on("data-event", data => {
                    const val = Transport.deserialize(data.val);
                    const context = data.context || {};
                    context.acebase_event_source = 'server';

                    /*
                        Using the new context, we can determine how we should handle this data event.
                        From client v0.9.29 on, the set and update API methods add an acebase_mutation object
                        to the context with the following info:

                        client_id: which client initiated the mutation (web api instance, also different per browser tab)
                        id: a unique id of the mutation
                        op: operation used: 'set' or 'update'
                        path: the path the operation was executed on
                        flow: the flow used: 
                            - 'server': app was connected, cache was not used.
                            - 'cache': app was offline while mutating, now syncs its change
                            - 'parallel': app was connected, cache was used and updated

                        To determine how to handle this data event, we have to know what events may have already
                        been fired.

                        [Mutation initiated:]
                            - Cache database used?
                                - No -> 'server' flow
                                - Yes -> Client was online/connected?
                                    - No -> 'cache' flow (saved to cache db, sycing once connected)
                                    - Yes -> 'parallel' flow
                        
                        During 'cache' and 'parallel' flow, any change events will have fired on the cache database
                        already. If we are receiving this data event on the same client, that means we don't have to
                        fire those events again. If we receive this event on a different client, we only have to fire 
                        events if they change cached data.

                        [Change event received:]
                            - Is mutation done by us?
                                - No -> Are we using cache?
                                    - No -> Fire events
                                    - Yes -> Update cache with events disabled*, fire events
                                - Yes -> Are we using cache?
                                    - No -> Fire events ourself
                                    - Yes -> Skip cache update, don't fire events (both done already)

                        * Different browser tabs use the same cache database. If we would let the cache database fire data change
                        events, they would only fire in 1 browser tab - the first one to update the cache, the others will see 
                        no changes because the data will have been updated already.

                        NOTE: While offline, the in-memory state of 2 separate browser tabs will go out of sync
                        because they rely on change notifications from the server - to tackle this problem, 
                        cross-tab communication must be implemented. (TODO: Let cache database change notifications
                        be sent to other tabs, and let them use the same client ID for server communications)
                    */
                    const causedByUs = context.acebase_mutation && context.acebase_mutation.client_id === this._id;
                    const cacheEnabled = !!(this._cache && this._cache.db);
                    const fireThisEvent = !causedByUs || !cacheEnabled;
                    const updateCache = !causedByUs && cacheEnabled;
                    const fireCacheEvents = false; // See above flow documentation

                    // console.log(`${this._cache ? `[${this._cache.db.api.storage.name}] ` : ''}Received data event "${data.event}" on path "${data.path}":`, val);
                    // console.log(`Received data event "${data.event}" on path "${data.path}":`, val);
                    const pathSubs = subscriptions[data.subscr_path];

                    if (!pathSubs && data.event !== 'mutated') { 
                        // NOTE: 'mutated' events fire on the mutated path itself. 'mutations' events fire on subscription path

                        // We are not subscribed on this path. Happens when an event fires while a server unsubscribe 
                        // has been requested, but not processed yet: the local subscription will be gone already.
                        // This can be confusing when using cache, an unsubscribe may have been requested after a cache
                        // event fired - the server event will follow but we're not listening anymore!
                        // this.debug.warn(`Received a data-event on a path we did not subscribe to: "${data.subscr_path}"`);
                        return;
                    }
                    if (updateCache) {
                        if (data.path.startsWith('__')) {
                            // Don't cache private data. This happens when the admin user is signed in 
                            // and has an event subscription on the root, or private path.
                            // NOTE: fireThisEvent === true, because it is impossible that this mutation was caused by us (well, it should be!)
                        }
                        else if (data.event === 'mutations') {
                            // Apply all mutations
                            const mutations = val.current;
                            mutations.forEach(m => {
                                const path = m.target.reduce((path, key) => PathInfo.getChildPath(path, key), PathInfo.getChildPath(`${this.dbname}/cache`, data.path));
                                this._cache.db.api.set(path, m.val, { suppress_events: !fireCacheEvents, context });
                            });
                        }
                        else if (data.event === 'notify_child_removed') {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), null, { suppress_events: !fireCacheEvents, context }); // Remove cached value
                        }
                        else if (!data.event.startsWith('notify_')) {
                            this._cache.db.api.set(PathInfo.getChildPath(`${this.dbname}/cache`, data.path), val.current, { suppress_events: !fireCacheEvents, context }); // Update cached value
                        }
                    }
                    if (!fireThisEvent) {
                        return;
                    }
                    // CHANGED - Only fire events if they were not triggered by the cache db already (and they only fired if the cached data really changed!)
                    // The last point in the comment above is why I changed this. If the local cache does not change, no events will be fired. This causes an
                    // issue in browser contexts when there are multiple open tabs: they share the same cache database and if 1 tab makes changes to the cache, 
                    // other clients won't know about it, and will not be notified of any changes.
                    // TODO: Implement cross-tab notifications in acebase/src/acebase-browser.js
                    const targetSubs = data.event === 'mutated'
                        ? Object.keys(subscriptions)
                            .filter(path => {
                                const pathInfo = PathInfo.get(path);
                                return path === data.path || pathInfo.equals(data.subscr_path) || pathInfo.isAncestorOf(data.path)
                            })
                            .reduce((subs, path) => {
                                const add = subscriptions[path].filter(sub => sub.event === 'mutated');
                                subs.push(...add);
                                return subs;
                            }, [])
                        : pathSubs.filter(sub => sub.event === data.event);
                    
                    targetSubs.forEach(subscr => { // !eventsFired && 
                        subscr.callback(null, data.path, val.current, val.previous, context);
                    });
                });

                socket.on("query-event", data => {
                    data = Transport.deserialize(data);
                    const query = this._realtimeQueries[data.query_id];
                    let keepMonitoring = true;
                    try {
                        keepMonitoring = query.options.eventHandler(data);
                    }
                    catch(err) {
                        keepMonitoring = false;
                    }
                    if (keepMonitoring === false) {
                        delete this._realtimeQueries[data.query_id];
                        socket.emit("query_unsubscribe", { query_id: data.query_id });
                    }
                });
            });
        };

        if (this._autoConnect) {
            this.connect();
        }

        this.disconnect = () => {
            if (this.socket !== null && typeof this.socket === 'object') {
                this.socket.disconnect();
                this.socket = null;
            }
            this._connected = false;
            this._connecting = false;
        }

        this.subscribe = (path, event, callback) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { pathSubs = subscriptions[path] = []; }
            let serverAlreadyNotifying = pathSubs.some(sub => sub.event === event)
                || (event === 'mutated' && Object.keys(subscriptions).some(otherPath => PathInfo.get(otherPath).isAncestorOf(path) && subscriptions[otherPath].some(sub => sub.event === event)));
            const subscr = { path, event, callback };
            pathSubs.push(subscr);

            if (this._cache) {
                // Events are also handled by cache db
                subscr.cacheCallback = (err, path, newValue, oldValue, context) => subscr.callback(err, path.slice(`${this.dbname}/cache/`.length), newValue, oldValue, context);
                this._cache.db.api.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), event, subscr.cacheCallback);
            }

            if (serverAlreadyNotifying || !this._connected) {
                return Promise.resolve();
            }
            if (event === 'mutated') {
                // Unsubscribe from 'mutated' events set on descendant paths of current path
                Object.keys(subscriptions)
                .filter(otherPath => 
                    PathInfo.get(otherPath).isDescendantOf(path) 
                    && subscriptions[otherPath].some(sub => sub.event === 'mutated')
                )
                .map(path => _websocketRequest(this.socket, "unsubscribe", { path, event: 'mutated' }, accessToken))
                .map(promise => promise.catch(err => console.error(err)))
            }
            return _websocketRequest(this.socket, "subscribe", { path, event }, accessToken);
        };

        this.unsubscribe = (path, event = undefined, callback = undefined) => {
            let pathSubs = subscriptions[path];
            if (!pathSubs) { return Promise.resolve(); }

            const unsubscribeFrom = (subscriptions) => {
                subscriptions.forEach(subscr => {
                    pathSubs.splice(pathSubs.indexOf(subscr), 1);
                    if (this._cache) {
                        // Events are also handled by cache db, also remove those
                        console.assert(typeof subscr.cacheCallback !== 'undefined', 'When subscription was added, cacheCallback must have been set');
                        this._cache.db.api.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, path), subscr.event, subscr.cacheCallback);
                    }
                });
            };

            const hadMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');
            if (!event) {
                // Unsubscribe from all events on path
                unsubscribeFrom(pathSubs);
            }
            else if (!callback) {
                // Unsubscribe from specific event on path
                const subscriptions = pathSubs.filter(subscr => subscr.event === event);
                unsubscribeFrom(subscriptions);
            }
            else {
                // Unsubscribe from a specific callback on path event
                const subscriptions = pathSubs.filter(subscr => subscr.event === event && subscr.callback === callback);
                unsubscribeFrom(subscriptions);
            }
            const hasMutatedEvents = pathSubs.some(sub => sub.event === 'mutated');

            let promise = Promise.resolve();
            if (pathSubs.length === 0) {
                // Unsubscribed from all events on path
                delete subscriptions[path];
                if (this._connected) {
                    promise = _websocketRequest(this.socket, 'unsubscribe', { path, access_token: accessToken }, accessToken);
                }
            }
            else if (this._connected && !pathSubs.some(subscr => subscr.event === event)) {
                // No callbacks left for specific event
                promise = _websocketRequest(this.socket, 'unsubscribe', { path: path, event, access_token: accessToken }, accessToken);
            }
            if (this._connected && hadMutatedEvents && !hasMutatedEvents) {
                // If any descendant paths have mutated events, resubscribe those
                const promises = Object.keys(subscriptions)
                    .filter(otherPath => PathInfo.get(otherPath).isDescendantOf(path) && subscriptions[otherPath].some(sub => sub.event === 'mutated'))
                    .map(path => _websocketRequest(this.socket, 'subscribe', { path: path, event: 'mutated' }, accessToken))
                    .map(promise => promise.catch(err => console.error(err)));
                promise = Promise.all([promise, ...promises]);
            }
            return promise;
        };

        this.transaction = (path, callback, options = { context: {} }) => {
            const id = ID.generate();
            options.context = options.context || {};
            options.context.acebase_mutation = {
                client_id: this._id,
                id,
                op: 'transaction',
                path,
                flow: 'server'
            };
            const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
            let cacheUpdateVal;
            const startedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_started", startedCallback);
                    const currentValue = Transport.deserialize(data.value);
                    const val = callback(currentValue);
                    const finish = (val) => {
                        const newValue = Transport.serialize(val);
                        this.socket.emit("transaction", { action: "finish", id: id, path, value: newValue, access_token: accessToken });
                        if (this._cache) {
                            cacheUpdateVal = val;
                        }
                    };
                    if (val instanceof Promise) {
                        val.then(finish);
                    }
                    else {
                        finish(val);
                    }
                }
            }
            let txResolve, txReject, txPromise = new Promise((resolve, reject) => {
                txResolve = resolve;
                txReject = reject;
            });
            const handleSuccess = () => {
                if (this._cache && typeof cacheUpdateVal !== 'undefined') {
                    // Update cache db value
                    this._cache.db.api.set(cachePath, cacheUpdateVal).then(() => {
                        txResolve(this);
                    })
                }
                else {
                    txResolve(this);
                }
            };
            const handleFailure = err => {
                txReject(err);
            }
            const completedCallback = (data) => {
                if (data.id === id) {
                    this.socket.off("tx_completed", completedCallback);
                    handleSuccess();
                }
            }
            const connectedCallback = () => {
                this.socket.on("tx_started", startedCallback);
                this.socket.on("tx_completed", completedCallback);
                // TODO: socket.on('disconnect', disconnectedCallback);
                this.socket.emit("transaction", { action: "start", id, path, access_token: accessToken, context: options.context });
            };
            if (this._connected) { 
                connectedCallback(); 
            }
            else { 
                // Websocket might not be connected. Try http call instead
                const data = JSON.stringify({ path });
                this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/start`, data, context: options.context })
                .then(tx => {
                    const id = tx.id;
                    const currentValue = Transport.deserialize(tx.value);
                    const value = callback(currentValue);
                    const data = JSON.stringify({ id, value: Transport.serialize(value) });
                    return this._request({ ignoreConnectionState: true, method: "POST", url: `${this.url}/transaction/${this.dbname}/finish`, data, context: options.context })
                })
                .catch(err => {
                    if (['ETIMEDOUT','ENOTFOUND','ECONNRESET','ECONNREFUSED','EPIPE'].includes(err.code)) {
                        err.message = NOT_CONNECTED_ERROR_MESSAGE;
                        // handleFailure(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }
                    handleFailure(err);
                });
            }
            return txPromise;
        };

        /**
         * @param {object} options 
         * @param {string} options.url
         * @param {'GET'|'PUT'|'POST'|'DELETE'} [options.method='GET']
         * @param {any} [options.data] Data to post when method is PUT or POST
         * @param {any} [options.context] Context to add to PUT or POST requests
         * @param {(chunk: string) => void} [options.dataReceivedCallback] A method that overrides the default data receiving handler. Override for streaming.
         * @param {boolean} [options.ignoreConnectionState=false] Whether to try the request even if there is no connection
         */
        this._request = (options) => {
            if (this._connected || options.ignoreConnectionState === true) { 
                return _request(options.method || 'GET', options.url, { data: options.data, accessToken, dataReceivedCallback: options.dataReceivedCallback, context: options.context })
                .catch(err => {
                    throw err;
                });
            }
            else {
                // We're not connected. We can wait for the connection to be established,
                // or fail the request now. Because we have now implemented caching, live requests
                // are only executed if they are not allowed to use cached responses. Wait for a
                // connection to be established (max 1s), then retry or fail

                if (!this._connecting) {
                    // We're currently not trying to connect. Fail now
                    return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                }

                let resolve, reject, 
                    promise = new Promise((rs, rj) => { resolve = rs; reject = rj; }),
                    state = 'wait',
                    timeout = setTimeout(() => {
                        if (state !== 'wait') { return; }
                        state = 'timeout';
                        this.socket.off('connect', callback); // Cancel connect wait
                        reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
                    }, 1000),
                    callback = () => {
                        if (state !== 'wait') { return; }
                        state = 'connected';
                        clearTimeout(timeout); // Cancel timeout
                        this._request(options)
                        .then(resolve)
                        .catch(reject);
                    };
                this.socket.on('connect', callback); // wait for connection
                return promise;
            }
        };

        this.signIn = (username, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'account', username, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                // Make sure the connected websocket server knows who we are as well. 
                // (this is currently not necessary because the server does not support clustering yet, 
                // but future versions might be connected to a different instance than the one that 
                // handled the signin http request just now)
                this.socket.emit("signin", accessToken);
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithEmail = (email, password) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'email', email, password, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.signInWithToken = (token) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signin`, data: { method: 'token', access_token: token, client_id: this.socket.id } })
            .then(result => {
                accessToken = result.access_token;
                this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.startAuthProviderSignIn = (providerName, callbackUrl) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/init?provider=${providerName}&callbackUrl=${callbackUrl}` })
            .then(result => {
                return { redirectUrl: result.redirectUrl };
            })
            .catch(err => {
                throw err;
            });
        }

        this.finishAuthProviderSignIn = (callbackResult) => {
            /** @type {{ provider: { name: string, access_token: string, refresh_token: string, expires_in: number }, access_token: string, user: AceBaseUser }} */
            let result;
            try {
                result = JSON.parse(Buffer.from(callbackResult, 'base64').toString('utf8'));
                // TODO: Implement server check
            }
            catch(err) {
                return Promise.reject(`Invalid result`);
            }
            accessToken = result.access_token;
            this.socket.emit("signin", accessToken); // Make sure the connected websocket server knows who we are as well. 
            return Promise.resolve({ user: result.user, accessToken, provider: result.provider });
        }

        this.refreshAuthProviderToken = (providerName, refreshToken) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ url: `${this.url}/oauth2/${this.dbname}/refresh?provider=${providerName}&refresh_token=${refreshToken}` })
            .then(result => {
                return result;
            })
            .catch(err => {
                throw err;
            });
        }

        this.signOut = (everywhere = false) => {
            if (!accessToken) { return Promise.resolve(); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signout`, data: { client_id: this.socket.id, everywhere } })
            .then(() => {
                this.socket.emit("signout", accessToken); // Make sure the connected websocket server knows we signed out as well. 
                accessToken = null;
            })
            .catch(err => {
                throw err;
            });
        };

        this.changePassword = (uid, currentPassword, newPassword) => {
            if (!accessToken) { return Promise.reject(new Error(`not_signed_in`)); }
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/change_password`, data: { uid, password: currentPassword, new_password: newPassword } })
            .then(result => {
                accessToken = result.access_token;
                return { accessToken };
            })
            .catch(err => {
                throw err;
            });
        };
    
        this.forgotPassword = (email) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/forgot_password`, data: { email } })
            .catch(err => {
                throw err;
            });
        };

        this.verifyEmailAddress = (verificationCode) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/verify_email`, data: { code: verificationCode } })
            .catch(err => {
                throw err;
            });
        };

        this.resetPassword = (resetCode, newPassword) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/reset_password`, data: { code: resetCode, password: newPassword } })
            .catch(err => {
                throw err;
            });
        };

        this.signUp = (details, signIn = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/signup`, data: details })
            .then(result => {
                if (signIn) {
                    accessToken = result.access_token;
                    this.socket.emit("signin", accessToken);
                }
                return { user: result.user, accessToken };
            })
            .catch(err => {
                throw err;
            });
        };

        this.updateUserDetails = (details) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/update`, data: details })
            .then(result => {
                return { user: result.user };
            })
            .catch(err => {
                throw err;
            });
        }

        this.deleteAccount = (uid, signOut = true) => {
            if (!this._connected) { return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE)); }
            return this._request({ method: "POST", url: `${this.url}/auth/${this.dbname}/delete`, data: { uid } })
            .then(result => {
                if (signOut) {
                    this.socket.emit("signout", accessToken);
                    accessToken = null;
                }
                return true;
            })
            .catch(err => {
                throw err;
            });
        }
    }

    stats(options = undefined) {
        return this._request({ url: `${this.url}/stats/${this.dbname}` });
    }

    sync(options = { fetchFreshData: true, eventCallback: null }) {
        // Sync cache
        if (!this._connected) {
            return Promise.reject(new Error(NOT_CONNECTED_ERROR_MESSAGE));
        }
        // if (!this._cache) {
        //     return Promise.reject(new Error(`no cache database is used`));
        // }
        if (this._cache && !this._cache.db.isReady) {
            return Promise.reject(new Error(`cache database is not ready yet`));
        }

        options.eventCallback && options.eventCallback('sync_start');
        const handleStatsUpdateError = err => {
            this.debug.error(`Failed to update cache db stats:`, err);
        }
        let totalPendingChanges = 0;
        const cacheApi = this._cache && this._cache.db.api;
        let syncPushPromise = Promise.resolve();
        if (this._cache) {
            syncPushPromise = cacheApi.get(`${this.dbname}/pending`)
            .then(pendingChanges => {
                cacheApi.set(`${this.dbname}/stats/last_sync_start`, new Date()).catch(handleStatsUpdateError);
                if (pendingChanges === null) {
                    return; // No updates
                }
                return Object.keys(pendingChanges)
                    .sort((a,b) => a < b ? 1 : -1) // sort z-a
                    .reduce((netChangeIds, id) => {
                        // Only get effective changes: 
                        // ignore operations preceeding a 'set' or 'remove' operation on the same and descendant paths
                        const change = pendingChanges[id];
                        // Check if the change is about a path that is 'set' or 'remove'd later (earlier in our sort order...)
                        const pathInfo = PathInfo.get(change.path);
                        const ignore = netChangeIds.some(id => {
                            const laterChange = pendingChanges[id];
                            return (laterChange.path === change.path || pathInfo.isDescendantOf(laterChange.path)) && ['set','remove'].includes(laterChange.type);
                        })
                        if (!ignore) {
                            netChangeIds.push(id);
                        }
                        else {
                            delete pendingChanges[id];
                            cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                        }
                        return netChangeIds;
                    }, [])
                    .sort() // sort a-z
                    .reduce((prevPromise, id) => {
                        // Now process the net changes
                        const change = pendingChanges[id];
                        this.debug.verbose(`SYNC processing change ${id}: `, change);
                        totalPendingChanges++;
                        const go = () => {
                            let promise;
                            if (change.type === 'update') { 
                                promise = this.update(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'set') { 
                                if (!change.data) { change.data = null; } // Before type 'remove' was implemented
                                promise = this.set(change.path, change.data, { allow_cache: false, context: change.context });
                            }
                            else if (change.type === 'remove') {
                                promise = this.set(change.path, null, { allow_cache: false, context: change.context });
                            }
                            else {
                                throw new Error(`unsupported change type "${change.type}"`);
                            }
                            return promise
                            .then(() => {
                                this.debug.verbose(`SYNC change ${id} processed ok`);
                                delete pendingChanges[id];
                                cacheApi.set(`${this.dbname}/pending/${id}`, null); // delete from cache db
                            })
                            .catch(err => {
                                // Updating remote db failed
                                this.debug.error(`SYNC change ${id} failed: ${err.message}`);
                                if (!this._connected) {
                                    // Connection was broken, should retry later
                                    throw err;
                                }
                                // We are connected, so the change is not allowed or otherwise denied.
                                if (typeof err === 'string') { 
                                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                                }
                                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                                // Delete the change and cached data
                                cacheApi.set(`${this.dbname}/pending/${id}`, null);
                                cacheApi.set(PathInfo.getChildPath(`${this.dbname}/cache`, change.data.path), null);
                                options.eventCallback && options.eventCallback('sync_change_error', { error: err, change });
                            });
                        };
                        return prevPromise.then(go); // Chain to previous promise
                    }, Promise.resolve());
            })
            .then(() => {
                this.debug.verbose(`SYNC push done`);
                cacheApi.set(`${this.dbname}/stats/last_sync_end`, new Date()).catch(handleStatsUpdateError);
                return totalPendingChanges;
            })
            .catch(err => {
                // 1 or more pending changes could not be processed.
                this.debug.error(`SYNC push error: ${err.message}`);
                if (typeof err === 'string') { 
                    err = { code: 'unknown', message: err, stack: 'n/a' }; 
                }
                cacheApi.set(`${this.dbname}/stats/last_sync_error`, { date: new Date(), code: err.code || 'unknown', message: err.message, stack: err.stack }).catch(handleStatsUpdateError);
                throw err;
            });            
        }
        let totalRemoteChanges = 0;
        return syncPushPromise
        .then(() => {
            // We've pushed our changes, now get fresh data for all paths with active subscriptions
            if (this._cache && options.fetchFreshData) {
                // Find out what data to load
                const loadPaths = Object.keys(this._subscriptions).reduce((paths, path) => {
                    const isWildcardPath = path.includes('*') || path.includes('$');
                    if (!paths.includes(path) && !isWildcardPath) {
                        const hasValueSubscribers = this._subscriptions[path].some(s => s.event !== 'mutated' && !s.event.startsWith('notify_'));
                        if (hasValueSubscribers) {
                            const pathInfo = PathInfo.get(path);
                            const ancestorIncluded = paths.some(otherPath => pathInfo.isDescendantOf(otherPath));
                            if (!ancestorIncluded) { paths.push(path); }
                        }
                    }
                    return paths;
                }, []);
                // Attach temp events to cache db so they will fire for data changes (just for counting)
                Object.keys(this._subscriptions).forEach(path => {
                    this._subscriptions[path].forEach(subscr => {
                        subscr.tempCallback = (err, path, newValue, oldValue, context) => {
                            totalRemoteChanges++;
                        }
                        cacheApi.subscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                    });
                });
                // Fetch new data
                const syncPullPromises = loadPaths.map(path => {
                    this.debug.verbose(`SYNC pull "${path}"`);
                    return this.get(path, { allow_cache: false })
                    .catch(err => {
                        this.debug.error(`SYNC pull error`, err);
                        options.eventCallback && options.eventCallback('sync_pull_error', err);
                    });
                });
                return Promise.all(syncPullPromises)
                .then(() => {
                    // Unsubscribe temp cache subscriptions
                    Object.keys(this._subscriptions).forEach(path => {
                        this._subscriptions[path].forEach(subscr => {
                            if (typeof subscr.tempCallback !== 'function') { 
                                // If a subscription was added while synchronizing, it won't have a tempCallback.
                                // This is no big deal, since our tempCallback is only to update sync statistics.
                                // Before acebase-client v0.9.29, this caused all subscriptions with current path
                                // and type to be removed.
                                return; 
                            }
                            cacheApi.unsubscribe(PathInfo.getChildPath(`${this.dbname}/cache`, subscr.path), subscr.event, subscr.tempCallback);
                            delete subscr.tempCallback;
                        });
                    });
                });
            }
            else if (!this._cache) {
                // Not using cache, so there is no real way of knowing if anything changed or removed.
                // We could trigger fake "value", "child_added" and "child_changed" events with fresh data, 
                // but... what's the use? It would result in broken data? 
                // --> Let's run "value" events only, and warn about all other events

                const syncPullPromises = [];
                Object.keys(this._subscriptions).forEach(path => {
                    const subs = this._subscriptions[path];
                    const valueSubscriptions = subs.filter(s => s.event === 'value');
                    if (valueSubscriptions.length === 0) {
                        return subs.forEach(sub => this.debug.warn(`Subscription "${sub.event}" on path "${path}" might have missed events while offline. Data should be reloaded!`));
                    }
                    const p = this.get(path, { allow_cache: false }).then(value => {
                        valueSubscriptions.forEach(subscr => subscr.callback(null, path, value));
                    });
                    syncPullPromises.push(p);
                });
                return Promise.all(syncPullPromises);
            }
        })
        .then(() => {
            this.debug.verbose(`SYNC done`);
            const info = { local: totalPendingChanges, remote: totalRemoteChanges };
            options.eventCallback && options.eventCallback('sync_done', info);
            return info;
        })
        .catch(err => {
            this.debug.error(`SYNC error`, err);
            options.eventCallback && options.eventCallback('sync_error', err);
            throw err;
        });
    }

    set(path, value, options = { allow_cache: true, context: {} }) {
        if (!options.context) { options.context = {}; }
        const useCache = this._cache && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'set',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(value));
            return this._request({ method: "PUT", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context })
        };
        if (!useCache) {
            return updateServer();
        }

        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackValue;
        const updateCache = () => {
            return this._cache.db.api.transaction(cachePath, (currentValue) => {
                rollbackValue = currentValue;
                return value;
            }, { context: options.context });
        };
        const rollbackCache = () => {
            return this._cache.db.api.set(cachePath, rollbackValue, { context: options.context });
        };
        const addPendingTransaction = () => {
            return this._cache.db.api.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'set', path, data: value, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to set cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to set server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    update(path, updates, options = { allow_cache: true, context: {} }) {
        const useCache = this._cache && options && options.allow_cache !== false;
        const useServer = this._connected;
        options.context.acebase_mutation = options.context.acebase_mutation || {
            client_id: this._id,
            id: ID.generate(),
            op: 'update',
            path,
            flow: useCache ? useServer ? 'parallel' : 'cache' : 'server'
        };
        const updateServer = () => {
            const data = JSON.stringify(Transport.serialize(updates));
            return this._request({ method: "POST", url: `${this.url}/data/${this.dbname}/${path}`, data, context: options.context });
        };
        if (!useCache) {
            return updateServer();
        }

        const cacheApi = this._cache.db.api;
        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
        let rollbackUpdates;
        const updateCache = () => {
            const properties = Object.keys(updates);
            return cacheApi.get(cachePath, { include: properties })
            .then(currentValues => {
                rollbackUpdates = currentValues;
                return cacheApi.update(cachePath, updates, { context: options.context });
            });
        };
        // const deleteCache = () => {
        //     return this._cache.db.api.set(`${this.dbname}/cache/${path}`, null);
        // };
        const rollbackCache = () => {
            return cacheApi.update(cachePath, rollbackUpdates, { context: options.context });
        };
        const addPendingTransaction = () => {
            return cacheApi.set(`${this.dbname}/pending/${options.context.acebase_mutation.id}`, { type: 'update', path, data: updates, context: options.context });
        };

        const cachePromise = updateCache()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        const serverPromise = !useServer ? null : updateServer()
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, error: err }));

        Promise.all([ cachePromise, serverPromise ])
        .then(([ cacheResult, serverResult ]) => {
            if (serverPromise) {
                // Server was being updated

                if (serverResult.success) {
                    // Server update success
                    if (!cacheResult.success) { 
                        // Cache update failed for some reason?
                        this.debug.error(`Failed to update cache for "${path}". Error: `, cacheResult.error);
                    }
                }
                else {
                    // Server update failed
                    if (cacheResult.success) {
                        // Cache update did succeed, rollback to previous value
                        this.debug.error(`Failed to update server value for "${path}", rolling back cache to previous value. Error:`, serverResult.error)
                        rollbackCache().catch(err => {
                            this.debug.error(`Failed to roll back cache? Error:`, err);
                        });
                    }
                }
            }
            else if (cacheResult.success) {
                // Server was not updated, cache update was successful.
                // Add pending sync action

                addPendingTransaction().catch(err => {
                    this.debug.error(`Failed to add pending sync action for "${path}", rolling back cache to previous value. Error:`, err);
                    rollbackCache().catch(err => {
                        this.debug.error(`Failed to roll back cache? Error:`, err);
                    });
                });
            }
        })

        // return server promise by default, so caller can handle potential authorization issues
        return this._cache.priority === 'cache' ? cachePromise : serverPromise;
    }

    get(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getServerValue = () => {
            // Get from server
            let url = `${this.url}/data/${this.dbname}/${path}`;
            let filtered = false;
            if (options) {
                let query = [];
                if (options.exclude instanceof Array) { 
                    query.push(`exclude=${options.exclude.join(',')}`); 
                }
                if (options.include instanceof Array) { 
                    query.push(`include=${options.include.join(',')}`); 
                }
                if (typeof options.child_objects === "boolean") {
                    query.push(`child_objects=${options.child_objects}`);
                }
                if (query.length > 0) {
                    filtered = true;
                    url += `?${query.join('&')}`;
                }
            }
            return this._request({ url })
            .then(data => {
                let val = Transport.deserialize(data);
                if (this._cache) {
                    // Update cache
                    // DISABLED: if filtered data was requested, it should be merged with current data (nested objects in particular)
                    // TODO: do update if no nested filters are used.
                    // if (filtered) {
                    //     this._cache.db.api.update(`${this.dbname}/cache/${path}`, val);
                    // }
                    // else if (!filtered) { 
                    if (!filtered) {
                        const cachePath = PathInfo.getChildPath(`${this.dbname}/cache`, path);
                        return this._cache.db.api.set(cachePath, val, { context: { acebase_operation: 'update_cache' } })
                        .catch(err => {
                            this.debug.error(`Error caching data for "/${path}"`, err)
                        })
                        .then(() => val);
                    }
                }
                return val;
            })
            .catch(err => {
                throw err;
            });
        };
        const getCacheValue = () => {
            return this._cache.db.api.get(PathInfo.getChildPath(`${this.dbname}/cache`, path), options);
        };

        if (!useCache) {
            return getServerValue();
        }
        else if (!this._connected || this._cache.priority === 'cache') {
            return getCacheValue();
        }
        else {
            // Get both, use cached value if available and server version takes too long
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotValue = (source, val) => {
                    // console.log(`Got ${source} value of "${path}":`, val);
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        // console.log(`Using server value for "${path}"`);
                        resolve(val);
                    }
                    else if (val === null) {
                        // Cached results are not available
                        if (!wait) {
                            const error = new Error(`Value for "${path}" not found in cache, and server value could not be loaded. See serverError for more details`);
                            error.serverError = errors.find(e => e.source === 'server').error;
                            return reject(error); 
                        }
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        // console.log(`Using cache value for "${path}"`);
                        resolve(val); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            console.log(`Using (delayed) cache value for "${path}"`);
                            done = true;
                            resolve(val);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server').error);
                    }
                };

                getServerValue()
                    .then(val => gotValue('server', val))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheValue()
                    .then(val => gotValue('cache', val))
                    .catch(err => gotError('cache', err));
            });
        }
    }
    
    exists(path, options = { allow_cache: true }) {
        const useCache = this._cache && options.allow_cache !== false;
        const getCacheExists = () => {
            return this._cache.db.api.exists(PathInfo.getChildPath(`${this.dbname}/cache`, path));
        };
        const getServerExists = () => {
            return this._request({ url: `${this.url}/exists/${this.dbname}/${path}` })
            .then(res => res.exists)
            .catch(err => {
                throw err;
            });            
        }
        if (!useCache) {
            return getServerExists();
        }
        else if (!this._connected) {
            return getCacheExists();
        }
        else {
            // Check both
            return new Promise((resolve, reject) => {
                let wait = true, done = false;
                const gotExists = (source, exists) => {
                    if (done) { return; }
                    if (source === 'server') {
                        done = true;
                        resolve(exists);
                    }
                    else if (!wait) { 
                        // Cached results, don't wait for server value
                        done = true; 
                        resolve(exists); 
                    }
                    else {
                        // Cached results, wait 1s before resolving with this value, server value might follow soon
                        setTimeout(() => {
                            if (done) { return; }
                            done = true;
                            resolve(exists);
                        }, 1000);
                    }
                };
                let errors = [];
                const gotError = (source, error) => {
                    errors.push({ source, error });
                    if (errors.length === 2) { 
                        // Both failed, reject with server error
                        reject(errors.find(e => e.source === 'server'));
                    }
                };

                getServerExists()
                    .then(exists => gotExists('server', exists))
                    .catch(err => (wait = false, gotError('server', err)));

                getCacheExists()
                    .then(exists => gotExists('cache', exists))
                    .catch(err => gotError('cache', err));
            });
        }
    }

    callExtension(method, path, data) {
        method = method.toUpperCase();
        const postData = ['PUT','POST'].includes(method) ? data : null;
        let url = `${this.url}/ext/${this.dbname}/${path}`;
        if (data && !['PUT','POST'].includes(method)) {
            // Add to query string
            if (typeof data === 'object') {
                // Convert object to querystring
                data = Object.keys(data)
                    .filter(key => typeof data[key] !== 'undefined')
                    .map(key => key + '=' + encodeURIComponent(JSON.stringify(data[key])))
                    .join('&')
            }
            else if (typeof data !== 'string' || !data.includes('=')) {
                throw new Error('data must be an object, or a string with query parameters, like "index=3&name=Something"');
            }
            url += `?` + data;
        }
        return this._request({ method, url, data: postData, ignoreConnectionState: true });
    }

    /**
     * 
     * @param {string} path 
     * @param {object} query 
     * @param {Array<{ key: string, op: string, compare: any}>} query.filters
     * @param {number} query.skip number of results to skip, useful for paging
     * @param {number} query.take max number of results to return
     * @param {Array<{ key: string, ascending: boolean }>} query.order
     * @param {object} [options]
     * @param {boolean} [options.snapshots=false] whether to return matching data, or paths to matching nodes only
     * @param {string[]} [options.include] when using snapshots, keys or relative paths to include in result data
     * @param {string[]} [options.exclude] when using snapshots, keys or relative paths to exclude from result data
     * @param {boolean} [options.child_objects] when using snapshots, whether to include child objects in result data
     * @param {(event: { name: string, [key]: any }) => void} [options.eventHandler]
     * @param {object} [options.monitor] NEW (BETA) monitor changes
     * @param {boolean} [options.monitor.add=false] monitor new matches (either because they were added, or changed and now match the query)
     * @param {boolean} [options.monitor.change=false] monitor changed children that still match this query
     * @param {boolean} [options.monitor.remove=false] monitor children that don't match this query anymore
     * @ param {(event:string, path: string, value?: any) => boolean} [options.monitor.callback] NEW (BETA) callback with subscription to enable monitoring of new matches
     * @returns {Promise<object[]|string[]>} returns a promise that resolves with matching data or paths
     */
    query(path, query, options = { snapshots: false, allow_cache: true, eventListener: undefined, monitor: { add: false, change: false, remove: false } }) {
        const allowCache = options && options.allow_cache === true;
        if (allowCache && !this._connected && this._cache) {
            // Not connected, query cache db
            return this._cache.db.api.query(PathInfo.getChildPath(`${this.dbname}/cache`, path), query, options);
        }
        const request = {
            query,
            options
        };
        if (options.monitor === true || (typeof options.monitor === 'object' && (options.monitor.add || options.monitor.change || options.monitor.remove))) {
            console.assert(typeof options.eventHandler === 'function', `no eventHandler specified to handle realtime changes`);
            request.query_id = ID.generate();
            request.client_id = this.socket.id;
            this._realtimeQueries[request.query_id] = { query, options };
        }
        const data = JSON.stringify(Transport.serialize(request));
        return this._request({ method: "POST", url: `${this.url}/query/${this.dbname}/${path}`, data })
        .then(data => {
            let results = Transport.deserialize(data);
            return results.list;
        })
        .catch(err => {
            throw err;
        });
    }

    createIndex(path, key, options) {
        const data = JSON.stringify({ action: "create", path, key, options });
        return this._request({ method: "POST", url: `${this.url}/index/${this.dbname}`, data })
        .catch(err => {
            throw err;
        });
    }

    getIndexes() {
        return this._request({ url: `${this.url}/index/${this.dbname}` })
        .catch(err => {
            throw err;
        });         
    }

    reflect(path, type, args) {
        let url = `${this.url}/reflect/${this.dbname}/${path}?type=${type}`;
        if (typeof args === 'object') {
            let query = Object.keys(args).map(key => {
                return `${key}=${args[key]}`;
            });
            if (query.length > 0) {
                url += `&${query.join('&')}`;
            }
        }
        return this._request({ url })
        .catch(err => {
            throw err;
        }); 
    }

    export(path, stream, options = { format: 'json' }) {
        options = options || {};
        options.format = 'json';
        let url = `${this.url}/export/${this.dbname}/${path}?format=${options.format}`;
        return this._request({ url, dataReceivedCallback: chunk => stream.write(chunk) })
        .catch(err => {
            throw err;
        });
    }

    getServerInfo() {
        return this._request({ url: `${this.url}/info/${this.dbname}` }).catch(err => {
            // Prior to acebase-server v0.9.37, info was at /info (no dbname attached)
            this.debug.warn(`Could not get server info, update your acebase server version`);
            return { version: 'unknown', time: Date.now() }
        });
    }
}

module.exports = { WebApi };
}).call(this)}).call(this,require("buffer").Buffer)
},{"./request":8,"./request/error":9,"acebase-core":23,"buffer":37,"socket.io-client":1}],4:[function(require,module,exports){
const { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult } = require('./user');
// const { AceBaseClient } = require('./acebase-client');

class AceBaseClientAuth {

    /**
     * 
     * @param {AceBaseClient} client 
     */
    constructor(client, eventCallback) {
        this.client = client;
        this.eventCallback = eventCallback;

        this.user = null;
        this.accessToken = null;
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} username Your database username
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signIn(username, password) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signIn(username, password));
        }
        return this.client.api.signIn(username, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * Sign into a user account using a username and password. Note that the server must have authentication enabled.
     * @param {string} email Your email address
     * @param {string} password Your password
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithEmail(email, password) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithEmail(email, password));
        }
        return this.client.api.signInWithEmail(email, password)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "email_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; //success: true, 
        });
    }

    /**
     * Sign into an account using a previously assigned access token
     * @param {string} accessToken a previously assigned access token
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signInWithToken(accessToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signInWithToken(accessToken));
        }
        return this.client.api.signInWithToken(accessToken)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "token_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken }; // success: true, 
        });
    }

    /**
     * If the server has been configured with Auth providers, use this to kick off the authentication flow.
     * This method returs a Promise that resolves with the url you have to redirect your user to authenticate 
     * with the requested provider. After the user has authenticated, they will be redirected back to your callbackUrl.
     * Your code in the callbackUrl will have to call finishOAuthProviderSignIn with the result querystring parameter
     * to finish signing in.
     * @param {string} providerName one of the configured providers (eg 'facebook', 'google', 'apple', 'spotify')
     * @param {string} callbackUrl url on your website/app that will receive the sign in result
     * @returns {Promise<string>} returns a Promise that resolves with the url you have to redirect your user to.
     */
    startAuthProviderSignIn(providerName, callbackUrl) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.startAuthProviderSignIn(providerName, callbackUrl));
        }
        return this.client.api.startAuthProviderSignIn(providerName, callbackUrl, this.user)
        .then(details => {
            return details.redirectUrl;
        });
    }

    /**
     * Use this method to finish OAuth flow from your callbackUrl.
     * @param {string} callbackResult result received in your.callback/url?result
     * @returns {Promise<{ user: AceBaseUser, accessToken: string, provider: { name: string, access_token: string, refresh_token: string, expires_in: number } }>}
     */
    finishAuthProviderSignIn(callbackResult) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.finishAuthProviderSignIn(callbackResult));
        }
        return this.client.api.finishAuthProviderSignIn(callbackResult)
        .then(details => {
            this.accessToken = details.accessToken;
            this.user = new AceBaseUser(details.user);
            this.eventCallback("signin", { source: "oauth_signin", user: this.user, accessToken: this.accessToken });
            return { user: this.user, accessToken: this.accessToken, provider: details.provider }; // success: true, 
        });
    }

    /**
     * Refreshes an expiring access token with the refresh token returned from finishAuthProviderSignIn
     * @param {string} providerName
     * @param {string} refreshToken 
     * @returns {Promise<{ provider: IAceBaseAuthProviderTokens }}
     */
    refreshAuthProviderToken(providerName, refreshToken) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.refreshAuthProviderToken(providerName, refreshToken));
        }
        return this.client.api.refreshAuthProviderToken(providerName, refreshToken)
        .then(details => {
            return { provider: details.provider };
        })
    }

    /**
     * Signs in with an external auth provider by redirecting the user to the provider's login page.
     * After signing in, the user will be redirected to the current browser url. Execute
     * getRedirectResult() when your page is loaded again to check if the user was authenticated.
     * @param {string} providerName 
     */
    signInWithRedirect(providerName) {
        if (typeof window === 'undefined') {
            throw new Error(`signInWithRedirect can only be used within a browser context`);
        }
        return this.startAuthProviderSignIn(providerName, window.location.href)
        .then(redirectUrl => {
            window.location.href = redirectUrl;
        });
    }

    /** 
     * Checks if the user authentication with an auth provider. 
     */
    getRedirectResult() {
        if (typeof window === 'undefined') {
            throw new Error(`getRedirectResult can only be used within a browser context`);
        }
        const match = window.location.search.match(/[?&]result=(.*?)(?:&|$)/);
        const callbackResult = match && decodeURIComponent(match[1]);
        if (!callbackResult) {
            return Promise.resolve(null);
        }
        return this.finishAuthProviderSignIn(callbackResult);
    }

    /**
     * Signs out of the current account
     * @param {boolean} [everywhere=false] whether to sign out all clients, or only this one
     * @returns {Promise<void>} returns a promise that resolves when user was signed out successfully
     */
    signOut(everywhere) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signOut(everywhere));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.signOut(everywhere)
        .then(() => {
            this.accessToken = null;
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signout', user });
        });
    }

    /**
     * Changes the password of the currrently signed into account
     * @param {string} oldPassword 
     * @param {string} newPassword 
     * @returns {Promise<{ accessToken: string }>} returns a promise that resolves with a new access token
     */
    changePassword(oldPassword, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.changePassword(oldPassword, newPassword));
        }
        else if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        return this.client.api.changePassword(this.user.uid, oldPassword, newPassword)
        .then(result => {
            this.accessToken = result.accessToken;
            this.eventCallback("signin", { source: "password_change", user: this.user, accessToken: this.accessToken });
            return { accessToken: result.accessToken }; //success: true, 
        });
    }

    /**
     * Requests a password reset for the account with specified email address
     * @param {string} email
     * @returns {Promise<void>} returns a promise that resolves once the request has been processed
     */
    forgotPassword(email) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.forgotPassword(email));
        }
        return this.client.api.forgotPassword(email);
    }

    /**
     * Requests a password to be changed using a previously acquired reset code, sent to the email address with forgotPassword
     * @param {string} resetCode
     * @param {string} newPassword
     * @returns {Promise<void>} returns a promise that resolves once the password has been changed. The user is now able to sign in with the new password
     */
    resetPassword(resetCode, newPassword) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.resetPassword(resetCode, newPassword));
        }
        return this.client.api.resetPassword(resetCode, newPassword);
    }

    /**
     * Verifies an e-mail address using the code sent to the email address upon signing up
     * @param {string} verificationCode
     * @returns {Promise<void>} returns a promise that resolves when verification was successful
     */
    verifyEmailAddress(verificationCode) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.verifyEmailAddress(verificationCode));
        }
        return this.client.api.verifyEmailAddress(verificationCode);
    }

    _updateUserDetails(details) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this._updateUserDetails(details));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (typeof details !== 'object') {
            return Promise.reject({ code: 'invalid_details', message: 'details must be an object' });
        }
        return this.client.api.updateUserDetails(details)
        .then(result => {
            Object.keys(result.user).forEach(key => {
                this.user[key] = result.user[key];
            });
            return { user: this.user }; // success: true
        });
    }

    /**
     * Changes the username of the currrently signed into account
     * @param {string} newUsername 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeUsername(newUsername) {
        return this._updateUserDetails({ username: newUsername });
    }

    /**
     * Changes the email address of the currrently signed in user
     * @param {string} newEmail 
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    changeEmail(newEmail) {
        return this._updateUserDetails({ email: newEmail });
    }

    /**
     * Updates settings of the currrently signed in user. Passed settings will be merged with the user's current settings
     * @param {{ [key:string]: string|number|boolean }} settings - the settings to update
     * @returns {Promise<{ user: AceBaseUser }>} returns a promise that resolves with the updated user details
     */
    updateUserSettings(settings) {
        return this._updateUserDetails({ settings });
    }

    /**
     * Creates a new user account with the given details. If successful, you will automatically be 
     * signed into the account. Note: the request will fail if the server has disabled this option
     * @param {object} details
     * @param {string} [details.username] 
     * @param {string} [details.email] 
     * @param {string} details.password
     * @param {string} details.displayName
     * @param {{ [key:string]: string|number|boolean }} [details.settings] optional settings 
     * @returns {Promise<{ user: AceBaseUser, accessToken: string }>} returns a promise that resolves with the signed in user and access token
     */
    signUp(details) {
        if (!details.username && !details.email) {
            return Promise.reject({ code: 'invalid_details', message: 'No username or email set' });
        }
        if (!details.password) {
            return Promise.reject({ code: 'invalid_details', message: 'No password given' });
        }
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.signUp(details));
        }
        const isAdmin = this.user && this.user.uid === 'admin';
        if (this.user && !isAdmin) {
            // Sign out of current account
            let user = this.user;
            this.user = null;
            this.eventCallback("signout", { source: 'signup', user } );
        }
        return this.client.api.signUp(details, !isAdmin)
        .then(details => {
            if (isAdmin) {
                return { user: details.user };
            }
            else {
                // Sign into new account
                this.accessToken = details.accessToken;
                this.user = new AceBaseUser(details.user);
                this.eventCallback("signin", { source: "signup", user: this.user, accessToken: this.accessToken });
                return { user: this.user, accessToken: this.accessToken }; //success: true, 
            }
        });
    }

    /**
     * Removes the currently signed in user account and signs out. Note: this will only
     * remove the database user account, not any data stored in the database by this user. It is
     * your own responsibility to remove that data.
     * @param {string} [uid] for admin user only: remove account with uid
     * @returns {Promise<void>}
     */
    deleteAccount(uid) {
        if (!this.client.isReady) {
            return this.client.ready().then(() => this.deleteAccount(uid));
        }
        if (!this.user) {
            return Promise.reject({ code: 'not_signed_in', message: 'Not signed in!' });
        }
        if (uid && this.user.uid !== 'admin') {
            return Promise.reject({ code: 'not_admin', message: 'Cannot remove other accounts than signed into account, unless you are admin' });
        }
        const deleteUid = uid || this.user.uid;
        if (deleteUid === 'admin') {
            return Promise.reject({ code: 'not_allowed', message: 'Cannot remove admin user' });
        }
        const signOut = this.user.uid !== 'admin';
        return this.client.api.deleteAccount(deleteUid, signOut)
        .then(result => {
            if (signOut) {
                // Sign out of the account
                this.accessToken = null;
                let user = this.user;
                this.user = null;
                this.eventCallback("signout", { source: 'delete_account', user });
            }
        });
    }
}

module.exports = { AceBaseClientAuth };
},{"./user":11}],5:[function(require,module,exports){
/*
    * This file is used to generate a browser bundle to use as an include
    (re)generate it with: npm run browserify

    * To use AceBaseClient in the browser:
    <script type="text/javascript" src="dist/browser.min.js"></script>
    <script type="text/javascript">
        const db = new AceBaseClient({ dbname: 'dbname', host: 'localhost', port: 3000, https: false });
        db.ready(() => {
            // Ready to do some work
        })
    </script>
*/

const acebaseclient = require('./index');

window.acebaseclient = acebaseclient;
window.AceBaseClient = acebaseclient.AceBaseClient; // Shortcut to AceBaseClient
module.exports = acebaseclient;
},{"./index":6}],6:[function(require,module,exports){
const { DataReference, DataSnapshot, EventSubscription, PathReference, TypeMappings, ID, proxyAccess } = require('acebase-core');
const { AceBaseClient } = require('./acebase-client');
const { ServerDate } = require('./server-date');

module.exports = {
    AceBaseClient,
    DataReference, 
    DataSnapshot, 
    EventSubscription, 
    PathReference, 
    TypeMappings,
    ID,
    proxyAccess,
    ServerDate
};
},{"./acebase-client":2,"./server-date":10,"acebase-core":23}],7:[function(require,module,exports){
module.exports = performance;
},{}],8:[function(require,module,exports){
const { AceBaseRequestError } = require('./error');

async function request(method, url, options = { accessToken: null, data: null, dataReceivedCallback: null, context: null }) {
    let postData = options.data;
    if (typeof postData === 'undefined' || postData === null) {
        postData = '';
    }
    else if (typeof postData === 'object') {
        postData = JSON.stringify(postData);
    }
    const headers = {
        'AceBase-Context': JSON.stringify(options.context || null),
        'Content-Type': 'application/json',
    };
    const init = {
        method,
        headers
    };
    if (postData.length > 0) {
        init.body = postData;
    }
    if (options.accessToken) {
        headers['Authorization'] = `Bearer ${options.accessToken}`;
    }
    const request = { url, method, headers };
    const res = await fetch(request.url, init).catch(err => {
        console.error(err);
        throw err;
    });
    let data = '';
    if (typeof options.dataReceivedCallback === 'function') {
        // Stream response
        const reader = res.body.getReader();
        await new Promise((resolve, reject) => {
            (function readNext() {
                reader.read()
                .then(result => {
                    options.dataReceivedCallback(result.value);
                    if (result.done) { return resolve(); }
                    readNext();
                })
                .catch(err => {
                    reader.cancel('error');
                    reject(err);
                });
            })();
        })
    }
    else {
        data = await res.text();
    }

    if (res.status === 200) {
        if (data[0] === '{') {
            let val = JSON.parse(data);
            return val;
        }
        else {
            return data;
        }
    }
    else {
        request.body = postData;
        const response = {
            statusCode: res.status,
            statusMessage: res.statusText,
            headers: res.headers,
            body: data
        };
        let code = res.status, message = res.statusText;
        if (data[0] == '{') {
            let err = JSON.parse(data);
            if (err.code) { code = err.code; }
            if (err.message) { message = err.message; }
        }
        throw(new AceBaseRequestError(request, response, code, message));
    }

}

module.exports = request;
},{"./error":9}],9:[function(require,module,exports){
class AceBaseRequestError extends Error {
    constructor(request, response, code, message) {
        super(message);
        this.code = code;
        this.request = request;
        this.response = response;
    }
}
const NOT_CONNECTED_ERROR_MESSAGE = 'remote database is not connected'; //'AceBaseClient is not connected';

module.exports = { AceBaseRequestError, NOT_CONNECTED_ERROR_MESSAGE };
},{}],10:[function(require,module,exports){
const { ID } = require('acebase-core');
const performance = require('./performance');

let time = {
    serverBias: 0,
    localBias: 0,
    lastTime: Date.now(),
    lastPerf: performance.now(),
    get bias() { return this.serverBias + this.localBias; }
};

function biasChanged() {
    console.log(`Bias changed. server bias = ${time.serverBias}ms, local bias = ${time.localBias}ms`);
    ID.timeBias = time.bias; // undocumented
}

// Keep monitoring local time for changes, adjust local bias accordingly
const interval = 10000; // 10s
function checkLocalTime() {
    // console.log('Checking time...');
    const now = Date.now(), // eg 20:00:00
        perf = performance.now(),
        msPassed = perf - time.lastPerf, // now - time.lastTime, //
        expected = time.lastTime + Math.round(msPassed), // 19:00:00
        diff = expected - now; // -1h

    if (Math.abs(diff) > 1) {
        console.log(`Local time changed. diff = ${diff}ms`);
        time.localBias += diff;
        biasChanged();
    }
    time.lastTime = now;
    time.lastPerf = perf;
    setTimeout(checkLocalTime, interval);
}
setTimeout(checkLocalTime, interval);

function setServerBias(bias) {
    if (typeof bias === 'number') {
        time.serverBias = bias;
        time.localBias = 0;
        biasChanged();
    }
}

class ServerDate extends Date {
    constructor() {
        const biasedTime = Date.now() + time.bias;
        super(biasedTime);
    }
}

module.exports = { ServerDate, setServerBias };
},{"./performance":7,"acebase-core":23}],11:[function(require,module,exports){

class AceBaseUser {
    /**
     * 
     * @param {{ uid: string, username?: string, email?: string, displayName: string, created: Date, last_signin: Date, last_signin_ip: string settings: { [key:string]: string|number|boolean } }} user
     */
    constructor(user) {
        // /** @type {string} unique id */
        // this.uid = user.uid;
        // /** @type {string?} username */
        // this.username = user.username;
        // /** @type {string?} email address */
        // this.email = user.email;
        // /** @type {string?} display or screen name */
        // this.displayName = user.displayName;
        // this.settings = user.settings;
        // this.created = user.created;
        // this.last_signin = user.last_signin;
        // this.last_signin_ip = user.last_signin_ip;
        // this.prev_signin = user.prev_signin;
        // this.prev_signin_ip = user.prev_signin_ip;
        Object.assign(this, user);
    }
}

class AceBaseSignInResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {AceBaseUser} [result.user]
     * @param {string} [result.accessToken]
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (result.success) {
            this.user = result.user;
            this.accessToken = result.accessToken;
        }
        else {
            this.reason = result.reason;
        }
    }
}

class AceBaseAuthResult {
    /**
     * 
     * @param {object} result 
     * @param {boolean} result.success
     * @param {{ code: string, message: string }} [result.reason]
     */
    constructor(result) {
        this.success = result.success;
        if (!result.success) {
            this.reason = result.reason;
        }
    }
}

module.exports = { AceBaseUser, AceBaseSignInResult, AceBaseAuthResult };
},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AceBaseBase = exports.AceBaseBaseSettings = void 0;
/**
   ________________________________________________________________________________
   
      ___          ______
     / _ \         | ___ \
    / /_\ \ ___ ___| |_/ / __ _ ___  ___
    |  _  |/ __/ _ \ ___ \/ _` / __|/ _ \
    | | | | (_|  __/ |_/ / (_| \__ \  __/
    \_| |_/\___\___\____/ \__,_|___/\___|
                        realtime database
                                     
   Copyright 2018 by Ewout Stortenbeker (me@appy.one)
   Published under MIT license

   See docs at https://www.npmjs.com/package/acebase
   ________________________________________________________________________________
  
*/
const simple_event_emitter_1 = require("./simple-event-emitter");
const data_reference_1 = require("./data-reference");
const type_mappings_1 = require("./type-mappings");
const optional_observable_1 = require("./optional-observable");
const debug_1 = require("./debug");
const simple_colors_1 = require("./simple-colors");
class AceBaseBaseSettings {
    constructor(options) {
        if (typeof options !== 'object') {
            options = {};
        }
        this.logLevel = options.logLevel || 'log';
        this.logColors = typeof options.logColors === 'boolean' ? options.logColors : true;
        this.info = typeof options.info === 'string' ? options.info : undefined;
    }
}
exports.AceBaseBaseSettings = AceBaseBaseSettings;
class AceBaseBase extends simple_event_emitter_1.SimpleEventEmitter {
    /**
     * @param dbname Name of the database to open or create
     */
    constructor(dbname, options) {
        super();
        options = new AceBaseBaseSettings(options || {});
        this.name = dbname;
        // Setup console logging
        this.debug = new debug_1.DebugLogger(options.logLevel, `[${dbname}]`);
        // Enable/disable logging with colors
        simple_colors_1.SetColorsEnabled(options.logColors);
        // ASCI art: http://patorjk.com/software/taag/#p=display&f=Doom&t=AceBase
        const logoStyle = [simple_colors_1.ColorStyle.magenta, simple_colors_1.ColorStyle.bold];
        const logo = '     ___          ______                ' + '\n' +
            '    / _ \\         | ___ \\               ' + '\n' +
            '   / /_\\ \\ ___ ___| |_/ / __ _ ___  ___ ' + '\n' +
            '   |  _  |/ __/ _ \\ ___ \\/ _` / __|/ _ \\' + '\n' +
            '   | | | | (_|  __/ |_/ / (_| \\__ \\  __/' + '\n' +
            '   \\_| |_/\\___\\___\\____/ \\__,_|___/\\___|';
        const info = (options.info ? ''.padStart(40 - options.info.length, ' ') + options.info + '\n' : '');
        this.debug.write(logo.colorize(logoStyle));
        info && this.debug.write(info.colorize(simple_colors_1.ColorStyle.magenta));
        // Setup type mapping functionality
        this.types = new type_mappings_1.TypeMappings(this);
        this.once("ready", () => {
            // console.log(`database "${dbname}" (${this.constructor.name}) is ready to use`);
            this._ready = true;
        });
    }
    /**
     *
     * @param {()=>void} [callback] (optional) callback function that is called when ready. You can also use the returned promise
     * @returns {Promise<void>} returns a promise that resolves when ready
     */
    ready(callback = undefined) {
        if (this._ready === true) {
            // ready event was emitted before
            callback && callback();
            return Promise.resolve();
        }
        else {
            // Wait for ready event
            let resolve;
            const promise = new Promise(res => resolve = res);
            this.on("ready", () => {
                resolve();
                callback && callback();
            });
            return promise;
        }
    }
    get isReady() {
        return this._ready === true;
    }
    /**
     * Allow specific observable implementation to be used
     * @param {Observable} Observable Implementation to use
     */
    setObservable(Observable) {
        optional_observable_1.setObservable(Observable);
    }
    /**
     * Creates a reference to a node
     * @param {string} path
     * @returns {DataReference} reference to the requested node
     */
    ref(path) {
        return new data_reference_1.DataReference(this, path);
    }
    /**
     * Get a reference to the root database node
     * @returns {DataReference} reference to root node
     */
    get root() {
        return this.ref("");
    }
    /**
     * Creates a query on the requested node
     * @param {string} path
     * @returns {DataReferenceQuery} query for the requested node
     */
    query(path) {
        const ref = new data_reference_1.DataReference(this, path);
        return new data_reference_1.DataReferenceQuery(ref);
    }
    get indexes() {
        return {
            /**
             * Gets all indexes
             */
            get: () => {
                return this.api.getIndexes();
            },
            /**
             * Creates an index on "key" for all child nodes at "path". If the index already exists, nothing happens.
             * Example: creating an index on all "name" keys of child objects of path "system/users",
             * will index "system/users/user1/name", "system/users/user2/name" etc.
             * You can also use wildcard paths to enable indexing and quering of fragmented data.
             * Example: path "users/*\/posts", key "title": will index all "title" keys in all posts of all users.
             * @param {string} path path to the container node
             * @param {string} key name of the key to index every container child node
             * @param {object} [options] any additional options
             * @param {string} [options.type] special index type, such as 'fulltext', or 'geo'
             * @param {string[]} [options.include] keys to include in the index. Speeds up sorting on these columns when the index is used (and dramatically increases query speed when .take(n) is used in addition)
             * @param {object} [options.config] additional index-specific configuration settings
             */
            create: (path, key, options) => {
                return this.api.createIndex(path, key, options);
            }
        };
    }
}
exports.AceBaseBase = AceBaseBase;

},{"./data-reference":19,"./debug":21,"./optional-observable":24,"./simple-colors":29,"./simple-event-emitter":30,"./type-mappings":33}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
class NotImplementedError extends Error {
    constructor(name) { super(`${name} is not implemented`); }
}
class Api {
    constructor(dbname, settings, readyCallback) { }
    /**
     * Provides statistics
     * @param options
     */
    stats(options) { throw new NotImplementedError('stats'); }
    /**
     * @param path
     * @param event event to subscribe to ("value", "child_added" etc)
     * @param callback callback function
     */
    subscribe(path, event, callback) { throw new NotImplementedError('subscribe'); }
    unsubscribe(path, event, callback) { throw new NotImplementedError('unsubscribe'); }
    update(path, updates, options) { throw new NotImplementedError('update'); }
    set(path, value, options) { throw new NotImplementedError('set'); }
    get(path, options) { throw new NotImplementedError('get'); }
    transaction(path, callback, options) { throw new NotImplementedError('transaction'); }
    exists(path) { throw new NotImplementedError('exists'); }
    query(path, query, options) { throw new NotImplementedError('query'); }
    reflect(path, type, args) { throw new NotImplementedError('reflect'); }
    export(path, stream, options) { throw new NotImplementedError('export'); }
    /** Creates an index on key for all child nodes at path */
    createIndex(path, key, options) { throw new NotImplementedError('createIndex'); }
    getIndexes() { throw new NotImplementedError('getIndexes'); }
}
exports.Api = Api;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ascii85 = void 0;
const c = function (input, length, result) {
    var i, j, n, b = [0, 0, 0, 0, 0];
    for (i = 0; i < length; i += 4) {
        n = ((input[i] * 256 + input[i + 1]) * 256 + input[i + 2]) * 256 + input[i + 3];
        if (!n) {
            result.push("z");
        }
        else {
            for (j = 0; j < 5; b[j++] = n % 85 + 33, n = Math.floor(n / 85))
                ;
        }
        result.push(String.fromCharCode(b[4], b[3], b[2], b[1], b[0]));
    }
};
function encode(arr) {
    // summary: encodes input data in ascii85 string
    // input: ArrayLike
    var input = arr;
    var result = [], remainder = input.length % 4, length = input.length - remainder;
    c(input, length, result);
    if (remainder) {
        var t = new Uint8Array(4);
        t.set(input.slice(length), 0);
        c(t, 4, result);
        var x = result.pop();
        if (x == "z") {
            x = "!!!!!";
        }
        result.push(x.substr(0, remainder + 1));
    }
    var ret = result.join(""); // String
    ret = '<~' + ret + '~>';
    return ret;
}
exports.ascii85 = {
    encode: function (arr) {
        if (arr instanceof ArrayBuffer) {
            arr = new Uint8Array(arr, 0, arr.byteLength);
        }
        return encode(arr);
    },
    decode: function (input) {
        // summary: decodes the input string back to an ArrayBuffer
        // input: String: the input string to decode
        if (!input.startsWith('<~') || !input.endsWith('~>')) {
            throw new Error('Invalid input string');
        }
        input = input.substr(2, input.length - 4);
        var n = input.length, r = [], b = [0, 0, 0, 0, 0], i, j, t, x, y, d;
        for (i = 0; i < n; ++i) {
            if (input.charAt(i) == "z") {
                r.push(0, 0, 0, 0);
                continue;
            }
            for (j = 0; j < 5; ++j) {
                b[j] = input.charCodeAt(i + j) - 33;
            }
            d = n - i;
            if (d < 5) {
                for (j = d; j < 4; b[++j] = 0)
                    ;
                b[d] = 85;
            }
            t = (((b[0] * 85 + b[1]) * 85 + b[2]) * 85 + b[3]) * 85 + b[4];
            x = t & 255;
            t >>>= 8;
            y = t & 255;
            t >>>= 8;
            r.push(t >>> 8, t & 255, y, x);
            for (j = d; j < 5; ++j, r.pop())
                ;
            i += 4;
        }
        const data = new Uint8Array(r);
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
};

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pad_1 = require("../pad");
const env = typeof window === 'object' ? window : self, globalCount = Object.keys(env).length, mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0, clientId = pad_1.default((mimeTypesLength +
    navigator.userAgent.length).toString(36) +
    globalCount.toString(36), 4);
function fingerprint() {
    return clientId;
}
exports.default = fingerprint;

},{"../pad":17}],16:[function(require,module,exports){
"use strict";
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 *
 * time biasing added by Ewout Stortenbeker for AceBase
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fingerprint_1 = require("./fingerprint");
const pad_1 = require("./pad");
var c = 0, blockSize = 4, base = 36, discreteValues = Math.pow(base, blockSize);
function randomBlock() {
    return pad_1.default((Math.random() *
        discreteValues << 0)
        .toString(base), blockSize);
}
function safeCounter() {
    c = c < discreteValues ? c : 0;
    c++; // this is not subliminal
    return c - 1;
}
function cuid(timebias = 0) {
    // Starting with a lowercase letter makes
    // it HTML element ID friendly.
    var letter = 'c', // hard-coded allows for sequential access
    // timestamp
    // warning: this exposes the exact date and time
    // that the uid was created.
    // NOTES Ewout: 
    // - added timebias
    // - at '2059/05/25 19:38:27.456', timestamp will become 1 character larger!
    timestamp = (new Date().getTime() + timebias).toString(base), 
    // Prevent same-machine collisions.
    counter = pad_1.default(safeCounter().toString(base), blockSize), 
    // A few chars to generate distinct ids for different
    // clients (so different computers are far less
    // likely to generate the same id)
    print = fingerprint_1.default(), 
    // Grab some more chars from Math.random()
    random = randomBlock() + randomBlock();
    return letter + timestamp + counter + print + random;
}
exports.default = cuid;
// Not using slugs, removed code

},{"./fingerprint":15,"./pad":17}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pad(num, size) {
    var s = '000000000' + num;
    return s.substr(s.length - size);
}
exports.default = pad;
;

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyAccess = exports.LiveDataProxy = void 0;
const utils_1 = require("./utils");
const data_snapshot_1 = require("./data-snapshot");
const path_reference_1 = require("./path-reference");
const id_1 = require("./id");
const optional_observable_1 = require("./optional-observable");
const process_1 = require("./process");
class RelativeNodeTarget extends Array {
    static areEqual(t1, t2) {
        return t1.length === t2.length && t1.every((key, i) => t2[i] === key);
    }
    static isAncestor(ancestor, other) {
        return ancestor.length < other.length && ancestor.every((key, i) => other[i] === key);
    }
    static isDescendant(descendant, other) {
        return descendant.length > other.length && other.every((key, i) => descendant[i] === key);
    }
}
const isProxy = Symbol('isProxy');
class LiveDataProxy {
    /**
     * Creates a live data proxy for the given reference. The data of the reference's path will be loaded, and kept in-sync
     * with live data by listening for 'mutated' events. Any changes made to the value by the client will be synced back
     * to the database.
     * @param ref DataReference to create proxy for.
     * @param defaultValue Default value to use for the proxy if the database path does not exist yet. This value will also
     * be written to the database.
     */
    static async create(ref, defaultValue) {
        let cache, loaded = false;
        const proxyId = id_1.ID.generate(); //ref.push().key;
        let onMutationCallback;
        let onErrorCallback = err => {
            console.error(err.message, err.details);
        };
        const clientSubscriptions = []; //, snapshot?: any
        const applyChange = (keys, newValue) => {
            // Make changes to cache
            if (keys.length === 0) {
                cache = newValue;
                return true;
            }
            let target = cache;
            keys = keys.slice();
            while (keys.length > 1) {
                const key = keys.shift();
                if (!(key in target)) {
                    // Have we missed an event, or are local pending mutations creating this conflict?
                    return false; // Do not proceed
                }
                target = target[key];
            }
            const prop = keys.shift();
            if (newValue === null) {
                // Remove it
                target instanceof Array ? target.splice(prop, 1) : delete target[prop];
            }
            else {
                // Set or update it
                target[prop] = newValue;
            }
            return true;
        };
        // Subscribe to mutations events on the target path
        const subscription = ref.on('mutations').subscribe(async (snap) => {
            var _a;
            if (!loaded) {
                return;
            }
            const context = snap.context();
            const isRemote = ((_a = context.acebase_proxy) === null || _a === void 0 ? void 0 : _a.id) !== proxyId;
            if (!isRemote) {
                return; // Update was done by us, no need to update cache
            }
            const mutations = snap.val(false);
            const proceed = mutations.every(mutation => {
                if (!applyChange(mutation.target, mutation.val)) {
                    return false;
                }
                if (onMutationCallback) {
                    const changeRef = mutation.target.reduce((ref, key) => ref.child(key), ref);
                    const changeSnap = new data_snapshot_1.DataSnapshot(changeRef, mutation.val, false, mutation.prev);
                    onMutationCallback(changeSnap, isRemote);
                }
                return true;
            });
            if (!proceed) {
                console.error(`Cached value appears outdated, will be reloaded`);
                await reload();
            }
        });
        // Setup updating functionality: enqueue all updates, process them at next tick in the order they were issued 
        let processPromise = Promise.resolve();
        const mutationQueue = [];
        const transactions = [];
        const pushLocalMutations = async () => {
            // Sync all local mutations that are not in a transaction
            const mutations = [];
            for (let i = 0, m = mutationQueue[0]; i < mutationQueue.length; i++, m = mutationQueue[i]) {
                if (!transactions.find(t => RelativeNodeTarget.areEqual(t.target, m.target) || RelativeNodeTarget.isAncestor(t.target, m.target))) {
                    mutationQueue.splice(i, 1);
                    i--;
                    mutations.push(m);
                }
            }
            if (mutations.length === 0) {
                return;
            }
            // Run local onMutation & onChange callbacks in the next tick
            process_1.default.nextTick(() => {
                // Run onMutation callback for each changed node
                if (onMutationCallback) {
                    mutations.forEach(mutation => {
                        mutation.value = utils_1.cloneObject(getTargetValue(cache, mutation.target));
                        const mutationRef = mutation.target.reduce((ref, key) => ref.child(key), ref);
                        const mutationSnap = new data_snapshot_1.DataSnapshot(mutationRef, mutation.value, false, mutation.previous);
                        onMutationCallback(mutationSnap, false);
                    });
                }
                // Execute local onChange subscribers
                clientSubscriptions
                    .filter(s => mutations.some(m => RelativeNodeTarget.areEqual(s.target, m.target) || RelativeNodeTarget.isAncestor(s.target, m.target)))
                    .forEach(s => {
                    const currentValue = utils_1.cloneObject(getTargetValue(cache, s.target));
                    let previousValue = utils_1.cloneObject(currentValue);
                    // replay mutations on previousValue in reverse order
                    mutations
                        .filter(m => RelativeNodeTarget.areEqual(s.target, m.target) || RelativeNodeTarget.isAncestor(s.target, m.target))
                        .reverse()
                        .forEach(m => {
                        const relTarget = m.target.slice(s.target.length);
                        if (relTarget.length === 0) {
                            previousValue = m.previous;
                        }
                        else {
                            setTargetValue(previousValue, relTarget, m.previous);
                        }
                    });
                    // Run subscriber callback
                    let keepSubscription = true;
                    try {
                        keepSubscription = false !== s.callback(Object.freeze(currentValue), Object.freeze(previousValue), false, { acebase_proxy: { id: proxyId, source: 'local_update' } });
                    }
                    catch (err) {
                        onErrorCallback({ source: 'local_update', message: `Error running subscription callback`, details: err });
                    }
                    if (!keepSubscription) {
                        s.subscription.stop();
                        clientSubscriptions.splice(clientSubscriptions.findIndex(cs => cs.subscription === s.subscription), 1);
                    }
                });
            });
            // Update database async
            const batchId = id_1.ID.generate();
            processPromise = mutations
                .reduce((mutations, m, i, arr) => {
                // Only keep top path mutations
                if (!arr.some(other => RelativeNodeTarget.isAncestor(other.target, m.target))) {
                    mutations.push(m);
                }
                return mutations;
            }, [])
                .reduce((updates, m, i, arr) => {
                // Prepare db updates
                const target = m.target;
                if (target.length === 0) {
                    // Overwrite this proxy's root value
                    updates.push({ ref, value: cache, type: 'set' });
                }
                else {
                    const parentTarget = target.slice(0, -1);
                    const key = target.slice(-1)[0];
                    const parentRef = parentTarget.reduce((ref, key) => ref.child(key), ref);
                    const parentUpdate = updates.find(update => update.ref.path === parentRef.path);
                    const cacheValue = getTargetValue(cache, target);
                    if (parentUpdate) {
                        parentUpdate.value[key] = cacheValue;
                    }
                    else {
                        updates.push({ ref: parentRef, value: { [key]: cacheValue }, type: 'update' });
                    }
                }
                return updates;
            }, [])
                .reduce(async (promise, update, i, updates) => {
                // Execute db update
                // i === 0 && console.log(`Proxy: processing ${updates.length} db updates to paths:`, updates.map(update => update.ref.path));
                await promise;
                return update.ref
                    .context({ acebase_proxy: { id: proxyId, source: 'update', update_id: id_1.ID.generate(), batch_id: batchId, batch_updates: updates.length } })[update.type](update.value) // .set or .update
                    .catch(err => {
                    onErrorCallback({ source: 'update', message: `Error processing update of "/${ref.path}"`, details: err });
                });
            }, processPromise);
            await processPromise;
        };
        let syncInProgress = false;
        const syncPromises = [];
        const syncCompleted = () => {
            let resolve;
            const promise = new Promise(rs => resolve = rs);
            syncPromises.push({ resolve });
            return promise;
        };
        let processQueueTimeout = null;
        const scheduleSync = () => {
            if (!processQueueTimeout) {
                processQueueTimeout = setTimeout(async () => {
                    syncInProgress = true;
                    processQueueTimeout = null;
                    await pushLocalMutations();
                    syncInProgress = false;
                    syncPromises.splice(0).forEach(p => p.resolve());
                }, 0);
            }
        };
        const flagOverwritten = (target) => {
            if (!mutationQueue.find(m => RelativeNodeTarget.areEqual(m.target, target))) {
                mutationQueue.push({ target, previous: utils_1.cloneObject(getTargetValue(cache, target)), value: null });
            }
            // schedule database updates
            scheduleSync();
        };
        const addOnChangeHandler = (target, callback) => {
            const targetRef = getTargetRef(ref, target);
            const subscription = targetRef.on('mutations').subscribe(async (snap) => {
                var _a;
                const context = snap.context();
                const isRemote = ((_a = context.acebase_proxy) === null || _a === void 0 ? void 0 : _a.id) !== proxyId;
                if (!isRemote) {
                    // Any local changes already triggered subscription callbacks
                    return;
                }
                // Construct previous value from snapshot
                const currentValue = getTargetValue(cache, target);
                let newValue = utils_1.cloneObject(currentValue);
                let previousValue = utils_1.cloneObject(newValue);
                // const mutationPath = snap.ref.path;
                const mutations = snap.val(false);
                mutations.every(mutation => {
                    if (mutation.target.length === 0) {
                        newValue = mutation.val;
                        previousValue = mutation.prev;
                        return true;
                    }
                    for (let i = 0, val = newValue, prev = previousValue, arr = mutation.target; i < arr.length; i++) { // arr = PathInfo.getPathKeys(mutationPath).slice(PathInfo.getPathKeys(targetRef.path).length)
                        const last = i + 1 === arr.length, key = arr[i];
                        if (last) {
                            val[key] = mutation.val;
                            if (val[key] === null) {
                                delete val[key];
                            }
                            prev[key] = mutation.prev;
                            if (prev[key] === null) {
                                delete prev[key];
                            }
                        }
                        else {
                            val = val[key] = key in val ? val[key] : {};
                            prev = prev[key] = key in prev ? prev[key] : {};
                        }
                    }
                    return true;
                });
                process_1.default.nextTick(() => {
                    // Run callback with read-only (frozen) values in next tick
                    const keepSubscription = callback(Object.freeze(newValue), Object.freeze(previousValue), isRemote, context);
                    if (keepSubscription === false) {
                        stop();
                    }
                });
            });
            const stop = () => {
                subscription.stop();
                clientSubscriptions.splice(clientSubscriptions.findIndex(cs => cs.subscription === subscription), 1);
            };
            clientSubscriptions.push({ target, subscription, callback });
            return { stop };
        };
        const handleFlag = (flag, target, args) => {
            if (flag === 'write') {
                return flagOverwritten(target);
            }
            else if (flag === 'onChange') {
                return addOnChangeHandler(target, args.callback);
            }
            else if (flag === 'subscribe' || flag === 'observe') {
                const subscribe = subscriber => {
                    const currentValue = getTargetValue(cache, target);
                    subscriber.next(currentValue);
                    const subscription = addOnChangeHandler(target, (value, previous, isRemote, context) => {
                        subscriber.next(value);
                    });
                    return function unsubscribe() {
                        subscription.stop();
                    };
                };
                if (flag === 'subscribe') {
                    return subscribe;
                }
                // Try to load Observable
                const Observable = optional_observable_1.getObservable();
                return new Observable(subscribe);
            }
            else if (flag === 'transaction') {
                const hasConflictingTransaction = transactions.some(t => RelativeNodeTarget.areEqual(target, t.target) || RelativeNodeTarget.isAncestor(target, t.target) || RelativeNodeTarget.isDescendant(target, t.target));
                if (hasConflictingTransaction) {
                    // TODO: Wait for this transaction to finish, then try again
                    return Promise.reject(new Error('Cannot start transaction because it conflicts with another transaction'));
                }
                return new Promise(async (resolve) => {
                    // If there are pending mutations on target (or deeper), wait until they have been synchronized
                    const hasPendingMutations = mutationQueue.some(m => RelativeNodeTarget.areEqual(target, m.target) || RelativeNodeTarget.isAncestor(target, m.target));
                    if (hasPendingMutations) {
                        if (!syncInProgress) {
                            scheduleSync();
                        }
                        await syncCompleted();
                    }
                    const tx = { target, status: 'started', transaction: null };
                    transactions.push(tx);
                    tx.transaction = {
                        get status() { return tx.status; },
                        get completed() { return tx.status !== 'started'; },
                        async commit() {
                            if (this.completed) {
                                throw new Error(`Transaction has completed already (status '${tx.status}')`);
                            }
                            tx.status = 'finished';
                            transactions.splice(transactions.indexOf(tx), 1);
                            if (syncInProgress) {
                                // Currently syncing without our mutations
                                await syncCompleted();
                            }
                            scheduleSync();
                            await syncCompleted();
                        },
                        rollback() {
                            // Remove mutations from queue
                            if (this.completed) {
                                throw new Error(`Transaction has completed already (status '${tx.status}')`);
                            }
                            tx.status = 'canceled';
                            const mutations = [];
                            for (let i = 0; i < mutationQueue.length; i++) {
                                const m = mutationQueue[i];
                                if (RelativeNodeTarget.areEqual(tx.target, m.target) || RelativeNodeTarget.isAncestor(tx.target, m.target)) {
                                    mutationQueue.splice(i, 1);
                                    i--;
                                    mutations.push(m);
                                }
                            }
                            // Replay mutations in reverse order
                            mutations.reverse()
                                .forEach(m => {
                                if (m.target.length === 0) {
                                    cache = m.previous;
                                }
                                else {
                                    setTargetValue(cache, m.target, m.previous);
                                }
                            });
                            // Remove transaction                      
                            transactions.splice(transactions.indexOf(tx), 1);
                        }
                    };
                    resolve(tx.transaction);
                });
            }
            // else if (flag === 'runEvents') {
            //     clientSubscriptions.filter(cs => cs.target.length <= target.length && cs.target.every((key, index) => key === target[index]))
            //     .forEach(cs => {
            //         const value = Object.freeze(cloneObject(getTargetValue(cache, cs.target)));
            //         try {
            //             cs.callback(value, value, false, { simulated: true });
            //         }
            //         catch(err) {
            //             console.error(`Error running change callback: `, err);
            //         }
            //     });
            // }
        };
        const snap = await ref.get({ allow_cache: true });
        loaded = true;
        cache = snap.val();
        if (cache === null && typeof defaultValue !== 'undefined') {
            cache = defaultValue;
            await ref.set(cache);
        }
        let proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
        const assertProxyAvailable = () => {
            if (proxy === null) {
                throw new Error(`Proxy was destroyed`);
            }
        };
        const reload = async () => {
            // Manually reloads current value when cache is out of sync, which should only 
            // be able to happen if an AceBaseClient is used without cache database, 
            // and the connection to the server was lost for a while. In all other cases, 
            // there should be no need to call this method.
            assertProxyAvailable();
            const newSnap = await ref.get();
            cache = newSnap.val();
            proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
            newSnap.ref.context({ acebase_proxy: { id: proxyId, source: 'reload' } });
            onMutationCallback && onMutationCallback(newSnap, true);
            // TODO: run all other subscriptions
        };
        return {
            async destroy() {
                await processPromise;
                subscription.stop();
                clientSubscriptions.forEach(cs => cs.subscription.stop());
                cache = null; // Remove cache
                proxy = null;
            },
            stop() {
                this.destroy();
            },
            get value() {
                assertProxyAvailable();
                return proxy;
            },
            get hasValue() {
                assertProxyAvailable();
                return cache !== null;
            },
            set value(val) {
                // Overwrite the value of the proxied path itself!
                assertProxyAvailable();
                if (typeof val === 'object' && val[isProxy]) {
                    // Assigning one proxied value to another
                    val = val.getTarget(false);
                }
                flagOverwritten([]);
                cache = val;
                proxy = createProxy({ root: { ref, cache }, target: [], id: proxyId, flag: handleFlag });
            },
            reload,
            onMutation(callback) {
                // Fires callback each time anything changes
                assertProxyAvailable();
                onMutationCallback = (...args) => {
                    try {
                        callback(...args);
                    }
                    catch (err) {
                        onErrorCallback({ source: 'mutation_callback', message: 'Error in dataproxy onMutation callback', details: err });
                    }
                };
            },
            onError(callback) {
                // Fires callback each time anything goes wrong
                assertProxyAvailable();
                onErrorCallback = (...args) => {
                    try {
                        callback(...args);
                    }
                    catch (err) {
                        console.error(`Error in dataproxy onError callback: ${err.message}`);
                    }
                };
            }
        };
    }
}
exports.LiveDataProxy = LiveDataProxy;
function getTargetValue(obj, target) {
    let val = obj;
    for (let key of target) {
        val = typeof val === 'object' && val !== null && key in val ? val[key] : null;
    }
    return val;
}
function setTargetValue(obj, target, value) {
    if (target.length === 0) {
        throw new Error(`Cannot update root target, caller must do that itself!`);
    }
    const targetObject = target.slice(0, -1).reduce((obj, key) => obj[key], obj);
    const prop = target.slice(-1)[0];
    if (value === null || typeof value === 'undefined') {
        // Remove it
        targetObject instanceof Array ? targetObject.splice(prop, 1) : delete targetObject[prop];
    }
    else {
        // Set or update it
        targetObject[prop] = value;
    }
}
function getTargetRef(ref, target) {
    let targetRef = ref;
    for (let key of target) {
        targetRef = targetRef.child(key);
    }
    return targetRef;
}
function createProxy(context) {
    const targetRef = getTargetRef(context.root.ref, context.target);
    const childProxies = [];
    const handler = {
        get(target, prop, receiver) {
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                if (prop.toString() === isProxy.toString()) {
                    return true;
                }
                return Reflect.get(target, prop, receiver);
            }
            if (typeof target === null || typeof target !== 'object') {
                throw new Error(`Cannot read property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object (anymore)`);
            }
            if (target instanceof Array && typeof prop === 'string' && /^[0-9]+$/.test(prop)) {
                // Proxy type definitions say prop can be a number, but this is never the case.
                prop = parseInt(prop);
            }
            const value = target[prop];
            if (value === null) {
                // Removed property. Should never happen, but if it does:
                delete target[prop];
                return; // undefined
            }
            // Check if we have a child proxy for this property already.
            // If so, and the properties' typeof value did not change, return that
            const childProxy = childProxies.find(proxy => proxy.prop === prop);
            if (childProxy) {
                if (childProxy.typeof === typeof value) {
                    return childProxy.value;
                }
                childProxies.splice(childProxies.indexOf(childProxy), 1);
            }
            // If the property contains a simple value, return it. 
            if (['string', 'number', 'boolean'].includes(typeof value)
                || value instanceof Date
                || value instanceof path_reference_1.PathReference
                || value instanceof ArrayBuffer
                || (typeof value === 'object' && 'buffer' in value) // Typed Arrays
            ) {
                return value;
            }
            const isArray = target instanceof Array;
            // TODO: Implement updateWithContext and setWithContext
            if (typeof value === 'undefined') {
                if (prop === 'push') {
                    // Push item to an object collection
                    return function push(item) {
                        const childRef = targetRef.push();
                        context.flag('write', context.target.concat(childRef.key)); //, { previous: null }
                        target[childRef.key] = item;
                        return childRef.key;
                    };
                }
                if (prop === 'getTarget') {
                    // Get unproxied readonly (but still live) version of data.
                    return function getTarget(warn = true) {
                        warn && console.warn(`Use getTarget with caution - any changes will not be synchronized!`);
                        return target;
                    };
                }
                if (prop === 'getRef') {
                    // Gets the DataReference to this data target
                    return function getRef() {
                        const ref = getTargetRef(context.root.ref, context.target);
                        // ref.context(<IProxyContext>{ acebase_proxy: { id: context.id, source: 'getRef' } });
                        return ref;
                    };
                }
                if (prop === 'forEach') {
                    return function forEach(callback) {
                        const keys = Object.keys(target);
                        for (let i = 0; i < keys.length && callback(target[keys[i]], keys[i], i) !== false; i++) { }
                    };
                }
                if (prop === 'toArray') {
                    return function toArray(sortFn) {
                        const arr = Object.keys(target).map(key => target[key]);
                        if (sortFn) {
                            arr.sort(sortFn);
                        }
                        return arr;
                    };
                }
                if (prop === 'onChanged') {
                    // Starts monitoring the value
                    return function onChanged(callback) {
                        return context.flag('onChange', context.target, { callback });
                    };
                }
                if (prop === 'subscribe') {
                    // Gets subscriber function to use with Observables, or custom handling
                    return function subscribe() {
                        return context.flag('subscribe', context.target);
                    };
                }
                if (prop === 'getObservable') {
                    // Creates an observable for monitoring the value
                    return function getObservable() {
                        return context.flag('observe', context.target);
                    };
                }
                if (prop === 'startTransaction') {
                    return function startTransaction() {
                        return context.flag('transaction', context.target);
                    };
                }
                if (prop === 'remove' && !isArray) {
                    // Removes target from object collection
                    return function remove() {
                        if (context.target.length === 0) {
                            throw new Error(`Can't remove proxy root value`);
                        }
                        const parent = getTargetValue(context.root.cache, context.target.slice(0, -1));
                        const key = context.target.slice(-1)[0];
                        context.flag('write', context.target);
                        delete parent[key];
                    };
                }
                return; // undefined
            }
            else if (typeof value === 'function') {
                if (isArray) {
                    // Handle array functions
                    const writeArray = (action) => {
                        context.flag('write', context.target);
                        return action();
                    };
                    if (prop === 'push') {
                        return function push(...items) {
                            items.forEach(item => removeVoidProperties(item));
                            return writeArray(() => target.push(...items)); // push the items to the cache array
                        };
                    }
                    if (prop === 'pop') {
                        return function pop() {
                            return writeArray(() => target.pop());
                        };
                    }
                    if (prop === 'splice') {
                        return function splice(start, deleteCount, ...items) {
                            items.forEach(item => removeVoidProperties(item));
                            return writeArray(() => target.splice(start, deleteCount, ...items));
                        };
                    }
                    if (prop === 'shift') {
                        return function shift() {
                            return writeArray(() => target.shift());
                        };
                    }
                    if (prop === 'unshift') {
                        return function unshift(...items) {
                            items.forEach(item => removeVoidProperties(item));
                            return writeArray(() => target.unshift(...items));
                        };
                    }
                    if (prop === 'sort') {
                        return function sort(compareFn) {
                            return writeArray(() => target.sort(compareFn));
                        };
                    }
                    if (prop === 'reverse') {
                        return function reverse() {
                            return writeArray(() => target.reverse());
                        };
                    }
                }
                // Other function, should not alter its value
                return function fn(...args) {
                    return target[prop](...args);
                };
            }
            // Proxify any other value
            const proxy = createProxy({ root: context.root, target: context.target.concat(prop), id: context.id, flag: context.flag });
            childProxies.push({ typeof: typeof value, prop, value: proxy });
            return proxy;
        },
        set(target, prop, value, receiver) {
            // Eg: chats.chat1.title = 'New chat title';
            // target === chats.chat1, prop === 'title'
            target = getTargetValue(context.root.cache, context.target);
            if (typeof prop === 'symbol') {
                return Reflect.set(target, prop, value, receiver);
            }
            if (target === null || typeof target !== 'object') {
                throw new Error(`Cannot set property "${prop}" of ${target}. Value of path "/${targetRef.path}" is not an object`);
            }
            if (target instanceof Array && typeof prop === 'string') {
                if (!/^[0-9]+$/.test(prop)) {
                    throw new Error(`Cannot set property "${prop}" on array value of path "/${targetRef.path}"`);
                }
                prop = parseInt(prop);
            }
            if (typeof value === 'object' && value[isProxy]) {
                // Assigning one proxied value to another
                value = value.getTarget(false);
            }
            else if (typeof value === 'object' && Object.isFrozen(value)) {
                // Create a copy to unfreeze it
                value = utils_1.cloneObject(value);
            }
            if (typeof value !== 'object' && target[prop] === value) {
                // not changing the actual value, ignore
                return true;
            }
            if (context.target.some(key => typeof key === 'number')) {
                // Updating an object property inside an array. Flag the first array in target to be written.
                // Eg: when chat.members === [{ name: 'Ewout', id: 'someid' }]
                // --> chat.members[0].name = 'Ewout' --> Rewrite members array instead of chat/members[0]/name
                context.flag('write', context.target.slice(0, context.target.findIndex(key => typeof key === 'number')));
            }
            else if (target instanceof Array) {
                // Flag the entire array to be overwritten
                context.flag('write', context.target);
            }
            else {
                // Flag child property
                context.flag('write', context.target.concat(prop));
            }
            // Set cached value:
            if (value === null) {
                delete target[prop];
            }
            else {
                removeVoidProperties(value);
                target[prop] = value;
            }
            return true;
        },
        deleteProperty(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            if (target === null) {
                throw new Error(`Cannot delete property ${prop.toString()} of null`);
            }
            if (typeof prop === 'symbol') {
                return Reflect.deleteProperty(target, prop);
            }
            if (!(prop in target)) {
                return true; // Nothing to delete
            }
            context.flag('write', context.target.concat(prop));
            delete target[prop];
            return true;
        },
        ownKeys(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.ownKeys(target);
        },
        has(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.has(target, prop);
        },
        getOwnPropertyDescriptor(target, prop) {
            target = getTargetValue(context.root.cache, context.target);
            const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
            if (descriptor) {
                descriptor.configurable = true; // prevent "TypeError: 'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property '...' which is either non-existant or configurable in the proxy target"
            }
            return descriptor;
        },
        getPrototypeOf(target) {
            target = getTargetValue(context.root.cache, context.target);
            return Reflect.getPrototypeOf(target);
        }
    };
    return new Proxy({}, handler);
}
function removeVoidProperties(obj) {
    if (typeof obj !== 'object') {
        return;
    }
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val === null || typeof val === 'undefined') {
            delete obj[key];
        }
        else if (typeof val === 'object') {
            removeVoidProperties(val);
        }
    });
}
function proxyAccess(proxiedValue) {
    if (typeof proxiedValue !== 'object' || !proxiedValue[isProxy]) {
        throw new Error(`Given value is not proxied. Make sure you are referencing the value through the live data proxy.`);
    }
    return proxiedValue;
}
exports.proxyAccess = proxyAccess;

},{"./data-snapshot":20,"./id":22,"./optional-observable":24,"./path-reference":26,"./process":27,"./utils":34}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataReferencesArray = exports.DataSnapshotsArray = exports.DataReferenceQuery = exports.DataReference = exports.QueryDataRetrievalOptions = exports.DataRetrievalOptions = void 0;
const data_snapshot_1 = require("./data-snapshot");
const subscription_1 = require("./subscription");
const id_1 = require("./id");
const path_info_1 = require("./path-info");
const data_proxy_1 = require("./data-proxy");
const optional_observable_1 = require("./optional-observable");
class DataRetrievalOptions {
    /**
     * Options for data retrieval, allows selective loading of object properties
     */
    constructor(options) {
        if (!options) {
            options = {};
        }
        if (typeof options.include !== 'undefined' && !(options.include instanceof Array)) {
            throw new TypeError(`options.include must be an array`);
        }
        if (typeof options.exclude !== 'undefined' && !(options.exclude instanceof Array)) {
            throw new TypeError(`options.exclude must be an array`);
        }
        if (typeof options.child_objects !== 'undefined' && typeof options.child_objects !== 'boolean') {
            throw new TypeError(`options.child_objects must be a boolean`);
        }
        if (typeof options.allow_cache !== 'undefined' && typeof options.allow_cache !== 'boolean') {
            throw new TypeError(`options.allow_cache must be a boolean`);
        }
        this.include = options.include || undefined;
        this.exclude = options.exclude || undefined;
        this.child_objects = typeof options.child_objects === "boolean" ? options.child_objects : undefined;
        this.allow_cache = typeof options.allow_cache === "boolean" ? options.allow_cache : undefined;
    }
}
exports.DataRetrievalOptions = DataRetrievalOptions;
class QueryDataRetrievalOptions extends DataRetrievalOptions {
    /**
     * @param options Options for data retrieval, allows selective loading of object properties
     */
    constructor(options) {
        super(options);
        if (typeof options.snapshots !== 'undefined' && typeof options.snapshots !== 'boolean') {
            throw new TypeError(`options.snapshots must be an array`);
        }
        this.snapshots = typeof options.snapshots === 'boolean' ? options.snapshots : undefined;
    }
}
exports.QueryDataRetrievalOptions = QueryDataRetrievalOptions;
const _private = Symbol("private");
class DataReference {
    /**
     * Creates a reference to a node
     */
    constructor(db, path, vars) {
        if (!path) {
            path = "";
        }
        path = path.replace(/^\/|\/$/g, ""); // Trim slashes
        const pathInfo = path_info_1.PathInfo.get(path);
        const key = pathInfo.key; //path.length === 0 ? "" : path.substr(path.lastIndexOf("/") + 1); //path.match(/(?:^|\/)([a-z0-9_$]+)$/i)[1];
        // const query = { 
        //     filters: [],
        //     skip: 0,
        //     take: 0,
        //     order: []
        // };
        const callbacks = [];
        this[_private] = {
            get path() { return path; },
            get key() { return key; },
            get callbacks() { return callbacks; },
            vars: vars || {},
            context: {},
            pushed: false
        };
        this.db = db; //Object.defineProperty(this, "db", ...)
    }
    context(context = undefined, merge = false) {
        const currentContext = this[_private].context;
        if (typeof context === 'object') {
            const newContext = context ? merge ? currentContext || {} : context : {};
            if (context) {
                // Merge new with current context
                Object.keys(context).forEach(key => {
                    newContext[key] = context[key];
                });
            }
            this[_private].context = newContext;
            return this;
        }
        else if (typeof context === 'undefined') {
            console.warn(`Use snap.context() instead of snap.ref.context() to get updating context in event callbacks`);
            return currentContext;
        }
        else {
            throw new Error('Invalid context argument');
        }
    }
    /**
    * The path this instance was created with
    */
    get path() { return this[_private].path; }
    /**
     * The key or index of this node
     */
    get key() { return this[_private].key; }
    /**
     * Returns a new reference to this node's parent
     */
    get parent() {
        let currentPath = path_info_1.PathInfo.fillVariables2(this.path, this.vars);
        const info = path_info_1.PathInfo.get(currentPath);
        if (info.parentPath === null) {
            return null;
        }
        return new DataReference(this.db, info.parentPath).context(this[_private].context);
    }
    /**
     * Contains values of the variables/wildcards used in a subscription path if this reference was
     * created by an event ("value", "child_added" etc)
     */
    get vars() {
        return this[_private].vars;
    }
    /**
     * Returns a new reference to a child node
     * @param childPath Child key, index or path
     * @returns reference to the child
     */
    child(childPath) {
        childPath = typeof childPath === 'number' ? childPath : childPath.replace(/^\/|\/$/g, "");
        const currentPath = path_info_1.PathInfo.fillVariables2(this.path, this.vars);
        const targetPath = path_info_1.PathInfo.getChildPath(currentPath, childPath);
        return new DataReference(this.db, targetPath).context(this[_private].context); //  `${this.path}/${childPath}`
    }
    /**
     * Sets or overwrites the stored value
     * @param value value to store in database
     * @param onComplete completion callback to use instead of returning promise
     * @returns promise that resolves with this reference when completed (when not using onComplete callback)
     */
    set(value, onComplete) {
        const handleError = err => {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error(`Error in onComplete callback:`, err);
                }
            }
            else {
                // throw again
                return Promise.reject(err);
            }
        };
        if (this.isWildcardPath) {
            return handleError(new Error(`Cannot set the value of wildcard path "/${this.path}"`));
        }
        if (this.parent === null) {
            return handleError(new Error(`Cannot set the root object. Use update, or set individual child properties`));
        }
        if (typeof value === 'undefined') {
            return handleError(new TypeError(`Cannot store undefined value in "/${this.path}"`));
        }
        if (!this.db.isReady) {
            return this.db.ready().then(() => this.set(value, onComplete));
        }
        value = this.db.types.serialize(this.path, value);
        return this.db.api.set(this.path, value, { context: this[_private].context })
            .then(res => {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error(`Error in onComplete callback:`, err);
                }
            }
        })
            .catch(err => {
            return handleError(err);
        })
            .then(() => {
            return this;
        });
    }
    /**
     * Updates properties of the referenced node
     * @param updates object containing the properties to update
     * @param onComplete completion callback to use instead of returning promise
     * @return returns promise that resolves with this reference once completed (when not using onComplete callback)
     */
    update(updates, onComplete) {
        const handleError = err => {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(err, this);
                }
                catch (err) {
                    console.error(`Error in onComplete callback:`, err);
                }
            }
            else {
                // throw again
                return Promise.reject(err);
            }
        };
        if (this.isWildcardPath) {
            return handleError(new Error(`Cannot update the value of wildcard path "/${this.path}"`));
        }
        let promise;
        if (typeof updates !== "object" || updates instanceof Array || updates instanceof ArrayBuffer || updates instanceof Date) {
            promise = this.set(updates);
        }
        else if (Object.keys(updates).length === 0) {
            console.warn(`update called on path "/${this.path}", but there is nothing to update`);
            promise = Promise.resolve();
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.update(updates, onComplete));
        }
        else {
            updates = this.db.types.serialize(this.path, updates);
            promise = this.db.api.update(this.path, updates, { context: this[_private].context });
        }
        return promise.then(() => {
            if (typeof onComplete === 'function') {
                try {
                    onComplete(null, this);
                }
                catch (err) {
                    console.error(`Error in onComplete callback:`, err);
                }
            }
        })
            .catch(err => {
            return handleError(err);
        })
            .then(() => {
            return this;
        });
    }
    /**
     * Sets the value a node using a transaction: it runs your callback function with the current value, uses its return value as the new value to store.
     * The transaction is canceled if your callback returns undefined, or throws an error. If your callback returns null, the target node will be removed.
     * @param callback - callback function that performs the transaction on the node's current value. It must return the new value to store (or promise with new value), undefined to cancel the transaction, or null to remove the node.
     * @returns returns a promise that resolves with the DataReference once the transaction has been processed
     */
    transaction(callback) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot start a transaction on wildcard path "/${this.path}"`));
        }
        if (!this.db.isReady) {
            return this.db.ready().then(() => this.transaction(callback));
        }
        let throwError;
        let cb = (currentValue) => {
            currentValue = this.db.types.deserialize(this.path, currentValue);
            const snap = new data_snapshot_1.DataSnapshot(this, currentValue);
            let newValue;
            try {
                newValue = callback(snap);
            }
            catch (err) {
                // callback code threw an error
                throwError = err; // Remember error
                return; // cancel transaction by returning undefined
            }
            if (newValue instanceof Promise) {
                return newValue
                    .then((val) => {
                    return this.db.types.serialize(this.path, val);
                })
                    .catch(err => {
                    throwError = err; // Remember error
                    return; // cancel transaction by returning undefined
                });
            }
            else {
                return this.db.types.serialize(this.path, newValue);
            }
        };
        return this.db.api.transaction(this.path, cb, { context: this[_private].context })
            .then(result => {
            if (throwError) {
                // Rethrow error from callback code
                throw throwError;
            }
            return this;
        });
    }
    /**
     * Subscribes to an event. Supported events are "value", "child_added", "child_changed", "child_removed",
     * which will run the callback with a snapshot of the data. If you only wish to receive notifications of the
     * event (without the data), use the "notify_value", "notify_child_added", "notify_child_changed",
     * "notify_child_removed" events instead, which will run the callback with a DataReference to the changed
     * data. This enables you to manually retreive data upon changes (eg if you want to exclude certain child
     * data from loading)
     * @param event Name of the event to subscribe to
     * @param callback Callback function or whether or not to run callbacks on current values when using "value" or "child_added" events
     * @param cancelCallback Function to call when the subscription is not allowed, or denied access later on
     * @returns returns an EventStream
     */
    on(event, callback, cancelCallback) {
        if (this.path === '' && ['value', 'child_changed'].includes(event)) {
            // Removed 'notify_value' and 'notify_child_changed' events from the list, they do not require additional data loading anymore.
            console.warn(`WARNING: Listening for value and child_changed events on the root node is a bad practice. These events require loading of all data (value event), or potentially lots of data (child_changed event) each time they are fired`);
        }
        let eventPublisher = null;
        const eventStream = new subscription_1.EventStream(publisher => { eventPublisher = publisher; });
        // Map OUR callback to original callback, so .off can remove the right callback(s)
        const cb = {
            event,
            stream: eventStream,
            userCallback: typeof callback === 'function' && callback,
            ourCallback: (err, path, newValue, oldValue, eventContext) => {
                if (err) {
                    this.db.debug.error(`Error getting data for event ${event} on path "${path}"`, err);
                    return;
                }
                let ref = this.db.ref(path);
                ref[_private].vars = path_info_1.PathInfo.extractVariables(this.path, path);
                let callbackObject;
                if (event.startsWith('notify_')) {
                    // No data event, callback with reference
                    callbackObject = ref.context(eventContext || {});
                }
                else {
                    const values = {
                        previous: this.db.types.deserialize(path, oldValue),
                        current: this.db.types.deserialize(path, newValue)
                    };
                    if (event === 'child_removed') {
                        callbackObject = new data_snapshot_1.DataSnapshot(ref, values.previous, true, values.previous, eventContext);
                    }
                    else if (event === 'mutations') {
                        callbackObject = new data_snapshot_1.MutationsDataSnapshot(ref, values.current, eventContext);
                    }
                    else {
                        const isRemoved = event === 'mutated' && values.current === null;
                        callbackObject = new data_snapshot_1.DataSnapshot(ref, values.current, isRemoved, values.previous, eventContext);
                    }
                }
                eventPublisher.publish(callbackObject);
            }
        };
        this[_private].callbacks.push(cb);
        const subscribe = () => {
            // (NEW) Add callback to event stream 
            // ref.on('value', callback) is now exactly the same as ref.on('value').subscribe(callback)
            if (typeof callback === 'function') {
                eventStream.subscribe(callback, (activated, cancelReason) => {
                    if (!activated) {
                        cancelCallback && cancelCallback(cancelReason);
                    }
                });
            }
            let authorized = this.db.api.subscribe(this.path, event, cb.ourCallback);
            const allSubscriptionsStoppedCallback = () => {
                let callbacks = this[_private].callbacks;
                callbacks.splice(callbacks.indexOf(cb), 1);
                return this.db.api.unsubscribe(this.path, event, cb.ourCallback);
            };
            if (authorized instanceof Promise) {
                // Web API now returns a promise that resolves if the request is allowed
                // and rejects when access is denied by the set security rules
                authorized.then(() => {
                    // Access granted
                    eventPublisher.start(allSubscriptionsStoppedCallback);
                })
                    .catch(err => {
                    // Access denied?
                    // Cancel subscription
                    let callbacks = this[_private].callbacks;
                    callbacks.splice(callbacks.indexOf(cb), 1);
                    this.db.api.unsubscribe(this.path, event, cb.ourCallback);
                    // Call cancelCallbacks
                    eventPublisher.cancel(err.message);
                    // No need to call cancelCallback, original callbacks are now added to event stream
                    // cancelCallback && cancelCallback(err.message);
                });
            }
            else {
                // Local API, always authorized
                eventPublisher.start(allSubscriptionsStoppedCallback);
            }
            if (callback && !this.isWildcardPath) {
                // If callback param is supplied (either a callback function or true or something else truthy),
                // it will fire events for current values right now.
                // Otherwise, it expects the .subscribe methode to be used, which will then
                // only be called for future events
                if (event === "value") {
                    this.get(snap => {
                        eventPublisher.publish(snap);
                        typeof callback === 'function' && callback(snap);
                    });
                }
                else if (event === "child_added") {
                    this.get(snap => {
                        const val = snap.val();
                        if (val === null || typeof val !== "object") {
                            return;
                        }
                        Object.keys(val).forEach(key => {
                            let childSnap = new data_snapshot_1.DataSnapshot(this.child(key), val[key]);
                            eventPublisher.publish(childSnap);
                            typeof callback === 'function' && callback(childSnap);
                        });
                    });
                }
                else if (event === "notify_child_added") {
                    // Use the reflect API to get current children. 
                    // NOTE: This does not work with AceBaseServer <= v0.9.7, only when signed in as admin
                    const step = 100;
                    let limit = step, skip = 0;
                    const more = () => {
                        this.db.api.reflect(this.path, "children", { limit, skip })
                            .then(children => {
                            children.list.forEach(child => {
                                const childRef = this.child(child.key);
                                eventPublisher.publish(childRef);
                                typeof callback === 'function' && callback(childRef);
                            });
                            if (children.more) {
                                skip += step;
                                more();
                            }
                        });
                    };
                    more();
                }
            }
        };
        if (this.db.isReady) {
            subscribe();
        }
        else {
            this.db.ready(subscribe);
        }
        return eventStream;
    }
    /**
     * Unsubscribes from a previously added event
     * @param event Name of the event
     * @param callback callback function to remove
     */
    off(event, callback) {
        const subscriptions = this[_private].callbacks;
        const stopSubs = subscriptions.filter(sub => (!event || sub.event === event) && (!callback || sub.userCallback === callback));
        if (stopSubs.length === 0) {
            this.db.debug.warn(`Can't find event subscriptions to stop (path: "${this.path}", event: ${event || '(any)'}, callback: ${callback})`);
        }
        stopSubs.forEach(sub => {
            sub.stream.stop();
        });
        return this;
    }
    get(optionsOrCallback, callback) {
        if (!this.db.isReady) {
            const promise = this.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== 'function' && typeof callback !== 'function' ? promise : undefined; // only return promise if no callback is used
        }
        callback =
            typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : typeof callback === 'function'
                    ? callback
                    : undefined;
        if (this.isWildcardPath) {
            const error = new Error(`Cannot get value of wildcard path "/${this.path}". Use .query() instead`);
            if (typeof callback === 'function') {
                throw error;
            }
            return Promise.reject(error);
        }
        const options = typeof optionsOrCallback === 'object'
            ? optionsOrCallback
            : new DataRetrievalOptions({ allow_cache: true });
        if (typeof options.allow_cache === 'undefined') {
            options.allow_cache = true;
        }
        const promise = this.db.api.get(this.path, options).then(value => {
            value = this.db.types.deserialize(this.path, value);
            const snapshot = new data_snapshot_1.DataSnapshot(this, value);
            return snapshot;
        });
        if (callback) {
            promise.then(callback);
            return;
        }
        else {
            return promise;
        }
    }
    /**
     * Waits for an event to occur
     * @param event Name of the event, eg "value", "child_added", "child_changed", "child_removed"
     * @param options data retrieval options, to include or exclude specific child keys
     * @returns returns promise that resolves with a snapshot of the data
     */
    once(event, options) {
        if (event === "value" && !this.isWildcardPath) {
            // Shortcut, do not start listening for future events
            return this.get(options);
        }
        return new Promise((resolve, reject) => {
            const callback = (snap) => {
                this.off(event, callback); // unsubscribe directly
                resolve(snap);
            };
            this.on(event, callback);
        });
    }
    /**
     * @param value optional value to store into the database right away
     * @param onComplete optional callback function to run once value has been stored
     * @returns returns promise that resolves with the reference after the passed value has been stored
     */
    push(value, onComplete) {
        if (this.isWildcardPath) {
            const error = new Error(`Cannot push to wildcard path "/${this.path}"`);
            if (typeof value === 'undefined' || typeof onComplete === 'function') {
                throw error;
            }
            return Promise.reject(error);
        }
        const id = id_1.ID.generate(); //uuid62.v1({ node: [0x61, 0x63, 0x65, 0x62, 0x61, 0x73] });
        const ref = this.child(id);
        ref[_private].pushed = true;
        if (typeof value !== 'undefined') {
            return ref.set(value, onComplete).then(res => ref);
        }
        else {
            return ref;
        }
    }
    /**
     * Removes this node and all children
     */
    remove() {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot remove wildcard path "/${this.path}". Use query().remove instead`));
        }
        if (this.parent === null) {
            throw Promise.reject(new Error(`Cannot remove the root node`));
        }
        return this.set(null);
    }
    /**
     * Quickly checks if this reference has a value in the database, without returning its data
     * @returns {Promise<boolean>} | returns a promise that resolves with a boolean value
     */
    exists() {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot check wildcard path "/${this.path}" existence`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.exists());
        }
        return this.db.api.exists(this.path);
    }
    get isWildcardPath() {
        return this.path.indexOf('*') >= 0 || this.path.indexOf('$') >= 0;
    }
    query() {
        return new DataReferenceQuery(this);
    }
    count() {
        return this.reflect("info", { child_count: true })
            .then(info => {
            return info.children.count;
        });
    }
    reflect(type, args) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot reflect on wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.reflect(type, args));
        }
        return this.db.api.reflect(this.path, type, args);
    }
    export(stream, options = { format: 'json' }) {
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot export wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.export(stream, options));
        }
        return this.db.api.export(this.path, stream, options);
    }
    proxy(defaultValue) {
        return data_proxy_1.LiveDataProxy.create(this, defaultValue);
    }
    observe(options) {
        // options should not be used yet - we can't prevent/filter mutation events on excluded paths atm 
        if (options) {
            throw new Error('observe does not support data retrieval options yet');
        }
        if (this.isWildcardPath) {
            return Promise.reject(new Error(`Cannot observe wildcard path "/${this.path}"`));
        }
        else if (!this.db.isReady) {
            return this.db.ready().then(() => this.observe(options));
        }
        const Observable = optional_observable_1.getObservable();
        return new Observable(observer => {
            let cache, resolved = false;
            let promise = this.get(options).then(snap => {
                resolved = true;
                cache = snap.val();
                observer.next(cache);
            });
            const updateCache = (snap) => {
                if (!resolved) {
                    promise = promise.then(() => updateCache(snap));
                    return;
                }
                const mutatedPath = snap.ref.path;
                const trailPath = mutatedPath.slice(this.path.length + 1);
                const trailKeys = path_info_1.PathInfo.getPathKeys(trailPath);
                let target = cache;
                while (trailKeys.length > 1) {
                    const key = trailKeys.shift();
                    if (!(key in target)) {
                        // Happens if initial loaded data did not include / excluded this data, 
                        // or we missed out on an event
                        target[key] = typeof trailKeys[0] === 'number' ? [] : {};
                    }
                    target = target[key];
                }
                const prop = trailKeys.shift();
                const newValue = snap.val();
                if (newValue === null) {
                    // Remove it
                    target instanceof Array && typeof prop === 'number' ? target.splice(prop, 1) : delete target[prop];
                }
                else {
                    // Set or update it
                    target[prop] = newValue;
                }
                observer.next(cache);
            };
            this.on('mutated', updateCache);
            // Return unsubscribe function
            return () => {
                this.off('mutated', updateCache);
            };
        });
    }
}
exports.DataReference = DataReference;
class DataReferenceQuery {
    /**
     * Creates a query on a reference
     */
    constructor(ref) {
        this.ref = ref;
        this[_private] = {
            filters: [],
            skip: 0,
            take: 0,
            order: [],
            events: {}
        };
    }
    /**
     * Applies a filter to the children of the refence being queried.
     * If there is an index on the property key being queried, it will be used
     * to speed up the query
     * @param key property to test value of
     * @param op operator to use
     * @param compare value to compare with
     */
    filter(key, op, compare) {
        if ((op === "in" || op === "!in") && (!(compare instanceof Array) || compare.length === 0)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing at least 1 value`);
        }
        if ((op === "between" || op === "!between") && (!(compare instanceof Array) || compare.length !== 2)) {
            throw new Error(`${op} filter for ${key} must supply an Array compare argument containing 2 values`);
        }
        if ((op === "matches" || op === "!matches") && !(compare instanceof RegExp)) {
            throw new Error(`${op} filter for ${key} must supply a RegExp compare argument`);
        }
        // DISABLED 2019/10/23 because it is not fully implemented only works locally
        // if (op === "custom" && typeof compare !== "function") {
        //     throw `${op} filter for ${key} must supply a Function compare argument`;
        // }
        if ((op === "contains" || op === "!contains") && ((typeof compare === 'object' && !(compare instanceof Array) && !(compare instanceof Date)) || (compare instanceof Array && compare.length === 0))) {
            throw new Error(`${op} filter for ${key} must supply a simple value or (non-zero length) array compare argument`);
        }
        this[_private].filters.push({ key, op, compare });
        return this;
    }
    /**
     * @deprecated use .filter instead
     */
    where(key, op, compare) {
        return this.filter(key, op, compare);
    }
    /**
     * Limits the number of query results to n
     */
    take(n) {
        this[_private].take = n;
        return this;
    }
    /**
     * Skips the first n query results
     */
    skip(n) {
        this[_private].skip = n;
        return this;
    }
    /**
     * Sorts the query results
     */
    sort(key, ascending = true) {
        if (typeof key !== "string") {
            throw `key must be a string`;
        }
        this[_private].order.push({ key, ascending });
        return this;
    }
    /**
     * @deprecated use .sort instead
     */
    order(key, ascending = true) {
        return this.sort(key, ascending);
    }
    get(optionsOrCallback, callback) {
        if (!this.ref.db.isReady) {
            const promise = this.ref.db.ready().then(() => this.get(optionsOrCallback, callback));
            return typeof optionsOrCallback !== 'function' && typeof callback !== 'function' ? promise : undefined; // only return promise if no callback is used
        }
        callback =
            typeof optionsOrCallback === 'function'
                ? optionsOrCallback
                : typeof callback === 'function'
                    ? callback
                    : undefined;
        const options = typeof optionsOrCallback === 'object'
            ? optionsOrCallback
            : new QueryDataRetrievalOptions({ snapshots: true, allow_cache: true });
        if (typeof options.snapshots === 'undefined') {
            options.snapshots = true;
        }
        if (typeof options.allow_cache === 'undefined') {
            options.allow_cache = true;
        }
        options.eventHandler = ev => {
            // TODO: implement context for query events
            if (!this[_private].events[ev.name]) {
                return false;
            }
            const listeners = this[_private].events[ev.name];
            if (typeof listeners !== 'object' || listeners.length === 0) {
                return false;
            }
            if (['add', 'change', 'remove'].includes(ev.name)) {
                const ref = new DataReference(this.ref.db, ev.path);
                const eventData = { name: ev.name };
                if (options.snapshots && ev.name !== 'remove') {
                    const val = db.types.deserialize(ev.path, ev.value);
                    eventData.snapshot = new data_snapshot_1.DataSnapshot(ref, val, false);
                }
                else {
                    eventData.ref = ref;
                }
                ev = eventData;
            }
            listeners.forEach(callback => { try {
                callback(ev);
            }
            catch (e) { } });
        };
        // Check if there are event listeners set for realtime changes
        options.monitor = { add: false, change: false, remove: false };
        if (this[_private].events) {
            if (this[_private].events['add'] && this[_private].events['add'].length > 0) {
                options.monitor.add = true;
            }
            if (this[_private].events['change'] && this[_private].events['change'].length > 0) {
                options.monitor.change = true;
            }
            if (this[_private].events['remove'] && this[_private].events['remove'].length > 0) {
                options.monitor.remove = true;
            }
        }
        const db = this.ref.db;
        return db.api.query(this.ref.path, this[_private], options)
            .catch(err => {
            throw new Error(err);
        })
            .then(results => {
            if (options.snapshots) {
                const snaps = results.map(result => {
                    const val = db.types.deserialize(result.path, result.val);
                    return new data_snapshot_1.DataSnapshot(db.ref(result.path), val);
                });
                return DataSnapshotsArray.from(snaps);
            }
            else {
                const refs = results.map(path => db.ref(path));
                return DataReferencesArray.from(refs);
            }
        })
            .then(results => {
            callback && callback(results);
            return results;
        });
    }
    /**
     * Executes the query and returns references. Short for .get({ snapshots: false })
     * @param callback callback to use instead of returning a promise
     * @returns returns an Promise that resolves with an array of DataReferences, or void when using a callback
     */
    getRefs(callback) {
        return this.get({ snapshots: false }, callback);
    }
    /**
     * Executes the query, removes all matches from the database
     * @returns returns an Promise that resolves once all matches have been removed, or void if a callback is used
     */
    remove(callback) {
        const promise = this.get({ snapshots: false })
            .then((refs) => {
            return Promise.all(refs.map(ref => ref.remove()
                .then(() => {
                return { success: true, ref };
            })
                .catch(err => {
                return { success: false, error: err, ref };
            })))
                .then(results => {
                callback && callback(results);
                return results;
            });
        });
        if (!callback) {
            return promise;
        }
    }
    /**
     * Subscribes to an event. Supported events are:
     *  "stats": receive information about query performance.
     *  "hints": receive query or index optimization hints
     *  "add", "change", "remove": receive real-time query result changes
     * @param event Name of the event to subscribe to
     * @param callback Callback function
     * @returns returns reference to this query
     */
    on(event, callback) {
        if (!this[_private].events[event]) {
            this[_private].events[event] = [];
        }
        this[_private].events[event].push(callback);
        return this;
    }
    /**
     * Unsubscribes from a previously added event(s)
     * @param event Name of the event
     * @param callback callback function to remove
     * @returns returns reference to this query
     */
    off(event, callback) {
        if (typeof event === 'undefined') {
            this[_private].events = {};
            return this;
        }
        if (!this[_private].events[event]) {
            return this;
        }
        if (typeof callback === 'undefined') {
            delete this[_private].events[event];
            return this;
        }
        const index = this[_private].events[event].indexOf(callback);
        if (!~index) {
            return this;
        }
        this[_private].events[event].splice(index, 1);
        return this;
    }
}
exports.DataReferenceQuery = DataReferenceQuery;
class DataSnapshotsArray extends Array {
    static from(snaps) {
        const arr = new DataSnapshotsArray(snaps.length);
        snaps.forEach((snap, i) => arr[i] = snap);
        return arr;
    }
    getValues() {
        return this.map(snap => snap.val());
    }
}
exports.DataSnapshotsArray = DataSnapshotsArray;
class DataReferencesArray extends Array {
    static from(refs) {
        const arr = new DataReferencesArray(refs.length);
        refs.forEach((ref, i) => arr[i] = ref);
        return arr;
    }
    getPaths() {
        return this.map(ref => ref.path);
    }
}
exports.DataReferencesArray = DataReferencesArray;

},{"./data-proxy":18,"./data-snapshot":20,"./id":22,"./optional-observable":24,"./path-info":25,"./subscription":31}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationsDataSnapshot = exports.DataSnapshot = void 0;
const path_info_1 = require("./path-info");
function getChild(snapshot, path, previous = false) {
    if (!snapshot.exists()) {
        return null;
    }
    let child = previous ? snapshot.previous() : snapshot.val();
    if (typeof path === 'number') {
        return child[path];
    }
    path_info_1.PathInfo.getPathKeys(path).every(key => {
        child = child[key];
        return typeof child !== 'undefined';
    });
    return child || null;
}
function getChildren(snapshot) {
    if (!snapshot.exists()) {
        return [];
    }
    let value = snapshot.val();
    if (value instanceof Array) {
        return new Array(value.length).map((v, i) => i);
    }
    if (typeof value === 'object') {
        return Object.keys(value);
    }
    return [];
}
class DataSnapshot {
    /**
     * Creates a new DataSnapshot instance
     */
    constructor(ref, value, isRemoved = false, prevValue, context) {
        this.ref = ref;
        this.val = () => { return value; };
        this.previous = () => { return prevValue; };
        this.exists = () => {
            if (isRemoved) {
                return false;
            }
            return value !== null && typeof value !== 'undefined';
        };
        this.context = () => { return context || {}; };
    }
    val() { }
    previous() { }
    exists() { return false; }
    context() { }
    /**
     * Gets a new snapshot for a child node
     * @param path child key or path
     * @returns Returns a DataSnapshot of the child
     */
    child(path) {
        // Create new snapshot for child data
        let val = getChild(this, path, false);
        let prev = getChild(this, path, true);
        return new DataSnapshot(this.ref.child(path), val, false, prev);
    }
    /**
     * Checks if the snapshot's value has a child with the given key or path
     * @param {string} path child key or path
     * @returns {boolean}
     */
    hasChild(path) {
        return getChild(this, path) !== null;
    }
    /**
     * Indicates whether the the snapshot's value has any child nodes
     * @returns {boolean}
     */
    hasChildren() {
        return getChildren(this).length > 0;
    }
    /**
     * The number of child nodes in this snapshot
     * @returns {number}
     */
    numChildren() {
        return getChildren(this).length;
    }
    /**
     * Runs a callback function for each child node in this snapshot until the callback returns false
     * @param callback function that is called with a snapshot of each child node in this snapshot. Must return a boolean value that indicates whether to continue iterating or not.
     * @returns {void}
     */
    forEach(callback) {
        const value = this.val();
        const prev = this.previous();
        return getChildren(this).every((key, i) => {
            const snap = new DataSnapshot(this.ref.child(key), value[key], false, prev[key]);
            return callback(snap);
        });
    }
    /**
     * @type {string|number}
     */
    get key() { return this.ref.key; }
}
exports.DataSnapshot = DataSnapshot;
class MutationsDataSnapshot extends DataSnapshot {
    val(warn = true) { return []; }
    previous() { throw new Error('Iterate values to get previous values for each mutation'); }
    constructor(ref, mutations, context) {
        super(ref, mutations, false, undefined, context);
        this.val = (warn = true) => {
            if (warn) {
                console.warn(`Unless you know what you are doing, it is best not to use the value of a mutations snapshot directly. Use child methods and forEach to iterate the mutations instead`);
            }
            return mutations;
        };
    }
    /**
     * Runs a callback function for each mutation in this snapshot until the callback returns false
     * @param callback function that is called with a snapshot of each mutation in this snapshot. Must return a boolean value that indicates whether to continue iterating or not.
     * @returns Returns whether every child was interated
     */
    forEach(callback) {
        const mutations = this.val();
        return mutations.every(mutation => {
            const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
            const snap = new DataSnapshot(ref, mutation.val, false, mutation.prev);
            return callback(snap);
        });
    }
    /**
     * Gets a snapshot of a mutated node
     * @param index index of the mutation
     * @returns Returns a DataSnapshot of the mutated node
     */
    child(index) {
        if (typeof index !== 'number') {
            throw new Error(`child index must be a number`);
        }
        const mutation = this.val()[index];
        const ref = mutation.target.reduce((ref, key) => ref.child(key), this.ref);
        return new DataSnapshot(ref, mutation.val, false, mutation.prev);
    }
}
exports.MutationsDataSnapshot = MutationsDataSnapshot;

},{"./path-info":25}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = void 0;
const process_1 = require("./process");
class DebugLogger {
    constructor(level = "log", prefix = '') {
        this.prefix = prefix;
        this.setLevel(level);
    }
    setLevel(level) {
        const prefix = this.prefix ? this.prefix + ' %s' : '';
        this.level = level;
        this.verbose = ["verbose"].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : () => { };
        this.log = ["verbose", "log"].includes(level) ? prefix ? console.log.bind(console, prefix) : console.log.bind(console) : () => { };
        this.warn = ["verbose", "log", "warn"].includes(level) ? prefix ? console.warn.bind(console, prefix) : console.warn.bind(console) : () => { };
        this.error = ["verbose", "log", "warn", "error"].includes(level) ? prefix ? console.error.bind(console, prefix) : console.error.bind(console) : () => { };
        this.write = (text) => {
            const isRunKit = typeof process_1.default !== 'undefined' && process_1.default.env && typeof process_1.default.env.RUNKIT_ENDPOINT_PATH === 'string';
            if (text && isRunKit) {
                text.split('\n').forEach(line => console.log(line)); // Logs each line separately
            }
            else {
                console.log(text);
            }
        };
    }
}
exports.DebugLogger = DebugLogger;

},{"./process":27}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = void 0;
const cuid_1 = require("./cuid");
// const uuid62 = require('uuid62');
let timeBias = 0;
class ID {
    static set timeBias(bias) {
        if (typeof bias !== 'number') {
            return;
        }
        timeBias = bias;
    }
    static generate() {
        // Could also use https://www.npmjs.com/package/pushid for Firebase style 20 char id's
        return cuid_1.default(timeBias).slice(1); // Cuts off the always leading 'c'
        // return uuid62.v1();
    }
}
exports.ID = ID;

},{"./cuid":16}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorize = exports.ColorStyle = exports.SimpleEventEmitter = exports.proxyAccess = exports.SimpleCache = exports.ascii85 = exports.PathInfo = exports.Utils = exports.TypeMappings = exports.Transport = exports.EventSubscription = exports.EventPublisher = exports.EventStream = exports.PathReference = exports.ID = exports.DebugLogger = exports.DataSnapshot = exports.QueryDataRetrievalOptions = exports.DataRetrievalOptions = exports.DataReferenceQuery = exports.DataReference = exports.Api = exports.AceBaseBaseSettings = exports.AceBaseBase = void 0;
var acebase_base_1 = require("./acebase-base");
Object.defineProperty(exports, "AceBaseBase", { enumerable: true, get: function () { return acebase_base_1.AceBaseBase; } });
Object.defineProperty(exports, "AceBaseBaseSettings", { enumerable: true, get: function () { return acebase_base_1.AceBaseBaseSettings; } });
var api_1 = require("./api");
Object.defineProperty(exports, "Api", { enumerable: true, get: function () { return api_1.Api; } });
var data_reference_1 = require("./data-reference");
Object.defineProperty(exports, "DataReference", { enumerable: true, get: function () { return data_reference_1.DataReference; } });
Object.defineProperty(exports, "DataReferenceQuery", { enumerable: true, get: function () { return data_reference_1.DataReferenceQuery; } });
Object.defineProperty(exports, "DataRetrievalOptions", { enumerable: true, get: function () { return data_reference_1.DataRetrievalOptions; } });
Object.defineProperty(exports, "QueryDataRetrievalOptions", { enumerable: true, get: function () { return data_reference_1.QueryDataRetrievalOptions; } });
var data_snapshot_1 = require("./data-snapshot");
Object.defineProperty(exports, "DataSnapshot", { enumerable: true, get: function () { return data_snapshot_1.DataSnapshot; } });
var debug_1 = require("./debug");
Object.defineProperty(exports, "DebugLogger", { enumerable: true, get: function () { return debug_1.DebugLogger; } });
var id_1 = require("./id");
Object.defineProperty(exports, "ID", { enumerable: true, get: function () { return id_1.ID; } });
var path_reference_1 = require("./path-reference");
Object.defineProperty(exports, "PathReference", { enumerable: true, get: function () { return path_reference_1.PathReference; } });
var subscription_1 = require("./subscription");
Object.defineProperty(exports, "EventStream", { enumerable: true, get: function () { return subscription_1.EventStream; } });
Object.defineProperty(exports, "EventPublisher", { enumerable: true, get: function () { return subscription_1.EventPublisher; } });
Object.defineProperty(exports, "EventSubscription", { enumerable: true, get: function () { return subscription_1.EventSubscription; } });
var transport_1 = require("./transport");
Object.defineProperty(exports, "Transport", { enumerable: true, get: function () { return transport_1.Transport; } });
var type_mappings_1 = require("./type-mappings");
Object.defineProperty(exports, "TypeMappings", { enumerable: true, get: function () { return type_mappings_1.TypeMappings; } });
exports.Utils = require("./utils");
var path_info_1 = require("./path-info");
Object.defineProperty(exports, "PathInfo", { enumerable: true, get: function () { return path_info_1.PathInfo; } });
var ascii85_1 = require("./ascii85");
Object.defineProperty(exports, "ascii85", { enumerable: true, get: function () { return ascii85_1.ascii85; } });
var simple_cache_1 = require("./simple-cache");
Object.defineProperty(exports, "SimpleCache", { enumerable: true, get: function () { return simple_cache_1.SimpleCache; } });
var data_proxy_1 = require("./data-proxy");
Object.defineProperty(exports, "proxyAccess", { enumerable: true, get: function () { return data_proxy_1.proxyAccess; } });
var simple_event_emitter_1 = require("./simple-event-emitter");
Object.defineProperty(exports, "SimpleEventEmitter", { enumerable: true, get: function () { return simple_event_emitter_1.SimpleEventEmitter; } });
var simple_colors_1 = require("./simple-colors");
Object.defineProperty(exports, "ColorStyle", { enumerable: true, get: function () { return simple_colors_1.ColorStyle; } });
Object.defineProperty(exports, "Colorize", { enumerable: true, get: function () { return simple_colors_1.Colorize; } });

},{"./acebase-base":12,"./api":13,"./ascii85":14,"./data-proxy":18,"./data-reference":19,"./data-snapshot":20,"./debug":21,"./id":22,"./path-info":25,"./path-reference":26,"./simple-cache":28,"./simple-colors":29,"./simple-event-emitter":30,"./subscription":31,"./transport":32,"./type-mappings":33,"./utils":34}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setObservable = exports.getObservable = void 0;
let _observable;
function getObservable() {
    if (_observable) {
        return _observable;
    }
    if (typeof window !== 'undefined' && window.Observable) {
        _observable = window.Observable;
        return _observable;
    }
    try {
        const { Observable } = require('rxjs'); //'rxjs/internal/observable'
        if (!Observable) {
            throw new Error('not loaded');
        }
        _observable = Observable;
        return Observable;
    }
    catch (err) {
        throw new Error(`RxJS Observable could not be loaded. If you are using a browser build, add it to AceBase using db.setObservable. For node.js builds, add it to your project with: npm i rxjs`);
    }
}
exports.getObservable = getObservable;
function setObservable(Observable) {
    _observable = Observable;
}
exports.setObservable = setObservable;

},{"rxjs":35}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathInfo = exports.getChildPath = exports.getPathInfo = exports.getPathKeys = void 0;
function getPathKeys(path) {
    path = path.replace(/^\//, ''); // Remove leading slash
    if (path.length === 0) {
        return [];
    }
    let keys = path.replace(/\[/g, '/[').split('/');
    return keys.map(key => {
        return key.startsWith('[') ? parseInt(key.substr(1, key.length - 2)) : key;
    });
}
exports.getPathKeys = getPathKeys;
function getPathInfo(path) {
    path = path.replace(/^\//, ''); // Remove leading slash
    if (path.length === 0) {
        return { parent: null, key: '' };
    }
    const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('['));
    let parentPath = i < 0 ? '' : path.substr(0, i);
    let key = i < 0 ? path : path.substr(i);
    if (key.startsWith('[')) {
        key = parseInt(key.substr(1, key.length - 2));
    }
    else if (key.startsWith('/')) {
        key = key.substr(1); // Chop off leading slash
    }
    if (parentPath === path) {
        parentPath = null;
    }
    return { parent: parentPath, key };
}
exports.getPathInfo = getPathInfo;
function getChildPath(path, key) {
    path = path.replace(/^\//, ""); // Remove leading slash
    key = typeof key === "string" ? key.replace(/^\//, "") : key; // Remove leading slash
    if (path.length === 0) {
        if (typeof key === "number") {
            throw new TypeError("Cannot add array index to root path!");
        }
        return key;
    }
    if (typeof key === "string" && key.length === 0) {
        return path;
    }
    if (typeof key === "number") {
        return `${path}[${key}]`;
    }
    return `${path}/${key}`;
}
exports.getChildPath = getChildPath;
class PathInfo {
    constructor(path) {
        this.path = path;
    }
    static get(path) {
        return new PathInfo(path);
    }
    static getChildPath(path, childKey) {
        return getChildPath(path, childKey);
    }
    static getPathKeys(path) {
        return getPathKeys(path);
    }
    get key() {
        return getPathInfo(this.path).key;
    }
    get parentPath() {
        return getPathInfo(this.path).parent;
    }
    childPath(childKey) {
        return getChildPath(`${this.path}`, childKey);
    }
    get pathKeys() {
        return getPathKeys(this.path);
    }
    /**
     * If varPath contains variables or wildcards, it will return them with the values found in fullPath
     * @param {string} varPath path containing variables such as * and $name
     * @param {string} fullPath real path to a node
     * @returns {{ [index: number]: string|number, [variable: string]: string|number }} returns an array-like object with all variable values. All named variables are also set on the array by their name (eg vars.uid and vars.$uid)
     * @example
     * PathInfo.extractVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  uid: 'ewout', // or $uid
     *  postid: 'post1' // or $postid
     * };
     *
     * PathInfo.extractVariables('users/*\/posts/*\/$property', 'users/ewout/posts/post1/title') === {
     *  0: 'ewout',
     *  1: 'post1',
     *  2: 'title',
     *  property: 'title' // or $property
     * };
     *
     * PathInfo.extractVariables('users/$user/friends[*]/$friend', 'users/dora/friends[4]/diego') === {
     *  0: 'dora',
     *  1: 4,
     *  2: 'diego',
     *  user: 'dora', // or $user
     *  friend: 'diego' // or $friend
     * };
    */
    static extractVariables(varPath, fullPath) {
        if (!varPath.includes('*') && !varPath.includes('$')) {
            return [];
        }
        // if (!this.equals(fullPath)) {
        //     throw new Error(`path does not match with the path of this PathInfo instance: info.equals(path) === false!`)
        // }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let count = 0;
        const variables = {
            get length() { return count; }
        };
        keys.forEach((key, index) => {
            const pathKey = pathKeys[index];
            if (key === '*') {
                variables[count++] = pathKey;
            }
            else if (typeof key === 'string' && key[0] === '$') {
                variables[count++] = pathKey;
                // Set the $variable property
                variables[key] = pathKey;
                // Set friendly property name (without $)
                const varName = key.slice(1);
                if (typeof variables[varName] === 'undefined') {
                    variables[varName] = pathKey;
                }
            }
        });
        return variables;
    }
    /**
     * If varPath contains variables or wildcards, it will return a path with the variables replaced by the keys found in fullPath.
     * @example
     * PathInfo.fillVariables('users/$uid/posts/$postid', 'users/ewout/posts/post1/title') === 'users/ewout/posts/post1'
     */
    static fillVariables(varPath, fullPath) {
        if (varPath.indexOf('*') < 0 && varPath.indexOf('$') < 0) {
            return varPath;
        }
        const keys = getPathKeys(varPath);
        const pathKeys = getPathKeys(fullPath);
        let merged = keys.map((key, index) => {
            if (key === pathKeys[index] || index >= pathKeys.length) {
                return key;
            }
            else if (typeof key === 'string' && (key === '*' || key[0] === '$')) {
                return pathKeys[index];
            }
            else {
                throw new Error(`Path "${fullPath}" cannot be used to fill variables of path "${varPath}" because they do not match`);
            }
        });
        let mergedPath = '';
        merged.forEach(key => {
            if (typeof key === 'number') {
                mergedPath += `[${key}]`;
            }
            else {
                if (mergedPath.length > 0) {
                    mergedPath += '/';
                }
                mergedPath += key;
            }
        });
        return mergedPath;
    }
    /**
     * Replaces all variables in a path with the values in the vars argument
     * @param varPath path containing variables
     * @param vars variables object such as one gotten from PathInfo.extractVariables
     */
    static fillVariables2(varPath, vars) {
        if (typeof vars !== 'object' || Object.keys(vars).length === 0) {
            return varPath; // Nothing to fill
        }
        let pathKeys = getPathKeys(varPath);
        let n = 0;
        const targetPath = pathKeys.reduce((path, key) => {
            if (typeof key === 'number') {
                return `${path}[${key}]`;
            }
            else if (key === '*' || key.startsWith('$')) {
                return `${path}/${vars[n++]}`;
            }
            else {
                return `${path}/${key}`;
            }
        }, '');
        return targetPath;
    }
    /**
     * Checks if a given path matches this path, eg "posts/*\/title" matches "posts/12344/title" and "users/123/name" matches "users/$uid/name"
     */
    equals(otherPath) {
        if (this.path === otherPath) {
            return true;
        } // they are identical
        const keys = this.pathKeys;
        const otherKeys = getPathKeys(otherPath);
        if (keys.length !== otherKeys.length) {
            return false;
        }
        return keys.every((key, index) => {
            const otherKey = otherKeys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is an ancestor, eg "posts" is an ancestor of "posts/12344/title"
     */
    isAncestorOf(descendantPath) {
        if (descendantPath === '' || this.path === descendantPath) {
            return false;
        }
        if (this.path === '') {
            return true;
        }
        const ancestorKeys = this.pathKeys;
        const descendantKeys = getPathKeys(descendantPath);
        if (ancestorKeys.length >= descendantKeys.length) {
            return false;
        }
        return ancestorKeys.every((key, index) => {
            const otherKey = descendantKeys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is a descendant, eg "posts/1234/title" is a descendant of "posts"
     */
    isDescendantOf(ancestorPath) {
        if (this.path === '' || this.path === ancestorPath) {
            return false;
        }
        if (ancestorPath === '') {
            return true;
        }
        const ancestorKeys = getPathKeys(ancestorPath);
        const descendantKeys = this.pathKeys;
        if (ancestorKeys.length >= descendantKeys.length) {
            return false;
        }
        return ancestorKeys.every((key, index) => {
            const otherKey = descendantKeys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" || key[0] === '$'));
        });
    }
    /**
     * Checks if the other path is on the same trail as this path. Paths on the same trail if they share a
     * common ancestor. Eg: "posts" is on the trail of "posts/1234/title" and vice versa.
     */
    isOnTrailOf(otherPath) {
        if (this.path.length === 0 || otherPath.length === 0) {
            return true;
        }
        if (this.path === otherPath) {
            return true;
        }
        const otherKeys = getPathKeys(otherPath);
        return this.pathKeys.every((key, index) => {
            if (index >= otherKeys.length) {
                return true;
            }
            const otherKey = otherKeys[index];
            return otherKey === key
                || (typeof otherKey === 'string' && (otherKey === "*" || otherKey[0] === '$'))
                || (typeof key === 'string' && (key === "*" || key[0] === '$'));
        });
    }
    /**
     * Checks if a given path is a direct child, eg "posts/1234/title" is a child of "posts/1234"
     */
    isChildOf(otherPath) {
        if (this.path === '') {
            return false;
        } // If our path is the root, it's nobody's child...
        const parentInfo = PathInfo.get(this.parentPath);
        return parentInfo.equals(otherPath);
    }
    /**
     * Checks if a given path is its parent, eg "posts/1234" is the parent of "posts/1234/title"
     */
    isParentOf(otherPath) {
        if (otherPath === '') {
            return false;
        } // If the other path is the root, this path cannot be its parent...
        const parentInfo = PathInfo.get(PathInfo.get(otherPath).parentPath);
        return parentInfo.equals(this.path);
    }
}
exports.PathInfo = PathInfo;

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathReference = void 0;
class PathReference {
    /**
     * Creates a reference to a path that can be stored in the database. Use this to create cross-references to other data in your database
     * @param path
     */
    constructor(path) {
        this.path = path;
    }
}
exports.PathReference = PathReference;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    nextTick(fn) {
        setTimeout(fn, 0);
    }
};

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = void 0;
class SimpleCache {
    constructor(expirySeconds) {
        this.expirySeconds = expirySeconds;
        this.cache = new Map();
        setInterval(() => { this.cleanUp(); }, 60 * 1000); // Cleanup every minute
    }
    set(key, value) {
        this.cache.set(key, { value, expires: Date.now() + (this.expirySeconds * 1000) });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry || entry.expires <= Date.now()) {
            return null;
        }
        return entry.value;
    }
    remove(key) {
        this.cache.delete(key);
    }
    cleanUp() {
        const now = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.expires <= now) {
                this.cache.delete(key);
            }
        });
    }
}
exports.SimpleCache = SimpleCache;

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Colorize = exports.SetColorsEnabled = exports.ColorsSupported = exports.ColorStyle = void 0;
const process_1 = require("./process");
// See from https://en.wikipedia.org/wiki/ANSI_escape_code
const FontCode = {
    bold: 1,
    dim: 2,
    italic: 3,
    underline: 4,
    inverse: 7,
    hidden: 8,
    strikethrough: 94
};
const ColorCode = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    grey: 90,
    // Bright colors:
    brightRed: 91,
};
const BgColorCode = {
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,
    bgGrey: 100,
    bgBrightRed: 101,
};
const ResetCode = {
    all: 0,
    color: 39,
    background: 49,
    bold: 22,
    dim: 22,
    italic: 23,
    underline: 24,
    inverse: 27,
    hidden: 28,
    strikethrough: 29
};
var ColorStyle;
(function (ColorStyle) {
    ColorStyle["reset"] = "reset";
    ColorStyle["bold"] = "bold";
    ColorStyle["dim"] = "dim";
    ColorStyle["italic"] = "italic";
    ColorStyle["underline"] = "underline";
    ColorStyle["inverse"] = "inverse";
    ColorStyle["hidden"] = "hidden";
    ColorStyle["strikethrough"] = "strikethrough";
    ColorStyle["black"] = "black";
    ColorStyle["red"] = "red";
    ColorStyle["green"] = "green";
    ColorStyle["yellow"] = "yellow";
    ColorStyle["blue"] = "blue";
    ColorStyle["magenta"] = "magenta";
    ColorStyle["cyan"] = "cyan";
    ColorStyle["grey"] = "grey";
    ColorStyle["bgBlack"] = "bgBlack";
    ColorStyle["bgRed"] = "bgRed";
    ColorStyle["bgGreen"] = "bgGreen";
    ColorStyle["bgYellow"] = "bgYellow";
    ColorStyle["bgBlue"] = "bgBlue";
    ColorStyle["bgMagenta"] = "bgMagenta";
    ColorStyle["bgCyan"] = "bgCyan";
    ColorStyle["bgWhite"] = "bgWhite";
    ColorStyle["bgGrey"] = "bgGrey";
})(ColorStyle = exports.ColorStyle || (exports.ColorStyle = {}));
function ColorsSupported() {
    // Checks for basic color support
    if (typeof process_1.default === 'undefined' || !process_1.default.stdout || !process_1.default.env || !process_1.default.platform || process_1.default.platform === 'browser') {
        return false;
    }
    if (process_1.default.platform === 'win32') {
        return true;
    }
    const env = process_1.default.env;
    if (env.COLORTERM) {
        return true;
    }
    if (env.TERM === 'dumb') {
        return false;
    }
    if (env.CI || env.TEAMCITY_VERSION) {
        return !!env.TRAVIS;
    }
    if (['iTerm.app', 'HyperTerm', 'Hyper', 'MacTerm', 'Apple_Terminal', 'vscode'].includes(env.TERM_PROGRAM)) {
        return true;
    }
    if (/^xterm-256|^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return true;
    }
    return false;
}
exports.ColorsSupported = ColorsSupported;
let _enabled = ColorsSupported();
function SetColorsEnabled(enabled) {
    _enabled = ColorsSupported() && enabled;
}
exports.SetColorsEnabled = SetColorsEnabled;
function Colorize(str, style) {
    if (!_enabled) {
        return str;
    }
    const openCodes = [], closeCodes = [];
    const addStyle = style => {
        if (style === ColorStyle.reset) {
            openCodes.push(ResetCode.all);
        }
        else if (style in FontCode) {
            openCodes.push(FontCode[style]);
            closeCodes.push(ResetCode[style]);
        }
        else if (style in ColorCode) {
            openCodes.push(ColorCode[style]);
            closeCodes.push(ResetCode.color);
        }
        else if (style in BgColorCode) {
            openCodes.push(BgColorCode[style]);
            closeCodes.push(ResetCode.background);
        }
    };
    if (style instanceof Array) {
        style.forEach(addStyle);
    }
    else {
        addStyle(style);
    }
    // const open = '\u001b[' + openCodes.join(';') + 'm';
    // const close = '\u001b[' + closeCodes.join(';') + 'm';
    const open = openCodes.map(code => '\u001b[' + code + 'm').join('');
    const close = closeCodes.map(code => '\u001b[' + code + 'm').join('');
    // return open + str + close;
    return str.split('\n').map(line => open + line + close).join('\n');
}
exports.Colorize = Colorize;
String.prototype.colorize = function (style) {
    return Colorize(this, style);
};

},{"./process":27}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEventEmitter = void 0;
function runCallback(callback, data) {
    try {
        callback(data);
    }
    catch (err) {
        console.error(`Error in subscription callback`, err);
    }
}
class SimpleEventEmitter {
    constructor() {
        this._subscriptions = [];
        this._oneTimeEvents = new Map();
    }
    on(event, callback) {
        if (this._oneTimeEvents.has(event)) {
            return runCallback(callback, this._oneTimeEvents.get(event));
        }
        this._subscriptions.push({ event, callback, once: false });
        return this;
    }
    off(event, callback) {
        this._subscriptions = this._subscriptions.filter(s => s.event !== event || (callback && s.callback !== callback));
        return this;
    }
    once(event, callback) {
        let resolve;
        let promise = new Promise(rs => {
            if (!callback) {
                // No callback used, promise only
                resolve = rs;
            }
            else {
                // Callback used, maybe also returned promise
                resolve = (data) => {
                    rs(data); // resolve promise
                    callback(data); // trigger callback
                };
            }
        });
        if (this._oneTimeEvents.has(event)) {
            runCallback(resolve, this._oneTimeEvents.get(event));
        }
        else {
            this._subscriptions.push({ event, callback: resolve, once: true });
        }
        return promise;
    }
    emit(event, data) {
        if (this._oneTimeEvents.has(event)) {
            throw new Error(`Event "${event}" was supposed to be emitted only once`);
        }
        for (let i = 0; i < this._subscriptions.length; i++) {
            const s = this._subscriptions[i];
            if (s.event !== event) {
                continue;
            }
            try {
                s.callback(data);
            }
            catch (err) {
                console.error(`Error in subscription callback`, err);
            }
            if (s.once) {
                this._subscriptions.splice(i, 1);
                i--;
            }
        }
        return this;
    }
    emitOnce(event, data) {
        if (this._oneTimeEvents.has(event)) {
            throw new Error(`Event "${event}" was supposed to be emitted only once`);
        }
        this.emit(event, data);
        this._oneTimeEvents.set(event, data); // Mark event as being emitted once for future subscribers
        this.off(event); // Remove all listeners for this event, they won't fire again
        return this;
    }
}
exports.SimpleEventEmitter = SimpleEventEmitter;

},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStream = exports.EventPublisher = exports.EventSubscription = void 0;
class EventSubscription {
    /**
     *
     * @param stop function that stops the subscription from receiving future events
     * @param {} activated function that runs optional callback when subscription is activated, and returns a promise that resolves once activated
     */
    constructor(stop) {
        this.stop = stop;
        this._internal = {
            state: 'init',
            activatePromises: []
        };
    }
    /**
     * Notifies when subscription is activated or canceled
     * @param callback optional callback when subscription is activated or canceled
     * @returns returns a promise that resolves once activated, or rejects when it is denied (and no callback was supplied)
     */
    activated(callback) {
        if (callback) {
            this._internal.activatePromises.push({ callback });
            if (this._internal.state === 'active') {
                callback(true);
            }
            else if (this._internal.state === 'canceled') {
                callback(false, this._internal.cancelReason);
            }
        }
        // Changed behaviour: now also returns a Promise when the callback is used.
        // This allows for 1 activated call to both handle: first activation result, 
        // and any future events using the callback
        return new Promise((resolve, reject) => {
            if (this._internal.state === 'active') {
                return resolve();
            }
            else if (this._internal.state === 'canceled' && !callback) {
                return reject(new Error(this._internal.cancelReason));
            }
            this._internal.activatePromises.push({
                resolve,
                reject: callback ? () => { } : reject // Don't reject when callback is used: let callback handle this (prevents UnhandledPromiseRejection if only callback is used)
            });
        });
    }
    _setActivationState(activated, cancelReason) {
        this._internal.cancelReason = cancelReason;
        this._internal.state = activated ? 'active' : 'canceled';
        while (this._internal.activatePromises.length > 0) {
            const p = this._internal.activatePromises.shift();
            if (activated) {
                p.callback && p.callback(true);
                p.resolve && p.resolve();
            }
            else {
                p.callback && p.callback(false, cancelReason);
                p.reject && p.reject(cancelReason);
            }
        }
    }
}
exports.EventSubscription = EventSubscription;
class EventPublisher {
    /**
     *
     * @param publish function that publishes a new value to subscribers, return if there are any active subscribers
     * @param start function that notifies subscribers their subscription is activated
     * @param cancel function that notifies subscribers their subscription has been canceled, removes all subscriptions
     */
    constructor(publish, start, cancel) {
        this.publish = publish;
        this.start = start;
        this.cancel = cancel;
    }
}
exports.EventPublisher = EventPublisher;
class EventStream {
    /**
     *
     * @param eventPublisherCallback
     */
    constructor(eventPublisherCallback) {
        const subscribers = [];
        let noMoreSubscribersCallback;
        let activationState;
        const _stoppedState = 'stopped (no more subscribers)';
        this.subscribe = (callback, activationCallback) => {
            if (typeof callback !== "function") {
                throw new TypeError("callback must be a function");
            }
            else if (activationState === _stoppedState) {
                throw new Error("stream can't be used anymore because all subscribers were stopped");
            }
            const sub = {
                callback,
                activationCallback: function (activated, cancelReason) {
                    activationCallback && activationCallback(activated, cancelReason);
                    this.subscription._setActivationState(activated, cancelReason);
                },
                subscription: new EventSubscription(function stop() {
                    subscribers.splice(subscribers.indexOf(this), 1);
                    return checkActiveSubscribers();
                })
            };
            subscribers.push(sub);
            if (typeof activationState !== 'undefined') {
                if (activationState === true) {
                    activationCallback && activationCallback(true);
                    sub.subscription._setActivationState(true);
                }
                else if (typeof activationState === 'string') {
                    activationCallback && activationCallback(false, activationState);
                    sub.subscription._setActivationState(false, activationState);
                }
            }
            return sub.subscription;
        };
        const checkActiveSubscribers = () => {
            let ret;
            if (subscribers.length === 0) {
                ret = noMoreSubscribersCallback && noMoreSubscribersCallback();
                activationState = _stoppedState;
            }
            return Promise.resolve(ret);
        };
        this.unsubscribe = (callback) => {
            const remove = callback
                ? subscribers.filter(sub => sub.callback === callback)
                : subscribers;
            remove.forEach(sub => {
                const i = subscribers.indexOf(sub);
                subscribers.splice(i, 1);
            });
            checkActiveSubscribers();
        };
        this.stop = () => {
            // Stop (remove) all subscriptions
            subscribers.splice(0);
            checkActiveSubscribers();
        };
        /**
         * For publishing side: adds a value that will trigger callbacks to all subscribers
         * @param {any} val
         * @returns {boolean} returns whether there are subscribers left
         */
        const publish = (val) => {
            subscribers.forEach(sub => {
                try {
                    sub.callback(val);
                }
                catch (err) {
                    console.error(`Error running subscriber callback: ${err.message}`);
                }
            });
            if (subscribers.length === 0) {
                checkActiveSubscribers();
            }
            return subscribers.length > 0;
        };
        /**
         * For publishing side: let subscribers know their subscription is activated. Should be called only once
         */
        const start = (allSubscriptionsStoppedCallback) => {
            activationState = true;
            noMoreSubscribersCallback = allSubscriptionsStoppedCallback;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(true);
            });
        };
        /**
         * For publishing side: let subscribers know their subscription has been canceled. Should be called only once
         */
        const cancel = (reason) => {
            activationState = reason;
            subscribers.forEach(sub => {
                sub.activationCallback && sub.activationCallback(false, reason || new Error('unknown reason'));
            });
            subscribers.splice(0); // Clear all
        };
        const publisher = new EventPublisher(publish, start, cancel);
        eventPublisherCallback(publisher);
    }
}
exports.EventStream = EventStream;

},{}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transport = void 0;
const path_reference_1 = require("./path-reference");
const utils_1 = require("./utils");
const ascii85_1 = require("./ascii85");
const path_info_1 = require("./path-info");
exports.Transport = {
    deserialize(data) {
        if (data.map === null || typeof data.map === "undefined") {
            return data.val;
        }
        const deserializeValue = (type, val) => {
            if (type === "date") {
                // Date was serialized as a string (UTC)
                return new Date(val);
            }
            else if (type === "binary") {
                // ascii85 encoded binary data
                return ascii85_1.ascii85.decode(val);
            }
            else if (type === "reference") {
                return new path_reference_1.PathReference(val);
            }
            else if (type === "regexp") {
                return new RegExp(val.pattern, val.flags);
            }
            return val;
        };
        if (typeof data.map === "string") {
            // Single value
            return deserializeValue(data.map, data.val);
        }
        Object.keys(data.map).forEach(path => {
            const type = data.map[path];
            const keys = path_info_1.PathInfo.getPathKeys(path);
            let parent = data;
            let key = "val";
            let val = data.val;
            keys.forEach(k => {
                key = k;
                parent = val;
                val = val[key]; // If an error occurs here, there's something wrong with the calling code...
            });
            parent[key] = deserializeValue(type, val);
        });
        return data.val;
    },
    serialize(obj) {
        // Recursively find dates and binary data
        if (obj === null || typeof obj !== "object" || obj instanceof Date || obj instanceof ArrayBuffer || obj instanceof path_reference_1.PathReference) {
            // Single value
            const ser = this.serialize({ value: obj });
            return {
                map: ser.map.value,
                val: ser.val.value
            };
        }
        obj = utils_1.cloneObject(obj); // Make sure we don't alter the original object
        const process = (obj, mappings, prefix) => {
            Object.keys(obj).forEach(key => {
                const val = obj[key];
                const path = prefix.length === 0 ? key : `${prefix}/${key}`;
                if (val instanceof Date) {
                    // serialize date to UTC string
                    obj[key] = val.toISOString();
                    mappings[path] = "date";
                }
                else if (val instanceof ArrayBuffer) {
                    // Serialize binary data with ascii85
                    obj[key] = ascii85_1.ascii85.encode(val); //ascii85.encode(Buffer.from(val)).toString();
                    mappings[path] = "binary";
                }
                else if (val instanceof path_reference_1.PathReference) {
                    obj[key] = val.path;
                    mappings[path] = "reference";
                }
                else if (val instanceof RegExp) {
                    // Queries using the 'matches' filter with a regular expression can now also be used on remote db's
                    obj[key] = { pattern: val.source, flags: val.flags };
                    mappings[path] = "regexp";
                }
                else if (typeof val === "object" && val !== null) {
                    process(val, mappings, path);
                }
            });
        };
        const mappings = {};
        process(obj, mappings, "");
        return {
            map: mappings,
            val: obj
        };
    }
};

},{"./ascii85":14,"./path-info":25,"./path-reference":26,"./utils":34}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMappings = void 0;
const utils_1 = require("./utils");
const path_info_1 = require("./path-info");
const data_reference_1 = require("./data-reference");
const data_snapshot_1 = require("./data-snapshot");
/**
 * (for internal use) - gets the mapping set for a specific path
 */
function get(mappings, path) {
    // path points to the mapped (object container) location
    path = path.replace(/^\/|\/$/g, ''); // trim slashes
    const keys = path_info_1.PathInfo.getPathKeys(path);
    const mappedPath = Object.keys(mappings).find(mpath => {
        const mkeys = path_info_1.PathInfo.getPathKeys(mpath);
        if (mkeys.length !== keys.length) {
            return false; // Can't be a match
        }
        return mkeys.every((mkey, index) => {
            if (mkey === '*' || mkey[0] === '$') {
                return true; // wildcard
            }
            return mkey === keys[index];
        });
    });
    const mapping = mappings[mappedPath];
    return mapping;
}
;
/**
 * (for internal use) - gets the mapping set for a specific path's parent
 */
function map(mappings, path) {
    // path points to the object location, its parent should have the mapping
    const targetPath = path_info_1.PathInfo.get(path).parentPath;
    if (targetPath === null) {
        return;
    }
    return get(mappings, targetPath);
}
;
/**
 * (for internal use) - gets all mappings set for a specific path and all subnodes
 * @returns returns array of all matched mappings in path
 */
function mapDeep(mappings, entryPath) {
    // returns mapping for this node, and all mappings for nested nodes
    // entryPath: "users/ewout"
    // mappingPath: "users"
    // mappingPath: "users/*/posts"
    entryPath = entryPath.replace(/^\/|\/$/g, ''); // trim slashes
    // Start with current path's parent node
    const pathInfo = path_info_1.PathInfo.get(entryPath);
    const startPath = pathInfo.parentPath;
    const keys = startPath ? path_info_1.PathInfo.getPathKeys(startPath) : [];
    // Every path that starts with startPath, is a match
    // TODO: refactor to return Object.keys(mappings),filter(...)
    const matches = Object.keys(mappings).reduce((m, mpath) => {
        //const mkeys = mpath.length > 0 ? mpath.split("/") : [];
        const mkeys = path_info_1.PathInfo.getPathKeys(mpath);
        if (mkeys.length < keys.length) {
            return m; // Can't be a match
        }
        let isMatch = true;
        if (keys.length === 0 && startPath !== null) {
            // Only match first node's children if mapping pattern is "*" or "$variable"
            isMatch = mkeys.length === 1 && (mkeys[0] === '*' || mkeys[0][0] === '$');
        }
        else {
            mkeys.every((mkey, index) => {
                if (index >= keys.length) {
                    return false; // stop .every loop
                }
                else if (mkey === '*' || mkey[0] === '$' || mkey === keys[index]) {
                    return true; // continue .every loop
                }
                else {
                    isMatch = false;
                    return false; // stop .every loop
                }
            });
        }
        if (isMatch) {
            const mapping = mappings[mpath];
            m.push({ path: mpath, type: mapping });
        }
        return m;
    }, []);
    return matches;
}
;
/**
 * (for internal use) - serializes or deserializes an object using type mappings
 * @returns returns the (de)serialized value
 */
function process(db, mappings, path, obj, action) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    const keys = path_info_1.PathInfo.getPathKeys(path); // path.length > 0 ? path.split("/") : [];
    const m = mapDeep(mappings, path);
    const changes = [];
    m.sort((a, b) => path_info_1.PathInfo.getPathKeys(a.path).length > path_info_1.PathInfo.getPathKeys(b.path).length ? -1 : 1); // Deepest paths first
    m.forEach(mapping => {
        const mkeys = path_info_1.PathInfo.getPathKeys(mapping.path); //mapping.path.length > 0 ? mapping.path.split("/") : [];
        mkeys.push('*');
        const mTrailKeys = mkeys.slice(keys.length);
        if (mTrailKeys.length === 0) {
            const vars = path_info_1.PathInfo.extractVariables(mapping.path, path);
            const ref = new data_reference_1.DataReference(db, path, vars);
            if (action === 'serialize') {
                // serialize this object
                obj = mapping.type.serialize(obj, ref);
            }
            else if (action === 'deserialize') {
                // deserialize this object
                const snap = new data_snapshot_1.DataSnapshot(ref, obj);
                obj = mapping.type.deserialize(snap);
            }
            return;
        }
        // Find all nested objects at this trail path
        const process = (parentPath, parent, keys) => {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            const key = keys[0];
            let children = [];
            if (key === '*' || key[0] === '$') {
                // Include all children
                if (parent instanceof Array) {
                    children = parent.map((val, index) => ({ key: index, val }));
                }
                else {
                    children = Object.keys(parent).map(k => ({ key: k, val: parent[k] }));
                }
            }
            else {
                // Get the 1 child
                const child = parent[key];
                if (typeof child === 'object') {
                    children.push({ key, val: child });
                }
            }
            children.forEach(child => {
                const childPath = path_info_1.PathInfo.getChildPath(parentPath, child.key);
                const vars = path_info_1.PathInfo.extractVariables(mapping.path, childPath);
                const ref = new data_reference_1.DataReference(db, childPath, vars);
                if (keys.length === 1) {
                    // TODO: this alters the existing object, we must build our own copy!
                    if (action === 'serialize') {
                        // serialize this object
                        changes.push({ parent, key: child.key, original: parent[child.key] });
                        parent[child.key] = mapping.type.serialize(child.val, ref);
                    }
                    else if (action === 'deserialize') {
                        // deserialize this object
                        const snap = new data_snapshot_1.DataSnapshot(ref, child.val);
                        parent[child.key] = mapping.type.deserialize(snap);
                    }
                }
                else {
                    // Dig deeper
                    process(childPath, child.val, keys.slice(1));
                }
            });
        };
        process(path, obj, mTrailKeys);
    });
    if (action === "serialize") {
        // Clone this serialized object so any types that remained
        // will become plain objects without functions, and we can restore
        // the original object's values if any mappings were processed.
        // This will also prevent circular references
        obj = utils_1.cloneObject(obj);
        if (changes.length > 0) {
            // Restore the changes made to the original object
            changes.forEach(change => {
                change.parent[change.key] = change.original;
            });
        }
    }
    return obj;
}
;
const _mappings = Symbol("mappings");
class TypeMappings {
    /**
     *
     * @param {AceBaseBase} db
     */
    constructor(db) {
        this.db = db;
        this[_mappings] = {};
    }
    get mappings() { return this[_mappings]; }
    map(path) {
        return map(this[_mappings], path);
    }
    /**
     * Maps objects that are stored in a specific path to a class, so they can automatically be
     * serialized when stored to, and deserialized (instantiated) when loaded from the database.
     * @param path path to an object container, eg "users" or "users/*\/posts"
     * @param type class to bind all child objects of path to
     * @param options (optional) You can specify the functions to use to
     * serialize and/or instantiate your class. If you do not specificy a creator (constructor) method,
     * AceBase will call YourClass.create(obj, ref) method if it exists, or execute: new YourClass(obj, ref).
     * If you do not specifiy a serializer method, AceBase will call YourClass.prototype.serialize(ref) if it
     * exists, or tries storing your object's fields unaltered. NOTE: 'this' in your creator function will point
     * to YourClass, and 'this' in your serializer function will point to the instance of YourClass.
     */
    bind(path, type, options = {}) {
        // Maps objects that are stored in a specific path to a constructor method,
        // so they are automatically deserialized
        if (typeof path !== "string") {
            throw new TypeError("path must be a string");
        }
        if (typeof type !== "function") {
            throw new TypeError("constructor must be a function");
        }
        if (typeof options.serializer === 'undefined') {
            // if (typeof type.prototype.serialize === 'function') {
            //     // Use .serialize instance method
            //     options.serializer = type.prototype.serialize;
            // }
            // Use object's serialize method upon serialization (if available)
        }
        else if (typeof options.serializer === 'string') {
            if (typeof type.prototype[options.serializer] === 'function') {
                options.serializer = type.prototype[options.serializer];
            }
            else {
                throw new TypeError(`${type.name}.prototype.${options.serializer} is not a function, cannot use it as serializer`);
            }
        }
        else if (typeof options.serializer !== 'function') {
            throw new TypeError(`serializer for class ${type.name} must be a function, or the name of a prototype method`);
        }
        if (typeof options.creator === 'undefined') {
            if (typeof type.create === 'function') {
                // Use static .create as creator method
                options.creator = type.create;
            }
        }
        else if (typeof options.creator === 'string') {
            if (typeof type[options.creator] === 'function') {
                options.creator = type[options.creator];
            }
            else {
                throw new TypeError(`${type.name}.${options.creator} is not a function, cannot use it as creator`);
            }
        }
        else if (typeof options.creator !== 'function') {
            throw new TypeError(`creator for class ${type.name} must be a function, or the name of a static method`);
        }
        path = path.replace(/^\/|\/$/g, ""); // trim slashes
        this[_mappings][path] = {
            db: this.db,
            type,
            creator: options.creator,
            serializer: options.serializer,
            deserialize(snap) {
                // run constructor method
                let obj;
                if (this.creator) {
                    obj = this.creator.call(this.type, snap);
                }
                else {
                    obj = new this.type(snap);
                }
                return obj;
            },
            serialize(obj, ref) {
                if (this.serializer) {
                    obj = this.serializer.call(obj, ref, obj);
                }
                else if (obj && typeof obj.serialize === 'function') {
                    obj = obj.serialize(ref, obj);
                }
                return obj;
            }
        };
    }
    /**
     * Serializes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to serialize
     */
    serialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, "serialize");
    }
    /**
     * Deserialzes any child in given object that has a type mapping
     * @param {string} path | path to the object's location
     * @param {object} obj | object to deserialize
     */
    deserialize(path, obj) {
        return process(this.db, this[_mappings], path, obj, "deserialize");
    }
}
exports.TypeMappings = TypeMappings;

},{"./data-reference":19,"./data-snapshot":20,"./path-info":25,"./utils":34}],34:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defer = exports.getChildValues = exports.compareValues = exports.cloneObject = exports.concatTypedArrays = exports.decodeString = exports.encodeString = exports.bytesToNumber = exports.numberToBytes = void 0;
const path_reference_1 = require("./path-reference");
const process_1 = require("./process");
function numberToBytes(number) {
    const bytes = new Uint8Array(8);
    const view = new DataView(bytes.buffer);
    view.setFloat64(0, number);
    return new Array(...bytes);
}
exports.numberToBytes = numberToBytes;
function bytesToNumber(bytes) {
    //if (bytes.length !== 8) { throw "passed value must contain 8 bytes"; }
    if (bytes.length < 8) {
        throw new TypeError("must be 8 bytes");
        // // Pad with zeroes
        // let padding = new Uint8Array(8 - bytes.length);
        // for(let i = 0; i < padding.length; i++) { padding[i] = 0; }
        // bytes = concatTypedArrays(bytes, padding);
    }
    const bin = new Uint8Array(bytes);
    const view = new DataView(bin.buffer);
    const nr = view.getFloat64(0);
    return nr;
}
exports.bytesToNumber = bytesToNumber;
/**
 * Converts a string to a utf-8 encoded Uint8Array
 */
function encodeString(str) {
    if (typeof TextEncoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextEncoder)
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }
    else if (typeof Buffer === 'function') {
        // Node.js
        const buf = Buffer.from(str, 'utf-8');
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    else {
        // Older browsers. Manually encode
        let arr = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code > 128) {
                // Attempt simple UTF-8 conversion. See https://en.wikipedia.org/wiki/UTF-8
                if ((code & 0xd800) === 0xd800) {
                    // code starts with 1101 10...: this is a 2-part utf-16 char code
                    const nextCode = str.charCodeAt(i + 1);
                    if ((nextCode & 0xdc00) !== 0xdc00) {
                        // next code must start with 1101 11...
                        throw new Error('follow-up utf-16 character does not start with 0xDC00');
                    }
                    i++;
                    const p1 = code & 0x3ff; // Only use last 10 bits
                    const p2 = nextCode & 0x3ff;
                    // Create code point from these 2: (see https://en.wikipedia.org/wiki/UTF-16)
                    code = 0x10000 | (p1 << 10) | p2;
                }
                if (code < 2048) {
                    // Use 2 bytes for 11 bit value, first byte starts with 110xxxxx (0xc0), 2nd byte with 10xxxxxx (0x80)
                    const b1 = 0xc0 | ((code >> 6) & 0x1f); // 0xc0 = 11000000, 0x1f = 11111
                    const b2 = 0x80 | (code & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    arr.push(b1, b2);
                }
                else if (code < 65536) {
                    // Use 3 bytes for 16-bit value, bits per byte: 4, 6, 6
                    const b1 = 0xe0 | ((code >> 12) & 0xf); // 0xe0 = 11100000, 0xf = 1111
                    const b2 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3);
                }
                else if (code < 2097152) {
                    // Use 4 bytes for 21-bit value, bits per byte: 3, 6, 6, 6
                    const b1 = 0xf0 | ((code >> 18) & 0x7); // 0xf0 = 11110000, 0x7 = 111
                    const b2 = 0x80 | ((code >> 12) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b3 = 0x80 | ((code >> 6) & 0x3f); // 0x80 = 10000000, 0x3f = 111111
                    const b4 = 0x80 | (code & 0x3f);
                    arr.push(b1, b2, b3, b4);
                }
                else {
                    throw new Error(`Cannot convert character ${str.charAt(i)} (code ${code}) to utf-8`);
                }
            }
            else {
                arr.push(code < 128 ? code : 63); // 63 = ?
            }
        }
        return new Uint8Array(arr);
    }
}
exports.encodeString = encodeString;
/**
 * Converts a utf-8 encoded buffer to string
 */
function decodeString(buffer) {
    if (typeof TextDecoder !== 'undefined') {
        // Modern browsers, Node.js v11.0.0+ (or v8.3.0+ with util.TextDecoder)
        const decoder = new TextDecoder();
        if (buffer instanceof Uint8Array) {
            return decoder.decode(buffer);
        }
        const buf = Uint8Array.from(buffer);
        return decoder.decode(buf);
    }
    else if (typeof Buffer === 'function') {
        // Node.js
        if (buffer instanceof Buffer) {
            return buffer.toString('utf-8');
        }
        else if (buffer instanceof Array) {
            const typedArray = Uint8Array.from(buffer);
            const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength);
            return buf.toString('utf-8');
        }
        else if ('buffer' in buffer && buffer['buffer'] instanceof ArrayBuffer) {
            const buf = Buffer.from(buffer['buffer'], buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            return buf.toString('utf-8');
        }
        else {
            throw new Error(`Unsupported buffer argument`);
        }
    }
    else {
        // Older browsers. Manually decode!
        if (!(buffer instanceof Uint8Array) && 'buffer' in buffer && buffer['buffer'] instanceof ArrayBuffer) {
            // Convert TypedArray to Uint8Array
            buffer = new Uint8Array(buffer['buffer'], buffer.byteOffset, buffer.byteLength);
        }
        if (buffer instanceof Buffer || buffer instanceof Array || buffer instanceof Uint8Array) {
            let str = '';
            for (let i = 0; i < buffer.length; i++) {
                let code = buffer[i];
                if (code > 128) {
                    // Decode Unicode character
                    if ((code & 0xf0) === 0xf0) {
                        // 4 byte char
                        const b1 = code, b2 = buffer[i + 1], b3 = buffer[i + 2], b4 = buffer[i + 3];
                        code = ((b1 & 0x7) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
                        i += 3;
                    }
                    else if ((code & 0xe0) === 0xe0) {
                        // 3 byte char
                        const b1 = code, b2 = buffer[i + 1], b3 = buffer[i + 2];
                        code = ((b1 & 0xf) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
                        i += 2;
                    }
                    else if ((code & 0xc0) === 0xc0) {
                        // 2 byte char
                        const b1 = code, b2 = buffer[i + 1];
                        code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
                        i++;
                    }
                    else {
                        throw new Error(`invalid utf-8 data`);
                    }
                }
                if (code >= 65536) {
                    // Split into 2-part utf-16 char codes
                    code ^= 0x10000;
                    const p1 = 0xd800 | (code >> 10);
                    const p2 = 0xdc00 | (code & 0x3ff);
                    str += String.fromCharCode(p1);
                    str += String.fromCharCode(p2);
                }
                else {
                    str += String.fromCharCode(code);
                }
            }
            return str;
        }
        else {
            throw new Error(`Unsupported buffer argument`);
        }
    }
}
exports.decodeString = decodeString;
function concatTypedArrays(a, b) {
    const c = new a.constructor(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}
exports.concatTypedArrays = concatTypedArrays;
function cloneObject(original, stack) {
    const { DataSnapshot } = require('./data-snapshot'); // Don't move to top, because data-snapshot requires this script (utils)
    if (original instanceof DataSnapshot) {
        throw new TypeError(`Object to clone is a DataSnapshot (path "${original.ref.path}")`);
    }
    const checkAndFixTypedArray = obj => {
        if (obj !== null && typeof obj === 'object'
            && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string'
            && ['Buffer', 'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'BigUint64Array', 'BigInt64Array'].includes(obj.constructor.name)) {
            // FIX for typed array being converted to objects with numeric properties:
            // Convert Buffer or TypedArray to ArrayBuffer
            obj = obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
        }
        return obj;
    };
    original = checkAndFixTypedArray(original);
    if (typeof original !== "object" || original === null || original instanceof Date || original instanceof ArrayBuffer || original instanceof path_reference_1.PathReference || original instanceof RegExp) {
        return original;
    }
    const cloneValue = (val) => {
        if (stack.indexOf(val) >= 0) {
            throw new ReferenceError(`object contains a circular reference`);
        }
        val = checkAndFixTypedArray(val);
        if (val === null || val instanceof Date || val instanceof ArrayBuffer || val instanceof path_reference_1.PathReference || val instanceof RegExp) { // || val instanceof ID
            return val;
        }
        else if (val instanceof Array) {
            stack.push(val);
            val = val.map(item => cloneValue(item));
            stack.pop();
            return val;
        }
        else if (typeof val === "object") {
            stack.push(val);
            val = cloneObject(val, stack);
            stack.pop();
            return val;
        }
        else {
            return val; // Anything other can just be copied
        }
    };
    if (typeof stack === "undefined") {
        stack = [original];
    }
    const clone = original instanceof Array ? [] : {};
    Object.keys(original).forEach(key => {
        let val = original[key];
        if (typeof val === "function") {
            return; // skip functions
        }
        clone[key] = cloneValue(val);
    });
    return clone;
}
exports.cloneObject = cloneObject;
function compareValues(oldVal, newVal) {
    const voids = [undefined, null];
    const isTypedArray = val => typeof val === 'object' && ['ArrayBuffer', 'Buffer', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array'].includes(val.constructor.name);
    if (oldVal === newVal) {
        return "identical";
    }
    else if (voids.indexOf(oldVal) >= 0 && voids.indexOf(newVal) < 0) {
        return "added";
    }
    else if (voids.indexOf(oldVal) < 0 && voids.indexOf(newVal) >= 0) {
        return "removed";
    }
    else if (typeof oldVal !== typeof newVal) {
        return "changed";
    }
    else if (isTypedArray(oldVal) || isTypedArray(newVal)) {
        // One or both values are typed arrays.
        if (!isTypedArray(oldVal) || !isTypedArray(newVal)) {
            return "changed";
        }
        // Both are typed. Compare lengths and byte content of typed arrays
        const typed1 = oldVal instanceof Uint8Array ? oldVal : oldVal instanceof ArrayBuffer ? new Uint8Array(oldVal) : new Uint8Array(oldVal.buffer, oldVal.byteOffset, oldVal.byteLength);
        const typed2 = newVal instanceof Uint8Array ? newVal : newVal instanceof ArrayBuffer ? new Uint8Array(newVal) : new Uint8Array(newVal.buffer, newVal.byteOffset, newVal.byteLength);
        if (typed1.byteLength !== typed2.byteLength) {
            return "changed";
        }
        return typed1.some((val, i) => typed2[i] !== val) ? "changed" : "identical";
    }
    else if (oldVal instanceof Date || newVal instanceof Date) {
        // One or both values are dates
        if (!(oldVal instanceof Date) || !(newVal instanceof Date)) {
            return "changed";
        }
        // Both are dates
        return oldVal.getTime() !== newVal.getTime() ? "changed" : "identical";
    }
    else if (typeof oldVal === "object") {
        // Do key-by-key comparison of objects
        const isArray = oldVal instanceof Array;
        const getKeys = obj => {
            let keys = Object.keys(obj).filter(key => !voids.includes(obj[key]));
            if (isArray) {
                keys = keys.map((v) => parseInt(v));
            }
            return keys;
        };
        const oldKeys = getKeys(oldVal);
        const newKeys = getKeys(newVal);
        const removedKeys = oldKeys.filter(key => !newKeys.includes(key));
        const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
        const changedKeys = newKeys.reduce((changed, key) => {
            if (oldKeys.includes(key)) {
                const val1 = oldVal[key];
                const val2 = newVal[key];
                const c = compareValues(val1, val2);
                if (c !== "identical") {
                    changed.push({ key, change: c });
                }
            }
            return changed;
        }, []);
        if (addedKeys.length === 0 && removedKeys.length === 0 && changedKeys.length === 0) {
            return "identical";
        }
        else {
            return {
                added: addedKeys,
                removed: removedKeys,
                changed: changedKeys
            };
        }
    }
    else if (oldVal !== newVal) {
        return "changed";
    }
    return "identical";
}
exports.compareValues = compareValues;
function getChildValues(childKey, oldValue, newValue) {
    oldValue = oldValue === null ? null : oldValue[childKey];
    if (typeof oldValue === 'undefined') {
        oldValue = null;
    }
    newValue = newValue === null ? null : newValue[childKey];
    if (typeof newValue === 'undefined') {
        newValue = null;
    }
    return { oldValue, newValue };
}
exports.getChildValues = getChildValues;
;
function defer(fn) {
    process_1.default.nextTick(fn);
}
exports.defer = defer;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./data-snapshot":20,"./path-reference":26,"./process":27,"buffer":37}],35:[function(require,module,exports){

},{}],36:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],37:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":36,"buffer":37,"ieee754":38}],38:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}]},{},[5])(5)
});
