#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/*eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const contenthashSignerEns = require('../js/index.js');
const Web3 = require('web3');
const minimist = require('minimist');
const readline = require('readline');
const Writable = require('stream').Writable;

var argv = minimist(process.argv.slice(2), {boolean: ['noninteractive']});

if (argv._.length !== 2){
  console.log('usage:');
  console.log('    generate.js <ipfs-cid0-or-cid1> <version-string>');
  console.log('    --noninteractive     : read public key directly from stdin');
  console.log('');
  console.log('The private key needs to be supplied via stdin.');
  console.log('');
  console.log('example (bash):');
  console.log('    ./generate.js --noninteractive "$(ipfs add -r -q --only-hash "$PUBLIC_DIR" 2>/dev/null | tail -1)" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE');
  console.log('example (bash):');
  console.log('    ./generate.js --noninteractive "zdj7WmYPgTE1BKJkysxAfUzgC4f4RGaQDLzZyRzPFfqwFSQ9W" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE');
  process.exit(1);
}

var ipfsCid = argv._[0];
const versionString = argv._[1];
const noninteractive = argv.noninteractive;

var sign = function(privKey){
  const web3 = new Web3();

  var account = web3.eth.accounts.privateKeyToAccount(privKey);

  const versionHex = contenthashSignerEns.versionStringToHex(versionString);
  const contenthashHex = contenthashSignerEns.cidStringToContenthashHex(ipfsCid);
  const signatureData = contenthashSignerEns.signatureDataCreate(web3, account, contenthashHex, versionHex);
  return signatureData;
};


if (noninteractive){

  process.stdin.setEncoding('utf8');

  var inputChunks = [];
  process.stdin.on('data', function(chunk) {
    inputChunks.push(chunk);
  });

  process.stdin.on('end', function() {
    var privKey = inputChunks.join();
    console.log(JSON.stringify(sign(privKey), null, 2));
    process.exit();
  });

} else {

  var mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted)
        process.stdout.write(chunk, encoding);
      callback();
    }
  });

  var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  mutableStdout.muted = true;
  console.log('Enter private key (hex):');
  rl.question('', async function(privKey) {
    console.log(JSON.stringify(sign(privKey), null, 2));
    rl.close();
  });
}
