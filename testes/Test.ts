import {UnitTest} from "./testScripts/unit";
import {terminalJs} from "../TerminalJs";

history.replaceState({},"","/index.html")

UnitTest()

// var terminalJs = StateTest()
//
//
// console.log(terminalJs)
//
terminalJs.MonitorDom().MonitorUrl().Init()