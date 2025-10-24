var background = (function() {
  "use strict";
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const ANSI_BACKGROUND_OFFSET = 10;
  const wrapAnsi16 = (offset = 0) => (code2) => `\x1B[${code2 + offset}m`;
  const wrapAnsi256 = (offset = 0) => (code2) => `\x1B[${38 + offset};5;${code2}m`;
  const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
  const styles$1 = {
    modifier: {
      reset: [0, 0],
      // 21 isn't widely supported and 22 does the same thing
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      // Bright color
      blackBright: [90, 39],
      gray: [90, 39],
      // Alias of `blackBright`
      grey: [90, 39],
      // Alias of `blackBright`
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      // Bright color
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      // Alias of `bgBlackBright`
      bgGrey: [100, 49],
      // Alias of `bgBlackBright`
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  };
  Object.keys(styles$1.modifier);
  const foregroundColorNames = Object.keys(styles$1.color);
  const backgroundColorNames = Object.keys(styles$1.bgColor);
  [...foregroundColorNames, ...backgroundColorNames];
  function assembleStyles() {
    const codes = /* @__PURE__ */ new Map();
    for (const [groupName, group] of Object.entries(styles$1)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles$1[styleName] = {
          open: `\x1B[${style[0]}m`,
          close: `\x1B[${style[1]}m`
        };
        group[styleName] = styles$1[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles$1, groupName, {
        value: group,
        enumerable: false
      });
    }
    Object.defineProperty(styles$1, "codes", {
      value: codes,
      enumerable: false
    });
    styles$1.color.close = "\x1B[39m";
    styles$1.bgColor.close = "\x1B[49m";
    styles$1.color.ansi = wrapAnsi16();
    styles$1.color.ansi256 = wrapAnsi256();
    styles$1.color.ansi16m = wrapAnsi16m();
    styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
    styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
    Object.defineProperties(styles$1, {
      rgbToAnsi256: {
        value(red, green, blue) {
          if (red === green && green === blue) {
            if (red < 8) {
              return 16;
            }
            if (red > 248) {
              return 231;
            }
            return Math.round((red - 8) / 247 * 24) + 232;
          }
          return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
        },
        enumerable: false
      },
      hexToRgb: {
        value(hex) {
          const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
          if (!matches) {
            return [0, 0, 0];
          }
          let [colorString] = matches;
          if (colorString.length === 3) {
            colorString = [...colorString].map((character) => character + character).join("");
          }
          const integer = Number.parseInt(colorString, 16);
          return [
            /* eslint-disable no-bitwise */
            integer >> 16 & 255,
            integer >> 8 & 255,
            integer & 255
            /* eslint-enable no-bitwise */
          ];
        },
        enumerable: false
      },
      hexToAnsi256: {
        value: (hex) => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
        enumerable: false
      },
      ansi256ToAnsi: {
        value(code2) {
          if (code2 < 8) {
            return 30 + code2;
          }
          if (code2 < 16) {
            return 90 + (code2 - 8);
          }
          let red;
          let green;
          let blue;
          if (code2 >= 232) {
            red = ((code2 - 232) * 10 + 8) / 255;
            green = red;
            blue = red;
          } else {
            code2 -= 16;
            const remainder = code2 % 36;
            red = Math.floor(code2 / 36) / 5;
            green = Math.floor(remainder / 6) / 5;
            blue = remainder % 6 / 5;
          }
          const value = Math.max(red, green, blue) * 2;
          if (value === 0) {
            return 30;
          }
          let result2 = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
          if (value === 2) {
            result2 += 60;
          }
          return result2;
        },
        enumerable: false
      },
      rgbToAnsi: {
        value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
        enumerable: false
      },
      hexToAnsi: {
        value: (hex) => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
        enumerable: false
      }
    });
    return styles$1;
  }
  const ansiStyles = assembleStyles();
  const level = (() => {
    if (!("navigator" in globalThis)) {
      return 0;
    }
    if (globalThis.navigator.userAgentData) {
      const brand = navigator.userAgentData.brands.find(({ brand: brand2 }) => brand2 === "Chromium");
      if (brand && brand.version > 93) {
        return 3;
      }
    }
    if (/\b(Chrome|Chromium)\//.test(globalThis.navigator.userAgent)) {
      return 1;
    }
    return 0;
  })();
  const colorSupport = level !== 0 && {
    level
  };
  const supportsColor = {
    stdout: colorSupport,
    stderr: colorSupport
  };
  function stringReplaceAll(string, substring, replacer) {
    let index = string.indexOf(substring);
    if (index === -1) {
      return string;
    }
    const substringLength = substring.length;
    let endIndex = 0;
    let returnValue = "";
    do {
      returnValue += string.slice(endIndex, index) + substring + replacer;
      endIndex = index + substringLength;
      index = string.indexOf(substring, endIndex);
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
  }
  function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
    let endIndex = 0;
    let returnValue = "";
    do {
      const gotCR = string[index - 1] === "\r";
      returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
      endIndex = index + 1;
      index = string.indexOf("\n", endIndex);
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
  }
  const { stdout: stdoutColor, stderr: stderrColor } = supportsColor;
  const GENERATOR = Symbol("GENERATOR");
  const STYLER = Symbol("STYLER");
  const IS_EMPTY = Symbol("IS_EMPTY");
  const levelMapping = [
    "ansi",
    "ansi",
    "ansi256",
    "ansi16m"
  ];
  const styles = /* @__PURE__ */ Object.create(null);
  const applyOptions = (object, options = {}) => {
    if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
      throw new Error("The `level` option should be an integer from 0 to 3");
    }
    const colorLevel = stdoutColor ? stdoutColor.level : 0;
    object.level = options.level === void 0 ? colorLevel : options.level;
  };
  const chalkFactory = (options) => {
    const chalk2 = (...strings) => strings.join(" ");
    applyOptions(chalk2, options);
    Object.setPrototypeOf(chalk2, createChalk.prototype);
    return chalk2;
  };
  function createChalk(options) {
    return chalkFactory(options);
  }
  Object.setPrototypeOf(createChalk.prototype, Function.prototype);
  for (const [styleName, style] of Object.entries(ansiStyles)) {
    styles[styleName] = {
      get() {
        const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
        Object.defineProperty(this, styleName, { value: builder });
        return builder;
      }
    };
  }
  styles.visible = {
    get() {
      const builder = createBuilder(this, this[STYLER], true);
      Object.defineProperty(this, "visible", { value: builder });
      return builder;
    }
  };
  const getModelAnsi = (model, level2, type, ...arguments_) => {
    if (model === "rgb") {
      if (level2 === "ansi16m") {
        return ansiStyles[type].ansi16m(...arguments_);
      }
      if (level2 === "ansi256") {
        return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
      }
      return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
    }
    if (model === "hex") {
      return getModelAnsi("rgb", level2, type, ...ansiStyles.hexToRgb(...arguments_));
    }
    return ansiStyles[type][model](...arguments_);
  };
  const usedModels = ["rgb", "hex", "ansi256"];
  for (const model of usedModels) {
    styles[model] = {
      get() {
        const { level: level2 } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level2], "color", ...arguments_), ansiStyles.color.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles[bgModel] = {
      get() {
        const { level: level2 } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level2], "bgColor", ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
  }
  const proto = Object.defineProperties(() => {
  }, {
    ...styles,
    level: {
      enumerable: true,
      get() {
        return this[GENERATOR].level;
      },
      set(level2) {
        this[GENERATOR].level = level2;
      }
    }
  });
  const createStyler = (open, close, parent) => {
    let openAll;
    let closeAll;
    if (parent === void 0) {
      openAll = open;
      closeAll = close;
    } else {
      openAll = parent.openAll + open;
      closeAll = close + parent.closeAll;
    }
    return {
      open,
      close,
      openAll,
      closeAll,
      parent
    };
  };
  const createBuilder = (self, _styler, _isEmpty) => {
    const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
    Object.setPrototypeOf(builder, proto);
    builder[GENERATOR] = self;
    builder[STYLER] = _styler;
    builder[IS_EMPTY] = _isEmpty;
    return builder;
  };
  const applyStyle = (self, string) => {
    if (self.level <= 0 || !string) {
      return self[IS_EMPTY] ? "" : string;
    }
    let styler = self[STYLER];
    if (styler === void 0) {
      return string;
    }
    const { openAll, closeAll } = styler;
    if (string.includes("\x1B")) {
      while (styler !== void 0) {
        string = stringReplaceAll(string, styler.close, styler.open);
        styler = styler.parent;
      }
    }
    const lfIndex = string.indexOf("\n");
    if (lfIndex !== -1) {
      string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
    }
    return openAll + string + closeAll;
  };
  Object.defineProperties(createChalk.prototype, styles);
  const chalk = createChalk();
  createChalk({ level: stderrColor ? stderrColor.level : 0 });
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
  function logMessage(direction, type, data) {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const arrow = direction === "incoming" ? "📥" : "📤";
    const color = direction === "incoming" ? chalk.cyan : chalk.green;
    console.log(
      color.bold(`
${arrow} [${timestamp}] ${direction.toUpperCase()}`)
    );
    console.log(chalk.yellow(`   Type: ${type}`));
    if (data) {
      console.log(chalk.gray("   Data:"), data);
    }
  }
  const authenticatedSessions = /* @__PURE__ */ new Map();
  let apiKey = generateUUID();
  console.log("Generated new API key:", apiKey);
  const definition = defineBackground(() => {
    console.log(chalk.magenta.bold("\n🚀 Background service worker started"));
    console.log(chalk.yellow(`   API Key: ${apiKey}
`));
    chrome.tabs.onRemoved.addListener((tabId2) => {
      for (const [sessionId2, session2] of authenticatedSessions.entries()) {
        if (session2.tabId === tabId2) {
          authenticatedSessions.delete(sessionId2);
          console.log(
            chalk.red(
              `
🗑️  Tab ${tabId2} closed, cleared session ${sessionId2}
`
            )
          );
        }
      }
    });
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        const handleMessage = async () => {
          try {
            logMessage("incoming", message.type, {
              sessionId: message.sessionId,
              tabId: sender.tab?.id,
              payload: message.payload
            });
            if (message.type === "GET_API_KEY") {
              return {
                success: true,
                data: apiKey
              };
            }
            if (message.type === "REFRESH_API_KEY") {
              apiKey = generateUUID();
              authenticatedSessions.clear();
              console.log(
                chalk.magenta.bold(
                  `
🔄 Refreshed API key: ${apiKey}`
                )
              );
              console.log(
                chalk.red(
                  `   Cleared ${authenticatedSessions.size} sessions
`
                )
              );
              return {
                success: true,
                data: apiKey
              };
            }
            if (message.type === "LINK") {
              const { key } = message.payload;
              const { sessionId: sessionId2 } = message;
              const tabId2 = sender.tab?.id;
              if (!tabId2) {
                return {
                  success: false,
                  error: "No tab ID"
                };
              }
              if (!sessionId2) {
                return {
                  success: false,
                  error: "No session ID"
                };
              }
              if (key === apiKey) {
                authenticatedSessions.set(sessionId2, {
                  key,
                  tabId: tabId2,
                  timestamp: Date.now()
                });
                console.log(
                  chalk.green.bold(
                    `
✅ Session authenticated: ${sessionId2.substring(
                      0,
                      12
                    )}...`
                  )
                );
                console.log(chalk.gray(`   Tab ID: ${tabId2}
`));
                return {
                  success: true,
                  data: { authenticated: true, sessionId: sessionId2 }
                };
              } else {
                return {
                  success: false,
                  error: "Invalid key"
                };
              }
            }
            const { sessionId } = message;
            if (!sessionId) {
              return {
                success: false,
                error: "No session ID"
              };
            }
            const session = authenticatedSessions.get(sessionId);
            if (!session || session.key !== apiKey) {
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
            if (message.type === "OPEN_TAB") {
              const { url } = message.payload;
              if (!url) {
                return {
                  success: false,
                  error: "Missing url"
                };
              }
              const newTab = await chrome.tabs.create({ url });
              return {
                success: true,
                data: {
                  id: newTab.id,
                  title: newTab.title,
                  url: newTab.url,
                  active: newTab.active,
                  windowId: newTab.windowId
                }
              };
            }
            if (message.type === "CLOSE_TAB") {
              const { tabId: tabId2 } = message.payload;
              if (!tabId2) {
                return {
                  success: false,
                  error: "Missing tabId"
                };
              }
              await chrome.tabs.remove(tabId2);
              return {
                success: true,
                data: { tabId: tabId2, closed: true }
              };
            }
            return {
              success: false,
              error: "Unknown message type"
            };
          } catch (error) {
            console.log(
              chalk.red.bold("\n❌ Error processing message:"),
              error
            );
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        };
        handleMessage().then((response) => {
          logMessage("outgoing", message.type, {
            success: response.success,
            data: response.data,
            error: response.error
          });
          sendResponse(response);
        });
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
      const serverUrl = "ws://localhost:3000";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jaGFsay9zb3VyY2UvdmVuZG9yL2Fuc2ktc3R5bGVzL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2NoYWxrL3NvdXJjZS92ZW5kb3Ivc3VwcG9ydHMtY29sb3IvYnJvd3Nlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jaGFsay9zb3VyY2UvdXRpbGl0aWVzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2NoYWxrL3NvdXJjZS9pbmRleC5qcyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQvaW5kZXgudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUJhY2tncm91bmQoYXJnKSB7XG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7IG1haW46IGFyZyB9O1xuICByZXR1cm4gYXJnO1xufVxuIiwiY29uc3QgQU5TSV9CQUNLR1JPVU5EX09GRlNFVCA9IDEwO1xuXG5jb25zdCB3cmFwQW5zaTE2ID0gKG9mZnNldCA9IDApID0+IGNvZGUgPT4gYFxcdTAwMUJbJHtjb2RlICsgb2Zmc2V0fW1gO1xuXG5jb25zdCB3cmFwQW5zaTI1NiA9IChvZmZzZXQgPSAwKSA9PiBjb2RlID0+IGBcXHUwMDFCWyR7MzggKyBvZmZzZXR9OzU7JHtjb2RlfW1gO1xuXG5jb25zdCB3cmFwQW5zaTE2bSA9IChvZmZzZXQgPSAwKSA9PiAocmVkLCBncmVlbiwgYmx1ZSkgPT4gYFxcdTAwMUJbJHszOCArIG9mZnNldH07Mjske3JlZH07JHtncmVlbn07JHtibHVlfW1gO1xuXG5jb25zdCBzdHlsZXMgPSB7XG5cdG1vZGlmaWVyOiB7XG5cdFx0cmVzZXQ6IFswLCAwXSxcblx0XHQvLyAyMSBpc24ndCB3aWRlbHkgc3VwcG9ydGVkIGFuZCAyMiBkb2VzIHRoZSBzYW1lIHRoaW5nXG5cdFx0Ym9sZDogWzEsIDIyXSxcblx0XHRkaW06IFsyLCAyMl0sXG5cdFx0aXRhbGljOiBbMywgMjNdLFxuXHRcdHVuZGVybGluZTogWzQsIDI0XSxcblx0XHRvdmVybGluZTogWzUzLCA1NV0sXG5cdFx0aW52ZXJzZTogWzcsIDI3XSxcblx0XHRoaWRkZW46IFs4LCAyOF0sXG5cdFx0c3RyaWtldGhyb3VnaDogWzksIDI5XSxcblx0fSxcblx0Y29sb3I6IHtcblx0XHRibGFjazogWzMwLCAzOV0sXG5cdFx0cmVkOiBbMzEsIDM5XSxcblx0XHRncmVlbjogWzMyLCAzOV0sXG5cdFx0eWVsbG93OiBbMzMsIDM5XSxcblx0XHRibHVlOiBbMzQsIDM5XSxcblx0XHRtYWdlbnRhOiBbMzUsIDM5XSxcblx0XHRjeWFuOiBbMzYsIDM5XSxcblx0XHR3aGl0ZTogWzM3LCAzOV0sXG5cblx0XHQvLyBCcmlnaHQgY29sb3Jcblx0XHRibGFja0JyaWdodDogWzkwLCAzOV0sXG5cdFx0Z3JheTogWzkwLCAzOV0sIC8vIEFsaWFzIG9mIGBibGFja0JyaWdodGBcblx0XHRncmV5OiBbOTAsIDM5XSwgLy8gQWxpYXMgb2YgYGJsYWNrQnJpZ2h0YFxuXHRcdHJlZEJyaWdodDogWzkxLCAzOV0sXG5cdFx0Z3JlZW5CcmlnaHQ6IFs5MiwgMzldLFxuXHRcdHllbGxvd0JyaWdodDogWzkzLCAzOV0sXG5cdFx0Ymx1ZUJyaWdodDogWzk0LCAzOV0sXG5cdFx0bWFnZW50YUJyaWdodDogWzk1LCAzOV0sXG5cdFx0Y3lhbkJyaWdodDogWzk2LCAzOV0sXG5cdFx0d2hpdGVCcmlnaHQ6IFs5NywgMzldLFxuXHR9LFxuXHRiZ0NvbG9yOiB7XG5cdFx0YmdCbGFjazogWzQwLCA0OV0sXG5cdFx0YmdSZWQ6IFs0MSwgNDldLFxuXHRcdGJnR3JlZW46IFs0MiwgNDldLFxuXHRcdGJnWWVsbG93OiBbNDMsIDQ5XSxcblx0XHRiZ0JsdWU6IFs0NCwgNDldLFxuXHRcdGJnTWFnZW50YTogWzQ1LCA0OV0sXG5cdFx0YmdDeWFuOiBbNDYsIDQ5XSxcblx0XHRiZ1doaXRlOiBbNDcsIDQ5XSxcblxuXHRcdC8vIEJyaWdodCBjb2xvclxuXHRcdGJnQmxhY2tCcmlnaHQ6IFsxMDAsIDQ5XSxcblx0XHRiZ0dyYXk6IFsxMDAsIDQ5XSwgLy8gQWxpYXMgb2YgYGJnQmxhY2tCcmlnaHRgXG5cdFx0YmdHcmV5OiBbMTAwLCA0OV0sIC8vIEFsaWFzIG9mIGBiZ0JsYWNrQnJpZ2h0YFxuXHRcdGJnUmVkQnJpZ2h0OiBbMTAxLCA0OV0sXG5cdFx0YmdHcmVlbkJyaWdodDogWzEwMiwgNDldLFxuXHRcdGJnWWVsbG93QnJpZ2h0OiBbMTAzLCA0OV0sXG5cdFx0YmdCbHVlQnJpZ2h0OiBbMTA0LCA0OV0sXG5cdFx0YmdNYWdlbnRhQnJpZ2h0OiBbMTA1LCA0OV0sXG5cdFx0YmdDeWFuQnJpZ2h0OiBbMTA2LCA0OV0sXG5cdFx0YmdXaGl0ZUJyaWdodDogWzEwNywgNDldLFxuXHR9LFxufTtcblxuZXhwb3J0IGNvbnN0IG1vZGlmaWVyTmFtZXMgPSBPYmplY3Qua2V5cyhzdHlsZXMubW9kaWZpZXIpO1xuZXhwb3J0IGNvbnN0IGZvcmVncm91bmRDb2xvck5hbWVzID0gT2JqZWN0LmtleXMoc3R5bGVzLmNvbG9yKTtcbmV4cG9ydCBjb25zdCBiYWNrZ3JvdW5kQ29sb3JOYW1lcyA9IE9iamVjdC5rZXlzKHN0eWxlcy5iZ0NvbG9yKTtcbmV4cG9ydCBjb25zdCBjb2xvck5hbWVzID0gWy4uLmZvcmVncm91bmRDb2xvck5hbWVzLCAuLi5iYWNrZ3JvdW5kQ29sb3JOYW1lc107XG5cbmZ1bmN0aW9uIGFzc2VtYmxlU3R5bGVzKCkge1xuXHRjb25zdCBjb2RlcyA9IG5ldyBNYXAoKTtcblxuXHRmb3IgKGNvbnN0IFtncm91cE5hbWUsIGdyb3VwXSBvZiBPYmplY3QuZW50cmllcyhzdHlsZXMpKSB7XG5cdFx0Zm9yIChjb25zdCBbc3R5bGVOYW1lLCBzdHlsZV0gb2YgT2JqZWN0LmVudHJpZXMoZ3JvdXApKSB7XG5cdFx0XHRzdHlsZXNbc3R5bGVOYW1lXSA9IHtcblx0XHRcdFx0b3BlbjogYFxcdTAwMUJbJHtzdHlsZVswXX1tYCxcblx0XHRcdFx0Y2xvc2U6IGBcXHUwMDFCWyR7c3R5bGVbMV19bWAsXG5cdFx0XHR9O1xuXG5cdFx0XHRncm91cFtzdHlsZU5hbWVdID0gc3R5bGVzW3N0eWxlTmFtZV07XG5cblx0XHRcdGNvZGVzLnNldChzdHlsZVswXSwgc3R5bGVbMV0pO1xuXHRcdH1cblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzdHlsZXMsIGdyb3VwTmFtZSwge1xuXHRcdFx0dmFsdWU6IGdyb3VwLFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSk7XG5cdH1cblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCAnY29kZXMnLCB7XG5cdFx0dmFsdWU6IGNvZGVzLFxuXHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHR9KTtcblxuXHRzdHlsZXMuY29sb3IuY2xvc2UgPSAnXFx1MDAxQlszOW0nO1xuXHRzdHlsZXMuYmdDb2xvci5jbG9zZSA9ICdcXHUwMDFCWzQ5bSc7XG5cblx0c3R5bGVzLmNvbG9yLmFuc2kgPSB3cmFwQW5zaTE2KCk7XG5cdHN0eWxlcy5jb2xvci5hbnNpMjU2ID0gd3JhcEFuc2kyNTYoKTtcblx0c3R5bGVzLmNvbG9yLmFuc2kxNm0gPSB3cmFwQW5zaTE2bSgpO1xuXHRzdHlsZXMuYmdDb2xvci5hbnNpID0gd3JhcEFuc2kxNihBTlNJX0JBQ0tHUk9VTkRfT0ZGU0VUKTtcblx0c3R5bGVzLmJnQ29sb3IuYW5zaTI1NiA9IHdyYXBBbnNpMjU2KEFOU0lfQkFDS0dST1VORF9PRkZTRVQpO1xuXHRzdHlsZXMuYmdDb2xvci5hbnNpMTZtID0gd3JhcEFuc2kxNm0oQU5TSV9CQUNLR1JPVU5EX09GRlNFVCk7XG5cblx0Ly8gRnJvbSBodHRwczovL2dpdGh1Yi5jb20vUWl4LS9jb2xvci1jb252ZXJ0L2Jsb2IvM2YwZTBkNGU5MmUyMzU3OTZjY2IxN2Y2ZTg1YzcyMDk0YTY1MWY0OS9jb252ZXJzaW9ucy5qc1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzdHlsZXMsIHtcblx0XHRyZ2JUb0Fuc2kyNTY6IHtcblx0XHRcdHZhbHVlKHJlZCwgZ3JlZW4sIGJsdWUpIHtcblx0XHRcdFx0Ly8gV2UgdXNlIHRoZSBleHRlbmRlZCBncmV5c2NhbGUgcGFsZXR0ZSBoZXJlLCB3aXRoIHRoZSBleGNlcHRpb24gb2Zcblx0XHRcdFx0Ly8gYmxhY2sgYW5kIHdoaXRlLiBub3JtYWwgcGFsZXR0ZSBvbmx5IGhhcyA0IGdyZXlzY2FsZSBzaGFkZXMuXG5cdFx0XHRcdGlmIChyZWQgPT09IGdyZWVuICYmIGdyZWVuID09PSBibHVlKSB7XG5cdFx0XHRcdFx0aWYgKHJlZCA8IDgpIHtcblx0XHRcdFx0XHRcdHJldHVybiAxNjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocmVkID4gMjQ4KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gMjMxO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBNYXRoLnJvdW5kKCgocmVkIC0gOCkgLyAyNDcpICogMjQpICsgMjMyO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIDE2XG5cdFx0XHRcdFx0KyAoMzYgKiBNYXRoLnJvdW5kKHJlZCAvIDI1NSAqIDUpKVxuXHRcdFx0XHRcdCsgKDYgKiBNYXRoLnJvdW5kKGdyZWVuIC8gMjU1ICogNSkpXG5cdFx0XHRcdFx0KyBNYXRoLnJvdW5kKGJsdWUgLyAyNTUgKiA1KTtcblx0XHRcdH0sXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR9LFxuXHRcdGhleFRvUmdiOiB7XG5cdFx0XHR2YWx1ZShoZXgpIHtcblx0XHRcdFx0Y29uc3QgbWF0Y2hlcyA9IC9bYS1mXFxkXXs2fXxbYS1mXFxkXXszfS9pLmV4ZWMoaGV4LnRvU3RyaW5nKDE2KSk7XG5cdFx0XHRcdGlmICghbWF0Y2hlcykge1xuXHRcdFx0XHRcdHJldHVybiBbMCwgMCwgMF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgW2NvbG9yU3RyaW5nXSA9IG1hdGNoZXM7XG5cblx0XHRcdFx0aWYgKGNvbG9yU3RyaW5nLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0XHRcdGNvbG9yU3RyaW5nID0gWy4uLmNvbG9yU3RyaW5nXS5tYXAoY2hhcmFjdGVyID0+IGNoYXJhY3RlciArIGNoYXJhY3Rlcikuam9pbignJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBpbnRlZ2VyID0gTnVtYmVyLnBhcnNlSW50KGNvbG9yU3RyaW5nLCAxNik7XG5cblx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlICovXG5cdFx0XHRcdFx0KGludGVnZXIgPj4gMTYpICYgMHhGRixcblx0XHRcdFx0XHQoaW50ZWdlciA+PiA4KSAmIDB4RkYsXG5cdFx0XHRcdFx0aW50ZWdlciAmIDB4RkYsXG5cdFx0XHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1iaXR3aXNlICovXG5cdFx0XHRcdF07XG5cdFx0XHR9LFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSxcblx0XHRoZXhUb0Fuc2kyNTY6IHtcblx0XHRcdHZhbHVlOiBoZXggPT4gc3R5bGVzLnJnYlRvQW5zaTI1NiguLi5zdHlsZXMuaGV4VG9SZ2IoaGV4KSksXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR9LFxuXHRcdGFuc2kyNTZUb0Fuc2k6IHtcblx0XHRcdHZhbHVlKGNvZGUpIHtcblx0XHRcdFx0aWYgKGNvZGUgPCA4KSB7XG5cdFx0XHRcdFx0cmV0dXJuIDMwICsgY29kZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjb2RlIDwgMTYpIHtcblx0XHRcdFx0XHRyZXR1cm4gOTAgKyAoY29kZSAtIDgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHJlZDtcblx0XHRcdFx0bGV0IGdyZWVuO1xuXHRcdFx0XHRsZXQgYmx1ZTtcblxuXHRcdFx0XHRpZiAoY29kZSA+PSAyMzIpIHtcblx0XHRcdFx0XHRyZWQgPSAoKChjb2RlIC0gMjMyKSAqIDEwKSArIDgpIC8gMjU1O1xuXHRcdFx0XHRcdGdyZWVuID0gcmVkO1xuXHRcdFx0XHRcdGJsdWUgPSByZWQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29kZSAtPSAxNjtcblxuXHRcdFx0XHRcdGNvbnN0IHJlbWFpbmRlciA9IGNvZGUgJSAzNjtcblxuXHRcdFx0XHRcdHJlZCA9IE1hdGguZmxvb3IoY29kZSAvIDM2KSAvIDU7XG5cdFx0XHRcdFx0Z3JlZW4gPSBNYXRoLmZsb29yKHJlbWFpbmRlciAvIDYpIC8gNTtcblx0XHRcdFx0XHRibHVlID0gKHJlbWFpbmRlciAlIDYpIC8gNTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHZhbHVlID0gTWF0aC5tYXgocmVkLCBncmVlbiwgYmx1ZSkgKiAyO1xuXG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiAzMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG5cdFx0XHRcdGxldCByZXN1bHQgPSAzMCArICgoTWF0aC5yb3VuZChibHVlKSA8PCAyKSB8IChNYXRoLnJvdW5kKGdyZWVuKSA8PCAxKSB8IE1hdGgucm91bmQocmVkKSk7XG5cblx0XHRcdFx0aWYgKHZhbHVlID09PSAyKSB7XG5cdFx0XHRcdFx0cmVzdWx0ICs9IDYwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdH0sXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR9LFxuXHRcdHJnYlRvQW5zaToge1xuXHRcdFx0dmFsdWU6IChyZWQsIGdyZWVuLCBibHVlKSA9PiBzdHlsZXMuYW5zaTI1NlRvQW5zaShzdHlsZXMucmdiVG9BbnNpMjU2KHJlZCwgZ3JlZW4sIGJsdWUpKSxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdH0sXG5cdFx0aGV4VG9BbnNpOiB7XG5cdFx0XHR2YWx1ZTogaGV4ID0+IHN0eWxlcy5hbnNpMjU2VG9BbnNpKHN0eWxlcy5oZXhUb0Fuc2kyNTYoaGV4KSksXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR9LFxuXHR9KTtcblxuXHRyZXR1cm4gc3R5bGVzO1xufVxuXG5jb25zdCBhbnNpU3R5bGVzID0gYXNzZW1ibGVTdHlsZXMoKTtcblxuZXhwb3J0IGRlZmF1bHQgYW5zaVN0eWxlcztcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG5jb25zdCBsZXZlbCA9ICgoKSA9PiB7XG5cdGlmICghKCduYXZpZ2F0b3InIGluIGdsb2JhbFRoaXMpKSB7XG5cdFx0cmV0dXJuIDA7XG5cdH1cblxuXHRpZiAoZ2xvYmFsVGhpcy5uYXZpZ2F0b3IudXNlckFnZW50RGF0YSkge1xuXHRcdGNvbnN0IGJyYW5kID0gbmF2aWdhdG9yLnVzZXJBZ2VudERhdGEuYnJhbmRzLmZpbmQoKHticmFuZH0pID0+IGJyYW5kID09PSAnQ2hyb21pdW0nKTtcblx0XHRpZiAoYnJhbmQgJiYgYnJhbmQudmVyc2lvbiA+IDkzKSB7XG5cdFx0XHRyZXR1cm4gMztcblx0XHR9XG5cdH1cblxuXHRpZiAoL1xcYihDaHJvbWV8Q2hyb21pdW0pXFwvLy50ZXN0KGdsb2JhbFRoaXMubmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm4gMTtcblx0fVxuXG5cdHJldHVybiAwO1xufSkoKTtcblxuY29uc3QgY29sb3JTdXBwb3J0ID0gbGV2ZWwgIT09IDAgJiYge1xuXHRsZXZlbCxcblx0aGFzQmFzaWM6IHRydWUsXG5cdGhhczI1NjogbGV2ZWwgPj0gMixcblx0aGFzMTZtOiBsZXZlbCA+PSAzLFxufTtcblxuY29uc3Qgc3VwcG9ydHNDb2xvciA9IHtcblx0c3Rkb3V0OiBjb2xvclN1cHBvcnQsXG5cdHN0ZGVycjogY29sb3JTdXBwb3J0LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc3VwcG9ydHNDb2xvcjtcbiIsIi8vIFRPRE86IFdoZW4gdGFyZ2V0aW5nIE5vZGUuanMgMTYsIHVzZSBgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlQWxsYC5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdSZXBsYWNlQWxsKHN0cmluZywgc3Vic3RyaW5nLCByZXBsYWNlcikge1xuXHRsZXQgaW5kZXggPSBzdHJpbmcuaW5kZXhPZihzdWJzdHJpbmcpO1xuXHRpZiAoaW5kZXggPT09IC0xKSB7XG5cdFx0cmV0dXJuIHN0cmluZztcblx0fVxuXG5cdGNvbnN0IHN1YnN0cmluZ0xlbmd0aCA9IHN1YnN0cmluZy5sZW5ndGg7XG5cdGxldCBlbmRJbmRleCA9IDA7XG5cdGxldCByZXR1cm5WYWx1ZSA9ICcnO1xuXHRkbyB7XG5cdFx0cmV0dXJuVmFsdWUgKz0gc3RyaW5nLnNsaWNlKGVuZEluZGV4LCBpbmRleCkgKyBzdWJzdHJpbmcgKyByZXBsYWNlcjtcblx0XHRlbmRJbmRleCA9IGluZGV4ICsgc3Vic3RyaW5nTGVuZ3RoO1xuXHRcdGluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc3Vic3RyaW5nLCBlbmRJbmRleCk7XG5cdH0gd2hpbGUgKGluZGV4ICE9PSAtMSk7XG5cblx0cmV0dXJuVmFsdWUgKz0gc3RyaW5nLnNsaWNlKGVuZEluZGV4KTtcblx0cmV0dXJuIHJldHVyblZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nRW5jYXNlQ1JMRldpdGhGaXJzdEluZGV4KHN0cmluZywgcHJlZml4LCBwb3N0Zml4LCBpbmRleCkge1xuXHRsZXQgZW5kSW5kZXggPSAwO1xuXHRsZXQgcmV0dXJuVmFsdWUgPSAnJztcblx0ZG8ge1xuXHRcdGNvbnN0IGdvdENSID0gc3RyaW5nW2luZGV4IC0gMV0gPT09ICdcXHInO1xuXHRcdHJldHVyblZhbHVlICs9IHN0cmluZy5zbGljZShlbmRJbmRleCwgKGdvdENSID8gaW5kZXggLSAxIDogaW5kZXgpKSArIHByZWZpeCArIChnb3RDUiA/ICdcXHJcXG4nIDogJ1xcbicpICsgcG9zdGZpeDtcblx0XHRlbmRJbmRleCA9IGluZGV4ICsgMTtcblx0XHRpbmRleCA9IHN0cmluZy5pbmRleE9mKCdcXG4nLCBlbmRJbmRleCk7XG5cdH0gd2hpbGUgKGluZGV4ICE9PSAtMSk7XG5cblx0cmV0dXJuVmFsdWUgKz0gc3RyaW5nLnNsaWNlKGVuZEluZGV4KTtcblx0cmV0dXJuIHJldHVyblZhbHVlO1xufVxuIiwiaW1wb3J0IGFuc2lTdHlsZXMgZnJvbSAnI2Fuc2ktc3R5bGVzJztcbmltcG9ydCBzdXBwb3J0c0NvbG9yIGZyb20gJyNzdXBwb3J0cy1jb2xvcic7XG5pbXBvcnQgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGltcG9ydC9vcmRlclxuXHRzdHJpbmdSZXBsYWNlQWxsLFxuXHRzdHJpbmdFbmNhc2VDUkxGV2l0aEZpcnN0SW5kZXgsXG59IGZyb20gJy4vdXRpbGl0aWVzLmpzJztcblxuY29uc3Qge3N0ZG91dDogc3Rkb3V0Q29sb3IsIHN0ZGVycjogc3RkZXJyQ29sb3J9ID0gc3VwcG9ydHNDb2xvcjtcblxuY29uc3QgR0VORVJBVE9SID0gU3ltYm9sKCdHRU5FUkFUT1InKTtcbmNvbnN0IFNUWUxFUiA9IFN5bWJvbCgnU1RZTEVSJyk7XG5jb25zdCBJU19FTVBUWSA9IFN5bWJvbCgnSVNfRU1QVFknKTtcblxuLy8gYHN1cHBvcnRzQ29sb3IubGV2ZWxgIOKGkiBgYW5zaVN0eWxlcy5jb2xvcltuYW1lXWAgbWFwcGluZ1xuY29uc3QgbGV2ZWxNYXBwaW5nID0gW1xuXHQnYW5zaScsXG5cdCdhbnNpJyxcblx0J2Fuc2kyNTYnLFxuXHQnYW5zaTE2bScsXG5dO1xuXG5jb25zdCBzdHlsZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG5jb25zdCBhcHBseU9wdGlvbnMgPSAob2JqZWN0LCBvcHRpb25zID0ge30pID0+IHtcblx0aWYgKG9wdGlvbnMubGV2ZWwgJiYgIShOdW1iZXIuaXNJbnRlZ2VyKG9wdGlvbnMubGV2ZWwpICYmIG9wdGlvbnMubGV2ZWwgPj0gMCAmJiBvcHRpb25zLmxldmVsIDw9IDMpKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgYGxldmVsYCBvcHRpb24gc2hvdWxkIGJlIGFuIGludGVnZXIgZnJvbSAwIHRvIDMnKTtcblx0fVxuXG5cdC8vIERldGVjdCBsZXZlbCBpZiBub3Qgc2V0IG1hbnVhbGx5XG5cdGNvbnN0IGNvbG9yTGV2ZWwgPSBzdGRvdXRDb2xvciA/IHN0ZG91dENvbG9yLmxldmVsIDogMDtcblx0b2JqZWN0LmxldmVsID0gb3B0aW9ucy5sZXZlbCA9PT0gdW5kZWZpbmVkID8gY29sb3JMZXZlbCA6IG9wdGlvbnMubGV2ZWw7XG59O1xuXG5leHBvcnQgY2xhc3MgQ2hhbGsge1xuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0cnVjdG9yLXJldHVyblxuXHRcdHJldHVybiBjaGFsa0ZhY3Rvcnkob3B0aW9ucyk7XG5cdH1cbn1cblxuY29uc3QgY2hhbGtGYWN0b3J5ID0gb3B0aW9ucyA9PiB7XG5cdGNvbnN0IGNoYWxrID0gKC4uLnN0cmluZ3MpID0+IHN0cmluZ3Muam9pbignICcpO1xuXHRhcHBseU9wdGlvbnMoY2hhbGssIG9wdGlvbnMpO1xuXG5cdE9iamVjdC5zZXRQcm90b3R5cGVPZihjaGFsaywgY3JlYXRlQ2hhbGsucHJvdG90eXBlKTtcblxuXHRyZXR1cm4gY2hhbGs7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVDaGFsayhvcHRpb25zKSB7XG5cdHJldHVybiBjaGFsa0ZhY3Rvcnkob3B0aW9ucyk7XG59XG5cbk9iamVjdC5zZXRQcm90b3R5cGVPZihjcmVhdGVDaGFsay5wcm90b3R5cGUsIEZ1bmN0aW9uLnByb3RvdHlwZSk7XG5cbmZvciAoY29uc3QgW3N0eWxlTmFtZSwgc3R5bGVdIG9mIE9iamVjdC5lbnRyaWVzKGFuc2lTdHlsZXMpKSB7XG5cdHN0eWxlc1tzdHlsZU5hbWVdID0ge1xuXHRcdGdldCgpIHtcblx0XHRcdGNvbnN0IGJ1aWxkZXIgPSBjcmVhdGVCdWlsZGVyKHRoaXMsIGNyZWF0ZVN0eWxlcihzdHlsZS5vcGVuLCBzdHlsZS5jbG9zZSwgdGhpc1tTVFlMRVJdKSwgdGhpc1tJU19FTVBUWV0pO1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHN0eWxlTmFtZSwge3ZhbHVlOiBidWlsZGVyfSk7XG5cdFx0XHRyZXR1cm4gYnVpbGRlcjtcblx0XHR9LFxuXHR9O1xufVxuXG5zdHlsZXMudmlzaWJsZSA9IHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGJ1aWxkZXIgPSBjcmVhdGVCdWlsZGVyKHRoaXMsIHRoaXNbU1RZTEVSXSwgdHJ1ZSk7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd2aXNpYmxlJywge3ZhbHVlOiBidWlsZGVyfSk7XG5cdFx0cmV0dXJuIGJ1aWxkZXI7XG5cdH0sXG59O1xuXG5jb25zdCBnZXRNb2RlbEFuc2kgPSAobW9kZWwsIGxldmVsLCB0eXBlLCAuLi5hcmd1bWVudHNfKSA9PiB7XG5cdGlmIChtb2RlbCA9PT0gJ3JnYicpIHtcblx0XHRpZiAobGV2ZWwgPT09ICdhbnNpMTZtJykge1xuXHRcdFx0cmV0dXJuIGFuc2lTdHlsZXNbdHlwZV0uYW5zaTE2bSguLi5hcmd1bWVudHNfKTtcblx0XHR9XG5cblx0XHRpZiAobGV2ZWwgPT09ICdhbnNpMjU2Jykge1xuXHRcdFx0cmV0dXJuIGFuc2lTdHlsZXNbdHlwZV0uYW5zaTI1NihhbnNpU3R5bGVzLnJnYlRvQW5zaTI1NiguLi5hcmd1bWVudHNfKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFuc2lTdHlsZXNbdHlwZV0uYW5zaShhbnNpU3R5bGVzLnJnYlRvQW5zaSguLi5hcmd1bWVudHNfKSk7XG5cdH1cblxuXHRpZiAobW9kZWwgPT09ICdoZXgnKSB7XG5cdFx0cmV0dXJuIGdldE1vZGVsQW5zaSgncmdiJywgbGV2ZWwsIHR5cGUsIC4uLmFuc2lTdHlsZXMuaGV4VG9SZ2IoLi4uYXJndW1lbnRzXykpO1xuXHR9XG5cblx0cmV0dXJuIGFuc2lTdHlsZXNbdHlwZV1bbW9kZWxdKC4uLmFyZ3VtZW50c18pO1xufTtcblxuY29uc3QgdXNlZE1vZGVscyA9IFsncmdiJywgJ2hleCcsICdhbnNpMjU2J107XG5cbmZvciAoY29uc3QgbW9kZWwgb2YgdXNlZE1vZGVscykge1xuXHRzdHlsZXNbbW9kZWxdID0ge1xuXHRcdGdldCgpIHtcblx0XHRcdGNvbnN0IHtsZXZlbH0gPSB0aGlzO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICguLi5hcmd1bWVudHNfKSB7XG5cdFx0XHRcdGNvbnN0IHN0eWxlciA9IGNyZWF0ZVN0eWxlcihnZXRNb2RlbEFuc2kobW9kZWwsIGxldmVsTWFwcGluZ1tsZXZlbF0sICdjb2xvcicsIC4uLmFyZ3VtZW50c18pLCBhbnNpU3R5bGVzLmNvbG9yLmNsb3NlLCB0aGlzW1NUWUxFUl0pO1xuXHRcdFx0XHRyZXR1cm4gY3JlYXRlQnVpbGRlcih0aGlzLCBzdHlsZXIsIHRoaXNbSVNfRU1QVFldKTtcblx0XHRcdH07XG5cdFx0fSxcblx0fTtcblxuXHRjb25zdCBiZ01vZGVsID0gJ2JnJyArIG1vZGVsWzBdLnRvVXBwZXJDYXNlKCkgKyBtb2RlbC5zbGljZSgxKTtcblx0c3R5bGVzW2JnTW9kZWxdID0ge1xuXHRcdGdldCgpIHtcblx0XHRcdGNvbnN0IHtsZXZlbH0gPSB0aGlzO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICguLi5hcmd1bWVudHNfKSB7XG5cdFx0XHRcdGNvbnN0IHN0eWxlciA9IGNyZWF0ZVN0eWxlcihnZXRNb2RlbEFuc2kobW9kZWwsIGxldmVsTWFwcGluZ1tsZXZlbF0sICdiZ0NvbG9yJywgLi4uYXJndW1lbnRzXyksIGFuc2lTdHlsZXMuYmdDb2xvci5jbG9zZSwgdGhpc1tTVFlMRVJdKTtcblx0XHRcdFx0cmV0dXJuIGNyZWF0ZUJ1aWxkZXIodGhpcywgc3R5bGVyLCB0aGlzW0lTX0VNUFRZXSk7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdH07XG59XG5cbmNvbnN0IHByb3RvID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoKCkgPT4ge30sIHtcblx0Li4uc3R5bGVzLFxuXHRsZXZlbDoge1xuXHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0Z2V0KCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbR0VORVJBVE9SXS5sZXZlbDtcblx0XHR9LFxuXHRcdHNldChsZXZlbCkge1xuXHRcdFx0dGhpc1tHRU5FUkFUT1JdLmxldmVsID0gbGV2ZWw7XG5cdFx0fSxcblx0fSxcbn0pO1xuXG5jb25zdCBjcmVhdGVTdHlsZXIgPSAob3BlbiwgY2xvc2UsIHBhcmVudCkgPT4ge1xuXHRsZXQgb3BlbkFsbDtcblx0bGV0IGNsb3NlQWxsO1xuXHRpZiAocGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRvcGVuQWxsID0gb3Blbjtcblx0XHRjbG9zZUFsbCA9IGNsb3NlO1xuXHR9IGVsc2Uge1xuXHRcdG9wZW5BbGwgPSBwYXJlbnQub3BlbkFsbCArIG9wZW47XG5cdFx0Y2xvc2VBbGwgPSBjbG9zZSArIHBhcmVudC5jbG9zZUFsbDtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0b3Blbixcblx0XHRjbG9zZSxcblx0XHRvcGVuQWxsLFxuXHRcdGNsb3NlQWxsLFxuXHRcdHBhcmVudCxcblx0fTtcbn07XG5cbmNvbnN0IGNyZWF0ZUJ1aWxkZXIgPSAoc2VsZiwgX3N0eWxlciwgX2lzRW1wdHkpID0+IHtcblx0Ly8gU2luZ2xlIGFyZ3VtZW50IGlzIGhvdCBwYXRoLCBpbXBsaWNpdCBjb2VyY2lvbiBpcyBmYXN0ZXIgdGhhbiBhbnl0aGluZ1xuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW1wbGljaXQtY29lcmNpb25cblx0Y29uc3QgYnVpbGRlciA9ICguLi5hcmd1bWVudHNfKSA9PiBhcHBseVN0eWxlKGJ1aWxkZXIsIChhcmd1bWVudHNfLmxlbmd0aCA9PT0gMSkgPyAoJycgKyBhcmd1bWVudHNfWzBdKSA6IGFyZ3VtZW50c18uam9pbignICcpKTtcblxuXHQvLyBXZSBhbHRlciB0aGUgcHJvdG90eXBlIGJlY2F1c2Ugd2UgbXVzdCByZXR1cm4gYSBmdW5jdGlvbiwgYnV0IHRoZXJlIGlzXG5cdC8vIG5vIHdheSB0byBjcmVhdGUgYSBmdW5jdGlvbiB3aXRoIGEgZGlmZmVyZW50IHByb3RvdHlwZVxuXHRPYmplY3Quc2V0UHJvdG90eXBlT2YoYnVpbGRlciwgcHJvdG8pO1xuXG5cdGJ1aWxkZXJbR0VORVJBVE9SXSA9IHNlbGY7XG5cdGJ1aWxkZXJbU1RZTEVSXSA9IF9zdHlsZXI7XG5cdGJ1aWxkZXJbSVNfRU1QVFldID0gX2lzRW1wdHk7XG5cblx0cmV0dXJuIGJ1aWxkZXI7XG59O1xuXG5jb25zdCBhcHBseVN0eWxlID0gKHNlbGYsIHN0cmluZykgPT4ge1xuXHRpZiAoc2VsZi5sZXZlbCA8PSAwIHx8ICFzdHJpbmcpIHtcblx0XHRyZXR1cm4gc2VsZltJU19FTVBUWV0gPyAnJyA6IHN0cmluZztcblx0fVxuXG5cdGxldCBzdHlsZXIgPSBzZWxmW1NUWUxFUl07XG5cblx0aWYgKHN0eWxlciA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHN0cmluZztcblx0fVxuXG5cdGNvbnN0IHtvcGVuQWxsLCBjbG9zZUFsbH0gPSBzdHlsZXI7XG5cdGlmIChzdHJpbmcuaW5jbHVkZXMoJ1xcdTAwMUInKSkge1xuXHRcdHdoaWxlIChzdHlsZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Ly8gUmVwbGFjZSBhbnkgaW5zdGFuY2VzIGFscmVhZHkgcHJlc2VudCB3aXRoIGEgcmUtb3BlbmluZyBjb2RlXG5cdFx0XHQvLyBvdGhlcndpc2Ugb25seSB0aGUgcGFydCBvZiB0aGUgc3RyaW5nIHVudGlsIHNhaWQgY2xvc2luZyBjb2RlXG5cdFx0XHQvLyB3aWxsIGJlIGNvbG9yZWQsIGFuZCB0aGUgcmVzdCB3aWxsIHNpbXBseSBiZSAncGxhaW4nLlxuXHRcdFx0c3RyaW5nID0gc3RyaW5nUmVwbGFjZUFsbChzdHJpbmcsIHN0eWxlci5jbG9zZSwgc3R5bGVyLm9wZW4pO1xuXG5cdFx0XHRzdHlsZXIgPSBzdHlsZXIucGFyZW50O1xuXHRcdH1cblx0fVxuXG5cdC8vIFdlIGNhbiBtb3ZlIGJvdGggbmV4dCBhY3Rpb25zIG91dCBvZiBsb29wLCBiZWNhdXNlIHJlbWFpbmluZyBhY3Rpb25zIGluIGxvb3Agd29uJ3QgaGF2ZVxuXHQvLyBhbnkvdmlzaWJsZSBlZmZlY3Qgb24gcGFydHMgd2UgYWRkIGhlcmUuIENsb3NlIHRoZSBzdHlsaW5nIGJlZm9yZSBhIGxpbmVicmVhayBhbmQgcmVvcGVuXG5cdC8vIGFmdGVyIG5leHQgbGluZSB0byBmaXggYSBibGVlZCBpc3N1ZSBvbiBtYWNPUzogaHR0cHM6Ly9naXRodWIuY29tL2NoYWxrL2NoYWxrL3B1bGwvOTJcblx0Y29uc3QgbGZJbmRleCA9IHN0cmluZy5pbmRleE9mKCdcXG4nKTtcblx0aWYgKGxmSW5kZXggIT09IC0xKSB7XG5cdFx0c3RyaW5nID0gc3RyaW5nRW5jYXNlQ1JMRldpdGhGaXJzdEluZGV4KHN0cmluZywgY2xvc2VBbGwsIG9wZW5BbGwsIGxmSW5kZXgpO1xuXHR9XG5cblx0cmV0dXJuIG9wZW5BbGwgKyBzdHJpbmcgKyBjbG9zZUFsbDtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGNyZWF0ZUNoYWxrLnByb3RvdHlwZSwgc3R5bGVzKTtcblxuY29uc3QgY2hhbGsgPSBjcmVhdGVDaGFsaygpO1xuZXhwb3J0IGNvbnN0IGNoYWxrU3RkZXJyID0gY3JlYXRlQ2hhbGsoe2xldmVsOiBzdGRlcnJDb2xvciA/IHN0ZGVyckNvbG9yLmxldmVsIDogMH0pO1xuXG5leHBvcnQge1xuXHRtb2RpZmllck5hbWVzLFxuXHRmb3JlZ3JvdW5kQ29sb3JOYW1lcyxcblx0YmFja2dyb3VuZENvbG9yTmFtZXMsXG5cdGNvbG9yTmFtZXMsXG5cblx0Ly8gVE9ETzogUmVtb3ZlIHRoZXNlIGFsaWFzZXMgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvblxuXHRtb2RpZmllck5hbWVzIGFzIG1vZGlmaWVycyxcblx0Zm9yZWdyb3VuZENvbG9yTmFtZXMgYXMgZm9yZWdyb3VuZENvbG9ycyxcblx0YmFja2dyb3VuZENvbG9yTmFtZXMgYXMgYmFja2dyb3VuZENvbG9ycyxcblx0Y29sb3JOYW1lcyBhcyBjb2xvcnMsXG59IGZyb20gJy4vdmVuZG9yL2Fuc2ktc3R5bGVzL2luZGV4LmpzJztcblxuZXhwb3J0IHtcblx0c3Rkb3V0Q29sb3IgYXMgc3VwcG9ydHNDb2xvcixcblx0c3RkZXJyQ29sb3IgYXMgc3VwcG9ydHNDb2xvclN0ZGVycixcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNoYWxrO1xuIiwiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuXG4vLyDnlJ/miJDpmo/mnLogVVVJRFxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCk6IHN0cmluZyB7XG5cdHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKFxuXHRcdC9beHldL2csXG5cdFx0ZnVuY3Rpb24gKGMpIHtcblx0XHRcdGNvbnN0IHIgPSAoTWF0aC5yYW5kb20oKSAqIDE2KSB8IDBcblx0XHRcdGNvbnN0IHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMpIHwgMHg4XG5cdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNilcblx0XHR9LFxuXHQpXG59XG5cbi8vIOe+juWMluaXpeW/l1xuZnVuY3Rpb24gbG9nTWVzc2FnZShcblx0ZGlyZWN0aW9uOiAnaW5jb21pbmcnIHwgJ291dGdvaW5nJyxcblx0dHlwZTogc3RyaW5nLFxuXHRkYXRhPzogYW55LFxuKSB7XG5cdGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKClcblx0Y29uc3QgYXJyb3cgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyAn8J+TpScgOiAn8J+TpCdcblx0Y29uc3QgY29sb3IgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjaGFsay5jeWFuIDogY2hhbGsuZ3JlZW5cblxuXHRjb25zb2xlLmxvZyhcblx0XHRjb2xvci5ib2xkKGBcXG4ke2Fycm93fSBbJHt0aW1lc3RhbXB9XSAke2RpcmVjdGlvbi50b1VwcGVyQ2FzZSgpfWApLFxuXHQpXG5cdGNvbnNvbGUubG9nKGNoYWxrLnllbGxvdyhgICAgVHlwZTogJHt0eXBlfWApKVxuXG5cdGlmIChkYXRhKSB7XG5cdFx0Y29uc29sZS5sb2coY2hhbGsuZ3JheSgnICAgRGF0YTonKSwgZGF0YSlcblx0fVxufVxuXG4vLyDlrZjlgqjorqTor4Hkv6Hmga/vvJpzZXNzaW9uSWQgLT4geyBrZXk6IHN0cmluZywgdGFiSWQ6IG51bWJlciB9XG5jb25zdCBhdXRoZW50aWNhdGVkU2Vzc2lvbnMgPSBuZXcgTWFwPFxuXHRzdHJpbmcsXG5cdHsga2V5OiBzdHJpbmc7IHRhYklkOiBudW1iZXI7IHRpbWVzdGFtcDogbnVtYmVyIH1cbj4oKVxuXG4vLyDnlJ/miJDlubblrZjlgqggQVBJIGtleVxubGV0IGFwaUtleSA9IGdlbmVyYXRlVVVJRCgpXG5cbi8vIOavj+asoemHjeWQryBiYWNrZ3JvdW5kIOmHjeaWsOeUn+aIkCBrZXlcbmNvbnNvbGUubG9nKCdHZW5lcmF0ZWQgbmV3IEFQSSBrZXk6JywgYXBpS2V5KVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcblx0Y29uc29sZS5sb2coY2hhbGsubWFnZW50YS5ib2xkKCdcXG7wn5qAIEJhY2tncm91bmQgc2VydmljZSB3b3JrZXIgc3RhcnRlZCcpKVxuXHRjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coYCAgIEFQSSBLZXk6ICR7YXBpS2V5fVxcbmApKVxuXG5cdC8vIOebkeWQrCB0YWIg5YWz6Zet5LqL5Lu277yM5riF55CG6K+lIHRhYiDnmoTmiYDmnIkgc2Vzc2lvblxuXHRjaHJvbWUudGFicy5vblJlbW92ZWQuYWRkTGlzdGVuZXIoKHRhYklkKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBbc2Vzc2lvbklkLCBzZXNzaW9uXSBvZiBhdXRoZW50aWNhdGVkU2Vzc2lvbnMuZW50cmllcygpKSB7XG5cdFx0XHRpZiAoc2Vzc2lvbi50YWJJZCA9PT0gdGFiSWQpIHtcblx0XHRcdFx0YXV0aGVudGljYXRlZFNlc3Npb25zLmRlbGV0ZShzZXNzaW9uSWQpXG5cdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdGNoYWxrLnJlZChcblx0XHRcdFx0XHRcdGBcXG7wn5eR77iPICBUYWIgJHt0YWJJZH0gY2xvc2VkLCBjbGVhcmVkIHNlc3Npb24gJHtzZXNzaW9uSWR9XFxuYCxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXG5cdC8vIOebkeWQrOadpeiHqiBjb250ZW50IHNjcmlwdCDnmoTmtojmga9cblx0Y2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuXHRcdChcblx0XHRcdG1lc3NhZ2U6IGFueSxcblx0XHRcdHNlbmRlcjogY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcblx0XHRcdHNlbmRSZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+IHZvaWQsXG5cdFx0KSA9PiB7XG5cdFx0XHRjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIOiusOW9leaUtuWIsOeahOa2iOaBr1xuXHRcdFx0XHRcdGxvZ01lc3NhZ2UoJ2luY29taW5nJywgbWVzc2FnZS50eXBlLCB7XG5cdFx0XHRcdFx0XHRzZXNzaW9uSWQ6IG1lc3NhZ2Uuc2Vzc2lvbklkLFxuXHRcdFx0XHRcdFx0dGFiSWQ6IHNlbmRlci50YWI/LmlkLFxuXHRcdFx0XHRcdFx0cGF5bG9hZDogbWVzc2FnZS5wYXlsb2FkLFxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHQvLyDojrflj5blvZPliY0gQVBJIGtlee+8iOeUqOS6jiBwb3B1cCDmmL7npLrvvIlcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnR0VUX0FQSV9LRVknKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiBhcGlLZXksXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8g5Yi35pawIEFQSSBrZXlcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnUkVGUkVTSF9BUElfS0VZJykge1xuXHRcdFx0XHRcdFx0YXBpS2V5ID0gZ2VuZXJhdGVVVUlEKClcblx0XHRcdFx0XHRcdGF1dGhlbnRpY2F0ZWRTZXNzaW9ucy5jbGVhcigpXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0Y2hhbGsubWFnZW50YS5ib2xkKFxuXHRcdFx0XHRcdFx0XHRcdGBcXG7wn5SEIFJlZnJlc2hlZCBBUEkga2V5OiAke2FwaUtleX1gLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdGNoYWxrLnJlZChcblx0XHRcdFx0XHRcdFx0XHRgICAgQ2xlYXJlZCAke2F1dGhlbnRpY2F0ZWRTZXNzaW9ucy5zaXplfSBzZXNzaW9uc1xcbmAsXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiBhcGlLZXksXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTGluayDorqTor4Fcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnTElOSycpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsga2V5IH0gPSBtZXNzYWdlLnBheWxvYWRcblx0XHRcdFx0XHRcdGNvbnN0IHsgc2Vzc2lvbklkIH0gPSBtZXNzYWdlXG5cdFx0XHRcdFx0XHRjb25zdCB0YWJJZCA9IHNlbmRlci50YWI/LmlkXG5cblx0XHRcdFx0XHRcdGlmICghdGFiSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vIHRhYiBJRCcsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFzZXNzaW9uSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vIHNlc3Npb24gSUQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChrZXkgPT09IGFwaUtleSkge1xuXHRcdFx0XHRcdFx0XHRhdXRoZW50aWNhdGVkU2Vzc2lvbnMuc2V0KHNlc3Npb25JZCwge1xuXHRcdFx0XHRcdFx0XHRcdGtleSxcblx0XHRcdFx0XHRcdFx0XHR0YWJJZCxcblx0XHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IERhdGUubm93KCksXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRcdGNoYWxrLmdyZWVuLmJvbGQoXG5cdFx0XHRcdFx0XHRcdFx0XHRgXFxu4pyFIFNlc3Npb24gYXV0aGVudGljYXRlZDogJHtzZXNzaW9uSWQuc3Vic3RyaW5nKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHRcdFx0XHRcdCl9Li4uYCxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYCAgIFRhYiBJRDogJHt0YWJJZH1cXG5gKSlcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdGRhdGE6IHsgYXV0aGVudGljYXRlZDogdHJ1ZSwgc2Vzc2lvbklkIH0sXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdJbnZhbGlkIGtleScsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyDpqozor4HorqTor4HnirbmgIFcblx0XHRcdFx0XHRjb25zdCB7IHNlc3Npb25JZCB9ID0gbWVzc2FnZVxuXHRcdFx0XHRcdGlmICghc2Vzc2lvbklkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdObyBzZXNzaW9uIElEJyxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCBzZXNzaW9uID0gYXV0aGVudGljYXRlZFNlc3Npb25zLmdldChzZXNzaW9uSWQpXG5cdFx0XHRcdFx0aWYgKCFzZXNzaW9uIHx8IHNlc3Npb24ua2V5ICE9PSBhcGlLZXkpIHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vdCBhdXRoZW50aWNhdGVkLiBDYWxsIGxpbmsoa2V5KSBmaXJzdC4nLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdHRVRfVEFCUycpIHtcblx0XHRcdFx0XHRcdC8vIOiOt+WPluaJgOaciSB0YWJzXG5cdFx0XHRcdFx0XHRjb25zdCB0YWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe30pXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB0YWJzLm1hcCgodGFiOiBjaHJvbWUudGFicy5UYWIpID0+ICh7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IHRhYi5pZCxcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogdGFiLnRpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogdGFiLnVybCxcblx0XHRcdFx0XHRcdFx0XHRhY3RpdmU6IHRhYi5hY3RpdmUsXG5cdFx0XHRcdFx0XHRcdFx0d2luZG93SWQ6IHRhYi53aW5kb3dJZCxcblx0XHRcdFx0XHRcdFx0fSkpLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdFWEVDVVRFX1NDUklQVCcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgdGFiSWQsIGNvZGUgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIXRhYklkIHx8ICFjb2RlKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdNaXNzaW5nIHRhYklkIG9yIGNvZGUnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIOWcqOebruaghyB0YWIg55qEIE1BSU4gd29ybGQg5Lit5omn6KGM5Luj56CBXG5cdFx0XHRcdFx0XHQvLyDov5nmoLflj6/ku6Xnu5Xov4cgaXNvbGF0ZWQgd29ybGQg55qEIENTUCDpmZDliLZcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQ6IHsgdGFiSWQgfSxcblx0XHRcdFx0XHRcdFx0d29ybGQ6ICdNQUlOJyxcblx0XHRcdFx0XHRcdFx0ZnVuYzogKGNvZGVTdHJpbmc6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdC8vIOWcqCBNQUlOIHdvcmxkIOS4re+8jGV2YWwg5piv5YWB6K6455qEXG5cdFx0XHRcdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV2YWxcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZXZhbChjb2RlU3RyaW5nKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRhcmdzOiBbY29kZV0sXG5cdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiByZXN1bHRzWzBdPy5yZXN1bHQsXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2UudHlwZSA9PT0gJ09QRU5fVEFCJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyB1cmwgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIXVybCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiAnTWlzc2luZyB1cmwnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IG5ld1RhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybCB9KVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IG5ld1RhYi5pZCxcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogbmV3VGFiLnRpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogbmV3VGFiLnVybCxcblx0XHRcdFx0XHRcdFx0XHRhY3RpdmU6IG5ld1RhYi5hY3RpdmUsXG5cdFx0XHRcdFx0XHRcdFx0d2luZG93SWQ6IG5ld1RhYi53aW5kb3dJZCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnQ0xPU0VfVEFCJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyB0YWJJZCB9ID0gbWVzc2FnZS5wYXlsb2FkXG5cblx0XHRcdFx0XHRcdGlmICghdGFiSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ01pc3NpbmcgdGFiSWQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGF3YWl0IGNocm9tZS50YWJzLnJlbW92ZSh0YWJJZClcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGF0YTogeyB0YWJJZCwgY2xvc2VkOiB0cnVlIH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXJyb3I6ICdVbmtub3duIG1lc3NhZ2UgdHlwZScsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0Y2hhbGsucmVkLmJvbGQoJ1xcbuKdjCBFcnJvciBwcm9jZXNzaW5nIG1lc3NhZ2U6JyksXG5cdFx0XHRcdFx0XHRlcnJvcixcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXJyb3I6XG5cdFx0XHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0XHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0XHRcdFx0XHQ6IFN0cmluZyhlcnJvciksXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIOW8guatpeWkhOeQhuW5tuWPkemAgeWTjeW6lFxuXHRcdFx0aGFuZGxlTWVzc2FnZSgpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG5cdFx0XHRcdGxvZ01lc3NhZ2UoJ291dGdvaW5nJywgbWVzc2FnZS50eXBlLCB7XG5cdFx0XHRcdFx0c3VjY2VzczogcmVzcG9uc2Uuc3VjY2Vzcyxcblx0XHRcdFx0XHRkYXRhOiAocmVzcG9uc2UgYXMgYW55KS5kYXRhLFxuXHRcdFx0XHRcdGVycm9yOiAocmVzcG9uc2UgYXMgYW55KS5lcnJvcixcblx0XHRcdFx0fSlcblx0XHRcdFx0c2VuZFJlc3BvbnNlKHJlc3BvbnNlKVxuXHRcdFx0fSlcblx0XHRcdHJldHVybiB0cnVlIC8vIOS/neaMgea2iOaBr+mAmumBk+W8gOWQr+S7peaUr+aMgeW8guatpeWTjeW6lFxuXHRcdH0sXG5cdClcbn0pXG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sIm5hbWVzIjpbImNvZGUiLCJzdHlsZXMiLCJyZXN1bHQiLCJicmFuZCIsImNoYWxrIiwibGV2ZWwiLCJicm93c2VyIiwiX2Jyb3dzZXIiXSwibWFwcGluZ3MiOiI7O0FBQU8sV0FBUyxpQkFBaUIsS0FBSztBQUNwQyxRQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsV0FBWSxRQUFPLEVBQUUsTUFBTSxJQUFHO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FDSEEsUUFBTSx5QkFBeUI7QUFFL0IsUUFBTSxhQUFhLENBQUMsU0FBUyxNQUFNLENBQUFBLFVBQVEsUUFBVUEsUUFBTyxNQUFNO0FBRWxFLFFBQU0sY0FBYyxDQUFDLFNBQVMsTUFBTSxDQUFBQSxVQUFRLFFBQVUsS0FBSyxNQUFNLE1BQU1BLEtBQUk7QUFFM0UsUUFBTSxjQUFjLENBQUMsU0FBUyxNQUFNLENBQUMsS0FBSyxPQUFPLFNBQVMsUUFBVSxLQUFLLE1BQU0sTUFBTSxHQUFHLElBQUksS0FBSyxJQUFJLElBQUk7QUFFekcsUUFBTUMsV0FBUztBQUFBLElBQ2QsVUFBVTtBQUFBLE1BQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUFBO0FBQUEsTUFFWixNQUFNLENBQUMsR0FBRyxFQUFFO0FBQUEsTUFDWixLQUFLLENBQUMsR0FBRyxFQUFFO0FBQUEsTUFDWCxRQUFRLENBQUMsR0FBRyxFQUFFO0FBQUEsTUFDZCxXQUFXLENBQUMsR0FBRyxFQUFFO0FBQUEsTUFDakIsVUFBVSxDQUFDLElBQUksRUFBRTtBQUFBLE1BQ2pCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFBQSxNQUNmLFFBQVEsQ0FBQyxHQUFHLEVBQUU7QUFBQSxNQUNkLGVBQWUsQ0FBQyxHQUFHLEVBQUU7QUFBQSxJQUN2QjtBQUFBLElBQ0MsT0FBTztBQUFBLE1BQ04sT0FBTyxDQUFDLElBQUksRUFBRTtBQUFBLE1BQ2QsS0FBSyxDQUFDLElBQUks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
