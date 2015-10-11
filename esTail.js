var elasticsearch = require('elasticsearch');
var markupjs = require('markup-js');
var fs = require('fs');
var colour = require('colour')
var count = 0;
var context = {
	"lastMessage" :"0"
}
var searchDone=true;
var timerDelay=1;
var client = new elasticsearch.Client({
  host: 'localhost:9201',
  keepAlive: true ,
  ignore: [404],
  suggestCompression: true,
//log: "trace"
//log: "debug"
});
client.ping({
  requestTimeout: 3000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } 
});

/********************************************************************************

*********************************************************************************/
function doSearch(){

	var searchtemplate = fs.readFileSync('default.search', 'utf8')
	var search = markupjs.up(searchtemplate,context); 
	client.search( JSON.parse(search) , ph = function printHits(error, response) {
	  response.hits.hits.forEach(function (hit) {
		console.log(hit._source["@timestamp"].red+": ".green+hit._source.message)
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
setInterval ( function () { if(searchDone) { doSearch()}}, 1000 );
