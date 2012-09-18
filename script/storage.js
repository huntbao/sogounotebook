(function() {
    window.Storage = {};

    Storage.get = function(key) {
        var userID = localStorage["userId"];

        return localStorage[userID + "(^)" + key];
    };

    Storage.set = function(key, data) {
        var userID = localStorage["userId"];

        localStorage[userID + "(^)" + key] = data;

        return Storage.get(key);
    };

    Storage.del = function(key) {
        var userID = localStorage["userId"];

        delete localStorage[userID + "(^)" + key];
    };
})();