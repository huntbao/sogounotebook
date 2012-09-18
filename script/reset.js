(function() {
    window.reset = function() {
        delete localStorage["reseted"];
        if(localStorage["reseted"]){
            return false;
        }

        var userId = localStorage["userId"],
        metadata = [],
        localChanged = _.compact(Storage.get("changedNote").split(",")),
        localNoteId = [],
        newChanged = [];

        for(var i in localStorage){
            var noteId = i.split("(^)")[1];
            if(noteId && noteId.search(/changed|default/) == -1){
                localNoteId.push(noteId);
            }
        }

        newChanged = _.intersection(localChanged, localNoteId);
        Storage.set("changedNote", newChanged.join(","));
        console.log("newchanged:");
        console.log(newChanged.join(","));

        Sync.getMetaData({
            success: function(json) {
                var serverNoteId = [];
                _.each(json, function(v, i) {
                    if(_.include(localNoteId, v.id)){
                        json[i].version = JSON.parse(Storage.get(v.id)).version;
                    }
                    serverNoteId.push(v.id);
                });

                _.each(_.difference(localNoteId, serverNoteId), function(v) {
                    json.push({
                        id: v,
                        version: JSON.parse(Storage.get(v.id)).version
                    });
                });

                localStorage["metadata"] = JSON.stringify(json);
                console.log("new meta");
                console.log(JSON.stringify(json));

                localStorage["reseted"] = true;
            },
            error: function() {
                console.log("error");
            }
        });
    };

    reset();
})();