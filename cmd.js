#!/usr/bin/env node

'use strict';

var FeedParser = require('feedparser');
var request = require('request');
var colors = require('colors');
var prompt = require('prompt');
var exec = require('child_process').exec;
var platform = require('os').platform();
var program = require('commander');
var capitalize = require('./lib/capitalize');
var openBrowserCmd = require('./lib/getOpenCommand')();

var i = 1;
var posts = [];

const rssFeeds = require('./lib/cbcFeeds.json');

function listOptions () {

    ['General', 'Sports'].forEach(sectionName => {
        console.log(sectionName.green);

        var sectionKeys = Object.keys(rssFeeds[sectionName.toLowerCase()]);

        sectionKeys.forEach(sectionKey => {
            console.log('- ' + sectionKey);
        });
    });

    console.log('\nExample command: $ cbc -s general -c politics'.green);

    process.exit(0);
}

function promptForPost() {
    prompt.message = prompt.delimiter = '';
    prompt.start();

    var schema = {
        properties: {
            post: {
                message: 'Type post number to open, or 0 to quit'.yellow,
                required: true
            }
        }
    };

    prompt.get(schema, (err, result) => {
        if (result.post !== '0') {
            var i = parseInt(result.post, 10);

            if(isNaN(i) || i > posts.length || i < 1) console.log('Invalid post number');
            else exec(openBrowserCmd + posts[i - 1].link, err => { if (err) throw new Error(err); });
            promptForPost();
        }
    });
}

function scrapeRSS() {
    if (!program.section) program.section = 'general';
    var section = program.section in rssFeeds ? rssFeeds[program.section] : rssFeeds.general;
    var categoryName = program.category ? program.category : 'topstories';
    var feedName = categoryName in section ? section[categoryName] : rssFeeds.general.topstories;

    var feedStream = request(feedName).pipe(new FeedParser());
    var title = 'CBC News - ' + capitalize(program.section) + ' - ' + capitalize(categoryName);
    console.log(title.toString().green);

    feedStream.on('error', error => console.log('An error occured', error));

    feedStream.on('readable', function () {
        var stream = this, item;
        if (i < 29) {
            while (item = stream.read()) {
                posts.push(item);
                console.log(i.toString().red + '. ' + item.title);
                i++;
            }
        }
    });

    feedStream.on('finish', promptForPost);
}

program.version('0.0.0')
    .option('-c, --category [name]')
    .option('-s, --section [name]')
    .option('-l, --list')
    .parse(process.argv);

if (program.list) listOptions();
else scrapeRSS();
