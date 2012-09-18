(function(){
    window.Settings = {
        save: function(){
            localStorage["MAIKU_SETTINGS"] = JSON.stringify(this.setting);
        },
        
        init: function(){
            
            if(localStorage["MAIKU_SETTINGS"]){
                this.setting = JSON.parse(localStorage["MAIKU_SETTINGS"]);
            }
            else{
                localStorage["MAIKU_SETTINGS"] = "";
                this.setting = {
                    "sites": [],
                    "toolbar": true
                }
            }
        }
    }
    Settings.init();
})();