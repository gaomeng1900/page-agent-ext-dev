var mainWorld = (function() {
  "use strict";
  function defineUnlistedScript(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const definition = defineUnlistedScript(() => {
    console.log("Page Agent Extension API initializing...");
    function sendMessage(action, payload) {
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
            action,
            payload
          },
          "*"
        );
      });
    }
    window.pageAgentExtension = {
      /**
       * 使用 key 进行认证
       * @param key - 从插件弹窗获取的 API key
       */
      async link(key) {
        if (!key || typeof key !== "string") {
          throw new Error("Key must be a non-empty string");
        }
        const result2 = await sendMessage("LINK", { key });
        console.log("✅ Page Agent Extension authenticated");
        return result2;
      },
      /**
       * 获取所有 tabs 列表
       */
      async listTabs() {
        return await sendMessage("GET_TABS");
      },
      /**
       * 在指定 tab 中执行 JavaScript 代码
       * @param tabId - 目标 tab 的 ID
       * @param script - 要执行的 JavaScript 代码字符串
       */
      async executeScript(tabId, script) {
        if (typeof tabId !== "number") {
          throw new Error("tabId must be a number");
        }
        if (typeof script !== "string") {
          throw new Error("script must be a string");
        }
        return await sendMessage("EXECUTE_SCRIPT", { tabId, code: script });
      }
    };
    console.log(
      "✅ Page Agent Extension API ready: pageAgentExtension.link(key), listTabs(), executeScript()"
    );
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi13b3JsZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS11bmxpc3RlZC1zY3JpcHQubWpzIiwiLi4vLi4vZW50cnlwb2ludHMvbWFpbi13b3JsZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lVW5saXN0ZWRTY3JpcHQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8g6L+Z5Liq6ISa5pys5Lya6KKr5rOo5YWl5Yiw6aG16Z2i55qEIG1haW4gd29ybGRcbmV4cG9ydCBkZWZhdWx0IGRlZmluZVVubGlzdGVkU2NyaXB0KCgpID0+IHtcblx0Y29uc29sZS5sb2coJ1BhZ2UgQWdlbnQgRXh0ZW5zaW9uIEFQSSBpbml0aWFsaXppbmcuLi4nKVxuXG5cdC8vIOmAmueUqOeahOa2iOaBr+WPkemAgeWHveaVsFxuXHRmdW5jdGlvbiBzZW5kTWVzc2FnZShhY3Rpb246IHN0cmluZywgcGF5bG9hZD86IGFueSk6IFByb21pc2U8YW55PiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VJZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpXG5cblx0XHRcdGNvbnN0IGxpc3RlbmVyID0gKGV2ZW50OiBNZXNzYWdlRXZlbnQpID0+IHtcblx0XHRcdFx0aWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93KSByZXR1cm5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEudHlwZSAhPT0gJ1BBR0VfQUdFTlRfUkVTUE9OU0UnKSByZXR1cm5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEubWVzc2FnZUlkICE9PSBtZXNzYWdlSWQpIHJldHVyblxuXG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbGlzdGVuZXIpXG5cblx0XHRcdFx0aWYgKGV2ZW50LmRhdGEuc3VjY2Vzcykge1xuXHRcdFx0XHRcdHJlc29sdmUoZXZlbnQuZGF0YS5kYXRhKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoZXZlbnQuZGF0YS5lcnJvcikpXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcilcblxuXHRcdFx0d2luZG93LnBvc3RNZXNzYWdlKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ1BBR0VfQUdFTlRfUkVRVUVTVCcsXG5cdFx0XHRcdFx0bWVzc2FnZUlkLFxuXHRcdFx0XHRcdGFjdGlvbixcblx0XHRcdFx0XHRwYXlsb2FkLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQnKicsXG5cdFx0XHQpXG5cdFx0fSlcblx0fVxuXG5cdC8vIOWIm+W7uiBwYWdlQWdlbnRFeHRlbnNpb24g5a+56LGhXG5cdDsod2luZG93IGFzIGFueSkucGFnZUFnZW50RXh0ZW5zaW9uID0ge1xuXHRcdC8qKlxuXHRcdCAqIOS9v+eUqCBrZXkg6L+b6KGM6K6k6K+BXG5cdFx0ICogQHBhcmFtIGtleSAtIOS7juaPkuS7tuW8ueeql+iOt+WPlueahCBBUEkga2V5XG5cdFx0ICovXG5cdFx0YXN5bmMgbGluayhrZXk6IHN0cmluZykge1xuXHRcdFx0aWYgKCFrZXkgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnKVxuXHRcdFx0fVxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZE1lc3NhZ2UoJ0xJTksnLCB7IGtleSB9KVxuXHRcdFx0Y29uc29sZS5sb2coJ+KchSBQYWdlIEFnZW50IEV4dGVuc2lvbiBhdXRoZW50aWNhdGVkJylcblx0XHRcdHJldHVybiByZXN1bHRcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICog6I635Y+W5omA5pyJIHRhYnMg5YiX6KGoXG5cdFx0ICovXG5cdFx0YXN5bmMgbGlzdFRhYnMoKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgc2VuZE1lc3NhZ2UoJ0dFVF9UQUJTJylcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICog5Zyo5oyH5a6aIHRhYiDkuK3miafooYwgSmF2YVNjcmlwdCDku6PnoIFcblx0XHQgKiBAcGFyYW0gdGFiSWQgLSDnm67moIcgdGFiIOeahCBJRFxuXHRcdCAqIEBwYXJhbSBzY3JpcHQgLSDopoHmiafooYznmoQgSmF2YVNjcmlwdCDku6PnoIHlrZfnrKbkuLJcblx0XHQgKi9cblx0XHRhc3luYyBleGVjdXRlU2NyaXB0KHRhYklkOiBudW1iZXIsIHNjcmlwdDogc3RyaW5nKSB7XG5cdFx0XHRpZiAodHlwZW9mIHRhYklkICE9PSAnbnVtYmVyJykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ3RhYklkIG11c3QgYmUgYSBudW1iZXInKVxuXHRcdFx0fVxuXHRcdFx0aWYgKHR5cGVvZiBzY3JpcHQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignc2NyaXB0IG11c3QgYmUgYSBzdHJpbmcnKVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGF3YWl0IHNlbmRNZXNzYWdlKCdFWEVDVVRFX1NDUklQVCcsIHsgdGFiSWQsIGNvZGU6IHNjcmlwdCB9KVxuXHRcdH0sXG5cdH1cblxuXHRjb25zb2xlLmxvZyhcblx0XHQn4pyFIFBhZ2UgQWdlbnQgRXh0ZW5zaW9uIEFQSSByZWFkeTogcGFnZUFnZW50RXh0ZW5zaW9uLmxpbmsoa2V5KSwgbGlzdFRhYnMoKSwgZXhlY3V0ZVNjcmlwdCgpJyxcblx0KVxufSlcbiJdLCJuYW1lcyI6WyJyZXN1bHQiXSwibWFwcGluZ3MiOiI7O0FBQU8sV0FBUyxxQkFBcUIsS0FBSztBQUN4QyxRQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsV0FBWSxRQUFPLEVBQUUsTUFBTSxJQUFHO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FDRkEsUUFBQSxhQUFBLHFCQUFBLE1BQUE7QUFDQyxZQUFBLElBQUEsMENBQUE7QUFHQSxhQUFBLFlBQUEsUUFBQSxTQUFBO0FBQ0MsYUFBQSxJQUFBLFFBQUEsQ0FBQSxTQUFBLFdBQUE7QUFDQyxjQUFBLFlBQUEsS0FBQSxPQUFBLEVBQUEsU0FBQSxFQUFBO0FBRUEsY0FBQSxXQUFBLENBQUEsVUFBQTtBQUNDLGNBQUEsTUFBQSxXQUFBLE9BQUE7QUFDQSxjQUFBLE1BQUEsS0FBQSxTQUFBLHNCQUFBO0FBQ0EsY0FBQSxNQUFBLEtBQUEsY0FBQSxVQUFBO0FBRUEsaUJBQUEsb0JBQUEsV0FBQSxRQUFBO0FBRUEsY0FBQSxNQUFBLEtBQUEsU0FBQTtBQUNDLG9CQUFBLE1BQUEsS0FBQSxJQUFBO0FBQUEsVUFBdUIsT0FBQTtBQUV2QixtQkFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLEtBQUEsQ0FBQTtBQUFBLFVBQWtDO0FBQUEsUUFDbkM7QUFHRCxlQUFBLGlCQUFBLFdBQUEsUUFBQTtBQUVBLGVBQUE7QUFBQSxVQUFPO0FBQUEsWUFDTixNQUFBO0FBQUEsWUFDTztBQUFBLFlBQ047QUFBQSxZQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0Q7QUFBQSxRQUNBO0FBQUEsTUFDRCxDQUFBO0FBQUEsSUFDQTtBQUlELFdBQUEscUJBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BQXFDLE1BQUEsS0FBQSxLQUFBO0FBTXBDLFlBQUEsQ0FBQSxPQUFBLE9BQUEsUUFBQSxVQUFBO0FBQ0MsZ0JBQUEsSUFBQSxNQUFBLGdDQUFBO0FBQUEsUUFBZ0Q7QUFFakQsY0FBQUEsVUFBQSxNQUFBLFlBQUEsUUFBQSxFQUFBLElBQUEsQ0FBQTtBQUNBLGdCQUFBLElBQUEsc0NBQUE7QUFDQSxlQUFBQTtBQUFBLE1BQU87QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUNSLE1BQUEsV0FBQTtBQU1DLGVBQUEsTUFBQSxZQUFBLFVBQUE7QUFBQSxNQUFtQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUNwQyxNQUFBLGNBQUEsT0FBQSxRQUFBO0FBUUMsWUFBQSxPQUFBLFVBQUEsVUFBQTtBQUNDLGdCQUFBLElBQUEsTUFBQSx3QkFBQTtBQUFBLFFBQXdDO0FBRXpDLFlBQUEsT0FBQSxXQUFBLFVBQUE7QUFDQyxnQkFBQSxJQUFBLE1BQUEseUJBQUE7QUFBQSxRQUF5QztBQUUxQyxlQUFBLE1BQUEsWUFBQSxrQkFBQSxFQUFBLE9BQUEsTUFBQSxRQUFBO0FBQUEsTUFBa0U7QUFBQSxJQUNuRTtBQUdELFlBQUE7QUFBQSxNQUFRO0FBQUEsSUFDUDtBQUFBLEVBRUYsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMF19
mainWorld;