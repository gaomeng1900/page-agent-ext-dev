var background = (function() {
  "use strict";
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      }
    );
  }
  const authenticatedTabs = /* @__PURE__ */ new Map();
  let apiKey = generateUUID();
  console.log("Generated new API key:", apiKey);
  const definition = defineBackground(() => {
    console.log("Background service worker started");
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        const handleMessage = async () => {
          try {
            if (message.type === "GET_API_KEY") {
              return {
                success: true,
                data: apiKey
              };
            }
            if (message.type === "REFRESH_API_KEY") {
              apiKey = generateUUID();
              authenticatedTabs.clear();
              console.log("Refreshed API key:", apiKey);
              return {
                success: true,
                data: apiKey
              };
            }
            if (message.type === "LINK") {
              const { key } = message.payload;
              const tabId2 = sender.tab?.id;
              if (!tabId2) {
                return {
                  success: false,
                  error: "No tab ID"
                };
              }
              if (key === apiKey) {
                authenticatedTabs.set(tabId2, true);
                console.log(`Tab ${tabId2} authenticated`);
                return {
                  success: true,
                  data: { authenticated: true }
                };
              } else {
                return {
                  success: false,
                  error: "Invalid key"
                };
              }
            }
            const tabId = sender.tab?.id;
            if (!tabId || !authenticatedTabs.get(tabId)) {
              return {
                success: false,
                error: "Not authenticated. Call link(key) first."
              };
            }
            if (message.type === "GET_TABS") {
              const tabs = await chrome.tabs.query({});
              return {
                success: true,
                data: tabs.map((tab) => ({
                  id: tab.id,
                  title: tab.title,
                  url: tab.url,
                  active: tab.active,
                  windowId: tab.windowId
                }))
              };
            }
            if (message.type === "EXECUTE_SCRIPT") {
              const { tabId, code } = message.payload;
              if (!tabId || !code) {
                return {
                  success: false,
                  error: "Missing tabId or code"
                };
              }
              const results = await chrome.scripting.executeScript({
                target: { tabId },
                world: "MAIN",
                func: (codeString) => {
                  return eval(codeString);
                },
                args: [code]
              });
              return {
                success: true,
                data: results[0]?.result
              };
            }
            return {
              success: false,
              error: "Unknown message type"
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        };
        handleMessage().then(sendResponse);
        return true;
      }
    );
  });
  function initPlugins() {
  }
  const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message2 = args.shift();
      method(`[wxt] ${message2}`, ...args);
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
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "ws://localhost:3001";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message2 = JSON.parse(e.data);
          if (message2.type === "custom") {
            ws?.dispatchEvent(
              new CustomEvent(message2.event, { detail: message2.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([
        {
          ...contentScript,
          id,
          css: contentScript.css ?? []
        }
      ]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([
        {
          ...contentScript,
          id,
          css: contentScript.css ?? []
        }
      ]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
      const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQvaW5kZXgudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiLy8g55Sf5oiQ6ZqP5py6IFVVSURcbmZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpOiBzdHJpbmcge1xuXHRyZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZShcblx0XHQvW3h5XS9nLFxuXHRcdGZ1bmN0aW9uIChjKSB7XG5cdFx0XHRjb25zdCByID0gKE1hdGgucmFuZG9tKCkgKiAxNikgfCAwXG5cdFx0XHRjb25zdCB2ID0gYyA9PT0gJ3gnID8gciA6IChyICYgMHgzKSB8IDB4OFxuXHRcdFx0cmV0dXJuIHYudG9TdHJpbmcoMTYpXG5cdFx0fSxcblx0KVxufVxuXG4vLyDlrZjlgqjorqTor4Hkv6Hmga/vvJp0YWJJZCAtPiDmmK/lkKblt7LorqTor4FcbmNvbnN0IGF1dGhlbnRpY2F0ZWRUYWJzID0gbmV3IE1hcDxudW1iZXIsIGJvb2xlYW4+KClcblxuLy8g55Sf5oiQ5bm25a2Y5YKoIEFQSSBrZXlcbmxldCBhcGlLZXkgPSBnZW5lcmF0ZVVVSUQoKVxuXG4vLyDmr4/mrKHph43lkK8gYmFja2dyb3VuZCDph43mlrDnlJ/miJAga2V5XG5jb25zb2xlLmxvZygnR2VuZXJhdGVkIG5ldyBBUEkga2V5OicsIGFwaUtleSlcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG5cdGNvbnNvbGUubG9nKCdCYWNrZ3JvdW5kIHNlcnZpY2Ugd29ya2VyIHN0YXJ0ZWQnKVxuXG5cdC8vIOebkeWQrOadpeiHqiBjb250ZW50IHNjcmlwdCDnmoTmtojmga9cblx0Y2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuXHRcdChcblx0XHRcdG1lc3NhZ2U6IGFueSxcblx0XHRcdHNlbmRlcjogY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcblx0XHRcdHNlbmRSZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+IHZvaWQsXG5cdFx0KSA9PiB7XG5cdFx0XHRjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIOiOt+WPluW9k+WJjSBBUEkga2V577yI55So5LqOIHBvcHVwIOaYvuekuu+8iVxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdHRVRfQVBJX0tFWScpIHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRhdGE6IGFwaUtleSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyDliLfmlrAgQVBJIGtleVxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdSRUZSRVNIX0FQSV9LRVknKSB7XG5cdFx0XHRcdFx0XHRhcGlLZXkgPSBnZW5lcmF0ZVVVSUQoKVxuXHRcdFx0XHRcdFx0YXV0aGVudGljYXRlZFRhYnMuY2xlYXIoKVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1JlZnJlc2hlZCBBUEkga2V5OicsIGFwaUtleSlcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRhdGE6IGFwaUtleSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBMaW5rIOiupOivgVxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdMSU5LJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBrZXkgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXHRcdFx0XHRcdFx0Y29uc3QgdGFiSWQgPSBzZW5kZXIudGFiPy5pZFxuXG5cdFx0XHRcdFx0XHRpZiAoIXRhYklkKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdObyB0YWIgSUQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChrZXkgPT09IGFwaUtleSkge1xuXHRcdFx0XHRcdFx0XHRhdXRoZW50aWNhdGVkVGFicy5zZXQodGFiSWQsIHRydWUpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBUYWIgJHt0YWJJZH0gYXV0aGVudGljYXRlZGApXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRkYXRhOiB7IGF1dGhlbnRpY2F0ZWQ6IHRydWUgfSxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ0ludmFsaWQga2V5Jyxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIOmqjOivgeiupOivgeeKtuaAgVxuXHRcdFx0XHRcdGNvbnN0IHRhYklkID0gc2VuZGVyLnRhYj8uaWRcblx0XHRcdFx0XHRpZiAoIXRhYklkIHx8ICFhdXRoZW50aWNhdGVkVGFicy5nZXQodGFiSWQpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdOb3QgYXV0aGVudGljYXRlZC4gQ2FsbCBsaW5rKGtleSkgZmlyc3QuJyxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnR0VUX1RBQlMnKSB7XG5cdFx0XHRcdFx0XHQvLyDojrflj5bmiYDmnIkgdGFic1xuXHRcdFx0XHRcdFx0Y29uc3QgdGFicyA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHt9KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGF0YTogdGFicy5tYXAoKHRhYjogY2hyb21lLnRhYnMuVGFiKSA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdGlkOiB0YWIuaWQsXG5cdFx0XHRcdFx0XHRcdFx0dGl0bGU6IHRhYi50aXRsZSxcblx0XHRcdFx0XHRcdFx0XHR1cmw6IHRhYi51cmwsXG5cdFx0XHRcdFx0XHRcdFx0YWN0aXZlOiB0YWIuYWN0aXZlLFxuXHRcdFx0XHRcdFx0XHRcdHdpbmRvd0lkOiB0YWIud2luZG93SWQsXG5cdFx0XHRcdFx0XHRcdH0pKSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnRVhFQ1VURV9TQ1JJUFQnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IHRhYklkLCBjb2RlIH0gPSBtZXNzYWdlLnBheWxvYWRcblxuXHRcdFx0XHRcdFx0aWYgKCF0YWJJZCB8fCAhY29kZSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiAnTWlzc2luZyB0YWJJZCBvciBjb2RlJyxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyDlnKjnm67moIcgdGFiIOeahCBNQUlOIHdvcmxkIOS4reaJp+ihjOS7o+eggVxuXHRcdFx0XHRcdFx0Ly8g6L+Z5qC35Y+v5Lul57uV6L+HIGlzb2xhdGVkIHdvcmxkIOeahCBDU1Ag6ZmQ5Yi2XG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0OiB7IHRhYklkIH0sXG5cdFx0XHRcdFx0XHRcdHdvcmxkOiAnTUFJTicsXG5cdFx0XHRcdFx0XHRcdGZ1bmM6IChjb2RlU3RyaW5nOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHRcdFx0XHQvLyDlnKggTUFJTiB3b3JsZCDkuK3vvIxldmFsIOaYr+WFgeiuuOeahFxuXHRcdFx0XHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1ldmFsXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGV2YWwoY29kZVN0cmluZylcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0YXJnczogW2NvZGVdLFxuXHRcdFx0XHRcdFx0fSlcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGF0YTogcmVzdWx0c1swXT8ucmVzdWx0LFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdGVycm9yOiAnVW5rbm93biBtZXNzYWdlIHR5cGUnLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRlcnJvcjpcblx0XHRcdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHRcdFx0XHRcdD8gZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRcdFx0XHRcdDogU3RyaW5nKGVycm9yKSxcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8g5byC5q2l5aSE55CG5bm25Y+R6YCB5ZON5bqUXG5cdFx0XHRoYW5kbGVNZXNzYWdlKCkudGhlbihzZW5kUmVzcG9uc2UpXG5cdFx0XHRyZXR1cm4gdHJ1ZSAvLyDkv53mjIHmtojmga/pgJrpgZPlvIDlkK/ku6XmlK/mjIHlvILmraXlk43lupRcblx0XHR9LFxuXHQpXG59KVxuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBfYnJvd3NlciB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IF9icm93c2VyO1xuZXhwb3J0IHt9O1xuIiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiJdLCJuYW1lcyI6WyJicm93c2VyIiwiX2Jyb3dzZXIiXSwibWFwcGluZ3MiOiI7O0FBQU8sV0FBUyxp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QUssSUFBSSxRQUFRO0FBQUEsSUFDaEg7QUFBQSxJQUNBLFlBQVksS0FBSztBQUNmLFlBQU0sTUFBTSxxRUFBcUU7QUFBQSxJQUNuRjtBQUFBLElBQ0EsV0FBVyxLQUFLO0FBQ2QsWUFBTSxNQUFNLG9FQUFvRTtBQUFBLElBQ2xGO0FBQUEsSUFDQSxXQUFXLEtBQUs7QUFDZCxZQUFNLE1BQU0sb0VBQW9FO0FBQUEsSUFDbEY7QUFBQSxJQUNBLHNCQUFzQixTQUFTO0FBQzdCLFlBQU0sVUFBVSxLQUFLLGVBQWUsT0FBTztBQUMzQyxZQUFNLGdCQUFnQixRQUFRLFFBQVEsU0FBUyxJQUFJO0FBQ25ELGFBQU8sT0FBTyxJQUFJLGFBQWEsR0FBRztBQUFBLElBQ3BDO0FBQUEsSUFDQSxlQUFlLFFBQVE7QUFDckIsYUFBTyxPQUFPLFFBQVEsdUJBQXVCLE1BQU07QUFBQSxJQUNyRDtBQUFBLEVBQ0Y7QUFDQSxNQUFJLGVBQWU7QUFDbkIsZUFBYSxZQUFZLENBQUMsUUFBUSxTQUFTLFFBQVEsT0FBTyxLQUFLO0FBQy9ELE1BQUksc0JBQXNCLGNBQWMsTUFBTTtBQUFBLElBQzVDLFlBQVksY0FBYyxRQUFRO0FBQ2hDLFlBQU0sMEJBQTBCLFlBQVksTUFBTSxNQUFNLEVBQUU7QUFBQSxJQUM1RDtBQUFBLEVBQ0Y7QUFDQSxXQUFTLGlCQUFpQixjQUFjLFVBQVU7QUFDaEQsUUFBSSxDQUFDLGFBQWEsVUFBVSxTQUFTLFFBQVEsS0FBSyxhQUFhO0FBQzdELFlBQU0sSUFBSTtBQUFBLFFBQ1I7QUFBQSxRQUNBLEdBQUcsUUFBUSwwQkFBMEIsYUFBYSxVQUFVLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDNUU7QUFBQSxFQUNBO0FBQ0EsV0FBUyxpQkFBaUIsY0FBYyxVQUFVO0FBQ2hELFFBQUksU0FBUyxTQUFTLEdBQUc7QUFDdkIsWUFBTSxJQUFJLG9CQUFvQixjQUFjLGdDQUFnQztBQUM5RSxRQUFJLFNBQVMsU0FBUyxHQUFHLEtBQUssU0FBUyxTQUFTLEtBQUssQ0FBQyxTQUFTLFdBQVcsSUFBSTtBQUM1RSxZQUFNLElBQUk7QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLE1BQ047QUFBQSxFQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMiwzLDRdfQ==
