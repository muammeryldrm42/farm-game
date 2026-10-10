"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[197],{5920:function(e,t,r){e.exports=r.p+"static/media/draco_decoder.96492c02.js"},3780:function(e,t,r){e.exports=r.p+"static/media/draco_wasm_wrapper.3e7c5a92.js"},9366:function(e,t,r){e.exports=r.p+"static/media/draco_wasm_wrapper.b60f4160.js"},7459:function(e,t,r){e.exports=r.p+"static/media/draco_decoder.a53898c5.wasm"},1138:function(e,t,r){e.exports=r.p+"static/media/draco_decoder.a2169f50.wasm"},663:function(e,t,r){r.d(t,{g:function(){return i}});let i=(0,r(6689).fo)("App",{web:()=>r.e(230).then(r.bind(r,7230)).then(e=>new e.AppWeb)})},6689:function(e,t,r){var i,s,a,n,o,l;let u;r.d(t,{Uw:function(){return p},dV:function(){return d},fo:function(){return f}}),(n=i||(i={})).Unimplemented="UNIMPLEMENTED",n.Unavailable="UNAVAILABLE";class h extends Error{constructor(e,t,r){super(e),this.message=e,this.code=t,this.data=r}}let c=e=>{var t,r;return(null==e?void 0:e.androidBridge)?"android":(null===(r=null===(t=null==e?void 0:e.webkit)||void 0===t?void 0:t.messageHandlers)||void 0===r?void 0:r.bridge)?"ios":"web"},d=(u="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==r.g?r.g:{}).Capacitor=(e=>{let t=e.CapacitorCustomPlatform||null,r=e.Capacitor||{},s=r.Plugins=r.Plugins||{},a=()=>null!==t?t.name:c(e),n=e=>{var t;return null===(t=r.PluginHeaders)||void 0===t?void 0:t.find(t=>t.name===e)},o=new Map;return r.convertFileSrc||(r.convertFileSrc=e=>e),r.getPlatform=a,r.handleError=t=>e.console.error(t),r.isNativePlatform=()=>"web"!==a(),r.isPluginAvailable=e=>{let t=o.get(e);return!!((null==t?void 0:t.platforms.has(a()))||n(e))},r.registerPlugin=(e,l={})=>{let u;let c=o.get(e);if(c)return console.warn(`Capacitor plugin "${e}" already registered. Cannot register plugins twice.`),c.proxy;let d=a(),f=n(e),p=async()=>(!u&&d in l?u=u="function"==typeof l[d]?await l[d]():l[d]:null!==t&&!u&&"web"in l&&(u=u="function"==typeof l.web?await l.web():l.web),u),m=(t,s)=>{var a,n;if(f){let i=null==f?void 0:f.methods.find(e=>s===e.name);if(i)return"promise"===i.rtype?t=>r.nativePromise(e,s.toString(),t):(t,i)=>r.nativeCallback(e,s.toString(),t,i);if(t)return null===(a=t[s])||void 0===a?void 0:a.bind(t)}else if(t)return null===(n=t[s])||void 0===n?void 0:n.bind(t);else throw new h(`"${e}" plugin is not implemented on ${d}`,i.Unimplemented)},g=t=>{let r;let s=(...s)=>{let a=p().then(a=>{let n=m(a,t);if(n){let e=n(...s);return r=null==e?void 0:e.remove,e}throw new h(`"${e}.${t}()" is not implemented on ${d}`,i.Unimplemented)});return"addListener"===t&&(a.remove=async()=>r()),a};return s.toString=()=>`${t.toString()}() { [capacitor code] }`,Object.defineProperty(s,"name",{value:t,writable:!1,configurable:!1}),s},v=g("addListener"),T=g("removeListener"),x=(e,t)=>{let r=v({eventName:e},t),i=async()=>{T({eventName:e,callbackId:await r},t)},s=new Promise(e=>r.then(()=>e({remove:i})));return s.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await i()},s},_=new Proxy({},{get(e,t){switch(t){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return f?x:v;case"removeListener":return T;default:return g(t)}}});return s[e]=_,o.set(e,{name:e,proxy:_,platforms:new Set([...Object.keys(l),...f?[d]:[]])}),_},r.Exception=h,r.DEBUG=!!r.DEBUG,r.isLoggingEnabled=!!r.isLoggingEnabled,r})(u),f=d.registerPlugin;class p{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,t){let r=!1;this.listeners[e]||(this.listeners[e]=[],r=!0),this.listeners[e].push(t);let i=this.windowListeners[e];return i&&!i.registered&&this.addWindowListener(i),r&&this.sendRetainedArgumentsForEvent(e),Promise.resolve({remove:async()=>this.removeListener(e,t)})}async removeAllListeners(){for(let e in this.listeners={},this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,t,r){let i=this.listeners[e];if(!i){if(r){let r=this.retainedEventArguments[e];r||(r=[]),r.push(t),this.retainedEventArguments[e]=r}return}i.forEach(e=>e(t))}hasListeners(e){var t;return!!(null===(t=this.listeners[e])||void 0===t?void 0:t.length)}registerWindowListener(e,t){this.windowListeners[t]={registered:!1,windowEventName:e,pluginEventName:t,handler:e=>{this.notifyListeners(t,e)}}}unimplemented(e="not implemented"){return new d.Exception(e,i.Unimplemented)}unavailable(e="not available"){return new d.Exception(e,i.Unavailable)}async removeListener(e,t){let r=this.listeners[e];if(!r)return;let i=r.indexOf(t);-1!==i&&this.listeners[e].splice(i,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){let t=this.retainedEventArguments[e];t&&(delete this.retainedEventArguments[e],t.forEach(t=>{this.notifyListeners(e,t)}))}}let m=e=>encodeURIComponent(e).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),g=e=>e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class v extends p{async getCookies(){let e=document.cookie,t={};return e.split(";").forEach(e=>{if(e.length<=0)return;let[r,i]=e.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");r=g(r).trim(),i=g(i).trim(),t[r]=i}),t}async setCookie(e){try{let t=m(e.key),r=m(e.value),i=e.expires?`; expires=${e.expires.replace("expires=","")}`:"",s=(e.path||"/").replace("path=",""),a=null!=e.url&&e.url.length>0?`domain=${e.url}`:"";document.cookie=`${t}=${r||""}${i}; path=${s}; ${a};`}catch(e){return Promise.reject(e)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(e){return Promise.reject(e)}}async clearCookies(){try{for(let e of document.cookie.split(";")||[])document.cookie=e.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}}f("CapacitorCookies",{web:()=>new v});let T=async e=>new Promise((t,r)=>{let i=new FileReader;i.onload=()=>{let e=i.result;t(e.indexOf(",")>=0?e.split(",")[1]:e)},i.onerror=e=>r(e),i.readAsDataURL(e)}),x=(e={})=>{let t=Object.keys(e);return Object.keys(e).map(e=>e.toLocaleLowerCase()).reduce((r,i,s)=>(r[i]=e[t[s]],r),{})},_=(e,t=!0)=>e?Object.entries(e).reduce((e,r)=>{let i,s;let[a,n]=r;return Array.isArray(n)?(s="",n.forEach(e=>{i=t?encodeURIComponent(e):e,s+=`${a}=${i}&`}),s.slice(0,-1)):(i=t?encodeURIComponent(n):n,s=`${a}=${i}`),`${e}&${s}`},"").substr(1):null,w=(e,t={})=>{let r=Object.assign({method:e.method||"GET",headers:e.headers},t),i=x(e.headers)["content-type"]||"";if("string"==typeof e.data)r.body=e.data;else if(i.includes("application/x-www-form-urlencoded")){let t=new URLSearchParams;for(let[r,i]of Object.entries(e.data||{}))t.set(r,i);r.body=t.toString()}else if(i.includes("multipart/form-data")||e.data instanceof FormData){let t=new FormData;if(e.data instanceof FormData)e.data.forEach((e,r)=>{t.append(r,e)});else for(let r of Object.keys(e.data))t.append(r,e.data[r]);r.body=t;let i=new Headers(r.headers);i.delete("content-type"),r.headers=i}else(i.includes("application/json")||"object"==typeof e.data)&&(r.body=JSON.stringify(e.data));return r};class b extends p{async request(e){let t,r;let i=w(e,e.webFetchExtra),s=_(e.params,e.shouldEncodeUrlParams),a=s?`${e.url}?${s}`:e.url,n=await fetch(a,i),o=n.headers.get("content-type")||"",{responseType:l="text"}=n.ok?e:{};switch(o.includes("application/json")&&(l="json"),l){case"arraybuffer":case"blob":r=await n.blob(),t=await T(r);break;case"json":t=await n.json();break;default:t=await n.text()}let u={};return n.headers.forEach((e,t)=>{u[t]=e}),{data:t,headers:u,status:n.status,url:n.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:"GET"}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:"POST"}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:"PUT"}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:"PATCH"}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:"DELETE"}))}}f("CapacitorHttp",{web:()=>new b}),(o=s||(s={})).Dark="DARK",o.Light="LIGHT",o.Default="DEFAULT",(l=a||(a={})).StatusBar="StatusBar",l.NavigationBar="NavigationBar";class E extends p{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}f("SystemBars",{web:()=>new E})},2468:function(e,t,r){r.d(t,{s:function(){return n}});var i,s,a=r(6689);(i=s||(s={}))[i.Sunday=1]="Sunday",i[i.Monday=2]="Monday",i[i.Tuesday=3]="Tuesday",i[i.Wednesday=4]="Wednesday",i[i.Thursday=5]="Thursday",i[i.Friday=6]="Friday",i[i.Saturday=7]="Saturday";let n=(0,a.fo)("LocalNotifications",{web:()=>r.e(50).then(r.bind(r,5050)).then(e=>new e.LocalNotificationsWeb)})},6207:function(e,t,r){r.d(t,{_:function(){return l}});var i=r(2079);let s=new WeakMap,a=new r.U(r(7459)).toString(),n=new r.U(r(3780)).toString(),o=new r.U(r(5920)).toString();new r.U(r(9366)).toString(),new r.U(r(1138)).toString();class l extends i.aNw{constructor(e){super(e),this.decoderPaths={js:n,wasm:a,dep_js:o},this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){let{decoderPaths:t}=this;return"object"==typeof e?(t.js=e.js,t.wasm=e.wasm,t.dep_js=null):(t.js=i.Zp0.resolveURL("draco_wasm_wrapper.js",e),t.wasm=i.Zp0.resolveURL("draco_decoder.wasm",e),t.dep_js=i.Zp0.resolveURL("draco_decoder.js",e)),this}setDecoderConfig(e){return console.warn("THREE.DRACOLoader: setDecoderConfig to has been deprecated and will be removed in r194."),this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,r,s){let a=new i.hH6(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,e=>{this.parse(e,t,s)},r,s)}parse(e,t,r=()=>{}){this.decodeDracoFile(e,t,null,null,i.KI_,r).catch(r)}decodeDracoFile(e,t,r,s,a=i.GUF,n=()=>{}){let o={attributeIDs:r||this.defaultAttributeIDs,attributeTypes:s||this.defaultAttributeTypes,useUniqueIDs:!!r,vertexColorSpace:a};return this.decodeGeometry(e,o).then(t).catch(n)}decodeGeometry(e,t){let r;let i=JSON.stringify(t);if(s.has(e)){let t=s.get(e);if(t.key===i)return t.promise;if(0===e.byteLength)throw Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let a=this.workerNextTaskID++,n=e.byteLength,o=this._getWorker(a,n).then(i=>(r=i,new Promise((i,s)=>{r._callbacks[a]={resolve:i,reject:s},r.postMessage({type:"decode",id:a,taskConfig:t,buffer:e},[e])}))).then(e=>this._createGeometry(e.geometry));return o.catch(()=>!0).then(()=>{r&&a&&this._releaseTask(r,a)}),s.set(e,{key:i,promise:o}),o}_createGeometry(e){let t=new i.u9r;e.index&&t.setIndex(new i.TlE(e.index.array,1));for(let r=0;r<e.attributes.length;r++){let s;let{name:a,array:n,itemSize:o,stride:l,vertexColorSpace:u}=e.attributes[r];if(o===l)s=new i.TlE(n,o);else{let e=new i.vpT(n,l);s=new i.kB5(e,o,0)}"color"===a&&(this._assignVertexColorSpace(s,u),s.normalized=n instanceof Float32Array==!1),t.setAttribute(a,s)}return t}_assignVertexColorSpace(e,t){if(t!==i.KI_)return;let r=new i.Ilk;for(let t=0,s=e.count;t<s;t++)r.fromBufferAttribute(e,t),i.epp.colorSpaceToWorking(r,i.KI_),e.setXYZ(t,r.r,r.g,r.b)}_loadLibrary(e,t){let r=new i.hH6(this.manager);return r.setResponseType(t),r.setWithCredentials(this.withCredentials),new Promise((t,i)=>{r.load(e,t,void 0,i)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;let e="object"!=typeof WebAssembly||"js"===this.decoderConfig.type,t=[],{decoderPaths:r}=this;if(e){if(null===r.dep_js)throw Error("THREE.DRACOLoader: WebAssembly is required when using a custom decoder paths.");t.push(this._loadLibrary(r.dep_js,"text"))}else t.push(this._loadLibrary(r.js,"text")),t.push(this._loadLibrary(r.wasm,"arraybuffer"));return this.decoderPending=Promise.all(t).then(t=>{let r=t[0];e||(this.decoderConfig.wasmBinary=t[1]);let i=u.toString(),s=["/* draco decoder */",r,"","/* worker */",i.substring(i.indexOf("{")+1,i.lastIndexOf("}"))].join("\n");this.workerSourceURL=URL.createObjectURL(new Blob([s]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){let e=new Worker(this.workerSourceURL);e._callbacks={},e._taskCosts={},e._taskLoad=0,e.postMessage({type:"init",decoderConfig:this.decoderConfig}),e.onmessage=function(t){let r=t.data;switch(r.type){case"decode":e._callbacks[r.id].resolve(r);break;case"error":e._callbacks[r.id].reject(r);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+r.type+'"')}},this.workerPool.push(e)}else this.workerPool.sort(function(e,t){return e._taskLoad>t._taskLoad?-1:1});let r=this.workerPool[this.workerPool.length-1];return r._taskCosts[e]=t,r._taskLoad+=t,r})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,""!==this.workerSourceURL&&URL.revokeObjectURL(this.workerSourceURL),this}}function u(){let e,t;onmessage=function(r){let i=r.data;switch(i.type){case"init":e=i.decoderConfig,t=new Promise(function(t){e.onModuleLoaded=function(e){t({draco:e})},DracoDecoderModule(e)});break;case"decode":let s=i.buffer,a=i.taskConfig;t.then(e=>{let t=e.draco,r=new t.Decoder;try{let e=function(e,t,r,i){let s,a;let n=i.attributeIDs,o=i.attributeTypes,l=t.GetEncodedGeometryType(r);if(l===e.TRIANGULAR_MESH)s=new e.Mesh,a=t.DecodeArrayToMesh(r,r.byteLength,s);else if(l===e.POINT_CLOUD)s=new e.PointCloud,a=t.DecodeArrayToPointCloud(r,r.byteLength,s);else throw Error("THREE.DRACOLoader: Unexpected geometry type.");if(!a.ok()||0===s.ptr)throw Error("THREE.DRACOLoader: Decoding failed: "+a.error_msg());let u={index:null,attributes:[]};for(let r in n){let a,l;let h=self[o[r]];if(i.useUniqueIDs)l=n[r],a=t.GetAttributeByUniqueId(s,l);else{if(-1===(l=t.GetAttributeId(s,e[n[r]])))continue;a=t.GetAttribute(s,l)}let c=function(e,t,r,i,s,a){let n;let o=r.num_points(),l=a.num_components(),u=function(e,t){switch(t){case Float32Array:return e.DT_FLOAT32;case Int8Array:return e.DT_INT8;case Int16Array:return e.DT_INT16;case Int32Array:return e.DT_INT32;case Uint8Array:return e.DT_UINT8;case Uint16Array:return e.DT_UINT16;case Uint32Array:return e.DT_UINT32}}(e,s),h=l*s.BYTES_PER_ELEMENT,c=4*Math.ceil(h/4),d=c/s.BYTES_PER_ELEMENT,f=o*h,p=e._malloc(f);t.GetAttributeDataArrayForAllPoints(r,a,u,f,p);let m=new s(e.HEAPF32.buffer,p,f/s.BYTES_PER_ELEMENT);if(h===c)n=m.slice();else{n=new s(o*c/s.BYTES_PER_ELEMENT);let e=0;for(let t=0,r=m.length;t<r;t++){for(let r=0;r<l;r++)n[e+r]=m[t*l+r];e+=d}}return e._free(p),{name:i,count:o,itemSize:l,array:n,stride:d}}(e,t,s,r,h,a);"color"===r&&(c.vertexColorSpace=i.vertexColorSpace),u.attributes.push(c)}return l===e.TRIANGULAR_MESH&&(u.index=function(e,t,r){let i=3*r.num_faces(),s=4*i,a=e._malloc(s);t.GetTrianglesUInt32Array(r,s,a);let n=new Uint32Array(e.HEAPF32.buffer,a,i).slice();return e._free(a),{array:n,itemSize:1}}(e,t,s)),e.destroy(s),u}(t,r,new Int8Array(s),a),n=e.attributes.map(e=>e.array.buffer);e.index&&n.push(e.index.array.buffer),self.postMessage({type:"decode",id:i.id,geometry:e},n)}catch(e){console.error(e),self.postMessage({type:"error",id:i.id,error:e.message})}finally{t.destroy(r)}})}}}},6216:function(e,t,r){r.d(t,{E:function(){return a}});var i=r(2079),s=r(1545);class a extends i.aNw{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(e){return new d(e)}),this.register(function(e){return new f(e)}),this.register(function(e){return new b(e)}),this.register(function(e){return new E(e)}),this.register(function(e){return new M(e)}),this.register(function(e){return new m(e)}),this.register(function(e){return new g(e)}),this.register(function(e){return new v(e)}),this.register(function(e){return new T(e)}),this.register(function(e){return new c(e)}),this.register(function(e){return new x(e)}),this.register(function(e){return new p(e)}),this.register(function(e){return new w(e)}),this.register(function(e){return new _(e)}),this.register(function(e){return new u(e)}),this.register(function(e){return new y(e,l.EXT_MESHOPT_COMPRESSION)}),this.register(function(e){return new y(e,l.KHR_MESHOPT_COMPRESSION)}),this.register(function(e){return new S(e)})}load(e,t,r,s){let a;let n=this;if(""!==this.resourcePath)a=this.resourcePath;else if(""!==this.path){let t=i.Zp0.extractUrlBase(e);a=i.Zp0.resolveURL(t,this.path)}else a=i.Zp0.extractUrlBase(e);this.manager.itemStart(e);let o=function(t){s?s(t):console.error(t),n.manager.itemError(e),n.manager.itemEnd(e)},l=new i.hH6(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(r){try{n.parse(r,a,function(r){t(r),n.manager.itemEnd(e)},o)}catch(e){o(e)}},r,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return -1===this.pluginCallbacks.indexOf(e)&&this.pluginCallbacks.push(e),this}unregister(e){return -1!==this.pluginCallbacks.indexOf(e)&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,r,i){let s;let a={},n={},o=new TextDecoder;if("string"==typeof e)s=JSON.parse(e);else if(e instanceof ArrayBuffer){if(o.decode(new Uint8Array(e,0,4))===R){try{a[l.KHR_BINARY_GLTF]=new A(e)}catch(e){i&&i(e);return}s=JSON.parse(a[l.KHR_BINARY_GLTF].content)}else s=JSON.parse(o.decode(e))}else s=e;if(void 0===s.asset||s.asset.version[0]<2){i&&i(Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let u=new Z(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});u.fileLoader.setRequestHeader(this.requestHeader);for(let e=0;e<this.pluginCallbacks.length;e++){let t=this.pluginCallbacks[e](u);t.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),n[t.name]=t,a[t.name]=!0}if(s.extensionsUsed)for(let e=0;e<s.extensionsUsed.length;++e){let t=s.extensionsUsed[e],r=s.extensionsRequired||[];switch(t){case l.KHR_MATERIALS_UNLIT:a[t]=new h;break;case l.KHR_DRACO_MESH_COMPRESSION:a[t]=new C(s,this.dracoLoader);break;case l.KHR_TEXTURE_TRANSFORM:a[t]=new L;break;case l.KHR_MESH_QUANTIZATION:a[t]=new D;break;default:r.indexOf(t)>=0&&void 0===n[t]&&console.warn('THREE.GLTFLoader: Unknown extension "'+t+'".')}}u.setExtensions(a),u.setPlugins(n),u.parse(r,i)}parseAsync(e,t){let r=this;return new Promise(function(i,s){r.parse(e,t,i,s)})}}function n(){let e={};return{get:function(t){return e[t]},add:function(t,r){e[t]=r},remove:function(t){delete e[t]},removeAll:function(){e={}}}}function o(e,t,r){let i=e.json.materials[t];return i.extensions&&i.extensions[r]?i.extensions[r]:null}let l={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class u{constructor(e){this.parser=e,this.name=l.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let r=0,i=t.length;r<i;r++){let i=t[r];i.extensions&&i.extensions[this.name]&&void 0!==i.extensions[this.name].light&&e._addNodeRef(this.cache,i.extensions[this.name].light)}}_loadLight(e){let t;let r=this.parser,s="light:"+e,a=r.cache.get(s);if(a)return a;let n=r.json,o=((n.extensions&&n.extensions[this.name]||{}).lights||[])[e],l=new i.Ilk(16777215);void 0!==o.color&&l.setRGB(o.color[0],o.color[1],o.color[2],i.GUF);let u=void 0!==o.range?o.range:0;switch(o.type){case"directional":(t=new i.Ox3(l)).target.position.set(0,0,-1),t.add(t.target);break;case"point":(t=new i.cek(l)).distance=u;break;case"spot":(t=new i.PMe(l)).distance=u,o.spot=o.spot||{},o.spot.innerConeAngle=void 0!==o.spot.innerConeAngle?o.spot.innerConeAngle:0,o.spot.outerConeAngle=void 0!==o.spot.outerConeAngle?o.spot.outerConeAngle:Math.PI/4,t.angle=o.spot.outerConeAngle,t.penumbra=1-o.spot.innerConeAngle/o.spot.outerConeAngle,t.target.position.set(0,0,-1),t.add(t.target);break;default:throw Error("THREE.GLTFLoader: Unexpected light type: "+o.type)}return t.position.set(0,0,0),W(t,o),void 0!==o.intensity&&(t.intensity=o.intensity),t.name=r.createUniqueName(o.name||"light_"+e),a=Promise.resolve(t),r.cache.add(s,a),a}getDependency(e,t){if("light"===e)return this._loadLight(t)}createNodeAttachment(e){let t=this,r=this.parser,i=r.json.nodes[e],s=(i.extensions&&i.extensions[this.name]||{}).light;return void 0===s?null:this._loadLight(s).then(function(e){return r._getNodeRef(t.cache,s,e)})}}class h{constructor(){this.name=l.KHR_MATERIALS_UNLIT}getMaterialType(){return i.vBJ}extendParams(e,t,r){let s=[];e.color=new i.Ilk(1,1,1),e.opacity=1;let a=t.pbrMetallicRoughness;if(a){if(Array.isArray(a.baseColorFactor)){let t=a.baseColorFactor;e.color.setRGB(t[0],t[1],t[2],i.GUF),e.opacity=t[3]}void 0!==a.baseColorTexture&&s.push(r.assignTexture(e,"map",a.baseColorTexture,i.KI_))}return Promise.all(s)}}class c{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);return null===r||void 0!==r.emissiveStrength&&(t.emissiveIntensity=r.emissiveStrength),Promise.resolve()}}class d{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let s=[];if(void 0!==r.clearcoatFactor&&(t.clearcoat=r.clearcoatFactor),void 0!==r.clearcoatTexture&&s.push(this.parser.assignTexture(t,"clearcoatMap",r.clearcoatTexture)),void 0!==r.clearcoatRoughnessFactor&&(t.clearcoatRoughness=r.clearcoatRoughnessFactor),void 0!==r.clearcoatRoughnessTexture&&s.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",r.clearcoatRoughnessTexture)),void 0!==r.clearcoatNormalTexture&&(s.push(this.parser.assignTexture(t,"clearcoatNormalMap",r.clearcoatNormalTexture)),void 0!==r.clearcoatNormalTexture.scale)){let e=r.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new i.FM8(e,e)}return Promise.all(s)}}class f{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_DISPERSION}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);return null===r||(t.dispersion=void 0!==r.dispersion?r.dispersion:0),Promise.resolve()}}class p{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let i=[];return void 0!==r.iridescenceFactor&&(t.iridescence=r.iridescenceFactor),void 0!==r.iridescenceTexture&&i.push(this.parser.assignTexture(t,"iridescenceMap",r.iridescenceTexture)),void 0!==r.iridescenceIor&&(t.iridescenceIOR=r.iridescenceIor),void 0===t.iridescenceThicknessRange&&(t.iridescenceThicknessRange=[100,400]),void 0!==r.iridescenceThicknessMinimum&&(t.iridescenceThicknessRange[0]=r.iridescenceThicknessMinimum),void 0!==r.iridescenceThicknessMaximum&&(t.iridescenceThicknessRange[1]=r.iridescenceThicknessMaximum),void 0!==r.iridescenceThicknessTexture&&i.push(this.parser.assignTexture(t,"iridescenceThicknessMap",r.iridescenceThicknessTexture)),Promise.all(i)}}class m{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_SHEEN}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let s=[];if(t.sheenColor=new i.Ilk(0,0,0),t.sheenRoughness=0,t.sheen=1,void 0!==r.sheenColorFactor){let e=r.sheenColorFactor;t.sheenColor.setRGB(e[0],e[1],e[2],i.GUF)}return void 0!==r.sheenRoughnessFactor&&(t.sheenRoughness=r.sheenRoughnessFactor),void 0!==r.sheenColorTexture&&s.push(this.parser.assignTexture(t,"sheenColorMap",r.sheenColorTexture,i.KI_)),void 0!==r.sheenRoughnessTexture&&s.push(this.parser.assignTexture(t,"sheenRoughnessMap",r.sheenRoughnessTexture)),Promise.all(s)}}class g{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let i=[];return void 0!==r.transmissionFactor&&(t.transmission=r.transmissionFactor),void 0!==r.transmissionTexture&&i.push(this.parser.assignTexture(t,"transmissionMap",r.transmissionTexture)),Promise.all(i)}}class v{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_VOLUME}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let s=[];t.thickness=void 0!==r.thicknessFactor?r.thicknessFactor:0,void 0!==r.thicknessTexture&&s.push(this.parser.assignTexture(t,"thicknessMap",r.thicknessTexture)),t.attenuationDistance=r.attenuationDistance||1/0;let a=r.attenuationColor||[1,1,1];return t.attenuationColor=new i.Ilk().setRGB(a[0],a[1],a[2],i.GUF),Promise.all(s)}}class T{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_IOR}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);return null===r||(t.ior=void 0!==r.ior?r.ior:1.5,0===t.ior&&(t.ior=1e3)),Promise.resolve()}}class x{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_SPECULAR}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let s=[];t.specularIntensity=void 0!==r.specularFactor?r.specularFactor:1,void 0!==r.specularTexture&&s.push(this.parser.assignTexture(t,"specularIntensityMap",r.specularTexture));let a=r.specularColorFactor||[1,1,1];return t.specularColor=new i.Ilk().setRGB(a[0],a[1],a[2],i.GUF),void 0!==r.specularColorTexture&&s.push(this.parser.assignTexture(t,"specularColorMap",r.specularColorTexture,i.KI_)),Promise.all(s)}}class _{constructor(e){this.parser=e,this.name=l.EXT_MATERIALS_BUMP}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let i=[];return t.bumpScale=void 0!==r.bumpFactor?r.bumpFactor:1,void 0!==r.bumpTexture&&i.push(this.parser.assignTexture(t,"bumpMap",r.bumpTexture)),Promise.all(i)}}class w{constructor(e){this.parser=e,this.name=l.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return null!==o(this.parser,e,this.name)?i.EJi:null}extendMaterialParams(e,t){let r=o(this.parser,e,this.name);if(null===r)return Promise.resolve();let i=[];return void 0!==r.anisotropyStrength&&(t.anisotropy=r.anisotropyStrength),void 0!==r.anisotropyRotation&&(t.anisotropyRotation=r.anisotropyRotation),void 0!==r.anisotropyTexture&&i.push(this.parser.assignTexture(t,"anisotropyMap",r.anisotropyTexture)),Promise.all(i)}}class b{constructor(e){this.parser=e,this.name=l.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,r=t.json,i=r.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let s=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(!(r.extensionsRequired&&r.extensionsRequired.indexOf(this.name)>=0))return null;throw Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures")}return t.loadTextureImage(e,s.source,a)}}class E{constructor(e){this.parser=e,this.name=l.EXT_TEXTURE_WEBP}loadTexture(e){let t=this.name,r=this.parser,i=r.json,s=i.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],n=i.images[a.source],o=r.textureLoader;if(n.uri){let e=r.options.manager.getHandler(n.uri);null!==e&&(o=e)}return r.loadTextureImage(e,a.source,o)}}class M{constructor(e){this.parser=e,this.name=l.EXT_TEXTURE_AVIF}loadTexture(e){let t=this.name,r=this.parser,i=r.json,s=i.textures[e];if(!s.extensions||!s.extensions[t])return null;let a=s.extensions[t],n=i.images[a.source],o=r.textureLoader;if(n.uri){let e=r.options.manager.getHandler(n.uri);null!==e&&(o=e)}return r.loadTextureImage(e,a.source,o)}}class y{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){let t=this.parser.json,r=t.bufferViews[e];if(!r.extensions||!r.extensions[this.name])return null;{let e=r.extensions[this.name],i=this.parser.getDependency("buffer",e.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(!(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0))return null;throw Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files")}return i.then(function(t){let r=e.byteOffset||0,i=e.byteLength||0,a=e.count,n=e.byteStride,o=new Uint8Array(t,r,i);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(a,n,o,e.mode,e.filter).then(function(e){return e.buffer}):s.ready.then(function(){let t=new ArrayBuffer(a*n);return s.decodeGltfBuffer(new Uint8Array(t),a,n,o,e.mode,e.filter),t})})}}}class S{constructor(e){this.name=l.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,r=t.nodes[e];if(!r.extensions||!r.extensions[this.name]||void 0===r.mesh)return null;for(let e of t.meshes[r.mesh].primitives)if(e.mode!==O.TRIANGLES&&e.mode!==O.TRIANGLE_STRIP&&e.mode!==O.TRIANGLE_FAN&&void 0!==e.mode)return null;let s=r.extensions[this.name].attributes,a=[],n={};for(let e in s)a.push(this.parser.getDependency("accessor",s[e]).then(t=>(n[e]=t,n[e])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(e=>{let t=e.pop(),r=t.isGroup?t.children:[t],s=e[0].count,a=[];for(let e of r){let t=new i.yGw,r=new i.Pa4,o=new i._fP,l=new i.Pa4(1,1,1),u=new i.SPe(e.geometry,e.material,s);for(let e=0;e<s;e++)n.TRANSLATION&&r.fromBufferAttribute(n.TRANSLATION,e),n.ROTATION&&o.fromBufferAttribute(n.ROTATION,e),n.SCALE&&l.fromBufferAttribute(n.SCALE,e),u.setMatrixAt(e,t.compose(r,o,l));let h=null;for(let e in n)if("_COLOR_0"===e){let t=n[e];u.instanceColor=new i.lb7(t.array,t.itemSize,t.normalized)}else if("TRANSLATION"!==e&&"ROTATION"!==e&&"SCALE"!==e){if(null===h){let e=u.geometry;for(let t in(h=new i.u9r).name=e.name,e.attributes)h.setAttribute(t,e.attributes[t]);for(let t in e.morphAttributes)h.morphAttributes[t]=e.morphAttributes[t];for(let t of(null!==e.index&&h.setIndex(e.index),h.morphTargetsRelative=e.morphTargetsRelative,e.groups))h.addGroup(t.start,t.count,t.materialIndex);null!==e.boundingBox&&(h.boundingBox=e.boundingBox.clone()),null!==e.boundingSphere&&(h.boundingSphere=e.boundingSphere.clone()),h.drawRange.start=e.drawRange.start,h.drawRange.count=e.drawRange.count,h.userData=Object.assign({},e.userData),u.geometry=h}let t=n[e];h.setAttribute(e,new i.lb7(t.array,t.itemSize,t.normalized))}i.Tme.prototype.copy.call(u,e),this.parser.assignFinalMaterial(u),a.push(u)}return t.isGroup?(t.clear(),t.add(...a),t):a[0]}))}}let R="glTF",P={JSON:1313821514,BIN:5130562};class A{constructor(e){this.name=l.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,12),r=new TextDecoder;if(this.header={magic:r.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==R)throw Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-12,s=new DataView(e,12),a=0;for(;a<i;){let t=s.getUint32(a,!0);a+=4;let i=s.getUint32(a,!0);if(a+=4,i===P.JSON){let i=new Uint8Array(e,12+a,t);this.content=r.decode(i)}else if(i===P.BIN){let r=12+a;this.body=e.slice(r,r+t)}a+=t}if(null===this.content)throw Error("THREE.GLTFLoader: JSON content not found.")}}class C{constructor(e,t){if(!t)throw Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=l.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let r=this.json,s=this.dracoLoader,a=e.extensions[this.name].bufferView,n=e.extensions[this.name].attributes,o={},l={},u={};for(let e in n)o[G[e]||e.toLowerCase()]=n[e];for(let t in e.attributes){let i=G[t]||t.toLowerCase();if(void 0!==n[t]){let s=r.accessors[e.attributes[t]],a=k[s.componentType];u[i]=a.name,l[i]=!0===s.normalized}}return t.getDependency("bufferView",a).then(function(e){return new Promise(function(t,r){s.decodeDracoFile(e,function(e){for(let t in e.attributes){let r=e.attributes[t],i=l[t];void 0!==i&&(r.normalized=i)}t(e)},o,u,i.GUF,r)})})}}class L{constructor(){this.name=l.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){if((void 0===t.texCoord||t.texCoord===e.channel)&&void 0===t.offset&&void 0===t.rotation&&void 0===t.scale)return e;if(e=e.clone(),void 0!==t.texCoord&&(e.channel=t.texCoord),void 0!==t.offset&&e.offset.fromArray(t.offset),void 0!==t.rotation&&(e.rotation=t.rotation),void 0!==t.scale&&e.repeat.fromArray(t.scale),void 0!==t.rotation){let t=Math.cos(e.rotation),r=Math.sin(e.rotation);e.matrix.set(e.repeat.x*t,e.repeat.y*r,e.offset.x,-e.repeat.x*r,e.repeat.y*t,e.offset.y,0,0,1),e.matrixAutoUpdate=!1}return e.needsUpdate=!0,e}}class D{constructor(){this.name=l.KHR_MESH_QUANTIZATION}}class I extends i._C8{constructor(e,t,r,i){super(e,t,r,i)}copySampleValue_(e){let t=this.resultBuffer,r=this.sampleValues,i=this.valueSize,s=e*i*3+i;for(let e=0;e!==i;e++)t[e]=r[s+e];return t}interpolate_(e,t,r,i){let s=this.resultBuffer,a=this.sampleValues,n=this.valueSize,o=2*n,l=3*n,u=i-t,h=(r-t)/u,c=h*h,d=c*h,f=e*l,p=f-l,m=-2*d+3*c,g=d-c,v=1-m,T=g-c+h;for(let e=0;e!==n;e++){let t=a[p+e+n],r=a[p+e+o]*u,i=a[f+e+n],l=a[f+e]*u;s[e]=v*t+T*r+m*i+g*l}return s}}let N=new i._fP;class U extends I{interpolate_(e,t,r,i){let s=super.interpolate_(e,t,r,i);return N.fromArray(s).normalize().toArray(s),s}}let O={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},k={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},F={9728:i.TyD,9729:i.wem,9984:i.YLQ,9985:i.qyh,9986:i.aH4,9987:i.D1R},H={33071:i.uWy,33648:i.OoA,10497:i.rpg},B={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},G={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},z={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},j={CUBICSPLINE:void 0,LINEAR:i.NMF,STEP:i.Syv},V={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function K(e,t,r){for(let i in r.extensions)void 0===e[i]&&(t.userData.gltfExtensions=t.userData.gltfExtensions||{},t.userData.gltfExtensions[i]=r.extensions[i])}function W(e,t){void 0!==t.extras&&("object"==typeof t.extras?Object.assign(e.userData,t.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+t.extras))}function X(e){let t="",r=Object.keys(e).sort();for(let i=0,s=r.length;i<s;i++)t+=r[i]+":"+e[r[i]]+";";return t}function q(e){switch(e){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}let Y=new i.yGw;class Z{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new n,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let r=!1,s=-1,a=!1,o=-1;if("undefined"!=typeof navigator&&void 0!==navigator.userAgent){let e=navigator.userAgent;r=!0===/^((?!chrome|android).)*safari/i.test(e);let t=e.match(/Version\/(\d+)/);s=r&&t?parseInt(t[1],10):-1,o=(a=e.indexOf("Firefox")>-1)?e.match(/Firefox\/([0-9]+)\./)[1]:-1}"undefined"==typeof createImageBitmap||r&&s<17||a&&o<98?this.textureLoader=new i.dpR(this.options.manager):this.textureLoader=new i.QRU(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new i.hH6(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),"use-credentials"===this.options.crossOrigin&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let r=this,i=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(e){return e._markDefs&&e._markDefs()}),Promise.all(this._invokeAll(function(e){return e.beforeRoot&&e.beforeRoot()})).then(function(){return Promise.all([r.getDependencies("scene"),r.getDependencies("animation"),r.getDependencies("camera")])}).then(function(t){let a={scene:t[0][i.scene||0],scenes:t[0],animations:t[1],cameras:t[2],asset:i.asset,parser:r,userData:{}};return K(s,a,i),W(a,i),Promise.all(r._invokeAll(function(e){return e.afterRoot&&e.afterRoot(a)})).then(function(){for(let e of a.scenes)e.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],r=this.json.meshes||[];for(let r=0,i=t.length;r<i;r++){let i=t[r].joints;for(let t=0,r=i.length;t<r;t++)e[i[t]].isBone=!0}for(let t=0,i=e.length;t<i;t++){let i=e[t];void 0!==i.mesh&&(this._addNodeRef(this.meshCache,i.mesh),void 0!==i.skin&&(r[i.mesh].isSkinnedMesh=!0)),void 0!==i.camera&&this._addNodeRef(this.cameraCache,i.camera)}}_addNodeRef(e,t){void 0!==t&&(void 0===e.refs[t]&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,r){if(e.refs[t]<=1)return r;let i=r.clone(),s=(e,t)=>{let r=this.associations.get(e);for(let[i,a]of(null!=r&&this.associations.set(t,r),e.children.entries()))s(a,t.children[i])};return s(r,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let r=0;r<t.length;r++){let i=e(t[r]);if(i)return i}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let r=[];for(let i=0;i<t.length;i++){let s=e(t[i]);s&&r.push(s)}return r}getDependency(e,t){let r=e+":"+t,i=this.cache.get(r);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(e){return e.loadNode&&e.loadNode(t)});break;case"mesh":i=this._invokeOne(function(e){return e.loadMesh&&e.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(e){return e.loadBufferView&&e.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(e){return e.loadMaterial&&e.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(e){return e.loadTexture&&e.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(e){return e.loadAnimation&&e.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(!(i=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)})))throw Error("Unknown type: "+e)}this.cache.add(r,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){let r=this;t=Promise.all((this.json[e+("mesh"===e?"es":"s")]||[]).map(function(t,i){return r.getDependency(e,i)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],r=this.fileLoader;if(t.type&&"arraybuffer"!==t.type)throw Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(void 0===t.uri&&0===e)return Promise.resolve(this.extensions[l.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(e,a){r.load(i.Zp0.resolveURL(t.uri,s.path),e,void 0,function(){a(Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(e){let r=t.byteLength||0,i=t.byteOffset||0;return e.slice(i,i+r)})}loadAccessor(e){let t=this,r=this.json,s=this.json.accessors[e];if(void 0===s.bufferView&&void 0===s.sparse){let e=B[s.type],t=k[s.componentType],r=!0===s.normalized,a=new t(s.count*e);return Promise.resolve(new i.TlE(a,e,r))}let a=[];return void 0!==s.bufferView?a.push(this.getDependency("bufferView",s.bufferView)):a.push(null),void 0!==s.sparse&&(a.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),a.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(a).then(function(e){let a,n;let o=e[0],l=B[s.type],u=k[s.componentType],h=u.BYTES_PER_ELEMENT,c=h*l,d=s.byteOffset||0,f=void 0!==s.bufferView?r.bufferViews[s.bufferView].byteStride:void 0,p=!0===s.normalized;if(f&&f!==c){let e=Math.floor(d/f),r="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+e+":"+s.count,c=t.cache.get(r);c||(a=new u(o,e*f,s.count*f/h),c=new i.vpT(a,f/h),t.cache.add(r,c)),n=new i.kB5(c,l,d%f/h,p)}else a=null===o?new u(s.count*l):new u(o,d,s.count*l),n=new i.TlE(a,l,p);if(void 0!==s.sparse){let t=B.SCALAR,r=k[s.sparse.indices.componentType],a=s.sparse.indices.byteOffset||0,h=s.sparse.values.byteOffset||0,c=new r(e[1],a,s.sparse.count*t),d=new u(e[2],h,s.sparse.count*l);null!==o&&(n=new i.TlE(n.array.slice(),n.itemSize,n.normalized)),n.normalized=!1;for(let e=0,t=c.length;e<t;e++){let t=c[e];if(n.setX(t,d[e*l]),l>=2&&n.setY(t,d[e*l+1]),l>=3&&n.setZ(t,d[e*l+2]),l>=4&&n.setW(t,d[e*l+3]),l>=5)throw Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}n.normalized=p}return n})}loadTexture(e){let t=this.json,r=this.options,i=t.textures[e].source,s=t.images[i],a=this.textureLoader;if(s.uri){let e=r.manager.getHandler(s.uri);null!==e&&(a=e)}return this.loadTextureImage(e,i,a)}loadTextureImage(e,t,r){let s=this,a=this.json,n=a.textures[e],o=a.images[t],l=(o.uri||o.bufferView)+":"+n.sampler;if(this.textureCache[l])return this.textureCache[l];let u=this.loadImageSource(t,r).then(function(t){t.flipY=!1,t.name=n.name||o.name||"",""===t.name&&"string"==typeof o.uri&&!1===o.uri.startsWith("data:image/")&&(t.name=o.uri);let r=(a.samplers||{})[n.sampler]||{};return t.magFilter=F[r.magFilter]||i.wem,t.minFilter=F[r.minFilter]||i.D1R,t.wrapS=H[r.wrapS]||i.rpg,t.wrapT=H[r.wrapT]||i.rpg,t.generateMipmaps=!t.isCompressedTexture&&t.minFilter!==i.TyD&&t.minFilter!==i.wem,s.associations.set(t,{textures:e}),t}).catch(function(){return null});return this.textureCache[l]=u,u}loadImageSource(e,t){let r=this.json,s=this.options;if(void 0!==this.sourceCache[e])return this.sourceCache[e].then(e=>e.clone());let a=r.images[e],n=self.URL||self.webkitURL,o=a.uri||"",l=!1;if(void 0!==a.bufferView)o=this.getDependency("bufferView",a.bufferView).then(function(e){l=!0;let t=new Blob([e],{type:a.mimeType});return o=n.createObjectURL(t)});else if(void 0===a.uri)throw Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let u=Promise.resolve(o).then(function(e){return new Promise(function(r,a){let n=r;!0===t.isImageBitmapLoader&&(n=function(e){let t=new i.xEZ(e);t.needsUpdate=!0,r(t)}),t.load(i.Zp0.resolveURL(e,s.path),n,void 0,a)})}).then(function(e){var t;return!0===l&&n.revokeObjectURL(o),W(e,a),e.userData.mimeType=a.mimeType||((t=a.uri).search(/\.jpe?g($|\?)/i)>0||0===t.search(/^data\:image\/jpeg/)?"image/jpeg":t.search(/\.webp($|\?)/i)>0||0===t.search(/^data\:image\/webp/)?"image/webp":t.search(/\.ktx2($|\?)/i)>0||0===t.search(/^data\:image\/ktx2/)?"image/ktx2":"image/png"),e}).catch(function(e){throw console.error("THREE.GLTFLoader: Couldn't load texture",o),e});return this.sourceCache[e]=u,u}assignTexture(e,t,r,i){let s=this;return this.getDependency("texture",r.index).then(function(a){if(!a)return null;if(void 0!==r.texCoord&&r.texCoord>0&&((a=a.clone()).channel=r.texCoord),s.extensions[l.KHR_TEXTURE_TRANSFORM]){let e=void 0!==r.extensions?r.extensions[l.KHR_TEXTURE_TRANSFORM]:void 0;if(e){let t=s.associations.get(a);a=s.extensions[l.KHR_TEXTURE_TRANSFORM].extendTexture(a,e),s.associations.set(a,t)}}return void 0!==i&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){let t=e.geometry,r=e.material,s=void 0===t.attributes.tangent,a=void 0!==t.attributes.color,n=void 0===t.attributes.normal;if(e.isPoints){let e="PointsMaterial:"+r.uuid,t=this.cache.get(e);t||(t=new i.UY4,i.F5T.prototype.copy.call(t,r),t.color.copy(r.color),t.map=r.map,t.sizeAttenuation=!1,this.cache.add(e,t)),r=t}else if(e.isLine){let e="LineBasicMaterial:"+r.uuid,t=this.cache.get(e);t||(t=new i.nls,i.F5T.prototype.copy.call(t,r),t.color.copy(r.color),t.map=r.map,this.cache.add(e,t)),r=t}if(s||a||n){let e="ClonedMaterial:"+r.uuid+":";s&&(e+="derivative-tangents:"),a&&(e+="vertex-colors:"),n&&(e+="flat-shading:");let t=this.cache.get(e);t||(t=r.clone(),a&&(t.vertexColors=!0),n&&(t.flatShading=!0),s&&(t.normalScale&&(t.normalScale.y*=-1),t.clearcoatNormalScale&&(t.clearcoatNormalScale.y*=-1)),this.cache.add(e,t),this.associations.set(t,this.associations.get(r))),r=t}e.material=r}getMaterialType(){return i.Wid}loadMaterial(e){let t;let r=this,s=this.json,a=this.extensions,n=s.materials[e],o={},u=n.extensions||{},h=[];if(u[l.KHR_MATERIALS_UNLIT]){let e=a[l.KHR_MATERIALS_UNLIT];t=e.getMaterialType(),h.push(e.extendParams(o,n,r))}else{let s=n.pbrMetallicRoughness||{};if(o.color=new i.Ilk(1,1,1),o.opacity=1,Array.isArray(s.baseColorFactor)){let e=s.baseColorFactor;o.color.setRGB(e[0],e[1],e[2],i.GUF),o.opacity=e[3]}void 0!==s.baseColorTexture&&h.push(r.assignTexture(o,"map",s.baseColorTexture,i.KI_)),o.metalness=void 0!==s.metallicFactor?s.metallicFactor:1,o.roughness=void 0!==s.roughnessFactor?s.roughnessFactor:1,void 0!==s.metallicRoughnessTexture&&(h.push(r.assignTexture(o,"metalnessMap",s.metallicRoughnessTexture)),h.push(r.assignTexture(o,"roughnessMap",s.metallicRoughnessTexture))),t=this._invokeOne(function(t){return t.getMaterialType&&t.getMaterialType(e)}),h.push(Promise.all(this._invokeAll(function(t){return t.extendMaterialParams&&t.extendMaterialParams(e,o)})))}!0===n.doubleSided&&(o.side=i.ehD);let c=n.alphaMode||V.OPAQUE;if(c===V.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,c===V.MASK&&(o.alphaTest=void 0!==n.alphaCutoff?n.alphaCutoff:.5)),void 0!==n.normalTexture&&t!==i.vBJ&&(h.push(r.assignTexture(o,"normalMap",n.normalTexture)),o.normalScale=new i.FM8(1,1),void 0!==n.normalTexture.scale)){let e=n.normalTexture.scale;o.normalScale.set(e,e)}if(void 0!==n.occlusionTexture&&t!==i.vBJ&&(h.push(r.assignTexture(o,"aoMap",n.occlusionTexture)),void 0!==n.occlusionTexture.strength&&(o.aoMapIntensity=n.occlusionTexture.strength)),void 0!==n.emissiveFactor&&t!==i.vBJ){let e=n.emissiveFactor;o.emissive=new i.Ilk().setRGB(e[0],e[1],e[2],i.GUF)}return void 0!==n.emissiveTexture&&t!==i.vBJ&&h.push(r.assignTexture(o,"emissiveMap",n.emissiveTexture,i.KI_)),Promise.all(h).then(function(){let i=new t(o);return n.name&&(i.name=n.name),W(i,n),r.associations.set(i,{materials:e}),n.extensions&&K(a,i,n),i})}createUniqueName(e){let t=i.iUV.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,r=this.extensions,a=this.primitiveCache,n=[];for(let o=0,u=e.length;o<u;o++){let u=e[o],h=function(e){let t;let r=e.extensions&&e.extensions[l.KHR_DRACO_MESH_COMPRESSION];if(t=r?"draco:"+r.bufferView+":"+r.indices+":"+X(r.attributes):e.indices+":"+X(e.attributes)+":"+e.mode,void 0!==e.targets)for(let r=0,i=e.targets.length;r<i;r++)t+=":"+X(e.targets[r]);return t}(u),c=a[h];if(c)n.push(c.promise);else{let e;e=u.extensions&&u.extensions[l.KHR_DRACO_MESH_COMPRESSION]?function(e){return r[l.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(e,t).then(function(r){return $(r,e,t)})}(u):$(new i.u9r,u,t),u.mode===O.TRIANGLE_STRIP?e=e.then(e=>(0,s.Vs)(e,i.UlW)):u.mode===O.TRIANGLE_FAN&&(e=e.then(e=>(0,s.Vs)(e,i.z$h))),a[h]={primitive:u,promise:e},n.push(e)}}return Promise.all(n)}loadMesh(e){let t=this,r=this.json,s=this.extensions,a=r.meshes[e],n=a.primitives,o=[];for(let e=0,t=n.length;e<t;e++){var l;let t=void 0===n[e].material?(void 0===(l=this.cache).DefaultMaterial&&(l.DefaultMaterial=new i.Wid({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:i.Wl3})),l.DefaultMaterial):this.getDependency("material",n[e].material);o.push(t)}return o.push(t.loadGeometries(n)),Promise.all(o).then(async function(r){let o=r.slice(0,r.length-1),l=r[r.length-1],u=[];for(let r=0,h=l.length;r<h;r++){let h;let c=l[r],d=n[r],f=o[r];if(d.mode===O.TRIANGLES||d.mode===O.TRIANGLE_STRIP||d.mode===O.TRIANGLE_FAN||void 0===d.mode){let e=!0===a.isSkinnedMesh,t=c.hasAttribute("skinIndex")&&c.hasAttribute("skinWeight");e&&!1===t&&console.warn("THREE.GLTFLoader: Missing skinIndex or skinWeight attributes. Skinning disabled."),!0===(h=e&&t?new i.TUv(c,f):new i.Kj0(c,f)).isSkinnedMesh&&h.normalizeSkinWeights()}else if(d.mode===O.LINES)h=new i.ejS(c,f);else if(d.mode===O.LINE_STRIP)h=new i.x12(c,f);else if(d.mode===O.LINE_LOOP)h=new i.blk(c,f);else if(d.mode===O.POINTS)h=new i.woe(c,f);else throw Error("THREE.GLTFLoader: Primitive mode unsupported: "+d.mode);Object.keys(h.geometry.morphAttributes).length>0&&function(e,t){if(e.updateMorphTargets(),void 0!==t.weights)for(let r=0,i=t.weights.length;r<i;r++)e.morphTargetInfluences[r]=t.weights[r];if(t.extras&&Array.isArray(t.extras.targetNames)){let r=t.extras.targetNames;if(e.morphTargetInfluences.length===r.length){e.morphTargetDictionary={};for(let t=0,i=r.length;t<i;t++)e.morphTargetDictionary[r[t]]=t}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}(h,a),h.name=t.createUniqueName(a.name||"mesh_"+e),W(h,a),d.extensions&&K(s,h,d),t.assignFinalMaterial(h),u.push(h)}for(let r=0,i=u.length;r<i;r++)t.associations.set(u[r],{meshes:e,primitives:r});if(1===u.length)return a.extensions&&K(s,u[0],a),u[0];let h=new i.ZAu;a.extensions&&K(s,h,a),t.associations.set(h,{meshes:e});for(let e=0,t=u.length;e<t;e++)h.add(u[e]);return h})}loadCamera(e){let t;let r=this.json.cameras[e],s=r[r.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return"perspective"===r.type?t=new i.cPb(i.M8C.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):"orthographic"===r.type&&(t=new i.iKG(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),r.name&&(t.name=this.createUniqueName(r.name)),W(t,r),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],r=[];for(let e=0,i=t.joints.length;e<i;e++)r.push(this._loadNodeShallow(t.joints[e]));return void 0!==t.inverseBindMatrices?r.push(this.getDependency("accessor",t.inverseBindMatrices)):r.push(null),Promise.all(r).then(function(e){let r=e.pop(),s=[],a=[];for(let n=0,o=e.length;n<o;n++){let o=e[n];if(o){s.push(o);let e=new i.yGw;null!==r&&e.fromArray(r.array,16*n),a.push(e)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[n])}return new i.OdW(s,a)})}loadAnimation(e){let t=this.json,r=this,s=t.animations[e],a=s.name?s.name:"animation_"+e,n=[],o=[],l=[],u=[],h=[];for(let e=0,t=s.channels.length;e<t;e++){let t=s.channels[e],r=s.samplers[t.sampler],i=t.target,a=i.node,c=void 0!==s.parameters?s.parameters[r.input]:r.input,d=void 0!==s.parameters?s.parameters[r.output]:r.output;void 0!==i.node&&(n.push(this.getDependency("node",a)),o.push(this.getDependency("accessor",c)),l.push(this.getDependency("accessor",d)),u.push(r),h.push(i))}return Promise.all([Promise.all(n),Promise.all(o),Promise.all(l),Promise.all(u),Promise.all(h)]).then(function(e){let t=e[0],n=e[1],o=e[2],l=e[3],u=e[4],h=[];for(let e=0,i=t.length;e<i;e++){let i=t[e],s=n[e],a=o[e],c=l[e],d=u[e];if(void 0===i)continue;i.updateMatrix&&i.updateMatrix();let f=r._createAnimationTracks(i,s,a,c,d);if(f)for(let e=0;e<f.length;e++)h.push(f[e])}let c=new i.m7l(a,void 0,h);return W(c,s),c})}createNodeMesh(e){let t=this.json,r=this,i=t.nodes[e];return void 0===i.mesh?null:r.getDependency("mesh",i.mesh).then(function(e){let t=r._getNodeRef(r.meshCache,i.mesh,e);return void 0!==i.weights&&t.traverse(function(e){if(e.isMesh)for(let t=0,r=i.weights.length;t<r;t++)e.morphTargetInfluences[t]=i.weights[t]}),t})}loadNode(e){let t=this.json.nodes[e],r=this._loadNodeShallow(e),s=[],a=t.children||[];for(let e=0,t=a.length;e<t;e++)s.push(this.getDependency("node",a[e]));let n=void 0===t.skin?Promise.resolve(null):this.getDependency("skin",t.skin);return Promise.all([r,Promise.all(s),n]).then(function(e){let t=e[0],r=e[1],s=e[2];null!==s&&t.traverse(function(e){e.isSkinnedMesh&&e.bind(s,Y)});for(let e=0,i=r.length;e<i;e++)t.add(r[e]);if(void 0!==t.userData.pivot&&r.length>0){let e=t.userData.pivot,s=r[0];t.pivot=new i.Pa4().fromArray(e),t.position.x-=e[0],t.position.y-=e[1],t.position.z-=e[2],s.position.set(0,0,0),delete t.userData.pivot}return t})}_loadNodeShallow(e){let t=this.json,r=this.extensions,s=this;if(void 0!==this.nodeCache[e])return this.nodeCache[e];let a=t.nodes[e],n=a.name?s.createUniqueName(a.name):"",o=[],l=s._invokeOne(function(t){return t.createNodeMesh&&t.createNodeMesh(e)});return l&&o.push(l),void 0!==a.camera&&o.push(s.getDependency("camera",a.camera).then(function(e){return s._getNodeRef(s.cameraCache,a.camera,e)})),s._invokeAll(function(t){return t.createNodeAttachment&&t.createNodeAttachment(e)}).forEach(function(e){o.push(e)}),this.nodeCache[e]=Promise.all(o).then(function(t){let o;if((o=!0===a.isBone?new i.N$j:t.length>1?new i.ZAu:1===t.length?t[0]:new i.Tme)!==t[0])for(let e=0,r=t.length;e<r;e++)o.add(t[e]);if(a.name&&(o.userData.name=a.name,o.name=n),W(o,a),a.extensions&&K(r,o,a),void 0!==a.matrix){let e=new i.yGw;e.fromArray(a.matrix),o.applyMatrix4(e)}else void 0!==a.translation&&o.position.fromArray(a.translation),void 0!==a.rotation&&o.quaternion.fromArray(a.rotation),void 0!==a.scale&&o.scale.fromArray(a.scale);if(s.associations.has(o)){if(void 0!==a.mesh&&s.meshCache.refs[a.mesh]>1){let e=s.associations.get(o);s.associations.set(o,{...e})}}else s.associations.set(o,{});return s.associations.get(o).nodes=e,o}),this.nodeCache[e]}loadScene(e){let t=this.extensions,r=this.json.scenes[e],s=this,a=new i.ZAu;r.name&&(a.name=s.createUniqueName(r.name)),W(a,r),r.extensions&&K(t,a,r);let n=r.nodes||[],o=[];for(let e=0,t=n.length;e<t;e++)o.push(s.getDependency("node",n[e]));return Promise.all(o).then(function(e){for(let t=0,r=e.length;t<r;t++){let r=e[t];null!==r.parent?a.add(function(e){let t=new Map,r=new Map,i=e.clone();return function e(t,r,i){i(t,r);for(let s=0;s<t.children.length;s++)e(t.children[s],r.children[s],i)}(e,i,function(e,i){t.set(i,e),r.set(e,i)}),i.traverse(function(e){if(!e.isSkinnedMesh)return;let i=t.get(e),s=i.skeleton.bones;e.skeleton=i.skeleton.clone(),e.bindMatrix.copy(i.bindMatrix),e.skeleton.bones=s.map(function(e){return r.get(e)}),e.bind(e.skeleton,e.bindMatrix)}),i}(r)):a.add(r)}return s.associations=(e=>{let t=new Map;for(let[e,r]of s.associations)(e instanceof i.F5T||e instanceof i.xEZ)&&t.set(e,r);return e.traverse(e=>{let r=s.associations.get(e);null!=r&&t.set(e,r)}),t})(a),a})}_createAnimationTracks(e,t,r,s,a){let n;let o=[],l=e.name?e.name:e.uuid,u=[];function h(e){e.morphTargetInfluences&&u.push(e.name?e.name:e.uuid)}switch(z[a.path]===z.weights?(h(e),e.isGroup&&e.children.forEach(h)):u.push(l),z[a.path]){case z.weights:n=i.dUE;break;case z.rotation:n=i.iLg;break;case z.translation:case z.scale:n=i.yC1;break;default:n=1===r.itemSize?i.dUE:i.yC1}let c=void 0!==s.interpolation?j[s.interpolation]:i.NMF,d=this._getArrayFromAccessor(r);for(let e=0,r=u.length;e<r;e++){let r=new n(u[e]+"."+z[a.path],t.array,d,c);"CUBICSPLINE"===s.interpolation&&this._createCubicSplineTrackInterpolant(r),o.push(r)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let e=q(t.constructor),r=new Float32Array(t.length);for(let i=0,s=t.length;i<s;i++)r[i]=t[i]*e;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(e){return new(this instanceof i.iLg?U:I)(this.times,this.values,this.getValueSize()/3,e)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function $(e,t,r){let s=t.attributes,a=[];for(let t in s){let i=G[t]||t.toLowerCase();i in e.attributes||a.push(function(t,i){return r.getDependency("accessor",t).then(function(t){e.setAttribute(i,t)})}(s[t],i))}if(void 0!==t.indices&&!e.index){let i=r.getDependency("accessor",t.indices).then(function(t){e.setIndex(t)});a.push(i)}return i.epp.workingColorSpace!==i.GUF&&"COLOR_0"in s&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${i.epp.workingColorSpace}" not supported.`),W(e,t),!function(e,t,r){let s=t.attributes,a=new i.ZzF;if(void 0===s.POSITION)return;{let e=r.json.accessors[s.POSITION],t=e.min,n=e.max;if(void 0!==t&&void 0!==n){if(a.set(new i.Pa4(t[0],t[1],t[2]),new i.Pa4(n[0],n[1],n[2])),e.normalized){let t=q(k[e.componentType]);a.min.multiplyScalar(t),a.max.multiplyScalar(t)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}let n=t.targets;if(void 0!==n){let e=new i.Pa4,t=new i.Pa4;for(let i=0,s=n.length;i<s;i++){let s=n[i];if(void 0!==s.POSITION){let i=r.json.accessors[s.POSITION],a=i.min,n=i.max;if(void 0!==a&&void 0!==n){if(t.setX(Math.max(Math.abs(a[0]),Math.abs(n[0]))),t.setY(Math.max(Math.abs(a[1]),Math.abs(n[1]))),t.setZ(Math.max(Math.abs(a[2]),Math.abs(n[2]))),i.normalized){let e=q(k[i.componentType]);t.multiplyScalar(e)}e.max(t)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}a.expandByVector(e)}e.boundingBox=a;let o=new i.aLr;a.getCenter(o.center),o.radius=a.min.distanceTo(a.max)/2,e.boundingSphere=o}(e,t,r),Promise.all(a).then(function(){return void 0!==t.targets?function(e,t,r){let i=!1,s=!1,a=!1;for(let e=0,r=t.length;e<r;e++){let r=t[e];if(void 0!==r.POSITION&&(i=!0),void 0!==r.NORMAL&&(s=!0),void 0!==r.COLOR_0&&(a=!0),i&&s&&a)break}if(!i&&!s&&!a)return Promise.resolve(e);let n=[],o=[],l=[];for(let u=0,h=t.length;u<h;u++){let h=t[u];if(i){let t=void 0!==h.POSITION?r.getDependency("accessor",h.POSITION):e.attributes.position;n.push(t)}if(s){let t=void 0!==h.NORMAL?r.getDependency("accessor",h.NORMAL):e.attributes.normal;o.push(t)}if(a){let t=void 0!==h.COLOR_0?r.getDependency("accessor",h.COLOR_0):e.attributes.color;l.push(t)}}return Promise.all([Promise.all(n),Promise.all(o),Promise.all(l)]).then(function(t){let r=t[0],n=t[1],o=t[2];return i&&(e.morphAttributes.position=r),s&&(e.morphAttributes.normal=n),a&&(e.morphAttributes.color=o),e.morphTargetsRelative=!0,e})}(e,t.targets,r):e})}},9033:function(e,t,r){r.d(t,{x:function(){return u}});var i=r(2079),s=r(2552),a=r(9926),n=r(4451);class o extends n.w{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,r){let i,s;let a=e.getContext(),n=e.state;n.buffers.color.setMask(!1),n.buffers.depth.setMask(!1),n.buffers.color.setLocked(!0),n.buffers.depth.setLocked(!0),this.inverse?(i=0,s=1):(i=1,s=0),n.buffers.stencil.setTest(!0),n.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),n.buffers.stencil.setFunc(a.ALWAYS,i,4294967295),n.buffers.stencil.setClear(s),n.buffers.stencil.setLocked(!0),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),n.buffers.color.setLocked(!1),n.buffers.depth.setLocked(!1),n.buffers.color.setMask(!0),n.buffers.depth.setMask(!0),n.buffers.stencil.setLocked(!1),n.buffers.stencil.setFunc(a.EQUAL,1,4294967295),n.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),n.buffers.stencil.setLocked(!0)}}class l extends n.w{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class u{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),void 0===t){let r=e.getSize(new i.FM8);this._width=r.width,this._height=r.height,(t=new i.dd2(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:i.cLu})).texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new a.T(s.C),this.copyPass.material.blending=i.jFi,this.timer=new i.B7y}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);-1!==t&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),void 0===e&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),r=!1;for(let t=0,i=this.passes.length;t<i;t++){let i=this.passes[t];if(!1!==i.enabled){if(i.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),i.render(this.renderer,this.writeBuffer,this.readBuffer,e,r),i.needsSwap){if(r){let t=this.renderer.getContext(),r=this.renderer.state.buffers.stencil;r.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),r.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}void 0!==o&&(i instanceof o?r=!0:i instanceof l&&(r=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(void 0===e){let t=this.renderer.getSize(new i.FM8);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,(e=this.renderTarget1.clone()).setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let r=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(r,i),this.renderTarget2.setSize(r,i);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(r,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}},8092:function(e,t,r){r.d(t,{n:function(){return d}});var i=r(2079),s=r(4451);let a={name:"GTAOShader",defines:{PERSPECTIVE_CAMERA:1,SAMPLES:16,NORMAL_VECTOR_TYPE:1,DEPTH_SWIZZLING:"x",SCREEN_SPACE_RADIUS:0,SCREEN_SPACE_RADIUS_SCALE:100,SCENE_CLIP_BOX:0},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new i.FM8},cameraNear:{value:null},cameraFar:{value:null},cameraProjectionMatrix:{value:new i.yGw},cameraProjectionMatrixInverse:{value:new i.yGw},cameraWorldMatrix:{value:new i.yGw},radius:{value:.25},distanceExponent:{value:1},thickness:{value:1},distanceFallOff:{value:1},scale:{value:1},sceneBoxMin:{value:new i.Pa4(-1,-1,-1)},sceneBoxMax:{value:new i.Pa4(1,1,1)}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		varying vec2 vUv;
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform mat4 cameraWorldMatrix;
		uniform float radius;
		uniform float distanceExponent;
		uniform float thickness;
		uniform float distanceFallOff;
		uniform float scale;
		#if SCENE_CLIP_BOX == 1
			uniform vec3 sceneBoxMin;
			uniform vec3 sceneBoxMax;
		#endif

		#include <common>
		#include <packing>

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(vec3(ao), 1.)
		#endif

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
			return textureLod(tDepth, uv.xy, 0.0).DEPTH_SWIZZLING;
		}

		float fetchDepth(const ivec2 uv) {
			return texelFetch(tDepth, uv.xy, 0).DEPTH_SWIZZLING;
		}

		float getViewZ(const in float depth) {
			#if PERSPECTIVE_CAMERA == 1
				return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
			#else
				return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ? ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz : -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ? ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz : -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
			#if NORMAL_VECTOR_TYPE == 2
				return normalize(textureLod(tNormal, uv, 0.).rgb);
			#elif NORMAL_VECTOR_TYPE == 1
				return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
			#else
				return computeNormalFromDepth(uv);
			#endif
		}

		vec3 getSceneUvAndDepth(vec3 sampleViewPos) {
			vec4 sampleClipPos = cameraProjectionMatrix * vec4(sampleViewPos, 1.);
			vec2 sampleUv = sampleClipPos.xy / sampleClipPos.w * 0.5 + 0.5;
			float sampleSceneDepth = getDepth(sampleUv);
			return vec3(sampleUv, sampleSceneDepth);
		}

		void main() {
			float depth = getDepth(vUv.xy);

			#ifdef USE_REVERSED_DEPTH_BUFFER
				if (depth <= 0.0) {
					discard;
					return;
				}
			#else
				if (depth >= 1.0) {
					discard;
					return;
				}
			#endif
			
			vec3 viewPos = getViewPosition(vUv, depth);
			vec3 viewNormal = getViewNormal(vUv);

			float radiusToUse = radius;
			float distanceFalloffToUse = thickness;
			#if SCREEN_SPACE_RADIUS == 1
				float radiusScale = getViewPosition(vec2(0.5 + float(SCREEN_SPACE_RADIUS_SCALE) / resolution.x, 0.0), depth).x;
				radiusToUse *= radiusScale;
				distanceFalloffToUse *= radiusScale;
			#endif

			#if SCENE_CLIP_BOX == 1
				vec3 worldPos = (cameraWorldMatrix * vec4(viewPos, 1.0)).xyz;
				float boxDistance = length(max(vec3(0.0), max(sceneBoxMin - worldPos, worldPos - sceneBoxMax)));
				if (boxDistance > radiusToUse) {
					discard;
					return;
				}
			#endif

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
			vec3 randomVec = noiseTexel.xyz * 2.0 - 1.0;
			vec3 tangent = normalize(vec3(randomVec.xy, 0.));
			vec3 bitangent = vec3(-tangent.y, tangent.x, 0.);
			mat3 kernelMatrix = mat3(tangent, bitangent, vec3(0., 0., 1.));

			const int DIRECTIONS = SAMPLES < 30 ? 3 : 5;
			const int STEPS = (SAMPLES + DIRECTIONS - 1) / DIRECTIONS;
			float ao = 0.0;
			for (int i = 0; i < DIRECTIONS; ++i) {

				float angle = float(i) / float(DIRECTIONS) * PI;
				vec4 sampleDir = vec4(cos(angle), sin(angle), 0., 0.5 + 0.5 * noiseTexel.w);
				sampleDir.xyz = normalize(kernelMatrix * sampleDir.xyz);

				vec3 viewDir = normalize(-viewPos.xyz);
				vec3 sliceBitangent = normalize(cross(sampleDir.xyz, viewDir));
				vec3 sliceTangent = cross(sliceBitangent, viewDir);
				vec3 normalInSlice = normalize(viewNormal - sliceBitangent * dot(viewNormal, sliceBitangent));

				vec3 tangentToNormalInSlice = cross(normalInSlice, sliceBitangent);
				vec2 cosHorizons = vec2(dot(viewDir, tangentToNormalInSlice), dot(viewDir, -tangentToNormalInSlice));

				for (int j = 0; j < STEPS; ++j) {
					vec3 sampleViewOffset = sampleDir.xyz * radiusToUse * sampleDir.w * pow(float(j + 1) / float(STEPS), distanceExponent);

					vec3 sampleSceneUvDepth = getSceneUvAndDepth(viewPos + sampleViewOffset);
					vec3 sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					vec3 viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.x += max(0., (sampleCosHorizon - cosHorizons.x) * mix(1., 2. / float(j + 2), distanceFallOff));
					}

					sampleSceneUvDepth = getSceneUvAndDepth(viewPos - sampleViewOffset);
					sampleSceneViewPos = getViewPosition(sampleSceneUvDepth.xy, sampleSceneUvDepth.z);
					viewDelta = sampleSceneViewPos - viewPos;
					if (abs(viewDelta.z) < thickness) {
						float sampleCosHorizon = dot(viewDir, normalize(viewDelta));
						cosHorizons.y += max(0., (sampleCosHorizon - cosHorizons.y) * mix(1., 2. / float(j + 2), distanceFallOff));
					}
				}

				vec2 sinHorizons = sqrt(1. - cosHorizons * cosHorizons);
				float nx = dot(normalInSlice, sliceTangent);
				float ny = dot(normalInSlice, viewDir);
				float nxb = 1. / 2. * (acos(cosHorizons.y) - acos(cosHorizons.x) + sinHorizons.x * cosHorizons.x - sinHorizons.y * cosHorizons.y);
				float nyb = 1. / 2. * (2. - cosHorizons.x * cosHorizons.x - cosHorizons.y * cosHorizons.y);
				float occlusion = nx * nxb + ny * nyb;
				ao += occlusion;
			}

			ao = clamp(ao / float(DIRECTIONS), 0., 1.);
		#if SCENE_CLIP_BOX == 1
			ao = mix(ao, 1., smoothstep(0., radiusToUse, boxDistance));
		#endif
			ao = pow(ao, scale);

			gl_FragColor = FRAGMENT_OUTPUT;
		}`},n={name:"GTAODepthShader",defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {
			#if PERSPECTIVE_CAMERA == 1
				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			#else
				return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		void main() {
			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},o={name:"GTAOBlendShader",uniforms:{tDiffuse:{value:null},intensity:{value:1}},vertexShader:`
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`
		uniform float intensity;
		uniform sampler2D tDiffuse;
		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(mix(vec3(1.), texel.rgb, intensity), texel.a);
		}`},l={name:"PoissonDenoiseShader",defines:{SAMPLES:16,SAMPLE_VECTORS:u(16,2,1),NORMAL_VECTOR_TYPE:1,DEPTH_VALUE_SOURCE:0},uniforms:{tDiffuse:{value:null},tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},resolution:{value:new i.FM8},cameraProjectionMatrixInverse:{value:new i.yGw},lumaPhi:{value:5},depthPhi:{value:5},normalPhi:{value:5},radius:{value:4},index:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,fragmentShader:`

		varying vec2 vUv;

		uniform sampler2D tDiffuse;
		uniform sampler2D tNormal;
		uniform sampler2D tDepth;
		uniform sampler2D tNoise;
		uniform vec2 resolution;
		uniform mat4 cameraProjectionMatrixInverse;
		uniform float lumaPhi;
		uniform float depthPhi;
		uniform float normalPhi;
		uniform float radius;
		uniform int index;

		#include <common>
		#include <packing>

		#ifndef SAMPLE_LUMINANCE
		#define SAMPLE_LUMINANCE dot(vec3(0.2125, 0.7154, 0.0721), a)
		#endif

		#ifndef FRAGMENT_OUTPUT
		#define FRAGMENT_OUTPUT vec4(denoised, 1.)
		#endif

		float getLuminance(const in vec3 a) {
			return SAMPLE_LUMINANCE;
		}

		const vec3 poissonDisk[SAMPLES] = SAMPLE_VECTORS;

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				vec4 clipSpacePosition = vec4( vec2( screenPosition ) * 2.0 - 1.0, depth, 1.0 );
			#else
				vec4 clipSpacePosition = vec4( vec3( screenPosition, depth ) * 2.0 - 1.0, 1.0 );
			#endif
			vec4 viewSpacePosition = cameraProjectionMatrixInverse * clipSpacePosition;
			return viewSpacePosition.xyz / viewSpacePosition.w;
		}

		float getDepth(const vec2 uv) {
		#if DEPTH_VALUE_SOURCE == 1
			return textureLod(tDepth, uv.xy, 0.0).a;
		#else
			return textureLod(tDepth, uv.xy, 0.0).r;
		#endif
		}

		float fetchDepth(const ivec2 uv) {
			#if DEPTH_VALUE_SOURCE == 1
				return texelFetch(tDepth, uv.xy, 0).a;
			#else
				return texelFetch(tDepth, uv.xy, 0).r;
			#endif
		}

		vec3 computeNormalFromDepth(const vec2 uv) {
			vec2 size = vec2(textureSize(tDepth, 0));
			ivec2 p = ivec2(uv * size);
			float c0 = fetchDepth(p);
			float l2 = fetchDepth(p - ivec2(2, 0));
			float l1 = fetchDepth(p - ivec2(1, 0));
			float r1 = fetchDepth(p + ivec2(1, 0));
			float r2 = fetchDepth(p + ivec2(2, 0));
			float b2 = fetchDepth(p - ivec2(0, 2));
			float b1 = fetchDepth(p - ivec2(0, 1));
			float t1 = fetchDepth(p + ivec2(0, 1));
			float t2 = fetchDepth(p + ivec2(0, 2));
			float dl = abs((2.0 * l1 - l2) - c0);
			float dr = abs((2.0 * r1 - r2) - c0);
			float db = abs((2.0 * b1 - b2) - c0);
			float dt = abs((2.0 * t1 - t2) - c0);
			vec3 ce = getViewPosition(uv, c0).xyz;
			vec3 dpdx = (dl < dr) ?  ce - getViewPosition((uv - vec2(1.0 / size.x, 0.0)), l1).xyz
									: -ce + getViewPosition((uv + vec2(1.0 / size.x, 0.0)), r1).xyz;
			vec3 dpdy = (db < dt) ?  ce - getViewPosition((uv - vec2(0.0, 1.0 / size.y)), b1).xyz
									: -ce + getViewPosition((uv + vec2(0.0, 1.0 / size.y)), t1).xyz;
			return normalize(cross(dpdx, dpdy));
		}

		vec3 getViewNormal(const vec2 uv) {
		#if NORMAL_VECTOR_TYPE == 2
			return normalize(textureLod(tNormal, uv, 0.).rgb);
		#elif NORMAL_VECTOR_TYPE == 1
			return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);
		#else
			return computeNormalFromDepth(uv);
		#endif
		}

		void denoiseSample(in vec3 center, in vec3 viewNormal, in vec3 viewPos, in vec2 sampleUv, inout vec3 denoised, inout float totalWeight) {
			vec4 sampleTexel = textureLod(tDiffuse, sampleUv, 0.0);
			float sampleDepth = getDepth(sampleUv);
			vec3 sampleNormal = getViewNormal(sampleUv);
			vec3 neighborColor = sampleTexel.rgb;
			vec3 viewPosSample = getViewPosition(sampleUv, sampleDepth);

			float normalDiff = dot(viewNormal, sampleNormal);
			float normalSimilarity = pow(max(normalDiff, 0.), normalPhi);
			float lumaDiff = abs(getLuminance(neighborColor) - getLuminance(center));
			float lumaSimilarity = max(1.0 - lumaDiff / lumaPhi, 0.0);
			float depthDiff = abs(dot(viewPos - viewPosSample, viewNormal));
			float depthSimilarity = max(1. - depthDiff / depthPhi, 0.);
			float w = lumaSimilarity * depthSimilarity * normalSimilarity;

			denoised += w * neighborColor;
			totalWeight += w;
		}

		void main() {
			float depth = getDepth(vUv.xy);
			vec3 viewNormal = getViewNormal(vUv);
			if (depth == 1. || dot(viewNormal, viewNormal) == 0.) {
				discard;
				return;
			}
			vec4 texel = textureLod(tDiffuse, vUv, 0.0);
			vec3 center = texel.rgb;
			vec3 viewPos = getViewPosition(vUv, depth);

			vec2 noiseResolution = vec2(textureSize(tNoise, 0));
			vec2 noiseUv = vUv * resolution / noiseResolution;
			vec4 noiseTexel = textureLod(tNoise, noiseUv, 0.0);
      		vec2 noiseVec = vec2(sin(noiseTexel[index % 4] * 2. * PI), cos(noiseTexel[index % 4] * 2. * PI));
    		mat2 rotationMatrix = mat2(noiseVec.x, -noiseVec.y, noiseVec.x, noiseVec.y);

			float totalWeight = 1.0;
			vec3 denoised = texel.rgb;
			for (int i = 0; i < SAMPLES; i++) {
				vec3 sampleDir = poissonDisk[i];
				vec2 offset = rotationMatrix * (sampleDir.xy * (1. + sampleDir.z * (radius - 1.)) / resolution);
				vec2 sampleUv = vUv + offset;
				denoiseSample(center, viewNormal, viewPos, sampleUv, denoised, totalWeight);
			}

			if (totalWeight > 0.) {
				denoised /= totalWeight;
			}
			gl_FragColor = FRAGMENT_OUTPUT;
		}`};function u(e,t,r){let s=function(e,t,r){let s=[];for(let a=0;a<e;a++){let n=2*Math.PI*t*a/e,o=Math.pow(a/(e-1),r);s.push(new i.Pa4(Math.cos(n),Math.sin(n),o))}return s}(e,t,r),a="vec3[SAMPLES](";for(let t=0;t<e;t++){let r=s[t];a+=`vec3(${r.x}, ${r.y}, ${r.z})${t<e-1?",":")"}`}return a}var h=r(2552);class c{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(256*e.random());this.perm=[];for(let e=0;e<512;e++)this.perm[e]=this.p[255&e];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}noise(e,t){let r,i,s,a,n;let o=.5*(Math.sqrt(3)-1)*(e+t),l=Math.floor(e+o),u=Math.floor(t+o),h=(3-Math.sqrt(3))/6,c=(l+u)*h,d=e-(l-c),f=t-(u-c);d>f?(a=1,n=0):(a=0,n=1);let p=d-a+h,m=f-n+h,g=d-1+2*h,v=f-1+2*h,T=255&l,x=255&u,_=this.perm[T+this.perm[x]]%12,w=this.perm[T+a+this.perm[x+n]]%12,b=this.perm[T+1+this.perm[x+1]]%12,E=.5-d*d-f*f;E<0?r=0:(E*=E,r=E*E*this._dot(this.grad3[_],d,f));let M=.5-p*p-m*m;M<0?i=0:(M*=M,i=M*M*this._dot(this.grad3[w],p,m));let y=.5-g*g-v*v;return y<0?s=0:(y*=y,s=y*y*this._dot(this.grad3[b],g,v)),70*(r+i+s)}noise3d(e,t,r){let i,s,a,n,o,l,u,h,c,d;let f=1/3*(e+t+r),p=Math.floor(e+f),m=Math.floor(t+f),g=Math.floor(r+f),v=1/6*(p+m+g),T=e-(p-v),x=t-(m-v),_=r-(g-v);T>=x?x>=_?(o=1,l=0,u=0,h=1,c=1,d=0):(T>=_?(o=1,l=0,u=0):(o=0,l=0,u=1),h=1,c=0,d=1):x<_?(o=0,l=0,u=1,h=0,c=1,d=1):T<_?(o=0,l=1,u=0,h=0,c=1,d=1):(o=0,l=1,u=0,h=1,c=1,d=0);let w=T-o+1/6,b=x-l+1/6,E=_-u+1/6,M=T-h+1/6*2,y=x-c+1/6*2,S=_-d+1/6*2,R=T-1+1/6*3,P=x-1+1/6*3,A=_-1+1/6*3,C=255&p,L=255&m,D=255&g,I=this.perm[C+this.perm[L+this.perm[D]]]%12,N=this.perm[C+o+this.perm[L+l+this.perm[D+u]]]%12,U=this.perm[C+h+this.perm[L+c+this.perm[D+d]]]%12,O=this.perm[C+1+this.perm[L+1+this.perm[D+1]]]%12,k=.6-T*T-x*x-_*_;k<0?i=0:(k*=k,i=k*k*this._dot3(this.grad3[I],T,x,_));let F=.6-w*w-b*b-E*E;F<0?s=0:(F*=F,s=F*F*this._dot3(this.grad3[N],w,b,E));let H=.6-M*M-y*y-S*S;H<0?a=0:(H*=H,a=H*H*this._dot3(this.grad3[U],M,y,S));let B=.6-R*R-P*P-A*A;return B<0?n=0:(B*=B,n=B*B*this._dot3(this.grad3[O],R,P,A)),32*(i+s+a+n)}noise4d(e,t,r,i){let s,a,n,o,l;let u=this.grad4,h=this.simplex,c=this.perm,d=(5-Math.sqrt(5))/20,f=(Math.sqrt(5)-1)/4*(e+t+r+i),p=Math.floor(e+f),m=Math.floor(t+f),g=Math.floor(r+f),v=Math.floor(i+f),T=(p+m+g+v)*d,x=e-(p-T),_=t-(m-T),w=r-(g-T),b=i-(v-T),E=(x>_?32:0)+(x>w?16:0)+(_>w?8:0)+(x>b?4:0)+(_>b?2:0)+(w>b?1:0),M=h[E][0]>=3?1:0,y=h[E][1]>=3?1:0,S=h[E][2]>=3?1:0,R=h[E][3]>=3?1:0,P=h[E][0]>=2?1:0,A=h[E][1]>=2?1:0,C=h[E][2]>=2?1:0,L=h[E][3]>=2?1:0,D=h[E][0]>=1?1:0,I=h[E][1]>=1?1:0,N=h[E][2]>=1?1:0,U=h[E][3]>=1?1:0,O=x-M+d,k=_-y+d,F=w-S+d,H=b-R+d,B=x-P+2*d,G=_-A+2*d,z=w-C+2*d,j=b-L+2*d,V=x-D+3*d,K=_-I+3*d,W=w-N+3*d,X=b-U+3*d,q=x-1+4*d,Y=_-1+4*d,Z=w-1+4*d,$=b-1+4*d,Q=255&p,J=255&m,ee=255&g,et=255&v,er=c[Q+c[J+c[ee+c[et]]]]%32,ei=c[Q+M+c[J+y+c[ee+S+c[et+R]]]]%32,es=c[Q+P+c[J+A+c[ee+C+c[et+L]]]]%32,ea=c[Q+D+c[J+I+c[ee+N+c[et+U]]]]%32,en=c[Q+1+c[J+1+c[ee+1+c[et+1]]]]%32,eo=.6-x*x-_*_-w*w-b*b;eo<0?s=0:(eo*=eo,s=eo*eo*this._dot4(u[er],x,_,w,b));let el=.6-O*O-k*k-F*F-H*H;el<0?a=0:(el*=el,a=el*el*this._dot4(u[ei],O,k,F,H));let eu=.6-B*B-G*G-z*z-j*j;eu<0?n=0:(eu*=eu,n=eu*eu*this._dot4(u[es],B,G,z,j));let eh=.6-V*V-K*K-W*W-X*X;eh<0?o=0:(eh*=eh,o=eh*eh*this._dot4(u[ea],V,K,W,X));let ec=.6-q*q-Y*Y-Z*Z-$*$;return ec<0?l=0:(ec*=ec,l=ec*ec*this._dot4(u[en],q,Y,Z,$)),27*(s+a+n+o+l)}_dot(e,t,r){return e[0]*t+e[1]*r}_dot3(e,t,r,i){return e[0]*t+e[1]*r+e[2]*i}_dot4(e,t,r,i,s){return e[0]*t+e[1]*r+e[2]*i+e[3]*s}}class d extends s.w{constructor(e,t,r=512,u=512,c,d,f){super(),this.width=r,this.height=u,this.clear=!0,this.camera=t,this.scene=e,this.output=0,this._renderGBuffer=!0,this._visibilityCache=[],this.blendIntensity=1,this.pdRings=2,this.pdRadiusExponent=2,this.pdSamples=16,this.gtaoNoiseTexture=function(e=5){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),r=function(e){let t=Math.floor(e)%2==0?Math.floor(e)+1:Math.floor(e),r=t*t,i=Array(r).fill(0),s=Math.floor(t/2),a=t-1;for(let e=1;e<=r;){if(-1===s&&a===t?(a=t-2,s=0):(a===t&&(a=0),s<0&&(s=t-1)),0!==i[s*t+a]){a-=2,s++;continue}i[s*t+a]=e++,a++,s--}return i}(t),s=r.length,a=new Uint8Array(4*s);for(let e=0;e<s;++e){let t=2*Math.PI*r[e]/s,n=new i.Pa4(Math.cos(t),Math.sin(t),0).normalize();a[4*e]=(.5*n.x+.5)*255,a[4*e+1]=(.5*n.y+.5)*255,a[4*e+2]=127,a[4*e+3]=255}let n=new i.IEO(a,t,t);return n.wrapS=i.rpg,n.wrapT=i.rpg,n.needsUpdate=!0,n}(),this.pdNoiseTexture=this._generateNoise(),this.gtaoRenderTarget=new i.dd2(this.width,this.height,{type:i.cLu,depthBuffer:!1}),this.pdRenderTarget=this.gtaoRenderTarget.clone(),this.gtaoMaterial=new i.jyz({defines:Object.assign({},a.defines),uniforms:i.rDY.clone(a.uniforms),vertexShader:a.vertexShader,fragmentShader:a.fragmentShader,blending:i.jFi,depthTest:!1,depthWrite:!1}),this.gtaoMaterial.defines.PERSPECTIVE_CAMERA=this.camera.isPerspectiveCamera?1:0,this.gtaoMaterial.uniforms.tNoise.value=this.gtaoNoiseTexture,this.gtaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.normalMaterial=new i.RSm,this.normalMaterial.blending=i.jFi,this.pdMaterial=new i.jyz({defines:Object.assign({},l.defines),uniforms:i.rDY.clone(l.uniforms),vertexShader:l.vertexShader,fragmentShader:l.fragmentShader,depthTest:!1,depthWrite:!1}),this.pdMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.pdMaterial.uniforms.tNoise.value=this.pdNoiseTexture,this.pdMaterial.uniforms.resolution.value.set(this.width,this.height),this.pdMaterial.uniforms.lumaPhi.value=10,this.pdMaterial.uniforms.depthPhi.value=2,this.pdMaterial.uniforms.normalPhi.value=3,this.pdMaterial.uniforms.radius.value=8,this.depthRenderMaterial=new i.jyz({defines:Object.assign({},n.defines),uniforms:i.rDY.clone(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,blending:i.jFi}),this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new i.jyz({uniforms:i.rDY.clone(h.C.uniforms),vertexShader:h.C.vertexShader,fragmentShader:h.C.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:i.Vdb,blendDst:i.c8b,blendEquation:i.bGH,blendSrcAlpha:i.fSK,blendDstAlpha:i.c8b,blendEquationAlpha:i.bGH}),this.blendMaterial=new i.jyz({uniforms:i.rDY.clone(o.uniforms),vertexShader:o.vertexShader,fragmentShader:o.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blending:i.Xaj,blendSrc:i.Vdb,blendDst:i.c8b,blendEquation:i.bGH,blendSrcAlpha:i.fSK,blendDstAlpha:i.c8b,blendEquationAlpha:i.bGH}),this._fsQuad=new s.T(null),this._originalClearColor=new i.Ilk,this.setGBuffer(c?c.depthTexture:void 0,c?c.normalTexture:void 0),void 0!==d&&this.updateGtaoMaterial(d),void 0!==f&&this.updatePdMaterial(f)}setSize(e,t){this.width=e,this.height=t,this.gtaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.pdRenderTarget.setSize(e,t),this.gtaoMaterial.uniforms.resolution.value.set(e,t),this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.pdMaterial.uniforms.resolution.value.set(e,t),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse)}dispose(){this.gtaoNoiseTexture.dispose(),this.pdNoiseTexture.dispose(),this.normalRenderTarget.dispose(),this.gtaoRenderTarget.dispose(),this.pdRenderTarget.dispose(),this.normalMaterial.dispose(),this.pdMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this._fsQuad.dispose()}get gtaoMap(){return this.pdRenderTarget.texture}setGBuffer(e,t){void 0!==e?(this.depthTexture=e,this.normalTexture=t,this._renderGBuffer=!1):(this.depthTexture=new i.$YQ,this.depthTexture.format=i.brP,this.depthTexture.type=i.wJv,this.normalRenderTarget=new i.dd2(this.width,this.height,{minFilter:i.TyD,magFilter:i.TyD,type:i.cLu,depthTexture:this.depthTexture}),this.normalTexture=this.normalRenderTarget.texture,this._renderGBuffer=!0);let r=this.normalTexture?1:0,s=this.depthTexture===this.normalTexture?"w":"x";this.gtaoMaterial.defines.NORMAL_VECTOR_TYPE=r,this.gtaoMaterial.defines.DEPTH_SWIZZLING=s,this.gtaoMaterial.uniforms.tNormal.value=this.normalTexture,this.gtaoMaterial.uniforms.tDepth.value=this.depthTexture,this.pdMaterial.defines.NORMAL_VECTOR_TYPE=r,this.pdMaterial.defines.DEPTH_SWIZZLING=s,this.pdMaterial.uniforms.tNormal.value=this.normalTexture,this.pdMaterial.uniforms.tDepth.value=this.depthTexture,this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture}setSceneClipBox(e){e?(this.gtaoMaterial.needsUpdate=1!==this.gtaoMaterial.defines.SCENE_CLIP_BOX,this.gtaoMaterial.defines.SCENE_CLIP_BOX=1,this.gtaoMaterial.uniforms.sceneBoxMin.value.copy(e.min),this.gtaoMaterial.uniforms.sceneBoxMax.value.copy(e.max)):(this.gtaoMaterial.needsUpdate=0===this.gtaoMaterial.defines.SCENE_CLIP_BOX,this.gtaoMaterial.defines.SCENE_CLIP_BOX=0)}updateGtaoMaterial(e){void 0!==e.radius&&(this.gtaoMaterial.uniforms.radius.value=e.radius),void 0!==e.distanceExponent&&(this.gtaoMaterial.uniforms.distanceExponent.value=e.distanceExponent),void 0!==e.thickness&&(this.gtaoMaterial.uniforms.thickness.value=e.thickness),void 0!==e.distanceFallOff&&(this.gtaoMaterial.uniforms.distanceFallOff.value=e.distanceFallOff,this.gtaoMaterial.needsUpdate=!0),void 0!==e.scale&&(this.gtaoMaterial.uniforms.scale.value=e.scale),void 0!==e.samples&&e.samples!==this.gtaoMaterial.defines.SAMPLES&&(this.gtaoMaterial.defines.SAMPLES=e.samples,this.gtaoMaterial.needsUpdate=!0),void 0!==e.screenSpaceRadius&&(e.screenSpaceRadius?1:0)!==this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS&&(this.gtaoMaterial.defines.SCREEN_SPACE_RADIUS=e.screenSpaceRadius?1:0,this.gtaoMaterial.needsUpdate=!0)}updatePdMaterial(e){let t=!1;void 0!==e.lumaPhi&&(this.pdMaterial.uniforms.lumaPhi.value=e.lumaPhi),void 0!==e.depthPhi&&(this.pdMaterial.uniforms.depthPhi.value=e.depthPhi),void 0!==e.normalPhi&&(this.pdMaterial.uniforms.normalPhi.value=e.normalPhi),void 0!==e.radius&&e.radius!==this.radius&&(this.pdMaterial.uniforms.radius.value=e.radius),void 0!==e.radiusExponent&&e.radiusExponent!==this.pdRadiusExponent&&(this.pdRadiusExponent=e.radiusExponent,t=!0),void 0!==e.rings&&e.rings!==this.pdRings&&(this.pdRings=e.rings,t=!0),void 0!==e.samples&&e.samples!==this.pdSamples&&(this.pdSamples=e.samples,t=!0),t&&(this.pdMaterial.defines.SAMPLES=this.pdSamples,this.pdMaterial.defines.SAMPLE_VECTORS=u(this.pdSamples,this.pdRings,this.pdRadiusExponent),this.pdMaterial.needsUpdate=!0)}render(e,t,r){switch(this._renderGBuffer&&(this._overrideVisibility(),this._renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this._restoreVisibility()),this.gtaoMaterial.uniforms.cameraNear.value=this.camera.near,this.gtaoMaterial.uniforms.cameraFar.value=this.camera.far,this.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this.gtaoMaterial.uniforms.cameraWorldMatrix.value.copy(this.camera.matrixWorld),this._renderPass(e,this.gtaoMaterial,this.gtaoRenderTarget,16777215,1),this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(this.camera.projectionMatrixInverse),this._renderPass(e,this.pdMaterial,this.pdRenderTarget,16777215,1),this.output){case d.OUTPUT.Off:break;case d.OUTPUT.Diffuse:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=i.jFi,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case d.OUTPUT.AO:this.copyMaterial.uniforms.tDiffuse.value=this.gtaoRenderTarget.texture,this.copyMaterial.blending=i.jFi,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case d.OUTPUT.Denoise:this.copyMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this.copyMaterial.blending=i.jFi,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case d.OUTPUT.Depth:this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this._renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:t);break;case d.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=i.jFi,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t);break;case d.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=r.texture,this.copyMaterial.blending=i.jFi,this._renderPass(e,this.copyMaterial,this.renderToScreen?null:t),this.blendMaterial.uniforms.intensity.value=this.blendIntensity,this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture,this._renderPass(e,this.blendMaterial,this.renderToScreen?null:t);break;default:console.warn("THREE.GTAOPass: Unknown output type.")}}_renderPass(e,t,r,i,s){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),n=e.autoClear;e.setRenderTarget(r),e.autoClear=!1,null!=i&&(e.setClearColor(i),e.setClearAlpha(s||0),e.clear()),this._fsQuad.material=t,this._fsQuad.render(e),e.autoClear=n,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_renderOverride(e,t,r,i,s){e.getClearColor(this._originalClearColor);let a=e.getClearAlpha(),n=e.autoClear;e.setRenderTarget(r),e.autoClear=!1,i=t.clearColor||i,s=t.clearAlpha||s,null!=i&&(e.setClearColor(i),e.setClearAlpha(s||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=n,e.setClearColor(this._originalClearColor),e.setClearAlpha(a)}_overrideVisibility(){let e=this.scene,t=this._visibilityCache;e.traverse(function(e){(e.isPoints||e.isLine||e.isLine2)&&e.visible&&(e.visible=!1,t.push(e))})}_restoreVisibility(){let e=this._visibilityCache;for(let t=0;t<e.length;t++)e[t].visible=!0;e.length=0}_generateNoise(e=64){let t=new c,r=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let s=0;s<e;s++){let a=i,n=s;r[(i*e+s)*4]=(.5*t.noise(a,n)+.5)*255,r[(i*e+s)*4+1]=(.5*t.noise(a+e,n)+.5)*255,r[(i*e+s)*4+2]=(.5*t.noise(a,n+e)+.5)*255,r[(i*e+s)*4+3]=(.5*t.noise(a+e,n+e)+.5)*255}let s=new i.IEO(r,e,e,i.wk1,i.ywz);return s.wrapS=i.rpg,s.wrapT=i.rpg,s.needsUpdate=!0,s}}d.OUTPUT={Off:-1,Default:0,Diffuse:1,Depth:2,Normal:3,AO:4,Denoise:5}},1610:function(e,t,r){r.d(t,{v:function(){return n}});var i=r(2079),s=r(4451);let a={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class n extends s.w{constructor(){super(),this.isOutputPass=!0,this.uniforms=i.rDY.clone(a.uniforms),this.material=new i.FIo({name:a.name,uniforms:this.uniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this._fsQuad=new s.T(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,r){this.uniforms.tDiffuse.value=r.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},i.epp.getTransfer(this._outputColorSpace)===i.j17&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===i.EoG?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===i.CdI?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===i.YGz?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===i.LY2?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===i.Bgp?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===i.ORg?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===i.dZ3&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),!0===this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this._fsQuad.render(e)}dispose(){this.material.dispose(),this._fsQuad.dispose()}}},4451:function(e,t,r){r.d(t,{T:function(){return l},w:function(){return s}});var i=r(2079);class s{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}let a=new i.iKG(-1,1,1,-1,0,1);class n extends i.u9r{constructor(){super(),this.setAttribute("position",new i.a$l([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new i.a$l([0,2,0,0,2,0],2))}}let o=new n;class l{constructor(e){this._mesh=new i.Kj0(o,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,a)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}},9520:function(e,t,r){r.d(t,{C:function(){return a}});var i=r(2079),s=r(4451);class a extends s.w{constructor(e,t,r=null,s=null,a=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=r,this.clearColor=s,this.clearAlpha=a,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new i.Ilk}render(e,t,r){let i,s;let a=e.autoClear;e.autoClear=!1,null!==this.overrideMaterial&&(s=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),null!==this.clearColor&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),null!==this.clearAlpha&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),!0==this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:r),!0===this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),null!==this.clearColor&&e.setClearColor(this._oldClearColor),null!==this.clearAlpha&&e.setClearAlpha(i),null!==this.overrideMaterial&&(this.scene.overrideMaterial=s),e.autoClear=a}}},9926:function(e,t,r){r.d(t,{T:function(){return a}});var i=r(2079),s=r(4451);class a extends s.w{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof i.jyz?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=i.rDY.clone(e.uniforms),this.material=new i.jyz({name:void 0!==e.name?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new s.T(this.material)}render(e,t,r){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=r.texture),this._fsQuad.material=this.material,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this._fsQuad.render(e)}dispose(){this.material.dispose(),this._fsQuad.dispose()}}},4364:function(e,t,r){r.d(t,{m:function(){return o}});var i=r(2079),s=r(4451),a=r(2552);let n={name:"LuminosityHighPassShader",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new i.Ilk(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class o extends s.w{constructor(e,t=1,r,o){super(),this.strength=t,this.radius=r,this.threshold=o,this.resolution=void 0!==e?new i.FM8(e.x,e.y):new i.FM8(256,256),this.clearColor=new i.Ilk(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let l=Math.round(this.resolution.x/2),u=Math.round(this.resolution.y/2);this.renderTargetBright=new i.dd2(l,u,{type:i.cLu,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new i.dd2(l,u,{type:i.cLu,depthBuffer:!1});t.texture.name="UnrealBloomPass.h"+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let r=new i.dd2(l,u,{type:i.cLu,depthBuffer:!1});r.texture.name="UnrealBloomPass.v"+e,r.texture.generateMipmaps=!1,this.renderTargetsVertical.push(r),l=Math.round(l/2),u=Math.round(u/2)}this.highPassUniforms=i.rDY.clone(n.uniforms),this.highPassUniforms.luminosityThreshold.value=o,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new i.jyz({uniforms:this.highPassUniforms,vertexShader:n.vertexShader,fragmentShader:n.fragmentShader}),this.separableBlurMaterials=[];let h=[6,10,14,18,22];l=Math.round(this.resolution.x/2),u=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(h[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new i.FM8(1/l,1/u),l=Math.round(l/2),u=Math.round(u/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1,this.compositeMaterial.uniforms.bloomFactors.value=[1,.8,.6,.4,.2],this.bloomTintColors=[new i.Pa4(1,1,1),new i.Pa4(1,1,1),new i.Pa4(1,1,1),new i.Pa4(1,1,1),new i.Pa4(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=i.rDY.clone(a.C.uniforms),this.blendMaterial=new i.jyz({uniforms:this.copyUniforms,vertexShader:a.C.vertexShader,fragmentShader:a.C.fragmentShader,premultipliedAlpha:!0,blending:i.WMw,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new i.Ilk,this._oldClearAlpha=1,this._basic=new i.vBJ,this._fsQuad=new s.T(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let r=Math.round(e/2),s=Math.round(t/2);this.renderTargetBright.setSize(r,s);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(r,s),this.renderTargetsVertical[e].setSize(r,s),this.separableBlurMaterials[e].uniforms.invSize.value=new i.FM8(1/r,1/s),r=Math.round(r/2),s=Math.round(s/2)}render(e,t,r,i,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let n=this.renderTargetBright;for(let t=0;t<this.nMips;t++)this._fsQuad.material=this.separableBlurMaterials[t],this.separableBlurMaterials[t].uniforms.colorTexture.value=n.texture,this.separableBlurMaterials[t].uniforms.direction.value=o.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[t]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[t].uniforms.colorTexture.value=this.renderTargetsHorizontal[t].texture,this.separableBlurMaterials[t].uniforms.direction.value=o.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[t]),e.clear(),this._fsQuad.render(e),n=this.renderTargetsVertical[t];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?e.setRenderTarget(null):e.setRenderTarget(r),this._fsQuad.render(e),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){let t=[],r=e/3;for(let i=0;i<e;i++)t.push(.39894*Math.exp(-.5*i*i/(r*r))/r);let s=[],a=[];for(let r=1;r<e;r+=2){let i=t[r],n=r+1<e?t[r+1]:0,o=i+n;s.push((r*i+(r+1)*n)/o),a.push(o)}return new i.jyz({defines:{KERNEL_PAIRS:s.length},uniforms:{colorTexture:{value:null},invSize:{value:new i.FM8(.5,.5)},direction:{value:new i.FM8(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:s},gaussianWeights:{value:a}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new i.jyz({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}o.BlurDirectionX=new i.FM8(1,0),o.BlurDirectionY=new i.FM8(0,1)},2552:function(e,t,r){r.d(t,{C:function(){return i}});let i={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`}},1545:function(e,t,r){r.d(t,{$1:function(){return n},Vs:function(){return o},n4:function(){return s}});var i=r(2079);function s(e,t=!1){let r=null!==e[0].index,s=new Set(Object.keys(e[0].attributes)),n=new Set(Object.keys(e[0].morphAttributes)),o={},l={},u=e[0].morphTargetsRelative,h=new i.u9r,c=0;for(let i=0;i<e.length;++i){let a=e[i],d=0;if(r!==(null!==a.index))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let e in a.attributes){if(!s.has(e))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+'. All geometries must have compatible attributes; make sure "'+e+'" attribute exists among all geometries, or in none of them.'),null;void 0===o[e]&&(o[e]=[]),o[e].push(a.attributes[e]),d++}if(d!==s.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+". Make sure all geometries have the same number of attributes."),null;if(u!==a.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let e in a.morphAttributes){if(!n.has(e))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+".  .morphAttributes must be consistent throughout all geometries."),null;void 0===l[e]&&(l[e]=[]),l[e].push(a.morphAttributes[e])}if(t){let e;if(r)e=a.index.count;else{if(void 0===a.attributes.position)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+i+". The geometry must have either an index or a position attribute"),null;e=a.attributes.position.count}h.addGroup(c,e,i),c+=e}}if(r){let t=0,r=[];for(let i=0;i<e.length;++i){let s=e[i].index;for(let e=0;e<s.count;++e)r.push(s.getX(e)+t);t+=e[i].attributes.position.count}h.setIndex(r)}for(let e in o){let t=a(o[e]);if(!t)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+e+" attribute."),null;h.setAttribute(e,t)}for(let e in l){let t=l[e][0].length;if(0!==t){h.morphAttributes=h.morphAttributes||{},h.morphAttributes[e]=[];for(let r=0;r<t;++r){let t=[];for(let i=0;i<l[e].length;++i)t.push(l[e][i][r]);let i=a(t);if(!i)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+e+" morphAttribute."),null;h.morphAttributes[e].push(i)}}}return h}function a(e){let t,r,s;let a=-1,n=0;for(let i=0;i<e.length;++i){let o=e[i];if(void 0===t&&(t=o.array.constructor),t!==o.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(void 0===r&&(r=o.itemSize),r!==o.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(void 0===s&&(s=o.normalized),s!==o.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(-1===a&&(a=o.gpuType),a!==o.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;n+=o.count*r}let o=new t(n),l=new i.TlE(o,r,s),u=0;for(let t=0;t<e.length;++t){let i=e[t];if(i.isInterleavedBufferAttribute){let e=u/r;for(let t=0,s=i.count;t<s;t++)for(let s=0;s<r;s++){let r=i.getComponent(t,s);l.setComponent(t+e,s,r)}}else o.set(i.array,u);u+=i.count*r}return void 0!==a&&(l.gpuType=a),l}function n(e,t=1e-4){t=Math.max(t,Number.EPSILON);let r={},i=e.getIndex(),s=e.getAttribute("position"),a=i?i.count:s.count,n=0,o=Object.keys(e.attributes),l={},u={},h=[],c=["getX","getY","getZ","getW"],d=["setX","setY","setZ","setW"];for(let t=0,r=o.length;t<r;t++){let r=o[t],i=e.attributes[r];l[r]=new i.constructor(new i.array.constructor(i.count*i.itemSize),i.itemSize,i.normalized);let s=e.morphAttributes[r];s&&(u[r]||(u[r]=[]),s.forEach((e,t)=>{let i=new e.array.constructor(e.count*e.itemSize);u[r][t]=new e.constructor(i,e.itemSize,e.normalized)}))}let f=.5*t,p=Math.pow(10,Math.log10(1/t)),m=f*p;for(let t=0;t<a;t++){let s=i?i.getX(t):t,a="";for(let t=0,r=o.length;t<r;t++){let r=o[t],i=e.getAttribute(r),n=i.itemSize;for(let e=0;e<n;e++)a+=`${Math.trunc(i[c[e]](s)*p+m)},`}if(a in r)h.push(r[a]);else{for(let t=0,r=o.length;t<r;t++){let r=o[t],i=e.getAttribute(r),a=e.morphAttributes[r],h=i.itemSize,f=l[r],p=u[r];for(let e=0;e<h;e++){let t=c[e],r=d[e];if(f[r](n,i[t](s)),a)for(let e=0,i=a.length;e<i;e++)p[e][r](n,a[e][t](s))}}r[a]=n,h.push(n),n++}}let g=e.clone();for(let t in e.attributes){let e=l[t];if(g.setAttribute(t,new e.constructor(e.array.slice(0,n*e.itemSize),e.itemSize,e.normalized)),t in u)for(let e=0;e<u[t].length;e++){let r=u[t][e];g.morphAttributes[t][e]=new r.constructor(r.array.slice(0,n*r.itemSize),r.itemSize,r.normalized)}}return g.setIndex(h),g}function o(e,t){if(t===i.WwZ)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(t!==i.z$h&&t!==i.UlW)return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",t),e;{let r=e.getIndex();if(null===r){let t=[],i=e.getAttribute("position");if(void 0===i)return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e;for(let e=0;e<i.count;e++)t.push(e);e.setIndex(t),r=e.getIndex()}let s=r.count-2,a=[];if(t===i.z$h)for(let e=1;e<=s;e++)a.push(r.getX(0)),a.push(r.getX(e)),a.push(r.getX(e+1));else for(let e=0;e<s;e++)e%2==0?(a.push(r.getX(e)),a.push(r.getX(e+1)),a.push(r.getX(e+2))):(a.push(r.getX(e+2)),a.push(r.getX(e+1)),a.push(r.getX(e)));return a.length/3!==s&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles."),e.setIndex(a),e.clearGroups(),e}}}}]);