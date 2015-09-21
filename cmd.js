#!/usr/bin/env node

'use strict';

var FeedParser = require('feedparser');
var request = require('request');
var posts = [];
var colors = require('colors');
var prompt = require('prompt');
var exec = require('child_process').exec;
var platform = require('os').platform();
var program = require('commander');
var i = 1;

const shellOpenCommand = {
    'win32': 'start ',
    'linux': 'xdg-open ',
    'darwin': 'open '
}[platform];

const rssFeeds = require('./cbcFeeds.json');

function capitalize (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function listOptions () {
    console.log('General:'.green);
    Object.keys(rssFeeds.general).forEach(section => {
        console.log('- ' + section);
    });


    console.log('Sports:'.green);
    Object.keys(rssFeeds.sports).forEach(section => {
        console.log('- ' + section);
    });
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
            else exec(shellOpenCommand + posts[i - 1].link, err => { if (err) throw new Error(err); });
            promptForPost();
        }
    });
}

program.version('0.0.0')
    .option('-c, --category [name]')
    .option('-s, --section [name]')
    .option('-l, --list')
    .option('-h, --help')
    .parse(process.argv);

if (program.list) listOptions();

var section = program.section in rssFeeds ? rssFeeds[program.section] : rssFeeds.general;
var categoryName = program.category;
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
