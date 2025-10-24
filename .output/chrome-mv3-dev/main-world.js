var mainWorld = (function() {
  "use strict";
  function defineUnlistedScript(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const definition = defineUnlistedScript(() => {
    console.log("Page agent API injecting into main world...");
    window.getTabs = async function() {
      return new Promise((resolve, reject) => {
        const messageId = Math.random().toString(36);
        const listener = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== "PAGE_AGENT_RESPONSE") return;
          if (event.data.messageId !== messageId) return;
          window.removeEventListener("message", listener);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        };
        window.addEventListener("message", listener);
        window.postMessage(
          {
            type: "PAGE_AGENT_REQUEST",
            messageId,
            action: "GET_TABS"
          },
          "*"
        );
      });
    };
    window.execute = async function(tabId, code) {
      return new Promise((resolve, reject) => {
        const messageId = Math.random().toString(36);
        const listener = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== "PAGE_AGENT_RESPONSE") return;
          if (event.data.messageId !== messageId) return;
          window.removeEventListener("message", listener);
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        };
        window.addEventListener("message", listener);
        window.postMessage(
          {
            type: "PAGE_AGENT_REQUEST",
            messageId,
            action: "EXECUTE_SCRIPT",
            payload: { tabId, code }
          },
          "*"
        );
      });
    };
    console.log("Page agent API injected: getTabs(), execute()");
  });
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      return await definition.main();
    } catch (err) {
      logger.error(
        `The unlisted script "${"main-world"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi13b3JsZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS11bmxpc3RlZC1zY3JpcHQubWpzIiwiLi4vLi4vZW50cnlwb2ludHMvbWFpbi13b3JsZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lVW5saXN0ZWRTY3JpcHQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8g6L+Z5Liq6ISa5pys5Lya6KKr5rOo5YWl5Yiw6aG16Z2i55qEIG1haW4gd29ybGRcbmV4cG9ydCBkZWZhdWx0IGRlZmluZVVubGlzdGVkU2NyaXB0KCgpID0+IHtcblx0Y29uc29sZS5sb2coJ1BhZ2UgYWdlbnQgQVBJIGluamVjdGluZyBpbnRvIG1haW4gd29ybGQuLi4nKVxuXG5cdC8vIOS9v+eUqCB3aW5kb3cucG9zdE1lc3NhZ2Ug5LiOIGNvbnRlbnQgc2NyaXB0IOmAmuS/oVxuXHQ7KHdpbmRvdyBhcyBhbnkpLmdldFRhYnMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VJZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpXG5cblx0XHRcdGNvbnN0IGxpc3RlbmVyID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcblx0XHRcdFx0aWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93KSByZXR1cm5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEudHlwZSAhPT0gJ1BBR0VfQUdFTlRfUkVTUE9OU0UnKSByZXR1cm5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEubWVzc2FnZUlkICE9PSBtZXNzYWdlSWQpIHJldHVyblxuXG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbGlzdGVuZXIpXG5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEuc3VjY2Vzcykge1xuXHRcdFx0XHRcdHJlc29sdmUoZXZlbnQuZGF0YS5kYXRhKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcikpXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcilcblxuXHRcdFx0d2luZG93LnBvc3RNZXNzYWdlKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ1BBR0VfQUdFTlRfUkVRVUVTVCcsXG5cdFx0XHRcdFx0bWVzc2FnZUlkOiBtZXNzYWdlSWQsXG5cdFx0XHRcdFx0YWN0aW9uOiAnR0VUX1RBQlMnLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQnKicsXG5cdFx0XHQpXG5cdFx0fSlcblx0fVxuXG5cdDsod2luZG93IGFzIGFueSkuZXhlY3V0ZSA9IGFzeW5jIGZ1bmN0aW9uICh0YWJJZDogbnVtYmVyLCBjb2RlOiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgbWVzc2FnZUlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNilcblxuXHRcdFx0Y29uc3QgbGlzdGVuZXIgPSAoZXZlbnQ6IE1lc3NhZ2VFdmVudCkgPT4ge1xuXHRcdFx0XHRpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cpIHJldHVyblxuXHRcdFx0XHRpZiAoZXZlbnQuZGF0YS50eXBlICE9PSAnUEFHRV9BR0VOVF9SRVNQT05TRScpIHJldHVyblxuXHRcdFx0XHRpZiAoZXZlbnQuZGF0YS5tZXNzYWdlSWQgIT09IG1lc3NhZ2VJZCkgcmV0dXJuXG5cblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcilcblxuXHRcdFx0XHRpZiAoZXZlbnQuZGF0YS5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShldmVudC5kYXRhLmRhdGEpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihldmVudC5kYXRhLmVycm9yKSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKVxuXG5cdFx0XHR3aW5kb3cucG9zdE1lc3NhZ2UoXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0eXBlOiAnUEFHRV9BR0VOVF9SRVFVRVNUJyxcblx0XHRcdFx0XHRtZXNzYWdlSWQ6IG1lc3NhZ2VJZCxcblx0XHRcdFx0XHRhY3Rpb246ICdFWEVDVVRFX1NDUklQVCcsXG5cdFx0XHRcdFx0cGF5bG9hZDogeyB0YWJJZCwgY29kZSB9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQnKicsXG5cdFx0XHQpXG5cdFx0fSlcblx0fVxuXG5cdGNvbnNvbGUubG9nKCdQYWdlIGFnZW50IEFQSSBpbmplY3RlZDogZ2V0VGFicygpLCBleGVjdXRlKCknKVxufSlcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFPLFdBQVMscUJBQXFCLEtBQUs7QUFDeEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBRztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQ0ZBLFFBQUEsYUFBQSxxQkFBQSxNQUFBO0FBQ0MsWUFBQSxJQUFBLDZDQUFBO0FBR0MsV0FBQSxVQUFBLGlCQUFBO0FBQ0EsYUFBQSxJQUFBLFFBQUEsQ0FBQSxTQUFBLFdBQUE7QUFDQyxjQUFBLFlBQUEsS0FBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBRUEsY0FBQSxXQUFBLENBQUEsVUFBQTtBQUNDLGNBQUEsTUFBQSxXQUFBLE9BQUE7QUFDQSxjQUFBLE1BQUEsS0FBQSxTQUFBLHNCQUFBO0FBQ0EsY0FBQSxNQUFBLEtBQUEsY0FBQSxVQUFBO0FBRUEsaUJBQUEsb0JBQUEsV0FBQSxRQUFBO0FBRUEsY0FBQSxNQUFBLEtBQUEsU0FBQTtBQUNDLG9CQUFBLE1BQUEsS0FBQSxJQUFBO0FBQUEsVUFBdUIsT0FBQTtBQUV2QixtQkFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLEtBQUEsQ0FBQTtBQUFBLFVBQWtDO0FBQUEsUUFDbkM7QUFHRCxlQUFBLGlCQUFBLFdBQUEsUUFBQTtBQUVBLGVBQUE7QUFBQSxVQUFPO0FBQUEsWUFDTixNQUFBO0FBQUEsWUFDTztBQUFBLFlBQ04sUUFBQTtBQUFBLFVBQ1E7QUFBQSxVQUNUO0FBQUEsUUFDQTtBQUFBLE1BQ0QsQ0FBQTtBQUFBLElBQ0E7QUFHRCxXQUFBLFVBQUEsZUFBQSxPQUFBLE1BQUE7QUFDQSxhQUFBLElBQUEsUUFBQSxDQUFBLFNBQUEsV0FBQTtBQUNDLGNBQUEsWUFBQSxLQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUE7QUFFQSxjQUFBLFdBQUEsQ0FBQSxVQUFBO0FBQ0MsY0FBQSxNQUFBLFdBQUEsT0FBQTtBQUNBLGNBQUEsTUFBQSxLQUFBLFNBQUEsc0JBQUE7QUFDQSxjQUFBLE1BQUEsS0FBQSxjQUFBLFVBQUE7QUFFQSxpQkFBQSxvQkFBQSxXQUFBLFFBQUE7QUFFQSxjQUFBLE1BQUEsS0FBQSxTQUFBO0FBQ0Msb0JBQUEsTUFBQSxLQUFBLElBQUE7QUFBQSxVQUF1QixPQUFBO0FBRXZCLG1CQUFBLElBQUEsTUFBQSxNQUFBLEtBQUEsS0FBQSxDQUFBO0FBQUEsVUFBa0M7QUFBQSxRQUNuQztBQUdELGVBQUEsaUJBQUEsV0FBQSxRQUFBO0FBRUEsZUFBQTtBQUFBLFVBQU87QUFBQSxZQUNOLE1BQUE7QUFBQSxZQUNPO0FBQUEsWUFDTixRQUFBO0FBQUEsWUFDUSxTQUFBLEVBQUEsT0FBQSxLQUFBO0FBQUEsVUFDZTtBQUFBLFVBQ3hCO0FBQUEsUUFDQTtBQUFBLE1BQ0QsQ0FBQTtBQUFBLElBQ0E7QUFHRixZQUFBLElBQUEsK0NBQUE7QUFBQSxFQUNELENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzBdfQ==
mainWorld;