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
  class LLMClient {
    config;
    constructor(config) {
      this.config = config;
    }
    /**
     * 调用 LLM API
     */
    async chat(messages, tools, toolChoice) {
      const baseURL = this.config.baseURL || "https://api.openai.com/v1";
      const url = `${baseURL}/chat/completions`;
      const requestBody = {
        model: this.config.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      };
      if (tools && tools.length > 0) {
        requestBody.tools = tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }));
        if (toolChoice) {
          requestBody.tool_choice = toolChoice;
        }
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      return {
        message: {
          role: "assistant",
          content: data.choices[0].message.content,
          tool_calls: data.choices[0].message.tool_calls
        },
        usage: data.usage
      };
    }
    /**
     * 创建包含截图的用户消息
     */
    static createVisionMessage(text, screenshotDataURL) {
      return {
        role: "user",
        content: [
          {
            type: "text",
            text
          },
          {
            type: "image_url",
            image_url: {
              url: screenshotDataURL,
              detail: "high"
            }
          }
        ]
      };
    }
    /**
     * 创建纯文本消息
     */
    static createTextMessage(role, text) {
      return {
        role,
        content: text
      };
    }
    /**
     * 创建工具调用结果消息
     */
    static createToolMessage(toolCallId, toolName, result2) {
      return {
        role: "tool",
        content: result2,
        tool_call_id: toolCallId,
        name: toolName
      };
    }
  }
  const openTabTool = {
    name: "open_tab",
    description: "Open a new tab with the specified URL",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to open. Must be a valid http/https URL."
        },
        active: {
          type: "boolean",
          description: "Whether to make the new tab active (focused). Default is true."
        }
      },
      required: ["url"]
    }
  };
  async function openTab(args2) {
    try {
      const tab = await chrome.tabs.create({
        url: args2.url,
        active: args2.active !== false
      });
      return `✅ Opened new tab (ID: ${tab.id}) with URL: ${args2.url}`;
    } catch (error) {
      return `❌ Failed to open tab: ${error.message}`;
    }
  }
  const activeTabTool = {
    name: "active_tab",
    description: "Switch to (activate/focus) a specific tab by ID",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab to activate"
        }
      },
      required: ["tabId"]
    }
  };
  async function activeTab(args2) {
    try {
      await chrome.tabs.update(args2.tabId, { active: true });
      const tab = await chrome.tabs.get(args2.tabId);
      return `✅ Activated tab (ID: ${args2.tabId}): ${tab.title}`;
    } catch (error) {
      return `❌ Failed to activate tab: ${error.message}`;
    }
  }
  const closeTabTool = {
    name: "close_tab",
    description: "Close a specific tab by ID",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab to close"
        }
      },
      required: ["tabId"]
    }
  };
  async function closeTab(args2) {
    try {
      await chrome.tabs.remove(args2.tabId);
      return `✅ Closed tab (ID: ${args2.tabId})`;
    } catch (error) {
      return `❌ Failed to close tab: ${error.message}`;
    }
  }
  const reloadTabTool = {
    name: "reload_tab",
    description: "Reload a specific tab",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab to reload. If not provided, reload the active tab."
        },
        bypassCache: {
          type: "boolean",
          description: "Whether to bypass the cache (hard reload). Default is false."
        }
      },
      required: []
    }
  };
  async function reloadTab(args2) {
    try {
      let tabId2 = args2.tabId;
      if (!tabId2) {
        const [activeTab2] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (!activeTab2?.id) {
          return "❌ No active tab found";
        }
        tabId2 = activeTab2.id;
      }
      await chrome.tabs.reload(tabId2, { bypassCache: args2.bypassCache });
      return `✅ Reloaded tab (ID: ${tabId2})${args2.bypassCache ? " (bypassed cache)" : ""}`;
    } catch (error) {
      return `❌ Failed to reload tab: ${error.message}`;
    }
  }
  const scrollPageTool = {
    name: "scroll_page",
    description: "Scroll the page in the specified direction",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab to scroll. If not provided, scroll the active tab."
        },
        direction: {
          type: "string",
          description: "Scroll direction",
          enum: ["up", "down", "top", "bottom"]
        },
        amount: {
          type: "number",
          description: 'Scroll amount in pixels. Only used for "up" and "down". Default is one viewport height.'
        }
      },
      required: ["direction"]
    }
  };
  async function scrollPage(args) {
    try {
      let tabId = args.tabId;
      if (!tabId) {
        const [activeTab2] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (!activeTab2?.id) {
          return "❌ No active tab found";
        }
        tabId = activeTab2.id;
      }
      const code = (() => {
        switch (args.direction) {
          case "up":
            return `window.scrollBy(0, -(${args.amount || "window.innerHeight"}))`;
          case "down":
            return `window.scrollBy(0, ${args.amount || "window.innerHeight"})`;
          case "top":
            return `window.scrollTo(0, 0)`;
          case "bottom":
            return `window.scrollTo(0, document.body.scrollHeight)`;
        }
      })();
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (scrollCode) => {
          eval(scrollCode);
        },
        args: [code]
      });
      return `✅ Scrolled ${args.direction} in tab (ID: ${tabId})`;
    } catch (error) {
      return `❌ Failed to scroll: ${error.message}`;
    }
  }
  const clickTool = {
    name: "click",
    description: "Click an element on the page using CSS selector",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab. If not provided, use the active tab."
        },
        selector: {
          type: "string",
          description: `CSS selector of the element to click. Examples: "button.submit", "#login", "a[href='/about']"`
        },
        waitAfter: {
          type: "number",
          description: "Milliseconds to wait after clicking. Default is 500ms."
        }
      },
      required: ["selector"]
    }
  };
  async function click(args2) {
    try {
      let tabId2 = args2.tabId;
      if (!tabId2) {
        const [activeTab2] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (!activeTab2?.id) {
          return "❌ No active tab found";
        }
        tabId2 = activeTab2.id;
      }
      const results2 = await chrome.scripting.executeScript({
        target: { tabId: tabId2 },
        func: (selector, waitMs) => {
          const element = document.querySelector(selector);
          if (!element) {
            return {
              success: false,
              error: `Element not found: ${selector}`
            };
          }
          element.click();
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                text: element.innerText?.slice(0, 100) || element.tagName
              });
            }, waitMs);
          });
        },
        args: [args2.selector, args2.waitAfter || 500]
      });
      const result2 = results2[0]?.result;
      if (!result2?.success) {
        return `❌ ${result2?.error || "Click failed"}`;
      }
      return `✅ Clicked element "${args2.selector}" (text: "${result2.text}") in tab (ID: ${tabId2})`;
    } catch (error) {
      return `❌ Failed to click: ${error.message}`;
    }
  }
  const keydownTool = {
    name: "keydown",
    description: "Type text into a focused input field or send keyboard shortcuts",
    parameters: {
      type: "object",
      properties: {
        tabId: {
          type: "number",
          description: "The ID of the tab. If not provided, use the active tab."
        },
        selector: {
          type: "string",
          description: "CSS selector of the input element. If not provided, types into the currently focused element."
        },
        text: {
          type: "string",
          description: 'Text to type. Use "\\n" for Enter key.'
        }
      },
      required: ["text"]
    }
  };
  async function keydown(args2) {
    try {
      let tabId2 = args2.tabId;
      if (!tabId2) {
        const [activeTab2] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        if (!activeTab2?.id) {
          return "❌ No active tab found";
        }
        tabId2 = activeTab2.id;
      }
      const results2 = await chrome.scripting.executeScript({
        target: { tabId: tabId2 },
        func: (selector, text) => {
          let element = null;
          if (selector) {
            element = document.querySelector(selector);
            if (!element) {
              return {
                success: false,
                error: `Element not found: ${selector}`
              };
            }
            element.focus();
          } else {
            element = document.activeElement;
            if (!element) {
              return {
                success: false,
                error: "No focused element found"
              };
            }
          }
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = text;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(
              new Event("change", { bubbles: true })
            );
            return { success: true, tagName: element.tagName };
          }
          if (element.isContentEditable) {
            element.textContent = text;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            return { success: true, tagName: "ContentEditable" };
          }
          for (const char of text) {
            if (char === "\n") {
              element.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "Enter",
                  bubbles: true
                })
              );
              element.dispatchEvent(
                new KeyboardEvent("keypress", {
                  key: "Enter",
                  bubbles: true
                })
              );
              element.dispatchEvent(
                new KeyboardEvent("keyup", {
                  key: "Enter",
                  bubbles: true
                })
              );
            } else {
              element.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: char,
                  bubbles: true
                })
              );
              element.dispatchEvent(
                new KeyboardEvent("keypress", {
                  key: char,
                  bubbles: true
                })
              );
              element.dispatchEvent(
                new KeyboardEvent("keyup", {
                  key: char,
                  bubbles: true
                })
              );
            }
          }
          return { success: true, tagName: element.tagName };
        },
        args: [args2.selector, args2.text]
      });
      const result2 = results2[0]?.result;
      if (!result2?.success) {
        return `❌ ${result2?.error || "Type failed"}`;
      }
      const preview = args2.text.length > 50 ? args2.text.slice(0, 50) + "..." : args2.text;
      return `✅ Typed "${preview}" into ${args2.selector || "focused element"} (${result2.tagName}) in tab (ID: ${tabId2})`;
    } catch (error) {
      return `❌ Failed to type: ${error.message}`;
    }
  }
  const waitTool = {
    name: "wait",
    description: "Wait for a specified amount of time (useful for observing page changes after actions)",
    parameters: {
      type: "object",
      properties: {
        seconds: {
          type: "number",
          description: "Number of seconds to wait (0.5 to 10)"
        }
      },
      required: ["seconds"]
    }
  };
  async function wait(args2) {
    const seconds = Math.max(0.5, Math.min(10, args2.seconds));
    await new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
    return `✅ Waited for ${seconds} seconds`;
  }
  const doneTool = {
    name: "done",
    description: "Mark the task as completed and return the final result",
    parameters: {
      type: "object",
      properties: {
        result: {
          type: "string",
          description: "The final result or summary of the task"
        }
      },
      required: ["result"]
    }
  };
  async function done(args2) {
    return `✅ Task completed: ${args2.result}`;
  }
  const allTools = [
    openTabTool,
    activeTabTool,
    closeTabTool,
    reloadTabTool,
    scrollPageTool,
    clickTool,
    keydownTool,
    waitTool,
    doneTool
  ];
  const toolExecutors = {
    open_tab: openTab,
    active_tab: activeTab,
    close_tab: closeTab,
    reload_tab: reloadTab,
    scroll_page: scrollPage,
    click,
    keydown,
    wait,
    done
  };
  class BrowserAgent {
    config;
    llm;
    messages = [];
    steps = [];
    totalTokens = 0;
    currentStep = 0;
    constructor(config) {
      this.config = {
        maxSteps: 20,
        systemPrompt: this.getDefaultSystemPrompt(),
        ...config
      };
      this.llm = new LLMClient(config);
      this.messages.push(
        LLMClient.createTextMessage("system", this.config.systemPrompt)
      );
    }
    /**
     * 执行任务
     */
    async execute(task) {
      console.log(chalk.magenta.bold(`
🤖 Agent started task: "${task}"
`));
      this.messages.push(
        LLMClient.createTextMessage(
          "user",
          `Task: ${task}

Please complete this task step by step. Use the provided tools to interact with the browser.`
        )
      );
      try {
        while (this.currentStep < this.config.maxSteps) {
          this.currentStep++;
          console.log(
            chalk.cyan.bold(
              `
📍 Step ${this.currentStep}/${this.config.maxSteps}
`
            )
          );
          const context = await this.collectContext();
          const contextMessage = this.buildContextMessage(context);
          const currentMessages = [...this.messages, contextMessage];
          const llmResponse = await this.llm.chat(
            currentMessages,
            allTools,
            "auto"
          );
          const step = {
            stepNumber: this.currentStep,
            timestamp: Date.now(),
            context,
            llmRequest: {
              messages: currentMessages,
              tools: allTools
            },
            llmResponse: {
              content: llmResponse.message.content || void 0,
              toolCalls: llmResponse.message.tool_calls?.map(
                (tc) => ({
                  id: tc.id,
                  name: tc.function.name,
                  arguments: JSON.parse(tc.function.arguments)
                })
              )
            },
            usage: llmResponse.usage
          };
          if (llmResponse.usage) {
            this.totalTokens += llmResponse.usage.total_tokens;
          }
          this.messages.push({
            role: "assistant",
            content: llmResponse.message.content || "",
            tool_calls: llmResponse.message.tool_calls
          });
          if (llmResponse.message.tool_calls) {
            console.log(
              chalk.yellow(
                `   🔧 Executing ${llmResponse.message.tool_calls.length} tool(s)...
`
              )
            );
            step.toolResults = [];
            for (const toolCall of llmResponse.message.tool_calls) {
              const toolName = toolCall.function.name;
              const toolArgs = JSON.parse(toolCall.function.arguments);
              console.log(
                chalk.blue(
                  `      → ${toolName}(${JSON.stringify(
                    toolArgs
                  )})`
                )
              );
              const executor = toolExecutors[toolName];
              if (!executor) {
                const errorMsg = `❌ Tool not found: ${toolName}`;
                console.log(chalk.red(`      ${errorMsg}`));
                step.toolResults.push({
                  toolCallId: toolCall.id,
                  toolName,
                  result: errorMsg
                });
                this.messages.push(
                  LLMClient.createToolMessage(
                    toolCall.id,
                    toolName,
                    errorMsg
                  )
                );
                continue;
              }
              try {
                const result2 = await executor(toolArgs);
                console.log(chalk.green(`      ${result2}`));
                step.toolResults.push({
                  toolCallId: toolCall.id,
                  toolName,
                  result: result2
                });
                this.messages.push(
                  LLMClient.createToolMessage(
                    toolCall.id,
                    toolName,
                    result2
                  )
                );
                if (toolName === "done") {
                  this.steps.push(step);
                  return {
                    success: true,
                    finalResult: toolArgs.result,
                    steps: this.steps,
                    totalSteps: this.currentStep,
                    totalTokens: this.totalTokens
                  };
                }
              } catch (error) {
                const errorMsg = `❌ Tool execution error: ${error.message}`;
                console.log(chalk.red(`      ${errorMsg}`));
                step.toolResults.push({
                  toolCallId: toolCall.id,
                  toolName,
                  result: errorMsg
                });
                this.messages.push(
                  LLMClient.createToolMessage(
                    toolCall.id,
                    toolName,
                    errorMsg
                  )
                );
              }
            }
          } else if (llmResponse.message.content) {
            console.log(
              chalk.yellow(
                `   💬 Assistant: ${llmResponse.message.content}`
              )
            );
          }
          this.steps.push(step);
        }
        return {
          success: false,
          error: `Reached maximum steps (${this.config.maxSteps})`,
          steps: this.steps,
          totalSteps: this.currentStep,
          totalTokens: this.totalTokens
        };
      } catch (error) {
        console.error(
          chalk.red.bold(`
❌ Agent error: ${error.message}
`)
        );
        return {
          success: false,
          error: error.message,
          steps: this.steps,
          totalSteps: this.currentStep,
          totalTokens: this.totalTokens
        };
      }
    }
    /**
     * 收集当前浏览器上下文
     */
    async collectContext() {
      const allTabs = await chrome.tabs.query({});
      const tabs = allTabs.map((tab) => ({
        id: tab.id,
        title: tab.title || "Untitled",
        url: tab.url || "about:blank",
        active: tab.active,
        windowId: tab.windowId
      }));
      const [activeTab2] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      if (!activeTab2 || !activeTab2.id) {
        throw new Error("No active tab found");
      }
      const screenshot = await chrome.tabs.captureVisibleTab(
        activeTab2.windowId,
        { format: "png" }
      );
      return {
        tabs,
        activeTab: {
          id: activeTab2.id,
          title: activeTab2.title || "Untitled",
          url: activeTab2.url || "about:blank",
          active: true,
          windowId: activeTab2.windowId
        },
        screenshot
      };
    }
    /**
     * 构建包含上下文的消息
     */
    buildContextMessage(context) {
      const tabsInfo = context.tabs.map(
        (tab) => `- [${tab.id}] ${tab.title}${tab.active ? " (ACTIVE)" : ""}
  URL: ${tab.url}`
      ).join("\n");
      const contextText = `
=== CURRENT BROWSER STATE ===

Active Tab: [${context.activeTab.id}] ${context.activeTab.title}
URL: ${context.activeTab.url}

All Tabs (${context.tabs.length} total):
${tabsInfo}

=== SCREENSHOT ===
The screenshot below shows the current state of the active tab.
Please analyze it carefully before deciding your next action.
`;
      return LLMClient.createVisionMessage(contextText, context.screenshot);
    }
    /**
     * 默认系统提示
     */
    getDefaultSystemPrompt() {
      return `You are a browser automation agent. Your goal is to help users complete tasks by controlling browser tabs.

You have access to the following tools:
- open_tab: Open a new tab with a URL
- active_tab: Switch to a specific tab
- close_tab: Close a tab
- reload_tab: Reload a tab
- scroll_page: Scroll the page up/down/top/bottom
- click: Click an element using CSS selector
- keydown: Type text into an input field
- wait: Wait for a specified time
- done: Mark the task as completed

On each step, you will receive:
1. A list of all open tabs with their IDs, titles, and URLs
2. Information about the currently active tab
3. A screenshot of the active tab

Think step by step:
1. Analyze the current state (tabs and screenshot)
2. Decide what action to take next
3. Use the appropriate tool
4. After each action, observe the result and plan the next step

Important guidelines:
- Use CSS selectors carefully (inspect the page structure from the screenshot)
- Wait after actions that trigger page changes (use the wait tool)
- If you're not sure about a selector, try to scroll and explore the page first
- When the task is complete, call the 'done' tool with a summary

Always be precise and efficient. Complete the task in as few steps as possible.`;
    }
    /**
     * 获取执行历史
     */
    getHistory() {
      return this.steps;
    }
    /**
     * 获取当前使用的 token 数
     */
    getTotalTokens() {
      return this.totalTokens;
    }
  }
  const runningAgents = /* @__PURE__ */ new Map();
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
            if (message.type === "AGENT_START") {
              const { agentId, task, config } = message.payload;
              if (!agentId || !task || !config) {
                return {
                  success: false,
                  error: "Missing agentId, task, or config"
                };
              }
              if (runningAgents.has(agentId)) {
                return {
                  success: false,
                  error: `Agent ${agentId} is already running`
                };
              }
              console.log(
                chalk.magenta.bold(
                  `
🤖 Starting agent ${agentId}...
`
                )
              );
              try {
                const agent = new BrowserAgent(
                  config
                );
                runningAgents.set(agentId, agent);
                agent.execute(task).then((result2) => {
                  console.log(
                    chalk.green.bold(
                      `
✅ Agent ${agentId} completed
`
                    )
                  );
                  console.log(
                    chalk.gray("   Result:"),
                    result2
                  );
                  runningAgents.delete(agentId);
                }).catch((error) => {
                  console.error(
                    chalk.red.bold(
                      `
❌ Agent ${agentId} error: ${error.message}
`
                    )
                  );
                  runningAgents.delete(agentId);
                });
                return {
                  success: true,
                  data: {
                    agentId,
                    status: "started"
                  }
                };
              } catch (error) {
                return {
                  success: false,
                  error: error.message
                };
              }
            }
            if (message.type === "AGENT_STATUS") {
              const { agentId } = message.payload;
              if (!agentId) {
                return {
                  success: false,
                  error: "Missing agentId"
                };
              }
              const agent = runningAgents.get(agentId);
              if (!agent) {
                return {
                  success: true,
                  data: {
                    agentId,
                    status: "not_found",
                    running: false
                  }
                };
              }
              return {
                success: true,
                data: {
                  agentId,
                  status: "running",
                  running: true,
                  steps: agent.getHistory().length,
                  totalTokens: agent.getTotalTokens()
                }
              };
            }
            if (message.type === "AGENT_HISTORY") {
              const { agentId } = message.payload;
              if (!agentId) {
                return {
                  success: false,
                  error: "Missing agentId"
                };
              }
              const agent = runningAgents.get(agentId);
              if (!agent) {
                return {
                  success: false,
                  error: `Agent ${agentId} not found`
                };
              }
              return {
                success: true,
                data: {
                  agentId,
                  history: agent.getHistory(),
                  totalTokens: agent.getTotalTokens()
                }
              };
            }
            if (message.type === "AGENT_STOP") {
              const { agentId } = message.payload;
              if (!agentId) {
                return {
                  success: false,
                  error: "Missing agentId"
                };
              }
              runningAgents.delete(agentId);
              return {
                success: true,
                data: {
                  agentId,
                  status: "stopped"
                }
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
  function print(method, ...args2) {
    if (typeof args2[0] === "string") {
      const message2 = args2.shift();
      method(`[wxt] ${message2}`, ...args2);
    } else {
      method("[wxt]", ...args2);
    }
  }
  const logger = {
    debug: (...args2) => print(console.debug, ...args2),
    log: (...args2) => print(console.log, ...args2),
    warn: (...args2) => print(console.warn, ...args2),
    error: (...args2) => print(console.error, ...args2)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jaGFsay9zb3VyY2UvdmVuZG9yL2Fuc2ktc3R5bGVzL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2NoYWxrL3NvdXJjZS92ZW5kb3Ivc3VwcG9ydHMtY29sb3IvYnJvd3Nlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jaGFsay9zb3VyY2UvdXRpbGl0aWVzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2NoYWxrL3NvdXJjZS9pbmRleC5qcyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQvYWdlbnQvbGxtLnRzIiwiLi4vLi4vZW50cnlwb2ludHMvYmFja2dyb3VuZC9hZ2VudC90b29scy50cyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQvYWdlbnQvYWdlbnQudHMiLCIuLi8uLi9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kL2luZGV4LnRzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvbWF0Y2gtcGF0dGVybnMvbGliL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuICBpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcbiAgcmV0dXJuIGFyZztcbn1cbiIsImNvbnN0IEFOU0lfQkFDS0dST1VORF9PRkZTRVQgPSAxMDtcblxuY29uc3Qgd3JhcEFuc2kxNiA9IChvZmZzZXQgPSAwKSA9PiBjb2RlID0+IGBcXHUwMDFCWyR7Y29kZSArIG9mZnNldH1tYDtcblxuY29uc3Qgd3JhcEFuc2kyNTYgPSAob2Zmc2V0ID0gMCkgPT4gY29kZSA9PiBgXFx1MDAxQlskezM4ICsgb2Zmc2V0fTs1OyR7Y29kZX1tYDtcblxuY29uc3Qgd3JhcEFuc2kxNm0gPSAob2Zmc2V0ID0gMCkgPT4gKHJlZCwgZ3JlZW4sIGJsdWUpID0+IGBcXHUwMDFCWyR7MzggKyBvZmZzZXR9OzI7JHtyZWR9OyR7Z3JlZW59OyR7Ymx1ZX1tYDtcblxuY29uc3Qgc3R5bGVzID0ge1xuXHRtb2RpZmllcjoge1xuXHRcdHJlc2V0OiBbMCwgMF0sXG5cdFx0Ly8gMjEgaXNuJ3Qgd2lkZWx5IHN1cHBvcnRlZCBhbmQgMjIgZG9lcyB0aGUgc2FtZSB0aGluZ1xuXHRcdGJvbGQ6IFsxLCAyMl0sXG5cdFx0ZGltOiBbMiwgMjJdLFxuXHRcdGl0YWxpYzogWzMsIDIzXSxcblx0XHR1bmRlcmxpbmU6IFs0LCAyNF0sXG5cdFx0b3ZlcmxpbmU6IFs1MywgNTVdLFxuXHRcdGludmVyc2U6IFs3LCAyN10sXG5cdFx0aGlkZGVuOiBbOCwgMjhdLFxuXHRcdHN0cmlrZXRocm91Z2g6IFs5LCAyOV0sXG5cdH0sXG5cdGNvbG9yOiB7XG5cdFx0YmxhY2s6IFszMCwgMzldLFxuXHRcdHJlZDogWzMxLCAzOV0sXG5cdFx0Z3JlZW46IFszMiwgMzldLFxuXHRcdHllbGxvdzogWzMzLCAzOV0sXG5cdFx0Ymx1ZTogWzM0LCAzOV0sXG5cdFx0bWFnZW50YTogWzM1LCAzOV0sXG5cdFx0Y3lhbjogWzM2LCAzOV0sXG5cdFx0d2hpdGU6IFszNywgMzldLFxuXG5cdFx0Ly8gQnJpZ2h0IGNvbG9yXG5cdFx0YmxhY2tCcmlnaHQ6IFs5MCwgMzldLFxuXHRcdGdyYXk6IFs5MCwgMzldLCAvLyBBbGlhcyBvZiBgYmxhY2tCcmlnaHRgXG5cdFx0Z3JleTogWzkwLCAzOV0sIC8vIEFsaWFzIG9mIGBibGFja0JyaWdodGBcblx0XHRyZWRCcmlnaHQ6IFs5MSwgMzldLFxuXHRcdGdyZWVuQnJpZ2h0OiBbOTIsIDM5XSxcblx0XHR5ZWxsb3dCcmlnaHQ6IFs5MywgMzldLFxuXHRcdGJsdWVCcmlnaHQ6IFs5NCwgMzldLFxuXHRcdG1hZ2VudGFCcmlnaHQ6IFs5NSwgMzldLFxuXHRcdGN5YW5CcmlnaHQ6IFs5NiwgMzldLFxuXHRcdHdoaXRlQnJpZ2h0OiBbOTcsIDM5XSxcblx0fSxcblx0YmdDb2xvcjoge1xuXHRcdGJnQmxhY2s6IFs0MCwgNDldLFxuXHRcdGJnUmVkOiBbNDEsIDQ5XSxcblx0XHRiZ0dyZWVuOiBbNDIsIDQ5XSxcblx0XHRiZ1llbGxvdzogWzQzLCA0OV0sXG5cdFx0YmdCbHVlOiBbNDQsIDQ5XSxcblx0XHRiZ01hZ2VudGE6IFs0NSwgNDldLFxuXHRcdGJnQ3lhbjogWzQ2LCA0OV0sXG5cdFx0YmdXaGl0ZTogWzQ3LCA0OV0sXG5cblx0XHQvLyBCcmlnaHQgY29sb3Jcblx0XHRiZ0JsYWNrQnJpZ2h0OiBbMTAwLCA0OV0sXG5cdFx0YmdHcmF5OiBbMTAwLCA0OV0sIC8vIEFsaWFzIG9mIGBiZ0JsYWNrQnJpZ2h0YFxuXHRcdGJnR3JleTogWzEwMCwgNDldLCAvLyBBbGlhcyBvZiBgYmdCbGFja0JyaWdodGBcblx0XHRiZ1JlZEJyaWdodDogWzEwMSwgNDldLFxuXHRcdGJnR3JlZW5CcmlnaHQ6IFsxMDIsIDQ5XSxcblx0XHRiZ1llbGxvd0JyaWdodDogWzEwMywgNDldLFxuXHRcdGJnQmx1ZUJyaWdodDogWzEwNCwgNDldLFxuXHRcdGJnTWFnZW50YUJyaWdodDogWzEwNSwgNDldLFxuXHRcdGJnQ3lhbkJyaWdodDogWzEwNiwgNDldLFxuXHRcdGJnV2hpdGVCcmlnaHQ6IFsxMDcsIDQ5XSxcblx0fSxcbn07XG5cbmV4cG9ydCBjb25zdCBtb2RpZmllck5hbWVzID0gT2JqZWN0LmtleXMoc3R5bGVzLm1vZGlmaWVyKTtcbmV4cG9ydCBjb25zdCBmb3JlZ3JvdW5kQ29sb3JOYW1lcyA9IE9iamVjdC5rZXlzKHN0eWxlcy5jb2xvcik7XG5leHBvcnQgY29uc3QgYmFja2dyb3VuZENvbG9yTmFtZXMgPSBPYmplY3Qua2V5cyhzdHlsZXMuYmdDb2xvcik7XG5leHBvcnQgY29uc3QgY29sb3JOYW1lcyA9IFsuLi5mb3JlZ3JvdW5kQ29sb3JOYW1lcywgLi4uYmFja2dyb3VuZENvbG9yTmFtZXNdO1xuXG5mdW5jdGlvbiBhc3NlbWJsZVN0eWxlcygpIHtcblx0Y29uc3QgY29kZXMgPSBuZXcgTWFwKCk7XG5cblx0Zm9yIChjb25zdCBbZ3JvdXBOYW1lLCBncm91cF0gb2YgT2JqZWN0LmVudHJpZXMoc3R5bGVzKSkge1xuXHRcdGZvciAoY29uc3QgW3N0eWxlTmFtZSwgc3R5bGVdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwKSkge1xuXHRcdFx0c3R5bGVzW3N0eWxlTmFtZV0gPSB7XG5cdFx0XHRcdG9wZW46IGBcXHUwMDFCWyR7c3R5bGVbMF19bWAsXG5cdFx0XHRcdGNsb3NlOiBgXFx1MDAxQlske3N0eWxlWzFdfW1gLFxuXHRcdFx0fTtcblxuXHRcdFx0Z3JvdXBbc3R5bGVOYW1lXSA9IHN0eWxlc1tzdHlsZU5hbWVdO1xuXG5cdFx0XHRjb2Rlcy5zZXQoc3R5bGVbMF0sIHN0eWxlWzFdKTtcblx0XHR9XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoc3R5bGVzLCBncm91cE5hbWUsIHtcblx0XHRcdHZhbHVlOiBncm91cCxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdH0pO1xuXHR9XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHN0eWxlcywgJ2NvZGVzJywge1xuXHRcdHZhbHVlOiBjb2Rlcyxcblx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0fSk7XG5cblx0c3R5bGVzLmNvbG9yLmNsb3NlID0gJ1xcdTAwMUJbMzltJztcblx0c3R5bGVzLmJnQ29sb3IuY2xvc2UgPSAnXFx1MDAxQls0OW0nO1xuXG5cdHN0eWxlcy5jb2xvci5hbnNpID0gd3JhcEFuc2kxNigpO1xuXHRzdHlsZXMuY29sb3IuYW5zaTI1NiA9IHdyYXBBbnNpMjU2KCk7XG5cdHN0eWxlcy5jb2xvci5hbnNpMTZtID0gd3JhcEFuc2kxNm0oKTtcblx0c3R5bGVzLmJnQ29sb3IuYW5zaSA9IHdyYXBBbnNpMTYoQU5TSV9CQUNLR1JPVU5EX09GRlNFVCk7XG5cdHN0eWxlcy5iZ0NvbG9yLmFuc2kyNTYgPSB3cmFwQW5zaTI1NihBTlNJX0JBQ0tHUk9VTkRfT0ZGU0VUKTtcblx0c3R5bGVzLmJnQ29sb3IuYW5zaTE2bSA9IHdyYXBBbnNpMTZtKEFOU0lfQkFDS0dST1VORF9PRkZTRVQpO1xuXG5cdC8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL1FpeC0vY29sb3ItY29udmVydC9ibG9iLzNmMGUwZDRlOTJlMjM1Nzk2Y2NiMTdmNmU4NWM3MjA5NGE2NTFmNDkvY29udmVyc2lvbnMuanNcblx0T2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc3R5bGVzLCB7XG5cdFx0cmdiVG9BbnNpMjU2OiB7XG5cdFx0XHR2YWx1ZShyZWQsIGdyZWVuLCBibHVlKSB7XG5cdFx0XHRcdC8vIFdlIHVzZSB0aGUgZXh0ZW5kZWQgZ3JleXNjYWxlIHBhbGV0dGUgaGVyZSwgd2l0aCB0aGUgZXhjZXB0aW9uIG9mXG5cdFx0XHRcdC8vIGJsYWNrIGFuZCB3aGl0ZS4gbm9ybWFsIHBhbGV0dGUgb25seSBoYXMgNCBncmV5c2NhbGUgc2hhZGVzLlxuXHRcdFx0XHRpZiAocmVkID09PSBncmVlbiAmJiBncmVlbiA9PT0gYmx1ZSkge1xuXHRcdFx0XHRcdGlmIChyZWQgPCA4KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gMTY7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHJlZCA+IDI0OCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDIzMTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCgoKHJlZCAtIDgpIC8gMjQ3KSAqIDI0KSArIDIzMjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAxNlxuXHRcdFx0XHRcdCsgKDM2ICogTWF0aC5yb3VuZChyZWQgLyAyNTUgKiA1KSlcblx0XHRcdFx0XHQrICg2ICogTWF0aC5yb3VuZChncmVlbiAvIDI1NSAqIDUpKVxuXHRcdFx0XHRcdCsgTWF0aC5yb3VuZChibHVlIC8gMjU1ICogNSk7XG5cdFx0XHR9LFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSxcblx0XHRoZXhUb1JnYjoge1xuXHRcdFx0dmFsdWUoaGV4KSB7XG5cdFx0XHRcdGNvbnN0IG1hdGNoZXMgPSAvW2EtZlxcZF17Nn18W2EtZlxcZF17M30vaS5leGVjKGhleC50b1N0cmluZygxNikpO1xuXHRcdFx0XHRpZiAoIW1hdGNoZXMpIHtcblx0XHRcdFx0XHRyZXR1cm4gWzAsIDAsIDBdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IFtjb2xvclN0cmluZ10gPSBtYXRjaGVzO1xuXG5cdFx0XHRcdGlmIChjb2xvclN0cmluZy5sZW5ndGggPT09IDMpIHtcblx0XHRcdFx0XHRjb2xvclN0cmluZyA9IFsuLi5jb2xvclN0cmluZ10ubWFwKGNoYXJhY3RlciA9PiBjaGFyYWN0ZXIgKyBjaGFyYWN0ZXIpLmpvaW4oJycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaW50ZWdlciA9IE51bWJlci5wYXJzZUludChjb2xvclN0cmluZywgMTYpO1xuXG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8tYml0d2lzZSAqL1xuXHRcdFx0XHRcdChpbnRlZ2VyID4+IDE2KSAmIDB4RkYsXG5cdFx0XHRcdFx0KGludGVnZXIgPj4gOCkgJiAweEZGLFxuXHRcdFx0XHRcdGludGVnZXIgJiAweEZGLFxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tYml0d2lzZSAqL1xuXHRcdFx0XHRdO1xuXHRcdFx0fSxcblx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdH0sXG5cdFx0aGV4VG9BbnNpMjU2OiB7XG5cdFx0XHR2YWx1ZTogaGV4ID0+IHN0eWxlcy5yZ2JUb0Fuc2kyNTYoLi4uc3R5bGVzLmhleFRvUmdiKGhleCkpLFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSxcblx0XHRhbnNpMjU2VG9BbnNpOiB7XG5cdFx0XHR2YWx1ZShjb2RlKSB7XG5cdFx0XHRcdGlmIChjb2RlIDwgOCkge1xuXHRcdFx0XHRcdHJldHVybiAzMCArIGNvZGU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY29kZSA8IDE2KSB7XG5cdFx0XHRcdFx0cmV0dXJuIDkwICsgKGNvZGUgLSA4KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCByZWQ7XG5cdFx0XHRcdGxldCBncmVlbjtcblx0XHRcdFx0bGV0IGJsdWU7XG5cblx0XHRcdFx0aWYgKGNvZGUgPj0gMjMyKSB7XG5cdFx0XHRcdFx0cmVkID0gKCgoY29kZSAtIDIzMikgKiAxMCkgKyA4KSAvIDI1NTtcblx0XHRcdFx0XHRncmVlbiA9IHJlZDtcblx0XHRcdFx0XHRibHVlID0gcmVkO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvZGUgLT0gMTY7XG5cblx0XHRcdFx0XHRjb25zdCByZW1haW5kZXIgPSBjb2RlICUgMzY7XG5cblx0XHRcdFx0XHRyZWQgPSBNYXRoLmZsb29yKGNvZGUgLyAzNikgLyA1O1xuXHRcdFx0XHRcdGdyZWVuID0gTWF0aC5mbG9vcihyZW1haW5kZXIgLyA2KSAvIDU7XG5cdFx0XHRcdFx0Ymx1ZSA9IChyZW1haW5kZXIgJSA2KSAvIDU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IE1hdGgubWF4KHJlZCwgZ3JlZW4sIGJsdWUpICogMjtcblxuXHRcdFx0XHRpZiAodmFsdWUgPT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gMzA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZVxuXHRcdFx0XHRsZXQgcmVzdWx0ID0gMzAgKyAoKE1hdGgucm91bmQoYmx1ZSkgPDwgMikgfCAoTWF0aC5yb3VuZChncmVlbikgPDwgMSkgfCBNYXRoLnJvdW5kKHJlZCkpO1xuXG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gMikge1xuXHRcdFx0XHRcdHJlc3VsdCArPSA2MDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHR9LFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSxcblx0XHRyZ2JUb0Fuc2k6IHtcblx0XHRcdHZhbHVlOiAocmVkLCBncmVlbiwgYmx1ZSkgPT4gc3R5bGVzLmFuc2kyNTZUb0Fuc2koc3R5bGVzLnJnYlRvQW5zaTI1NihyZWQsIGdyZWVuLCBibHVlKSksXG5cdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR9LFxuXHRcdGhleFRvQW5zaToge1xuXHRcdFx0dmFsdWU6IGhleCA9PiBzdHlsZXMuYW5zaTI1NlRvQW5zaShzdHlsZXMuaGV4VG9BbnNpMjU2KGhleCkpLFxuXHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0fSxcblx0fSk7XG5cblx0cmV0dXJuIHN0eWxlcztcbn1cblxuY29uc3QgYW5zaVN0eWxlcyA9IGFzc2VtYmxlU3R5bGVzKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGFuc2lTdHlsZXM7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuY29uc3QgbGV2ZWwgPSAoKCkgPT4ge1xuXHRpZiAoISgnbmF2aWdhdG9yJyBpbiBnbG9iYWxUaGlzKSkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cblx0aWYgKGdsb2JhbFRoaXMubmF2aWdhdG9yLnVzZXJBZ2VudERhdGEpIHtcblx0XHRjb25zdCBicmFuZCA9IG5hdmlnYXRvci51c2VyQWdlbnREYXRhLmJyYW5kcy5maW5kKCh7YnJhbmR9KSA9PiBicmFuZCA9PT0gJ0Nocm9taXVtJyk7XG5cdFx0aWYgKGJyYW5kICYmIGJyYW5kLnZlcnNpb24gPiA5Mykge1xuXHRcdFx0cmV0dXJuIDM7XG5cdFx0fVxuXHR9XG5cblx0aWYgKC9cXGIoQ2hyb21lfENocm9taXVtKVxcLy8udGVzdChnbG9iYWxUaGlzLm5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG5cdFx0cmV0dXJuIDE7XG5cdH1cblxuXHRyZXR1cm4gMDtcbn0pKCk7XG5cbmNvbnN0IGNvbG9yU3VwcG9ydCA9IGxldmVsICE9PSAwICYmIHtcblx0bGV2ZWwsXG5cdGhhc0Jhc2ljOiB0cnVlLFxuXHRoYXMyNTY6IGxldmVsID49IDIsXG5cdGhhczE2bTogbGV2ZWwgPj0gMyxcbn07XG5cbmNvbnN0IHN1cHBvcnRzQ29sb3IgPSB7XG5cdHN0ZG91dDogY29sb3JTdXBwb3J0LFxuXHRzdGRlcnI6IGNvbG9yU3VwcG9ydCxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHN1cHBvcnRzQ29sb3I7XG4iLCIvLyBUT0RPOiBXaGVuIHRhcmdldGluZyBOb2RlLmpzIDE2LCB1c2UgYFN0cmluZy5wcm90b3R5cGUucmVwbGFjZUFsbGAuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nUmVwbGFjZUFsbChzdHJpbmcsIHN1YnN0cmluZywgcmVwbGFjZXIpIHtcblx0bGV0IGluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc3Vic3RyaW5nKTtcblx0aWYgKGluZGV4ID09PSAtMSkge1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH1cblxuXHRjb25zdCBzdWJzdHJpbmdMZW5ndGggPSBzdWJzdHJpbmcubGVuZ3RoO1xuXHRsZXQgZW5kSW5kZXggPSAwO1xuXHRsZXQgcmV0dXJuVmFsdWUgPSAnJztcblx0ZG8ge1xuXHRcdHJldHVyblZhbHVlICs9IHN0cmluZy5zbGljZShlbmRJbmRleCwgaW5kZXgpICsgc3Vic3RyaW5nICsgcmVwbGFjZXI7XG5cdFx0ZW5kSW5kZXggPSBpbmRleCArIHN1YnN0cmluZ0xlbmd0aDtcblx0XHRpbmRleCA9IHN0cmluZy5pbmRleE9mKHN1YnN0cmluZywgZW5kSW5kZXgpO1xuXHR9IHdoaWxlIChpbmRleCAhPT0gLTEpO1xuXG5cdHJldHVyblZhbHVlICs9IHN0cmluZy5zbGljZShlbmRJbmRleCk7XG5cdHJldHVybiByZXR1cm5WYWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ0VuY2FzZUNSTEZXaXRoRmlyc3RJbmRleChzdHJpbmcsIHByZWZpeCwgcG9zdGZpeCwgaW5kZXgpIHtcblx0bGV0IGVuZEluZGV4ID0gMDtcblx0bGV0IHJldHVyblZhbHVlID0gJyc7XG5cdGRvIHtcblx0XHRjb25zdCBnb3RDUiA9IHN0cmluZ1tpbmRleCAtIDFdID09PSAnXFxyJztcblx0XHRyZXR1cm5WYWx1ZSArPSBzdHJpbmcuc2xpY2UoZW5kSW5kZXgsIChnb3RDUiA/IGluZGV4IC0gMSA6IGluZGV4KSkgKyBwcmVmaXggKyAoZ290Q1IgPyAnXFxyXFxuJyA6ICdcXG4nKSArIHBvc3RmaXg7XG5cdFx0ZW5kSW5kZXggPSBpbmRleCArIDE7XG5cdFx0aW5kZXggPSBzdHJpbmcuaW5kZXhPZignXFxuJywgZW5kSW5kZXgpO1xuXHR9IHdoaWxlIChpbmRleCAhPT0gLTEpO1xuXG5cdHJldHVyblZhbHVlICs9IHN0cmluZy5zbGljZShlbmRJbmRleCk7XG5cdHJldHVybiByZXR1cm5WYWx1ZTtcbn1cbiIsImltcG9ydCBhbnNpU3R5bGVzIGZyb20gJyNhbnNpLXN0eWxlcyc7XG5pbXBvcnQgc3VwcG9ydHNDb2xvciBmcm9tICcjc3VwcG9ydHMtY29sb3InO1xuaW1wb3J0IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvb3JkZXJcblx0c3RyaW5nUmVwbGFjZUFsbCxcblx0c3RyaW5nRW5jYXNlQ1JMRldpdGhGaXJzdEluZGV4LFxufSBmcm9tICcuL3V0aWxpdGllcy5qcyc7XG5cbmNvbnN0IHtzdGRvdXQ6IHN0ZG91dENvbG9yLCBzdGRlcnI6IHN0ZGVyckNvbG9yfSA9IHN1cHBvcnRzQ29sb3I7XG5cbmNvbnN0IEdFTkVSQVRPUiA9IFN5bWJvbCgnR0VORVJBVE9SJyk7XG5jb25zdCBTVFlMRVIgPSBTeW1ib2woJ1NUWUxFUicpO1xuY29uc3QgSVNfRU1QVFkgPSBTeW1ib2woJ0lTX0VNUFRZJyk7XG5cbi8vIGBzdXBwb3J0c0NvbG9yLmxldmVsYCDihpIgYGFuc2lTdHlsZXMuY29sb3JbbmFtZV1gIG1hcHBpbmdcbmNvbnN0IGxldmVsTWFwcGluZyA9IFtcblx0J2Fuc2knLFxuXHQnYW5zaScsXG5cdCdhbnNpMjU2Jyxcblx0J2Fuc2kxNm0nLFxuXTtcblxuY29uc3Qgc3R5bGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuY29uc3QgYXBwbHlPcHRpb25zID0gKG9iamVjdCwgb3B0aW9ucyA9IHt9KSA9PiB7XG5cdGlmIChvcHRpb25zLmxldmVsICYmICEoTnVtYmVyLmlzSW50ZWdlcihvcHRpb25zLmxldmVsKSAmJiBvcHRpb25zLmxldmVsID49IDAgJiYgb3B0aW9ucy5sZXZlbCA8PSAzKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcignVGhlIGBsZXZlbGAgb3B0aW9uIHNob3VsZCBiZSBhbiBpbnRlZ2VyIGZyb20gMCB0byAzJyk7XG5cdH1cblxuXHQvLyBEZXRlY3QgbGV2ZWwgaWYgbm90IHNldCBtYW51YWxseVxuXHRjb25zdCBjb2xvckxldmVsID0gc3Rkb3V0Q29sb3IgPyBzdGRvdXRDb2xvci5sZXZlbCA6IDA7XG5cdG9iamVjdC5sZXZlbCA9IG9wdGlvbnMubGV2ZWwgPT09IHVuZGVmaW5lZCA/IGNvbG9yTGV2ZWwgOiBvcHRpb25zLmxldmVsO1xufTtcblxuZXhwb3J0IGNsYXNzIENoYWxrIHtcblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdHJ1Y3Rvci1yZXR1cm5cblx0XHRyZXR1cm4gY2hhbGtGYWN0b3J5KG9wdGlvbnMpO1xuXHR9XG59XG5cbmNvbnN0IGNoYWxrRmFjdG9yeSA9IG9wdGlvbnMgPT4ge1xuXHRjb25zdCBjaGFsayA9ICguLi5zdHJpbmdzKSA9PiBzdHJpbmdzLmpvaW4oJyAnKTtcblx0YXBwbHlPcHRpb25zKGNoYWxrLCBvcHRpb25zKTtcblxuXHRPYmplY3Quc2V0UHJvdG90eXBlT2YoY2hhbGssIGNyZWF0ZUNoYWxrLnByb3RvdHlwZSk7XG5cblx0cmV0dXJuIGNoYWxrO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlQ2hhbGsob3B0aW9ucykge1xuXHRyZXR1cm4gY2hhbGtGYWN0b3J5KG9wdGlvbnMpO1xufVxuXG5PYmplY3Quc2V0UHJvdG90eXBlT2YoY3JlYXRlQ2hhbGsucHJvdG90eXBlLCBGdW5jdGlvbi5wcm90b3R5cGUpO1xuXG5mb3IgKGNvbnN0IFtzdHlsZU5hbWUsIHN0eWxlXSBvZiBPYmplY3QuZW50cmllcyhhbnNpU3R5bGVzKSkge1xuXHRzdHlsZXNbc3R5bGVOYW1lXSA9IHtcblx0XHRnZXQoKSB7XG5cdFx0XHRjb25zdCBidWlsZGVyID0gY3JlYXRlQnVpbGRlcih0aGlzLCBjcmVhdGVTdHlsZXIoc3R5bGUub3Blbiwgc3R5bGUuY2xvc2UsIHRoaXNbU1RZTEVSXSksIHRoaXNbSVNfRU1QVFldKTtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBzdHlsZU5hbWUsIHt2YWx1ZTogYnVpbGRlcn0pO1xuXHRcdFx0cmV0dXJuIGJ1aWxkZXI7XG5cdFx0fSxcblx0fTtcbn1cblxuc3R5bGVzLnZpc2libGUgPSB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBidWlsZGVyID0gY3JlYXRlQnVpbGRlcih0aGlzLCB0aGlzW1NUWUxFUl0sIHRydWUpO1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAndmlzaWJsZScsIHt2YWx1ZTogYnVpbGRlcn0pO1xuXHRcdHJldHVybiBidWlsZGVyO1xuXHR9LFxufTtcblxuY29uc3QgZ2V0TW9kZWxBbnNpID0gKG1vZGVsLCBsZXZlbCwgdHlwZSwgLi4uYXJndW1lbnRzXykgPT4ge1xuXHRpZiAobW9kZWwgPT09ICdyZ2InKSB7XG5cdFx0aWYgKGxldmVsID09PSAnYW5zaTE2bScpIHtcblx0XHRcdHJldHVybiBhbnNpU3R5bGVzW3R5cGVdLmFuc2kxNm0oLi4uYXJndW1lbnRzXyk7XG5cdFx0fVxuXG5cdFx0aWYgKGxldmVsID09PSAnYW5zaTI1NicpIHtcblx0XHRcdHJldHVybiBhbnNpU3R5bGVzW3R5cGVdLmFuc2kyNTYoYW5zaVN0eWxlcy5yZ2JUb0Fuc2kyNTYoLi4uYXJndW1lbnRzXykpO1xuXHRcdH1cblxuXHRcdHJldHVybiBhbnNpU3R5bGVzW3R5cGVdLmFuc2koYW5zaVN0eWxlcy5yZ2JUb0Fuc2koLi4uYXJndW1lbnRzXykpO1xuXHR9XG5cblx0aWYgKG1vZGVsID09PSAnaGV4Jykge1xuXHRcdHJldHVybiBnZXRNb2RlbEFuc2koJ3JnYicsIGxldmVsLCB0eXBlLCAuLi5hbnNpU3R5bGVzLmhleFRvUmdiKC4uLmFyZ3VtZW50c18pKTtcblx0fVxuXG5cdHJldHVybiBhbnNpU3R5bGVzW3R5cGVdW21vZGVsXSguLi5hcmd1bWVudHNfKTtcbn07XG5cbmNvbnN0IHVzZWRNb2RlbHMgPSBbJ3JnYicsICdoZXgnLCAnYW5zaTI1NiddO1xuXG5mb3IgKGNvbnN0IG1vZGVsIG9mIHVzZWRNb2RlbHMpIHtcblx0c3R5bGVzW21vZGVsXSA9IHtcblx0XHRnZXQoKSB7XG5cdFx0XHRjb25zdCB7bGV2ZWx9ID0gdGhpcztcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoLi4uYXJndW1lbnRzXykge1xuXHRcdFx0XHRjb25zdCBzdHlsZXIgPSBjcmVhdGVTdHlsZXIoZ2V0TW9kZWxBbnNpKG1vZGVsLCBsZXZlbE1hcHBpbmdbbGV2ZWxdLCAnY29sb3InLCAuLi5hcmd1bWVudHNfKSwgYW5zaVN0eWxlcy5jb2xvci5jbG9zZSwgdGhpc1tTVFlMRVJdKTtcblx0XHRcdFx0cmV0dXJuIGNyZWF0ZUJ1aWxkZXIodGhpcywgc3R5bGVyLCB0aGlzW0lTX0VNUFRZXSk7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdH07XG5cblx0Y29uc3QgYmdNb2RlbCA9ICdiZycgKyBtb2RlbFswXS50b1VwcGVyQ2FzZSgpICsgbW9kZWwuc2xpY2UoMSk7XG5cdHN0eWxlc1tiZ01vZGVsXSA9IHtcblx0XHRnZXQoKSB7XG5cdFx0XHRjb25zdCB7bGV2ZWx9ID0gdGhpcztcblx0XHRcdHJldHVybiBmdW5jdGlvbiAoLi4uYXJndW1lbnRzXykge1xuXHRcdFx0XHRjb25zdCBzdHlsZXIgPSBjcmVhdGVTdHlsZXIoZ2V0TW9kZWxBbnNpKG1vZGVsLCBsZXZlbE1hcHBpbmdbbGV2ZWxdLCAnYmdDb2xvcicsIC4uLmFyZ3VtZW50c18pLCBhbnNpU3R5bGVzLmJnQ29sb3IuY2xvc2UsIHRoaXNbU1RZTEVSXSk7XG5cdFx0XHRcdHJldHVybiBjcmVhdGVCdWlsZGVyKHRoaXMsIHN0eWxlciwgdGhpc1tJU19FTVBUWV0pO1xuXHRcdFx0fTtcblx0XHR9LFxuXHR9O1xufVxuXG5jb25zdCBwcm90byA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCgpID0+IHt9LCB7XG5cdC4uLnN0eWxlcyxcblx0bGV2ZWw6IHtcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdGdldCgpIHtcblx0XHRcdHJldHVybiB0aGlzW0dFTkVSQVRPUl0ubGV2ZWw7XG5cdFx0fSxcblx0XHRzZXQobGV2ZWwpIHtcblx0XHRcdHRoaXNbR0VORVJBVE9SXS5sZXZlbCA9IGxldmVsO1xuXHRcdH0sXG5cdH0sXG59KTtcblxuY29uc3QgY3JlYXRlU3R5bGVyID0gKG9wZW4sIGNsb3NlLCBwYXJlbnQpID0+IHtcblx0bGV0IG9wZW5BbGw7XG5cdGxldCBjbG9zZUFsbDtcblx0aWYgKHBhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0b3BlbkFsbCA9IG9wZW47XG5cdFx0Y2xvc2VBbGwgPSBjbG9zZTtcblx0fSBlbHNlIHtcblx0XHRvcGVuQWxsID0gcGFyZW50Lm9wZW5BbGwgKyBvcGVuO1xuXHRcdGNsb3NlQWxsID0gY2xvc2UgKyBwYXJlbnQuY2xvc2VBbGw7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdG9wZW4sXG5cdFx0Y2xvc2UsXG5cdFx0b3BlbkFsbCxcblx0XHRjbG9zZUFsbCxcblx0XHRwYXJlbnQsXG5cdH07XG59O1xuXG5jb25zdCBjcmVhdGVCdWlsZGVyID0gKHNlbGYsIF9zdHlsZXIsIF9pc0VtcHR5KSA9PiB7XG5cdC8vIFNpbmdsZSBhcmd1bWVudCBpcyBob3QgcGF0aCwgaW1wbGljaXQgY29lcmNpb24gaXMgZmFzdGVyIHRoYW4gYW55dGhpbmdcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWltcGxpY2l0LWNvZXJjaW9uXG5cdGNvbnN0IGJ1aWxkZXIgPSAoLi4uYXJndW1lbnRzXykgPT4gYXBwbHlTdHlsZShidWlsZGVyLCAoYXJndW1lbnRzXy5sZW5ndGggPT09IDEpID8gKCcnICsgYXJndW1lbnRzX1swXSkgOiBhcmd1bWVudHNfLmpvaW4oJyAnKSk7XG5cblx0Ly8gV2UgYWx0ZXIgdGhlIHByb3RvdHlwZSBiZWNhdXNlIHdlIG11c3QgcmV0dXJuIGEgZnVuY3Rpb24sIGJ1dCB0aGVyZSBpc1xuXHQvLyBubyB3YXkgdG8gY3JlYXRlIGEgZnVuY3Rpb24gd2l0aCBhIGRpZmZlcmVudCBwcm90b3R5cGVcblx0T2JqZWN0LnNldFByb3RvdHlwZU9mKGJ1aWxkZXIsIHByb3RvKTtcblxuXHRidWlsZGVyW0dFTkVSQVRPUl0gPSBzZWxmO1xuXHRidWlsZGVyW1NUWUxFUl0gPSBfc3R5bGVyO1xuXHRidWlsZGVyW0lTX0VNUFRZXSA9IF9pc0VtcHR5O1xuXG5cdHJldHVybiBidWlsZGVyO1xufTtcblxuY29uc3QgYXBwbHlTdHlsZSA9IChzZWxmLCBzdHJpbmcpID0+IHtcblx0aWYgKHNlbGYubGV2ZWwgPD0gMCB8fCAhc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHNlbGZbSVNfRU1QVFldID8gJycgOiBzdHJpbmc7XG5cdH1cblxuXHRsZXQgc3R5bGVyID0gc2VsZltTVFlMRVJdO1xuXG5cdGlmIChzdHlsZXIgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH1cblxuXHRjb25zdCB7b3BlbkFsbCwgY2xvc2VBbGx9ID0gc3R5bGVyO1xuXHRpZiAoc3RyaW5nLmluY2x1ZGVzKCdcXHUwMDFCJykpIHtcblx0XHR3aGlsZSAoc3R5bGVyICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIFJlcGxhY2UgYW55IGluc3RhbmNlcyBhbHJlYWR5IHByZXNlbnQgd2l0aCBhIHJlLW9wZW5pbmcgY29kZVxuXHRcdFx0Ly8gb3RoZXJ3aXNlIG9ubHkgdGhlIHBhcnQgb2YgdGhlIHN0cmluZyB1bnRpbCBzYWlkIGNsb3NpbmcgY29kZVxuXHRcdFx0Ly8gd2lsbCBiZSBjb2xvcmVkLCBhbmQgdGhlIHJlc3Qgd2lsbCBzaW1wbHkgYmUgJ3BsYWluJy5cblx0XHRcdHN0cmluZyA9IHN0cmluZ1JlcGxhY2VBbGwoc3RyaW5nLCBzdHlsZXIuY2xvc2UsIHN0eWxlci5vcGVuKTtcblxuXHRcdFx0c3R5bGVyID0gc3R5bGVyLnBhcmVudDtcblx0XHR9XG5cdH1cblxuXHQvLyBXZSBjYW4gbW92ZSBib3RoIG5leHQgYWN0aW9ucyBvdXQgb2YgbG9vcCwgYmVjYXVzZSByZW1haW5pbmcgYWN0aW9ucyBpbiBsb29wIHdvbid0IGhhdmVcblx0Ly8gYW55L3Zpc2libGUgZWZmZWN0IG9uIHBhcnRzIHdlIGFkZCBoZXJlLiBDbG9zZSB0aGUgc3R5bGluZyBiZWZvcmUgYSBsaW5lYnJlYWsgYW5kIHJlb3BlblxuXHQvLyBhZnRlciBuZXh0IGxpbmUgdG8gZml4IGEgYmxlZWQgaXNzdWUgb24gbWFjT1M6IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFsay9jaGFsay9wdWxsLzkyXG5cdGNvbnN0IGxmSW5kZXggPSBzdHJpbmcuaW5kZXhPZignXFxuJyk7XG5cdGlmIChsZkluZGV4ICE9PSAtMSkge1xuXHRcdHN0cmluZyA9IHN0cmluZ0VuY2FzZUNSTEZXaXRoRmlyc3RJbmRleChzdHJpbmcsIGNsb3NlQWxsLCBvcGVuQWxsLCBsZkluZGV4KTtcblx0fVxuXG5cdHJldHVybiBvcGVuQWxsICsgc3RyaW5nICsgY2xvc2VBbGw7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhjcmVhdGVDaGFsay5wcm90b3R5cGUsIHN0eWxlcyk7XG5cbmNvbnN0IGNoYWxrID0gY3JlYXRlQ2hhbGsoKTtcbmV4cG9ydCBjb25zdCBjaGFsa1N0ZGVyciA9IGNyZWF0ZUNoYWxrKHtsZXZlbDogc3RkZXJyQ29sb3IgPyBzdGRlcnJDb2xvci5sZXZlbCA6IDB9KTtcblxuZXhwb3J0IHtcblx0bW9kaWZpZXJOYW1lcyxcblx0Zm9yZWdyb3VuZENvbG9yTmFtZXMsXG5cdGJhY2tncm91bmRDb2xvck5hbWVzLFxuXHRjb2xvck5hbWVzLFxuXG5cdC8vIFRPRE86IFJlbW92ZSB0aGVzZSBhbGlhc2VzIGluIHRoZSBuZXh0IG1ham9yIHZlcnNpb25cblx0bW9kaWZpZXJOYW1lcyBhcyBtb2RpZmllcnMsXG5cdGZvcmVncm91bmRDb2xvck5hbWVzIGFzIGZvcmVncm91bmRDb2xvcnMsXG5cdGJhY2tncm91bmRDb2xvck5hbWVzIGFzIGJhY2tncm91bmRDb2xvcnMsXG5cdGNvbG9yTmFtZXMgYXMgY29sb3JzLFxufSBmcm9tICcuL3ZlbmRvci9hbnNpLXN0eWxlcy9pbmRleC5qcyc7XG5cbmV4cG9ydCB7XG5cdHN0ZG91dENvbG9yIGFzIHN1cHBvcnRzQ29sb3IsXG5cdHN0ZGVyckNvbG9yIGFzIHN1cHBvcnRzQ29sb3JTdGRlcnIsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjaGFsaztcbiIsIi8qKlxuICogTExNIENsaWVudCAtIOaUr+aMgeinhuiniei+k+WFpeeahCBPcGVuQUkg5YW85a655a6i5oi356uvXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBUb29sIH0gZnJvbSAnLi90b29scydcblxuZXhwb3J0IGludGVyZmFjZSBMTE1Db25maWcge1xuXHRhcGlLZXk6IHN0cmluZ1xuXHRiYXNlVVJMPzogc3RyaW5nXG5cdG1vZGVsOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlIHtcblx0cm9sZTogJ3N5c3RlbScgfCAndXNlcicgfCAnYXNzaXN0YW50JyB8ICd0b29sJ1xuXHRjb250ZW50OiBzdHJpbmcgfCBNZXNzYWdlQ29udGVudFtdXG5cdHRvb2xfY2FsbF9pZD86IHN0cmluZ1xuXHRuYW1lPzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZUNvbnRlbnQge1xuXHR0eXBlOiAndGV4dCcgfCAnaW1hZ2VfdXJsJ1xuXHR0ZXh0Pzogc3RyaW5nXG5cdGltYWdlX3VybD86IHtcblx0XHR1cmw6IHN0cmluZ1xuXHRcdGRldGFpbD86ICdsb3cnIHwgJ2hpZ2gnIHwgJ2F1dG8nXG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBUb29sQ2FsbCB7XG5cdGlkOiBzdHJpbmdcblx0dHlwZTogJ2Z1bmN0aW9uJ1xuXHRmdW5jdGlvbjoge1xuXHRcdG5hbWU6IHN0cmluZ1xuXHRcdGFyZ3VtZW50czogc3RyaW5nXG5cdH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBMTE1SZXNwb25zZSB7XG5cdG1lc3NhZ2U6IHtcblx0XHRyb2xlOiAnYXNzaXN0YW50J1xuXHRcdGNvbnRlbnQ6IHN0cmluZyB8IG51bGxcblx0XHR0b29sX2NhbGxzPzogVG9vbENhbGxbXVxuXHR9XG5cdHVzYWdlPzoge1xuXHRcdHByb21wdF90b2tlbnM6IG51bWJlclxuXHRcdGNvbXBsZXRpb25fdG9rZW5zOiBudW1iZXJcblx0XHR0b3RhbF90b2tlbnM6IG51bWJlclxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBMTE1DbGllbnQge1xuXHRwcml2YXRlIGNvbmZpZzogTExNQ29uZmlnXG5cblx0Y29uc3RydWN0b3IoY29uZmlnOiBMTE1Db25maWcpIHtcblx0XHR0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuXHR9XG5cblx0LyoqXG5cdCAqIOiwg+eUqCBMTE0gQVBJXG5cdCAqL1xuXHRhc3luYyBjaGF0KFxuXHRcdG1lc3NhZ2VzOiBNZXNzYWdlW10sXG5cdFx0dG9vbHM/OiBUb29sW10sXG5cdFx0dG9vbENob2ljZT86ICdhdXRvJyB8ICdyZXF1aXJlZCcgfCAnbm9uZScsXG5cdCk6IFByb21pc2U8TExNUmVzcG9uc2U+IHtcblx0XHRjb25zdCBiYXNlVVJMID0gdGhpcy5jb25maWcuYmFzZVVSTCB8fCAnaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSdcblx0XHRjb25zdCB1cmwgPSBgJHtiYXNlVVJMfS9jaGF0L2NvbXBsZXRpb25zYFxuXG5cdFx0Y29uc3QgcmVxdWVzdEJvZHk6IGFueSA9IHtcblx0XHRcdG1vZGVsOiB0aGlzLmNvbmZpZy5tb2RlbCxcblx0XHRcdG1lc3NhZ2VzOiBtZXNzYWdlcyxcblx0XHRcdHRlbXBlcmF0dXJlOiAwLjcsXG5cdFx0XHRtYXhfdG9rZW5zOiA0MDk2LFxuXHRcdH1cblxuXHRcdC8vIEFkZCB0b29scyBpZiBwcm92aWRlZFxuXHRcdGlmICh0b29scyAmJiB0b29scy5sZW5ndGggPiAwKSB7XG5cdFx0XHRyZXF1ZXN0Qm9keS50b29scyA9IHRvb2xzLm1hcCgodG9vbCkgPT4gKHtcblx0XHRcdFx0dHlwZTogJ2Z1bmN0aW9uJyxcblx0XHRcdFx0ZnVuY3Rpb246IHtcblx0XHRcdFx0XHRuYW1lOiB0b29sLm5hbWUsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb24sXG5cdFx0XHRcdFx0cGFyYW1ldGVyczogdG9vbC5wYXJhbWV0ZXJzLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSkpXG5cblx0XHRcdGlmICh0b29sQ2hvaWNlKSB7XG5cdFx0XHRcdHJlcXVlc3RCb2R5LnRvb2xfY2hvaWNlID0gdG9vbENob2ljZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdFx0QXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMuY29uZmlnLmFwaUtleX1gLFxuXHRcdFx0fSxcblx0XHRcdGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KSxcblx0XHR9KVxuXG5cdFx0aWYgKCFyZXNwb25zZS5vaykge1xuXHRcdFx0Y29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYExMTSBBUEkgZXJyb3IgKCR7cmVzcG9uc2Uuc3RhdHVzfSk6ICR7ZXJyb3JUZXh0fWApXG5cdFx0fVxuXG5cdFx0Y29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0cm9sZTogJ2Fzc2lzdGFudCcsXG5cdFx0XHRcdGNvbnRlbnQ6IGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLmNvbnRlbnQsXG5cdFx0XHRcdHRvb2xfY2FsbHM6IGRhdGEuY2hvaWNlc1swXS5tZXNzYWdlLnRvb2xfY2FsbHMsXG5cdFx0XHR9LFxuXHRcdFx0dXNhZ2U6IGRhdGEudXNhZ2UsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIOWIm+W7uuWMheWQq+aIquWbvueahOeUqOaIt+a2iOaBr1xuXHQgKi9cblx0c3RhdGljIGNyZWF0ZVZpc2lvbk1lc3NhZ2UoXG5cdFx0dGV4dDogc3RyaW5nLFxuXHRcdHNjcmVlbnNob3REYXRhVVJMOiBzdHJpbmcsXG5cdCk6IE1lc3NhZ2Uge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyb2xlOiAndXNlcicsXG5cdFx0XHRjb250ZW50OiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRcdFx0dGV4dDogdGV4dCxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6ICdpbWFnZV91cmwnLFxuXHRcdFx0XHRcdGltYWdlX3VybDoge1xuXHRcdFx0XHRcdFx0dXJsOiBzY3JlZW5zaG90RGF0YVVSTCxcblx0XHRcdFx0XHRcdGRldGFpbDogJ2hpZ2gnLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiDliJvlu7rnuq/mlofmnKzmtojmga9cblx0ICovXG5cdHN0YXRpYyBjcmVhdGVUZXh0TWVzc2FnZShcblx0XHRyb2xlOiAnc3lzdGVtJyB8ICd1c2VyJyB8ICdhc3Npc3RhbnQnLFxuXHRcdHRleHQ6IHN0cmluZyxcblx0KTogTWVzc2FnZSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJvbGUsXG5cdFx0XHRjb250ZW50OiB0ZXh0LFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiDliJvlu7rlt6XlhbfosIPnlKjnu5Pmnpzmtojmga9cblx0ICovXG5cdHN0YXRpYyBjcmVhdGVUb29sTWVzc2FnZShcblx0XHR0b29sQ2FsbElkOiBzdHJpbmcsXG5cdFx0dG9vbE5hbWU6IHN0cmluZyxcblx0XHRyZXN1bHQ6IHN0cmluZyxcblx0KTogTWVzc2FnZSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJvbGU6ICd0b29sJyxcblx0XHRcdGNvbnRlbnQ6IHJlc3VsdCxcblx0XHRcdHRvb2xfY2FsbF9pZDogdG9vbENhbGxJZCxcblx0XHRcdG5hbWU6IHRvb2xOYW1lLFxuXHRcdH1cblx0fVxufVxuIiwiLyoqXG4gKiBBZ2VudCBUb29scyAtIOa1j+iniOWZqOaOp+WItuW3peWFt+mbhlxuICpcbiAqIOS4jiBwYWdlLWFnZW50IOeahOWMuuWIq++8mlxuICogLSBwYWdlLWFnZW50IOWcqOmhtemdouWGhei/kOihjO+8jOaXoOazlei3qCB0YWIg5pON5L2cXG4gKiAtIOacrOWunueOsOWcqCBiYWNrZ3JvdW5kIOi/kOihjO+8jOWPr+S7peaOp+WItuaJgOaciSB0YWJzXG4gKiAtIOS9v+eUqOaIquWbvuS7o+abvyBET00g5riF5rSX77yM6K6pIExMTSDnm7TmjqVcIueci+WIsFwi6aG16Z2iXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBUb29sIHtcblx0bmFtZTogc3RyaW5nXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmdcblx0cGFyYW1ldGVyczoge1xuXHRcdHR5cGU6ICdvYmplY3QnXG5cdFx0cHJvcGVydGllczogUmVjb3JkPFxuXHRcdFx0c3RyaW5nLFxuXHRcdFx0e1xuXHRcdFx0XHR0eXBlOiBzdHJpbmdcblx0XHRcdFx0ZGVzY3JpcHRpb246IHN0cmluZ1xuXHRcdFx0XHRlbnVtPzogc3RyaW5nW11cblx0XHRcdH1cblx0XHQ+XG5cdFx0cmVxdWlyZWQ6IHN0cmluZ1tdXG5cdH1cbn1cblxuLyoqXG4gKiDmiZPlvIDmlrDmoIfnrb7pobVcbiAqL1xuZXhwb3J0IGNvbnN0IG9wZW5UYWJUb29sOiBUb29sID0ge1xuXHRuYW1lOiAnb3Blbl90YWInLFxuXHRkZXNjcmlwdGlvbjogJ09wZW4gYSBuZXcgdGFiIHdpdGggdGhlIHNwZWNpZmllZCBVUkwnLFxuXHRwYXJhbWV0ZXJzOiB7XG5cdFx0dHlwZTogJ29iamVjdCcsXG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0dXJsOiB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJ1RoZSBVUkwgdG8gb3Blbi4gTXVzdCBiZSBhIHZhbGlkIGh0dHAvaHR0cHMgVVJMLicsXG5cdFx0XHR9LFxuXHRcdFx0YWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246XG5cdFx0XHRcdFx0J1doZXRoZXIgdG8gbWFrZSB0aGUgbmV3IHRhYiBhY3RpdmUgKGZvY3VzZWQpLiBEZWZhdWx0IGlzIHRydWUuJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRyZXF1aXJlZDogWyd1cmwnXSxcblx0fSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wZW5UYWIoYXJnczoge1xuXHR1cmw6IHN0cmluZ1xuXHRhY3RpdmU/OiBib29sZWFuXG59KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0dHJ5IHtcblx0XHRjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5jcmVhdGUoe1xuXHRcdFx0dXJsOiBhcmdzLnVybCxcblx0XHRcdGFjdGl2ZTogYXJncy5hY3RpdmUgIT09IGZhbHNlLFxuXHRcdH0pXG5cdFx0cmV0dXJuIGDinIUgT3BlbmVkIG5ldyB0YWIgKElEOiAke3RhYi5pZH0pIHdpdGggVVJMOiAke2FyZ3MudXJsfWBcblx0fSBjYXRjaCAoZXJyb3I6IGFueSkge1xuXHRcdHJldHVybiBg4p2MIEZhaWxlZCB0byBvcGVuIHRhYjogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOWIh+aNouWIsOaMh+Wumuagh+etvumhtVxuICovXG5leHBvcnQgY29uc3QgYWN0aXZlVGFiVG9vbDogVG9vbCA9IHtcblx0bmFtZTogJ2FjdGl2ZV90YWInLFxuXHRkZXNjcmlwdGlvbjogJ1N3aXRjaCB0byAoYWN0aXZhdGUvZm9jdXMpIGEgc3BlY2lmaWMgdGFiIGJ5IElEJyxcblx0cGFyYW1ldGVyczoge1xuXHRcdHR5cGU6ICdvYmplY3QnLFxuXHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdHRhYklkOiB7XG5cdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJ1RoZSBJRCBvZiB0aGUgdGFiIHRvIGFjdGl2YXRlJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRyZXF1aXJlZDogWyd0YWJJZCddLFxuXHR9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWN0aXZlVGFiKGFyZ3M6IHsgdGFiSWQ6IG51bWJlciB9KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0dHJ5IHtcblx0XHRhd2FpdCBjaHJvbWUudGFicy51cGRhdGUoYXJncy50YWJJZCwgeyBhY3RpdmU6IHRydWUgfSlcblx0XHRjb25zdCB0YWIgPSBhd2FpdCBjaHJvbWUudGFicy5nZXQoYXJncy50YWJJZClcblx0XHRyZXR1cm4gYOKchSBBY3RpdmF0ZWQgdGFiIChJRDogJHthcmdzLnRhYklkfSk6ICR7dGFiLnRpdGxlfWBcblx0fSBjYXRjaCAoZXJyb3I6IGFueSkge1xuXHRcdHJldHVybiBg4p2MIEZhaWxlZCB0byBhY3RpdmF0ZSB0YWI6ICR7ZXJyb3IubWVzc2FnZX1gXG5cdH1cbn1cblxuLyoqXG4gKiDlhbPpl63moIfnrb7pobVcbiAqL1xuZXhwb3J0IGNvbnN0IGNsb3NlVGFiVG9vbDogVG9vbCA9IHtcblx0bmFtZTogJ2Nsb3NlX3RhYicsXG5cdGRlc2NyaXB0aW9uOiAnQ2xvc2UgYSBzcGVjaWZpYyB0YWIgYnkgSUQnLFxuXHRwYXJhbWV0ZXJzOiB7XG5cdFx0dHlwZTogJ29iamVjdCcsXG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0dGFiSWQ6IHtcblx0XHRcdFx0dHlwZTogJ251bWJlcicsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiAnVGhlIElEIG9mIHRoZSB0YWIgdG8gY2xvc2UnLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdHJlcXVpcmVkOiBbJ3RhYklkJ10sXG5cdH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbG9zZVRhYihhcmdzOiB7IHRhYklkOiBudW1iZXIgfSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdHRyeSB7XG5cdFx0YXdhaXQgY2hyb21lLnRhYnMucmVtb3ZlKGFyZ3MudGFiSWQpXG5cdFx0cmV0dXJuIGDinIUgQ2xvc2VkIHRhYiAoSUQ6ICR7YXJncy50YWJJZH0pYFxuXHR9IGNhdGNoIChlcnJvcjogYW55KSB7XG5cdFx0cmV0dXJuIGDinYwgRmFpbGVkIHRvIGNsb3NlIHRhYjogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOmHjeaWsOWKoOi9veagh+etvumhtVxuICovXG5leHBvcnQgY29uc3QgcmVsb2FkVGFiVG9vbDogVG9vbCA9IHtcblx0bmFtZTogJ3JlbG9hZF90YWInLFxuXHRkZXNjcmlwdGlvbjogJ1JlbG9hZCBhIHNwZWNpZmljIHRhYicsXG5cdHBhcmFtZXRlcnM6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHR0YWJJZDoge1xuXHRcdFx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246XG5cdFx0XHRcdFx0J1RoZSBJRCBvZiB0aGUgdGFiIHRvIHJlbG9hZC4gSWYgbm90IHByb3ZpZGVkLCByZWxvYWQgdGhlIGFjdGl2ZSB0YWIuJyxcblx0XHRcdH0sXG5cdFx0XHRieXBhc3NDYWNoZToge1xuXHRcdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOlxuXHRcdFx0XHRcdCdXaGV0aGVyIHRvIGJ5cGFzcyB0aGUgY2FjaGUgKGhhcmQgcmVsb2FkKS4gRGVmYXVsdCBpcyBmYWxzZS4nLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdHJlcXVpcmVkOiBbXSxcblx0fSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbG9hZFRhYihhcmdzOiB7XG5cdHRhYklkPzogbnVtYmVyXG5cdGJ5cGFzc0NhY2hlPzogYm9vbGVhblxufSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdHRyeSB7XG5cdFx0bGV0IHRhYklkID0gYXJncy50YWJJZFxuXHRcdGlmICghdGFiSWQpIHtcblx0XHRcdC8vIEdldCBhY3RpdmUgdGFiXG5cdFx0XHRjb25zdCBbYWN0aXZlVGFiXSA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHtcblx0XHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0XHRjdXJyZW50V2luZG93OiB0cnVlLFxuXHRcdFx0fSlcblx0XHRcdGlmICghYWN0aXZlVGFiPy5pZCkge1xuXHRcdFx0XHRyZXR1cm4gJ+KdjCBObyBhY3RpdmUgdGFiIGZvdW5kJ1xuXHRcdFx0fVxuXHRcdFx0dGFiSWQgPSBhY3RpdmVUYWIuaWRcblx0XHR9XG5cblx0XHRhd2FpdCBjaHJvbWUudGFicy5yZWxvYWQodGFiSWQsIHsgYnlwYXNzQ2FjaGU6IGFyZ3MuYnlwYXNzQ2FjaGUgfSlcblx0XHRyZXR1cm4gYOKchSBSZWxvYWRlZCB0YWIgKElEOiAke3RhYklkfSkke1xuXHRcdFx0YXJncy5ieXBhc3NDYWNoZSA/ICcgKGJ5cGFzc2VkIGNhY2hlKScgOiAnJ1xuXHRcdH1gXG5cdH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcblx0XHRyZXR1cm4gYOKdjCBGYWlsZWQgdG8gcmVsb2FkIHRhYjogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOa7muWKqOmhtemdolxuICovXG5leHBvcnQgY29uc3Qgc2Nyb2xsUGFnZVRvb2w6IFRvb2wgPSB7XG5cdG5hbWU6ICdzY3JvbGxfcGFnZScsXG5cdGRlc2NyaXB0aW9uOiAnU2Nyb2xsIHRoZSBwYWdlIGluIHRoZSBzcGVjaWZpZWQgZGlyZWN0aW9uJyxcblx0cGFyYW1ldGVyczoge1xuXHRcdHR5cGU6ICdvYmplY3QnLFxuXHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdHRhYklkOiB7XG5cdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjpcblx0XHRcdFx0XHQnVGhlIElEIG9mIHRoZSB0YWIgdG8gc2Nyb2xsLiBJZiBub3QgcHJvdmlkZWQsIHNjcm9sbCB0aGUgYWN0aXZlIHRhYi4nLFxuXHRcdFx0fSxcblx0XHRcdGRpcmVjdGlvbjoge1xuXHRcdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICdTY3JvbGwgZGlyZWN0aW9uJyxcblx0XHRcdFx0ZW51bTogWyd1cCcsICdkb3duJywgJ3RvcCcsICdib3R0b20nXSxcblx0XHRcdH0sXG5cdFx0XHRhbW91bnQ6IHtcblx0XHRcdFx0dHlwZTogJ251bWJlcicsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOlxuXHRcdFx0XHRcdCdTY3JvbGwgYW1vdW50IGluIHBpeGVscy4gT25seSB1c2VkIGZvciBcInVwXCIgYW5kIFwiZG93blwiLiBEZWZhdWx0IGlzIG9uZSB2aWV3cG9ydCBoZWlnaHQuJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRyZXF1aXJlZDogWydkaXJlY3Rpb24nXSxcblx0fSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjcm9sbFBhZ2UoYXJnczoge1xuXHR0YWJJZD86IG51bWJlclxuXHRkaXJlY3Rpb246ICd1cCcgfCAnZG93bicgfCAndG9wJyB8ICdib3R0b20nXG5cdGFtb3VudD86IG51bWJlclxufSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdHRyeSB7XG5cdFx0bGV0IHRhYklkID0gYXJncy50YWJJZFxuXHRcdGlmICghdGFiSWQpIHtcblx0XHRcdGNvbnN0IFthY3RpdmVUYWJdID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe1xuXHRcdFx0XHRhY3RpdmU6IHRydWUsXG5cdFx0XHRcdGN1cnJlbnRXaW5kb3c6IHRydWUsXG5cdFx0XHR9KVxuXHRcdFx0aWYgKCFhY3RpdmVUYWI/LmlkKSB7XG5cdFx0XHRcdHJldHVybiAn4p2MIE5vIGFjdGl2ZSB0YWIgZm91bmQnXG5cdFx0XHR9XG5cdFx0XHR0YWJJZCA9IGFjdGl2ZVRhYi5pZFxuXHRcdH1cblxuXHRcdC8vIEV4ZWN1dGUgc2Nyb2xsIGluIHRoZSB0YXJnZXQgdGFiXG5cdFx0Y29uc3QgY29kZSA9ICgoKSA9PiB7XG5cdFx0XHRzd2l0Y2ggKGFyZ3MuZGlyZWN0aW9uKSB7XG5cdFx0XHRcdGNhc2UgJ3VwJzpcblx0XHRcdFx0XHRyZXR1cm4gYHdpbmRvdy5zY3JvbGxCeSgwLCAtKCR7XG5cdFx0XHRcdFx0XHRhcmdzLmFtb3VudCB8fCAnd2luZG93LmlubmVySGVpZ2h0J1xuXHRcdFx0XHRcdH0pKWBcblx0XHRcdFx0Y2FzZSAnZG93bic6XG5cdFx0XHRcdFx0cmV0dXJuIGB3aW5kb3cuc2Nyb2xsQnkoMCwgJHtcblx0XHRcdFx0XHRcdGFyZ3MuYW1vdW50IHx8ICd3aW5kb3cuaW5uZXJIZWlnaHQnXG5cdFx0XHRcdFx0fSlgXG5cdFx0XHRcdGNhc2UgJ3RvcCc6XG5cdFx0XHRcdFx0cmV0dXJuIGB3aW5kb3cuc2Nyb2xsVG8oMCwgMClgXG5cdFx0XHRcdGNhc2UgJ2JvdHRvbSc6XG5cdFx0XHRcdFx0cmV0dXJuIGB3aW5kb3cuc2Nyb2xsVG8oMCwgZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpYFxuXHRcdFx0fVxuXHRcdH0pKClcblxuXHRcdGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG5cdFx0XHR0YXJnZXQ6IHsgdGFiSWQgfSxcblx0XHRcdGZ1bmM6IChzY3JvbGxDb2RlOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0ZXZhbChzY3JvbGxDb2RlKVxuXHRcdFx0fSxcblx0XHRcdGFyZ3M6IFtjb2RlXSxcblx0XHR9KVxuXG5cdFx0cmV0dXJuIGDinIUgU2Nyb2xsZWQgJHthcmdzLmRpcmVjdGlvbn0gaW4gdGFiIChJRDogJHt0YWJJZH0pYFxuXHR9IGNhdGNoIChlcnJvcjogYW55KSB7XG5cdFx0cmV0dXJuIGDinYwgRmFpbGVkIHRvIHNjcm9sbDogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOeCueWHu+WFg+e0oFxuICovXG5leHBvcnQgY29uc3QgY2xpY2tUb29sOiBUb29sID0ge1xuXHRuYW1lOiAnY2xpY2snLFxuXHRkZXNjcmlwdGlvbjogJ0NsaWNrIGFuIGVsZW1lbnQgb24gdGhlIHBhZ2UgdXNpbmcgQ1NTIHNlbGVjdG9yJyxcblx0cGFyYW1ldGVyczoge1xuXHRcdHR5cGU6ICdvYmplY3QnLFxuXHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdHRhYklkOiB7XG5cdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjpcblx0XHRcdFx0XHQnVGhlIElEIG9mIHRoZSB0YWIuIElmIG5vdCBwcm92aWRlZCwgdXNlIHRoZSBhY3RpdmUgdGFiLicsXG5cdFx0XHR9LFxuXHRcdFx0c2VsZWN0b3I6IHtcblx0XHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOlxuXHRcdFx0XHRcdCdDU1Mgc2VsZWN0b3Igb2YgdGhlIGVsZW1lbnQgdG8gY2xpY2suIEV4YW1wbGVzOiBcImJ1dHRvbi5zdWJtaXRcIiwgXCIjbG9naW5cIiwgXCJhW2hyZWY9XFwnL2Fib3V0XFwnXVwiJyxcblx0XHRcdH0sXG5cdFx0XHR3YWl0QWZ0ZXI6IHtcblx0XHRcdFx0dHlwZTogJ251bWJlcicsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOlxuXHRcdFx0XHRcdCdNaWxsaXNlY29uZHMgdG8gd2FpdCBhZnRlciBjbGlja2luZy4gRGVmYXVsdCBpcyA1MDBtcy4nLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdHJlcXVpcmVkOiBbJ3NlbGVjdG9yJ10sXG5cdH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGljayhhcmdzOiB7XG5cdHRhYklkPzogbnVtYmVyXG5cdHNlbGVjdG9yOiBzdHJpbmdcblx0d2FpdEFmdGVyPzogbnVtYmVyXG59KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0dHJ5IHtcblx0XHRsZXQgdGFiSWQgPSBhcmdzLnRhYklkXG5cdFx0aWYgKCF0YWJJZCkge1xuXHRcdFx0Y29uc3QgW2FjdGl2ZVRhYl0gPSBhd2FpdCBjaHJvbWUudGFicy5xdWVyeSh7XG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRcdFx0Y3VycmVudFdpbmRvdzogdHJ1ZSxcblx0XHRcdH0pXG5cdFx0XHRpZiAoIWFjdGl2ZVRhYj8uaWQpIHtcblx0XHRcdFx0cmV0dXJuICfinYwgTm8gYWN0aXZlIHRhYiBmb3VuZCdcblx0XHRcdH1cblx0XHRcdHRhYklkID0gYWN0aXZlVGFiLmlkXG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG5cdFx0XHR0YXJnZXQ6IHsgdGFiSWQgfSxcblx0XHRcdGZ1bmM6IChzZWxlY3Rvcjogc3RyaW5nLCB3YWl0TXM6IG51bWJlcikgPT4ge1xuXHRcdFx0XHRjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0aWYgKCFlbGVtZW50KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXJyb3I6IGBFbGVtZW50IG5vdCBmb3VuZDogJHtzZWxlY3Rvcn1gLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQuY2xpY2soKVxuXG5cdFx0XHRcdC8vIFdhaXQgYWZ0ZXIgY2xpY2tcblx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0dGV4dDpcblx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LmlubmVyVGV4dD8uc2xpY2UoMCwgMTAwKSB8fFxuXHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQudGFnTmFtZSxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSwgd2FpdE1zKVxuXHRcdFx0XHR9KVxuXHRcdFx0fSxcblx0XHRcdGFyZ3M6IFthcmdzLnNlbGVjdG9yLCBhcmdzLndhaXRBZnRlciB8fCA1MDBdLFxuXHRcdH0pXG5cblx0XHRjb25zdCByZXN1bHQgPSByZXN1bHRzWzBdPy5yZXN1bHQgYXMgYW55XG5cdFx0aWYgKCFyZXN1bHQ/LnN1Y2Nlc3MpIHtcblx0XHRcdHJldHVybiBg4p2MICR7cmVzdWx0Py5lcnJvciB8fCAnQ2xpY2sgZmFpbGVkJ31gXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGDinIUgQ2xpY2tlZCBlbGVtZW50IFwiJHthcmdzLnNlbGVjdG9yfVwiICh0ZXh0OiBcIiR7cmVzdWx0LnRleHR9XCIpIGluIHRhYiAoSUQ6ICR7dGFiSWR9KWBcblx0fSBjYXRjaCAoZXJyb3I6IGFueSkge1xuXHRcdHJldHVybiBg4p2MIEZhaWxlZCB0byBjbGljazogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOmUruebmOi+k+WFpVxuICovXG5leHBvcnQgY29uc3Qga2V5ZG93blRvb2w6IFRvb2wgPSB7XG5cdG5hbWU6ICdrZXlkb3duJyxcblx0ZGVzY3JpcHRpb246XG5cdFx0J1R5cGUgdGV4dCBpbnRvIGEgZm9jdXNlZCBpbnB1dCBmaWVsZCBvciBzZW5kIGtleWJvYXJkIHNob3J0Y3V0cycsXG5cdHBhcmFtZXRlcnM6IHtcblx0XHR0eXBlOiAnb2JqZWN0Jyxcblx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHR0YWJJZDoge1xuXHRcdFx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246XG5cdFx0XHRcdFx0J1RoZSBJRCBvZiB0aGUgdGFiLiBJZiBub3QgcHJvdmlkZWQsIHVzZSB0aGUgYWN0aXZlIHRhYi4nLFxuXHRcdFx0fSxcblx0XHRcdHNlbGVjdG9yOiB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjpcblx0XHRcdFx0XHQnQ1NTIHNlbGVjdG9yIG9mIHRoZSBpbnB1dCBlbGVtZW50LiBJZiBub3QgcHJvdmlkZWQsIHR5cGVzIGludG8gdGhlIGN1cnJlbnRseSBmb2N1c2VkIGVsZW1lbnQuJyxcblx0XHRcdH0sXG5cdFx0XHR0ZXh0OiB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogJ1RleHQgdG8gdHlwZS4gVXNlIFwiXFxcXG5cIiBmb3IgRW50ZXIga2V5LicsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0cmVxdWlyZWQ6IFsndGV4dCddLFxuXHR9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24ga2V5ZG93bihhcmdzOiB7XG5cdHRhYklkPzogbnVtYmVyXG5cdHNlbGVjdG9yPzogc3RyaW5nXG5cdHRleHQ6IHN0cmluZ1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdHRyeSB7XG5cdFx0bGV0IHRhYklkID0gYXJncy50YWJJZFxuXHRcdGlmICghdGFiSWQpIHtcblx0XHRcdGNvbnN0IFthY3RpdmVUYWJdID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe1xuXHRcdFx0XHRhY3RpdmU6IHRydWUsXG5cdFx0XHRcdGN1cnJlbnRXaW5kb3c6IHRydWUsXG5cdFx0XHR9KVxuXHRcdFx0aWYgKCFhY3RpdmVUYWI/LmlkKSB7XG5cdFx0XHRcdHJldHVybiAn4p2MIE5vIGFjdGl2ZSB0YWIgZm91bmQnXG5cdFx0XHR9XG5cdFx0XHR0YWJJZCA9IGFjdGl2ZVRhYi5pZFxuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuXHRcdFx0dGFyZ2V0OiB7IHRhYklkIH0sXG5cdFx0XHRmdW5jOiAoc2VsZWN0b3I6IHN0cmluZyB8IHVuZGVmaW5lZCwgdGV4dDogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdGxldCBlbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0XHRcdFx0aWYgKHNlbGVjdG9yKSB7XG5cdFx0XHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0aWYgKCFlbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0ZXJyb3I6IGBFbGVtZW50IG5vdCBmb3VuZDogJHtzZWxlY3Rvcn1gLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbGVtZW50LmZvY3VzKClcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdGlmICghZWxlbWVudCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdGVycm9yOiAnTm8gZm9jdXNlZCBlbGVtZW50IGZvdW5kJyxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGb3IgaW5wdXQvdGV4dGFyZWEsIHNldCB2YWx1ZSBkaXJlY3RseVxuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0ZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgfHxcblx0XHRcdFx0XHRlbGVtZW50IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudFxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRlbGVtZW50LnZhbHVlID0gdGV4dFxuXHRcdFx0XHRcdGVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKVxuXHRcdFx0XHRcdGVsZW1lbnQuZGlzcGF0Y2hFdmVudChcblx0XHRcdFx0XHRcdG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0XHRyZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB0YWdOYW1lOiBlbGVtZW50LnRhZ05hbWUgfVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRm9yIGNvbnRlbnRlZGl0YWJsZVxuXHRcdFx0XHRpZiAoZWxlbWVudC5pc0NvbnRlbnRFZGl0YWJsZSkge1xuXHRcdFx0XHRcdGVsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0XG5cdFx0XHRcdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpXG5cdFx0XHRcdFx0cmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdGFnTmFtZTogJ0NvbnRlbnRFZGl0YWJsZScgfVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRmFsbGJhY2s6IGRpc3BhdGNoIGtleWJvYXJkIGV2ZW50c1xuXHRcdFx0XHRmb3IgKGNvbnN0IGNoYXIgb2YgdGV4dCkge1xuXHRcdFx0XHRcdGlmIChjaGFyID09PSAnXFxuJykge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KFxuXHRcdFx0XHRcdFx0XHRuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHtcblx0XHRcdFx0XHRcdFx0XHRrZXk6ICdFbnRlcicsXG5cdFx0XHRcdFx0XHRcdFx0YnViYmxlczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoXG5cdFx0XHRcdFx0XHRcdG5ldyBLZXlib2FyZEV2ZW50KCdrZXlwcmVzcycsIHtcblx0XHRcdFx0XHRcdFx0XHRrZXk6ICdFbnRlcicsXG5cdFx0XHRcdFx0XHRcdFx0YnViYmxlczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoXG5cdFx0XHRcdFx0XHRcdG5ldyBLZXlib2FyZEV2ZW50KCdrZXl1cCcsIHtcblx0XHRcdFx0XHRcdFx0XHRrZXk6ICdFbnRlcicsXG5cdFx0XHRcdFx0XHRcdFx0YnViYmxlczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVsZW1lbnQuZGlzcGF0Y2hFdmVudChcblx0XHRcdFx0XHRcdFx0bmV3IEtleWJvYXJkRXZlbnQoJ2tleWRvd24nLCB7XG5cdFx0XHRcdFx0XHRcdFx0a2V5OiBjaGFyLFxuXHRcdFx0XHRcdFx0XHRcdGJ1YmJsZXM6IHRydWUsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KFxuXHRcdFx0XHRcdFx0XHRuZXcgS2V5Ym9hcmRFdmVudCgna2V5cHJlc3MnLCB7XG5cdFx0XHRcdFx0XHRcdFx0a2V5OiBjaGFyLFxuXHRcdFx0XHRcdFx0XHRcdGJ1YmJsZXM6IHRydWUsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0ZWxlbWVudC5kaXNwYXRjaEV2ZW50KFxuXHRcdFx0XHRcdFx0XHRuZXcgS2V5Ym9hcmRFdmVudCgna2V5dXAnLCB7XG5cdFx0XHRcdFx0XHRcdFx0a2V5OiBjaGFyLFxuXHRcdFx0XHRcdFx0XHRcdGJ1YmJsZXM6IHRydWUsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHRhZ05hbWU6IGVsZW1lbnQudGFnTmFtZSB9XG5cdFx0XHR9LFxuXHRcdFx0YXJnczogW2FyZ3Muc2VsZWN0b3IsIGFyZ3MudGV4dF0sXG5cdFx0fSlcblxuXHRcdGNvbnN0IHJlc3VsdCA9IHJlc3VsdHNbMF0/LnJlc3VsdCBhcyBhbnlcblx0XHRpZiAoIXJlc3VsdD8uc3VjY2Vzcykge1xuXHRcdFx0cmV0dXJuIGDinYwgJHtyZXN1bHQ/LmVycm9yIHx8ICdUeXBlIGZhaWxlZCd9YFxuXHRcdH1cblxuXHRcdGNvbnN0IHByZXZpZXcgPVxuXHRcdFx0YXJncy50ZXh0Lmxlbmd0aCA+IDUwID8gYXJncy50ZXh0LnNsaWNlKDAsIDUwKSArICcuLi4nIDogYXJncy50ZXh0XG5cdFx0cmV0dXJuIGDinIUgVHlwZWQgXCIke3ByZXZpZXd9XCIgaW50byAke1xuXHRcdFx0YXJncy5zZWxlY3RvciB8fCAnZm9jdXNlZCBlbGVtZW50J1xuXHRcdH0gKCR7cmVzdWx0LnRhZ05hbWV9KSBpbiB0YWIgKElEOiAke3RhYklkfSlgXG5cdH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcblx0XHRyZXR1cm4gYOKdjCBGYWlsZWQgdG8gdHlwZTogJHtlcnJvci5tZXNzYWdlfWBcblx0fVxufVxuXG4vKipcbiAqIOetieW+he+8iOeUqOS6juinguWvn+mhtemdouWPmOWMlu+8iVxuICovXG5leHBvcnQgY29uc3Qgd2FpdFRvb2w6IFRvb2wgPSB7XG5cdG5hbWU6ICd3YWl0Jyxcblx0ZGVzY3JpcHRpb246XG5cdFx0J1dhaXQgZm9yIGEgc3BlY2lmaWVkIGFtb3VudCBvZiB0aW1lICh1c2VmdWwgZm9yIG9ic2VydmluZyBwYWdlIGNoYW5nZXMgYWZ0ZXIgYWN0aW9ucyknLFxuXHRwYXJhbWV0ZXJzOiB7XG5cdFx0dHlwZTogJ29iamVjdCcsXG5cdFx0cHJvcGVydGllczoge1xuXHRcdFx0c2Vjb25kczoge1xuXHRcdFx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICdOdW1iZXIgb2Ygc2Vjb25kcyB0byB3YWl0ICgwLjUgdG8gMTApJyxcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRyZXF1aXJlZDogWydzZWNvbmRzJ10sXG5cdH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWl0KGFyZ3M6IHsgc2Vjb25kczogbnVtYmVyIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuXHRjb25zdCBzZWNvbmRzID0gTWF0aC5tYXgoMC41LCBNYXRoLm1pbigxMCwgYXJncy5zZWNvbmRzKSlcblx0YXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgc2Vjb25kcyAqIDEwMDApKVxuXHRyZXR1cm4gYOKchSBXYWl0ZWQgZm9yICR7c2Vjb25kc30gc2Vjb25kc2Bcbn1cblxuLyoqXG4gKiDlrozmiJDku7vliqFcbiAqL1xuZXhwb3J0IGNvbnN0IGRvbmVUb29sOiBUb29sID0ge1xuXHRuYW1lOiAnZG9uZScsXG5cdGRlc2NyaXB0aW9uOiAnTWFyayB0aGUgdGFzayBhcyBjb21wbGV0ZWQgYW5kIHJldHVybiB0aGUgZmluYWwgcmVzdWx0Jyxcblx0cGFyYW1ldGVyczoge1xuXHRcdHR5cGU6ICdvYmplY3QnLFxuXHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdHJlc3VsdDoge1xuXHRcdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICdUaGUgZmluYWwgcmVzdWx0IG9yIHN1bW1hcnkgb2YgdGhlIHRhc2snLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdHJlcXVpcmVkOiBbJ3Jlc3VsdCddLFxuXHR9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG9uZShhcmdzOiB7IHJlc3VsdDogc3RyaW5nIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuXHRyZXR1cm4gYOKchSBUYXNrIGNvbXBsZXRlZDogJHthcmdzLnJlc3VsdH1gXG59XG5cbi8qKlxuICog5omA5pyJ5bel5YW35YiX6KGoXG4gKi9cbmV4cG9ydCBjb25zdCBhbGxUb29sczogVG9vbFtdID0gW1xuXHRvcGVuVGFiVG9vbCxcblx0YWN0aXZlVGFiVG9vbCxcblx0Y2xvc2VUYWJUb29sLFxuXHRyZWxvYWRUYWJUb29sLFxuXHRzY3JvbGxQYWdlVG9vbCxcblx0Y2xpY2tUb29sLFxuXHRrZXlkb3duVG9vbCxcblx0d2FpdFRvb2wsXG5cdGRvbmVUb29sLFxuXVxuXG4vKipcbiAqIOW3peWFt+aJp+ihjOWZqOaYoOWwhFxuICovXG5leHBvcnQgY29uc3QgdG9vbEV4ZWN1dG9yczogUmVjb3JkPHN0cmluZywgKGFyZ3M6IGFueSkgPT4gUHJvbWlzZTxzdHJpbmc+PiA9IHtcblx0b3Blbl90YWI6IG9wZW5UYWIsXG5cdGFjdGl2ZV90YWI6IGFjdGl2ZVRhYixcblx0Y2xvc2VfdGFiOiBjbG9zZVRhYixcblx0cmVsb2FkX3RhYjogcmVsb2FkVGFiLFxuXHRzY3JvbGxfcGFnZTogc2Nyb2xsUGFnZSxcblx0Y2xpY2s6IGNsaWNrLFxuXHRrZXlkb3duOiBrZXlkb3duLFxuXHR3YWl0OiB3YWl0LFxuXHRkb25lOiBkb25lLFxufVxuIiwiLyoqXG4gKiBCcm93c2VyIEFnZW50IC0g6LeoIFRhYiDnmoTmtY/op4jlmajmjqfliLYgQWdlbnRcbiAqXG4gKiDmnrbmnoTlj4LogIMgcGFnZS1hZ2VudO+8jOS9humSiOWvuea1j+iniOWZqOaJqeWxleWcuuaZr+S8mOWMlu+8mlxuICogLSDkvb/nlKjmiKrlm77ku6Pmm78gRE9NIOa4hea0l++8iOabtOebtOingu+8jOaUr+aMgSBDYW52YXMvVmlkZW8g562J77yJXG4gKiAtIOWcqCBiYWNrZ3JvdW5kIOi/kOihjO+8jOWPr+S7peaOp+WItuaJgOaciSB0YWJzXG4gKiAtIOavj+asoeWGs+etluaXtuaPkOS+m++8mnRhYiDliJfooaggKyDlvZPliY0gdGFiIOaIquWbviArIOW3peWFt+mbhlxuICovXG5cbmltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCB7IExMTUNsaWVudCwgdHlwZSBMTE1Db25maWcsIHR5cGUgTWVzc2FnZSB9IGZyb20gJy4vbGxtJ1xuaW1wb3J0IHsgYWxsVG9vbHMsIHRvb2xFeGVjdXRvcnMgfSBmcm9tICcuL3Rvb2xzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFnZW50Q29uZmlnIGV4dGVuZHMgTExNQ29uZmlnIHtcblx0bWF4U3RlcHM/OiBudW1iZXJcblx0c3lzdGVtUHJvbXB0Pzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFiSW5mbyB7XG5cdGlkOiBudW1iZXJcblx0dGl0bGU6IHN0cmluZ1xuXHR1cmw6IHN0cmluZ1xuXHRhY3RpdmU6IGJvb2xlYW5cblx0d2luZG93SWQ6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFnZW50U3RlcCB7XG5cdHN0ZXBOdW1iZXI6IG51bWJlclxuXHR0aW1lc3RhbXA6IG51bWJlclxuXHRjb250ZXh0OiB7XG5cdFx0dGFiczogVGFiSW5mb1tdXG5cdFx0YWN0aXZlVGFiOiBUYWJJbmZvXG5cdFx0c2NyZWVuc2hvdDogc3RyaW5nIC8vIGRhdGEgVVJMXG5cdH1cblx0bGxtUmVxdWVzdDoge1xuXHRcdG1lc3NhZ2VzOiBNZXNzYWdlW11cblx0XHR0b29sczogdHlwZW9mIGFsbFRvb2xzXG5cdH1cblx0bGxtUmVzcG9uc2U6IHtcblx0XHRyZWFzb25pbmc/OiBzdHJpbmdcblx0XHR0b29sQ2FsbHM/OiBBcnJheTx7XG5cdFx0XHRpZDogc3RyaW5nXG5cdFx0XHRuYW1lOiBzdHJpbmdcblx0XHRcdGFyZ3VtZW50czogYW55XG5cdFx0fT5cblx0XHRjb250ZW50Pzogc3RyaW5nXG5cdH1cblx0dG9vbFJlc3VsdHM/OiBBcnJheTx7XG5cdFx0dG9vbENhbGxJZDogc3RyaW5nXG5cdFx0dG9vbE5hbWU6IHN0cmluZ1xuXHRcdHJlc3VsdDogc3RyaW5nXG5cdH0+XG5cdHVzYWdlPzoge1xuXHRcdHByb21wdF90b2tlbnM6IG51bWJlclxuXHRcdGNvbXBsZXRpb25fdG9rZW5zOiBudW1iZXJcblx0XHR0b3RhbF90b2tlbnM6IG51bWJlclxuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWdlbnRSZXN1bHQge1xuXHRzdWNjZXNzOiBib29sZWFuXG5cdGZpbmFsUmVzdWx0Pzogc3RyaW5nXG5cdGVycm9yPzogc3RyaW5nXG5cdHN0ZXBzOiBBZ2VudFN0ZXBbXVxuXHR0b3RhbFN0ZXBzOiBudW1iZXJcblx0dG90YWxUb2tlbnM6IG51bWJlclxufVxuXG5leHBvcnQgY2xhc3MgQnJvd3NlckFnZW50IHtcblx0cHJpdmF0ZSBjb25maWc6IEFnZW50Q29uZmlnXG5cdHByaXZhdGUgbGxtOiBMTE1DbGllbnRcblx0cHJpdmF0ZSBtZXNzYWdlczogTWVzc2FnZVtdID0gW11cblx0cHJpdmF0ZSBzdGVwczogQWdlbnRTdGVwW10gPSBbXVxuXHRwcml2YXRlIHRvdGFsVG9rZW5zID0gMFxuXHRwcml2YXRlIGN1cnJlbnRTdGVwID0gMFxuXG5cdGNvbnN0cnVjdG9yKGNvbmZpZzogQWdlbnRDb25maWcpIHtcblx0XHR0aGlzLmNvbmZpZyA9IHtcblx0XHRcdG1heFN0ZXBzOiAyMCxcblx0XHRcdHN5c3RlbVByb21wdDogdGhpcy5nZXREZWZhdWx0U3lzdGVtUHJvbXB0KCksXG5cdFx0XHQuLi5jb25maWcsXG5cdFx0fVxuXHRcdHRoaXMubGxtID0gbmV3IExMTUNsaWVudChjb25maWcpXG5cblx0XHQvLyBJbml0aWFsaXplIHdpdGggc3lzdGVtIHByb21wdFxuXHRcdHRoaXMubWVzc2FnZXMucHVzaChcblx0XHRcdExMTUNsaWVudC5jcmVhdGVUZXh0TWVzc2FnZSgnc3lzdGVtJywgdGhpcy5jb25maWcuc3lzdGVtUHJvbXB0ISksXG5cdFx0KVxuXHR9XG5cblx0LyoqXG5cdCAqIOaJp+ihjOS7u+WKoVxuXHQgKi9cblx0YXN5bmMgZXhlY3V0ZSh0YXNrOiBzdHJpbmcpOiBQcm9taXNlPEFnZW50UmVzdWx0PiB7XG5cdFx0Y29uc29sZS5sb2coY2hhbGsubWFnZW50YS5ib2xkKGBcXG7wn6SWIEFnZW50IHN0YXJ0ZWQgdGFzazogXCIke3Rhc2t9XCJcXG5gKSlcblxuXHRcdHRoaXMubWVzc2FnZXMucHVzaChcblx0XHRcdExMTUNsaWVudC5jcmVhdGVUZXh0TWVzc2FnZShcblx0XHRcdFx0J3VzZXInLFxuXHRcdFx0XHRgVGFzazogJHt0YXNrfVxcblxcblBsZWFzZSBjb21wbGV0ZSB0aGlzIHRhc2sgc3RlcCBieSBzdGVwLiBVc2UgdGhlIHByb3ZpZGVkIHRvb2xzIHRvIGludGVyYWN0IHdpdGggdGhlIGJyb3dzZXIuYCxcblx0XHRcdCksXG5cdFx0KVxuXG5cdFx0dHJ5IHtcblx0XHRcdHdoaWxlICh0aGlzLmN1cnJlbnRTdGVwIDwgdGhpcy5jb25maWcubWF4U3RlcHMhKSB7XG5cdFx0XHRcdHRoaXMuY3VycmVudFN0ZXArK1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRjaGFsay5jeWFuLmJvbGQoXG5cdFx0XHRcdFx0XHRgXFxu8J+TjSBTdGVwICR7dGhpcy5jdXJyZW50U3RlcH0vJHt0aGlzLmNvbmZpZy5tYXhTdGVwc31cXG5gLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdClcblxuXHRcdFx0XHQvLyDmlLbpm4blvZPliY3kuIrkuIvmlofvvIh0YWJzICsg5oiq5Zu+77yJXG5cdFx0XHRcdGNvbnN0IGNvbnRleHQgPSBhd2FpdCB0aGlzLmNvbGxlY3RDb250ZXh0KClcblxuXHRcdFx0XHQvLyDmnoTlu7rlvZPliY3mtojmga/vvIjluKbkuIrkuIvmlofvvIlcblx0XHRcdFx0Y29uc3QgY29udGV4dE1lc3NhZ2UgPSB0aGlzLmJ1aWxkQ29udGV4dE1lc3NhZ2UoY29udGV4dClcblx0XHRcdFx0Y29uc3QgY3VycmVudE1lc3NhZ2VzID0gWy4uLnRoaXMubWVzc2FnZXMsIGNvbnRleHRNZXNzYWdlXVxuXG5cdFx0XHRcdC8vIOiwg+eUqCBMTE1cblx0XHRcdFx0Y29uc3QgbGxtUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmxsbS5jaGF0KFxuXHRcdFx0XHRcdGN1cnJlbnRNZXNzYWdlcyxcblx0XHRcdFx0XHRhbGxUb29scyxcblx0XHRcdFx0XHQnYXV0bycsXG5cdFx0XHRcdClcblxuXHRcdFx0XHQvLyDorrDlvZXmraXpqqRcblx0XHRcdFx0Y29uc3Qgc3RlcDogQWdlbnRTdGVwID0ge1xuXHRcdFx0XHRcdHN0ZXBOdW1iZXI6IHRoaXMuY3VycmVudFN0ZXAsXG5cdFx0XHRcdFx0dGltZXN0YW1wOiBEYXRlLm5vdygpLFxuXHRcdFx0XHRcdGNvbnRleHQsXG5cdFx0XHRcdFx0bGxtUmVxdWVzdDoge1xuXHRcdFx0XHRcdFx0bWVzc2FnZXM6IGN1cnJlbnRNZXNzYWdlcyxcblx0XHRcdFx0XHRcdHRvb2xzOiBhbGxUb29scyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGxsbVJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRjb250ZW50OiBsbG1SZXNwb25zZS5tZXNzYWdlLmNvbnRlbnQgfHwgdW5kZWZpbmVkLFxuXHRcdFx0XHRcdFx0dG9vbENhbGxzOiBsbG1SZXNwb25zZS5tZXNzYWdlLnRvb2xfY2FsbHM/Lm1hcChcblx0XHRcdFx0XHRcdFx0KHRjKSA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdGlkOiB0Yy5pZCxcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiB0Yy5mdW5jdGlvbi5uYW1lLFxuXHRcdFx0XHRcdFx0XHRcdGFyZ3VtZW50czogSlNPTi5wYXJzZSh0Yy5mdW5jdGlvbi5hcmd1bWVudHMpLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR1c2FnZTogbGxtUmVzcG9uc2UudXNhZ2UsXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobGxtUmVzcG9uc2UudXNhZ2UpIHtcblx0XHRcdFx0XHR0aGlzLnRvdGFsVG9rZW5zICs9IGxsbVJlc3BvbnNlLnVzYWdlLnRvdGFsX3Rva2Vuc1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8g5re75YqgIGFzc2lzdGFudCDmtojmga/liLDljoblj7Jcblx0XHRcdFx0dGhpcy5tZXNzYWdlcy5wdXNoKHtcblx0XHRcdFx0XHRyb2xlOiAnYXNzaXN0YW50Jyxcblx0XHRcdFx0XHRjb250ZW50OiBsbG1SZXNwb25zZS5tZXNzYWdlLmNvbnRlbnQgfHwgJycsXG5cdFx0XHRcdFx0dG9vbF9jYWxsczogbGxtUmVzcG9uc2UubWVzc2FnZS50b29sX2NhbGxzLFxuXHRcdFx0XHR9IGFzIGFueSlcblxuXHRcdFx0XHQvLyDlpoLmnpzmnInlt6XlhbfosIPnlKjvvIzmiafooYzlt6Xlhbdcblx0XHRcdFx0aWYgKGxsbVJlc3BvbnNlLm1lc3NhZ2UudG9vbF9jYWxscykge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0Y2hhbGsueWVsbG93KFxuXHRcdFx0XHRcdFx0XHRgICAg8J+UpyBFeGVjdXRpbmcgJHtsbG1SZXNwb25zZS5tZXNzYWdlLnRvb2xfY2FsbHMubGVuZ3RofSB0b29sKHMpLi4uXFxuYCxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KVxuXG5cdFx0XHRcdFx0c3RlcC50b29sUmVzdWx0cyA9IFtdXG5cblx0XHRcdFx0XHRmb3IgKGNvbnN0IHRvb2xDYWxsIG9mIGxsbVJlc3BvbnNlLm1lc3NhZ2UudG9vbF9jYWxscykge1xuXHRcdFx0XHRcdFx0Y29uc3QgdG9vbE5hbWUgPSB0b29sQ2FsbC5mdW5jdGlvbi5uYW1lXG5cdFx0XHRcdFx0XHRjb25zdCB0b29sQXJncyA9IEpTT04ucGFyc2UodG9vbENhbGwuZnVuY3Rpb24uYXJndW1lbnRzKVxuXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0Y2hhbGsuYmx1ZShcblx0XHRcdFx0XHRcdFx0XHRgICAgICAg4oaSICR7dG9vbE5hbWV9KCR7SlNPTi5zdHJpbmdpZnkoXG5cdFx0XHRcdFx0XHRcdFx0XHR0b29sQXJncyxcblx0XHRcdFx0XHRcdFx0XHQpfSlgLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0KVxuXG5cdFx0XHRcdFx0XHQvLyDmiafooYzlt6Xlhbdcblx0XHRcdFx0XHRcdGNvbnN0IGV4ZWN1dG9yID0gdG9vbEV4ZWN1dG9yc1t0b29sTmFtZV1cblx0XHRcdFx0XHRcdGlmICghZXhlY3V0b3IpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZXJyb3JNc2cgPSBg4p2MIFRvb2wgbm90IGZvdW5kOiAke3Rvb2xOYW1lfWBcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coY2hhbGsucmVkKGAgICAgICAke2Vycm9yTXNnfWApKVxuXHRcdFx0XHRcdFx0XHRzdGVwLnRvb2xSZXN1bHRzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdHRvb2xDYWxsSWQ6IHRvb2xDYWxsLmlkLFxuXHRcdFx0XHRcdFx0XHRcdHRvb2xOYW1lLFxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdDogZXJyb3JNc2csXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdHRoaXMubWVzc2FnZXMucHVzaChcblx0XHRcdFx0XHRcdFx0XHRMTE1DbGllbnQuY3JlYXRlVG9vbE1lc3NhZ2UoXG5cdFx0XHRcdFx0XHRcdFx0XHR0b29sQ2FsbC5pZCxcblx0XHRcdFx0XHRcdFx0XHRcdHRvb2xOYW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXJyb3JNc2csXG5cdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBleGVjdXRvcih0b29sQXJncylcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coY2hhbGsuZ3JlZW4oYCAgICAgICR7cmVzdWx0fWApKVxuXG5cdFx0XHRcdFx0XHRcdHN0ZXAudG9vbFJlc3VsdHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0dG9vbENhbGxJZDogdG9vbENhbGwuaWQsXG5cdFx0XHRcdFx0XHRcdFx0dG9vbE5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0LFxuXHRcdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRcdC8vIOa3u+WKoOW3peWFt+e7k+aenOWIsOWOhuWPslxuXHRcdFx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzLnB1c2goXG5cdFx0XHRcdFx0XHRcdFx0TExNQ2xpZW50LmNyZWF0ZVRvb2xNZXNzYWdlKFxuXHRcdFx0XHRcdFx0XHRcdFx0dG9vbENhbGwuaWQsXG5cdFx0XHRcdFx0XHRcdFx0XHR0b29sTmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHQpXG5cblx0XHRcdFx0XHRcdFx0Ly8g5aaC5p6c5pivIGRvbmUg5bel5YW377yM5Lu75Yqh5a6M5oiQXG5cdFx0XHRcdFx0XHRcdGlmICh0b29sTmFtZSA9PT0gJ2RvbmUnKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdGVwcy5wdXNoKHN0ZXApXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaW5hbFJlc3VsdDogdG9vbEFyZ3MucmVzdWx0LFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RlcHM6IHRoaXMuc3RlcHMsXG5cdFx0XHRcdFx0XHRcdFx0XHR0b3RhbFN0ZXBzOiB0aGlzLmN1cnJlbnRTdGVwLFxuXHRcdFx0XHRcdFx0XHRcdFx0dG90YWxUb2tlbnM6IHRoaXMudG90YWxUb2tlbnMsXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcjogYW55KSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGVycm9yTXNnID0gYOKdjCBUb29sIGV4ZWN1dGlvbiBlcnJvcjogJHtlcnJvci5tZXNzYWdlfWBcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coY2hhbGsucmVkKGAgICAgICAke2Vycm9yTXNnfWApKVxuXG5cdFx0XHRcdFx0XHRcdHN0ZXAudG9vbFJlc3VsdHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0dG9vbENhbGxJZDogdG9vbENhbGwuaWQsXG5cdFx0XHRcdFx0XHRcdFx0dG9vbE5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0OiBlcnJvck1zZyxcblx0XHRcdFx0XHRcdFx0fSlcblxuXHRcdFx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzLnB1c2goXG5cdFx0XHRcdFx0XHRcdFx0TExNQ2xpZW50LmNyZWF0ZVRvb2xNZXNzYWdlKFxuXHRcdFx0XHRcdFx0XHRcdFx0dG9vbENhbGwuaWQsXG5cdFx0XHRcdFx0XHRcdFx0XHR0b29sTmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdGVycm9yTXNnLFxuXHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAobGxtUmVzcG9uc2UubWVzc2FnZS5jb250ZW50KSB7XG5cdFx0XHRcdFx0Ly8g5rKh5pyJ5bel5YW36LCD55So77yM5Y+q5pyJ5paH5pys5Zue5aSNXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRjaGFsay55ZWxsb3coXG5cdFx0XHRcdFx0XHRcdGAgICDwn5KsIEFzc2lzdGFudDogJHtsbG1SZXNwb25zZS5tZXNzYWdlLmNvbnRlbnR9YCxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5zdGVwcy5wdXNoKHN0ZXApXG5cdFx0XHR9XG5cblx0XHRcdC8vIOi+vuWIsOacgOWkp+atpeaVsFxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiBgUmVhY2hlZCBtYXhpbXVtIHN0ZXBzICgke3RoaXMuY29uZmlnLm1heFN0ZXBzfSlgLFxuXHRcdFx0XHRzdGVwczogdGhpcy5zdGVwcyxcblx0XHRcdFx0dG90YWxTdGVwczogdGhpcy5jdXJyZW50U3RlcCxcblx0XHRcdFx0dG90YWxUb2tlbnM6IHRoaXMudG90YWxUb2tlbnMsXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3I6IGFueSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcblx0XHRcdFx0Y2hhbGsucmVkLmJvbGQoYFxcbuKdjCBBZ2VudCBlcnJvcjogJHtlcnJvci5tZXNzYWdlfVxcbmApLFxuXHRcdFx0KVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiBlcnJvci5tZXNzYWdlLFxuXHRcdFx0XHRzdGVwczogdGhpcy5zdGVwcyxcblx0XHRcdFx0dG90YWxTdGVwczogdGhpcy5jdXJyZW50U3RlcCxcblx0XHRcdFx0dG90YWxUb2tlbnM6IHRoaXMudG90YWxUb2tlbnMsXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIOaUtumbhuW9k+WJjea1j+iniOWZqOS4iuS4i+aWh1xuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjb2xsZWN0Q29udGV4dCgpOiBQcm9taXNlPEFnZW50U3RlcFsnY29udGV4dCddPiB7XG5cdFx0Ly8g6I635Y+W5omA5pyJIHRhYnNcblx0XHRjb25zdCBhbGxUYWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe30pXG5cdFx0Y29uc3QgdGFiczogVGFiSW5mb1tdID0gYWxsVGFicy5tYXAoKHRhYikgPT4gKHtcblx0XHRcdGlkOiB0YWIuaWQhLFxuXHRcdFx0dGl0bGU6IHRhYi50aXRsZSB8fCAnVW50aXRsZWQnLFxuXHRcdFx0dXJsOiB0YWIudXJsIHx8ICdhYm91dDpibGFuaycsXG5cdFx0XHRhY3RpdmU6IHRhYi5hY3RpdmUsXG5cdFx0XHR3aW5kb3dJZDogdGFiLndpbmRvd0lkLFxuXHRcdH0pKVxuXG5cdFx0Ly8g6I635Y+W5b2T5YmN5rS75YqoIHRhYlxuXHRcdGNvbnN0IFthY3RpdmVUYWJdID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe1xuXHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0Y3VycmVudFdpbmRvdzogdHJ1ZSxcblx0XHR9KVxuXG5cdFx0aWYgKCFhY3RpdmVUYWIgfHwgIWFjdGl2ZVRhYi5pZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdObyBhY3RpdmUgdGFiIGZvdW5kJylcblx0XHR9XG5cblx0XHQvLyDmiKrlm77lvZPliY3mtLvliqggdGFiXG5cdFx0Y29uc3Qgc2NyZWVuc2hvdCA9IGF3YWl0IGNocm9tZS50YWJzLmNhcHR1cmVWaXNpYmxlVGFiKFxuXHRcdFx0YWN0aXZlVGFiLndpbmRvd0lkLFxuXHRcdFx0eyBmb3JtYXQ6ICdwbmcnIH0sXG5cdFx0KVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHRhYnMsXG5cdFx0XHRhY3RpdmVUYWI6IHtcblx0XHRcdFx0aWQ6IGFjdGl2ZVRhYi5pZCxcblx0XHRcdFx0dGl0bGU6IGFjdGl2ZVRhYi50aXRsZSB8fCAnVW50aXRsZWQnLFxuXHRcdFx0XHR1cmw6IGFjdGl2ZVRhYi51cmwgfHwgJ2Fib3V0OmJsYW5rJyxcblx0XHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0XHR3aW5kb3dJZDogYWN0aXZlVGFiLndpbmRvd0lkLFxuXHRcdFx0fSxcblx0XHRcdHNjcmVlbnNob3QsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIOaehOW7uuWMheWQq+S4iuS4i+aWh+eahOa2iOaBr1xuXHQgKi9cblx0cHJpdmF0ZSBidWlsZENvbnRleHRNZXNzYWdlKGNvbnRleHQ6IEFnZW50U3RlcFsnY29udGV4dCddKTogTWVzc2FnZSB7XG5cdFx0Ly8g5p6E5bu6IHRhYiDliJfooajmj4/ov7Bcblx0XHRjb25zdCB0YWJzSW5mbyA9IGNvbnRleHQudGFic1xuXHRcdFx0Lm1hcChcblx0XHRcdFx0KHRhYikgPT5cblx0XHRcdFx0XHRgLSBbJHt0YWIuaWR9XSAke3RhYi50aXRsZX0ke1xuXHRcdFx0XHRcdFx0dGFiLmFjdGl2ZSA/ICcgKEFDVElWRSknIDogJydcblx0XHRcdFx0XHR9XFxuICBVUkw6ICR7dGFiLnVybH1gLFxuXHRcdFx0KVxuXHRcdFx0LmpvaW4oJ1xcbicpXG5cblx0XHRjb25zdCBjb250ZXh0VGV4dCA9IGBcbj09PSBDVVJSRU5UIEJST1dTRVIgU1RBVEUgPT09XG5cbkFjdGl2ZSBUYWI6IFske2NvbnRleHQuYWN0aXZlVGFiLmlkfV0gJHtjb250ZXh0LmFjdGl2ZVRhYi50aXRsZX1cblVSTDogJHtjb250ZXh0LmFjdGl2ZVRhYi51cmx9XG5cbkFsbCBUYWJzICgke2NvbnRleHQudGFicy5sZW5ndGh9IHRvdGFsKTpcbiR7dGFic0luZm99XG5cbj09PSBTQ1JFRU5TSE9UID09PVxuVGhlIHNjcmVlbnNob3QgYmVsb3cgc2hvd3MgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGFjdGl2ZSB0YWIuXG5QbGVhc2UgYW5hbHl6ZSBpdCBjYXJlZnVsbHkgYmVmb3JlIGRlY2lkaW5nIHlvdXIgbmV4dCBhY3Rpb24uXG5gXG5cblx0XHRyZXR1cm4gTExNQ2xpZW50LmNyZWF0ZVZpc2lvbk1lc3NhZ2UoY29udGV4dFRleHQsIGNvbnRleHQuc2NyZWVuc2hvdClcblx0fVxuXG5cdC8qKlxuXHQgKiDpu5jorqTns7vnu5/mj5DnpLpcblx0ICovXG5cdHByaXZhdGUgZ2V0RGVmYXVsdFN5c3RlbVByb21wdCgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgWW91IGFyZSBhIGJyb3dzZXIgYXV0b21hdGlvbiBhZ2VudC4gWW91ciBnb2FsIGlzIHRvIGhlbHAgdXNlcnMgY29tcGxldGUgdGFza3MgYnkgY29udHJvbGxpbmcgYnJvd3NlciB0YWJzLlxuXG5Zb3UgaGF2ZSBhY2Nlc3MgdG8gdGhlIGZvbGxvd2luZyB0b29sczpcbi0gb3Blbl90YWI6IE9wZW4gYSBuZXcgdGFiIHdpdGggYSBVUkxcbi0gYWN0aXZlX3RhYjogU3dpdGNoIHRvIGEgc3BlY2lmaWMgdGFiXG4tIGNsb3NlX3RhYjogQ2xvc2UgYSB0YWJcbi0gcmVsb2FkX3RhYjogUmVsb2FkIGEgdGFiXG4tIHNjcm9sbF9wYWdlOiBTY3JvbGwgdGhlIHBhZ2UgdXAvZG93bi90b3AvYm90dG9tXG4tIGNsaWNrOiBDbGljayBhbiBlbGVtZW50IHVzaW5nIENTUyBzZWxlY3RvclxuLSBrZXlkb3duOiBUeXBlIHRleHQgaW50byBhbiBpbnB1dCBmaWVsZFxuLSB3YWl0OiBXYWl0IGZvciBhIHNwZWNpZmllZCB0aW1lXG4tIGRvbmU6IE1hcmsgdGhlIHRhc2sgYXMgY29tcGxldGVkXG5cbk9uIGVhY2ggc3RlcCwgeW91IHdpbGwgcmVjZWl2ZTpcbjEuIEEgbGlzdCBvZiBhbGwgb3BlbiB0YWJzIHdpdGggdGhlaXIgSURzLCB0aXRsZXMsIGFuZCBVUkxzXG4yLiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudGx5IGFjdGl2ZSB0YWJcbjMuIEEgc2NyZWVuc2hvdCBvZiB0aGUgYWN0aXZlIHRhYlxuXG5UaGluayBzdGVwIGJ5IHN0ZXA6XG4xLiBBbmFseXplIHRoZSBjdXJyZW50IHN0YXRlICh0YWJzIGFuZCBzY3JlZW5zaG90KVxuMi4gRGVjaWRlIHdoYXQgYWN0aW9uIHRvIHRha2UgbmV4dFxuMy4gVXNlIHRoZSBhcHByb3ByaWF0ZSB0b29sXG40LiBBZnRlciBlYWNoIGFjdGlvbiwgb2JzZXJ2ZSB0aGUgcmVzdWx0IGFuZCBwbGFuIHRoZSBuZXh0IHN0ZXBcblxuSW1wb3J0YW50IGd1aWRlbGluZXM6XG4tIFVzZSBDU1Mgc2VsZWN0b3JzIGNhcmVmdWxseSAoaW5zcGVjdCB0aGUgcGFnZSBzdHJ1Y3R1cmUgZnJvbSB0aGUgc2NyZWVuc2hvdClcbi0gV2FpdCBhZnRlciBhY3Rpb25zIHRoYXQgdHJpZ2dlciBwYWdlIGNoYW5nZXMgKHVzZSB0aGUgd2FpdCB0b29sKVxuLSBJZiB5b3UncmUgbm90IHN1cmUgYWJvdXQgYSBzZWxlY3RvciwgdHJ5IHRvIHNjcm9sbCBhbmQgZXhwbG9yZSB0aGUgcGFnZSBmaXJzdFxuLSBXaGVuIHRoZSB0YXNrIGlzIGNvbXBsZXRlLCBjYWxsIHRoZSAnZG9uZScgdG9vbCB3aXRoIGEgc3VtbWFyeVxuXG5BbHdheXMgYmUgcHJlY2lzZSBhbmQgZWZmaWNpZW50LiBDb21wbGV0ZSB0aGUgdGFzayBpbiBhcyBmZXcgc3RlcHMgYXMgcG9zc2libGUuYFxuXHR9XG5cblx0LyoqXG5cdCAqIOiOt+WPluaJp+ihjOWOhuWPslxuXHQgKi9cblx0Z2V0SGlzdG9yeSgpOiBBZ2VudFN0ZXBbXSB7XG5cdFx0cmV0dXJuIHRoaXMuc3RlcHNcblx0fVxuXG5cdC8qKlxuXHQgKiDojrflj5blvZPliY3kvb/nlKjnmoQgdG9rZW4g5pWwXG5cdCAqL1xuXHRnZXRUb3RhbFRva2VucygpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLnRvdGFsVG9rZW5zXG5cdH1cbn1cbiIsImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCB7IEJyb3dzZXJBZ2VudCwgdHlwZSBBZ2VudENvbmZpZyB9IGZyb20gJy4vYWdlbnQnXG5cbi8vIOWtmOWCqOi/kOihjOS4reeahCBhZ2VudHM6IGFnZW50SWQgLT4gQnJvd3NlckFnZW50XG5jb25zdCBydW5uaW5nQWdlbnRzID0gbmV3IE1hcDxzdHJpbmcsIEJyb3dzZXJBZ2VudD4oKVxuXG4vLyDnlJ/miJDpmo/mnLogVVVJRFxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCk6IHN0cmluZyB7XG5cdHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKFxuXHRcdC9beHldL2csXG5cdFx0ZnVuY3Rpb24gKGMpIHtcblx0XHRcdGNvbnN0IHIgPSAoTWF0aC5yYW5kb20oKSAqIDE2KSB8IDBcblx0XHRcdGNvbnN0IHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMpIHwgMHg4XG5cdFx0XHRyZXR1cm4gdi50b1N0cmluZygxNilcblx0XHR9LFxuXHQpXG59XG5cbi8vIOe+juWMluaXpeW/l1xuZnVuY3Rpb24gbG9nTWVzc2FnZShcblx0ZGlyZWN0aW9uOiAnaW5jb21pbmcnIHwgJ291dGdvaW5nJyxcblx0dHlwZTogc3RyaW5nLFxuXHRkYXRhPzogYW55LFxuKSB7XG5cdGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKClcblx0Y29uc3QgYXJyb3cgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyAn8J+TpScgOiAn8J+TpCdcblx0Y29uc3QgY29sb3IgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjaGFsay5jeWFuIDogY2hhbGsuZ3JlZW5cblxuXHRjb25zb2xlLmxvZyhcblx0XHRjb2xvci5ib2xkKGBcXG4ke2Fycm93fSBbJHt0aW1lc3RhbXB9XSAke2RpcmVjdGlvbi50b1VwcGVyQ2FzZSgpfWApLFxuXHQpXG5cdGNvbnNvbGUubG9nKGNoYWxrLnllbGxvdyhgICAgVHlwZTogJHt0eXBlfWApKVxuXG5cdGlmIChkYXRhKSB7XG5cdFx0Y29uc29sZS5sb2coY2hhbGsuZ3JheSgnICAgRGF0YTonKSwgZGF0YSlcblx0fVxufVxuXG4vLyDlrZjlgqjorqTor4Hkv6Hmga/vvJpzZXNzaW9uSWQgLT4geyBrZXk6IHN0cmluZywgdGFiSWQ6IG51bWJlciB9XG5jb25zdCBhdXRoZW50aWNhdGVkU2Vzc2lvbnMgPSBuZXcgTWFwPFxuXHRzdHJpbmcsXG5cdHsga2V5OiBzdHJpbmc7IHRhYklkOiBudW1iZXI7IHRpbWVzdGFtcDogbnVtYmVyIH1cbj4oKVxuXG4vLyDnlJ/miJDlubblrZjlgqggQVBJIGtleVxubGV0IGFwaUtleSA9IGdlbmVyYXRlVVVJRCgpXG5cbi8vIOavj+asoemHjeWQryBiYWNrZ3JvdW5kIOmHjeaWsOeUn+aIkCBrZXlcbmNvbnNvbGUubG9nKCdHZW5lcmF0ZWQgbmV3IEFQSSBrZXk6JywgYXBpS2V5KVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVCYWNrZ3JvdW5kKCgpID0+IHtcblx0Y29uc29sZS5sb2coY2hhbGsubWFnZW50YS5ib2xkKCdcXG7wn5qAIEJhY2tncm91bmQgc2VydmljZSB3b3JrZXIgc3RhcnRlZCcpKVxuXHRjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coYCAgIEFQSSBLZXk6ICR7YXBpS2V5fVxcbmApKVxuXG5cdC8vIOebkeWQrCB0YWIg5YWz6Zet5LqL5Lu277yM5riF55CG6K+lIHRhYiDnmoTmiYDmnIkgc2Vzc2lvblxuXHRjaHJvbWUudGFicy5vblJlbW92ZWQuYWRkTGlzdGVuZXIoKHRhYklkKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBbc2Vzc2lvbklkLCBzZXNzaW9uXSBvZiBhdXRoZW50aWNhdGVkU2Vzc2lvbnMuZW50cmllcygpKSB7XG5cdFx0XHRpZiAoc2Vzc2lvbi50YWJJZCA9PT0gdGFiSWQpIHtcblx0XHRcdFx0YXV0aGVudGljYXRlZFNlc3Npb25zLmRlbGV0ZShzZXNzaW9uSWQpXG5cdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdGNoYWxrLnJlZChcblx0XHRcdFx0XHRcdGBcXG7wn5eR77iPICBUYWIgJHt0YWJJZH0gY2xvc2VkLCBjbGVhcmVkIHNlc3Npb24gJHtzZXNzaW9uSWR9XFxuYCxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXG5cdC8vIOebkeWQrOadpeiHqiBjb250ZW50IHNjcmlwdCDnmoTmtojmga9cblx0Y2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuXHRcdChcblx0XHRcdG1lc3NhZ2U6IGFueSxcblx0XHRcdHNlbmRlcjogY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcblx0XHRcdHNlbmRSZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+IHZvaWQsXG5cdFx0KSA9PiB7XG5cdFx0XHRjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIOiusOW9leaUtuWIsOeahOa2iOaBr1xuXHRcdFx0XHRcdGxvZ01lc3NhZ2UoJ2luY29taW5nJywgbWVzc2FnZS50eXBlLCB7XG5cdFx0XHRcdFx0XHRzZXNzaW9uSWQ6IG1lc3NhZ2Uuc2Vzc2lvbklkLFxuXHRcdFx0XHRcdFx0dGFiSWQ6IHNlbmRlci50YWI/LmlkLFxuXHRcdFx0XHRcdFx0cGF5bG9hZDogbWVzc2FnZS5wYXlsb2FkLFxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHQvLyDojrflj5blvZPliY0gQVBJIGtlee+8iOeUqOS6jiBwb3B1cCDmmL7npLrvvIlcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnR0VUX0FQSV9LRVknKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiBhcGlLZXksXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8g5Yi35pawIEFQSSBrZXlcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnUkVGUkVTSF9BUElfS0VZJykge1xuXHRcdFx0XHRcdFx0YXBpS2V5ID0gZ2VuZXJhdGVVVUlEKClcblx0XHRcdFx0XHRcdGF1dGhlbnRpY2F0ZWRTZXNzaW9ucy5jbGVhcigpXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0Y2hhbGsubWFnZW50YS5ib2xkKFxuXHRcdFx0XHRcdFx0XHRcdGBcXG7wn5SEIFJlZnJlc2hlZCBBUEkga2V5OiAke2FwaUtleX1gLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdGNoYWxrLnJlZChcblx0XHRcdFx0XHRcdFx0XHRgICAgQ2xlYXJlZCAke2F1dGhlbnRpY2F0ZWRTZXNzaW9ucy5zaXplfSBzZXNzaW9uc1xcbmAsXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiBhcGlLZXksXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gTGluayDorqTor4Fcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnTElOSycpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsga2V5IH0gPSBtZXNzYWdlLnBheWxvYWRcblx0XHRcdFx0XHRcdGNvbnN0IHsgc2Vzc2lvbklkIH0gPSBtZXNzYWdlXG5cdFx0XHRcdFx0XHRjb25zdCB0YWJJZCA9IHNlbmRlci50YWI/LmlkXG5cblx0XHRcdFx0XHRcdGlmICghdGFiSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vIHRhYiBJRCcsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFzZXNzaW9uSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vIHNlc3Npb24gSUQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChrZXkgPT09IGFwaUtleSkge1xuXHRcdFx0XHRcdFx0XHRhdXRoZW50aWNhdGVkU2Vzc2lvbnMuc2V0KHNlc3Npb25JZCwge1xuXHRcdFx0XHRcdFx0XHRcdGtleSxcblx0XHRcdFx0XHRcdFx0XHR0YWJJZCxcblx0XHRcdFx0XHRcdFx0XHR0aW1lc3RhbXA6IERhdGUubm93KCksXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRcdGNoYWxrLmdyZWVuLmJvbGQoXG5cdFx0XHRcdFx0XHRcdFx0XHRgXFxu4pyFIFNlc3Npb24gYXV0aGVudGljYXRlZDogJHtzZXNzaW9uSWQuc3Vic3RyaW5nKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQxMixcblx0XHRcdFx0XHRcdFx0XHRcdCl9Li4uYCxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGNoYWxrLmdyYXkoYCAgIFRhYiBJRDogJHt0YWJJZH1cXG5gKSlcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdGRhdGE6IHsgYXV0aGVudGljYXRlZDogdHJ1ZSwgc2Vzc2lvbklkIH0sXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdJbnZhbGlkIGtleScsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyDpqozor4HorqTor4HnirbmgIFcblx0XHRcdFx0XHRjb25zdCB7IHNlc3Npb25JZCB9ID0gbWVzc2FnZVxuXHRcdFx0XHRcdGlmICghc2Vzc2lvbklkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdObyBzZXNzaW9uIElEJyxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCBzZXNzaW9uID0gYXV0aGVudGljYXRlZFNlc3Npb25zLmdldChzZXNzaW9uSWQpXG5cdFx0XHRcdFx0aWYgKCFzZXNzaW9uIHx8IHNlc3Npb24ua2V5ICE9PSBhcGlLZXkpIHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ05vdCBhdXRoZW50aWNhdGVkLiBDYWxsIGxpbmsoa2V5KSBmaXJzdC4nLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdHRVRfVEFCUycpIHtcblx0XHRcdFx0XHRcdC8vIOiOt+WPluaJgOaciSB0YWJzXG5cdFx0XHRcdFx0XHRjb25zdCB0YWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoe30pXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB0YWJzLm1hcCgodGFiOiBjaHJvbWUudGFicy5UYWIpID0+ICh7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IHRhYi5pZCxcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogdGFiLnRpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogdGFiLnVybCxcblx0XHRcdFx0XHRcdFx0XHRhY3RpdmU6IHRhYi5hY3RpdmUsXG5cdFx0XHRcdFx0XHRcdFx0d2luZG93SWQ6IHRhYi53aW5kb3dJZCxcblx0XHRcdFx0XHRcdFx0fSkpLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdFWEVDVVRFX1NDUklQVCcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgdGFiSWQsIGNvZGUgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIXRhYklkIHx8ICFjb2RlKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdNaXNzaW5nIHRhYklkIG9yIGNvZGUnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIOWcqOebruaghyB0YWIg55qEIE1BSU4gd29ybGQg5Lit5omn6KGM5Luj56CBXG5cdFx0XHRcdFx0XHQvLyDov5nmoLflj6/ku6Xnu5Xov4cgaXNvbGF0ZWQgd29ybGQg55qEIENTUCDpmZDliLZcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuXHRcdFx0XHRcdFx0XHR0YXJnZXQ6IHsgdGFiSWQgfSxcblx0XHRcdFx0XHRcdFx0d29ybGQ6ICdNQUlOJyxcblx0XHRcdFx0XHRcdFx0ZnVuYzogKGNvZGVTdHJpbmc6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdC8vIOWcqCBNQUlOIHdvcmxkIOS4re+8jGV2YWwg5piv5YWB6K6455qEXG5cdFx0XHRcdFx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV2YWxcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZXZhbChjb2RlU3RyaW5nKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRhcmdzOiBbY29kZV0sXG5cdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiByZXN1bHRzWzBdPy5yZXN1bHQsXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2UudHlwZSA9PT0gJ09QRU5fVEFCJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyB1cmwgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIXVybCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiAnTWlzc2luZyB1cmwnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IG5ld1RhYiA9IGF3YWl0IGNocm9tZS50YWJzLmNyZWF0ZSh7IHVybCB9KVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRcdFx0aWQ6IG5ld1RhYi5pZCxcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogbmV3VGFiLnRpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogbmV3VGFiLnVybCxcblx0XHRcdFx0XHRcdFx0XHRhY3RpdmU6IG5ld1RhYi5hY3RpdmUsXG5cdFx0XHRcdFx0XHRcdFx0d2luZG93SWQ6IG5ld1RhYi53aW5kb3dJZCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobWVzc2FnZS50eXBlID09PSAnQ0xPU0VfVEFCJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyB0YWJJZCB9ID0gbWVzc2FnZS5wYXlsb2FkXG5cblx0XHRcdFx0XHRcdGlmICghdGFiSWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ01pc3NpbmcgdGFiSWQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGF3YWl0IGNocm9tZS50YWJzLnJlbW92ZSh0YWJJZClcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGF0YTogeyB0YWJJZCwgY2xvc2VkOiB0cnVlIH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gPT09PT09PT09PT09IEFnZW50IEFQSSA9PT09PT09PT09PT1cblxuXHRcdFx0XHRcdC8vIOWQr+WKqCBBZ2VudFxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdBR0VOVF9TVEFSVCcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgYWdlbnRJZCwgdGFzaywgY29uZmlnIH0gPSBtZXNzYWdlLnBheWxvYWRcblxuXHRcdFx0XHRcdFx0aWYgKCFhZ2VudElkIHx8ICF0YXNrIHx8ICFjb25maWcpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ01pc3NpbmcgYWdlbnRJZCwgdGFzaywgb3IgY29uZmlnJyxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyDmo4Dmn6XmmK/lkKblt7LmnInov5DooYzkuK3nmoQgYWdlbnRcblx0XHRcdFx0XHRcdGlmIChydW5uaW5nQWdlbnRzLmhhcyhhZ2VudElkKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBgQWdlbnQgJHthZ2VudElkfSBpcyBhbHJlYWR5IHJ1bm5pbmdgLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRjaGFsay5tYWdlbnRhLmJvbGQoXG5cdFx0XHRcdFx0XHRcdFx0YFxcbvCfpJYgU3RhcnRpbmcgYWdlbnQgJHthZ2VudElkfS4uLlxcbmAsXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHQpXG5cblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdC8vIOWIm+W7uuW5tuWQr+WKqCBhZ2VudO+8iOW8guatpeaJp+ihjO+8iVxuXHRcdFx0XHRcdFx0XHRjb25zdCBhZ2VudCA9IG5ldyBCcm93c2VyQWdlbnQoXG5cdFx0XHRcdFx0XHRcdFx0Y29uZmlnIGFzIEFnZW50Q29uZmlnLFxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdHJ1bm5pbmdBZ2VudHMuc2V0KGFnZW50SWQsIGFnZW50KVxuXG5cdFx0XHRcdFx0XHRcdC8vIOW8guatpeaJp+ihjOS7u+WKoe+8jOS4jemYu+WhnuWTjeW6lFxuXHRcdFx0XHRcdFx0XHRhZ2VudFxuXHRcdFx0XHRcdFx0XHRcdC5leGVjdXRlKHRhc2spXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNoYWxrLmdyZWVuLmJvbGQoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YFxcbuKchSBBZ2VudCAke2FnZW50SWR9IGNvbXBsZXRlZFxcbmAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2hhbGsuZ3JheSgnICAgUmVzdWx0OicpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXN1bHQsXG5cdFx0XHRcdFx0XHRcdFx0XHQpXG5cblx0XHRcdFx0XHRcdFx0XHRcdC8vIOS7u+WKoeWujOaIkOWQjuS7jiBtYXAg5Lit56e76ZmkXG5cdFx0XHRcdFx0XHRcdFx0XHRydW5uaW5nQWdlbnRzLmRlbGV0ZShhZ2VudElkKVxuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyDpgJrnn6UgVUnvvIjlpoLmnpzmnInnmoTor53vvIlcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIFx0dHlwZTogJ0FHRU5UX0NPTVBMRVRFRCcsXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBcdGFnZW50SWQsXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBcdHJlc3VsdCxcblx0XHRcdFx0XHRcdFx0XHRcdC8vIH0pXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjaGFsay5yZWQuYm9sZChcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRgXFxu4p2MIEFnZW50ICR7YWdlbnRJZH0gZXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1cXG5gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0cnVubmluZ0FnZW50cy5kZWxldGUoYWdlbnRJZClcblx0XHRcdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRhZ2VudElkLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhdHVzOiAnc3RhcnRlZCcsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3I6IGFueSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdGVycm9yOiBlcnJvci5tZXNzYWdlLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8g6I635Y+WIEFnZW50IOeKtuaAgVxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdBR0VOVF9TVEFUVVMnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IGFnZW50SWQgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIWFnZW50SWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ01pc3NpbmcgYWdlbnRJZCcsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgYWdlbnQgPSBydW5uaW5nQWdlbnRzLmdldChhZ2VudElkKVxuXHRcdFx0XHRcdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0XHRcdFx0YWdlbnRJZCxcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXR1czogJ25vdF9mb3VuZCcsXG5cdFx0XHRcdFx0XHRcdFx0XHRydW5uaW5nOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdHN1Y2Nlc3M6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRcdFx0XHRhZ2VudElkLFxuXHRcdFx0XHRcdFx0XHRcdHN0YXR1czogJ3J1bm5pbmcnLFxuXHRcdFx0XHRcdFx0XHRcdHJ1bm5pbmc6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0c3RlcHM6IGFnZW50LmdldEhpc3RvcnkoKS5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0dG90YWxUb2tlbnM6IGFnZW50LmdldFRvdGFsVG9rZW5zKCksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8g6I635Y+WIEFnZW50IOWOhuWPslxuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdBR0VOVF9ISVNUT1JZJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgeyBhZ2VudElkIH0gPSBtZXNzYWdlLnBheWxvYWRcblxuXHRcdFx0XHRcdFx0aWYgKCFhZ2VudElkKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdNaXNzaW5nIGFnZW50SWQnLFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IGFnZW50ID0gcnVubmluZ0FnZW50cy5nZXQoYWdlbnRJZClcblx0XHRcdFx0XHRcdGlmICghYWdlbnQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogYEFnZW50ICR7YWdlbnRJZH0gbm90IGZvdW5kYCxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRcdFx0YWdlbnRJZCxcblx0XHRcdFx0XHRcdFx0XHRoaXN0b3J5OiBhZ2VudC5nZXRIaXN0b3J5KCksXG5cdFx0XHRcdFx0XHRcdFx0dG90YWxUb2tlbnM6IGFnZW50LmdldFRvdGFsVG9rZW5zKCksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8g5YGc5q2iIEFnZW5077yI55uu5YmN5pqC5LiN5pSv5oyB77yM5Zug5Li66ZyA6KaB5a6e546w5Lit5pat6YC76L6R77yJXG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2UudHlwZSA9PT0gJ0FHRU5UX1NUT1AnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB7IGFnZW50SWQgfSA9IG1lc3NhZ2UucGF5bG9hZFxuXG5cdFx0XHRcdFx0XHRpZiAoIWFnZW50SWQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRlcnJvcjogJ01pc3NpbmcgYWdlbnRJZCcsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gVE9ETzog5a6e546wIGFnZW50IOS4reaWremAu+i+kVxuXHRcdFx0XHRcdFx0cnVubmluZ0FnZW50cy5kZWxldGUoYWdlbnRJZClcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0XHRcdGFnZW50SWQsXG5cdFx0XHRcdFx0XHRcdFx0c3RhdHVzOiAnc3RvcHBlZCcsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXJyb3I6ICdVbmtub3duIG1lc3NhZ2UgdHlwZScsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0Y2hhbGsucmVkLmJvbGQoJ1xcbuKdjCBFcnJvciBwcm9jZXNzaW5nIG1lc3NhZ2U6JyksXG5cdFx0XHRcdFx0XHRlcnJvcixcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRcdFx0ZXJyb3I6XG5cdFx0XHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0XHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0XHRcdFx0XHQ6IFN0cmluZyhlcnJvciksXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIOW8guatpeWkhOeQhuW5tuWPkemAgeWTjeW6lFxuXHRcdFx0aGFuZGxlTWVzc2FnZSgpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG5cdFx0XHRcdGxvZ01lc3NhZ2UoJ291dGdvaW5nJywgbWVzc2FnZS50eXBlLCB7XG5cdFx0XHRcdFx0c3VjY2VzczogcmVzcG9uc2Uuc3VjY2Vzcyxcblx0XHRcdFx0XHRkYXRhOiAocmVzcG9uc2UgYXMgYW55KS5kYXRhLFxuXHRcdFx0XHRcdGVycm9yOiAocmVzcG9uc2UgYXMgYW55KS5lcnJvcixcblx0XHRcdFx0fSlcblx0XHRcdFx0c2VuZFJlc3BvbnNlKHJlc3BvbnNlKVxuXHRcdFx0fSlcblx0XHRcdHJldHVybiB0cnVlIC8vIOS/neaMgea2iOaBr+mAmumBk+W8gOWQr+S7peaUr+aMgeW8guatpeWTjeW6lFxuXHRcdH0sXG5cdClcbn0pXG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sIm5hbWVzIjpbImNvZGUiLCJzdHlsZXMiLCJyZXN1bHQiLCJicmFuZCIsImNoYWxrIiwibGV2ZWwiLCJhcmdzIiwidGFiSWQiLCJhY3RpdmVUYWIiLCJyZXN1bHRzIiwiYnJvd3NlciIsIl9icm93c2VyIl0sIm1hcHBpbmdzIjoiOztBQUFPLFdBQVMsaUJBQWlCLEtBQUs7QUFDcEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBRztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQ0hBLFFBQU0seUJBQXlCO0FBRS9CLFFBQU0sYUFBYSxDQUFDLFNBQVMsTUFBTSxDQUFBQSxVQUFRLFFBQVVBLFFBQU8sTUFBTTtBQUVsRSxRQUFNLGNBQWMsQ0FBQyxTQUFTLE1BQU0sQ0FBQUEsVUFBUSxRQUFVLEtBQUssTUFBTSxNQUFNQSxLQUFJO0FBRTNFLFFBQU0sY0FBYyxDQUFDLFNBQVMsTUFBTSxDQUFDLEtBQUssT0FBTyxTQUFTLFFBQVUsS0FBSyxNQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxJQUFJO0FBRXpHLFFBQU1DLFdBQVM7QUFBQSxJQUNkLFVBQVU7QUFBQSxNQUNULE9BQU8sQ0FB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SyxtQkFBbUIsS0FBSyxJQUFJLFFBQVE7QUFBQSxJQUNoSDtBQUFBLElBQ0EsWUFBWSxLQUFLO0FBQ2YsWUFBTSxNQUFNLHFFQUFxRTtBQUFBLElBQ25GO0FBQUEsSUFDQSxXQUFXLEtBQUs7QUFDZCxZQUFNLE1BQU0sb0VBQW9FO0FBQUEsSUFDbEY7QUFBQSxJQUNBLFdBQVcsS0FBSztBQUNkLFlBQU0sTUFBTSxvRUFBb0U7QUFBQSxJQUNsRjtBQUFBLElBQ0Esc0JBQXNCLFNBQVM7QUFDN0IsWUFBTSxVQUFVLEtBQUssZUFBZSxPQUFPO0FBQzNDLFlBQU0sZ0JBQWdCLFFBQVEsUUFBUSxTQUFTLElBQUk7QUFDbkQsYUFBTyxPQUFPLElBQUksYUFBYSxHQUFHO0FBQUEsSUFDcEM7QUFBQSxJQUNBLGVBQWUsUUFBUTtBQUNyQixhQUFPLE9BQU8sUUFBUSx1QkFBdUIsTUFBTTtBQUFBLElBQ3JEO0FBQUEsRUFDRjtBQUNBLE1BQUksZUFBZTtBQUNuQixlQUFhLFlBQVksQ0FBQyxRQUFRLFNBQVMsUUFBUSxPQUFPLEtBQUs7QUFDL0QsTUFBSSxzQkFBc0IsY0FBYyxNQUFNO0FBQUEsSUFDNUMsWUFBWSxjQUFjLFFBQVE7QUFDaEMsWUFBTSwwQkFBMEIsWUFBWSxNQUFNLE1BQU0sRUFBRTtBQUFBLElBQzVEO0FBQUEsRUFDRjtBQUNBLFdBQVMsaUJBQWlCLGNBQWMsVUFBVTtBQUNoRCxRQUFJLENBQUMsYUFBYSxVQUFVLFNBQVMsUUFBUSxLQUFLLGFBQWE7QUFDN0QsWUFBTSxJQUFJO0FBQUEsUUFDUjtBQUFBLFFBQ0EsR0FBRyxRQUFRLDBCQUEwQixhQUFhLFVBQVUsS0FBSyxJQUFJLENBQUM7QUFBQSxNQUM1RTtBQUFBLEVBQ0E7QUFDQSxXQUFTLGlCQUFpQixjQUFjLFVBQVU7QUFDaEQsUUFBSSxTQUFTLFNBQVMsR0FBRztBQUN2QixZQUFNLElBQUksb0JBQW9CLGNBQWMsZ0NBQWdDO0FBQzlFLFFBQUksU0FBUyxTQUFTLEdBQUcsS0FBSyxTQUFTLFNBQVMsS0FBSyxDQUFDLFNBQVMsV0FBVyxJQUFJO0FBQzVFLFlBQU0sSUFBSTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsTUFDTjtBQUFBLEVBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDIsMyw0LDksMTAsMTFdfQ==
