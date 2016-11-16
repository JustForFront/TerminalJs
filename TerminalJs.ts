var log = console.log

export class TerminalJs{

    static Debug:boolean = true
    static StateTypes = {"HiddenTree":-6,"HiddenArray":-5,"HiddenObject":-4,"HiddenNumber":-3,"HiddenBoolean":-2,"HiddenString":-1,
        "Auto":0,"String":1,"Boolean":2,"Number":3,"Object":4,"Array":5,"Tree":6}
    static ForceModes = {Replace:"replaceUrl",Push:"pushUrl",Auto:""}
    LogUrl:string = "http://localhost/recordCmds"
    LogCmd:(cmd:string)=>void = function (cmd:string) {}
    DomCmdAttribute:string = "href"
    CommandRecord:string[] = []
    StateTypes = TerminalJs.StateTypes
    States:any = {}
    StatesVals:{[stateName:string]:TerminalJsValue} = {}
    PresetStateUrl:{[stateName:string]:string} = {}
    Keyword:string = "$"
    UrlSpiltter:string = "/index.html"
    CustomCommands:TerminalJsCommand[] = []
    urlParts:{[key:string]:string} = {}
    history:string[] = []
    historyPosition:number = 0
    /*private*/ callbacks:((val:any,isBack:boolean,stateName:string)=>void)[] = [];
    /*private*/ callbackCount:number = 0;
    /*private*/ currentUrl:string
    /*private*/ incomingUrl:string
    /*private*/ hashNumber:number = 0
    /*private*/ initalized:boolean = false

    constructor(){

        this.AddCommand("/$stateName:string/$values:string...:",this.defaultCommandBehavior)
        this.AddCommand("reset/$stateName:string:ALL",this.defaultValToUrl)

        if(this.LogUrl){

            var delay = null,cmds = [],url = this.LogUrl

            this.LogCmd = function (cmd:string) {

                if(delay){

                    clearTimeout(delay)

                }

                cmds.push(cmd)

                delay = setTimeout(function () {

                    var js = document.createElement("script"),
                        remove = function () {

                        document.body.removeChild(js)

                    }

                    js.type = "text/javascript";
                    js.src = url+"?cmds="+encodeURIComponent(cmds.join(","));
                    js.addEventListener("load",remove)
                    js.addEventListener("error",remove)

                    document.body.appendChild(js);

                    cmds = []

                },100)

            }

        }

    }

    defaultCommandBehavior(params:TerminalJsCommandParamsAbstract,values:TerminalJsCommandAfterValueAbstract){


        var that = terminalJs,stateName = params["stateName"].value,stateValues = <string[]>params["values"].value?params["values"].value:[],vLen = stateValues.length,valStr = stateValues.join("/"),
            stateVal = that.StatesVals[stateName],val:any,res:CmdObjectInDepthRes,i,tmp:any;

        if(stateVal!=undefined){

            val = values[stateName]===undefined?stateVal.value:values[stateName]

            if(that.urlParts[stateName]!=stateName+"/"+valStr){

                var type = stateVal.type,types = that.StateTypes;


                if(valStr==""){

                    val = null

                }else if((type>types.Number||type<types.HiddenNumber)&&/(?:^[\!\-\+]|\/[\!\-\+])/.test(valStr)){

                    if(val===null||val===undefined){

                        val = type===4?[]:{}

                    }else{

                        val = JSON.parse(JSON.stringify(val))

                    }

                    that.optionValueFromUrl(type,valStr,val)

                }else{

                    switch (type){

                        case types.String:
                        case types.HiddenString:

                            if(valStr.indexOf("!")===0){

                                valStr = decodeURIComponent(valStr.substr(1))
                                val = valStr==val?null:valStr

                            }else{

                                val = terminalJs.decodeKeyword(decodeURIComponent(valStr?valStr:null))

                            }

                            break
                        case types.Number:
                        case types.HiddenNumber:

                            if(valStr.indexOf("!")===0){

                                i = Number(valStr.substr(1))
                                val = i===val?null:i

                            }else{

                                val = Number(valStr)

                            }

                            break
                        case types.Boolean:
                        case types.HiddenBoolean:
                            val = valStr=="toggle"?!val:valStr=="true"
                            break
                        case types.Array:
                        case types.HiddenArray:

                            if(/^[0-9\|\.\-]+$/.test(valStr)){

                                val = valStr.split("|").map(Number)

                            }else{

                                val = valStr?valStr.split(",").map(decodeURIComponent):[]

                            }

                            break
                        case types.Tree:
                        case types.HiddenTree:

                            if(valStr){

                                val = val?val:{}

                                for(i=0;i<vLen;i+=2){

                                    tmp = stateValues[(i+1)]

                                    if(/^[0-9\|\.\-]+$/.test(tmp)){

                                        val[stateValues[i]] = tmp.split("|").map(Number)

                                    }else{

                                        val[stateValues[i]] = tmp?tmp.split(",").map(decodeURIComponent):[]

                                    }

                                }

                            }else{

                                val = {}

                            }

                            break
                        default:

                            if(valStr.indexOf("{")==0||valStr.indexOf("[")==0){

                                val = JSON.parse(valStr.trim())

                            }else if(valStr.indexOf("%7B")==0||valStr.indexOf("%5B")==0){

                                val = JSON.parse(decodeURIComponent(valStr).trim())

                            }else{

                                val = val?val:{}

                                for(i=0;i<vLen;i+=2){

                                    res = TerminalJs.CmdObjectInDepth(stateValues[i],val)

                                    tmp = stateValues[(i+1)]

                                    if(/^[0-9\|\.\-]+$/.test(tmp)){

                                        res.Object[res.LastKey] = tmp.split("|").map(Number)

                                    }else if(tmp.indexOf(",")===-1){

                                        res.Object[res.LastKey] = tmp

                                    }else{

                                        res.Object[res.LastKey] = tmp?tmp.split(",").map(decodeURIComponent):[]

                                    }

                                }

                            }

                    }

                }

                values[stateName] = val

            }else{

                values[stateName] = stateVal.value

            }

        }else{

            terminalJs.PresetStateUrl[stateName] = terminalJs.Keyword+stateName+"/"+valStr

        }


    }

    optionValueFromUrl(type:number,valStr:string,stateNode:any):void{

        var types =  this.StateTypes,i,c,res:CmdObjectInDepthRes,
            seekAndProcess = function (arr:any[],seek:any,process:(pos:number,val:any)=>void) {

                var strVal = decodeURIComponent(seek),
                    numVal = Number(seek),
                    i1 = arr.indexOf(strVal),
                    i2 = arr.indexOf(numVal);

                if(i1>i2){

                    process(i1,strVal)

                }else{

                    process(i2,numVal)

                }

            },
            arraySub = function (target:any[],src:any[]) {

                let i,c;

                for(i=0,c=src.length;i<c;i++){

                    seekAndProcess(target,src[i],function (pos) {

                        target.splice(pos,1)

                    })

                }

            },arrayToggle = function (target:any[],src:any[]) {

                let i,c;

                for(i=0,c=src.length;i<c;i++){

                    seekAndProcess(target,src[i],function (pos,val) {

                        if(pos===-1){

                            target.push(val)

                        }else{

                            target.splice(pos,1)

                        }

                    })

                }

            },arrayAdd = function (target:any[],src:any[]) {

                let i,c,num:number;

                for(i=0,c=src.length;i<c;i++){

                    num = Number(src[i])

                    target.push(isNaN(num)?decodeURIComponent(src[i]):num)

                }

            },vals,nodes,params;

        switch (type){

            case types.Tree:
            case types.HiddenTree:
                params = valStr.split("/")

                for(i=0,c=params.length;i<c;i+=2){

                    vals = params[(i+1)].substr(1).split(",")

                    if(stateNode[params[i]]){

                        nodes = stateNode[params[i]]

                    }else{

                        nodes = []
                        stateNode[params[i]] = nodes

                    }

                    if(params[(i+1)].indexOf("-")===0){

                        arraySub(nodes,vals)

                    }else if(params[(i+1)].indexOf("+")===0){

                        arrayAdd(nodes,vals)

                    }else{

                        arrayToggle(nodes,vals)

                    }

                }

                break

            case types.Object:
            case types.HiddenObject:

                params = valStr.split("/")

                for(i=0,c=params.length;i<c;i+=2){

                    vals = params[(i+1)].substr(1).split(",")

                    res = TerminalJs.CmdObjectInDepth(params[i],stateNode)

                    if(res.Object[res.LastKey]){

                        nodes = res.Object[res.LastKey]

                    }else{

                        nodes = []
                        res.Object[res.LastKey] = nodes

                    }

                    if(params[(i+1)].indexOf("-")===0){

                        arraySub(nodes,vals)

                    }else if(params[(i+1)].indexOf("+")===0){

                        arrayAdd(nodes,vals)

                    }else{

                        arrayToggle(nodes,vals)

                    }

                }

                break

            default:
                vals = valStr.substr(1).split(",")

                if(valStr.indexOf("-")===0){

                    arraySub(stateNode,vals)

                }else if(valStr.indexOf("+")===0){

                    arrayAdd(stateNode,vals)

                }else{

                    arrayToggle(stateNode,vals)

                }

        }

    }


    static CmdObjectInDepth(keyCmd:string,Obj:any):CmdObjectInDepthRes{

        var keys = keyCmd.split("."),i = 0,c = keys.length-1;

        for(;i<c;i++){


            if(!Obj[keys[i]]){

                Obj[keys[i]] = {}

            }

            Obj = Obj[keys[i]]

        }

        return {LastKey:keys[c],Object:Obj}

    }

    UrlParams(url:string=location.href):{[key:string]:any} {
        var q = url.split("?"),query_string = {},query = q.length==1?"":q[1],vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            let pair = vars[i].split("=");
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
                query_string[pair[0]] = arr;
            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return query_string;
    }

    Init():TerminalJs{

        if(!this.initalized){

            var url = this.getUrl();

            if(url){

                this.ExeUrl(url)

            }

            this.ExeCmd(this.Keyword+"reset")

            this.initalized = true

        }



        return this

    }

    historyHandler(newUrl:string,presetDirection:number=0):boolean{

        var isBack = presetDirection===-1,list = this.history,pos = this.historyPosition,l=list.length;

        this.incomingUrl = newUrl

        if(isBack){

            if(pos==l-1){

                list.push(newUrl)

            }

            this.historyPosition++;

        }else{

            if(pos!=0){

                this.historyPosition = 0
                list.splice(0,pos)

            }

            list.unshift(newUrl)



        }

        return isBack

    }

    AddCommand(syntax:string,behaviorFunc:(params:TerminalJsCommandParamsAbstract,after:any)=>void,isPush:boolean=true){

        this.CustomCommands.unshift(new TerminalJsCommand(syntax,behaviorFunc,isPush))

    }

    AddState(stateName:string,defaultVal:any=null,OnChanged:(newVal:any,isBack:boolean,name:string)=>void=null,isPushUrl:boolean=true,type:number=TerminalJs.StateTypes.Auto):TerminalJs{

        var oJson = "",that = this,stateTypes = this.StateTypes,vals = this.StatesVals,onChanged = function (newVal:any) {

            oJson = ""

            that.ToUrl(stateName,newVal,isPushUrl)

            vals[stateName].callback(newVal,that.historyHandler(that.currentUrl,1))

            that.Callback(stateName,newVal,false)

        };

        if(type==stateTypes.Auto){

            type = this.parseValType(defaultVal)

        }

        vals[stateName] = new TerminalJsValue(stateName,null,defaultVal,type,isPushUrl,OnChanged?[OnChanged]:[])

        Object.defineProperty(this.States, stateName, {
            get: function () {

                if(type>stateTypes.Number||type<stateTypes.HiddenNumber){

                    oJson = JSON.stringify(vals[stateName].value)

                    setTimeout(function () {

                        if(oJson&&JSON.stringify(vals[stateName].value)!=oJson){

                            onChanged(vals[stateName].value)

                        }

                    },1)

                }

                return vals[stateName].value
            },
            set: function (newVal) {

                if(!(newVal instanceof TerminalJs)&&vals[stateName].value != newVal){

                    vals[stateName].value = newVal

                    onChanged(newVal)

                }

            },
            enumerable: true,
            configurable: true
        });

        if(this.initalized){

            let preUrl = this.PresetStateUrl[stateName];

            if(preUrl){

                (new TerminalJsFlow(preUrl,TerminalJsFlow.CmdSrcs.Cmd,1)).Start("replaceUrl")

            }else{

                vals[stateName].SetDefault(false,false)

            }
        }

        return this

    }

    AddCallback(stateNameStartToAll:string,callback:(val:any,isBack:boolean,stateName:string)=>void):TerminalJs{

        if(stateNameStartToAll=="*"){

            this.callbacks.push(callback)
            this.callbackCount++;

        }else{

            this.StatesVals[stateNameStartToAll].AddCallback(callback)

        }

        return this

    }

    RemoveCallback(stateNameStarToAll:string,callback:(val:any,isBack:boolean,stateName:string)=>void):TerminalJs{

        if(stateNameStarToAll=="*"){

            this.callbacks.splice(this.callbacks.indexOf(callback),1)

            this.callbackCount--;

        }else{

            this.StatesVals[stateNameStarToAll].RemoveCallback(callback)

        }

        return this

    }

    Callback(stateName:string,val:any,isBack:any){

        var i,callbacks;


        if(this.callbackCount){

            callbacks = this.callbacks;

            for(i in callbacks){

                callbacks[i](val,isBack,stateName)

            }

        }

    }

    StateExist(stateName:string):boolean{

        return this.StatesVals[stateName]!=undefined

    }

    GetStateValue(stateName:string):any{

        var stateVal = this.StatesVals[stateName]

        return stateVal?stateVal.value:undefined

    }

    /*private*/ parseValType(val:any):number{

        var types = this.StateTypes,i;

        switch(typeof val){

            case "object":
                if(val instanceof Array){

                    return types.Array

                }else{

                    for(i in val){

                        return val[i] instanceof Array?types.Tree:types.Object

                    }

                }
            case "boolean":
                return types.Boolean
            case "number":
                return types.Number
            default:
                return types.String

        }

    }

    /*private*/ formatValUrl(stateName:string,stateVal:any):string{

    if(stateVal===null||stateVal===undefined){

        return ""

    }

    var type = this.StatesVals[stateName].type,types = this.StateTypes,t;

    if(type<types.Auto){

        return ""

    }

    stateName = stateName=="main"?"":stateName+"/"

    switch (type){

        case types.String:

            return stateName+this.encodeKeyword(stateVal.replace(/^\/|\/$/g,""))+""

        case types.Number:

            return stateName+stateVal+""

        case types.Boolean:

            return stateName+(stateVal?"true":"false")

        case types.Array:

            t = typeof stateVal[0]

            if(t=="string"){

                return stateName+stateVal.map(encodeURIComponent).join(",")

            }else if(t==undefined||t=="number") {

                return stateName+stateVal.join(",")

            }

        default:

            var res:string[] = [],isTree = true;

            for(let i in stateVal){

                if(stateVal[i] instanceof Array){

                    res.push(i+"/"+stateVal[i].map(encodeURIComponent).join(","))

                }else{

                    isTree = false;

                    break;

                }

            }

            if(isTree){

                return stateName+res.join("/");

            }

            return stateName+encodeURIComponent(JSON.stringify(stateVal))

    }

}


    /*private*/ getFullUrl():string{

    var parts = this.urlParts,url:string[] = [],keyword = this.Keyword;

    for(let i in parts){

        url.push((i=="main"?"":keyword)+parts[i])

    }

    this.currentUrl = "/"+url.join("/")

    return this.currentUrl

}

    defaultValToUrl(params:TerminalJsCommandParamsAbstract,values:TerminalJsCommandAfterValueAbstract):void{

        var that = terminalJs,i,parts,vals = that.StatesVals,stateName = params["stateName"].value,toDefault = {};

        if(stateName=="ALL"){

            parts = that.urlParts

            for(i in vals){

                if(parts[i]==undefined){

                    values[i] = vals[i].GetDefault()

                }

            }

        }else{

            values[stateName] = vals[stateName].GetDefault()

        }



        // (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,1)).Apply(toDefault,false)

    }

    PrepareStateUrl(stateName:string,stateVal:any):boolean{

        var url = this.formatValUrl(stateName,stateVal),urls = this.urlParts;

        if(urls[stateName]!=url) {

            if (url) {

                urls[stateName] = url

            } else {

                delete urls[stateName]

            }

            return true

        }else{

            return false

        }

    }

    ToUrl(stateName:string,stateVal:any,isPush:boolean=true):void{

        this.PrepareStateUrl(stateName,stateVal)

        if(isPush){

            this.pushUrl(this.getFullUrl())

        }else{

            this.replaceUrl(this.getFullUrl())

        }

    }

    GetCurrentUrl():string{

        return this.currentUrl

    }

    getUrl(url:string = location.href):string{

        var urls = url.split(this.UrlSpiltter)

        return urls.length==1?"":urls.slice(1).join(this.UrlSpiltter)

    }

    MonitorDom(dom:HTMLElement=document.body,handler:(url:string,classlist:DOMTokenList,e:Event)=>void=function (url:string,classlist:DOMTokenList) {

        that.ExeCmd(url,classlist.contains("back"),
            classlist.contains("replaceUrl")?
                TerminalJs.ForceModes.Replace:(
                classlist.contains("pushUrl")?TerminalJs.ForceModes.Push:TerminalJs.ForceModes.Auto
            ))

    }):TerminalJs{

        var that = this,keyword = that.Keyword,domCmdAttribute = this.DomCmdAttribute,splitter = this.UrlSpiltter;

        dom.addEventListener("click",function (e:Event) {

            var dom : Element = <Element>e.target

            if (dom && dom.matches("a,a *")) {

                while ( dom.tagName!="A"){

                    dom = dom.parentElement

                }

                var url : string = dom.getAttribute(domCmdAttribute),classlist = dom.classList,urlParams;

                if(url){

                    if(!classlist.contains("external")&&
                        (
                            url.indexOf("://")===-1&&
                            url.indexOf("javascript:")===-1
                        )){

                        e.preventDefault();
                        e.stopPropagation();

                        urlParams = url.split(splitter)
                        url = urlParams.length==1?urlParams[0]:urlParams[1]

                        if(url.indexOf("/")==0||url.indexOf(keyword)==0){

                            handler(url,classlist,e)

                            return false

                        }

                    }

                }

            }

            return false

        })

        return this

    }

    ExeUrl(url:string,isBack:boolean=false){

        (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url,isBack?-1:1)).Start()

    }

    ExeCmd(cmd:string,isBack:boolean=false,forceMode:string=TerminalJs.ForceModes.Auto){

        (new TerminalJsFlow(cmd,TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Start(forceMode)

    }

    MonitorUrl():TerminalJs{

        var that = this,hashRx = new RegExp("\\"+this.Keyword+"([0-9]+)$"),
            checkDirection = function (hashStr:string):number {

                let res:number;

                if(hashStr){

                    res = Number(hashStr)<that.hashNumber?-1:1

                    that.hashNumber = Number(hashStr)


                }else{

                    res = that.hashNumber==0?0:-1

                    that.hashNumber = 0

                }

                return  res

            };

        window.onpopstate = function () {

            let url = that.getUrl(),params;

            if(that.currentUrl!=url){

                params = hashRx.exec(url);

                that.ExeUrl(url,checkDirection(params?params[1]:null)==-1)

            }

        }

        return this

    }

    ProcessFlow(flow:TerminalJsFlow){

        var url;

        if(flow.Src==TerminalJsFlow.CmdSrcs.Cmd){

            url = this.getFullUrl()

            if(flow.IsPushUrl){

                this.pushUrl(url)

            }else{

                this.replaceUrl(url)

            }

        }else{

            url = this.currentUrl = flow.Url

        }

        flow.DoChangeCallbacks(this.historyHandler(url,flow.PresetDirection))

    }

    /*private*/ pushUrl(url:string){

    this.hashNumber++

    history.pushState({},document.title,this.UrlSpiltter+url+this.Keyword+this.hashNumber)


}

    /*private*/ replaceUrl(url:string){

    history.replaceState({},document.title,this.UrlSpiltter+url+(this.hashNumber?this.Keyword+this.hashNumber:""))

}

    ForcePushUrl(urlOrModfunc:((state:any)=>void)|string,isBack=false):void{

        this.forceMod(TerminalJs.ForceModes.Push,urlOrModfunc,isBack)

    }

    ForceReplaceUrl(urlOrModfunc:((state:any)=>void)|string,isBack=false):void{

        this.forceMod(TerminalJs.ForceModes.Replace,urlOrModfunc,isBack)

    }

    /*private*/ forceMod(mode:string,urlOrModfunc:((newValue:any)=>void)|string,isBack=false){

    if(typeof urlOrModfunc=="string"){

        this.ExeCmd(String(urlOrModfunc),isBack,mode)

    }else{

        var newValues:any = {};

        (<(newValue:any)=>void>urlOrModfunc)(newValues);

        (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Apply(newValues,mode==TerminalJs.ForceModes.Push)

    }

}

    ApplyValuesAndCheckIfPush(values:any,clean:boolean=false):boolean{

        var statesValue = this.StatesVals,
            i, isPush = false

        if (clean) {

            for(i in statesValue) {

                if (values[i] == undefined) {

                    if (statesValue[i].type < 0) {

                        continue

                    }

                    values[i] = null

                }

                if(this.PrepareStateUrl(i, values[i])){

                    statesValue[i].value = values[i]

                    isPush = isPush || statesValue[i].isPushUrl

                }

            }

        }else{

            for(i in values){

                if(this.PrepareStateUrl(i, values[i])){

                    statesValue[i].value = values[i]

                    isPush = isPush || statesValue[i].isPushUrl

                }

            }

        }

        return isPush

    }

    encodeKeyword(str:string):string {

        var keyword = this.Keyword,rx = new RegExp("\\"+keyword,"g");

        return str.replace(rx,encodeURIComponent(keyword))

    }

    decodeKeyword(str:string):string {

        var keyword = this.Keyword,rx = new RegExp("\\"+encodeURIComponent(keyword),"g");

        return str.replace(rx,keyword)

    }

}

interface CmdObjectInDepthRes{
    Object:any
    LastKey:string|number
}

interface TerminalJsCommandParamAbstract{
    type:string
    value:any
    name:string
    default:any
    must:boolean
}

interface TerminalJsCommandParamsAbstract{
    [propName: string]: TerminalJsCommandParamAbstract;
}

interface TerminalJsCommandAfterValueAbstract{
    Done?:()=>void
    IsPush?:boolean
    Discard?:boolean
    [propName: string]: any;
}

export class TerminalJsCommandAfterValue implements TerminalJsCommandAfterValueAbstract{

    Discard:boolean

}

export class TerminalJsCommand{

    CommandStr:string
    Params:TerminalJsCommandParamsAbstract = {}
    MustParamCount:number
    BehaviorFunc:(params:TerminalJsCommandParamsAbstract,after:TerminalJsCommandAfterValueAbstract)=>void
    IsPush:boolean
    Syntax:string
    ParamCount:number;

    constructor(syntax:string,behaviorFunc:(params:TerminalJsCommandParamsAbstract,after:TerminalJsCommandAfterValueAbstract)=>void,isPush:boolean){

        this.Syntax = syntax
        this.IsPush = isPush
        this.BehaviorFunc = behaviorFunc

        this.parseSyntax()

    }

    parseSyntax(){

        var syntaxParams = this.Syntax.split("/$"),i,c = syntaxParams.length,
            params = this.Params,param:string[],endedMust = false,val:any,l,must =0;

        this.CommandStr = syntaxParams[0]

        for(i=1;i<c;i++){

            param = syntaxParams[i].split(":")
            l = param.length

            if(l==3){

                endedMust = true

                val = param[2]

                switch (param[1]){

                    case "number":
                        var i:any = Number(val)

                        if(isNaN(i)){

                            throw "command_parameter_setting_error"

                        }else{

                            val = i

                        }
                        break
                    case "boolean":

                        if(val=="true"||val=="false"){

                            val = val=="true"

                        }else{

                            throw "command_parameter_setting_error"

                        }
                        break

                    case "json":
                        val = JSON.parse(decodeURIComponent(val))
                        break

                }

                params[param[0]] = {default:val,value:null,name:param[0],type:param[1],must:true}

            }else{

                if(endedMust){

                    throw "command_parameter_setting_error"

                }

                if(l == 1){

                    params[param[0]] = {default:null,value:null,name:param[0],type:"string",must:true}

                }else{

                    params[param[0]] = {default:null,value:null,name:param[0],type:param[1],must:true}

                }

                must++

            }

        }

        this.ParamCount = c-1
        this.MustParamCount = must

    }

    Match(input:string,afterVal:TerminalJsCommandAfterValue):boolean{

        if(input.indexOf(this.CommandStr)===0&&this.MatchParams(input)){

            this.Exec(afterVal)

            terminalJs.LogCmd(input)

            return true

        }

        return false

    }

    MatchParams(input:string):boolean{

        var inputParams = input.split("/"),i:string,params = this.Params,seek = this.CommandStr?1:0,lastParam = this.ParamCount-(1-seek);

        if(inputParams.length>this.MustParamCount-1+seek){

            for(i in params){

                if(lastParam==seek){

                    params[i].value = this.MatchParamValue(params[i],inputParams.splice(seek).join("/"))

                }else{

                    params[i].value = this.MatchParamValue(params[i],inputParams[seek])

                }

                seek++

            }

            return true

        }

        return false

    }

    MatchParamValue(param:TerminalJsCommandParamAbstract,val:string):any{

        if(val){

            try{

                var type = param.type,l = type.length-3,vals:string[],i,c,res:any[],
                    parseVal = function (type,val:string) {

                        switch (type){

                            case "number":
                                var i = Number(val)

                                if(isNaN(i)){

                                    throw "match fail"

                                }else{

                                    return i

                                }
                            case "boolean":

                                if(val=="true"||val=="false"){

                                    return val=="true"

                                }else{

                                    throw "match fail"

                                }

                            case "json":
                                return JSON.parse(decodeURIComponent(val))
                            default:
                                return decodeURIComponent(val)

                        }

                    }
                if(type.indexOf("...")==l){

                    type = type.substr(0,l)
                    vals = val.split("/")
                    res = []

                    for(i=0,c=vals.length;i<c;i++){

                        res.push(parseVal(type,vals[i]))

                    }



                    return res

                }else{

                    return parseVal(type,val)

                }

            }catch(e){

                throw "match fail"

            }



        }else{

            return param.default

        }

    }

    Exec(afterVal:TerminalJsCommandAfterValue){

        this.BehaviorFunc(this.Params,afterVal);

    }

}

export class TerminalJsFlow{

    static CmdSrcs = {Cmd:1,Url:0}
    Url:string = null
    Src:number
    IsBack:boolean = false
    IsPushUrl:boolean = false
    PresetDirection:number
    ValueAfter:TerminalJsCommandAfterValue = new TerminalJsCommandAfterValue()

    constructor(url:string,src:number,presetDirection:number=0){

        this.Url = url
        this.Src = src
        this.PresetDirection = presetDirection

    }

    Start(forceMod:string=""){

        this.parseValue()

        if(!this.ValueAfter.Discard){

            this.run(forceMod)

        }

    }

    Apply(vales:any,isPush){

        this.ValueAfter = vales
        this.IsPushUrl = isPush
        this.IsBack = false

        this.run(isPush?TerminalJs.ForceModes.Push:TerminalJs.ForceModes.Replace)

    }

    run(forceMod:string){

        var isPush = terminalJs.ApplyValuesAndCheckIfPush(this.ValueAfter,this.Src == TerminalJsFlow.CmdSrcs.Url)

        this.IsPushUrl = forceMod==TerminalJs.ForceModes.Auto?isPush:(forceMod==TerminalJs.ForceModes.Replace?false:true)

        terminalJs.ProcessFlow(this)

    }

    DoChangeCallbacks(isBack:boolean){

        var statesValue = terminalJs.StatesVals,valueAfter = this.ValueAfter,i;


        if(!valueAfter.Discard){

            delete valueAfter.Discard;

            for(i in valueAfter){

                if(statesValue[i]){

                    statesValue[i].callback(valueAfter[i],isBack)

                    terminalJs.Callback(i,valueAfter[i],isBack)

                }

            }


        }

    }

    parseValue(url:string = this.Url){

        var keyword = terminalJs.Keyword,rx = new RegExp("\\"+keyword+"(([a-zA-Z][^\/]+)([^\\"+keyword+"]*))","g"),
            match,urls = url.split(keyword),commands = terminalJs.CustomCommands,commandCount = commands.length,
            afterVal = this.ValueAfter,i;

        if(urls[0]){

            commands[commandCount-1].Match("main/"+urls[0].replace(/^\/|\/$/g,""),afterVal)

        }

        while((match = rx.exec(url))!=null){

            for(i=0;i<commandCount;i++){

                if(commands[i].Match(match[1].replace(/^\/|\/$/g,""),afterVal)){

                    break

                }

            }

            // if(!matchCommand(match[1])){

            // this.ValueFormUrl(match[2],match[3].replace(/^\/|\/$/g,""))

            // }

        }


    }

}

export class TerminalJsValue{

    name:string
    value:any
    default:any
    type:number
    isPushUrl:boolean
    /*private*/ callbacks:((newVal:any,isBack:boolean,name:string)=>void)[]
    /*private*/ callbackCount = 0

    constructor(name:string,value:any,defaultValue:any,type:number,isPushUrl:boolean,callbacks:((newVal:any,isBack:boolean,name:string)=>void)[]){

        this.name = name
        this.value = value
        this.callbacks = callbacks
        this.default = defaultValue
        this.isPushUrl = isPushUrl
        this.type = type

        if(callbacks){

            this.callbackCount = 1

        }

    }

    callback(newVal:any,isBack:boolean){

        var callbacks,i,c,name;

        if(this.callbackCount){

            callbacks = this.callbacks
            name = this.name

            for(i=0,c=callbacks.length;i<c;i++){

                callbacks[i](newVal,isBack,name)

            }

        }

    }

    AddCallback(callback:(newVal:any,isBack:boolean,name:string)=>void){

        this.callbacks.push(callback)

        this.callbackCount++

    }

    RemoveCallback(callback:(newVal:any,isBack:boolean,name:string)=>void){

        this.callbacks.splice(this.callbacks.indexOf(callback),1)

        this.callbackCount--

    }

    GetDefault():any{

        if(typeof this.default=="function"){

            this.checkValue()

            return null

        }else{

            return this.default

        }

    }

    SetDefault(isBack=false,isPush=this.isPushUrl):TerminalJsValue{

        if(typeof this.default=="function"){

            this.checkValue()

        }else{

            var val = {}

            val[this.name] = this.default;

            (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Apply(val,isPush)

        }

        return this

    }

    /*private*/ checkValue(){

    var that = this;

    this.default(function (res:any,retryTime:number) {

        that.value = res
        that.callback(res,false)
        terminalJs.Callback(that.name,res,false)

        if(retryTime){

            setTimeout(function () {

                that.checkValue()

            },retryTime)

        }

    })

}

}


interface TerminalJsRecord{
    CallString:string
    ValueChanged?:any
    ValueAfter?:any
    UrlAfter?:any
    Caller:any
}

export class TerminalJsDebug extends TerminalJs{

    CommandTrace:TerminalJsRecord[] = []

    constructor(){

        super()

        var that = this

        window["TerminalJsTrace"] = function () {

            console.log(that.CommandTrace)

        }


    }

    ExeUrl(url:string,isBack:boolean=false){

        this.CommandTrace.push({CallString:url,Caller:"URL",ValueAfter:{},UrlAfter:{}});

        (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url,isBack?-1:1)).Start()

    }

    ExeCmd(cmd:string,isBack:boolean=false,forceMode:string=TerminalJs.ForceModes.Auto,$caller:EventTarget=null){

        this.CommandTrace.push({CallString:cmd,Caller:$caller?$caller:this.ExeCmd.caller.toString(),ValueAfter:{},UrlAfter:{}})

        super.ExeCmd(cmd,isBack,forceMode)

    }

    ApplyValuesAndCheckIfPush(values:any,clean:boolean=false):boolean{

        var trace = this.CommandTrace[this.CommandTrace.length-1],valueAfter = trace.ValueAfter,urlAfter = trace.UrlAfter,
            stateValues = this.StatesVals,urlParts = this.urlParts,isPush:boolean,i;

        trace.ValueChanged = values

        isPush = super.ApplyValuesAndCheckIfPush(values,clean)

        for(i in values){

            valueAfter[i] = stateValues[i].value
            urlAfter[i] = urlParts[i]

        }

        return isPush

    }

    MonitorDom(dom:HTMLElement=document.body,handler:(url:string,classlist:DOMTokenList,e:Event)=>void=function (url:string,classlist:DOMTokenList,e:Event) {

        that.ExeCmd(url,classlist.contains("back"),TerminalJs.ForceModes.Auto,e.target)

    }):TerminalJs{

        var that = this

        super.MonitorDom(dom,handler)

        return this

    }

}

var terminalJs:TerminalJs = TerminalJs.Debug?new TerminalJsDebug():new TerminalJs();

export {terminalJs};