#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/*eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const ipfsSigner = require('../js/index.js');
const Web3 = require('web3');
const minimist = require('minimist');
const readline = require('readline');
const Writable = require('stream').Writable;

var argv = minimist(process.argv.slice(2), {boolean: ['quiet']});

if (argv._.length !== 2){
  console.log('usage:');
  console.log('    generate.js <ipfs-cid0-or-cid1> <version-string>');
  console.log('    --quiet : quiet');
  console.log('');
  console.log('The private key needs to be supplied via stdin.');
  console.log('');
  console.log('example (bash):');
  console.log('    ./generate.js --quiet "$(ipfs add -r -q --only-hash "$PUBLIC_DIR" 2>/dev/null | tail -1)" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE');
  console.log('example (bash):');
  console.log('    ./generate.js --quiet "zdj7WmYPgTE1BKJkysxAfUzgC4f4RGaQDLzZyRzPFfqwFSQ9W" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE');
  process.exit(1);
}

const ipfsCid = argv._[0];
const versionString = argv._[1];
const quiet = argv.quiet;

var mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted)
      process.stdout.write(chunk, encoding);
    callback();
  }
});

mutableStdout.muted = false;

var rl = readline.createInterface({
  input: process.stdin,
  output: mutableStdout,
  terminal: true
});

mutableStdout.muted = true;
rl.question(quiet? '' : 'Enter private key (hex): ', async function(privKey) {
  const web3 = new Web3();

  var account = web3.eth.accounts.privateKeyToAccount(privKey);

  const versionHex = ipfsSigner.versionStringToHex(versionString);
  const signatureData = ipfsSigner.signatureDataCreate(web3, account, ipfsCid, versionHex);

  console.log(JSON.stringify(signatureData));

  rl.close();
});
