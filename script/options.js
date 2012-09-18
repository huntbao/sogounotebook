var AddLinkSite = {
    sitesMap: [
        {
            "name":"腾讯微博",
            "logo":"images/sites/qq.png",
            "id":"qq"
        },
        {
            "name":"新浪微博",
            "logo":"images/sites/sina.png",
            "id":"sina"
        },
        {
            "name":"人人网",
            "logo":"images/sites/renren.png",
            "id":"renren"
        },
        {
            "name":"豆瓣",
            "logo":"images/sites/douban.png",
            "id":"douban"
        }
    ],
    
    buildSitesList: function(){
        for(var i=0;i<this.sitesMap.length;i++){
            var item = '<li data="' + this.sitesMap[i].id + '">' + '<img src="' + this.sitesMap[i].logo + '" />'
            + "<span>" + this.sitesMap[i].name + "</span></li>";
            this.sitesList.append(item);
        }
    },
    
    onItemClicked: function(){
        this.sitesList.children("li").bind("click", function(){
            $(this).toggleClass("active");
            if($.inArray($(this).attr("data"), Settings.setting.sites) !== -1){
                var that = this;
                Settings.setting.sites = $.grep(Settings.setting.sites, function(n,i){
                        return n != $(that).attr("data");
                    }
                );
            }
            else{
                Settings.setting.sites.push($(this).attr("data"));
            }
            Settings.save();
        });
    },
    
    init: function(){
        this.sitesList = $("#sites-list");
        this.buildSitesList();
        this.onItemClicked();
        var self = this;
        
        //for transition
        setTimeout(function(){
            $.each(self.sitesList.children("li"), function(i,n){
                if($.inArray($(n).attr("data"), Settings.setting.sites) != -1){
                    $(n).addClass("active");
                }
            })
        },0);
    }
};

var AddToolbar = {
    onSwitchClicked: function(){
        var self = this;
        $(".toolbar .button").bind("click", function(){
            if(self.toolbarOn){
                $(this).removeClass("on").addClass("off");
                self.toolbarOn = false;
                Settings.setting.toolbar = false;
            }
            else{
                $(this).removeClass("off").addClass("on");
                self.toolbarOn = true;
                Settings.setting.toolbar = true;
            }
            Settings.save();
        });
    },
    init: function(){
        this.toolbarOn = Settings.setting.toolbar;
        this.onSwitchClicked();
        
        if(!this.toolbarOn){
            $(".toolbar .button").addClass("off");
        }
        else{
            $(".toolbar .button").addClass("on");
        }
    }
};

$(document).ready(function(){
    AddLinkSite.init();
    AddToolbar.init();
});