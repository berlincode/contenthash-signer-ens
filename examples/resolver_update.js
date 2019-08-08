#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/*eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const Web3 = require('web3');
const minimist = require('minimist');
const readline = require('readline');
const Writable = require('stream').Writable;
const fs = require('fs');
const path = require('path');
const namehash = require('eth-ens-namehash');

const contractInterface = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'ENSResolver_sol_ResolverContenthashSignerENS.abi'),
    {encoding: 'utf8'}
  )
);

var argv = minimist(process.argv.slice(2), {
  string: ['resolver', 'signaturefile'],
  boolean: ['noninteractive']
});

if (argv._.length !== 1){
  console.log('usage:');
  console.log('    update_resolver.js <geth-provider> --resolver=<resolver-addr> --signaturefile=<json-signature-file>');
  console.log('');
  console.log('example (bash):');
  console.log('    ./update_resolver.js https://mainnet.infura.io/<your-token> --resolver=0x... --signaturefile=SIGNATURE.json --noninteractive <<< 0x88779b7111e6e83ecc8fdb173f017262eff4180e61967ac2b12c4bcf6d9df1a1');
  process.exit(1);
}

const provider = argv._[0];
const resolverAddr = argv.resolver;
const signaturefile = argv.signaturefile;
const noninteractive = argv.noninteractive;

const node = namehash.hash('dummy.eth'); // node is ignored by contract

const signatureData = JSON.parse(
  fs.readFileSync(
    signaturefile,
    {encoding: 'utf8'}
  )
);


const web3 = new Web3(provider);
const contractInstanceResolver = new web3.eth.Contract(contractInterface, resolverAddr);

async function updateContenthash(privateKey){
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  if (signatureData.contenthash == await contractInstanceResolver.methods.contenthash(node).call()){
    // nothing to to
    return;
  }

  await contractInstanceResolver.methods.setContenthashBySignature(
    signatureData.contenthash,
    signatureData.version,
    signatureData.sig
  )
    .send(
      {
        gas: 1000000,
        gasPrice: 10000000000, // TODO
        from: account.address
      }
    );
  return;
}

function getPrivateKeyStdin(noninteractive){
  return new Promise(
    function (resolve, reject){
      function checkPrivateKey(privateKey){
        if ((privateKey.length !== 66) || (privateKey.substr(0,2) !== '0x')){
          reject('privateKey must start with "0x" and must have a length of 66');
        } else {
          resolve(privateKey);
        }
      }

      if (noninteractive){

        process.stdin.setEncoding('utf8');

        var inputChunks = [];
        process.stdin.on('data', function(chunk) {
          inputChunks.push(chunk);
        });

        process.stdin.on('end', function() {
          checkPrivateKey(inputChunks.join().replace('\n', '').replace('\n', ''));
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
        rl.question('', async function(privateKey) {
          rl.close();
          checkPrivateKey(privateKey);
        });
      }
    }
  );
}

getPrivateKeyStdin(noninteractive)
  .then(function(privateKey){
    return updateContenthash(privateKey);
  })
  .then(function(){
    console.log('Success.');
    process.exit();
  })
  .catch(function(err){
    console.error('Error', err);
    process.exit(1);
  });
