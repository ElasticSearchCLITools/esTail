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
var allfieldse;
var regexflags="gm";
/**************************************************
**
** Varables
**
***************************************************/
var count = 0;
var searchDone=true;
var timerDelay=1;
var url="localhost:9200"
var searchFilename="default.search"
var searchTemplate = fs.readFileSync('default.search', 'utf8')
var context = {
    index:"_all",
    lastMessage:"now-1s"
}
/**************************************************
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
    if(/(-h|--help|-\?)/.test(val) ){
        console.log(process.argv[0]+":");
        console.log("\t[--url="+url+"]");
        console.log("\t[--search=<filename> default: "+searchFilename);
        console.log("\t[--index=<index>     default: "+context.index);
        console.log("\t[--regex='([\d\.]+)' default: none");
        console.log("\t[--regexflags='gm'   default: "+regexflags);
        console.log("\t[--allfields         default: false ");
        process.exit(1)
    }
    if (val === "--allfields" ){
	    console.info("allfields=true");
	    allfields = 1;
    }
    if(val.indexOf('=') >0){
        var s = val.split(/=/);
        if(s.length !== 2 ){
            console.info("Problem with arg no '=' found :"+val);
            process.exit(1);
        }
        console.info(s[0] + ' : ' + s[1]); 
        if (s[0] === "--url" ){
            url=s[1];
        }
        if (s[0] === "--index" ){
            context.index=s[1]
	    console.info("index="+context.index);
        }
        if (s[0] === "--search"){
            searchFilename=s[1];
        }
	if (s[0] === "--regexflags" ){
	    regexflags =  s[1];
	}
	if (s[0] === "--regex" ){
	    regex = s[1];
	}
    }
});
regex = new RegExp( regex,regexflags);

if (fs.existsSync(searchFilename)) {
	var searchTemplate = fs.readFileSync(searchFilename,'utf8'); 
	//console.info(searchTemplate);
}else{
	console.log("file does not exist:"+searchFilename);
	process.exit(2);
}
var client = new elasticsearch.Client({
  host: url,
  index: context.index,
  keepAlive: true ,
  ignore: [404],
  suggestCompression: true,
//log: "trace"
//log: "debug"
});
/**************************************************
**
** Test Connection
**
***************************************************/
client.ping({
  requestTimeout: 3000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster maybe down!');
    process.exit(1);
  } 
});

/********************************************************************************
**
** Functions
**
*********************************************************************************/
function doSearch(){
	//console.log(context);
	var search = markupjs.up(searchTemplate,context); 
        //console.info(search);
	client.search( JSON.parse(search) , ph = function printHits(error, response) {
	  response.hits.hits.forEach(function (hit) {
		console.log(hit._source["@timestamp"].red+":".green+hit._index.green+":".green+hit._source.message)
		if ( regex ) {
			var result = hit._source.message.match(regex);
			if ( result  ){
				console.log("\tregex: ".red+JSON.stringify(result).yellow);	
			}
		}
		if ( allfields ) {
			console.log("\tallfields: ".red+JSON.stringify(hit._source).yellow);
		}


		context.lastMessage = hit._source["@timestamp"];
		count++;
	  });
	  if ( count >= response.hits.total ){ 
		  count=0;
		  searchDone=true;
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


setInterval ( function () { if(searchDone) { doSearch()}}, 1000 );
