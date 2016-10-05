var log = console.log

class TerminalJs{

    static StateTypes = {"HiddenTree":-6,"HiddenArray":-5,"HiddenObject":-4,"HiddenNumber":-3,"HiddenBoolean":-2,"HiddenString":-1,
        "Auto":0,"String":1,"Boolean":2,"Number":3,"Object":4,"Array":5,"Tree":6}
    static ForceModes = {Replace:"replaceUrl",Push:"pushUrl",Auto:""}
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

    constructor(){}

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

        var url = this.getUrl();

        if(url){

            (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url)).Start()

        }

        this.DefaultValToUrl()

        this.initalized = true

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

    AddCommand(syntax:string,behaviorFunc:(params:TerminalJsCommandParamsAbstract,after:any)=>boolean,isPush:boolean=true){

        this.CustomCommands.push(new TerminalJsCommand(syntax,behaviorFunc,isPush))

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

    RemoveCallback(stateNameStartToAll:string,callback:(val:any,isBack:boolean,stateName:string)=>void):TerminalJs{

        if(stateNameStartToAll=="*"){

            this.callbacks.splice(this.callbacks.indexOf(callback),1)

            this.callbackCount--;

        }else{

            this.StatesVals[stateNameStartToAll].RemoveCallback(callback)

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

    DefaultValToUrl():void{

        var i,parts = this.urlParts,vals = this.StatesVals,toDefault = {};

        for(i in vals){

            if(parts[i]==undefined){

                toDefault[i] = vals[i].GetDefault()

            }

        }

        (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,1)).Apply(toDefault,false)

    }

    PrepareStateUrl(stateName:string,stateVal:any):void{

        var url = this.formatValUrl(stateName,stateVal)

        if(url){

            this.urlParts[stateName] = url

        }else{

            delete this.urlParts[stateName]

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

    MonitorDom(dom:HTMLElement=document.body):TerminalJs{

        var that = this,keyword = that.Keyword;

        dom.addEventListener("click",function (e:Event) {

            var dom : Element = <Element>e.target

            if (dom && dom.matches("a,a *")) {

                e.preventDefault();
                e.stopPropagation();

                while ( dom.tagName!="A"){

                    dom = dom.parentElement

                }

                var url : string = dom.getAttribute("href"),classlist = dom.classList;

                if(!classlist.contains("external")){

                    if(url.indexOf("/")==0||url.indexOf(keyword)==0||
                        (
                            url.indexOf("://")!==-1&&
                            url.indexOf("http://")!==0&&
                            url.indexOf("https://")!==0&&
                            url.indexOf("ftp://")!==0&&
                            url.indexOf("file://")!==0&&
                            url.indexOf("//")!==0
                        )){

                        that.ExeCmd(url,classlist.contains("back"))

                        return false

                    }

                }

                location.href = url

            }

            return false

        })

        return this

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

            let url = that.getUrl(),params:string[];

            if(that.currentUrl!=url){

                params = hashRx.exec(url);

                (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url,checkDirection(params?params[1]:null))).Start()

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

    ForcePushUrl(urlOrModfunc:(state:any)=>void|string,isBack=false):void{

        this.forceMod(TerminalJs.ForceModes.Push,urlOrModfunc,isBack)

    }

    ForceReplaceUrl(urlOrModfunc:(state:any)=>void|string,isBack=false):void{

        this.forceMod(TerminalJs.ForceModes.Replace,urlOrModfunc,isBack)

    }

    /*private*/ forceMod(mode:string,urlOrModfunc:(newValue:any)=>void|string,isBack=false){

        if(typeof urlOrModfunc=="string"){

            (new TerminalJsFlow(String(urlOrModfunc),TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Start(mode)

        }else{

            var newValues:any = {}

            urlOrModfunc(newValues);

            (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Apply(newValues,mode==TerminalJs.ForceModes.Push)

        }

    }

    ApplyValuesAndCheckIfPush(values:any,clean:boolean=false):boolean{

        var statesValue = this.StatesVals,
             i, isPush = false;

        if (clean) {

            for(i in statesValue){

                if(values[i]==undefined){

                    if(statesValue[i].type<0){

                        continue

                    }

                    values[i] = null

                }

                statesValue[i].value = values[i]

                isPush = isPush||statesValue[i].isPushUrl

                this.PrepareStateUrl(i,values[i])

            }

        }else{

            for(i in values){

                statesValue[i].value = values[i]

                isPush = isPush||statesValue[i].isPushUrl

                this.PrepareStateUrl(i,values[i])

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

export class TerminalJsCommand{

    CommandStr:string
    Params:TerminalJsCommandParamsAbstract = {}
    MustParamCount:number
    BehaviorFunc:(params:TerminalJsCommandParamsAbstract,after:any)=>boolean
    IsPush:boolean
    Syntax:string

    constructor(syntax:string,behaviorFunc:(params:TerminalJsCommandParamsAbstract,after:any)=>boolean,isPush:boolean){

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

        this.MustParamCount = must

    }

    Match(input:string):boolean{

        if(input.indexOf(this.CommandStr)===0&&this.MatchParams(input)){

            this.Exec()

            return true

        }

        return false

    }

    MatchParams(input:string):boolean{

        var inputParams = input.split("/"),i:string,params = this.Params,seek = 1;

        if(inputParams.length>this.MustParamCount){

            for(i in params){

                params[i].value = this.MatchParamValue(params[i],inputParams[seek])

                seek++

            }

            return true

        }

        return false

    }

    MatchParamValue(param:TerminalJsCommandParamAbstract,val:string):any{

        if(val){

            try{

                switch (param.type){

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

            }catch(e){

                throw "match fail"

            }



        }else{

            return param.default

        }

    }

    Exec(){

        var after:any = {},i,
            res = this.BehaviorFunc(this.Params,after);

        if(res||res===undefined){

            for(i in after){

                (new TerminalJsFlow(null,TerminalJsFlow.CmdSrcs.Cmd,1).Apply(after,this.IsPush))

                break

            }

        }

    }

}

export class TerminalJsFlow{

    static CmdSrcs = {Cmd:1,Url:0}
    Url:string = null
    Src:number
    IsBack:boolean = false
    IsPushUrl:boolean = false
    PresetDirection:number
    ValueAfter:{[stateName:string]:any} = {}

    constructor(url:string,src:number,presetDirection:number=0){

        this.Url = url
        this.Src = src
        this.PresetDirection = presetDirection

    }

    Start(forceMod:string=""){

        this.parseValue()

        this.run(forceMod)

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

        for(i in valueAfter){

            if(statesValue[i]){

                statesValue[i].callback(valueAfter[i],isBack)

                terminalJs.Callback(i,valueAfter[i],isBack)

            }

        }

    }

    parseValue(url:string = this.Url){

        var keyword = terminalJs.Keyword,rx = new RegExp("\\"+keyword+"(([a-zA-Z][^\/]+)([^\\"+keyword+"]*))","g"),
            match,urls = url.split(keyword),commands = terminalJs.CustomCommands,commandCount = commands.length,
            matchCommand = function (input:string):boolean {

                var i=0

                for(;i<commandCount;i++){

                    if(commands[i].Match(input)){

                        return true

                    }

                }

                return false

            };

        if(urls[0]){

            this.ValueFormUrl("main",urls[0].replace(/^\/|\/$/g,""))

        }

        while((match = rx.exec(url))!=null){

            if(!matchCommand(match[1])){

                this.ValueFormUrl(match[2],match[3].replace(/^\/|\/$/g,""))

            }

        }

    }

    optionValueFromUrl(type:number,valStr:string,stateNode:any):void{

        var types =  terminalJs.StateTypes,i,c,res:CmdObjectInDepthRes,
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

            case types.Tree||types.HiddenTree:
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

            case types.Object||types.HiddenObject:

                params = valStr.split("/")

                for(i=0,c=params.length;i<c;i+=2){

                    vals = params[(i+1)].substr(1).split(",")

                    res = TerminalJsFlow.CmdObjectInDepth(params[i],stateNode)

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

    ValueFormUrl(stateName:string, stateValue:string){

        var TerminalJs = terminalJs,stateVal = TerminalJs.StatesVals[stateName],val:any,res:CmdObjectInDepthRes,i,c,tmp:any;


        if(stateVal!=undefined){

            val = this.ValueAfter[stateName]===undefined?stateVal.value:this.ValueAfter[stateName]

            if(TerminalJs.urlParts[stateName]!=stateName+"/"+stateValue){

                var type = stateVal.type,types = TerminalJs.StateTypes,
                    valStr = stateValue,nodes;


                if(stateValue==""){

                    val = null

                }else if((type>types.Number||type<types.HiddenNumber)&&/(?:^[\!\-\+]|\/[\!\-\+])/.test(valStr)){

                    if(val===null||val===undefined){

                        val = type===4?[]:{}

                    }else{

                        val = JSON.parse(JSON.stringify(val))

                    }

                    this.optionValueFromUrl(type,valStr,val)

                }else{

                    switch (type){

                        case types.String||types.HiddenString:

                            if(valStr.indexOf("!")===0){

                                valStr = decodeURIComponent(valStr.substr(1))
                                val = valStr==val?null:valStr

                            }else{

                                val = terminalJs.decodeKeyword(decodeURIComponent(valStr?valStr:null))

                            }

                            break
                        case types.Number||types.HiddenNumber:

                            if(valStr.indexOf("!")===0){

                                i = Number(valStr.substr(1))
                                val = i===val?null:i

                            }else{

                                val = Number(valStr)

                            }

                            break
                        case types.Boolean||types.HiddenBoolean:
                            val = valStr=="toggle"?!val:valStr=="true"
                            break
                        case types.Array||types.HiddenArray:

                            if(/^[0-9\,\.\-]+$/.test(valStr)){

                                val = valStr.split(",").map(Number)

                            }else{

                                val = valStr?valStr.split(",").map(decodeURIComponent):[]

                            }

                            break
                        case types.Tree||types.HiddenTree:

                            if(valStr){

                                val = val?val:{}
                                nodes = valStr.split("/")

                                for(i=0,c = nodes.length;i<c;i+=2){

                                    tmp = nodes[(i+1)]

                                    if(/^[0-9\,\.\-]+$/.test(tmp)){

                                        val[nodes[i]] = tmp.split(",").map(Number)

                                    }else{

                                        val[nodes[i]] = tmp?tmp.split(",").map(decodeURIComponent):[]

                                    }

                                }

                            }else{

                                val = {}

                            }

                            break
                        default:


                            if(valStr.indexOf("%7B")==0||valStr.indexOf("%5B")==0){

                                val = JSON.parse(decodeURIComponent(valStr).trim())

                            }else{

                                val = val?val:{}
                                nodes = valStr.split("/")

                                for(i=0,c = nodes.length;i<c;i+=2){

                                    res = TerminalJsFlow.CmdObjectInDepth(nodes[i],val)

                                    tmp = nodes[(i+1)]

                                    if(/^[0-9\,\.\-]+$/.test(tmp)){

                                        res.Object[res.LastKey] = tmp.split(",").map(Number)

                                    }else if(tmp.indexOf(",")===-1){

                                        res.Object[res.LastKey] = tmp

                                    }else{

                                        res.Object[res.LastKey] = tmp?tmp.split(",").map(decodeURIComponent):[]

                                    }

                                }

                            }

                    }

                }

                this.ValueAfter[stateName] = val

            }else if(this.Src==TerminalJsFlow.CmdSrcs.Url){

                this.ValueAfter[stateName] = val

            }

        }else{

            terminalJs.PresetStateUrl[stateName] = terminalJs.Keyword+stateName+"/"+stateValue

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

var terminalJs:TerminalJs = new TerminalJs();

export {terminalJs};