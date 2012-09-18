(function(){
if(!window.mknote){
    window.mknote = {};
}
mknote.i18n = {
    locale: {
        "syncUrl": {
            "message":"http://sync.notelocal.sdo.com/v1",
            "description":"sync url of maiku"
        },
        "baseUrl":{
            "message":"http://notelocal.sdo.com",
            "description":"main url of maiku"
        },
        "statisticsString":{
            "message":"inote_web_SogouExt/3.0",
            "description":"for mknote statistics"
        },
        "userSource":{
            "message":"sogou-ext",
            "description":"for mknote user register statistics"
        },
        "saveToMaiku":{
            "message":"保存到麦库",
            "description":"save to maiku"
        },
        "fromSina":{
            "message":"来自新浪微博",
            "description":"from t.sina.com"
        },
        "fromQQ":{
            "message":"来自腾讯微博",
            "description":"from t.qq.com"
        },
        "fromRenren":{
            "message":"来自人人网",
            "description":"from renren.com"
        },
        "fromDouban":{
            "message":"来自豆瓣",
            "description":"from douban.com"
        },
        "refreshAfterLoad":{
            "message":"由于当前页面是您安装麦库之前打开，所以请您先刷新当前页面再使用。",
            "description":"tips about refresh page that loaded before install"
        },
        "noteSaved":{
            "message":"已保存",
            "description":"status bar text when note has saved"
        },
        "noteSynced":{
            "message":"已同步",
            "description":"status bar text when note has saved"
        },
        "noteRemain":{
            "message":"没有改动",
            "description":"status bar text when note is editting"
        },
        "noteEditting":{
            "message":"正在编辑...",
            "description":"status bar text when note is editting"
        },
        "synchronizing":{
            "message":"正在同步...",
            "description":"status bar text when synchronizing"
        },
        "syncFinished":{
            "message":"同步完成",
            "description":"status bar text when sync finished"
        },
        "saveSuccess":{
            "message":"保存成功",
            "description":"save content to a note success"
        },
        "untitled":{
            "message":"[未命名笔记]",
            "description":"title of untitled note"
        },
        "clipPage":{
            "message":"截取完整网页",
            "description":"clip page body text"
        },
        "clipArticle":{
            "message":"截取网页正文",
            "description":"clip page article text"
        },
        "clipURL":{
            "message":"截取网页地址",
            "description":"clip page url text"
        }
    },
    
    getMessage: function(msg){
        return this.locale[msg].message;
    }
}
})();