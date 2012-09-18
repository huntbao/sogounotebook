(function(){
    var port = chrome.extension.connect({"name":"site"});
    port.postMessage({"site":"greader"});
    port.onMessage.addListener(function(msg){
        if(msg.res){
            var msgCount,
            addBtn = function(){
                msgCount = $(".entry").length;
                $(".entry-actions").filter(function(){
                    return $(this).children(".MKNotePlugin-save").length < 1;
                }).append('<span class="MKNotePlugin-save link unselectable">'+chrome.i18n.getMessage("saveToMaiku")+'</span>');
            },
            data = {};
            
            addBtn();
            
            $("#viewer-container").bind("scroll", function(){
                // var newMsgCount = $(".entry").length;
                // if(newMsgCount > msgCount){
                    addBtn();
                // }
            });
            
            $(".MKNotePlugin-save").live("click", function(){
                var entry = $(this).parent().parent(),
                content = entry.find(".entry-body").html(),
                title = entry.find(".entry-title").text();
                
                data.content = content;
                data.title = title;
                data.from = "greader";
                
                MKNotePlugin.Util.collect(data, function(){
                    (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                });
            });
        }
    });
})();