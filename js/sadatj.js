// declare the module
var samod = function () {          
    // set some configuation 
    var config = {
        URL:'http://localhost:8983/solr/collection1',
        fieldTypes  : new Array(),
        IGNORE_NAMES: [ '_version_', '_root_' ],
        //IGNORE_TYPES: {}
        genOptions : [
            ['Ignore'],
            ['Text', 1, 5],
            ['Boolean'],
            ['Date'],
            ['Int', 0, 1000],
            ['Float', 0, 1000]
        ]
        //genOptions : {
        //Ignore: ['Ignore'],
        //Text: ['Text', 1, 5],
        //Boolean: ['Boolean'],
        //Date: ['Date'],
        //Int: ['Int', 0, 1000],
        //Float: ['Float', 0, 1000]
        //}
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
            //console.log('samoduser: '+prop);
            config.genOptions.push([prop]);
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
            //console.log(pair);
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
            class: 'fielddiv',
            id: 'tr-'+name
        });
        $('<td></td>', {
            text: name,
            class: 'field'
        }).appendTo(div);
        $('<td></td>', {
            text: type,
            class: 'fieldtype'
        }).appendTo(div);
        var td = $('<td></td>', {
            class: 'fieldgentype'
        }).appendTo(div);
        var select = $('<select id="genselect-'+name+'"></select>', {
        }).appendTo(td);
        //min/max
        setRightMinMax(div, defgen, 'tr-'+name);
        select.change( function () {
            var option = select.val();
            setRightMinMax(div, option, 'tr-'+name);
        }
                     );
                     return div;
    };

    var setRightMinMax = function(div, defgen,trid){
        //remove old ones
        $('#'+trid+' td.minmax').remove();
        //add new ones
        var tdmin = $('<td></td>', {
            class: 'minmax'
        }).appendTo(div);
        var m = createMin(defgen);
        //console.log('min '+ m);
        if (m){
            m.appendTo(tdmin);
        }
        var tdmax = $('<td></td>', {
            class: 'minmax'
        }).appendTo(div);
        m = createMax(defgen);
        if (m){
            m.appendTo(tdmax);
        }
    }
    var createMax = function(defgen){
        return createNumericInput(defgen, 'fmax', 2);
    }
    var createMin = function(defgen){
        return createNumericInput(defgen, 'fmin', 1);
    }
    var createNumericInput = function(defgen, tclass, valindex){
        var optiontype = $.grep(config.genOptions, function(obj, index){ return obj[0] == defgen });
        //console.log(defgen+' '+tclass+' '+valindex);
        var value = optiontype[0][valindex];
        if (value == undefined){
            return null;
        }
        return $('<input></input>', {
            type: 'number',
            value: value,
            class: tclass
        });
    }

    var createSelect = function(fname, defgen){
        $.each(config.genOptions, function(index, array) {
            var text = array[0];
            var sel = 'genselect-'+fname;
            var option =  new Option(text,text); 
            if (text==defgen){
                option =  new Option(text,text,true,true);
            }
            $('#'+sel).append(option);
        });
    }

    var validateField=function(name, fieldgentype, min, max){
        //console.log('validate '+name+' '+min+' '+max);
        var vmin, vmax;
        if(min==undefined) return;
        if (fieldgentype=='Float'){
            vmin = parseFloat(min);
            vmax = parseFloat(max);
        } else{
            vmin = parseInt(min);
            vmax = parseInt(max);
        }
        var err;
        if (vmin>=vmax){
            err=name+': min must be < max';
        }
        //console.log('val ret '+err+' '+vmin+' '+vmax);
        return err;
    }
    var validateFields=function(){
        var err='';
        //just check min/max
        $("tbody tr").each(function() {
            $this = $(this)
            var name = $this.find("td.field").html();
            var gentype = $this.find("td.fieldgentype").html();
            var min = $this.find("input.fmin").val();
            var max = $this.find("input.fmax").val();
            //console.log(name+' '+min+' '+max);
            var ferr = validateField(name, gentype, min, max);            
            if (ferr){
                err += '\n'+ferr;
            }
        });
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
        //gen user defined ones last
        var fieldlist = $('.fielddiv').sort(function(atr,btr){
            var a = $(atr).find('.fieldgentype select').val();
            var b = $(btr).find('.fieldgentype select').val();
            //console.log('comp '+a+' '+b);
            if (a.indexOf('user') == 0 && b.indexOf('user') == 0) return 0;
            if (a.indexOf('user') == 0) return 1;
            if (b.indexOf('user') == 0) return -1;
            return 0;
        });
        $.each(fieldlist, function(index, value){
            var ftype = $(value).find('.fieldtype').text();
            var fname  = $(value).find('.field').text();
            var gentype   = $(value).find('.fieldgentype select').val();
            var genmin = $(value).find('.fmin').val();
            var genmax = $(value).find('.fmax').val();
            //console.log(fname+'-'+ftype+'-'+gentype+'-'+genmin+'-'+genmax);
            d[fname] = genOneField(d, fname, ftype, gentype,genmin,genmax);
        })
        //console.log('doc '+i+' '+JSON.stringify(d, undefined, 2));
        return d;
    };

    var genOneField= function(doc, fname, ftype, gentype, min, max) {
        console.log(doc);
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
        config: config,
        // set up which functions should be public        
        init: init,
        fetchFields: fetchFields,
        genDocs: genDocs
    };
}(); 
