import {terminalJs} from "../../TerminalJs";

var StateCallbacks:{[key:string]:(value:any,isBack:boolean,stateName:string)=>void} = {},
    StateTest = function (initialized=false){

    let valStrs={"boolean":"true","string":"aaaaa","number":"1234","array":"2,45,6","tree":"a/1,2/b/3/c//d/12,2","object":'{"obj":{"str":"abc","array":[1,2,3]}}'},
        vals={"boolean":true,"string":"aaaaa","number":1234,"array":["2","45","6"],"tree":{a:["1","2"],b:["3"],c:[],d:["12","2"]},"object":{"obj":{"str":"abc","array":[1,2,3]}}},
        test = function (j:string) {

            var stateName = (initialized?"dynamic":"init")+j,typeName = j.toLowerCase().replace("hidden",""),isPush = Math.random()>.5

            StateCallbacks[stateName] = function (v:any,isBack:boolean,name:string) {

                QUnit.test( "state callback: "+stateName, function( assert ) {

                    assert.ok(  true , "state changed" );
                    assert.equal(  name,stateName , "state name match" );
                    assert.equal(  JSON.stringify(v),JSON.stringify(vals[typeName]) , "default value match" );


                });

            }

            terminalJs.AddState(stateName,vals[typeName],StateCallbacks[stateName],isPush,terminalJs.StateTypes[j])

            QUnit.test( "setup state: "+stateName, function( assert ) {

                assert.ok(  terminalJs.StatesVals[stateName] , "state created" );
                assert.equal(  terminalJs.StatesVals[stateName].name, stateName , "name ok" );
                assert.equal(  terminalJs.StatesVals[stateName].type, terminalJs.StateTypes[j] , "type ok" );

                if(initialized){

                    assert.equal(  JSON.stringify(terminalJs.StatesVals[stateName].value), JSON.stringify(vals[typeName]) , "default value ok" );

                }

            });

        }


        for(let i in terminalJs.StateTypes){

            if(i!="Auto"){

                test(i)

            }

        }

        return terminalJs

}

export {StateTest}
export {StateCallbacks}