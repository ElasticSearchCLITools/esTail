#!/usr/bin/env node
/**************************************************
**
** Requirements
**
***************************************************/
var elasticsearch = require('elasticsearch');
var markupjs = require('markup-js');
var fs = require('fs');
var colour = require('colour')
var moment = require('moment')
/**************************************************
**
** Varables
**
***************************************************/
// Display all fields default=undefined 
var output=[];
var allfields;
// Is regex flag and the REGEX expression
var regex=false;
// default flags for regex g m i
var regexflags="gm";
// Display entire hit in JSON format or just deplay the message
var rawoutput;
// Disable Info messages
//console.info = function (){};
/**************************************************
**
** Varables
**
***************************************************/
// Count of documents retrieved which tells us when the scan/scroll is finished
// flag when the search scan/scoll is retrieved
var searchDone=true;
// the Host to connect to
var hostportlist="localhost:9200"
// How often to query the index
var refreshInterval=1000;
// Default search template (json markup) 
var searchFilename=__dirname+"/default.search"
// The DSL Query to Elasticsearch - I'll probably set a default so the script has no requirements to just work
var searchTemplate = "";
// set loglevel
var loglevel="error"
// This is used for the JSON Markup - I'll probably add a file option 
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
        console.log("\t[--hostport="+hostportlist+"]");
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
        if (s[0] === "--hostport" ){
            hostportlist=s[1];
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
        if (s[0] === "--index"){
            context.index=s[1];
        }
    }
});
// Convert CLI options to an actual regex expression and set the regex output to be displayed
regex = new RegExp( regex,regexflags);
// Load the defaultSearch
if (fs.existsSync(searchFilename)) {
	var searchTemplate = fs.readFileSync(searchFilename,'utf8'); 
	//console.info(searchTemplate);
}else{
	console.error("file does not exist:"+searchFilename);
	process.exit(2);
}
// Open the Elasticsearch Connection
var client = new elasticsearch.Client({
  host: hostportlist,
  protocol: 'http',
  index: context.index,
  keepAlive: true ,
  ignore: [404],
  log: loglevel,
  suggestCompression: true,
  sniffOnStart: true,
  sniffInterval: 60000
});
/**************************************************
**
** Test Connection make sure it is available
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
// Main search
function printOutput(){
  //s.sort(function ( a, b){
//	  a1 = moment(a._source["@timestamp"],"YYYY-MM-DDTHH:mm:ss.SSSZ").format("x");
//	  b1 = moment(b._source["@timestamp"],"YYYY-MM-DDTHH:mm:ss.SSSZ").format("x");
//	  console.log(a1-b1);
//	  return a1-b1;
//	});
	console.info("INFO".yellow+" inPrintOutput length to print="+output.length); 
	while ( output.length > 0 ) {
		hit = output.shift();	
		console.log("===="+hit+" of "+output.length);
		// If allfields cli option is set show all the fields not just one field
		if ( allfields ) {
			console.log(hit._source["@timestamp"].red+":\n".green+JSON.stringify(hit._source));

		}else{
			// If not allfields 
			// If rawoutput is set Pretty Print the json as output
			if (rawoutput) {
				console.log(JSON.stringify(hit,null,2));
			}else{
				//If not rawoutput print <indexed time>: <index>:message
				console.log(hit._source["@timestamp"].red+": ".green+hit._index.green+":".green+hit._source.message)
			}

		}
		// If set process the message field via the regex and print the results
		if ( regex ) {
			var result = hit._source.message.match(regex);
			if ( result  ){
				console.log("\tregex: ".red+JSON.stringify(result).yellow);	
			}
		}
		// Set the time of the last message timestamp retrieved so we don't requery the same message
		context.from = hit._source["@timestamp"];
	  };
}
function doSearch(){
	console.info("Running search".blue);
        if (! searchDone ) {
		console.log("Search Not Complete");
		return;
	}
	// convert the Template to a valid search
	var search = markupjs.up(searchTemplate,context); 
	// Execute the Search
	client.search( JSON.parse(search) , ph = function printHits(error, response) {
	  // Loop over the events
	  if (error != undefined) {
		console.error("ERR:".red+error);
		return;
	  }
	  console.info("INFO".yellow+"Count = "+response.hits.hits.length);
	  response.hits.hits.forEach(function (hit) {
		// If allfields cli option is set show all the fields not just one field
		//console.info("INFO".yellow+"Push Object");
		output.push(hit);
	  });
	  // If the retrieved docements equals the count then we are done
	  printOutput()
	  if ( output.length >= response.hits.total ){ 
		  searchDone=true;
		  console.info("Search complete".blue)
		  return;
	  }
	  // Else query the scroll again to get more documents
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
// set the loop for retrieving files
setInterval ( function () { if(searchDone) { doSearch()}}, refreshInterval );
