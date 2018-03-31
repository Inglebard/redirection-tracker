#!/usr/bin/env node

const https = require('https');
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')
const http = require('http');
const url_tools = require('url');
const validUrl = require('valid-url');

const optionDefinitions = [{
    name: 'url',
    alias: 'u',
    type: String,
    multiple: true,
    defaultOption: true
  },
  {
    name: 'timeout',
    alias: 't',
    type: Number,
    defaultValue: 100
  },
  {
    name: 'interval',
    alias: 'i',
    type: Number,
    defaultValue: 100
  },
  {
    name: 'max_bounce',
    alias: 'b',
    type: Number,
    defaultValue: 10
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean
  }
];

const sections = [{
    header: 'Redirection tracker',
    content: 'Use to follow shorted url.'
  },
  {
    header: 'Options',
    optionList: [{
        name: 'url',
        alias: 'u',
        typeLabel: '{underline url}',
        description: 'List of url to analyze.',
        multiple: true,
        defaultOption: true,
      },
      {
        name: 'timeout',
        alias: 't',
        typeLabel: '{underline ms}',
        description: 'Timeout of url request.'
      },
      {
        name: 'interval',
        alias: 'i',
        typeLabel: '{underline ms}',
        description: 'Interval between two http request.'
      },
      {
        name: 'max_bounce',
        alias: 'b',
        typeLabel: '{underline number}',
        description: 'The input to process.'
      },
      {
        name: 'help',
        description: 'Print this usage guide.'
      }
    ]
  }
]
const usage = commandLineUsage(sections);
let command_param = commandLineArgs(optionDefinitions);
if (command_param.help || !command_param.url) {
  console.log(usage);
  process.exit(0);
}

let results = [];
let result_reiceved = 0


function display_result(data) {
  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      console.log("");
      console.log("---------------------------");
      console.log("");
    }
    let data_result = data[i];
    console.log("Url tracked : " + data_result.baseurl);

    for (let j = 0; j < data_result.url_follow.length; j++) {
      let url_followed = data_result.url_follow[j];
      if (url_followed.error) {
        console.log("--> " + url_followed.url + " : " + url_followed.error);
      } else {
        console.log("--> " + url_followed.url + " : " + url_followed.statusCode);
      }
    };
  };
}

function finalResult() {
  result_reiceved++;
  if (result_reiceved >= command_param.url.length) {
    display_result(results);
  }
}

function follow_url(url) {
  return new Promise((resolve, reject) => {
    let urltotest = url;
    const urlparsed = url_tools.parse(urltotest);

    let requester;
    let options = {
      method: 'HEAD',
      timeout: command_param.timeout
    };

    if (urlparsed.protocol == "https:") {
      requester = https;
      options = Object.assign(options, urlparsed);
    } else if (urlparsed.protocol == "http:") {
      requester = http;
      options = Object.assign(options, urlparsed);
    } else {
      return;
    }

    let req = requester.request(options, function(res) {
      return resolve({
        statusCode: res.statusCode,
        location: res.headers.location,
        error: null,
      });
    });

    req.on('error', (e) => {
      return reject(e)
    });
    req.end();
  })
}


function track_url(url, bounce, result) {
  bounce++;
  let resulturl = follow_url(url)
    .then(data => {
      result.url_follow.push({
        statusCode: data.statusCode,
        url: url
      });
      if ((data.statusCode == 301 || data.statusCode == 302) && bounce < command_param.max_bounce) {
        //avoid spam
        setTimeout(function() {
          track_url(data.location, bounce, result);
        }, command_param.interval);
      } else {
        // finish
        if (bounce >= command_param.max_bounce) {
          result.error = true;
          result.message = "Too many bounces";
        }
        finalResult();
      }
    })
    .catch(error => {
      // handle errors
      result.url_follow.push({
        statusCode: null,
        url: url,
        error: error.message
      });
      result.error = true;
      result.message = error.message;
      finalResult();
    })
}

command_param.url.forEach(function(url) {
  if (!validUrl.isUri(url)) {
    console.log(url + ' : Not a valid URI');
    process.exit(1);
  }

  let urlparsed_protocol = url_tools.parse(url).protocol;
  if (urlparsed_protocol != 'http:' && urlparsed_protocol != 'https:') {
    console.log(url + ' : only support HTTP or HTTPS');
    process.exit(1);
  }
});

for (let i = 0; i < command_param.url.length; i++) {
  let url = command_param.url[i];
  let object_result = {
    baseurl: url,
    error: false,
    url_follow: []
  };
  results[i] = object_result;
  track_url(url, 0, results[i]);
};
