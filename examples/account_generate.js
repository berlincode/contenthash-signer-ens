#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env node, es6 */
/* eslint-disable no-console */

var Web3 = require('web3');

var web3 = new Web3();

var newAccount = web3.eth.accounts.create();
var addr = newAccount.address;
var pk = newAccount.privateKey;
console.log(JSON.stringify({address: addr, privateKey: pk}, null, 2));

