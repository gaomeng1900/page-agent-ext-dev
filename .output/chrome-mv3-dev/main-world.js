var mainWorld = (function() {
  "use strict";
  function defineUnlistedScript(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const definition = defineUnlistedScript(() => {
    console.log(
      "%c🌐 Page Agent Extension API",
      "color: #9c27b0; font-weight: bold; font-size: 16px"
    );
    const sessionId = "session_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    console.log(
      "%c   Session ID: " + sessionId,
      "color: #673ab7; font-weight: bold"
    );
    function sendMessage(action, payload) {
      return new Promise((resolve, reject) => {
        const messageId = Math.random().toString(36);
        console.log(
          `%c➡️  [Page → Content] ${action}`,
          "color: #2196f3; font-weight: bold"
        );
        console.log(
          `%c   Message ID: ${messageId.substring(
            0,
            8
          )}... | Session: ${sessionId.substring(0, 12)}...`,
          "color: #999"
        );
        const listener = (event) => {
          if (event.source !== window) return;
          if (event.data.type !== "PAGE_AGENT_RESPONSE") return;
          if (event.data.messageId !== messageId) return;
          window.removeEventListener("message", listener);
          console.log(
            `%c⬅️  [Content → Page] Response`,
            "color: #4caf50; font-weight: bold"
          );
          console.log(
            `%c   Success: ${event.data.success}`,
            "color: #999"
          );
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
            sessionId,
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
      "%c✅ API Ready",
      "color: #4caf50; font-weight: bold; font-size: 14px"
    );
    console.log(
      "%c   • pageAgentExtension.link(key)\n   • pageAgentExtension.listTabs()\n   • pageAgentExtension.executeScript(tabId, script)",
      "color: #999; font-size: 12px"
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi13b3JsZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS11bmxpc3RlZC1zY3JpcHQubWpzIiwiLi4vLi4vZW50cnlwb2ludHMvbWFpbi13b3JsZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lVW5saXN0ZWRTY3JpcHQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8g6L+Z5Liq6ISa5pys5Lya6KKr5rOo5YWl5Yiw6aG16Z2i55qEIG1haW4gd29ybGRcbmV4cG9ydCBkZWZhdWx0IGRlZmluZVVubGlzdGVkU2NyaXB0KCgpID0+IHtcblx0Y29uc29sZS5sb2coXG5cdFx0JyVj8J+MkCBQYWdlIEFnZW50IEV4dGVuc2lvbiBBUEknLFxuXHRcdCdjb2xvcjogIzljMjdiMDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGZvbnQtc2l6ZTogMTZweCcsXG5cdClcblxuXHQvLyDnlJ/miJDllK/kuIDnmoQgc2Vzc2lvbiBJRFxuXHRjb25zdCBzZXNzaW9uSWQgPVxuXHRcdCdzZXNzaW9uXycgK1xuXHRcdE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKSArXG5cdFx0RGF0ZS5ub3coKS50b1N0cmluZygzNilcblxuXHRjb25zb2xlLmxvZyhcblx0XHQnJWMgICBTZXNzaW9uIElEOiAnICsgc2Vzc2lvbklkLFxuXHRcdCdjb2xvcjogIzY3M2FiNzsgZm9udC13ZWlnaHQ6IGJvbGQnLFxuXHQpXG5cblx0Ly8g6YCa55So55qE5raI5oGv5Y+R6YCB5Ye95pWwXG5cdGZ1bmN0aW9uIHNlbmRNZXNzYWdlKGFjdGlvbjogc3RyaW5nLCBwYXlsb2FkPzogYW55KTogUHJvbWlzZTxhbnk+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgbWVzc2FnZUlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNilcblxuXHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdGAlY+Keoe+4jyAgW1BhZ2Ug4oaSIENvbnRlbnRdICR7YWN0aW9ufWAsXG5cdFx0XHRcdCdjb2xvcjogIzIxOTZmMzsgZm9udC13ZWlnaHQ6IGJvbGQnLFxuXHRcdFx0KVxuXHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdGAlYyAgIE1lc3NhZ2UgSUQ6ICR7bWVzc2FnZUlkLnN1YnN0cmluZyhcblx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdDgsXG5cdFx0XHRcdCl9Li4uIHwgU2Vzc2lvbjogJHtzZXNzaW9uSWQuc3Vic3RyaW5nKDAsIDEyKX0uLi5gLFxuXHRcdFx0XHQnY29sb3I6ICM5OTknLFxuXHRcdFx0KVxuXG5cdFx0XHRjb25zdCBsaXN0ZW5lciA9IChldmVudDogTWVzc2FnZUV2ZW50KSA9PiB7XG5cdFx0XHRcdGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdykgcmV0dXJuXG5cdFx0XHRcdGlmIChldmVudC5kYXRhLnR5cGUgIT09ICdQQUdFX0FHRU5UX1JFU1BPTlNFJykgcmV0dXJuXG5cdFx0XHRcdGlmIChldmVudC5kYXRhLm1lc3NhZ2VJZCAhPT0gbWVzc2FnZUlkKSByZXR1cm5cblxuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKVxuXG5cdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdGAlY+Kshe+4jyAgW0NvbnRlbnQg4oaSIFBhZ2VdIFJlc3BvbnNlYCxcblx0XHRcdFx0XHQnY29sb3I6ICM0Y2FmNTA7IGZvbnQtd2VpZ2h0OiBib2xkJyxcblx0XHRcdFx0KVxuXHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRgJWMgICBTdWNjZXNzOiAke2V2ZW50LmRhdGEuc3VjY2Vzc31gLFxuXHRcdFx0XHRcdCdjb2xvcjogIzk5OScsXG5cdFx0XHRcdClcblxuXHRcdFx0XHRpZiAoZXZlbnQuZGF0YS5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShldmVudC5kYXRhLmRhdGEpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihldmVudC5kYXRhLmVycm9yKSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKVxuXG5cdFx0XHR3aW5kb3cucG9zdE1lc3NhZ2UoXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0eXBlOiAnUEFHRV9BR0VOVF9SRVFVRVNUJyxcblx0XHRcdFx0XHRtZXNzYWdlSWQsXG5cdFx0XHRcdFx0c2Vzc2lvbklkLFxuXHRcdFx0XHRcdGFjdGlvbixcblx0XHRcdFx0XHRwYXlsb2FkLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQnKicsXG5cdFx0XHQpXG5cdFx0fSlcblx0fVxuXG5cdC8vIOWIm+W7uiBwYWdlQWdlbnRFeHRlbnNpb24g5a+56LGhXG5cdDsod2luZG93IGFzIGFueSkucGFnZUFnZW50RXh0ZW5zaW9uID0ge1xuXHRcdC8qKlxuXHRcdCAqIOS9v+eUqCBrZXkg6L+b6KGM6K6k6K+BXG5cdFx0ICogQHBhcmFtIGtleSAtIOS7juaPkuS7tuW8ueeql+iOt+WPlueahCBBUEkga2V5XG5cdFx0ICovXG5cdFx0YXN5bmMgbGluayhrZXk6IHN0cmluZykge1xuXHRcdFx0aWYgKCFrZXkgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcnKVxuXHRcdFx0fVxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZE1lc3NhZ2UoJ0xJTksnLCB7IGtleSB9KVxuXHRcdFx0Y29uc29sZS5sb2coJ+KchSBQYWdlIEFnZW50IEV4dGVuc2lvbiBhdXRoZW50aWNhdGVkJylcblx0XHRcdHJldHVybiByZXN1bHRcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICog6I635Y+W5omA5pyJIHRhYnMg5YiX6KGoXG5cdFx0ICovXG5cdFx0YXN5bmMgbGlzdFRhYnMoKSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgc2VuZE1lc3NhZ2UoJ0dFVF9UQUJTJylcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICog5Zyo5oyH5a6aIHRhYiDkuK3miafooYwgSmF2YVNjcmlwdCDku6PnoIFcblx0XHQgKiBAcGFyYW0gdGFiSWQgLSDnm67moIcgdGFiIOeahCBJRFxuXHRcdCAqIEBwYXJhbSBzY3JpcHQgLSDopoHmiafooYznmoQgSmF2YVNjcmlwdCDku6PnoIHlrZfnrKbkuLJcblx0XHQgKi9cblx0XHRhc3luYyBleGVjdXRlU2NyaXB0KHRhYklkOiBudW1iZXIsIHNjcmlwdDogc3RyaW5nKSB7XG5cdFx0XHRpZiAodHlwZW9mIHRhYklkICE9PSAnbnVtYmVyJykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ3RhYklkIG11c3QgYmUgYSBudW1iZXInKVxuXHRcdFx0fVxuXHRcdFx0aWYgKHR5cGVvZiBzY3JpcHQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignc2NyaXB0IG11c3QgYmUgYSBzdHJpbmcnKVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGF3YWl0IHNlbmRNZXNzYWdlKCdFWEVDVVRFX1NDUklQVCcsIHsgdGFiSWQsIGNvZGU6IHNjcmlwdCB9KVxuXHRcdH0sXG5cdH1cblxuXHRjb25zb2xlLmxvZyhcblx0XHQnJWPinIUgQVBJIFJlYWR5Jyxcblx0XHQnY29sb3I6ICM0Y2FmNTA7IGZvbnQtd2VpZ2h0OiBib2xkOyBmb250LXNpemU6IDE0cHgnLFxuXHQpXG5cdGNvbnNvbGUubG9nKFxuXHRcdCclYyAgIOKAoiBwYWdlQWdlbnRFeHRlbnNpb24ubGluayhrZXkpXFxuICAg4oCiIHBhZ2VBZ2VudEV4dGVuc2lvbi5saXN0VGFicygpXFxuICAg4oCiIHBhZ2VBZ2VudEV4dGVuc2lvbi5leGVjdXRlU2NyaXB0KHRhYklkLCBzY3JpcHQpJyxcblx0XHQnY29sb3I6ICM5OTk7IGZvbnQtc2l6ZTogMTJweCcsXG5cdClcbn0pXG4iXSwibmFtZXMiOlsicmVzdWx0Il0sIm1hcHBpbmdzIjoiOztBQUFPLFdBQVMscUJBQXFCLEtBQUs7QUFDeEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBRztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQ0ZBLFFBQUEsYUFBQSxxQkFBQSxNQUFBO0FBQ0MsWUFBQTtBQUFBLE1BQVE7QUFBQSxNQUNQO0FBQUEsSUFDQTtBQUlELFVBQUEsWUFBQSxhQUFBLEtBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxFQUFBLFVBQUEsQ0FBQSxJQUFBLEtBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQTtBQUtBLFlBQUE7QUFBQSxNQUFRLHNCQUFBO0FBQUEsTUFDZTtBQUFBLElBQ3RCO0FBSUQsYUFBQSxZQUFBLFFBQUEsU0FBQTtBQUNDLGFBQUEsSUFBQSxRQUFBLENBQUEsU0FBQSxXQUFBO0FBQ0MsY0FBQSxZQUFBLEtBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTtBQUVBLGdCQUFBO0FBQUEsVUFBUSwwQkFBQSxNQUFBO0FBQUEsVUFDeUI7QUFBQSxRQUNoQztBQUVELGdCQUFBO0FBQUEsVUFBUSxvQkFBQSxVQUFBO0FBQUEsWUFDdUI7QUFBQSxZQUM3QjtBQUFBLFVBQ0EsQ0FBQSxrQkFBQSxVQUFBLFVBQUEsR0FBQSxFQUFBLENBQUE7QUFBQSxVQUM0QztBQUFBLFFBQzdDO0FBR0QsY0FBQSxXQUFBLENBQUEsVUFBQTtBQUNDLGNBQUEsTUFBQSxXQUFBLE9BQUE7QUFDQSxjQUFBLE1BQUEsS0FBQSxTQUFBLHNCQUFBO0FBQ0EsY0FBQSxNQUFBLEtBQUEsY0FBQSxVQUFBO0FBRUEsaUJBQUEsb0JBQUEsV0FBQSxRQUFBO0FBRUEsa0JBQUE7QUFBQSxZQUFRO0FBQUEsWUFDUDtBQUFBLFVBQ0E7QUFFRCxrQkFBQTtBQUFBLFlBQVEsaUJBQUEsTUFBQSxLQUFBLE9BQUE7QUFBQSxZQUM0QjtBQUFBLFVBQ25DO0FBR0QsY0FBQSxNQUFBLEtBQUEsU0FBQTtBQUNDLG9CQUFBLE1BQUEsS0FBQSxJQUFBO0FBQUEsVUFBdUIsT0FBQTtBQUV2QixtQkFBQSxJQUFBLE1BQUEsTUFBQSxLQUFBLEtBQUEsQ0FBQTtBQUFBLFVBQWtDO0FBQUEsUUFDbkM7QUFHRCxlQUFBLGlCQUFBLFdBQUEsUUFBQTtBQUVBLGVBQUE7QUFBQSxVQUFPO0FBQUEsWUFDTixNQUFBO0FBQUEsWUFDTztBQUFBLFlBQ047QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNEO0FBQUEsUUFDQTtBQUFBLE1BQ0QsQ0FBQTtBQUFBLElBQ0E7QUFJRCxXQUFBLHFCQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUFxQyxNQUFBLEtBQUEsS0FBQTtBQU1wQyxZQUFBLENBQUEsT0FBQSxPQUFBLFFBQUEsVUFBQTtBQUNDLGdCQUFBLElBQUEsTUFBQSxnQ0FBQTtBQUFBLFFBQWdEO0FBRWpELGNBQUFBLFVBQUEsTUFBQSxZQUFBLFFBQUEsRUFBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxJQUFBLHNDQUFBO0FBQ0EsZUFBQUE7QUFBQSxNQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFDUixNQUFBLFdBQUE7QUFNQyxlQUFBLE1BQUEsWUFBQSxVQUFBO0FBQUEsTUFBbUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFDcEMsTUFBQSxjQUFBLE9BQUEsUUFBQTtBQVFDLFlBQUEsT0FBQSxVQUFBLFVBQUE7QUFDQyxnQkFBQSxJQUFBLE1BQUEsd0JBQUE7QUFBQSxRQUF3QztBQUV6QyxZQUFBLE9BQUEsV0FBQSxVQUFBO0FBQ0MsZ0JBQUEsSUFBQSxNQUFBLHlCQUFBO0FBQUEsUUFBeUM7QUFFMUMsZUFBQSxNQUFBLFlBQUEsa0JBQUEsRUFBQSxPQUFBLE1BQUEsUUFBQTtBQUFBLE1BQWtFO0FBQUEsSUFDbkU7QUFHRCxZQUFBO0FBQUEsTUFBUTtBQUFBLE1BQ1A7QUFBQSxJQUNBO0FBRUQsWUFBQTtBQUFBLE1BQVE7QUFBQSxNQUNQO0FBQUEsSUFDQTtBQUFBLEVBRUYsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMF19
mainWorld;