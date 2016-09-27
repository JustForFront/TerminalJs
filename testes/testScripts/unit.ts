import {terminalJs} from "../../TerminalJs";
var log = console.log,
    UnitTest = function () {


        terminalJs.AddState("hiddenstring","hide",null,false,terminalJs.StateTypes.HiddenString)
        terminalJs.AddState("bool",true)
        terminalJs.AddState("number",0)
        terminalJs.AddState("array",[1,2,3])
        terminalJs.AddState("tree",{"a":[1,2,3]})
        terminalJs.AddState("object",{a:{b:1}})

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

            terminalJs.AddState("main","abc",callback)

            assert.ok(terminalJs.StatesVals["main"],"stateVal ok")
            assert.equal(terminalJs.StatesVals["main"].isPushUrl,true,"isPush")
            assert.equal(terminalJs.StatesVals["main"].default,"abc","default value")
            assert.equal(terminalJs.StatesVals["main"].value,null,"before init value")
            assert.equal(terminalJs.StatesVals["main"].callbacks[0],callback,"callback")

            terminalJs.StatesVals["main"].SetDefault()()

            assert.equal(terminalJs.StatesVals["main"].value,"abc","after init value")
            assert.equal(test,true,"after callback")

        })

        QUnit.test("Unit test AddCallback() & Callback()",function (assert) {

            var test = 0, callback = function () {
                test++
            }

            terminalJs.AddCallback("main",callback)

            assert.equal(terminalJs.StatesVals["main"].callbacks[1],callback,"callback added")

            terminalJs.ExeCmd("test")

            assert.equal(test,1,"callback ok")

            terminalJs.AddCallback("*",callback)

            assert.equal(terminalJs.callbacks[0],callback,"global callback added")

            terminalJs.ExeCmd("testAgain")

            assert.equal(test,3,"global callback ok")


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

            assert.equal(terminalJs.getFullUrl(),"/test%24Main/$bool/true/$number/123","string ok")

        })

        QUnit.test("Unit test UrlParams()",function (assert) {

            terminalJs.urlParts = {}
            terminalJs.DefaultValToUrl()

            assert.equal(terminalJs.GetStateValue("main"),"abc","string")
            assert.equal(terminalJs.GetStateValue("hiddenstring"),"hide","hiddenstring")
            assert.equal(terminalJs.GetStateValue("bool"),true,"bool")
            assert.equal(terminalJs.GetStateValue("number"),0,"number")
            assert.deepEqual(terminalJs.GetStateValue("array"),[1,2,3],"array")
            assert.deepEqual(terminalJs.GetStateValue("tree"),{"a":[1,2,3]},"tree")
            assert.deepEqual(terminalJs.GetStateValue("object"),{a:{b:1}},"object")

        })

    }

export {UnitTest}