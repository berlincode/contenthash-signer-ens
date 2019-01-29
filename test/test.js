// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const ipfsSigner = require('../js/index.js');
const Web3 = require('web3');
const assert = require('assert');
const ganache = require('ganache-core');
const fs = require('fs');
const bs58 = require('bs58');

var logger = {
  log: function(/*message*/) {
    //console.log(message);
  }
};

var contract_interface = JSON.parse(
  fs.readFileSync(
    'IpfsSigner_sol_IpfsSigner.abi',
    {encoding: 'utf8'}
  )
);
var contract_bytecode = fs.readFileSync(
  'IpfsSigner_sol_IpfsSigner.bin',
  {encoding: 'utf8'}
);

var web3;
var accountSign, accountDefault;

function setup(done){
  web3 = new Web3();
  const options = {
    logger: logger,
    gasPrice: 20000000000,
    gasLimit: 0x47E7C4,
    accounts: [
      {index: 0, balance: 1000 * 1000000000000000000} // 1000 ether
    ]
  };

  web3.setProvider(ganache.provider(options));

  accountSign = web3.eth.accounts.privateKeyToAccount('dc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35');

  web3.eth.getAccounts()
    .then(function(accounts){
      assert.equal(accounts.length, 1);
      accountDefault = accounts[0];
      done();
    });
}

describe('Test contract and signature', function() {
  this.timeout(10*1000);

  // IPFS content identifier
  const cidBase58 = 'QmeT9K2A9hqhtGa2RvXNopE6SD58gfvrhf2TiTHB7osVya';

  // only simple version strings like '0.1.2' or '0.1.2.3' are valid
  const versionString = 'v1.2.3';

  var signatureData;
  var contractInstance;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('Contract create', async function() {
      const contract = new web3.eth.Contract(contract_interface);

      contractInstance = await contract.deploy(
        {
          data: contract_bytecode,
          arguments: [
          ]
        }
      ).send(
        {
          gas: 4000000,
          gasPrice: '30000000000000',
          //value: 0,
          from: accountDefault
        }
      );
      assert.notEqual(contractInstance.options.address, undefined);
    });

    it('Check that no cid is returned from contract', async function() {
      const result = await contractInstance.methods.get(accountSign.address).call();

      assert.equal(result.cid, null);

      const version = Web3.utils.toBN(result.version);
      assert.ok(version.isZero());
    });

    it('Calculate signature data', function() {
      const versionHex = ipfsSigner.versionStringToHex(versionString);
      signatureData = ipfsSigner.signatureDataCreate(web3, accountSign, cidBase58, versionHex);
    });

    it('Validate signature data', function(done) {
      // TODO implement
      //ipfsSigner.signatureDataValidate();
      done();
    });

    it('Update', function() {
      return contractInstance.methods.update(
        signatureData.cidHex,
        signatureData.version,
        signatureData.addr, //accountSign,
        signatureData.sig
      ).send(
        {
          gas: 300000,
          gasPrice: '30000000000000',
          //value: 0,
          from: accountDefault
        }
      );
    });

    it('Get cid from contract', async function() {
      const result = await contractInstance.methods.get(accountSign.address).call();

      assert.notEqual(result.cid, null);

      const cidBn = Web3.utils.toBN(result.cid);
      const version = Web3.utils.toBN(result.version);

      assert.ok(! cidBn.isZero());
      assert.ok(! version.isZero());

      const cid = bs58.encode(Buffer.from(cidBn.toString(16), 'hex'));
      assert.equal(cid, cidBase58);
    });

  });
});
