(function(){
    var port = sogouExplorer.extension.connect({"name":"site"});
    port.postMessage({"site":"qq"});
    port.onMessage.addListener(function(msg){
        if(msg.res){
            var msgCount,
            addBtn = function(){
                msgCount = $("#talkList li").length;
                $(".msgBox .funBox").filter(function(){
                    return $(this).children(".MKNotePlugin-save").length < 1;
                }).append('<span>|</span><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>');
            },
            getText = function(el){
                el = $(el);
                return (el.children(".userName").html() ? el.children(".userName").html() : el.find("strong").html()) + el.children(".msgCnt").html();
            },
            getImage = function(el){
                el = $(el);
                if(el.children(".mediaWrap").children(".picBox").length != 0){
                    return el.children(".mediaWrap").find(".pic img:first").attr("src").replace("160","2000");
                }
                else{
                    return "";
                }
            };
            
            addBtn();
            
            $(window).bind("scroll", function(){
                var newMsgCount = $("#talkList li").length;
                if(newMsgCount > msgCount){
                    addBtn();
                }
            });
            
            $(".MKNotePlugin-save").live("click", function(){
                var singleMsg = $(this).parent().parent().parent(),
                reply = singleMsg.children(".replyBox"),
                text = getText(singleMsg),
                image = getImage(singleMsg),
                name = singleMsg.find(".userName strong a"),
                content = "";
                
                if(reply.length != 0){
                    text += "<br />" + getText(reply.children(".msgBox"));
                    image += (image == "" ? "" : "|") + getImage(reply.children(".msgBox"));
                }
                
                content += text;
                if(image){
                    $.each(image.split("|"), function(index, el){
                        content += "<br />" + '<img src="' + el + '" />';
                    });
                }
                
                MKNotePlugin.Util.collect({
                    "content": content,
                    "from": "qq",
                    "title": mknote.i18n.getMessage("fromQQ") + name.text()
                },function(){
                    (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                });
                
                return false;
            });
        }
    });
})();