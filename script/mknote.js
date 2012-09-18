(function(){
    var baseUrl = mknote.i18n.getMessage("baseUrl"),
    syncUrl = mknote.i18n.getMessage("syncUrl");
    var htmlRegex = /<(style|script|iframe|base|object|embed|link)[^<>]*>[\s\S]*?<\/\1>|<\/?(style|script|iframe|base|object|embed|link)*>/igm;
    
    window.SyncPort = sogouExplorer.extension.connect({name: "sync"});

    SyncPort.onMessage.addListener(function(msg) {
        if(msg.name == "finished"){
            eval("(" + msg.callback + ")()");
        }
    });

    window.MetaModel = Backbone.Model.extend({});

    window.CategoryModel = Backbone.Model.extend({
        defaults: {
            isDefault: false
        }
    });

    window.NoteModel = Backbone.Model.extend({
        defaults: {
            title: "",
            content: "",
            sourceUrl: "",
            categoryId: "",
            tags: [],
            deleted: false,
            password: "",
            passwordHint: "",
            updateTime: ""
        },
    });

    window.MetaCollection = Backbone.Collection.extend({
        model: MetaModel
    });

    window.CategoryCollection = Backbone.Collection.extend({
        model: CategoryModel
    });

    window.NoteCollection = Backbone.Collection.extend({
        model: NoteModel//,
        
        // comparator: function(note){
            // return note.get("updateTime");
        // }
    });

    window.Meta = new MetaCollection;
    window.Categories = new CategoryCollection;
    window.Note = new NoteCollection;
    
    window.NoteItemView = Backbone.View.extend({
        tagName: "li",
        
        template: _.template($("#note-item-template").html()),
        
        events: {
            "click": "edit"
        },
        
        initialize: function(){
            $(this.el).addClass("note-item").attr("id", this.model.id);
            
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        
        render: function(){
            $(this.el).html(this.template(this.model.toJSON()));
            this.setText();
            return this;
        },
        
        remove: function(){
            $(this.el).hide("slow");
            return this;
        },
        
        setText: function() {
            var title = this.model.get("title"),
            summary = this.model.get("content").replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/g, "").substring(0,50) + "...",
            updateTime = getDate(this.model.get("updateTime"));
            
            this.$("h3").html(title);
            this.$("p").html(summary);
            this.$("span").text(getLocalDateString(updateTime));
        },
        
        edit: function(){
            Edit.setTitle(this.model.get("title"));
            Edit.setContent(this.model.get("content"));
            Edit.setEditting(this.model);
            Edit.setCreate(false);
            Edit.setLastSavedTime(undefined);
            Edit.show();
        }
    });
    
    window.NoteListView = Backbone.View.extend({
        el: $("#list-wrap"),
        
        events: {
            "keyup .search": "search",
            "click #create-note": "createNote",
            "click #clip-note": "clipNote",
            "click .main-menu-button": "showMainMenu",
            "click .option-page": "openOptionPage",
            "click .logoff": "logoff",
            "click .help-button": "openHelp",
            "click .search-more a": "createSearch"
        },
        
        initialize: function(){
            Note.bind("add", this.addOne, this);
            Note.bind("remove", this.deleteOne, this);
            Note.bind("reset", this.refresh, this);
            
            this.refresh();
            
            this.focusDefault();
        },
        
        addOne: function(note){
            var view = new NoteItemView({model: note});
            this.$(".note-list").prepend(view.render().el);
        },
        
        addAll: function(){
            Note.each(this.addOne);
        },
        
        deleteOne: function(note){
            var noteId = note.get("id");
            note.destroy({
                success: function(){
                    StatusBar.setStatus("noteSaved");
                    Edit.setEditting(undefined);
                    Edit.hide();
                }
            });
        },
        
        refresh: function(){
            if(window.List){
                List.$(".note-list").empty();
            }
            Note.fetch(function(notes){
                _.each(notes, function(note){
                    Note.add(note);
                });
            });
        },
        
        search: _.throttle(function(){
            this.searchFilter();
        }, 250),
        
        searchFilter: function(){
            var self = this,
            key = $.trim(self.$(".search").val().toLowerCase()),
            match = Note.filter(function(note){
                return (note.get("content").toLowerCase().indexOf(key) != -1) || (note.get("title").toLowerCase().indexOf(key) != -1);
            });
            
            if(key){
                this.$(".search-more").show();
            }
            else{
                this.$(".search-more").hide();
            }
            
            Note.each(function(note){
                if($.inArray(note, match) == -1){
                    $(document.getElementById(note.get("id"))).hide();
                }
                else{
                    $(document.getElementById(note.get("id"))).show();
                }
            });
        },
        
        createNote: function(){
            var note = new NoteModel;
            Edit.setTitle("");
            Edit.setContent("");
            Edit.setEditting(note);
            Edit.setCreate(true);
            Edit.setLastSavedTime(undefined);
            Edit.show();
        },

        clipNote: function() {
            var note = new NoteModel;
            Edit.setTitle("");
            Edit.setContent("");
            Edit.setEditting(note);
            Edit.setCreate(true);
            Edit.setLastSavedTime(undefined);
            Edit.setClipping(true);
            Edit.showArticle();
            Edit.show();
        },
        
        focusDefault: function(){
            $(".search").focus();
        },
        
        showDrop: function(e){
            var button = this.$("#drop-button");
            
            if(button.attr("class").indexOf("active") != -1){
                button.removeClass("active");
                $(".more-create-action").hide();
                return false;
            }
            
            button.addClass("active");
            $(".more-create-action").show();
            
            $("body").one("click", function(){
                $(".drop-button").removeClass("active");
                $(".more-create-action").hide();
            });

            return false;
        },

        showMainMenu: function(){
            var button = this.$(".main-menu-button"),
            menu = this.$(".main-menu");
            
            if(button.attr("class").indexOf("active") != -1){
                button.removeClass("active");
                menu.hide();
                return false;
            }
            
            button.addClass("active");
            menu.show();
            
            $("body").one("click", function(){
                button.removeClass("active");
                menu.hide();
            });
            
            return false;
        },

        openOptionPage: function(){
            sogouExplorer.tabs.create({
                url: sogouExplorer.extension.getURL("options.html"),
                selected: true
            });
        },

        openHelp: function(){
            if(typeof Help != "undefined"){
                Help.open();
            }
            else{
                window.Help = new HelpView;
                Help.open();
            }
        },

        logoff: function(){
            sogouExplorer.tabs.create({
                url: baseUrl + "/account/logout",
                selected: true
            });

            delete localStorage["userId"];
            delete localStorage["metadata"];
            window.NotLogin = true;

            SyncPort.postMessage({
                name: "disconnect"
            });
	    
            window.close();
        },

        createSearch: function() {
            var key = this.$(".search").val(),
            searchURL = mknote.i18n.getMessage("baseUrl") + "/my#/note/list?keywords=" + key;
            sogouExplorer.tabs.create({
                url: searchURL,
                selected: true
            });
        }
    });
    
    window.NoteEditView = Backbone.View.extend({
        el: $("#view-wrap"),
        
        events: {
            "keyup": "typing",
            "click .view-action .delete": "deleteNote",
            "click .view-action .back": "back",
            "click .view-action .url": "insertURL",
            "click .view-action .now": "showMore",
            "click .clip-list .more li": "clipList",
            "click .content-outer": "focusContent",
            "click .content": "cancelBubble",
            //"blur .content": "save"
        },
        
        initialize: function(){
            var self = this;
            $(".note .content").bind("click", function(e){
                if(e.ctrlKey && $(e.target).attr("href")){
                    var url = $(e.target).attr("href");
                    sogouExplorer.tabs.create({
                        url: url,
                        selected: false
                    });
                }
            });
            
            $(window).bind("keydown", function(e){
                if(e.ctrlKey){
                    $(".note .content").addClass("ctrl-content");
                }
            });
            $(window).bind("keyup", function(e){
                if(e.keyCode == 17){
                    $(".note .content").removeClass("ctrl-content");
                }
            });
            
            //due to chrome popup's bug on window.onunload
            //use connect's disconnect event to emulate
            //save note when popup closed
            var onlinePop = sogouExplorer.extension.connect({"name": "onlinePop"});
        },
        
        show: function(){
            var self = this;
            this.el.css("display", "block").css("left", 500).animate({
                "left": 0
            }, 300, function() {
                self.focusContent();
                StatusBar.setStatus("");
            });
            
            saveStatus(this.editting);
        },
        
        noSlideShow: function(){
            this.el.css("display", "block").css("left", 0);
            this.focusContent();
            
            saveStatus(this.editting);
        },
        
        hide: function(){
            var self = this;
            this.el.animate({
                "left": 500
            }, 300, function() {
                self.el.css("display", "none");
                List.focusDefault();
            });
            
            saveStatus(undefined);
        },
        
        focusDefault: function(){
            this.focusContent();
        },

        setClipping: function(clip) {
            var self = this;
            if(clip){
                this.$(".view-action .clip-list").css("visibility", "visible");
                this.$(".view-action .url").css("display", "none");
                this.$(".view-action .clip-list .insert-article").show();
                sogouExplorer.tabs.getSelected(null, function(tab) {
                    sogouExplorer.tabs.sendRequest(tab.id, {msg: "getContent"}, function(response) {
                        if(!response.success){
                            this.$(".view-action .clip-list .insert-article").hide();
                            self.changeClip("page");
                        }
                        else{
                            var note = response;
                            self.clip(note);
                        }
                    });
                });
            }
            else{
                this.$(".view-action .clip-list").css("visibility", "hidden");
                this.$(".view-action .url").css("display", "inline-block");
            }
            this.clipping = clip;
        },

        clipList: function(e) {
            var method = $(e.currentTarget);
            this.hideArticle();
            switch(method.attr("class")){
                case "insert-article":
                    this.changeClip("article");
                    this.showArticle();
                    break;
                case "insert-page":
                    this.changeClip("page");
                    break;
                case "insert-url":
                    this.changeClip("url");
                    break;
            }
        },

        changeClip: function(clip) {
            if(clip == "article"){
                this.$(".view-action .clip-list .status").html(mknote.i18n.getMessage("clipArticle"));
                this.clipArticle();
            }
            else if(clip == "page"){
                this.$(".view-action .clip-list .status").html(mknote.i18n.getMessage("clipPage"));
                this.clipPage();
            }
            else if(clip == "url"){
                this.$(".view-action .clip-list .status").html(mknote.i18n.getMessage("clipURL"));
                this.clipURL();
            }
        },

        clip: function(note) {
            Edit.setTitle(note.title);
            Edit.setContent(note.content);
        },

        clipArticle: function() {
            var self = this;
            sogouExplorer.tabs.getSelected(null, function(tab) {
                sogouExplorer.tabs.sendRequest(tab.id, {msg: "getContent"}, function(response) {
                    if(response.success){
                        var note = response;
                        self.clip(note);
                    }
                });
            });
        },

        clipPage: function() {
            var self = this;
            sogouExplorer.tabs.getSelected(undefined, function(tab){
                sogouExplorer.tabs.sendRequest(tab.id, {msg: "getBody"}, function(response) {
                    var note = response;
                    self.clip(note);
                });
            });
        },

        clipURL: function() {
            var self = this;
            sogouExplorer.tabs.getSelected(undefined, function(tab){
                var note = {
                    title: tab.title,
                    content: getLink(tab.url, tab.title)
                };
                self.clip(note)
            });
        },

        insertURL: function() {
            var self = this;
            sogouExplorer.tabs.getSelected(null, function(tab){
                var html = getLink(tab.url, tab.title),
                focused = document.execCommand("insertHTML", false, html);
                if(!focused){
                    self.$(".note .content").append(html);
                }
            });
        },
        
        setTitle: function(title){
            this.$(".note .title").val(title);
        },
        
        setContent: function(content){
            content = content.replace(htmlRegex, "");
            
            var _content = $("<div>" + content + "</div>"),
            width = $("#content-width-calculater").append(_content).width() + 10;
            
            this.$(".note .content-outer").css("width", "auto");
            this.$(".note .content").css("width", "auto");
            this.$(".note .content-ext").hide();
            
            if(width > 550){
                this.$(".note .content-outer").width(width);
                this.$(".note .content").width(width);
                this.$(".note .content-ext").show();
            }
            
            _content.remove();
            this.$(".note .content").html(content);
        },
        
        setEditting: function(note){
            this.editting = note;
        },
        
        setLastSavedTime: function(date){
            if(typeof date == "undefined"){
                date = new Date().setTime(0);
            }
            this.lastSavedTime = date;
        },
        
        setCreate: function(b){
            this.isCreate = b;
        },
        
        saveNote: function(callback){
            var self = this,
            note = this.editting,
            date = new Date(),
            data = {
                "title": $.trim(this.$(".note .title").val()),
                "content": $.trim(this.$(".note .content").html()),
                "createTime": note.get("createTime") ? note.get("createTime") : formatDate(date),
                "updateTime": formatDate(date)
            },

            getTitleFromContent = function(content) {
                var purgeTxt = content,
                finalTitle = '';
                if(purgeTxt.length > 0){
                    var t = purgeTxt.substr(0, 40), l = t.length, i = l - 1, hasSpecialChar = false;

                    while(i >= 0){
                        if(/^(9|10|44|65292|46|12290|59|65307)$/.test(t.charCodeAt(i))){
                            hasSpecialChar = true;
                            break;
                        }else{
                            i--;
                        }
                    }
                    hasSpecialChar ? (t = t.substr(0, i)) : '';
                    i = 0;
                    l = t.length;
                    while(i < l){
                        if(/^(9|10)$/.test(t.charCodeAt(i))){
                            break;
                        }else{
                            finalTitle += t[i];
                            i++;
                        }
                    }
                }
                if(finalTitle.length > 0){
                    return finalTitle;
                }
                else{
                    return mknote.i18n.getMessage("untitled");
                }
            };
            
            if(data.content == "" || data.content == "<br>" || $.trim(this.$(".note .content").text()) == ""){
                if(data.title == ""){
                    if(note.id){
                        data.title = mknote.i18n.getMessage("untitled");
                        this.setTitle(data.title);
                    }
                    else{
                        return false;
                    }
                }
            }
            
            if(!this.lastSavedTime){
                this.lastSavedTime = date;
            }
            
            if(data.title == ""){
                data.title = getTitleFromContent(this.$(".note .content").text());
                this.$(".note .title").val(data.title);
            }
            
            data.content = data.content.replace(htmlRegex, "");
            
            note.save(data, {
                success: function(item){
                    if(self.isCreate){
                        Note.add(note);
                        self.isCreate = false;
                        console.log("note created");
                        saveStatus(note);
                    }
                    
                    List.$(".note-list").prepend(document.getElementById(note.get("id")));
                    
                    StatusBar.setStatus("noteSaved");
                    console.log("note saved");
                },
                error: function(err){
                    console.log(err);
                }
            });
        },
        
        typing: function(e){
            StatusBar.setStatus("noteEditting");
            this.autoSaveNote();
        },
        
        autoSaveNote: _.throttle(function(){
            this.save();
        }, 2000),

        save: function(remain){
            var self = this;

            if(self.needToSave()){
                console.log("need to save");
                self.saveNote();
            }
            else if(remain){
                console.log("no need to save");
                StatusBar.setStatus("noteRemain");
            }
        },
        
        needToSave: function(){
            var note = this.editting,
            data = {
                "title": $.trim(this.$(".note .title").val()),
                "content": $.trim(this.$(".note .content").html()),
            };
            
            if(note.get("title") != data.title || note.get("content") != data.content){
                return true;
            }
            
            return false;
        },
        
        showArticle: function(){
            sogouExplorer.windows.getCurrent(function(win){
                sogouExplorer.tabs.getSelected(win.id, function(tab){
                    sogouExplorer.tabs.sendRequest(tab.id, "showArticle");
                });
            });
        },
        
        hideArticle: function(){
            sogouExplorer.windows.getCurrent(function(win){
                sogouExplorer.tabs.getSelected(win.id, function(tab){
                    sogouExplorer.tabs.sendRequest(tab.id, "hideArticle");
                });
            });
        },
        
        focusContent: function(){//click outer focus content and set cursor to the end
            this.$(".note .content").focus();
            
            var range= document.createRange();
            range.selectNodeContents(document.getElementById("content"));
            range.collapse(false);

            var selection= window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },
        
        cancelBubble: function(e){//click outer foucs content, but click content do not
            e.stopPropagation();
        },

        deleteNote: function() {
            if(this.isCreate){
                this.setEditting(undefined);
                this.hide();

                this.setClipping(false);
            }
            Note.remove(this.editting);
            
            StatusBar.setStatus("synchronizing");

            SyncPort.postMessage({
                name: "start",
                callback: (function() {
                    Note.reset();
            
                    if(List.$(".search").val() != ""){// back to list when search input is not empty
                        List.searchFilter();
                    }

                    StatusBar.setStatus("syncFinished");
                }).toString()
            });
        },

        back: function() {
            this.save();
            this.hide();

            this.setClipping(false);
            this.hideArticle();
        },

        showMore: function() {
            var list = this.$(".view-action .more"),
            button = this.$(".view-action .now");

            if(button.attr("class").indexOf("active") != -1){
                button.removeClass("active");
                list.hide();
                return false;
            }
            
            button.addClass("active");
            list.show();

            //cause click content will stopPropagation so here use mouseup  
            $("body").one("mouseup", function(){
                button.removeClass("active");
                list.hide();
            });

            return false;
        }
    });
    
    window.StatusBarView = Backbone.View.extend({
        el: $("#status-bar"),
        
        events: {
            "click .sync .manual-sync": "sync"
        },
        
        statusEl: this.$(".status span"),
        
        setStatus: function(status){
            if(!status){
                return false;
            }
            var statusText = mknote.i18n.getMessage(status);
            this.statusEl.text(statusText);
        },
        
        sync: function(){
            var self = this;
            
            this.setStatus("synchronizing");

            SyncPort.postMessage({
                name: "start",
                callback: (function() {
                    Note.reset();
                    StatusBar.setStatus("syncFinished");
                }).toString()
            });
            
            return false;
        },
        
        initialize: function(){
            var syncBtn = this.$(".sync .text"),
            offlineTip = this.$(".sync .offline"),
            loginTip = this.$(".sync .login");
            
            setInterval(function(){
                // if(this.offline != Sync.offline){
                //     if(Sync.offline){
                //         syncBtn.hide();
                //         offlineTip.show();
                //     }
                //     else{
                //         syncBtn.show();
                //         offlineTip.hide();
                //     }
                //     this.offline = Sync.offline;
                // }
                // if(this.logined != Sync.logined){
                //     if(!Sync.logined){
                //         syncBtn.hide();
                //         loginTip.show();
                //     }
                //     else{
                //         syncBtn.show();
                //         loginTip.hide();
                //     }
                //     this.logined = Sync.logined;
                // }
            }, 500);
        }
    });

    window.HelpView = Backbone.View.extend({
        el: $(".help"),

        events: {
            "click .go": "close",
            "click .next": "next",
            "click .prev": "prev"
        },

        initialize: function() {
            this.show = 0;
            this.card = this.$(".card");
            this.nav = this.$(".nav .page");

            this.buildNav();
        },

        buildNav: function() {
            var self = this,
            len = this.card.length;

            for(var i = 0;i< len;i++){
                this.nav.append('<li data="' + i + '">' + (i+1) + '</li>');
            }

            this.nav.children("li:first").addClass("active");

            this.nav.children("li").bind("click", function(){
                var index = $(this).attr("data");

                if(index == self.show){
                    return false;
                }

                self.go(index);
            });
        },

        next: function() {
            var index = this.show + 1 > this.card.length - 1 ? 0 : this.show + 1;
            this.go(index);
        },

        prev: function() {
            var index = this.show - 1 < 0 ? this.card.length -1 : this.show - 1;
            this.go(index);
        },

        go: function(index) {
            $(this.nav.children("li")[index]).addClass("active");
            $(this.nav.children("li")[this.show]).removeClass("active");

            $(this.card[index]).removeClass("hide").addClass("show");
            $(this.card[this.show]).removeClass("show").addClass("hide");

            this.show = index;
        },

        open: function() {
            this.el.fadeIn("fast");
            $("#cover").fadeIn("fast");
        },

        close: function() {
            this.el.fadeOut("fast");
            localStorage["firstRun"] = false;
            $("#cover").fadeOut("fast");
        }
    });
    
    window.Application = Backbone.View.extend({
        initialize: function(){
            var self = this,
            lastSavedNote = localStorage["lastSavedNote"],
            firstRun = localStorage["firstRun"];

            if(NotLogin){
                var notLogin = $(".not-login");
                notLogin.find(".login").attr("href", mknote.i18n.getMessage("baseUrl") + "/account/preloginredirect?cooperator=" + mknote.i18n.getMessage("userSource") + "&redirectUrl=/login");
                notLogin.find(".register").attr("href", mknote.i18n.getMessage("baseUrl") + "/account/preloginredirect?cooperator=" + mknote.i18n.getMessage("userSource") + "&redirectUrl=/register");
                notLogin.show();
                $("#cover").show();
                $(".wrapper").show();

                return true;
            }
            $(".wrapper").show();
            
            window.Edit = new NoteEditView;
            window.List = new NoteListView;
            window.StatusBar = new StatusBarView;

            if(typeof firstRun == "undefined"){   
                window.Help = new HelpView;
                Help.open();
            }
            
            if(typeof localStorage["metadata"] == "undefined"){
                StatusBar.setStatus("synchronizing");
                SyncPort.postMessage({
                    name: "init",
                    callback: (function() {
                        Note.reset();
                        StatusBar.setStatus("syncFinished");

                        localStorage["firstRun"] = false;
                    }).toString()
                });
                return true;
            }

            StatusBar.setStatus("synchronizing");
            SyncPort.postMessage({
                name: "start",
                callback: (function() {
                    Note.reset();
                    
                    StatusBar.setStatus("syncFinished");
                }).toString()
            });
            
            if(lastSavedNote == "undefined" || !lastSavedNote){
                return true;
            }
            
            var note = new NoteModel({id: lastSavedNote});
            note.fetch({
                success: function(){
                    if(typeof note == "undefined"){
                        return true;
                    }
                    
                    Edit.setTitle(note.get("title"));
                    Edit.setContent(note.get("content"));
                    Edit.setEditting(note);
                    Edit.setLastSavedTime(undefined);
                    Edit.setCreate(false);
                    Edit.noSlideShow();
                    Edit.focusContent();
                },
                error: function(){
                    console.log("status recover error");
                }
            });
        }
    });

    var checkUser = function(callback){
        $.ajax({
            url: syncUrl + "/account/metadata",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-ClientInfo", mknote.i18n.getMessage("statisticsString"));
            },
            success: function(json){
                if(localStorage["userId"] && json.userId != localStorage["userId"]){
                    localStorage["userId"] = json.userId;
                    delete localStorage["metadata"];
                }
                else if(!localStorage["userId"]){
                    localStorage["userId"] = json.userId;
                    delete localStorage["metadata"];
                }

                if(!Storage.get("changedNote")){
                    Storage.set("changedNote", "");
                }

                if(!Storage.get("defaultCategoryId")){
                    $.ajax({
                        url: syncUrl + "/note-categories",
                        type: "GET",
                        async: false,
                        success: function(json){
                            _.each(json, function(item){
                                if(item["type"] == "default" && item["accessLevel"] == "private"){
                                    Storage.set("defaultCategoryId", item["id"])
                                    window.defaultCategoryId = item["id"];
                                }
                            });
                        }
                    });
                }
                else{
                    window.defaultCategoryId = Storage.get("defaultCategoryId");
                }

                window.NotLogin = false;

                callback();
            },
            error: function(err) {
                if(err.status == "401"){
                    window.NotLogin = true;

                    SyncPort.postMessage({
                        name: "disconnect"
                    });
                }

                callback();
            }
        });
    };

    window.Init = function() {
        window.noteLogin = true;
        checkUser(function() {
            window.App = new Application;
        });
    };

    window.Init();
    
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
    
    function getLink(url, title){
        return '<a href="' + url + '" title="' + (title ? title : "") + '">' + url + '</a>';
    }
    
    function saveStatus(note){
        var id = "";
        if(note){
            id = note.get("id") ? note.get("id") : note.get("guid");
        }
        
        localStorage["lastSavedNote"] = id;
    }
})();