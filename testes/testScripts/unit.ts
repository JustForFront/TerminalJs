import {terminalJs, TerminalJsFlow, TerminalJs, TerminalJsCommandAfterValue} from "../../TerminalJs";
var log = console.log,
    UnitTest = function () {

        QUnit.config.reorder = false

        var $dummy = document.getElementById("dummy"), cbTest = 0,cbVal:any,cbName:string,cbIsBack:boolean, testCallback = function (v,isBack,name) {
            cbTest++
            cbName = name
            cbVal = v
            cbIsBack = isBack
        },$a = document.createElement("A");

        $dummy.appendChild($a)

        terminalJs.UrlSpiltter = "/testes/index.html";
        terminalJs.AddState("main","abc")
        terminalJs.AddState("hiddenstring","hide",null,false,terminalJs.StateTypes.HiddenString)
        terminalJs.AddState("bool",true,null,false)
        terminalJs.AddState("array",[1,2,3])
        terminalJs.AddState("tree",{"a":[1,2,3]})
        terminalJs.AddState("object",{a:{b:1}})

        QUnit.module("TerminalJs",function () {

            QUnit.test("Unit test UrlParams()",function (assert) {

                

                var test = terminalJs.UrlParams("?a=123&b=%20a%20c&c="+encodeURIComponent("&?你好呀"))

                assert.ok(test["a"],"param a exist")
                assert.ok(test["b"],"param b exist")
                assert.ok(test["c"],"param c exist")
                assert.equal(test["a"],"123","param a pass")
                assert.equal(test["b"]," a c","param b pass")
                assert.equal(test["c"],"&?你好呀","param c pass")

            })

            QUnit.test("Unit test historyHandler()",function (assert) {

                

                terminalJs.history = ["/view/test.html/$id/123","/view/test.html","GetIndex"]

                var isBack = terminalJs.historyHandler("GetIndex",1)

                assert.equal(isBack,false,"go isBack")
                assert.equal(terminalJs.history[0],"GetIndex","go history")
                assert.equal(terminalJs.history.length,4,"go history length")
                assert.equal(terminalJs.incomingUrl,"GetIndex","go incomingUrl")
                assert.equal(terminalJs.historyPosition,0,"go historyPosition")

                isBack = terminalJs.historyHandler("/view/test.html/$id/123",-1)

                assert.equal(isBack,true,"back isBack")
                assert.equal(terminalJs.history.length,4,"back history length")
                assert.equal(terminalJs.incomingUrl,"/view/test.html/$id/123","back incomingUrl")
                assert.equal(terminalJs.historyPosition,1,"back historyPosition")

                terminalJs.historyPosition = 2

                isBack = terminalJs.historyHandler("/GetProduct")

                assert.equal(isBack,false,"back isBack")
                assert.equal(terminalJs.history.length,3,"skip history length")
                assert.equal(terminalJs.history[0],"/GetProduct","go history")
                assert.equal(terminalJs.incomingUrl,"/GetProduct","skip incomingUrl")
                assert.equal(terminalJs.historyPosition,0,"skip historyPosition")

                log(terminalJs.history)

                terminalJs.history = ["/GetIndex"]
                terminalJs.historyPosition = 0

                isBack = terminalJs.historyHandler("/view/test.html/$id/123",-1)

                assert.equal(isBack,true,"insert back isBack")
                assert.equal(terminalJs.history[1],"/view/test.html/$id/123","insert back history")
                assert.equal(terminalJs.history.length,2,"insert back history length")
                assert.equal(terminalJs.incomingUrl,"/view/test.html/$id/123","insert back incomingUrl")
                assert.equal(terminalJs.historyPosition,1,"insert back historyPosition")

            })

            QUnit.test("Unit test AddState",function (assert) {

                

                var test = false,callback = function () { test = true }

                terminalJs.AddState("number",0,callback)

                assert.ok(terminalJs.StatesVals["number"],"stateVal ok")
                assert.equal(terminalJs.StatesVals["number"].isPushUrl,true,"isPush")
                assert.equal(terminalJs.StatesVals["number"].default,0,"default value")
                assert.equal(terminalJs.StatesVals["number"].value,null,"before init value")
                assert.equal(terminalJs.StatesVals["number"].callbacks[0],callback,"callback")

                terminalJs.ForceReplaceUrl("$reset/number")

                assert.equal(terminalJs.StatesVals["number"].value,0,"after init value")
                assert.equal(test,true,"after callback")

            })

            QUnit.test("Unit test AddCallback() & Callback()",function (assert) {

                

                terminalJs.AddCallback("main",testCallback)

                assert.equal(terminalJs.StatesVals["main"].callbacks[0],testCallback,"callback added")

                terminalJs.ExeCmd("test")

                assert.equal(cbTest,1,"callback ok")

                terminalJs.AddCallback("*",testCallback)

                assert.equal(terminalJs.callbackCount,1,"global callbackCount added")
                assert.equal(terminalJs.callbacks[0],testCallback,"global callback added")

                terminalJs.ExeCmd("testAgain")

                assert.equal(cbTest,3,"global callback ok")


            })

            QUnit.test("Unit test removeCallback()",function (assert) {

                

                terminalJs.RemoveCallback("main",testCallback)

                assert.equal(terminalJs.StatesVals["main"].callbacks.length,0,"callback removed")

                terminalJs.ExeCmd("abc")

                assert.equal(cbTest,4,"callback call only once")

                terminalJs.RemoveCallback("*",testCallback)

                assert.equal(terminalJs.callbackCount,0,"global callbackCount sub")
                assert.equal(terminalJs.callbacks.length,0,"global callback removed")

                terminalJs.ExeCmd("testAgain")

                assert.equal(cbTest,4,"global callback not call")


            })

            QUnit.test("Unit test StateExist()",function (assert) {

                

                assert.equal(terminalJs.StateExist("main"),true,"exist ok")
                assert.equal(terminalJs.StateExist("dummy"),false,"not exist ok")

            })

            QUnit.test("Unit test GetStateValue()",function (assert) {

                

                assert.equal(terminalJs.GetStateValue("main"),"testAgain","get main ok")
                assert.equal(terminalJs.GetStateValue("dummy"),undefined,"not exist ok")

            })

            QUnit.test("Unit test parseValType()",function (assert) {

                

                assert.equal(terminalJs.parseValType("string"),terminalJs.StateTypes.String,"string ok")
                assert.equal(terminalJs.parseValType(true),terminalJs.StateTypes.Boolean,"boolen ok")
                assert.equal(terminalJs.parseValType(0),terminalJs.StateTypes.Number,"number ok")
                assert.equal(terminalJs.parseValType(["1",2,"abc"]),terminalJs.StateTypes.Array,"array ok")
                assert.equal(terminalJs.parseValType({"1":[1,2,3],"a":["a","b"]}),terminalJs.StateTypes.Tree,"tree ok")
                assert.equal(terminalJs.parseValType({a:{b:123}}),terminalJs.StateTypes.Object,"object ok")

            })

            QUnit.test("Unit test formatValUrl()",function (assert) {

                

                assert.equal(terminalJs.formatValUrl("main","/testformatValUrl/"),"testformatValUrl","string ok")
                assert.equal(terminalJs.formatValUrl("main","/test/formatValUrl/"),"test/formatValUrl","url string ok")
                assert.equal(terminalJs.formatValUrl("main","/test"+terminalJs.Keyword+"formatValUrl/"),"test%24formatValUrl","keyword string ok")
                assert.equal(terminalJs.formatValUrl("hiddenstring","dummy"),"","hidden string ok")
                assert.equal(terminalJs.formatValUrl("bool",true),"bool/true","bool ok")
                assert.equal(terminalJs.formatValUrl("number",1),"number/1","number ok")
                assert.equal(terminalJs.formatValUrl("array",[">",2,3]),"array/%3E,2,3","array ok")
                assert.equal(terminalJs.formatValUrl("tree",{a:[1,"$",3]}),"tree/a/1,%24,3","tree ok")
                assert.equal(terminalJs.formatValUrl("object",{a:{b:":"}}),"object/%7B%22a%22%3A%7B%22b%22%3A%22%3A%22%7D%7D","object ok")

            })

            QUnit.test("Unit test getFullUrl()",function (assert) {
                
                terminalJs.ExeCmd("test%24Main/$bool/true/$number/123")

                assert.equal(terminalJs.getFullUrl(),"/$number/123/test%24Main/$bool/true","string ok")

            })

            QUnit.test("Unit test defaultValToUrl()",function (assert) {

                

                terminalJs.urlParts = {}
                terminalJs.StatesVals["bool"].value = false

                // terminalJs.defaultValToUrl()

                terminalJs.ExeCmd("$reset")

                assert.equal(terminalJs.GetStateValue("main"),"abc","string")
                assert.equal(terminalJs.GetStateValue("hiddenstring"),"hide","hiddenstring")
                assert.equal(terminalJs.GetStateValue("bool"),true,"bool")
                assert.equal(terminalJs.GetStateValue("number"),0,"number")
                assert.deepEqual(terminalJs.GetStateValue("array"),[1,2,3],"array")
                assert.deepEqual(terminalJs.GetStateValue("tree"),{"a":[1,2,3]},"tree")
                assert.deepEqual(terminalJs.GetStateValue("object"),{a:{b:1}},"object")
                assert.equal(location.href.split(terminalJs.UrlSpiltter)[1],"/abc/$bool/true/$array/1,2,3/$tree/a/1,2,3/$object/%7B%22a%22%3A%7B%22b%22%3A1%7D%7D/$number/0$6","location ok")

            })

            QUnit.test("Unit test PrepareStateUrl()",function (assert) {

                

                terminalJs.PrepareStateUrl("number",123)
                assert.equal(terminalJs.urlParts["number"],"number/123","value ok")

                terminalJs.PrepareStateUrl("number",null)
                assert.equal(terminalJs.urlParts["number"],undefined,"delete ok")

            })

            QUnit.test("Unit test ToUrl()",function (assert) {

                var len = history.length

                terminalJs.ExeCmd("$reset")
                terminalJs.ToUrl("number",234)
                assert.equal(terminalJs.currentUrl,"/abc/$bool/true/$array/1,2,3/$tree/a/1,2,3/$object/%7B%22a%22%3A%7B%22b%22%3A1%7D%7D/$number/234","url push ok")
                assert.equal(history.length,len+1,"push history len ok")

                terminalJs.ToUrl("number",123,false)
                assert.equal(terminalJs.currentUrl,"/abc/$bool/true/$array/1,2,3/$tree/a/1,2,3/$object/%7B%22a%22%3A%7B%22b%22%3A1%7D%7D/$number/123","url replace ok")
                assert.equal(history.length,len+1,"replace history len ok")

            })

            QUnit.test("Unit test GetCurrentUrl()",function (assert) {


                assert.equal(terminalJs.GetCurrentUrl(),"/abc/$bool/true/$array/1,2,3/$tree/a/1,2,3/$object/%7B%22a%22%3A%7B%22b%22%3A1%7D%7D/$number/123","url ok")

            })

            QUnit.test("Unit test getUrl()",function (assert) {

                

                assert.equal(terminalJs.getUrl(terminalJs.UrlSpiltter+"/test"+terminalJs.UrlSpiltter+"/$test/123"),"/test"+terminalJs.UrlSpiltter+"/$test/123"," ok")

            })

            QUnit.test("Unit test MonitorDom()",function (assert) {

                

                var done = assert.async(),
                    ev = document.createEvent('Events')

                terminalJs.AddCallback("number",function (v) {

                    assert.equal(v,234,"internal OK")

                    done()

                }).MonitorDom()

                $a.innerHTML = "test"
                $a.setAttribute("href","#123")
                $a.classList.add("external")

                ev.initEvent("click",true,false)

                $a.dispatchEvent(ev)

                assert.equal(location.hash,"#123","external ok")

                $a.setAttribute("href","$number/234")
                $a.classList.remove("external")

                $a.dispatchEvent(ev)

            })

            QUnit.test("Unit test ExeCmd()",function (assert) {

                

                terminalJs.ExeCmd("$number/1")

                assert.equal(terminalJs.StatesVals["number"].value,1," ok")

            })

            QUnit.test("Unit test MonitorUrl()",function (assert) {

                terminalJs.MonitorUrl()

                terminalJs.ExeCmd("$number/345")
                terminalJs.ExeCmd("testA")

                assert.equal(terminalJs.StatesVals["main"].value,"testA","before main ok")
                assert.equal(terminalJs.StatesVals["number"].value,345,"before number ok")

                terminalJs.ExeCmd("testB")

                history.back()

                assert.equal(terminalJs.StatesVals["main"].value,"testA","after main ok")
                assert.equal(terminalJs.StatesVals["number"].value,345,"after number ok")

            })

            QUnit.test("Unit test pushUrl()",function (assert) {

                

                var oHash = terminalJs.hashNumber,hLen = history.length

                terminalJs.pushUrl("/test")

                assert.equal(terminalJs.getUrl(),"/test$"+(oHash+1),"url ok: /test$"+(oHash+1))
                assert.equal(terminalJs.hashNumber,oHash+1,"hash ok")
                assert.equal(history.length,hLen+1,"history ok")

            })

            QUnit.test("Unit test replaceUrl()",function (assert) {

                

                var oHash = terminalJs.hashNumber,hLen = history.length

                terminalJs.replaceUrl("/abc")

                assert.equal(terminalJs.getUrl(),"/abc$"+(oHash),"url ok: /abc$"+(oHash))
                assert.equal(terminalJs.hashNumber,oHash,"hash ok")
                assert.equal(history.length,hLen,"history ok")

            })

            QUnit.test("Unit test ForcePushUrl() & ForceReplaceUrl()",function (assert) {

                

                var oHash = terminalJs.hashNumber,hLen = history.length,oCbTest = cbTest;

                terminalJs.AddCallback("bool",testCallback)
                terminalJs.AddCallback("*",testCallback)

                terminalJs.ForcePushUrl(function (state) {

                    state.bool = false

                })

                assert.equal(terminalJs.GetStateValue("bool"),false,"push val ok")
                assert.equal(terminalJs.hashNumber,oHash+1,"push hash ok")
                assert.equal(history.length,hLen+1,"push history ok")
                assert.equal(cbTest,oCbTest+2,"push callback ok")

                terminalJs.AddCallback("number",testCallback)

                terminalJs.ForceReplaceUrl(function (state) {

                    state.number = 7777

                })

                assert.equal(terminalJs.GetStateValue("number"),7777,"replace val ok")
                assert.equal(terminalJs.hashNumber,oHash+1,"replace hash ok")
                assert.equal(history.length,hLen+1,"replace history ok")
                assert.equal(cbTest,oCbTest+4,"replace callback ok")

            })

            QUnit.test("Unit test ApplyValuesAndCheckIfPush()",function (assert) {

                

                var oNumberVal = terminalJs.GetStateValue("number"),IsPush

                IsPush = terminalJs.ApplyValuesAndCheckIfPush({main:"ccc"})

                assert.equal(terminalJs.GetStateValue("main"),"ccc","value ok")
                assert.equal(terminalJs.GetStateValue("number"),oNumberVal,"other value ok")
                assert.equal(IsPush,true,"ispush ok")

                IsPush = terminalJs.ApplyValuesAndCheckIfPush({main:"ddd"},true)

                assert.equal(terminalJs.urlParts["main"],"ddd","url ok")
                assert.equal(terminalJs.GetStateValue("main"),"ddd","value ok")
                assert.equal(terminalJs.GetStateValue("number"),null,"other value ok")
                assert.equal(IsPush,true,"ispush ok")

            })


            QUnit.test("Unit test encodeKeyword()",function (assert) {

                

                var kw = terminalJs.Keyword,codedKw = encodeURIComponent(kw)



                assert.equal(terminalJs.encodeKeyword(kw+"TEST"+kw+kw),codedKw+"TEST"+codedKw+codedKw," ok")

            })

            QUnit.test("Unit test decodeKeyword()",function (assert) {

                

                var kw = terminalJs.Keyword,codedKw = encodeURIComponent(kw)

                assert.equal(terminalJs.decodeKeyword(codedKw+"TEST"+codedKw+codedKw),kw+"TEST"+kw+kw," ok")

            })


            QUnit.test("Unit test CmdObjectInDepth()",function (assert) {

                var obj:any = {};

                assert.deepEqual(TerminalJs.CmdObjectInDepth("a.c.e.v",obj),{LastKey:"v",Object:{}},"return ok")
                assert.deepEqual(obj,{a:{c:{e:{}}}},"object ok")

            })


            QUnit.test("Unit test optionValueFromUrl()",function (assert) {

                var arr = [1],tree = {"a":[1]},obj = {}

                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Array,"+2",arr)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Array,"-1",arr)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Array,"!3",arr)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Array,"!3",arr)

                assert.deepEqual(arr,[2],"array ok")

                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Tree,"a/+2/b/+2",tree)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Tree,"a/-1/b/-2",tree)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Tree,"a/!3/b/!1",tree)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Tree,"a/!3/b/!1",tree)

                assert.deepEqual(tree,{a:[2],b:[]},"tree ok")

                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Object,"a.b.c/!1",obj)
                terminalJs.optionValueFromUrl(terminalJs.StateTypes.Object,"a.c/+2",obj)

                assert.deepEqual(obj,{a:{b:{c:[1]},c:[2]}},"object ok")

            })

            QUnit.test("Unit test defaultCommandBehavior()",function (assert) {

                var after = new TerminalJsCommandAfterValue()

                terminalJs.urlParts = {main:""}

                terminalJs.defaultCommandBehavior({stateName:{value:"main"},values:{value:["你好","testes","%24testScripts"]}},after)

                assert.equal(after["main"],"你好/testes/$testScripts","string ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"main"},values:{value:["test"]}},after)
                terminalJs.defaultCommandBehavior({stateName:{value:"main"},values:{value:["!test"]}},after)

                assert.equal(after["main"],null,"string toggle ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"number"},values:{value:["321"]}},after)

                assert.equal(after["number"],"321","number ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"number"},values:{value:["!321"]}},after)

                assert.equal(after["number"],null,"number toggle ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"bool"},values:{value:["true"]}},after)

                assert.equal(after["bool"],true,"boolean true ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"bool"},values:{value:["false"]}},after)

                assert.equal(after["bool"],false,"boolean false ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"bool"},values:{value:["toggle"]}},after)

                assert.equal(after["bool"],true,"boolean toggle ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"array"},values:{value:["1|2|3"]}},after)

                assert.deepEqual(after["array"],[1,2,3],"number array ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"array"},values:{value:["%20,abc,%24"]}},after)
                
                assert.deepEqual(after["array"],[" ","abc","$"],"string array ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"tree"},values:{value:["a","1|2|3","b","2|3|-1|1.2"]}},after)

                assert.deepEqual(after["tree"],{a:[1,2,3],b:[2,3,-1,1.2]},"number tree ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"tree"},values:{value:["b","%20,abc,%24","a","2|3|1"]}},after)

                assert.deepEqual(after["tree"],{a:[2,3,1],b:[" ","abc","$"]},"string tree ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"object"},values:{value:[encodeURIComponent(JSON.stringify({a:{c:[1,2,3],e:"123"}}))]}},after)

                assert.deepEqual(after["object"],{a:{c:[1,2,3],e:"123"}},"json object ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"object"},values:{value:["a.b","1|2|3","c","hihi","foo","bar"]}},after)

                assert.deepEqual(after["object"],{a:{b:[1,2,3],c:[1,2,3],e:"123"},c:"hihi",foo:"bar"},"string object ok")

                terminalJs.defaultCommandBehavior({stateName:{value:"testPreset"},values:{value:["notSet"]}},after)

                assert.deepEqual(terminalJs.PresetStateUrl["testPreset"],"$testPreset/notSet","Preset ok")



            })


            QUnit.test("Unit test AddCommand()",function (assert) {

                terminalJs.ExeCmd("test/$number/123/$array/1,2,3")

                var bhNum = function (params,values) {

                    values.number = terminalJs.GetStateValue("number")+params["toAdd"].value

                },bhStr = function (params,values) {

                    values.main = terminalJs.GetStateValue("main")+params["str1"].value+params["str2"].value

                },bhArr = function (params,values) {

                    values.array = terminalJs.GetStateValue("array").concat(params["toAdd"].value)

                },oStrV = terminalJs.GetStateValue("main"),oNumV = terminalJs.GetStateValue("number")

                terminalJs.AddCommand("addToNumber/$toAdd:number",bhNum,false)

                terminalJs.AddCommand("addToString/$str1:string/$str2:string:added2",bhStr,false)

                terminalJs.AddCommand("addToArray/$toAdd:number...",bhArr,false)

                assert.equal(terminalJs.CustomCommands.length,5,"command added")
                assert.equal(terminalJs.CustomCommands[2].CommandStr,"addToNumber","command string 1 ok")
                assert.equal(terminalJs.CustomCommands[2].Params["toAdd"].type,"number","command 1 param ok")
                assert.equal(terminalJs.CustomCommands[2].BehaviorFunc,bhNum,"command 1 behavior ok")

                assert.equal(terminalJs.CustomCommands[1].CommandStr,"addToString","command string 2 ok")
                assert.equal(terminalJs.CustomCommands[1].Params["str2"].type,"string","command 2 param 2 ok")
                assert.equal(terminalJs.CustomCommands[1].Params["str2"].default,"added2","command 2 param 2 default ok")
                assert.equal(terminalJs.CustomCommands[1].Params["str1"].type,"string","command 2 param 1 ok")
                assert.equal(terminalJs.CustomCommands[1].BehaviorFunc,bhStr,"command 1 behavior ok")

                assert.equal(terminalJs.CustomCommands[0].CommandStr,"addToArray","command string 3 ok")
                assert.equal(terminalJs.CustomCommands[0].Params["toAdd"].type,"number...","command 3 ok")
                assert.equal(terminalJs.CustomCommands[0].BehaviorFunc,bhArr,"command 3 behavior ok")

                terminalJs.ExeCmd("$addToNumber/110")

                assert.equal(terminalJs.GetStateValue("number"),oNumV+110,"command 1 run ok")

                terminalJs.ExeCmd("$addToNumber/-110")

                assert.equal(terminalJs.GetStateValue("number"),oNumV,"command 1 run negative ok")

                terminalJs.ExeCmd("$addToString/added1/added3")

                assert.equal(terminalJs.GetStateValue("main"),oStrV+"added1"+"added3","command 2 run ok")

                terminalJs.ExeCmd("$addToString/added4")

                assert.equal(terminalJs.GetStateValue("main"),oStrV+"added1"+"added3"+"added4"+"added2","command 2 run default ok")

                terminalJs.ExeCmd("$addToArray/4/5/6")

                assert.deepEqual(terminalJs.GetStateValue("array"),[1,2,3,4,5,6],"command 3 run ok")

            })

        })

        setTimeout(function () {

            QUnit.module("TerminalJsFlow",function () {

                QUnit.test("Unit test Start()",function (assert) {

                    var flow = new TerminalJsFlow("aaa",TerminalJsFlow.CmdSrcs.Cmd,1),oHash = terminalJs.hashNumber,hLen = history.length,oCbTest = cbTest

                    flow.Start()

                    // assert.equal(after["main"],"aaa","value after ok")
                    assert.equal(terminalJs.urlParts["main"],"aaa","url ok")
                    assert.equal(terminalJs.GetStateValue("main"),"aaa","value ok")
                    assert.equal(terminalJs.hashNumber,oHash+1,"hash ok")
                    assert.equal(history.length,hLen+1,"history ok")
                    assert.equal(cbTest,oCbTest+1,"callback ok")

                    flow = new TerminalJsFlow("bbb",TerminalJsFlow.CmdSrcs.Cmd,1)

                    flow.Start("replaceUrl")

                    assert.equal(terminalJs.urlParts["main"],"bbb","replace url ok")
                    assert.equal(terminalJs.GetStateValue("main"),"bbb","replace value ok")
                    assert.equal(terminalJs.hashNumber,oHash+1,"replace hash ok")
                    assert.equal(history.length,hLen+1,"replace history ok")
                    assert.equal(cbTest,oCbTest+2,"replace callback ok")

                })

                QUnit.test("Unit test DoChangeCallbacks()",function (assert) {

                    var flow = new TerminalJsFlow("$number/123",TerminalJsFlow.CmdSrcs.Cmd,1),oCbTest = cbTest

                    flow.parseValue()


                    flow.DoChangeCallbacks(false)

                    assert.equal(cbTest,oCbTest+2,"callbacked")


                })

                QUnit.test("Unit test parseValue()",function (assert) {

                    var flow = new TerminalJsFlow("eee/$number/234/$bool/true",TerminalJsFlow.CmdSrcs.Cmd,1)

                    flow.parseValue()

                    assert.equal(flow.ValueAfter["main"],"eee","main ok")
                    assert.equal(flow.ValueAfter["number"],234,"number ok")
                    assert.equal(flow.ValueAfter["bool"],true,"bool ok")


                })

            })

            QUnit.module("TerminalJsValue",function () {

                var Val = terminalJs.StatesVals["number"],ncallback = function () {
                    console.log(1234)
                };

                QUnit.test("Unit test callback()",function (assert) {

                    var ocbTest = cbTest

                    Val.callback(1234,false)

                    assert.equal(cbTest,ocbTest+1,"callback ok")
                    assert.equal(cbName,"number","name ok")
                    assert.equal(cbVal,1234,"value ok")
                    assert.equal(cbIsBack,false,"isBack ok")

                })

                QUnit.test("Unit test AddCallback()",function (assert) {

                    var oCount = Val.callbackCount

                    Val.AddCallback(ncallback)

                    assert.equal(Val.callbackCount,oCount+1,"count ok")
                    assert.equal(Val.callbacks[Val.callbackCount-1],ncallback,"add ok")

                })

                QUnit.test("Unit test RemoveCallback()",function (assert) {

                    var oCount = Val.callbackCount

                    Val.RemoveCallback(ncallback)

                    assert.equal(Val.callbackCount,oCount-1,"count ok")
                    assert.equal(Val.callbacks.indexOf(ncallback),-1,"remove ok")

                })

                QUnit.test("Unit test SetDefault()",function (assert) {

                    var oCbTest = cbTest

                    Val.SetDefault(false)

                    assert.equal(cbTest,oCbTest+2,"callback ok")
                    assert.equal(Val.value,Val.default,"value ok")

                })

                QUnit.test("Unit test checkValue()",function (assert) {

                    var done = assert.async(),oCbTest = cbTest,res:number;

                    Val.default = function (cb:(res:any,retryTime:number)=>void) {

                        res = Math.round(Math.random()*100)

                        cb(res,500)
                    }

                    Val.checkValue()

                    setTimeout(function () {

                        assert.equal(cbTest,oCbTest+6,"callback ok")
                        assert.equal(Val.value,res,"value ok")

                        done()

                    },1100)


                })

            })

        },100)



    }

export {UnitTest}