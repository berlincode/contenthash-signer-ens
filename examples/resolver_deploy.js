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

const contractInterface = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'ENSResolver_sol_ResolverContenthashSignerENS.abi'),
    {encoding: 'utf8'}
  )
);

const contractBytecode = fs.readFileSync(
  path.join(__dirname, '..', 'ENSResolver_sol_ResolverContenthashSignerENS.bin'),
  {encoding: 'utf8'}
);

var argv = minimist(process.argv.slice(2), {
  string: ['registry'],
  boolean: ['noninteractive']
});

if ((argv._.length !== 1) || (!argv.registry)){
  console.log('usage:');
  console.log('    deploy_resolver.js <geth-provider> --registry=<registry-addr>');
  console.log('');
  console.log('example (bash):');
  console.log('    ./deploy_resolver.js https://mainnet.infura.io/<your-token> --registry=0x314159265dd8dbb310642f98f50c066173c1259b --noninteractive <<< 0x88779b7111e6e83ecc8fdb173f017262eff4180e61967ac2b12c4bcf6d9df1a1');
  process.exit(1);
}

const provider = argv._[0];
const registryAddr = argv.registry;
const noninteractive = argv.noninteractive;

const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const contract = new web3.eth.Contract(contractInterface);


async function deploy(privateKey){
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const contractInstanceResolver = await contract.deploy(
    {
      data: '0x' + contractBytecode,
      arguments: [
        registryAddr
      ]
    }
  )
    .send(
      {
        gas: 4000000,
        gasPrice: 10000000000, // TODO
        from: account.address
      }
    );

  return contractInstanceResolver;
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
    return deploy(privateKey);
  })
  .then(function(contractInstanceResolver){
    const addr = contractInstanceResolver.options.address;
    console.log('deployed contract address:', addr);
    process.exit();
  })
  .catch(function(err){
    console.error('Error', err);
    process.exit(1);
  });


