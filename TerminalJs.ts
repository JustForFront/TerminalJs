var log = console.log

class TerminalJs{

    static StateTypes = {"HiddenTree":-6,"HiddenArray":-5,"HiddenObject":-4,"HiddenNumber":-3,"HiddenBoolean":-2,"HiddenString":-1,
        "Auto":0,"String":1,"Boolean":2,"Number":3,"Object":4,"Array":5,"Tree":6}
    StateTypes = TerminalJs.StateTypes
    States:any = {}
    StatesVals:{[stateName:string]:TerminalJsValue} = {}
    PresetStateUrl:{[stateName:string]:string} = {}
    Keyword:string = "$"
    UrlSpiltter:string = "/index.html"
    urlParts:{[key:string]:string} = {}
    history:string[] = []
    historyPosition:number = 0
    private callbacks:((val:any,isBack:boolean,stateName:string)=>void)[] = [];
    private callbackCount:number = 0;
    private forceMode:string = ""
    private forceUpdateList:{[key:string]:()=>void} = {}
    private currentUrl:string
    private incomingUrl:string
    private hashNumber:number = 0
    private initalized:boolean = false

    constructor(){}

    UrlParams(url:string=location.href):{[key:string]:any} {
        var q = url.split("?"),query_string = {},query = q.length==1?"":q[1].substring(1),vars = query.split("&");
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

        var that = this,url = that.getCurrentUrl();

        if(url){

            (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url)).Start()

        }

        that.DefaultValToUrl()

        that.initalized = true

        return that

    }

    historyHandler(newUrl:string,flow:TerminalJsFlow=null):boolean{

        var that = this,isBack = false,list = that.history,pos = that.historyPosition,l=list.length;

        that.incomingUrl = newUrl

        if(flow&&flow.PresetDirection!==0){

            isBack = flow.PresetDirection===-1

        }else if(l>pos&&list[pos+1]==newUrl){

            isBack = true

        }else if(pos==l-1){

            isBack = newUrl.length>that.currentUrl.length

        }

        if(isBack){

            if(pos==l-1){

                list.push(newUrl)

            }

            that.historyPosition++;

        }else{

            list.unshift(newUrl)

        }

        return isBack

    }

    AddState(stateName:string,defaultVal:any=null,OnChanged:(newVal:any,isBack:boolean,name:string)=>void=null,isPushUrl:boolean=true,type:number=TerminalJs.StateTypes.Auto):TerminalJs{

        var oJson = "",that = this,stateTypes = that.StateTypes,vals = that.StatesVals,onChanged = function (newVal:any) {

            if(that.forceMode==""){

                oJson = ""

                that.ToUrl(stateName,newVal,isPushUrl)

                if(OnChanged){

                    OnChanged(newVal,that.historyHandler(that.currentUrl),stateName)

                }

            }else{

                that.forceUpdateList[stateName] = function () {

                    OnChanged(newVal,false,stateName)

                }

            }

        };

        if(type==stateTypes.Auto){

            type = that.parseValType(defaultVal)

        }

        vals[stateName] = new TerminalJsValue(stateName,null,defaultVal,type,isPushUrl,OnChanged?[OnChanged]:[])

        Object.defineProperty(that.States, stateName, {
            get: function () {

                if(type>stateTypes.Number||type<stateTypes.HiddenNumber){

                    if(that.forceMode==""){

                        oJson = JSON.stringify(vals[stateName].value)

                        setTimeout(function () {

                            if(oJson&&JSON.stringify(vals[stateName].value)!=oJson){

                                onChanged(vals[stateName].value)

                            }

                        },1)

                    }else{

                        that.forceUpdateList[stateName] = function () {

                            OnChanged(vals[stateName].value,false,stateName)

                        }

                    }

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

        if(that.initalized){

            let isPush = isPushUrl,preUrl = that.PresetStateUrl[stateName];

            vals[stateName].isPushUrl = isPushUrl = false

            if(preUrl){

                (new TerminalJsFlow(preUrl,TerminalJsFlow.CmdSrcs.Cmd,1)).Start("replaceUrl")

            }else{

                that.States[stateName] = defaultVal

            }

            vals[stateName].isPushUrl = isPushUrl = isPush

        }

        return that

    }

    AddCallback(stateNameStartToAll:string,callback:(val:any,isBack:boolean,stateName:string)=>void){

        var that = this;

        if(stateNameStartToAll=="*"){

            that.callbacks.push(callback)
            that.callbackCount++;

        }else{

            that.StatesVals[stateNameStartToAll].AddCallback(callback)

        }

    }

    RemoveCallback(stateNameStartToAll:string,callback:(val:any,isBack:boolean,stateName:string)=>void){

        var that = this;

        if(stateNameStartToAll=="*"){

            that.callbacks.splice(that.callbacks.indexOf(callback),1)

            that.callbackCount--;

        }else{

            that.StatesVals[stateNameStartToAll].RemoveCallback(callback)

        }

    }

    Callback(stateName:string,val:any,isBack:any){

        var that = this,i,callbacks;

        if(that.callbackCount){

            callbacks = that.callbacks;

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

    private parseValType(val:any):number{

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

    private formatValUrl(stateName:string,stateVal:any):string{

        if(stateVal===null||stateVal===undefined){

            return ""

        }

        let that = this,type = that.StatesVals[stateName].type,types = that.StateTypes,t;

        if(type<types.Auto){

            return ""

        }

        stateName = stateName=="main"?"":stateName+"/"

        switch (type){

            case types.String:

                return stateName+stateVal.replace(/^\/|\/$/,"")+""

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

    private getFullUrl():string{

        var parts = this.urlParts,url:string[] = [],keyword = this.Keyword;

        for(let i in parts){

            url.push((i=="main"?"":keyword)+parts[i])

        }

        this.currentUrl = "/"+url.join("/")

        return this.currentUrl

    }

    DefaultValToUrl():void{

        var that = this;

        that.ForceReplaceUrl(function () {

            let i,parts = that.urlParts;

            for(i in that.StatesVals){

                if(parts[i]==undefined){

                    that.forceUpdateList[i] = that.StatesVals[i].SetDefault()

                }

            }

        })

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

    getCurrentUrl():string{

        var urls = location.href.split(this.UrlSpiltter)

        return urls.length==1?"":urls.slice(1).join(this.UrlSpiltter)

    }

    MonitorDom(dom:HTMLElement=document.body):TerminalJs{

        var that = this;

        dom.addEventListener("click",function (e:Event) {

            e.preventDefault();
            e.stopPropagation();

            var dom : Element = <Element>e.target

            if (dom && dom.matches("a,a *")) {

                while ( dom.tagName!="A"){

                    dom = dom.parentElement

                }

                var url : string = dom.getAttribute("href");

                if(!dom.classList.contains("external")){

                    if(url.indexOf("/")==0||url.indexOf(that.Keyword)==0||
                        (
                            url.indexOf("://")!==-1&&
                            url.indexOf("http://")!==0&&
                            url.indexOf("https://")!==0&&
                            url.indexOf("ftp://")!==0&&
                            url.indexOf("file://")!==0&&
                            url.indexOf("//")!==0
                        )){

                        that.ExeCmd(url,dom.classList.contains("back"))

                        return false

                    }

                }else{

                    location.href = url

                }

            }

            return false

        })

        return that

    }

    ExeCmd(cmd:string,isBack:boolean=false){

        (new TerminalJsFlow(cmd,TerminalJsFlow.CmdSrcs.Cmd,isBack?-1:1)).Start()

    }

    MonitorUrl():TerminalJs{

        var that = this,checkDirection = function (hashStr:string):number {

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

            let url = that.getCurrentUrl(),params:string[];

            if(that.currentUrl!=url){

                params = (new RegExp("\\"+that.Keyword+"([0-9]+)$")).exec(url);

                (new TerminalJsFlow(url,TerminalJsFlow.CmdSrcs.Url,checkDirection(params?params[1]:null))).Start()

            }

        }

        return that

    }

    ProcessFlow(flow:TerminalJsFlow){

        var that = this,url;

        if(flow.Src==TerminalJsFlow.CmdSrcs.Cmd){

            url = that.getFullUrl()

            if(flow.IsPushUrl){

                that.pushUrl(url)

            }else{

                that.replaceUrl(url)

            }

        }else{

            url = that.currentUrl = flow.Url

        }

        flow.DoChangeCallbacks(that.historyHandler(url,flow))

    }

    private pushUrl(url:string){

        var that = this;

        that.hashNumber++

        history.pushState({},document.title,this.UrlSpiltter+url+that.Keyword+that.hashNumber)


    }

    private replaceUrl(url:string){

        var that = this;

        history.replaceState({},document.title,that.UrlSpiltter+url+(that.hashNumber?that.Keyword+that.hashNumber:""))

    }

    ForcePushUrl(urlOrModfunc:(state:any)=>void|string):void{

        this.forceMod("pushUrl",urlOrModfunc)

    }

    ForceReplaceUrl(urlOrModfunc:(state:any)=>void|string):void{

        this.forceMod("replaceUrl",urlOrModfunc)

    }

    private forceMod(mode:string,urlOrModfunc:(state:any)=>void|string){

        var that = this;

        that.forceMode = mode
        that.forceUpdateList = {}

        if(typeof urlOrModfunc=="string"){

            (new TerminalJsFlow(String(urlOrModfunc),TerminalJsFlow.CmdSrcs.Cmd)).Start(mode)

        }else{

            urlOrModfunc(this.States)

            that.forceUpdateUrl()

        }

        that.forceMode = ""

    }

    forceUpdateUrl(){

        var that = this,list = that.forceUpdateList,i,stateVals = that.StatesVals;

        for(i in list){

            that.PrepareStateUrl(i,stateVals[i].value)

        }

        that[that.forceMode](that.getFullUrl())

        for(i in list){

            if(list[i]){

                list[i]()

            }

        }

        this.forceUpdateList = null

    }

}

interface CmdObjectInDepthRes{
    Object:any
    LastKey:string|number
}

class TerminalJsFlow{

    static CmdSrcs = {Cmd:1,Url:0}
    Url:string
    Src:number
    IsBack:boolean = false
    IsPushUrl:boolean = false
    PresetDirection:number
    ValueAfter:{[stateName:string]:any} = {}
    private TerminalJs:TerminalJs

    constructor(url:string,src:number,presetDirection:number=0){

        var that = this;

        that.Url = url
        that.Src = src
        that.PresetDirection = presetDirection
        that.TerminalJs = terminalJs

    }

    Start(forceMod:string=""){

        var that = this

        that.parseValue()

        that.applyValueAndSetIfPush(forceMod)

        that.TerminalJs.ProcessFlow(that)

    }

    applyValueAndSetIfPush(forceMod:string) {

        var that = this, statesValue = that.TerminalJs.StatesVals,
            valueAfter = that.ValueAfter, i, isPush = false;

        if (that.Src == TerminalJsFlow.CmdSrcs.Url) {

            for(i in statesValue){

                if(valueAfter[i]==undefined){

                    if(statesValue[i].type<0){

                        continue

                    }

                    valueAfter[i] = null

                }

                statesValue[i].value = valueAfter[i]

                isPush = isPush||statesValue[i].isPushUrl

                that.TerminalJs.PrepareStateUrl(i,valueAfter[i])

            }

        }else{

            for(i in valueAfter){

                statesValue[i].value = valueAfter[i]

                isPush = isPush||statesValue[i].isPushUrl

                that.TerminalJs.PrepareStateUrl(i,valueAfter[i])

            }

        }

        that.IsPushUrl = forceMod==""?isPush:(forceMod=="replaceUrl"?false:true)

    }

    DoChangeCallbacks(isBack:boolean){

        var that = this,statesValue = that.TerminalJs.StatesVals,valueAfter = that.ValueAfter,i;

        for(i in valueAfter){

            if(statesValue[i]){

                statesValue[i].callback(valueAfter[i],isBack)

            }

        }

    }

    parseValue(){

        var that = this,url = that.Url,keyword = that.TerminalJs.Keyword,rx = new RegExp("(\\"+keyword+"([^\/]+)\/([^\\"+keyword+"]*))","g"),
            match,urls = url.split(keyword);

        if(urls[0]){

            that.ValueFormUrl("main",urls[0].replace(/^\/|\/$/g,""))

        }

        while((match = rx.exec(url))!=null){

            that.ValueFormUrl(match[2],match[3].replace(/\/$/,""))

        }

    }

    optionValueFromUrl(type:number,valStr:string,stateNode:any):void{

        var that = this.TerminalJs,types = that.StateTypes,i,c,res:CmdObjectInDepthRes,
            arraySub = function (target:any[],src:any[]) {

                let i,c,pos;

                for(i=0,c=src.length;i<c;i++){

                    pos = target.indexOf(decodeURIComponent(src[i]))

                    if(pos!==-1){

                        target.splice(pos,1)

                    }

                }

            },arrayToggle = function (target:any[],src:any[]) {

                let i,c,pos;

                for(i=0,c=src.length;i<c;i++){

                    src[i] = decodeURIComponent(src[i])
                    pos = target.indexOf(src[i])

                    if(pos===-1){

                        target.push(src[i])

                    }else{

                        target.splice(pos,1)

                    }

                }

            },arrayAdd = function (target:any[],src:any[]) {

                let i,c;

                for(i=0,c=src.length;i<c;i++){

                    target.push(decodeURIComponent(src[i]))

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

        var that = this,TerminalJs = that.TerminalJs,stateVal = TerminalJs.StatesVals[stateName],val:any,res:CmdObjectInDepthRes,i,c;

        if(stateVal!=undefined){

            val = that.ValueAfter[stateName]===undefined?stateVal.value:that.ValueAfter[stateName]

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

                                val = decodeURIComponent(valStr?valStr:null)

                            }

                            break
                        case types.Number||types.HiddenNumber:
                            val = Number(valStr)
                            break
                        case types.Boolean||types.HiddenBoolean:
                            val = valStr=="toggle"?!val:valStr=="true"
                            break
                        case types.Array||types.HiddenArray:
                            val = valStr?valStr.split(",").map( decodeURIComponent):[]
                            break
                        case types.Tree||types.HiddenTree:

                            if(valStr){

                                val = val?val:{}
                                nodes = valStr.split("/")

                                for(i=0,c = nodes.length;i<c;i+=2){

                                    val[nodes[i]] = nodes[(i+1)]?nodes[(i+1)].split(",").map( decodeURIComponent):[]

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

                                    res.Object[res.LastKey] = nodes[(i+1)]

                                }

                            }

                    }

                }

                that.ValueAfter[stateName] = val

            }else if(that.Src==TerminalJsFlow.CmdSrcs.Url){

                that.ValueAfter[stateName] = val

            }

        }else{

            that.TerminalJs.PresetStateUrl[stateName] = that.TerminalJs.Keyword+stateName+"/"+stateValue

        }

    }

    static CmdObjectInDepth(keyCmd:string,Obj):CmdObjectInDepthRes{

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

class TerminalJsValue{

    name:string
    value:any
    default:any
    type:number
    isPushUrl:boolean
    private callbacks:((newVal:any,isBack:boolean,name:string)=>void)[]
    private callbackCount = 0

    constructor(name:string,value:any,defaultValue:any,type:number,isPushUrl:boolean,callbacks:((newVal:any,isBack:boolean,name:string)=>void)[]){

        var that = this;

        that.name = name
        that.value = value
        that.callbacks = callbacks
        that.default = defaultValue
        that.isPushUrl = isPushUrl
        that.type = type

        if(callbacks){

            that.callbackCount = 1

        }

    }

    callback(newVal:any,isBack:boolean){

        var that = this,callbacks,i,c,name;

        if(that.callbackCount){

            callbacks = that.callbacks
            name = that.name

            for(i=0,c=callbacks.length;i<c;i++){

                callbacks[i](newVal,isBack,name)

            }

        }

    }

    AddCallback(callback:(newVal:any,isBack:boolean,name:string)=>void){

        var that = this;

        that.callbacks.push(callback)

        that.callbackCount++

    }

    RemoveCallback(callback:(newVal:any,isBack:boolean,name:string)=>void){

        var that = this;

        that.callbacks.splice(that.callbacks.indexOf(callback),1)

        that.callbackCount--

    }

    SetDefault():()=>void{

        var that = this;

        if(typeof that.default=="function"){

            that.checkValue()

            return null

        }else{

            that.value = that.default

            return function () {

                that.callback(that.default,false)

            }

        }

    }

    private checkValue(){

        var that = this;

        that.default(function (res:any,retryTime:number) {

            that.value = res
            that.callback(res,false)

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