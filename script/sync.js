(function(){
    var syncUrl = mknote.i18n.getMessage("syncUrl"),
    guidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

    window.deleteAll = function(){
        for(item in localStorage){
            if(item != "MAIKU_SETTINGS")
                delete localStorage[item];
        }
    }

    window.Sync = {
        offline: true,
        
        syncing: false,
        
        idChanged: {},
        
        init: function(callback){
            this.syncing = true;

            var self = this;
            
            this.getMetaData({
                success: function(json){
                    
                    self.offline = false;

                    localStorage["metadata"] = JSON.stringify(json);

                    var _json = [];
                    for(var i=0;i<json.length;i++){
                        if(i < 20){
                            _json[i] = json[i]; 
                        }
                    }
                    
                    var initFinished = _.after(json.length < 5 ? json.length : 5, function() {
                        callback();
                    
                        self.syncing = false;
                    });

                    _.each(_json, function(item){
                        self.syncing = true;

                        self.getNote(item.id, function(note){
                        
                            if(!localStorage["userId"]){
                                localStorage["userId"] = note.userId;
                            }
                        
                            if(!note.deleted && !note.encrypted){
                                Storage.set(note.id, JSON.stringify(note))
                            }
                            
                            initFinished();
                        });
                        
                    });
                },
                error: function(err){
                    console.log("Sync init: get metadata error");
                    console.log(err);
                    
                    self.syncing = false;
                }
            });
        },
        
        start: function(finishCallback, offlineCallback){
            this.syncing = true;

            var self = this,
            metadata = localStorage["metadata"],
            localDiffServer = [], serverDifflocal = [],
            changed = [], added = [], deleted = [],
            toChange = [], toAdd = [], toDelete = [];
            
            var objDiff = function(a, b){ // return el in a not in b
                return _.filter(a, function(item){
                    return !_.any(b, function(_item){
                       return _.isEqual(_item, item);
                    });
                });
            },
            
            idDiff = function(a, b){ // return el.id in a not equal to any el.id in b 
                return _.filter(a, function(item){
                    return !_.any(b, function(_item){
                       return _item.id == item.id;
                    });
                });
            };
            
            self.sync = function(){
                var localChangedNote = _.compact(Storage.get("changedNote").split(","));
                
                _.each(toAdd, function(note){
                    Storage.set(note.id, JSON.stringify(note));
                });
                
                _.each(toDelete, function(note){
                    if(!Storage.get(note.id)){
                        return false;
                    }
                    
                    if(note.deleted){
                        var _note = JSON.parse(Storage.get(note.id));

                        if(_.include(localChangedNote, note.id)){ // delete conflict
                            _note.id = guid();
                            _note.title += " 副本";
                            _
                            localChangedNote = _.without(localChangedNote, note.id);
                            localChangedNote.push(_note.id);

                            Storage.del(note.id);
                            Storage.set(_note.id, JSON.stringify(_note));

                            console.log("delete conflicted");
                        }
                        else{
                            Storage.del(note.id);
                        }
                    }
                    else{ // encrypted note
                        Storage.del(note.id);
                    }
                });
                
                _.each(toChange, function(note){
                    if(_.include(localChangedNote, note.id)){
                        var _note = JSON.parse(Storage.get(note.id));
                        
                        _note.title += " 副本";
                        _note.id = guid();
                        _note.categoryId = note.categoryId;
                        
                        Storage.set(_note.id, JSON.stringify(_note));
                        
                        localChangedNote.push(_note.id);
                        
                        console.log("conflicted");
                    }
                    Storage.set(note.id, JSON.stringify(note));

                    console.log("local note updated");
                });
                
                if(localChangedNote.length == 0){
                    self.finish(finishCallback);
                }
                
                var syncFinished = _.after(localChangedNote.length, function(){
                    self.finish(finishCallback);
                });
                
                console.log("local changed note id:")
                console.log(localChangedNote);
                
                _.each(localChangedNote, function(noteId){
                    var note = Storage.get(noteId);
                    try{
                        note = JSON.parse(note);
                    }
                    catch(e){
                        console.log("changed note not found" + noteId);
                        syncFinished();
                        return false;
                    }
                    
                    if(guidRegex.test(note.id)){
                        self.createNote(note, syncFinished);
                    }
                    else if(note.deleted){
                        self.deleteNote(note, syncFinished);
                    }
                    else{
                        self.updateNote(note, syncFinished);
                    }
                });
            };
            
            self.serverInfo = function(){
                console.log("server change:")
                console.log(changed.length + added.length + deleted.length);
                console.log(toChange.length + " notes changed:");
                console.log(toChange);
                console.log(toAdd.length + " notes added:");
                console.log(toAdd);
                console.log(toDelete.length + " notes deleted:");
                console.log(toDelete);
            };
            
            this.getMetaData({
                success: function(json){
                
                    self.offline = false;
                
                    if(metadata && metadata == JSON.stringify(json)){
                        if(!Storage.get("changedNote") || Storage.get("changedNote").length == 0){
                            console.log("local note not changed");
                            self.finish(finishCallback);
                        }
                        else if(Storage.get("changedNote").length != 0){
                            console.log("local changed");
                            self.sync();
                        }
                        console.log("server not change");
                        return true;
                    }
                    
                    metadata = JSON.parse(metadata);
                    
                    localDiffServer = objDiff(metadata, json);
                    serverDifflocal = objDiff(json, metadata);
                    
                    //note changed so el.id in local should equal to some el.id in server
                    changed = _.filter(localDiffServer, function(item){
                        return _.any(serverDifflocal, function(_item){
                           return _item.id == item.id;
                        });
                    });
                    
                    //note added so el in server but el not in local
                    added = idDiff(serverDifflocal, localDiffServer);
                    
                    //note deleted so el in local but el not in server
                    deleted = idDiff(localDiffServer, serverDifflocal);
                    
                    var totalCount = changed.length + added.length + deleted.length,
                    dataReady = _.after(totalCount, function(){
                        // when dataReady invoked totalCount times, run
                        self.serverInfo();
                        self.sync();
                    });
                    
                    _.each(changed, function(item){
                        self.getNote(item.id, function(note){
                            
                            if(!Storage.get(note.id)){
                                toAdd.push(note);
                            }
                            
                            try{
                                var localNote = JSON.parse(Storage.get(note.id));
                            }
                            catch(e){
                                dataReady();
                                return false;
                            }
                            
                            if(note.deleted || note.encrypted){//remove deleted and encrypted note
                                toDelete.push(note);
                                dataReady();
                                return true;
                            }
                            
                            if(note.content != localNote.content || note.title != localNote.title || note.tags.join() != localNote.tags.join() || note.sourceUrl != localNote.sourceUrl || note.importance != localNote.importance || note.version != localNote.version){
                                toChange.push(note);
                                dataReady();
                                return true;
                            }
                            
                            dataReady();
                        });
                    });
                    
                    _.each(added, function(item){
                        self.getNote(item.id, function(note){
                            
                            if(note.deleted || note.encrypted){
                                dataReady();
                                return true;
                            }
                            
                            toAdd.push(note);
                            dataReady();
                        });
                    });
                    
                    _.each(deleted, function(item){
                        toDelete.push(item.id);
                        dataReady();
                    });
                },
                
                error: function(err){
                    if(err.status == "0" || err.status == "503"){
                        self.offline = true;
                    }
                }
            });
        },
        
        finish: function(callback){
            Storage.set("changedNote", "");
            this.getMetaData({
                success: function(json){
                    localStorage["metadata"] = JSON.stringify(json);
                    console.log("Sync OK");
                    
                    self.syncing = false;

                    callback();
                },
                error: function(err){
                    console.log(err);
                }
            });
        },
        
        createNote: function(note, callback){
            var self = this,
            data = {
                title: note.title,
                categoryId: note.categoryId ? note.categoryId : Storage.get("defaultCategoryId"),
                sourceUrl: "",
                tags: [],
                content: note.content,
                createTime: note.createTime,
                deleted: note.deleted,
                password: "",
                passwordHint: "",
                importance: "0"
            };
            
            $.ajax({
                url: syncUrl + "/note",
                type: "POST",
                processData: false,
                data: JSON.stringify(data),
                success: function(json){
                    Storage.del(note.id);
                    Storage.set(json.id, JSON.stringify(json));
                    
                    //note created and id changed
                    //so saved status need to change
                    if(localStorage["lastSavedNote"] == note.id){
                        localStorage["lastSavedNote"] = json.id;
                    }
                    
                    self.idChanged[note.id] = json.id;
                    
                    console.log("1 note create");

                    if(json.deleted){
                        Storage.del(json.id);
                        console.log("1 note deleted");
                    }

                    callback(json);
                },
                error: function(err){
                    console.log("create note error");
                    console.log(err);
                }
            });
        },
        
        updateNote: function(note, callback){
            var data = {
                title: note.title,
                categoryId: note.categoryId,
                sourceUrl: note.sourceUrl,
                tags: note.tags,
                content: note.content,
                updateTime: note.updateTime,
                deleted: note.deleted,
                password: "",
                passwordHint: "",
                importance: note.importance
            };
            
            $.ajax({
                url: syncUrl + "/note/" + note.id,
                type: "POST",
                processData: false,
                data: JSON.stringify(data),
                beforeSend: function(xhr){
                    xhr.setRequestHeader('If-Match', '"version:' + note.version + '"');
                },
                success: function(json){
                    Storage.set(json.id, JSON.stringify(json));
                    
                    console.log("1 note update");
                    callback(json);
                },
                error: function(err){
                    console.log("update note error");
                    console.log(err);
                }
            });
        },
        
        deleteNote: function(note, callback){
            if(guidRegex.test(note.id)){
                this.createNote(note, function(json){
                    this.deleteNote(json.id);
                });

                return true;
            }
            
            var data = {
                title: note.title,
                categoryId: note.categoryId,
                sourceUrl: note.sourceUrl,
                tags: note.tags,
                content: note.content,
                updateTime: note.updateTime,
                deleted: true,
                password: "",
                passwordHint: "",
                importance: note.importance
            };
            
            $.ajax({
                url: syncUrl + "/note/" + note.id,
                type: "POST",
                beforeSend: function(xhr){
                    xhr.setRequestHeader('If-Match', '"version:' + note.version + '"');
                    xhr.setRequestHeader('X-Update-Control', 'skip-content');
                },
                data: JSON.stringify(data),
                success: function(json){
                    Storage.del(note.id);
                    console.log("1 note deleted");
                    callback();
                },
                error: function(err){
                    console.log("delete note error");
                    console.log(err);
                }
            });
        },
        
        getNote: function(id, callback){
            $.ajax({
                url: syncUrl + "/note/" + id,
                type: "GET",
                success: function(json){
                    callback(json);
                },
                error: function(err){
                    console.log("get note error");
                    console.log(id);
                }
            });
        },
        
        getMetaData: function(params){
            $.ajax({
                url: syncUrl + "/metadata",
                type: "GET",
                success: params.success,
                error: params.error
            });
        }
    };

    function addToChangedNote(id){
        if(!Storage.get("changedNote")){
            Storage.set("changedNote", "");
        }
        
        var changedNote = Storage.get("changedNote").split(",");
        
        if(!_.include(changedNote, id)){
            changedNote.push(id);
            Storage.set("changedNote", changedNote.join(","));
        }
    }
    
    // Generate four random hex digits.
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }
})();
