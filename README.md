# TERMINALJS

## INTRODUCTION

State management should be easy and flexible. TerminalJs is created under this believe. It simply maintains all the states value under one tree and selectively sync them to URL. Then you control them through simple commands from Javascript call or anchor DOM attribute. Since it sync states to URL, all states changes are traceable, reversible and sharable. Thus your states will be in control and you may just focus on their changes callbacks to create actual app behaviors. Give it five minutes to see how it change the way you build apps.

### It’s a terminal!

Once all state changing attempts were able to run in form of commands, coding and tracing will be easier then ever. All simple value manipulation commands are pre-defined, additional commands are also welcome to fit any usage.

### It manage URL!

Delegated states are synced with URL. It enable the browser back, forward and bookmark features out of box. Plus the current URL could be share to anyone in any platform you like without any additional code.

### It’s flexible & lightweight!

The package just got one single file in AMD or CMD package with ~30KB non-compressed file size. It preserve room for your favorite UI / MVVM frameworks to work with.

## HOW IT WORKS

### html
```html
<h1 id="title"></h1>
<a href="$title/!TerminalJs is really cool">Make a command to terminal</a>
<script src="/require.js"></script>
<script>
    require(["App"])
</script>
```

### App.ts
```javascript
import {terminalJs} from "TerminalJs";

//define state and callback
terminalJs.AddState("title","TerminalJs",function (value,isBack) {

    document.getElementById("title").innerHTML = value

})

//listen to dom click & url pop state
terminalJs.MonitorUrl().MonitorDom().Init()
```


### Complied App.js
```javascript
define(["require", "exports", "TerminalJs"], function (require, exports, TerminalJs_1) {
  TerminalJs_1.terminalJs.AddState("title", "TerminalJs", function (value, isBack) {
      document.getElementById("title").innerHTML = value;
  });
  TerminalJs_1.terminalJs.MonitorUrl().MonitorDom().Init();
});
```

## BASIC HOWTO

#### Set state
```javascript
/*
param1:string = state name
param2:any = default value, nullable
param3:(newValue:any,isBack:boolean,stateName:string)=>void=null = state value changed callback
param4:boolean = default:true, set if want to use pushstate to sync url onchange. Use replaceState if false
param5:number = default:0, value type of state, see type list below, 0 means auto detect from default value
*/
terminalJs.AddState("state name","default value",function (changedValue,isBack,stateName) {

    //do something on state change

})
```

#### Check state exist
```javascript
terminalJs.StateExist('title') //true
```

#### Get state value
```javascript
title = terminalJs.GetStateValue('title')
```

#### Set state value by setter
```javascript
terminalJs.States["title"] = "This is a title from JS setter, note that it's experimental but works with array/object!"
terminalJs.States["array"].push('I can also trigger setter!')
```

#### Execute command from HTML
```html
<script>terminalJs.MonitorDom()</script>
<a href="$title/A title from a anchor">Change title state value!</a>
```

#### Execute command from js/ts
```javascript
/*
param1:string = a string command
param2:boolean = defaule:false, set to true if you want to tell the callback it is a history back action
param3:string = defaule:, method to change url, empty string means follow states settings. See static var TerminalJs.ForceModes
*/
terminalJs.ExeCmd('$title/I am a title from JAVASCRIPT')
```

#### Handle Url Changes
```javascript
terminalJs.MonitorUrl()

terminalJs.ExeCmd('$title/title before') // title = 'title before'
terminalJs.ExeCmd('$title/title after') // title = 'title after'

history.back() // title = 'title before'

```

#### Debug
```javascript
//TerminalJs.ts
//disable to improve preformance
static Debug:boolean = true

TerminalJsTrace() //print trace records
```

## STATE VALUE TYPES

TYPE | Sync to url | VAR | DESC
------------ | ------------ | ------------- | -------------
Auto | T | terminalJs.StateTypes.Auto | Determine with default value
String | T | terminalJs.StateTypes.String | String
Boolean | T | terminalJs.StateTypes.Boolean | Boolean
Number | T | terminalJs.StateTypes.Number | Number
Object | T | terminalJs.StateTypes.Object | Free structured object
Array | T | terminalJs.StateTypes.Array | Array of numbers or strings
Tree | T | terminalJs.StateTypes.Tree | A object contain string keys and array values 
Hidden String | F | terminalJs.StateTypes.HiddenString | String
Hidden Boolean | F | terminalJs.StateTypes.HiddenBoolean | Boolean
Hidden Number | F | terminalJs.StateTypes.HiddenNumber | Number
Hidden Object | F | terminalJs.StateTypes.HiddenObject | Free structured object
Hidden Array | F | terminalJs.StateTypes.HiddenArray | Array of numbers or strings
Hidden Tree | F | terminalJs.StateTypes.HiddenTree | A object contain string keys and array values 

## BASIC COMMAND

#### Change value
```javascript
terminalJs.ExeCmd('$string/Change to this string') // string = 'Change to this string'

terminalJs.ExeCmd('$number/123.45') // number = 123.45

terminalJs.ExeCmd('$boolean/true') // boolean = true
terminalJs.ExeCmd('$boolean/toggle') // boolean = false

terminalJs.ExeCmd('$array/1|2|3') // set number, array = [1,2,3]
terminalJs.ExeCmd('$array/a,b,c') // set strings, array = ["a","b","c"]
terminalJs.ExeCmd('$array/+d') // add value, array = ["a","b","c","d"]
terminalJs.ExeCmd('$array/-a') // remove value, array = ["b","c","d"]
terminalJs.ExeCmd('$array/!a,c') // toggle values, array = ["a","b","d"]

terminalJs.ExeCmd('$tree/numbers/1|2|3') // set number, tree = {numbers:[1,2,3]}
terminalJs.ExeCmd('$tree/strings/a,b,c') // set strings, tree = {numbers:[1,2,3],strings:["a","b","c"]}
terminalJs.ExeCmd('$tree/strings/+d') // add value, tree = {numbers:[1,2,3],strings:["a","b","c","d"]}
terminalJs.ExeCmd('$tree/strings/-a') // remove value, tree = {numbers:[1,2,3],strings:["b","c","d"]}
terminalJs.ExeCmd('$tree/strings/!a,c') // toggle values, tree = {numbers:[1,2,3],strings:["a","b","d"]}

terminalJs.ExeCmd('$object/{"setByJson":{"is":"ok"}}') // object = {setByJson:{is:"ok"}}
terminalJs.ExeCmd('$object/byStr.is/also ok') // object = {setByJson:{is:"ok"},byStr:{is:"also ok"}}

terminalJs.ExeCmd('$string/combine command string/$number/234') // string = 'combine command string', number = 234

//PS: commands to unset state will add to queue until the state is set
```

#### Reset to default value
```javascript
terminalJs.ExeCmd('reset/title') //reset title state, title = 'TerminalJs'
terminalJs.ExeCmd('reset') //reset all state
```

## ADVANCED HOWTO

#### Add callback to state
```javascript
/*
param1:string = state name
param2:(newValue:any,isBack:boolean,stateName:string)=>void=null = state value changed callback
*/
terminalJs.AddCallback("title",function(val:any,isBack:boolean,stateName:string)=>void){

  document.getElementById("footer_title").innerHTML = value

})
```

#### Remove callback from state
```javascript
/*
param1:string = state name
param2:(newValue:any,isBack:boolean,stateName:string)=>void=null = callback function to remove
*/
terminalJs.RemoveCallback("*",changeListenor)
```

#### Custom command
```javascript
/*
param1:string = command syntax, see COMMAND SYNTAX section
param2:boolean = defaule:false, set to true if you want for use pushState
*/
terminalJs.AddCommand("null/$stateName:string:ALL",defaultValToUrl(params,values){

  var stateName = params["stateName"].value

  if(stateName=="ALL"){

    for(i in vals){

      values[i] = null

    }

  }else{

    values[stateName] = null

  }

},true)
```

#### Force replaceState
```javascript
/*
param1:string|(stateValues:any)=>void = a string command / a function to set new value(s) to state(s)
param2:boolean = defaule:false, set to true if you want to tell the callback it is a history back action
*/
terminalJs.ForceReplaceUrl(function(stateValues:any){
  
  stateValues["title"] = terminalJs.GetStateValue('title')+" add something"

},false);
```

#### Force pushState
```javascript
/*
param1:string|(stateValues:any)=>void = a string command / a function to set new value(s) to state(s)
param2:boolean = defaule:false, set to true if you want to tell the callback it is a history back action
*/
terminalJs.ForcePushUrl(function(stateValues:any){
  
  stateValues["title"] = terminalJs.GetStateValue('title')+" add something and make browser history forward"

},false);
```

## COMMAND SYNTAX

#### Syntax
```
action/$varName1:Type[string|number|boolean|json](optional):defaultValue(optional)/$varName2...
```

#### Example

```
logined/$userId:number/$userName:string/$userGroup:number:0

will match

logined/1/Foo/2
logined/2/Bar
```
*The vars have default value must place after the vars don't

## ROADMAP
- [x] 2016-09 wk 5 **Unit testes**
- [X] 2016-10 wk 1 **Rewrite command system**
- [X] 2016-10 wk 2 **Command tracer**
- [ ] 2016-10 wk 3 Document
- [ ] 2016-10 wk 4 1.0 Beta
