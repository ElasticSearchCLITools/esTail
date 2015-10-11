/**************************************************
**
** Requirements
**
***************************************************/
var elasticsearch = require('elasticsearch');
var markupjs = require('markup-js');
var fs = require('fs');
var colour = require('colour')
var regex=false;
var allfields;
var regexflags="gm";
var rawoutput;
//console.info = function (){};
/**************************************************
**
** Varables
**
***************************************************/
var count = 0;
var searchDone=true;
var url="localhost:9200"
var refreshInterval=1000;
var searchFilename="default.search"
var searchTemplate = fs.readFileSync('default.search', 'utf8')
//var loglevel="error"
var context = {
    index:"_all",
    from:"now-10m",
    fetchsize: 100
}
/***************************************************
**
** Setup
**
***************************************************/
/*******************************
**
** Process Command Line
**
********************************/
console.info("Processing Commandline arguments");
process.argv.forEach(function (val, ind, array) {
    if(/^(-h|--help|-\?)$/.test(val) ){
        console.log(process.argv[0]+":");
        console.log("\t[--url="+url+"]");
        console.log("\t[--search=<filename> default: "+searchFilename);
        console.log("\t[--regex='([\d\.]+)' default: none");
        console.log("\t[--regexflags='gm'   default: "+regexflags);
        console.log("\t[--allfields         default: false ");
        console.log("\t[--raw         	    default: false ");
        console.log("\t[--fetchsize='20'  default: 100 ");
        console.log("\t[-i|--refreshInterval='1000'  default: "+refreshInterval);
	console.log("\t\t\tHow often a new search is issued");
        console.log("\t[--context='{ 'custom':'json'}'  default:"+JSON.stringify(context) );
	console.log("\t\t\tContext is what varables pass to the search template for json markup");
	console.log("\t\t\tcontext=<key>=<val> is a way to set any varable inside the context array. Make sure this is used after --contextfile or --context=<customejson>");
        console.log("\t[--index=<index>|--context=index=<index>     default: "+context.index);
        console.log("\t[--from=<datestamp>|--context=from='now-5m'  default: "+context.from);
	console.log("\t\t\tfrom can be of any valid Elasticsearch timevalue or Caclulation ");
        process.exit(1)
    }
    if (val === "--allfields" ){
	    allfields = true;
	    console.info("--allfields="+allfields);
    }
    if (val === "--raw"){
            rawoutput=true;
	    console.info("--raw="+rawoutput);
    }
    if(val.indexOf('=') >0){
        var s = val.split(/=/);
        console.info(s[0] + ' : ' + s[1]); 
        if (s[0] === "--url" ){
            url=s[1];
        }
	if (s[0] === "--regexflags" ){
	    regexflags =  s[1];
	}
	if (s[0] === "--regex" ){
	    regex = s[1];
	}
	if (s[0] === "--loglevel" ){
	    loglevel = s[1];
	}
	if (s[0] === "--refreshinterval" || s[0] === "-i" ){
	    refreshInterval = s[1];
	}
	if (s[0] === "--contextfile" ){
	    context = s[1];
	    if (fs.existsSync(s[1])) {
			var searchTemplate = fs.readFileSync(s[1],'utf8'); 
			console.info(searchTemplate);
	    }else{
			console.error("file does not exist:"+s[1]);
			process.exit(2);
	    }
	    context = JSON.parse(context);
	}
	if (s[0] === "--context" && s.length == 2){
	    context = s[1];
	    context = JSON.parse(context);
	}
        if (s[0] === "--context" && s.length > 2 ){
	    console.log(s);
            context[s[1]]=s[2]
	    console.info("context."+s[1]+"="+s[2]);
        }
        if (s[0] === "--search"){
            searchFilename=s[1];
        }
    }
});
regex = new RegExp( regex,regexflags);

if (fs.existsSync(searchFilename)) {
	var searchTemplate = fs.readFileSync(searchFilename,'utf8'); 
	//console.info(searchTemplate);
}else{
	console.error("file does not exist:"+searchFilename);
	process.exit(2);
}
var client = new elasticsearch.Client({
  host: url,
  protocol: 'http',
  index: context.index,
  keepAlive: true ,
  ignore: [404],
  suggestCompression: true,
  sniffOnStart: true,
  sniffInterval: 60000,
});
/**************************************************
**
** Test Connection
**
***************************************************/
client.ping({
  requestTimeout: 1000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster maybe down!');
    process.exit(1);
  }else{
    console.log('Connected to Elasticsearch cluster.')	
  } 
});

/********************************************************************************
**
** Functions
**
*********************************************************************************/
function doSearch(){
	//console.log(context);
	//console.info("Running search".blue);
	var search = markupjs.up(searchTemplate,context); 
        //console.info(search);
	client.search( JSON.parse(search) , ph = function printHits(error, response) {
	  response.hits.hits.forEach(function (hit) {
		if ( allfields ) {
			console.log(hit._source["@timestamp"].red+": ".green+JSON.stringify(hit._source).yellow);
		}else{
			if (rawoutput) {
				console.log(JSON.stringify(hit,null,2));
			}else{
				console.log(hit._source["@timestamp"].red+": ".green+hit._index.green+":".green+hit._source.message)
			}

		}
		if ( regex ) {
			var result = hit._source.message.match(regex);
			if ( result  ){
				console.log("\tregex: ".red+JSON.stringify(result).yellow);	
			}
		}


		context.from = hit._source["@timestamp"];
		count++;
	  });
	  if ( count >= response.hits.total ){ 
		  count=0;
		  searchDone=true;
		  //console.log("Search complete".blue)
		  return;
	  }
	  client.scroll({
	      scrollId: response._scroll_id,
	      scroll: '30s'
	  }, ph);
	});
}
/********************************************************************************
**
** Application
**
*********************************************************************************/

setInterval ( function () { if(searchDone) { doSearch()}}, refreshInterval );
