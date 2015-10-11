# esTail
ElasticSearch CLI Tail - This application simulate the tail command against a index which has a @timestamp

Install
```
git clone <repo>
npm install 
node ./esTail.js --index=std\* 
```

And you will see something like

```
2015-10-11T03:12:16.588Z:std-2015.10.11:dd
2015-10-11T03:12:16.996Z:std-2015.10.11:
2015-10-11T03:12:17.155Z:std-2015.10.11:
2015-10-11T03:12:22.611Z:std-2015.10.11:test

```
<Indexed Timestamp>:<index>:<message>


```
# node ./esTail.js --help
node:
	[--url=localhost:9200]
	[--search=<filename> default: default.search
	[--regex='([d.]+)' default: none
	[--regexflags='gm'   default: gm
	[--allfields         default: false 
	[--raw         	    default: false 
	[--fetchsize='20'  default: 100 
	[-i|--refreshInterval='1000'  default: 1000
			How often a new search is issued
	[--context='{ 'custom':'json'}'  default:{"index":"_all","from":"now-10m","fetchsize":100}
			Context is what varables pass to the search template for json markup
			context=<key>=<val> is a way to set any varable inside the context array. Make sure this is used after --contextfile or --context=<customejson>
	[--index=<index>|--context=index=<index>     default: _all
	[--from=<datestamp>|--context=from='now-5m'  default: now-10m
			from can be of any valid Elasticsearch timevalue or Caclulation 
```

Complex Example
```
$ node ./esTail.js --index=std\* --regex='([\d\.]+)' --regexflags="gm" --url=localhost:9201 --from='now-24h' --context='{"index":"std*","from":"now-1h","fetchsize":200}' -i=1000 --context=fetchsize=12
Connected to Elasticsearch cluster.
2015-10-11T16:05:50.073Z: std-2015.10.11:Sun Oct 11 12:05:50 EDT 2015
	regex: ["11","12","05","50","2015"]
2015-10-11T16:07:50.081Z: std-2015.10.11:Sun Oct 11 12:07:50 EDT 2015
	regex: ["11","12","07","50","2015"]
2015-10-11T16:08:50.089Z: std-2015.10.11:Sun Oct 11 12:08:50 EDT 2015
	regex: ["11","12","08","50","2015"]
2015-10-11T16:09:50.091Z: std-2015.10.11:Sun Oct 11 12:09:50 EDT 2015
	regex: ["11","12","09","50","2015"]
2015-10-11T16:10:50.095Z: std-2015.10.11:Sun Oct 11 12:10:50 EDT 2015
	regex: ["11","12","10","50","2015"]
2015-10-11T16:11:50.100Z: std-2015.10.11:Sun Oct 11 12:11:50 EDT 2015
	regex: ["11","12","11","50","2015"]
2015-10-11T16:14:50.111Z: std-2015.10.11:Sun Oct 11 12:14:50 EDT 2015
	regex: ["11","12","14","50","2015"]
2015-10-11T16:17:50.125Z: std-2015.10.11:Sun Oct 11 12:17:50 EDT 2015
	regex: ["11","12","17","50","2015"]
2015-10-11T16:20:50.137Z: std-2015.10.11:Sun Oct 11 12:20:50 EDT 2015
	regex: ["11","12","20","50","2015"]
2015-10-11T16:06:50.076Z: std-2015.10.11:Sun Oct 11 12:06:50 EDT 2015
	regex: ["11","12","06","50","2015"]
2015-10-11T16:12:50.104Z: std-2015.10.11:Sun Oct 11 12:12:50 EDT 2015
	regex: ["11","12","12","50","2015"]
2015-10-11T16:13:50.107Z: std-2015.10.11:Sun Oct 11 12:13:50 EDT 2015
	regex: ["11","12","13","50","2015"]
2015-10-11T16:15:50.117Z: std-2015.10.11:Sun Oct 11 12:15:50 EDT 2015
	regex: ["11","12","15","50","2015"]
2015-10-11T16:16:50.121Z: std-2015.10.11:Sun Oct 11 12:16:50 EDT 2015
	regex: ["11","12","16","50","2015"]
2015-10-11T16:18:50.129Z: std-2015.10.11:Sun Oct 11 12:18:50 EDT 2015
	regex: ["11","12","18","50","2015"]
2015-10-11T16:19:50.133Z: std-2015.10.11:Sun Oct 11 12:19:50 EDT 2015
	regex: ["11","12","19","50","2015"]
2015-10-11T16:21:50.142Z: std-2015.10.11:Sun Oct 11 12:21:50 EDT 2015
	regex: ["11","12","21","50","2015"]
```
