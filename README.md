# redirection-tracker
A script to follow 300 and 301 redirections.

### How to use it ?
```
npm install
node app.js --help
```
```
Redirection tracker

  Use to follow shorted url.

Options

  -u, --url url             List of url to analyze.            
  -t, --timeout ms          Timeout of url request.            
  -i, --interval ms         Interval between two http request.
  -b, --max_bounce number   The input to process.              
  --help
```

Example of result :

```
node app.js http://bit.ly/2IPAbhX https://bit.ly/2IPAbhX
```
```
Url tracked : http://bit.ly/2IPAbhX
--> http://bit.ly/2IPAbhX : 301
--> https://devdocs.io/node/http#http_http_request_options_callback : 200

---------------------------

Url tracked : https://bit.ly/2IPAbhX
--> https://bit.ly/2IPAbhX : 301
--> https://devdocs.io/node/http#http_http_request_options_callback : 200

```
