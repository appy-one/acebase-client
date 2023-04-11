const { AceBase } = require('acebase');
const { AceBaseClient } = require('../../dist/cjs');
const { run } = require('./run');

run('CommonJS', AceBaseClient, AceBase);
