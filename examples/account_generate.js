#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env node, es6 */
/* eslint-disable no-console */

const Web3 = require('web3');

const web3 = new Web3();

const newAccount = web3.eth.accounts.create();
const addr = newAccount.address;
const pk = newAccount.privateKey;
console.log(JSON.stringify({address: addr, privateKey: pk}, null, 2));

