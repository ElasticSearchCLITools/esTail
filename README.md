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


