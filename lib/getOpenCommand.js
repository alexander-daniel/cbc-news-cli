'use strict';

function getOpenCommand() {
    var platform = require('os').platform;
    var commandList = {
        'win32': 'start ',
        'linux': 'xdg-open ',
        'darwin': 'open '
    };

    return commandList[platform];
}

module.exports = getOpenCommand;
