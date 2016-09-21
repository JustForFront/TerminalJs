import {terminalJs} from "TerminalJs";

terminalJs.AddState("main","view/index.html",function (value,isBack) {

    // loadPage(value)

})

terminalJs.AddState("testArr",["a,b","c,d"],function (arr,isBack) {

    // processAttr(arr)

},true,terminalJs.StateTypes.Array)

terminalJs.AddState("title","TerminalJs",function (value,isBack) {

    document.getElementById("title").innerHTML = value

})

terminalJs.MonitorUrl().MonitorDom().Init()