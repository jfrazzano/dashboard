importScripts("../../bower_components/firebase/firebase.js");
(function(){


  "use strict";

Polymer({

  is:"fc-database-webworker",
  properties:{
    fb:{
      type: String,
      value: function(){return null;},
      notify: true,
      },
  initialized:{
      type: String,
      value: function(){return false;},
      notify: true,
    },
  request:{
      type: String,
      value: function(){return null;},
      notify: true,
    },
  data:{
      type: Array,
      value: function(){return [];},
      notify: true,
  },
  asGrid:{
    type: Array,
      value: function(){return [];},
      notify: true,
  },
  asInputPage:{
    type: Array,
    value: function(){return [];},
    notify: true,
  },
  asInputPairs:{
     type: Array,
      value: function(){return [];},
      notify: true,
  },
  asIndexedDb:{
     type: Array,
      value: function(){return [];},
      notify: true,
    },
  numThreads: {
        type: Number,
        value: 2
      },
  _callbacks: {
        type: Object,
        value: function (){return {};},
      },
  _currentThreadIndex: {
        type: Number,
        value: 0
      },
  _threads: {
        type: Array,
        value: function(){return [];},
        },
    _workerRun: {
        type: Number,
        value: 0
        },
    
    },


 initialize(){
   this.fb = new Firebase("https://focused0ne.firebaseio.com/events");
    setTimeout(()=>{this.createIndex("indexOfDatabases", 1, false, this.localDisplayedOfDBIndexSetter,this);},10);setTimeout(()=>{this.makeGrids(this.dataArraysCallBackSetter,this);},250);
   this.initialized = true;
 },
 ping(argRequest){
  console.log("Data Manager Worker received ping");
  console.log("Data Manager Worker ping arg = " + argRequest.data.data);
  argRequest.data.data = "pinged";
  argRequest.data.status = "complete";
 },
 pong(argRequest){
  console.log("Data Manager Worker received pong");
   console.log("Data Manager Worker pong arg = " + argRequest.data.data);
  argRequest.data.data = "ponged";
  argRequest.data.status = "complete";
 },
 getAllEvents(argRequest){
  console.log("Data Manager Worker received getAllEvents");
  this.request = argRequest;
  this.fb.once("value", this.handleEvents, this);
 }
 handleEvents(argSnapshot){
  console.log("Data Manager Worker", argSnapshot.val());
  this.request.data.data = argSnapshot.val();
  this.request.data.status = "complete";
  postMessage(this.request.data);
 },
 process: function (data, callback) {
      this._workerRun += 1;
      if (callback !== undefined) {
        this._callbacks[this._workerRun] = callback;
      }
      this._threads[this._currentThreadIndex].postMessage({
        workerRun: this._workerRun,
        data: data
      });
      if (this._currentThreadIndex + 1 < this.numThreads) {
        this._currentThreadIndex += 1;
      } else if (this._currentThreadIndex > 0) {
        this._currentThreadIndex  = 0;
      }
    },
    ready: function () {
      var
        ctx = this,
        workerScripts = this._getWorkerScripts(),
        promises = this._getWorkerScriptInlinePromises(workerScripts) || [];

      Promise.all(promises)
        .catch(function (err) {
          console.warn('err', err);
        })
        .then(function () {
          ctx._startWorkers(workerScripts);
        });
    },
    // TODO: Use HTML Imports instead?
    _getWorkerScriptInlinePromise: function (script) {
      var url = script.getAttribute('src');

      return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();

        req.open('GET', url);

        req.onload = function() {
          if (req.status === 200) {
            script.textContent = req.response + script.textContent;
            script.removeAttribute('src');
            resolve(req.response);
          } else {
            reject(new Error(req.statusText));
          }
        };

        req.onerror = function() {
          reject(new Error("Network Error"));
        };

        req.send();
      });
    },
    _getWorkerScriptInlinePromises: function (workerScripts) {
      var
        ctx = this,
        promises = [];

      workerScripts.forEach(function (script) {
        if (script.hasAttribute('src')) {
          promises.push(ctx._getWorkerScriptInlinePromise(script));
        }
      });

      return promises;
    },
    _getWorkerScripts: function () {
      var workerScriptType = 'script[type="text/worker"]';
      return Polymer.dom(this).querySelectorAll(workerScriptType);
    },
    _handleWorkerMessage: function (event) {
      var data = event.data.data,
        workerRun = event.data.workerRun,
        callback = this._callbacks[workerRun];

      if (callback) {
        callback(data);
        delete this._callbacks[workerRun];
      }

      this.fire('message', data);
    },
    _startWorkers: function (workerScripts) {
      var i = 0,
        jsMimeType = { type: "text/javascript" },
        workerCodeExtractor = function (oScript) { return oScript.textContent; },
        workerCode = Array.prototype.map.call(workerScripts, workerCodeExtractor),
        workerMessageHandler = this._handleWorkerMessage.bind(this),
        blob = new Blob(workerCode, jsMimeType),
        objectUrl = window.URL.createObjectURL(blob),
        worker;

      for (i = 0; i < this.numThreads; i += 1) {
        worker = new Worker(objectUrl);
        worker.addEventListener('message', workerMessageHandler);
        this._threads.push(worker);
      }

      this.fire('cosmoz-web-worker-ready');
    },
     
  createColumnsAndRows(cells, context){          
                     var topArray=[];
                     var lastVal=cells.length-1;
                     var columnArray =cells.reduce((pre, val, i, arr)=>{
                        if(pre.length==0)
                          {
                            pre.push(val); 
                            var valKeys=val.id.split("_"); 
                            var mapName="m"+valKeys[0]; 
                            var map=new Map();
                            context.set([mapName], map); 
                            return pre;
                            }
                        else {  
                                var last=pre.,length-1;
                                var keys=pre[last].id.split("_");
                                var valKeys=val.id.split("_");
                                }
                                if(keys[1]==valKeys[1]&&i!==(lastVal))
                                { 
                                  mapName="m"+valKeys[0];
                                   context[mapName].set(val.key, [val.value, val]);
                                       pre.push(val); return pre;
                                }
                                else if(keys[1]!=valKeys[1]){
                                  topArray.push(pre); 
                                  var newArr=[];
                                  newArr.push(val);
                                 
                                  mapName="m"+valKeys[0];
                                  context[mapName].set(val.key, [val.value, val]);
                                  return newArr;
                                }
                                else if(i==(lastVal)&&keys[1]==valKeys[1]){
                                  pre.push(val);
                                  topArray.push(pre);
                                   mapName="m"+valKeys[0];
                                  context[mapName].set(val.key, [val.value, val]);
                                  return topArray;
                                }
                                else if(i==(lastVal)&&keys[1]!=valKeys[1]){
                                  topArray.push(pre); 
                                  var newArr=[];
                                  newArr.push(val);
                                  mapName="m"+valKeys[0];
                                  context[mapName].set(val.key, [val.value, val]);
                                  newArr.push(val);
                                  topArray.push(newArr);
                                  return topArray;
                                }         
                          }, []);
                     return columnArray;
    },//this belongs other side
//believe that the data will come and go in three patterns, so we will need a 
  
  getUpdatedObjectStores(nameArray, context, isInit, index, changeArray){
      var newArray=this.sortTheNameArray(nameArray);
        for(i=0;i<newArray.length;i++){
            
            var gridName=newArray[i][0];
            var cell1;
            var arrayName=gridName;
            var version=newArray[i][1];
            var request = indexedDB.open(gridName, version);//"gridMap"
            var query;
              
          request.onerror = function(e){
                          console.log("Unable to retrieve data from database!");
                        };
          request.onsuccess = function(event){
                      var db = event.target.result;
            var transaction = db.transaction("cell", "readonly");
                      var objectStore = transaction.objectStore("cell");
                      query = objectStore.getAll();
              query.onsuccess = function(queryEvent){
                     cell1 = queryEvent.target.result;
 
                      var arrayToMutate=context.dataArrays[index];
                      var time=new Date().getTime();
                      console.log(context.arrayIndex, index);
                      var keys=cell1[0].id.split("_");
                      var arrayName=keys[0];
                      var id="id";
                      var selector="[id^="+arrayName+"]";
                  
                        var counter =cell1.length;
                        var p=0;
                        for(p=0;p<counter;p++)
                        {
                          var val=cell1[p];
                          var keys=val.id.split("_");
                          var col=parseInt(keys[1]);
                          var row=parseInt(keys[2]);
                          context.splice(["dataArrays", index,col], row, 1, val);
                          context.splice(["selectedArraySet", col], row, 1, val);
                        }
                      var secondTime=new Date().getTime();
                      var delta=((secondTime-time)/1000);
                      console.log(time, secondTime, delta, "here are your times for notifying");
                  }.bind(context);
                }.bind(context);
           
              }//for loop
              return context.dataArrays;
          },

  initDataBasesAndObjectStoresOnFirstLoadToStystem(indicies){
      console.log("we godt this far");
          indicies.forEach(function(val, index, arr){
                      console.log(val, val.data);              
            // var request = indexedDB.open("indexOfDatabases", 1);
            // request.onerror = function(event) {
            //             console.log("db error. we will be deletying this database", val.apiName);
              //             this.deleteObjectStore(val.apiName, 1);


              //       };
              // request.onupgradeneeded = function(event){
              //     var db = event.target.result;
              //     var gridObjectStore = db.createObjectStore(["databases"], {keyPath: "key" });
              //       for(var i=0; i<val.indicies.length;i++)
              //       {
              //           gridObjectStore.createIndex([val.indicies[i]], [val.indicies[i]], { unique: true });
              //       }
              //   };
              //   this.setDatabase(val.apiName,val.version,val.storeName, val.data);
                 //data is from 68 above
                //data=[];
                // for loop ends here
               // var cells=this.indexedDataBases;
               // this.persistCells("indexOfDatabases", 1,cells);
            }, this);
        },
  setDatabase(gridName, version, store, data){

          var request = indexedDB.open(gridName, undefined);
              
              request.onupgradeneeded = function(event){
                  var db = event.target.result;
                  var gridObjectStore = db.createObjectStore([store], {keyPath: "key" });
                    for(var i=0; i<val.indicies.length;i++)
                    {
                        gridObjectStore.createIndex("key", "key", { unique: true });
                    }
          request.onsuccess = function(event){   
                var db = event.target.result;
                console.log(gri,dName);
                var transaction = db.transaction(store, "readwrite");
                var objectStore = transaction.objectStore("cell");
                    data.forEach(function(ca,i,a){
                          objectStore.put(ca);
                    });
                           console.log("db created"); 
              };
            };
          },

  updateDataArraysFromIndexedDatabase(name, version, index, context){
       var time=new Date().getTime();
       console.log(time);
       var timeTwo;
        var request = indexedDB.open(name, version);
        var query;
        var request;
        if(version){
        request = indexedDB.open(name, version);
        }
        else{
          request = indexedDB.open(name, undefined);
        }
        request.onerror = function(e){
            console.log("Unable to retrieve data from database!, will tryAgain");
            request= indexedDB.open(name, undefined);

            request.onerror = function(e){
                console.log("SECOND FAILURE ON DATABASE", name, "WE WILL NOT ATTEMPT TO RETRIEVE DATA AGAIN VIA THIS QUERRY");
            };
            request.onsuccess = function(event){
                 
                console.log("success");
                var db = event.target.result;
                var transaction = db.transaction("cell", "readonly");
                var objectStore = transaction.objectStore("cell");
                query = objectStore.getAll();
                
                query.onerror=function(quev){
                    console.log("After initially opening the database, we have failed to query the object store.  Please try again later");
                };
                query.onsuccess = function(queryEvent){
                  if(asGrid===true){
                   
                   var cells = queryEvent.target.result;
                    this[name]=this.createColumnsAndRows(cells);
                    callbackSetter(this[name],this);
                  }
                  else{                
                        this[name]=queryEvent.target.result;
                        callbackSetter(this[name], this);
                      }
                }.bind(this);
            }.bind(this);
          }.bind(this);
        request.onsuccess = function(event){
            var db = event.target.result;
            var transaction = db.transaction("cell", "readonly");
            var objectStore = transaction.objectStore("cell");
            query = objectStore.getAll();
            
            query.onsuccess = function(queryEvent){
               if(asGrid===true){
                   var cells = queryEvent.target.result;
                  
                    this[name] =this.createColumnsAndRows(cells);
                    callbackSetter(this[name], this);
                    console.log(this[name],"this shit is the grid");
                  }
                  else{ 
                        this[name]=queryEvent.target.result;
                       callbackSetter(this[name], this);
                      }
            }.bind(this);
        }.bind(this);
      },
  getObjectStore(name,version, asGrid, callbackSetter){
        var query;
        var request;
        
        if(version){
        request = indexedDB.open(name, version);
        }
        else{
          request = indexedDB.open(name, undefined);
        }
        request.onerror = function(e){
            console.log("Unable to retrieve data from database!, will tryAgain");
            request= indexedDB.open(name, undefined);

            request.onerror = function(e){
                console.log("SECOND FAILURE ON DATABASE", name, "WE WILL NOT ATTEMPT TO RETRIEVE DATA AGAIN VIA THIS QUERRY");
            };
            request.onsuccess = function(event){
                 
                console.log("success");
                var db = event.target.result;
                var transaction = db.transaction("cell", "readonly");
                var objectStore = transaction.objectStore("cell");
                query = objectStore.getAll();
                
                query.onerror=function(quev){
                    console.log("After initially opening the database, we have failed to query the object store.  Please try again later");
                };
                query.onsuccess = function(queryEvent){
                  if(asGrid===true){
                   
                   var cells = queryEvent.target.result;
                    this[name]=this.createColumnsAndRows(cells);
                    callbackSetter(this[name],this);
                  }
                  else{
                       
                        this[name]=queryEvent.target.result;
                        callbackSetter(this[name], this);
                      }
                }.bind(this);
            }.bind(this);
          }.bind(this);
        request.onsuccess = function(event){
            var db = event.target.result;
            var transaction = db.transaction("cell", "readonly");
            var objectStore = transaction.objectStore("cell");
            query = objectStore.getAll();
            
            query.onsuccess = function(queryEvent){
               if(asGrid===true){
                   var cells = queryEvent.target.result;
                  
                    this[name] =this.createColumnsAndRows(cells);
                    callbackSetter(this[name], this);
                    console.log(this[name],"this shit is the grid");
                  }
                  else{ 
                        this[name]=queryEvent.target.result;
                       callbackSetter(this[name], this);
                      }
            }.bind(this);
        }.bind(this);
      },  
  createGridOfDataArrays(){



    },
  createObjectStoresForDataArrays(){



    },
  updateObjectStoreByPuttingNewObjects(name, version,replacementArray){
      var request=indexedDB.open(name, version);
      request.onerror = (e)=>{
                  console.log("Unable to retrieve data from database. We have stopped propogation of events, but will attempt again to access the newest version of the requested database!");
                  e.stop,Propogation();
                  var request=indexedDB.open(name, undefined);
                  request.onerror = (ev)=>{ 
                          console.log("This is the second failed ATTEMPT.  NO MORE ATTEMPTS WILL BE MADE AT THIS TIME. Please attempt to access your data at a later time.");e.stopPropogation();
                  };
                  request.onsuccess =(event)=>{
                          var db = event.target.result;
                          var transaction = db.transaction("cell", "readwrite");
                          var objectStore = transaction.objectStore("cell");
                          replacementArray.forEach(function(ref){
                                  objectStore.put(ref);
                            });
                          console.log("SUCCESS!!");
                  };
        }
    },
  updateObjectStoresViaCursor(gridName, version, key,propertyPath, setValue){
      //this is a single property updater, way easier all at once, at least at some breakpoint single updates using this for up to data limit x// mass store for data above x
      var request = indexedDB.open(gridName, version);
      request.onsuccess = function(event) 
      {      
        var db = event.target.result;
        var transaction = db.transaction(['cell'], 'readwrite');
        var objectStore = transaction.objectStore('cell');
        //console.log(objectStore, "this is the objectStore on the update");
        
        objectStore.openCursor().onsuccess = function(event)
        {
          var cursor = event.target.result;
          //console.log("this is the cursor in the objectStore", cursor);
          if(cursor) 
          {
            //console.log("this is the key followed by the cursorKey in the object store", key, cursor.value.key);
            if(cursor.value.key < key)
            {
                cursor.continue(key);
            }
           if(cursor.value.key===key)
            {
              var updateData = cursor.value;
              //console.log(updateData, "am in the updateData, this is base data struct");
              updateData[propertyPath] = setValue;

            }
          }
        }.bind(this);
      }.bind(this);
    },

  updateDatabaseIndices(argIndicesArray, argIndexedObjects){
      var data=(argIndicesArray.length>0)?argIndicesArray:(argIndexedObjects.length>0)?argIndexedObjects: [];
      var ref;
      if(data.length>0){
      var keys=data.map(function(val,index, array){
          return val[0];
        });
        var request = indexedDB.open("indexOfDatabases", 1);//"gridMap"
          request.onerror = function(e)
                {
                  console.log("Unable to retrieve data from database! and stopped it!");
                  e.stopPropogation();
                };
          request.onsuccess = function(event){
              var db = event.target.result;
              //console.log(db);
              var transaction = db.transaction("cell", "readwrite");
              var objectStore = transaction.objectStore("cell");
              for(var k=0;k<keys.length;k++){
                var key=keys[k];
               if(argIndicesArray.length==0){
                var update = objectStore.put(data[i][1]);
               }
               else if(argIndicesArray.length>0){
              var query = objectStore.get(key);
              query.onerror = function(queryEvent)
              {
                  console.log("Unable to retrieve data from database!");
                };
              query.onsuccess = function(queryEvent) 
              {
                ref = queryEvent.target.result;
                data[i][1].forEach(function(prop, index, arr){
                 ref[prop[0]]=prop[1];
               });
                 var update = objectStore.put(ref);
               };   
               } 
              update.onsuccess = function(e) {
                 console.log(ref,e.target.result);
                 console.log("we have updated the index ref0ref");
              };
            }//end for loop
          }; //argIndicesArray structure [[keyToLocationToChange of 0,[[prop, changeValue], [prop, changeValue], etc]], ]
      //in the alternative [[key of 0, replacementObject of 0], [key of 1, replacement object of 1], etc...]
        }
      },

  deleteObjectStore(name, version){   
        console.log("CALL ME CALL ME CALL ME");
        indexedDB.deleteDatabase(name);
        console.log("would love this to work");
      },
  
onmessage = function(argRequest){ 
 if(!dm.initialized)
 {
  dm.initialize()
 }
 console.log("received Worker request", argRequest);
 var req = argRequest;
 if(dm[req.data.requestType])
 {
  req.data.status = "received";
  //send a 'received' status unless synchronous call above completed request
  dm[req.data.requestType](req);
 }
 else
 {
  req.data.status = "badType";
  console.log("Data Manager Worker does not handle " + req.data.requestType + " requests");
 }
 postMessage(req.data);
},

});
