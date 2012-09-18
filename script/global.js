(function(){
    if(!window.MKNotePlugin){
        window.MKNotePlugin = {};
    }
    
    MKNotePlugin.Content = {
        init: function(){
            var self = this;
            this.content = null;
            this.title = document.title;
            this.canvas = document.createElement("canvas");
            $(this.canvas)
            .css("position", "absolute")
            .css("top", 0)
            .css("left", 0)
            .css("display", "none")
            .css("z-index", 999999999)
            .attr("id", "maiku-show-article-cover");
            $(document.body).append(this.canvas);
        
            var ex = new ExtractContentJS.LayeredExtractor();
            ex.addHandler(ex.factory.getHandler('Heuristics'));
            var res = ex.extract(document);

            if(res.isSuccess){
                this.content = res.content.asNode();
                this.title = res.title;
                
                var pageSize = {
                    height: document.body.scrollHeight,
                    width: document.body.scrollWidth
                },
                
                articleSize = {
                    height: $(self.content).outerHeight(),
                    width: $(self.content).outerWidth()
                },
                
                articlePos = {
                    left: $(self.content).offset().left,
                    top: $(self.content).offset().top
                };
                
                $(this.canvas).attr("width", pageSize.width).attr("height", pageSize.height);
                context = this.canvas.getContext("2d");
                
                context.fillStyle = "rgba(0,0,0,0.5)";
                context.fillRect(0, 0, pageSize.width, pageSize.height);
                
                context.clearRect(articlePos.left, articlePos.top, articleSize.width, articleSize.height);
                
                sogouExplorer.extension.onRequest.addListener(function(msg){
                    if(msg == "showArticle"){
                        self.showTimeout = setTimeout(function(){
                            $(self.canvas).show();
                        }, 350);
                    }
                    else{
                        clearTimeout(self.showTimeout);
                        $(self.canvas).hide();
                    }
                });
            }

            sogouExplorer.extension.onRequest.addListener(function(request, sender, sendResponse) {
                if(request.msg == "getBody"){
                    sendResponse({
                        title: document.title,
                        content: filterContent(document.body.innerHTML)
                    });
                }
                else if(request.msg == "getContent"){
                    if(res.isSuccess){
                        sendResponse({
                            success: true,
                            title: self.title,
                            content: filterContent(self.content.nodeType == 3 ? self.content : self.content.innerHTML)
                        });
                    }
                    else{
                        sendResponse({
                            success: false
                        });
                    }
                }
            });
        }
    };
        
    MKNotePlugin.Toolbar = {
        init: function(){
            if(MKNotePlugin.Content.content == null){
                return true;
            }

            var self = this;
            var content = $(MKNotePlugin.Content.content);
            $("html").append('<div id="maiku-toolbar"><a href="##" class="maiku-toolbar-save" title="保存文章到麦库">保存文章到麦库</a><a href="##" class="maiku-toolbar-close" title="关闭工具条">关闭工具条</a></div>');
            var toolbar = $("#maiku-toolbar");
            self.closeToolbar = false;
            self.keepToolbar = false;
            
            var pos = {
                top:content.offset().top - $("#maiku-toolbar").outerHeight(),
                left:content.offset().left + content.outerWidth() - $("#maiku-toolbar").outerWidth()
            };
            
            toolbar.css({
                top:pos.top,
                left:pos.left
            });
            
            content.bind("mouseover", function(){
                clearTimeout(self.hideTimeout);
                if(!self.closeToolbar) toolbar.fadeIn("fast");
            });
            content.bind("mouseout", function(){
                self.hideTimeout = setTimeout(function(){
                    if(!self.closeToolbar)
                        toolbar.fadeOut("fast");
                }, 1000);
            });
            
            toolbar.bind("mouseover", function(){
                clearTimeout(self.hideTimeout);
            });
            toolbar.bind("mouseout", function(){
                self.hideTimeout = setTimeout(function(){
                    if(!self.closeToolbar)
                        toolbar.fadeOut("fast");
                }, 1000);
            });
            
            $(".maiku-toolbar-save").bind("click", function(){
                MKNotePlugin.Util.collect({
                    content: MKNotePlugin.Content.content.innerHTML,
                    title: MKNotePlugin.Content.title
                }, function(){
                    (new MKNotePlugin.Util.savedTip("保存成功!")).show();
                    self.closeToolbar = true;
                });
                toolbar.fadeOut("fast");
                return false;
            });
            
            $(".maiku-toolbar-close").bind("click", function(){
                toolbar.fadeOut("fast");
                self.closeToolbar = true;
                return false;
            });
            
            $("#maiku-toolbar").css({
                "background-image": "url(" + sogouExplorer.extension.getURL("images/toolbar/logo.png") + ")"
            });
            $(".maiku-toolbar-save").css({
                "background-image": "url(" + sogouExplorer.extension.getURL("images/toolbar/save.png") + ")"
            });
            $(".maiku-toolbar-close").css({
                "background-image": "url(" + sogouExplorer.extension.getURL("images/toolbar/close.png") + ")"
            });
            
        }
    };
    
    MKNotePlugin.Util = {};
    
    MKNotePlugin.Util.getSetting = function(para, callback){ // get the setting in backgroud
        var port = sogouExplorer.extension.connect({name:"getSetting"});
        port.postMessage({
            name:para
        });
        port.onMessage.addListener(function(msg){
            if(msg){
                callback(msg.setting);
            }
        });
    };
    
    MKNotePlugin.Util.getMessage = function(name, callback){ //page is GBK,content script can't get correct msg,background can
        var port = sogouExplorer.extension.connect({"name": "message"});
        port.postMessage(name);
        port.onMessage.addListener(function(msg){
            callback(msg);
        });
    };
    
    MKNotePlugin.Util.collect = function(params, callback){
        var port = sogouExplorer.extension.connect({"name": "collect"});
        
        //convert relative url to absolute
        params.content = filterContent(params.content);
        
        port.postMessage(params);
        port.onMessage.addListener(function(msg){
            if(msg.saved && callback){
                callback();
            }
        });
    };
    
    MKNotePlugin.Util.savedTip = function(text){
        this.tip = $('<mkclip id="maiku-save-success"><div class="logo">麦库记事</div><div class="text"></div></mkclip>');
        
        this.tip.css({
            "background-image": "url(" + sogouExplorer.extension.getURL("images/saved.png") + ")"
        });
        
        this.tip.find(".logo").css({
            "background-image": "url(" + sogouExplorer.extension.getURL("images/icons/16x16.png") + ")",
            "line-height": "24px"
        });
        
        this.text = text;
        
        $("html").append(this.tip);
    };        
    MKNotePlugin.Util.savedTip.prototype.show = function(){
        var tip = this.tip;
        tip.find(".text").text(this.text);
        tip.fadeIn("fast");
        
        setTimeout(function(){
            tip.fadeOut("fast", function(){
                tip.remove();
            });
        }, 1500);
    };
    
    $(document).ready(function(){
        MKNotePlugin.Content.init();

        MKNotePlugin.Util.getSetting("toolbar", function(isOn){
            if(isOn){
                MKNotePlugin.Toolbar.init();
            }
        });
    });
    
    function qualifyURL(url){
        var div = document.createElement('div');
        div.innerHTML = "<a></a>";
        div.firstChild.href = url; // Ensures that the href is properly escaped
        div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
        return div.firstChild.href;
    }

    function replaceURLs(content){
        content = content.replace(/href=\"([^\"]*)\"|href=\'([^\']*)\'/ig, function(url){
            if(url == "" || url.search(/javascript:|vbscript:/) != -1){
                return "";
            }
            try {
                return 'href="' + qualifyURL(url.split('href="')[1].split('"')[0]) + '"';
            } catch (e) {
                return 'href="' + qualifyURL(url.split("href='")[1].split("'")[0]) + '"';
            }
        });
        
        content = content.replace(/src=\"([^\"]*)\"|src=\'([^\']*)\'/ig, function(url){
            if(url == ""){
                return false;
            }
            try{
                return 'src="' + qualifyURL(url.split('src="')[1].split('"')[0]) + '"';
            }
            catch(e){
                return 'src="' + qualifyURL(url.split("src='")[1].split("'")[0]) + '"';
            }
        });
        
        return content;
    }
    
    function removeAttr(html) {
        var attr = ["mkmarkid", "style", "id", "class", "height", "width", "align", "action", "background", "bgsound", "onclick", "onmousedown", "onmouseup", "onload", "onchange", "onkeyup", "onkeydown", "onkeypress", "onmouseover", "onmouseout", "onblur", "onfocus", "onunload", "onsubmit", "onselect", "onreset", "ondbclick"],
            regex = "";
        for (var i = 0; i < attr.length; i++) {
            regex = new RegExp("(<\\w+[^>]+)(" + attr[i] + "=(('[^'>]+')|(\"[^\">]+\")|[^\\s>]+))", "ig");
            html = html.replace(regex, function($0,$1,$2) {
                return $1;
            });
        }

        return html;
    }

    function removeTag(html) {
        var tagRegex = /<(style|script|iframe|link|frame|frameset|noscript|head|html|applet|base|basefont|bgsound|blink|ilayer|layer|meta|object|embed)[^<>]*>[\s\S]*?.*?<\/\1>/igm;
        return html.replace(tagRegex, "");
    }

    function removeWhite(html) {
        var whiteRegex = /\s{2,}|(\r|\n)+/g,//multi white or single newline
        whitegtRegex = /\s>/g; //" >"
        return html.replace(whiteRegex, " ").replace(whitegtRegex, ">");
    }
    
    function filterContent(content) {
        content = removeTag(content);
        content = removeAttr(content);
        content = removeWhite(content);
        content = replaceURLs(content);

        return content;
    }
})();