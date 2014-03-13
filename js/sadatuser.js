// declare the module
var samoduser = function () {          
    var config = {
    };    

    var init= function(config) {
        var self = this; // assign reference to current object to "self"
        $.extend(this.config, config);
    };

    // user defined generators-------------------------------------------------------------------
    var userGenEnum= function (doc) {
        var res = "UNKOWN";
        //sample generator, depends on the id field
        if (!isNaN(doc.id)){
            if (doc.id % 2 == 0){
                res = 'EVEN';
            } else {
                res = 'ODD';
            }
        }
        return res;
    };

    return {
        init: init,
        // export your methods start them with 'user'...() 
        userGenEnum: userGenEnum,
        // list them in this array
        userMethods:['userGenEnum']
    };
}(); 
