(function(){
    var port = sogouExplorer.extension.connect({"name":"site"});
    port.postMessage({"site":"douban"});
    port.onMessage.addListener(function(msg){
        if(msg.res == true){
            if($(".rec-sec")){
                $(".rec-sec").filter(function(index, el){
                    return $(el).parent().parent().parent().attr("class") != "bd";
                }).append('<span class="MKNotePlugin-save" style="margin-left:10px;"><a href="#" class="btn-donate">'+mknote.i18n.getMessage("saveToMaiku")+'</a></span>');
                
                var type = "";
                if(location.href.indexOf("/note/") != -1){
                    type = "note";
                }
                else if(location.href.indexOf("/group/") != -1){
                    type = "group";
                }
                else if(location.href.indexOf("/review/") != -1){
                    type = "review";
                }
                else if(location.href.indexOf("/photo/") != -1){
                    type = "photo";
                }
                else{
                    $(".MKNotePlugin-save").remove();
                }
                
                var data = {},
                
                clipNote = function(){
                    var article = $(".article pre.note"),
                    title = $("#db-usr-profile h1").text() + article.find(".note-header h3").text();
                    data.content = article.html();
                    data.title = mknote.i18n.getMessage("fromDouban") + title;
                },
                
                clipGroup = function(){
                    var article = $(".topic-doc p"),
                    title = $("#content h1").text();
                    data.content = article.html();
                    data.title = mknote.i18n.getMessage("fromDouban") + title;
                },
                
                clipReview = function(){
                    var article = $(".piir span[property='v:description']"),
                    title = $("h1 span[property='v:summary']").text(),
                    itemName = $(".piir .pl2 span[property='v:itemreviewed']").text();
                    data.content = article.html();
                    data.title = mknote.i18n.getMessage("fromDouban") + itemName + "评论" + title;
                },
                
                clipPhoto = function(){
                    var article = $(".mainphoto");
                    data.content = article.html();
                    data.title = mknote.i18n.getMessage("fromDouban") + document.title;
                };
                
                $(".MKNotePlugin-save").bind("click", function(){
                    switch(type){
                        case "note": clipNote(data);break;
                        case "group": clipGroup(data);break;
                        case "review": clipReview(data);break;
                        case "photo": clipPhoto(data);break;
                        default: break;
                    }
                    
                    data.from = "douban";
                    MKNotePlugin.Util.collect(data, function(){
                        (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                    });
                
                    return false;
                });
            }
        }
    });
})();