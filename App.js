define(["require", "exports", "TerminalJs"], function (require, exports, TerminalJs_1) {
    TerminalJs_1.terminalJs.AddState("main", "view/index.html", function (value, isBack) {
        // loadPage(value)
    });
    TerminalJs_1.terminalJs.AddState("testArr", ["a,b", "c,d"], function (arr, isBack) {
        // processAttr(arr)
    }, true, TerminalJs_1.terminalJs.StateTypes.Array);
    TerminalJs_1.terminalJs.AddState("title", "TerminalJs", function (value, isBack) {
        document.getElementById("title").innerHTML = value;
    });
    TerminalJs_1.terminalJs.AddState("testObj", { a: { b: ["123"] } }, function (v) {
        console.log(v);
    });
    setTimeout(function () {
        TerminalJs_1.terminalJs.ExeCmd("$testObj/a.b/+234");
    }, 3000);
    TerminalJs_1.terminalJs.MonitorUrl().MonitorDom().Init();
});
