var baseUrl = mknote.i18n.getMessage("baseUrl");
var syncUrl = mknote.i18n.getMessage("syncUrl");
var htmlRegex = /<(style|script|iframe|base|object|embed|link)[^<>]*>[\s\S]*?<\/\1>|<\/?(style|script|iframe|base|object|embed|link)*>/igm;

var syncing = false;

sogouExplorer.extension.onConnect.addListener(function(port){
    if(port.name == "site"){
        port.onMessage.addListener(function(msg){
            Settings.init();
            if(Settings.setting.sites.toString().indexOf(msg.site)!= -1){
                port.postMessage({"res":true});
            }
        });
    }
    else if(port.name == "getBaseUrl"){
        port.postMessage({
            url: baseUrl
        });
    }
    else if(port.name == "getSetting"){
        port.onMessage.addListener(function(msg){
            Settings.init();
            if(msg.name == "toolbar"){
                port.postMessage({
                    setting: Settings.setting.toolbar
                });
            }
        });
    }
    else if(port.name == "collect"){
        port.onMessage.addListener(function(params){
            var content = params.content.replace(htmlRegex, ""),
            title = params.title,
            id = guid(),
            date = formatDate(new Date()),
            
            data = {
                id: id,
                title: title,
                content: content,
                createTime: date,
                updateTime: date,
                deleted: false
            };
            
            Storage.set(id, JSON.stringify(data))
            addToChangedNote(id);
            
            console.log(id + "collected");
            port.postMessage({saved: true});
        });
    }
    else if(port.name == "message"){
        port.onMessage.addListener(function(msg){
            var res = {};
            for(var i=0;i<msg.length;i++){
                res[msg[i]] = mknote.i18n.getMessage(msg[i]);
            }
            port.postMessage(res);
        });
    }
    else if(port.name == "savepage"){
        checkLogin(function(){
            port.postMessage("ok");
        });
    }
    else if(port.name == "onlinePop"){//save data when popup closed
        var popup = sogouExplorer.extension.getViews({type: "popup"});
        if(popup.length && popup.length == 1){
            popup = popup[0];
        }
        port.onDisconnect.addListener(function(){
            if(popup.Edit.editting){
                var isCreate = false;
                if(!popup.Edit.editting.id){
                    isCreate = true;
                }
                var date = new Date();
                var data = {
                    "id": isCreate ? guid() : popup.Edit.editting.id,
                    "content" : _.trim(popup.Edit.$(".note .content").html()),
                    "title": _.trim(popup.Edit.$(".note .title").val())
                };
                
                if(data.content == "" || data.content == "<br>"){
                    if(data.title == ""){
                        return false;
                    }
                }
                
                if(data.title == ""){
                    data.title = _.trim(popup.Edit.$(".note .content").text().substring(0,40));
                }
                
                if(isCreate){
                    data.updateTime = formatDate(date);
                    data.createTime = formatDate(date);
                    data.deleted = false;
                    
                    Storage.set(data.id, JSON.stringify(data));
                    
                    localStorage["lastSavedNote"] = data.id;
                    
                    addToChangedNote(data.id);
                    
                    return true;
                }

                var note = JSON.parse(Storage.get(data.id));
                
                if(note.content != data.content || note.title != data.title){
                    note.content = data.content;
                    note.title = data.title;
                    note.updateTime = formatDate(new Date());

                    addToChangedNote(data.id);
                    
                    Storage.set(note.id, JSON.stringify(note));
                }
            }
        });
    }
    else if(port.name == "sync"){
        var dis = function() {
            sogouExplorer.browserAction.setTitle({
                title: "正在同步中"
            });
            syncing = true;
            Sync.start(function() {
                sogouExplorer.browserAction.setTitle({
                    title: "麦库记事本"
                });
                syncing = false;
            });
        };

        port.onMessage.addListener(function(msg){
            if(syncing){
                return false;
            }

            if(msg.name == "start"){
                syncing = true;

                Sync.start(function() {
                    try{
                        port.postMessage({
                            name: "finished",
                            callback: msg.callback
                        });
                    }
                    catch(e){
                        return true;
                    }
                    syncing = false;
                });
            }
            else if(msg.name == "init"){
                Sync.init(function() {
                    try{
                        port.postMessage({
                            name: "finished",
                            callback: msg.callback
                        });
                    }
                    catch(e){
                        return true;
                    }
                });
            }
            else if(msg.name == "disconnect"){
                port.onDisconnect.removeListener(dis);
            }
        });

        port.onDisconnect.addListener(dis);
    }
});

            
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

function formatDate(date){
    var d = [],t = [];
    d.push(date.getUTCFullYear());
    d.push(addZero(date.getUTCMonth() + 1));
    d.push(addZero(date.getUTCDate()));
    
    t.push(addZero(date.getUTCHours()));
    t.push(addZero(date.getUTCMinutes()));
    t.push(addZero(date.getUTCSeconds()));
    
    function addZero(s){
        return s.toString().length == 1 ? "0" + s : s;
    }
    
    return d.join("-") + "T" + t.join(":") + "Z";
}

function getDate(string){
    var d = string.split("T")[0].split("-"),
    t = string.split("T")[1].split("Z")[0].split(":"),
    date = new Date();
    
    date.setUTCFullYear(d[0]);
    date.setUTCMonth(Number(d[1])-1);
    date.setUTCDate(d[2]);
    
    date.setUTCHours(t[0]);
    date.setUTCMinutes(t[1]);
    date.setUTCSeconds(t[2]);
    date.setUTCMilliseconds(0);
    
    return date;
}

function getLocalDateString(date){
    var d = [], t = [];
    
    d.push(date.getFullYear());
    d.push(addZero(date.getMonth() + 1));
    d.push(addZero(date.getDate()));
    
    t.push(addZero(date.getHours()));
    t.push(addZero(date.getMinutes()));
    t.push(addZero(date.getSeconds()));
    
    function addZero(s){
        return s.toString().length == 1 ? "0" + s : s;
    }
    
    return d.join("-") + " " + t.join(":");
}

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}