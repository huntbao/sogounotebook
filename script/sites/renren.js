(function(){
    var port = sogouExplorer.extension.connect({"name":"site"});
    port.postMessage({"site":"renren"});
    port.onMessage.addListener(function(msg){
        if(msg.res){
            var type = "";
            if(location.href.indexOf("/blog/") != -1){
                type = "blog";
                $(".ilike-act").after('<span class="pipe">|</span><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>');
            }
            else if(location.href.indexOf("/share/") != -1){
                type = "share";
                $(".share-operations").append('<span class="pipe">|</span><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>');
            }
            else if(location.href.indexOf("/note/") != -1){
                type = "note";
                $(".stat-article").append('<span class="pipe">|</span><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>');
            }
            
            var data = {},
            
            clipBlog = function(){
                article = $("#blogContent").clone(),
                title = $(".title-article strong").text();
                data.content = article.find("#maiku-toolbar").remove().end().html();
                data.title = mknote.i18n.getMessage("fromRenren") + title;
            },
            
            clipShare = function(){
                article = $("#shareBody").clone(),
                title = $(".title-article strong").text();
                data.content = article.find("#maiku-toolbar").remove().end().html();
                data.title = mknote.i18n.getMessage("fromRenren") + title;
            },
            
            clipNote = function(){
                article = $("#blogContent").clone(),
                title = $(".title-article strong").text();
                data.content = article.find("#maiku-toolbar").remove().end().html();
                data.title = mknote.i18n.getMessage("fromRenren") + title;
            };
                
            $(".MKNotePlugin-save").bind("click", function(){
                switch(type){
                    case "blog": clipBlog();break;
                    case "share": clipShare();break;
                    case "note": clipNote();break;
                    default: break;
                }
                
                data.from = "renren";
                MKNotePlugin.Util.collect(data, function(){
                    (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                });
                
                return false;
            });
        }
    });
})();