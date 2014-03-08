// declare the module
var samod = function () {          
    // set some configuation 
    var config = {
        URL:'http://localhost:8983/solr/collection1',
        fieldTypes  : new Array(),
        IGNORE_NAMES: [ '_version_', '_root_' ],
        //IGNORE_TYPES: {}
        genOptions : {
            Ignore: 'Ignore',
            Text: 'Text',
            Boolean: 'Boolean',
            Date: 'Date',
            Int: 'Int',
            Float: 'Float'
        }
    };    

    var init= function(config) {
        var self = this; // assign reference to current object to "self"

        $.extend(this.config, config);

        $('<button></button>', {
            text: 'Generate Docs',
            id: 'showGen'
        })
        .insertAfter( 'div#sform' )
        .on( 'click', this.show );

        $('#buttonLoad').on('click', self.fetchFields);
        $('#buttonGen').on('click', self.genDocs);
        console.log('initalized');
        onStart();
    };

    // private functions --------------------------------------------------------------------
    var fetchFieldTypes = function () {
        //load userGen methods, would be better inside init(), but genOptions is undef
        samoduser.init();
        $.each(samoduser.userMethods, function(index, prop) {
            console.log('samoduser: '+prop);
            config.genOptions.prop = prop;
        });

        $.ajax({
            type: "GET",
            url: config.URL +'/schema/fieldtypes',
            contentType: "application/json; charset=utf-8",
            async: false,
            dataType: "json",
            success: parseTypeInfo,
            error: OnGetSchemaError
        });
    };

    var parseTypeInfo=function(data, status){
        for(var f in data.fieldTypes){
            var af = data.fieldTypes[f];
            var pair = {name:af.name, class:af.class};
            config.fieldTypes.push(pair);
            console.log(pair);
        } 
    }

    var fetchFields = function (e) {
        onStart();
        var turl = $('#url').val();
        config.URL = turl;
        console.log('URL '+ config.URL);
        $("#fieldsTable > tbody").html('');
        //store types first
        fetchFieldTypes();        
        if (typeof config.fieldTypes !== 'undefined' && config.fieldTypes.length > 0){
        $.ajax({
            type: "GET",
            url: config.URL +'/schema/fields',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: OnGetSchemaSuccess,
            error: OnGetSchemaError
        });
        }
    };

    var onStart = function () {
        config.fieldTypes = new Array();
        $('.schemaLoaded').hide();
        $('.docsGenerated').hide();
    }

    var onSchemaLoaded = function () {
        $('.schemaLoaded').show();
        $('.docsGenerated').hide();
        $('#fieldsHead').show();
    };
    var onSchemaLoadedKO = function () {
        $('.docsGenerated').hide();
        $('.schemaLoaded').hide();
        $('#content').show();
        $('#fieldsHead').show();
    };
    var onDocsGenerated = function () {
        $('.schemaLoaded').show();
        $('#fieldsHead').show();
        $('.docsGenerated').show();
    };

    var OnGetSchemaSuccess = function (data, status) {
        for(var f in data.fields){
            var af = data.fields[f]
            //console.log(config.fieldTypes);
            var atype = $.grep(config.fieldTypes, function(e, index) { return e.name == af.type }); 
            //console.log(af.name+ ' found '+ JSON.stringify(atype) + " .. "+atype.class);
            var cl = atype[0].class;
            var solrtype = cl.substring(cl.indexOf('.')+1);
            var defgen = getDefaultGen(solrtype, af.name);
            $('#fieldsTable > tbody:last').append(createField(af.name, solrtype, defgen));
            //add options to select, we need to do it here cause until tr is added we cannot get by select#id
            createSelect(af.name, defgen);
        } 
        onSchemaLoaded();        
    };

    var OnGetSchemaError= function (request, status, error) {
        $('#fieldsTable > tbody:last').append('Error: '+error+' status:'+status);
        onSchemaLoadedKO();        
    };

    var getDefaultGen = function (type, name) {
        var gentype = 'Ignore';
        if (type=='TextField' || type=='StrField'){
            gentype = 'Text';
        } else if (type=='BoolField'){
            gentype = 'Boolean';
        }else if (type.indexOf('DateField', type.length - 'DateField'.length) !== -1){
            gentype = 'Date';
        }else if (type.indexOf('LongField', type.length - 'LongField'.length) !== -1 || type.indexOf('IntField', type.length - 'IntField'.length) !== -1){
            gentype = 'Int';
        }else if (type.indexOf('FloatField', type.length - 'FloatField'.length) !== -1){
            gentype = 'Float';
        }
        //ignore by name
        if ($.inArray(name, config.IGNORE_NAMES)>-1){
            gentype = 'Ignore';
        }
        return gentype;
    }

    var createField = function (name, type, defgen) {
        //console.log('createField'+name+'-'+type);
        var div = $('<tr></tr>', {
            class: 'fielddiv'
        });
        $('<td></td>', {
            text: name,
            class: 'field'
        }).appendTo(div);
        $('<td></td>', {
            text: type,
            class: 'fieldtype'
        }).appendTo(div);
        var td = $('<td><select id="genselect-'+name+'"></select></td>', {
            class: 'fieldgentype'
        }).appendTo(div);
        if (type=='int' || type=='long'|| type=='float'){
            var td = $('<td></td>', {
            }).appendTo(div);
            $('<input type="number" value="0"></input>', {
                class: 'fmin'
            }).appendTo(td);
            td = $('<td></td>', {
            }).appendTo(div);
            $('<input type="number" value="1000"></input>', {
                class: 'fmax'
            }).appendTo(td);
        }
        return div;
    };

    var createSelect = function(fname, defgen){
        $.each(config.genOptions, function(val, text) {
            var sel = 'genselect-'+fname;
            var option =  new Option(text,val); 
            if (val==defgen){
                option =  new Option(text,val,true,true);
            }
            $('#'+sel).append(option);
        });
    }

    var validateFields=function(){
        var err='a';
        return err;
    }
    var genDocs= function(e) {
        var errors = validateFields();
        if (errors){
            alert('Fix field settins before generating docs: '+errors);
            return;
        }
        var numdocs = $('#numberdocs').val();
        var numdocsOk = 0;
        console.log('Generating docs '+numdocs);
        for (var i=0; i<numdocs;i++){
            var doc =   genOneDoc(i);
            numdocsOk += indexDoc(doc);
            if (numdocs%10 == 0){
                commitSolr();
            }
        }
        commitSolr();
        console.log('indexed '+numdocsOk+' out of '+ numdocs);
        showResults(numdocsOk);
    };
    var indexDoc= function(doc){
        //console.log('indexing: '+JSON.stringify(doc));
        var ret = 1;
        $.ajax({
            type: "POST",
            url: config.URL +'/update',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async : false,
            data : '['+JSON.stringify(doc)+']',
            success: function(data) {
                //console.log("indexing ok: " + doc);
            },
            error: function(data) {
                ret = 0;
                console.log("indexing error: " + data);
            }
        });
        return ret;
    };

    var commitSolr= function(){
        $.ajax({
            type: "POST",
            url: config.URL +'/update?commit=true',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async : false,
            data : {},
            error: function(data) {
                console.log("indexing error: " + data);
            }
        });
    };
    var showResults= function(nb){
        $('label.result').text(nb);
        $('a.result').attr("href", config.URL+"/select?q=*%3A*&wt=json&indent=true");
        onDocsGenerated();        
    };
    var   genOneDoc= function(i) {
        var d = {};
        $('.fielddiv').each(function(index){
            var ftype = $(this).find('.fieldtype').text();
            var fname  = $(this).find('.field').text();
            var gentype   = $(this).find('.fieldgentype').text();
            var genmin = $(this).find('.fmin').val();
            var genmax = $(this).find('.fmax').val();
            //console.log(fname+'-'+ftype+'-'+gentype+'-'+genmin+'-'+genmax);
            d[fname] = genOneField(fname, ftype, gentype,genmin,genmax);
        })
        //console.log('doc '+i+' '+JSON.stringify(d, undefined, 2));
        return d;
    };

    var genOneField= function(fname, ftype, gentype, min, max) {
        var ret;
        switch (gentype) {
            case 'Numeric':
                ret = getRandomNumeric(ftype, min, max) 
            break;
            default:
                ret = getRandomText(ftype, gentype);
        }
        return ret;
    };
    var  getRandomText= function(ftype, gentype) {
        var ret = chance.sentence({words: 5});
        return ret;
    };
    var  getRandomNumeric= function(ftype, smin, smax) {
        var ret;
        var min = parseFloat(smin);
        var max = parseFloat(smax);
        switch (ftype) {
            case "float":
                var random = (Math.random() * (max - min) + min).toFixed(4);
            ret = random;
            break;
            default:
                var random = Math.floor(Math.random() * (max - min + 1)) + min;
            ret = random;
        }
        return ret;
    };
    return {
        // set up which functions should be public        
        init: init,
        fetchFields: fetchFields,
        genDocs: genDocs
    };
}(); 
