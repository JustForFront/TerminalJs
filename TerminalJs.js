define(["require", "exports"], function (require, exports) {
    var log = console.log;
    var TerminalJs = (function () {
        function TerminalJs() {
            this.StateTypes = TerminalJs.StateTypes;
            this.States = {};
            this.StatesVals = {};
            this.PresetStateUrl = {};
            this.Keyword = "$";
            this.UrlSpiltter = "/index.html";
            this.urlParts = {};
            this.history = [];
            this.historyPosition = 0;
            /*private*/ this.callbacks = [];
            /*private*/ this.callbackCount = 0;
            /*private*/ this.forceMode = "";
            /*private*/ this.forceUpdateList = {};
            /*private*/ this.hashNumber = 0;
            /*private*/ this.initalized = false;
        }
        TerminalJs.prototype.UrlParams = function (url) {
            if (url === void 0) { url = location.href; }
            var q = url.split("?"), query_string = {}, query = q.length == 1 ? "" : q[1], vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                if (typeof query_string[pair[0]] === "undefined") {
                    query_string[pair[0]] = decodeURIComponent(pair[1]);
                }
                else if (typeof query_string[pair[0]] === "string") {
                    var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
                    query_string[pair[0]] = arr;
                }
                else {
                    query_string[pair[0]].push(decodeURIComponent(pair[1]));
                }
            }
            return query_string;
        };
        TerminalJs.prototype.Init = function () {
            var url = this.getUrl();
            if (url) {
                (new TerminalJsFlow(url, TerminalJsFlow.CmdSrcs.Url)).Start();
            }
            this.DefaultValToUrl();
            this.initalized = true;
            return this;
        };
        TerminalJs.prototype.historyHandler = function (newUrl, presetDirection) {
            if (presetDirection === void 0) { presetDirection = 0; }
            var isBack = presetDirection === -1, list = this.history, pos = this.historyPosition, l = list.length;
            this.incomingUrl = newUrl;
            if (isBack) {
                if (pos == l - 1) {
                    list.push(newUrl);
                }
                this.historyPosition++;
            }
            else {
                if (pos != 0) {
                    this.historyPosition = 0;
                    list.splice(0, pos);
                }
                list.unshift(newUrl);
            }
            return isBack;
        };
        TerminalJs.prototype.AddState = function (stateName, defaultVal, OnChanged, isPushUrl, type) {
            if (defaultVal === void 0) { defaultVal = null; }
            if (OnChanged === void 0) { OnChanged = null; }
            if (isPushUrl === void 0) { isPushUrl = true; }
            if (type === void 0) { type = TerminalJs.StateTypes.Auto; }
            var oJson = "", that = this, stateTypes = this.StateTypes, vals = this.StatesVals, onChanged = function (newVal) {
                if (this.forceMode == "") {
                    oJson = "";
                    that.ToUrl(stateName, newVal, isPushUrl);
                    vals[stateName].callback(newVal, that.historyHandler(that.currentUrl, 1));
                    that.Callback(stateName, newVal, false);
                }
                else {
                    that.forceUpdateList[stateName] = function (isBack) {
                        vals[stateName].callback(newVal, isBack);
                        that.Callback(stateName, newVal, isBack);
                    };
                }
            };
            if (type == stateTypes.Auto) {
                type = this.parseValType(defaultVal);
            }
            vals[stateName] = new TerminalJsValue(stateName, null, defaultVal, type, isPushUrl, OnChanged ? [OnChanged] : []);
            Object.defineProperty(this.States, stateName, {
                get: function () {
                    if (type > stateTypes.Number || type < stateTypes.HiddenNumber) {
                        if (that.forceMode == "") {
                            oJson = JSON.stringify(vals[stateName].value);
                            setTimeout(function () {
                                if (oJson && JSON.stringify(vals[stateName].value) != oJson) {
                                    onChanged(vals[stateName].value);
                                }
                            }, 1);
                        }
                        else {
                            that.forceUpdateList[stateName] = function (isBack) {
                                vals[stateName].callback(vals[stateName].value, isBack);
                                that.Callback(stateName, vals[stateName].value, isBack);
                            };
                        }
                    }
                    return vals[stateName].value;
                },
                set: function (newVal) {
                    if (!(newVal instanceof TerminalJs) && vals[stateName].value != newVal) {
                        vals[stateName].value = newVal;
                        onChanged(newVal);
                    }
                },
                enumerable: true,
                configurable: true
            });
            if (this.initalized) {
                var isPush = isPushUrl, preUrl = this.PresetStateUrl[stateName];
                vals[stateName].isPushUrl = isPushUrl = false;
                if (preUrl) {
                    (new TerminalJsFlow(preUrl, TerminalJsFlow.CmdSrcs.Cmd, 1)).Start("replaceUrl");
                }
                else {
                    this.States[stateName] = defaultVal;
                }
                vals[stateName].isPushUrl = isPushUrl = isPush;
            }
            return this;
        };
        TerminalJs.prototype.AddCallback = function (stateNameStartToAll, callback) {
            if (stateNameStartToAll == "*") {
                this.callbacks.push(callback);
                this.callbackCount++;
            }
            else {
                this.StatesVals[stateNameStartToAll].AddCallback(callback);
            }
            return this;
        };
        TerminalJs.prototype.RemoveCallback = function (stateNameStartToAll, callback) {
            if (stateNameStartToAll == "*") {
                this.callbacks.splice(this.callbacks.indexOf(callback), 1);
                this.callbackCount--;
            }
            else {
                this.StatesVals[stateNameStartToAll].RemoveCallback(callback);
            }
            return this;
        };
        TerminalJs.prototype.Callback = function (stateName, val, isBack) {
            var i, callbacks;
            if (this.callbackCount) {
                callbacks = this.callbacks;
                for (i in callbacks) {
                    callbacks[i](val, isBack, stateName);
                }
            }
        };
        TerminalJs.prototype.StateExist = function (stateName) {
            return this.StatesVals[stateName] != undefined;
        };
        TerminalJs.prototype.GetStateValue = function (stateName) {
            var stateVal = this.StatesVals[stateName];
            return stateVal ? stateVal.value : undefined;
        };
        /*private*/ TerminalJs.prototype.parseValType = function (val) {
            var types = this.StateTypes, i;
            switch (typeof val) {
                case "object":
                    if (val instanceof Array) {
                        return types.Array;
                    }
                    else {
                        for (i in val) {
                            return val[i] instanceof Array ? types.Tree : types.Object;
                        }
                    }
                case "boolean":
                    return types.Boolean;
                case "number":
                    return types.Number;
                default:
                    return types.String;
            }
        };
        /*private*/ TerminalJs.prototype.formatValUrl = function (stateName, stateVal) {
            if (stateVal === null || stateVal === undefined) {
                return "";
            }
            var type = this.StatesVals[stateName].type, types = this.StateTypes, t;
            if (type < types.Auto) {
                return "";
            }
            stateName = stateName == "main" ? "" : stateName + "/";
            switch (type) {
                case types.String:
                    return stateName + this.encodeKeyword(stateVal.replace(/^\/|\/$/g, "")) + "";
                case types.Number:
                    return stateName + stateVal + "";
                case types.Boolean:
                    return stateName + (stateVal ? "true" : "false");
                case types.Array:
                    t = typeof stateVal[0];
                    if (t == "string") {
                        return stateName + stateVal.map(encodeURIComponent).join(",");
                    }
                    else if (t == undefined || t == "number") {
                        return stateName + stateVal.join(",");
                    }
                default:
                    var res = [], isTree = true;
                    for (var i in stateVal) {
                        if (stateVal[i] instanceof Array) {
                            res.push(i + "/" + stateVal[i].map(encodeURIComponent).join(","));
                        }
                        else {
                            isTree = false;
                            break;
                        }
                    }
                    if (isTree) {
                        return stateName + res.join("/");
                    }
                    return stateName + encodeURIComponent(JSON.stringify(stateVal));
            }
        };
        /*private*/ TerminalJs.prototype.getFullUrl = function () {
            var parts = this.urlParts, url = [], keyword = this.Keyword;
            for (var i in parts) {
                url.push((i == "main" ? "" : keyword) + parts[i]);
            }
            this.currentUrl = "/" + url.join("/");
            return this.currentUrl;
        };
        TerminalJs.prototype.DefaultValToUrl = function () {
            var that = this;
            this.ForceReplaceUrl(function () {
                var i, parts = that.urlParts, vals = that.StatesVals;
                for (i in vals) {
                    if (parts[i] == undefined) {
                        that.forceUpdateList[i] = vals[i].SetDefault();
                    }
                }
            });
        };
        TerminalJs.prototype.PrepareStateUrl = function (stateName, stateVal) {
            var url = this.formatValUrl(stateName, stateVal);
            if (url) {
                this.urlParts[stateName] = url;
            }
            else {
                delete this.urlParts[stateName];
            }
        };
        TerminalJs.prototype.ToUrl = function (stateName, stateVal, isPush) {
            if (isPush === void 0) { isPush = true; }
            this.PrepareStateUrl(stateName, stateVal);
            if (isPush) {
                this.pushUrl(this.getFullUrl());
            }
            else {
                this.replaceUrl(this.getFullUrl());
            }
        };
        TerminalJs.prototype.GetCurrentUrl = function () {
            return this.currentUrl;
        };
        TerminalJs.prototype.getUrl = function (url) {
            if (url === void 0) { url = location.href; }
            var urls = url.split(this.UrlSpiltter);
            return urls.length == 1 ? "" : urls.slice(1).join(this.UrlSpiltter);
        };
        TerminalJs.prototype.MonitorDom = function (dom) {
            if (dom === void 0) { dom = document.body; }
            var that = this, keyword = that.Keyword;
            dom.addEventListener("click", function (e) {
                var dom = e.target;
                if (dom && dom.matches("a,a *")) {
                    e.preventDefault();
                    e.stopPropagation();
                    while (dom.tagName != "A") {
                        dom = dom.parentElement;
                    }
                    var url = dom.getAttribute("href"), classlist = dom.classList;
                    if (!classlist.contains("external")) {
                        if (url.indexOf("/") == 0 || url.indexOf(keyword) == 0 ||
                            (url.indexOf("://") !== -1 &&
                                url.indexOf("http://") !== 0 &&
                                url.indexOf("https://") !== 0 &&
                                url.indexOf("ftp://") !== 0 &&
                                url.indexOf("file://") !== 0 &&
                                url.indexOf("//") !== 0)) {
                            that.ExeCmd(url, classlist.contains("back"));
                            return false;
                        }
                    }
                    location.href = url;
                }
                return false;
            });
            return this;
        };
        TerminalJs.prototype.ExeCmd = function (cmd, isBack, forceMode) {
            if (isBack === void 0) { isBack = false; }
            if (forceMode === void 0) { forceMode = TerminalJs.ForceModes.Auto; }
            (new TerminalJsFlow(cmd, TerminalJsFlow.CmdSrcs.Cmd, isBack ? -1 : 1)).Start(forceMode);
        };
        TerminalJs.prototype.MonitorUrl = function () {
            var that = this, hashRx = new RegExp("\\" + this.Keyword + "([0-9]+)$"), checkDirection = function (hashStr) {
                var res;
                if (hashStr) {
                    res = Number(hashStr) < that.hashNumber ? -1 : 1;
                    that.hashNumber = Number(hashStr);
                }
                else {
                    res = that.hashNumber == 0 ? 0 : -1;
                    that.hashNumber = 0;
                }
                return res;
            };
            window.onpopstate = function () {
                var url = that.getUrl(), params;
                if (that.currentUrl != url) {
                    params = hashRx.exec(url);
                    (new TerminalJsFlow(url, TerminalJsFlow.CmdSrcs.Url, checkDirection(params ? params[1] : null))).Start();
                }
            };
            return this;
        };
        TerminalJs.prototype.ProcessFlow = function (flow) {
            var url;
            if (flow.Src == TerminalJsFlow.CmdSrcs.Cmd) {
                url = this.getFullUrl();
                if (flow.IsPushUrl) {
                    this.pushUrl(url);
                }
                else {
                    this.replaceUrl(url);
                }
            }
            else {
                url = this.currentUrl = flow.Url;
            }
            flow.DoChangeCallbacks(this.historyHandler(url, flow.PresetDirection));
        };
        /*private*/ TerminalJs.prototype.pushUrl = function (url) {
            this.hashNumber++;
            history.pushState({}, document.title, this.UrlSpiltter + url + this.Keyword + this.hashNumber);
        };
        /*private*/ TerminalJs.prototype.replaceUrl = function (url) {
            history.replaceState({}, document.title, this.UrlSpiltter + url + (this.hashNumber ? this.Keyword + this.hashNumber : ""));
        };
        TerminalJs.prototype.ForcePushUrl = function (urlOrModfunc, isBack) {
            if (isBack === void 0) { isBack = false; }
            this.forceMod("pushUrl", urlOrModfunc, isBack);
        };
        TerminalJs.prototype.ForceReplaceUrl = function (urlOrModfunc, isBack) {
            if (isBack === void 0) { isBack = false; }
            this.forceMod("replaceUrl", urlOrModfunc, isBack);
        };
        /*private*/ TerminalJs.prototype.forceMod = function (mode, urlOrModfunc, isBack) {
            if (isBack === void 0) { isBack = false; }
            this.forceMode = mode;
            this.forceUpdateList = {};
            if (typeof urlOrModfunc == "string") {
                (new TerminalJsFlow(String(urlOrModfunc), TerminalJsFlow.CmdSrcs.Cmd, isBack ? -1 : 1)).Start(mode);
            }
            else {
                urlOrModfunc(this.States);
                this.forceUpdateUrl(isBack);
            }
            this.forceMode = "";
        };
        TerminalJs.prototype.forceUpdateUrl = function (isBack) {
            if (isBack === void 0) { isBack = false; }
            var that = this, list = this.forceUpdateList, i, stateVals = this.StatesVals;
            for (i in list) {
                this.PrepareStateUrl(i, stateVals[i].value);
            }
            that[this.forceMode](this.getFullUrl());
            for (i in list) {
                if (list[i]) {
                    list[i](isBack);
                }
            }
            this.forceUpdateList = null;
        };
        TerminalJs.prototype.encodeKeyword = function (str) {
            var keyword = this.Keyword, rx = new RegExp("\\" + keyword, "g");
            return str.replace(rx, encodeURIComponent(keyword));
        };
        TerminalJs.prototype.decodeKeyword = function (str) {
            var keyword = this.Keyword, rx = new RegExp("\\" + encodeURIComponent(keyword), "g");
            return str.replace(rx, keyword);
        };
        TerminalJs.StateTypes = { "HiddenTree": -6, "HiddenArray": -5, "HiddenObject": -4, "HiddenNumber": -3, "HiddenBoolean": -2, "HiddenString": -1,
            "Auto": 0, "String": 1, "Boolean": 2, "Number": 3, "Object": 4, "Array": 5, "Tree": 6 };
        TerminalJs.ForceModes = { Replace: "replaceUrl", Push: "pushUrl", Auto: "" };
        return TerminalJs;
    }());
    var TerminalJsFlow = (function () {
        function TerminalJsFlow(url, src, presetDirection) {
            if (presetDirection === void 0) { presetDirection = 0; }
            this.IsBack = false;
            this.IsPushUrl = false;
            this.ValueAfter = {};
            this.Url = url;
            this.Src = src;
            this.PresetDirection = presetDirection;
            this.TerminalJs = terminalJs;
        }
        TerminalJsFlow.prototype.Start = function (forceMod) {
            if (forceMod === void 0) { forceMod = ""; }
            this.parseValue();
            this.applyValueAndSetIfPush(forceMod);
            this.TerminalJs.ProcessFlow(this);
        };
        TerminalJsFlow.prototype.applyValueAndSetIfPush = function (forceMod) {
            var statesValue = this.TerminalJs.StatesVals, valueAfter = this.ValueAfter, i, isPush = false;
            if (this.Src == TerminalJsFlow.CmdSrcs.Url) {
                for (i in statesValue) {
                    if (valueAfter[i] == undefined) {
                        if (statesValue[i].type < 0) {
                            continue;
                        }
                        valueAfter[i] = null;
                    }
                    statesValue[i].value = valueAfter[i];
                    isPush = isPush || statesValue[i].isPushUrl;
                    this.TerminalJs.PrepareStateUrl(i, valueAfter[i]);
                }
            }
            else {
                for (i in valueAfter) {
                    statesValue[i].value = valueAfter[i];
                    isPush = isPush || statesValue[i].isPushUrl;
                    this.TerminalJs.PrepareStateUrl(i, valueAfter[i]);
                }
            }
            this.IsPushUrl = forceMod == TerminalJs.ForceModes.Auto ? isPush : (forceMod == TerminalJs.ForceModes.Replace ? false : true);
        };
        TerminalJsFlow.prototype.DoChangeCallbacks = function (isBack) {
            var statesValue = this.TerminalJs.StatesVals, valueAfter = this.ValueAfter, i;
            for (i in valueAfter) {
                if (statesValue[i]) {
                    statesValue[i].callback(valueAfter[i], isBack);
                    terminalJs.Callback(i, valueAfter[i], isBack);
                }
            }
        };
        TerminalJsFlow.prototype.parseValue = function () {
            var url = this.Url, keyword = this.TerminalJs.Keyword, rx = new RegExp("(\\" + keyword + "([^\/]+)\/([^\\" + keyword + "]*))", "g"), match, urls = url.split(keyword);
            if (urls[0]) {
                this.ValueFormUrl("main", urls[0].replace(/^\/|\/$/g, ""));
            }
            while ((match = rx.exec(url)) != null) {
                this.ValueFormUrl(match[2], match[3].replace(/\/$/, ""));
            }
        };
        TerminalJsFlow.prototype.optionValueFromUrl = function (type, valStr, stateNode) {
            var types = this.TerminalJs.StateTypes, i, c, res, arraySub = function (target, src) {
                var i, c, pos;
                for (i = 0, c = src.length; i < c; i++) {
                    pos = target.indexOf(decodeURIComponent(src[i]));
                    if (pos !== -1) {
                        target.splice(pos, 1);
                    }
                }
            }, arrayToggle = function (target, src) {
                var i, c, pos;
                for (i = 0, c = src.length; i < c; i++) {
                    src[i] = decodeURIComponent(src[i]);
                    pos = target.indexOf(src[i]);
                    if (pos === -1) {
                        target.push(src[i]);
                    }
                    else {
                        target.splice(pos, 1);
                    }
                }
            }, arrayAdd = function (target, src) {
                var i, c;
                for (i = 0, c = src.length; i < c; i++) {
                    target.push(decodeURIComponent(src[i]));
                }
            }, vals, nodes, params;
            switch (type) {
                case types.Tree || types.HiddenTree:
                    params = valStr.split("/");
                    for (i = 0, c = params.length; i < c; i += 2) {
                        vals = params[(i + 1)].substr(1).split(",");
                        if (stateNode[params[i]]) {
                            nodes = stateNode[params[i]];
                        }
                        else {
                            nodes = [];
                            stateNode[params[i]] = nodes;
                        }
                        if (params[(i + 1)].indexOf("-") === 0) {
                            arraySub(nodes, vals);
                        }
                        else if (params[(i + 1)].indexOf("+") === 0) {
                            arrayAdd(nodes, vals);
                        }
                        else {
                            arrayToggle(nodes, vals);
                        }
                    }
                    break;
                case types.Object || types.HiddenObject:
                    params = valStr.split("/");
                    for (i = 0, c = params.length; i < c; i += 2) {
                        vals = params[(i + 1)].substr(1).split(",");
                        res = TerminalJsFlow.CmdObjectInDepth(params[i], stateNode);
                        if (res.Object[res.LastKey]) {
                            nodes = res.Object[res.LastKey];
                        }
                        else {
                            nodes = [];
                            res.Object[res.LastKey] = nodes;
                        }
                        if (params[(i + 1)].indexOf("-") === 0) {
                            arraySub(nodes, vals);
                        }
                        else if (params[(i + 1)].indexOf("*") === 0) {
                            arrayAdd(nodes, vals);
                        }
                        else {
                            arrayToggle(nodes, vals);
                        }
                    }
                    break;
                default:
                    vals = valStr.substr(1).split(",");
                    if (valStr.indexOf("-") === 0) {
                        arraySub(stateNode, vals);
                    }
                    else if (valStr.indexOf("+") === 0) {
                        arrayAdd(stateNode, vals);
                    }
                    else {
                        arrayToggle(stateNode, vals);
                    }
            }
        };
        TerminalJsFlow.prototype.ValueFormUrl = function (stateName, stateValue) {
            var TerminalJs = this.TerminalJs, stateVal = TerminalJs.StatesVals[stateName], val, res, i, c;
            if (stateVal != undefined) {
                val = this.ValueAfter[stateName] === undefined ? stateVal.value : this.ValueAfter[stateName];
                if (TerminalJs.urlParts[stateName] != stateName + "/" + stateValue) {
                    var type = stateVal.type, types = TerminalJs.StateTypes, valStr = stateValue, nodes;
                    if (stateValue == "") {
                        val = null;
                    }
                    else if ((type > types.Number || type < types.HiddenNumber) && /(?:^[\!\-\+]|\/[\!\-\+])/.test(valStr)) {
                        if (val === null || val === undefined) {
                            val = type === 4 ? [] : {};
                        }
                        else {
                            val = JSON.parse(JSON.stringify(val));
                        }
                        this.optionValueFromUrl(type, valStr, val);
                    }
                    else {
                        switch (type) {
                            case types.String || types.HiddenString:
                                if (valStr.indexOf("!") === 0) {
                                    valStr = decodeURIComponent(valStr.substr(1));
                                    val = valStr == val ? null : valStr;
                                }
                                else {
                                    val = terminalJs.decodeKeyword(decodeURIComponent(valStr ? valStr : null));
                                }
                                break;
                            case types.Number || types.HiddenNumber:
                                val = Number(valStr);
                                break;
                            case types.Boolean || types.HiddenBoolean:
                                val = valStr == "toggle" ? !val : valStr == "true";
                                break;
                            case types.Array || types.HiddenArray:
                                val = valStr ? valStr.split(",").map(decodeURIComponent) : [];
                                break;
                            case types.Tree || types.HiddenTree:
                                if (valStr) {
                                    val = val ? val : {};
                                    nodes = valStr.split("/");
                                    for (i = 0, c = nodes.length; i < c; i += 2) {
                                        val[nodes[i]] = nodes[(i + 1)] ? nodes[(i + 1)].split(",").map(decodeURIComponent) : [];
                                    }
                                }
                                else {
                                    val = {};
                                }
                                break;
                            default:
                                if (valStr.indexOf("%7B") == 0 || valStr.indexOf("%5B") == 0) {
                                    val = JSON.parse(decodeURIComponent(valStr).trim());
                                }
                                else {
                                    val = val ? val : {};
                                    nodes = valStr.split("/");
                                    for (i = 0, c = nodes.length; i < c; i += 2) {
                                        res = TerminalJsFlow.CmdObjectInDepth(nodes[i], val);
                                        res.Object[res.LastKey] = nodes[(i + 1)];
                                    }
                                }
                        }
                    }
                    this.ValueAfter[stateName] = val;
                }
                else if (this.Src == TerminalJsFlow.CmdSrcs.Url) {
                    this.ValueAfter[stateName] = val;
                }
            }
            else {
                this.TerminalJs.PresetStateUrl[stateName] = this.TerminalJs.Keyword + stateName + "/" + stateValue;
            }
        };
        TerminalJsFlow.CmdObjectInDepth = function (keyCmd, Obj) {
            var keys = keyCmd.split("."), i = 0, c = keys.length - 1;
            for (; i < c; i++) {
                if (!Obj[keys[i]]) {
                    Obj[keys[i]] = {};
                }
                Obj = Obj[keys[i]];
            }
            return { LastKey: keys[c], Object: Obj };
        };
        TerminalJsFlow.CmdSrcs = { Cmd: 1, Url: 0 };
        return TerminalJsFlow;
    }());
    exports.TerminalJsFlow = TerminalJsFlow;
    var TerminalJsValue = (function () {
        function TerminalJsValue(name, value, defaultValue, type, isPushUrl, callbacks) {
            /*private*/ this.callbackCount = 0;
            this.name = name;
            this.value = value;
            this.callbacks = callbacks;
            this.default = defaultValue;
            this.isPushUrl = isPushUrl;
            this.type = type;
            if (callbacks) {
                this.callbackCount = 1;
            }
        }
        TerminalJsValue.prototype.callback = function (newVal, isBack) {
            var callbacks, i, c, name;
            if (this.callbackCount) {
                callbacks = this.callbacks;
                name = this.name;
                for (i = 0, c = callbacks.length; i < c; i++) {
                    callbacks[i](newVal, isBack, name);
                }
            }
        };
        TerminalJsValue.prototype.AddCallback = function (callback) {
            this.callbacks.push(callback);
            this.callbackCount++;
        };
        TerminalJsValue.prototype.RemoveCallback = function (callback) {
            this.callbacks.splice(this.callbacks.indexOf(callback), 1);
            this.callbackCount--;
        };
        TerminalJsValue.prototype.SetDefault = function () {
            var that = this;
            if (typeof this.default == "function") {
                this.checkValue();
                return null;
            }
            else {
                this.value = this.default;
                return function (isBack) {
                    that.callback(that.default, isBack);
                    terminalJs.Callback(that.name, that.value, isBack);
                };
            }
        };
        /*private*/ TerminalJsValue.prototype.checkValue = function () {
            var that = this;
            this.default(function (res, retryTime) {
                that.value = res;
                that.callback(res, false);
                if (retryTime) {
                    setTimeout(function () {
                        that.checkValue();
                    }, retryTime);
                }
            });
        };
        return TerminalJsValue;
    }());
    var terminalJs = new TerminalJs();
    exports.terminalJs = terminalJs;
});
