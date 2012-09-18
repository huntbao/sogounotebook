(function(){
    var port = sogouExplorer.extension.connect({"name":"site"});
    port.postMessage({"site":"sina"});
    port.onMessage.addListener(function(msg){
        if(msg.res){
            var feedName = ".MIB_feed .MIB_linedot_l",
            actName = ".feed_att .rt",
            textName = [".sms", ".source"],
            imgName = [".feed_preview", ".imgicon"],
            commentName = ".MIB_assign",
            userName = ".sms a[namecard='true']:first",
            saveButton = '<span class="MIB_line_l">|</span><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>';

            if($("body").attr("class") && $("body").attr("class").indexOf("B_index") != -1){
                feedName = ".feed_lists .feed_list";
                actName = ".info span";
                textName = ["p[node-type='feed_list_content']","dt"];
                imgName = [".piclist", ".bigcursor"];
                commentName = ".comment";
                userName = ".feed_list_content a[user-card]";
                saveButton = '<i class="W_vline">|</i><a href="javascript:void(0)" class="MKNotePlugin-save">' + mknote.i18n.getMessage("saveToMaiku") + '</a>';
            }
            
            var msgCount,
            addBtn = function(){
                msgCount = $(feedName).length;
                $(feedName).find(actName).filter(function(){
                    return $(this).children(".MKNotePlugin-save").length < 1;
                }).append(saveButton);
            },
            getText = function(el){
                var text;
                el = $(el);
                $.each(textName, function(index, item){
                    text = text ? text : el.find(item).html();
                });
                return text;
            },
            getImage = function(el){
                var wrapper = el.children(imgName[0]);

                if(el.children(imgName[0]).length == 0 && el.attr("class") == commentName.split(".")[1]){
                    wrapper = el.find(imgName[0]);
                }

                if(wrapper.find(imgName[1]).length != 0){
                    return wrapper.find(imgName[1]).attr("src").replace("thumbnail","large");
                }
                else{
                    return "";
                }
            };
            
            addBtn();
            
            $(window).bind("scroll", function(){
                var newMsgCount = $(feedName).length;
                if(newMsgCount > msgCount){
                    addBtn();
                }
            });
            
            $(".MKNotePlugin-save").live("click", function(){
                var singleMsg = $(this).parent().parent().parent(),
                reply = singleMsg.children(commentName),
                text = getText(singleMsg),
                image = getImage(singleMsg),
                name = singleMsg.find(userName),
                content = "";
                
                if(reply.find("dt, .source").length != 0){
                    text += "<br />" + getText(reply);
                    image += (image == "" ? "" : "|") + getImage(reply);
                }
                
                content += text;
                if(image){
                    $.each(image.split("|"), function(index, el){
                        content += "<br />" + '<img src="' + el + '" />';
                    });
                }
                
                MKNotePlugin.Util.collect({
                    "content": content,
                    "from": "sina",
                    "title": mknote.i18n.getMessage("fromSina") + name.text()
                }, function(){
                    (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                });
                
                return false;
            });
        }
    });
})();