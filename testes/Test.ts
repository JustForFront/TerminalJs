import {StateTest} from "./testScripts/state";

history.replaceState({},"","/testes/index.html")

var terminalJs = StateTest()

terminalJs.UrlSpiltter = "/testes/index.html";

console.log(terminalJs)

terminalJs.MonitorDom().MonitorUrl().Init()