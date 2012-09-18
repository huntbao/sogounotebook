(function() {
    var background = sogouExplorer.extension.getBackgroundPage();
    var store = function(){
    
        function getNoteId(note){
            return note.id ? note.id : note.guid;
        }
        
        function addToChangedNote(note){
            if(!Storage.get("changedNote")){
                Storage.set("changedNote", "");
            }
            
            var changedNote = Storage.get("changedNote").split(",");
            
            if(!_.include(changedNote, note.id)){
                changedNote.push(note.id);
                Storage.set("changedNote", changedNote.join(","));
            }
        }
        
        return {
            find: function(model){
                var result = JSON.parse(Storage.get(getNoteId(model)));
                
                model.set(result);
                
                return model;
            },
            
            findAll: function(){
                var result = [], id, note, item,
                userId = localStorage["userId"];
                
                for(id in localStorage){
                    if(id.indexOf(userId) == -1 && id.indexOf("(^)") == -1){
                        continue;
                    }

                    if(id.indexOf("changedNote") != -1 || id.indexOf("defaultCategoryId") != -1){
                        continue;
                    }

                    id = id.split("(^)")[1];

                    item = Storage.get(id);

                    if(item){
                        note = JSON.parse(Storage.get(id));
                    }
                    else{
                        continue;
                    }
                    
                    if(note){
                        result.push(note);
                    }
                }
                
                result = _.sortBy(result, function(note){
                    return note.updateTime;
                });
                
                return result;
            },
            
            create: function(model){
                var note = {
                    "id": guid(),
                    "title": model.get("title") ? model.get("title") : "",
                    "content": model.get("content") ? model.get("content") : "",
                    "createTime": model.get("createTime") ? model.get("createTime") : "",
                    "updateTime": model.get("updateTime") ? model.get("updateTime") : "",
                    "deleted": false
                };
                
                model.set(note);
                
                Storage.set(note.id, JSON.stringify(note));
                
                addToChangedNote(note);
                
                return model;
            },
            
            update: function(model){
                var noteId = getNoteId(model),
                note = JSON.parse(Storage.get(noteId));
                
                note.title = model.get("title");
                note.content = model.get("content");
                note.updateTime = model.get("updateTime");
                note.createTime = model.get("createTime");
                
                Storage.set(noteId, JSON.stringify(note));
                
                addToChangedNote(note);
                
                return model;
            },
            
            destroy: function(model){
                var noteId = getNoteId(model),
                note = JSON.parse(Storage.get(noteId));
                
                note.deleted = true;
                
                Storage.set(noteId, JSON.stringify(note));
                
                addToChangedNote(note);
                
                return model;
            }
        }
    };
    Backbone.sync = function(method, model, options, error){
        if(typeof options == 'function'){
            options = {
                success: options,
                error: error
            };
        }

        var resp;
        
        var query = new store();
        
        //note created and id changed
        //but models not change
        if(background.window.Sync.idChanged[model.id]){
            model.id = Sync.idChanged[model.id];
            delete Sync.idChanged[model.id];
        }

        switch(method){
            case "read":    resp = model.id ? query.find(model) : query.findAll(); break;
            case "create":  resp = query.create(model);                            break;
            case "update":  resp = query.update(model);                            break;
            case "delete":  resp = query.destroy(model);                           break;
        }

        if(resp){
            options.success(resp);
        }
        else{
            options.error("Record not found");
        }
    };

    // Generate four random hex digits.
    function S4() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
       return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }
})();
