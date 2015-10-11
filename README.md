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

