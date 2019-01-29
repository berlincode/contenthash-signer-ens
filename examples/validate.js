#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/*eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const ipfsSigner = require('../js/index.js');
const Web3 = require('web3');
const minimist = require('minimist');
const fs = require('fs');

var argv = minimist(process.argv.slice(2), {boolean: ['quiet']});

if (argv._.length !== 1){
  console.log('usage:');
  console.log('    validate.js <signature-file>');
  console.log('    --quiet : quiet');
  console.log('');
  console.log('example (bash):');
  console.log('    ./validate.js SIGNATURE');
  process.exit(1);
}

const filename = argv._[0];
const quiet = argv.quiet;

const web3 = new Web3();
const signatureData = JSON.parse(fs.readFileSync(filename, 'utf8'));
const success = ipfsSigner.signatureDataValidate(web3, signatureData);

if (! quiet){
  console.log(success? 'SUCCESS' : 'FAILURE');
}

if (success)
  process.exit(0);

process.exit(1);


console.log(success);

