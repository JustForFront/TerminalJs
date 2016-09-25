define(["require", "exports"], function (require, exports) {
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
            this.callbacks = [];
            this.callbackCount = 0;
            this.forceMode = "";
            this.forceUpdateList = {};
            this.hashNumber = 0;
            this.initalized = false;
        }
        TerminalJs.prototype.UrlParams = function (url) {
            if (url === void 0) { url = location.href; }
            var q = url.split("?"), query_string = {}, query = q.length == 1 ? "" : q[1].substring(1), vars = query.split("&");
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
            var that = this;
            (new TerminalJsFlow(that.getCurrentUrl(), TerminalJsFlow.CmdSrcs.Url)).Start();
            that.DefaultValToUrl();
            that.initalized = true;
            return that;
        };
        TerminalJs.prototype.historyHandler = function (newUrl, flow) {
            if (flow === void 0) { flow = null; }
            var that = this, isBack = false, list = that.history, pos = that.historyPosition, l = list.length;
            that.incomingUrl = newUrl;
            if (flow && flow.PresetDirection !== 0) {
                isBack = flow.PresetDirection === -1;
            }
            else if (l > pos && list[pos + 1] == newUrl) {
                isBack = true;
            }
            else if (pos == l - 1) {
                isBack = newUrl.length > that.currentUrl.length;
            }
            if (isBack) {
                if (pos == l - 1) {
                    list.push(newUrl);
                }
                that.historyPosition++;
            }
            else {
                list.unshift(newUrl);
            }
            return isBack;
        };
        TerminalJs.prototype.AddState = function (stateName, defaultVal, OnChanged, isPushUrl, type) {
            if (defaultVal === void 0) { defaultVal = null; }
            if (OnChanged === void 0) { OnChanged = null; }
            if (isPushUrl === void 0) { isPushUrl = true; }
            if (type === void 0) { type = TerminalJs.StateTypes.Auto; }
            var oJson = "", that = this, stateTypes = that.StateTypes, vals = that.StatesVals, onChanged = function (newVal) {
                if (that.forceMode == "") {
                    oJson = "";
                    that.ToUrl(stateName, newVal, isPushUrl);
                    if (OnChanged) {
                        OnChanged(newVal, that.historyHandler(that.currentUrl), stateName);
                    }
                }
                else {
                    that.forceUpdateList[stateName] = function () {
                        OnChanged(newVal, false, stateName);
                    };
                }
            };
            if (type == stateTypes.Auto) {
                type = that.parseValType(defaultVal);
            }
            vals[stateName] = new TerminalJsValue(stateName, null, defaultVal, type, isPushUrl, OnChanged ? [OnChanged] : []);
            Object.defineProperty(that.States, stateName, {
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
                            that.forceUpdateList[stateName] = function () {
                                OnChanged(vals[stateName].value, false, stateName);
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
            if (that.initalized) {
                var isPush = isPushUrl, preUrl = that.PresetStateUrl[stateName];
                vals[stateName].isPushUrl = isPushUrl = false;
                if (preUrl) {
                    (new TerminalJsFlow(preUrl, TerminalJsFlow.CmdSrcs.Cmd, 1)).Start("replaceUrl");
                }
                else {
                    that.States[stateName] = defaultVal;
                }
                vals[stateName].isPushUrl = isPushUrl = isPush;
            }
            return that;
        };
        TerminalJs.prototype.AddCallback = function (stateNameStartToAll, callback) {
            var that = this;
            if (stateNameStartToAll == "*") {
                that.callbacks.push(callback);
                that.callbackCount++;
            }
            else {
                that.StatesVals[stateNameStartToAll].AddCallback(callback);
            }
        };
        TerminalJs.prototype.RemoveCallback = function (stateNameStartToAll, callback) {
            var that = this;
            if (stateNameStartToAll == "*") {
                that.callbacks.splice(that.callbacks.indexOf(callback), 1);
                that.callbackCount--;
            }
            else {
                that.StatesVals[stateNameStartToAll].RemoveCallback(callback);
            }
        };
        TerminalJs.prototype.Callback = function (stateName, val, isBack) {
            var that = this, i, callbacks;
            if (that.callbackCount) {
                callbacks = that.callbacks;
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
        TerminalJs.prototype.parseValType = function (val) {
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
        TerminalJs.prototype.formatValUrl = function (stateName, stateVal) {
            if (stateVal === null || stateVal === undefined) {
                return "";
            }
            var that = this, type = that.StatesVals[stateName].type, types = that.StateTypes, t;
            if (type < types.Auto) {
                return "";
            }
            stateName = stateName == "main" ? "" : stateName + "/";
            switch (type) {
                case types.String:
                    return stateName + stateVal.replace(/^\/|\/$/, "") + "";
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
        TerminalJs.prototype.getFullUrl = function () {
            var parts = this.urlParts, url = [], keyword = this.Keyword;
            for (var i in parts) {
                url.push((i == "main" ? "" : keyword) + parts[i]);
            }
            this.currentUrl = "/" + url.join("/");
            return this.currentUrl;
        };
        TerminalJs.prototype.DefaultValToUrl = function () {
            var that = this;
            that.ForceReplaceUrl(function () {
                var i, parts = that.urlParts;
                for (i in that.StatesVals) {
                    if (parts[i] == undefined) {
                        that.forceUpdateList[i] = that.StatesVals[i].SetDefault();
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
        TerminalJs.prototype.getCurrentUrl = function () {
            var urls = location.href.split(this.UrlSpiltter);
            return urls.length == 1 ? "" : urls.slice(1).join(this.UrlSpiltter);
        };
        TerminalJs.prototype.MonitorDom = function (dom) {
            if (dom === void 0) { dom = document.body; }
            var that = this;
            dom.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                var dom = e.target;
                if (dom && dom.matches("a,a *")) {
                    while (dom.tagName != "A") {
                        dom = dom.parentElement;
                    }
                    var url = dom.getAttribute("href");
                    if (!dom.classList.contains("external")) {
                        if (url.indexOf("/") == 0 || url.indexOf(that.Keyword) == 0 ||
                            (url.indexOf("://") !== -1 &&
                                url.indexOf("http://") !== 0 &&
                                url.indexOf("https://") !== 0 &&
                                url.indexOf("ftp://") !== 0 &&
                                url.indexOf("file://") !== 0 &&
                                url.indexOf("//") !== 0)) {
                            that.ExeCmd(url, dom.classList.contains("back"));
                            return false;
                        }
                    }
                    else {
                        location.href = url;
                    }
                }
                return false;
            });
            return that;
        };
        TerminalJs.prototype.ExeCmd = function (cmd, isBack) {
            if (isBack === void 0) { isBack = false; }
            (new TerminalJsFlow(cmd, TerminalJsFlow.CmdSrcs.Cmd, isBack ? -1 : 1)).Start();
        };
        TerminalJs.prototype.MonitorUrl = function () {
            var that = this, checkDirection = function (hashStr) {
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
                var url = that.getCurrentUrl(), params;
                if (that.currentUrl != url) {
                    params = (new RegExp("\\" + that.Keyword + "([0-9]+)$")).exec(url);
                    (new TerminalJsFlow(url, TerminalJsFlow.CmdSrcs.Url, checkDirection(params ? params[1] : null))).Start();
                }
            };
            return that;
        };
        TerminalJs.prototype.ProcessFlow = function (flow) {
            var that = this, url;
            if (flow.Src == TerminalJsFlow.CmdSrcs.Cmd) {
                url = that.getFullUrl();
                if (flow.IsPushUrl) {
                    that.pushUrl(url);
                }
                else {
                    that.replaceUrl(url);
                }
            }
            else {
                url = that.currentUrl = flow.Url;
            }
            flow.DoChangeCallbacks(that.historyHandler(url, flow));
        };
        TerminalJs.prototype.pushUrl = function (url) {
            var that = this;
            that.hashNumber++;
            history.pushState({}, document.title, this.UrlSpiltter + url + that.Keyword + that.hashNumber);
        };
        TerminalJs.prototype.replaceUrl = function (url) {
            var that = this;
            history.replaceState({}, document.title, that.UrlSpiltter + url + (that.hashNumber ? that.Keyword + that.hashNumber : ""));
        };
        TerminalJs.prototype.ForcePushUrl = function (urlOrModfunc) {
            this.forceMod("pushUrl", urlOrModfunc);
        };
        TerminalJs.prototype.ForceReplaceUrl = function (urlOrModfunc) {
            this.forceMod("replaceUrl", urlOrModfunc);
        };
        TerminalJs.prototype.forceMod = function (mode, urlOrModfunc) {
            var that = this;
            that.forceMode = mode;
            that.forceUpdateList = {};
            if (typeof urlOrModfunc == "string") {
                (new TerminalJsFlow(String(urlOrModfunc), TerminalJsFlow.CmdSrcs.Cmd)).Start(mode);
            }
            else {
                urlOrModfunc(this.States);
                that.forceUpdateUrl();
            }
            that.forceMode = "";
        };
        TerminalJs.prototype.forceUpdateUrl = function () {
            var that = this, list = that.forceUpdateList, i, stateVals = that.StatesVals;
            for (i in list) {
                that.PrepareStateUrl(i, stateVals[i].value);
                if (list[i])
                    list[i]();
            }
            that[that.forceMode](that.getFullUrl());
            for (i in list) {
                if (list[i]) {
                    list[i]();
                }
            }
            this.forceUpdateList = null;
        };
        TerminalJs.StateTypes = { "HiddenTree": -6, "HiddenArray": -5, "HiddenObject": -4, "HiddenNumber": -3, "HiddenBoolean": -2, "HiddenString": -1,
            "Auto": 0, "String": 1, "Boolean": 2, "Number": 3, "Object": 4, "Array": 5, "Tree": 6 };
        return TerminalJs;
    }());
    var TerminalJsFlow = (function () {
        function TerminalJsFlow(url, src, presetDirection) {
            if (presetDirection === void 0) { presetDirection = 0; }
            this.IsBack = false;
            this.IsPushUrl = false;
            this.ValueAfter = {};
            var that = this;
            that.Url = url;
            that.Src = src;
            that.PresetDirection = presetDirection;
            that.TerminalJs = terminalJs;
        }
        TerminalJsFlow.prototype.Start = function (forceMod) {
            if (forceMod === void 0) { forceMod = ""; }
            var that = this;
            that.parseValue();
            that.applyValueAndSetIfPush(forceMod);
            that.TerminalJs.ProcessFlow(that);
        };
        TerminalJsFlow.prototype.applyValueAndSetIfPush = function (forceMod) {
            var that = this, statesValue = that.TerminalJs.StatesVals, valueAfter = that.ValueAfter, i, isPush = false;
            if (that.Src == TerminalJsFlow.CmdSrcs.Url) {
                for (i in statesValue) {
                    if (valueAfter[i] == undefined) {
                        valueAfter[i] = null;
                    }
                    statesValue[i].value = valueAfter[i];
                    isPush = isPush || statesValue[i].isPushUrl;
                    that.TerminalJs.PrepareStateUrl(i, valueAfter[i]);
                }
            }
            else {
                for (i in valueAfter) {
                    statesValue[i].value = valueAfter[i];
                    isPush = isPush || statesValue[i].isPushUrl;
                    that.TerminalJs.PrepareStateUrl(i, valueAfter[i]);
                }
            }
            that.IsPushUrl = forceMod == "" ? isPush : (forceMod == "replaceUrl" ? false : true);
        };
        TerminalJsFlow.prototype.DoChangeCallbacks = function (isBack) {
            var that = this, statesValue = that.TerminalJs.StatesVals, valueAfter = that.ValueAfter, i;
            for (i in valueAfter) {
                if (statesValue[i]) {
                    statesValue[i].callback(valueAfter[i], isBack);
                }
            }
        };
        TerminalJsFlow.prototype.parseValue = function () {
            var that = this, url = that.Url, keyword = that.TerminalJs.Keyword, rx = new RegExp("(\\" + keyword + "([^\/]+)\/([^\\" + keyword + "]*))", "g"), match, urls = url.split(keyword);
            if (urls[0]) {
                that.ValueFormUrl("main", urls[0].replace(/^\/|\/$/g, ""));
            }
            while ((match = rx.exec(url)) != null) {
                that.ValueFormUrl(match[2], match[3].replace(/\/$/, ""));
            }
        };
        TerminalJsFlow.prototype.optionValueFromUrl = function (type, valStr, stateNode) {
            var that = this.TerminalJs, types = that.StateTypes, i, c, res, arraySub = function (target, src) {
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
            var that = this, TerminalJs = that.TerminalJs, stateVal = TerminalJs.StatesVals[stateName], val, res, i, c;
            if (stateVal != undefined) {
                val = that.ValueAfter[stateName] === undefined ? stateVal.value : that.ValueAfter[stateName];
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
                                    val = decodeURIComponent(valStr ? valStr : null);
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
                        }
                    }
                    that.ValueAfter[stateName] = val;
                }
                else if (that.Src == TerminalJsFlow.CmdSrcs.Url) {
                    that.ValueAfter[stateName] = val;
                }
            }
            else {
                that.TerminalJs.PresetStateUrl[stateName] = that.TerminalJs.Keyword + stateName + "/" + stateValue;
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
    var TerminalJsValue = (function () {
        function TerminalJsValue(name, value, defaultValue, type, isPushUrl, callbacks) {
            this.callbackCount = 0;
            var that = this;
            that.name = name;
            that.value = value;
            that.callbacks = callbacks;
            that.default = defaultValue;
            that.isPushUrl = isPushUrl;
            that.type = type;
            if (callbacks) {
                that.callbackCount = 1;
            }
        }
        TerminalJsValue.prototype.callback = function (newVal, isBack) {
            var that = this, callbacks, i, c, name;
            if (that.callbackCount) {
                callbacks = that.callbacks;
                name = that.name;
                for (i = 0, c = callbacks.length; i < c; i++) {
                    callbacks[i](newVal, isBack, name);
                }
            }
        };
        TerminalJsValue.prototype.AddCallback = function (callback) {
            var that = this;
            that.callbacks.push(callback);
            that.callbackCount++;
        };
        TerminalJsValue.prototype.RemoveCallback = function (callback) {
            var that = this;
            that.callbacks.splice(that.callbacks.indexOf(callback), 1);
            that.callbackCount--;
        };
        TerminalJsValue.prototype.SetDefault = function () {
            var that = this;
            if (typeof that.default == "function") {
                that.checkValue();
                return null;
            }
            else {
                that.value = that.default;
                return function () {
                    that.callback(that.default, false);
                };
            }
        };
        TerminalJsValue.prototype.checkValue = function () {
            var that = this;
            that.default(function (res, retryTime) {
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
