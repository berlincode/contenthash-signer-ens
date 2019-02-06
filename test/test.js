// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const ipfsSigner = require('../js/index.js');
const Web3 = require('web3');
const assert = require('assert');
const ganache = require('ganache-core');
const fs = require('fs');
const namehash = require('eth-ens-namehash');
const sha3 = require('web3-utils').sha3;

var logger = {
  log: function(/*message*/) {
    //console.log(message);
  }
};

const contractInterface = JSON.parse(
  fs.readFileSync(
    'IpfsSigner_sol_IpfsCidRegistry.abi',
    {encoding: 'utf8'}
  )
);
const contractBytecode = fs.readFileSync(
  'IpfsSigner_sol_IpfsCidRegistry.bin',
  {encoding: 'utf8'}
);

const contractInterfaceRegistry = JSON.parse(
  fs.readFileSync(
    'test/contracts/ENSRegistry_sol_ENSRegistry.abi',
    {encoding: 'utf8'}
  )
);
const contractBytecodeRegistry = fs.readFileSync(
  'test/contracts/ENSRegistry_sol_ENSRegistry.bin',
  {encoding: 'utf8'}
);

const nodeDefault = namehash.hash('eth');
const nodeBySignature = namehash.hash('ethsig');

var web3;
var accountSign, accountDefault;


function setup(done){
  const options = {
    logger: logger,
    gasPrice: 20000000000,
    gasLimit: 0x47E7C4,
    accounts: [
      {index: 0, balance: 1000 * 1000000000000000000} // 1000 ether
    ]
  };

  //const provider = ganache.provider(options);
  //web3 = new Web3(provider);

  web3 = new Web3();
  const provider = ganache.provider(options);
  web3.setProvider(provider);

  accountSign = web3.eth.accounts.privateKeyToAccount('0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35');

  web3.eth.getAccounts()
    .then(function(accounts){
      assert.equal(accounts.length, 1);
      accountDefault = accounts[0];
      done();
    });
}

describe('Test contract and signature', function() {
  this.timeout(10*1000);

  // IPFS content identifier (base56 encoded)
  //const cid0String = 'QmeT9K2A9hqhtGa2RvXNopE6SD58gfvrhf2TiTHB7osVya';
  const cid1String = 'zdj7WmYPgTE1BKJkysxAfUzgC4f4RGaQDLzZyRzPFfqwFSQ9W';

  // only simple version strings like '0.1.2' or '0.1.2.3' are valid
  const versionString = 'v1.2.3';

  var signatureData;
  var contractInstanceResolver;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('Contract create', async function() {
      // first deploy the default ens registry contract
      const contractRegistry = new web3.eth.Contract(contractInterfaceRegistry);
      const contractInstanceRegistry = await contractRegistry.deploy(
        {
          data: contractBytecodeRegistry,
          arguments: [
          ]
        }
      ).send(
        {
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        }
      );
      assert.notEqual(contractInstanceRegistry.options.address, undefined);

      
      // now deploy our resolver contract
      const contract = new web3.eth.Contract(contractInterface);
      contractInstanceResolver = await contract.deploy(
        {
          data: contractBytecode,
          arguments: [
            contractInstanceRegistry.options.address
          ]
        }
      )
        .send(
          {
            gas: 4000000,
            gasPrice: '30000000000000',
            from: accountDefault
          }
        );
      assert.notEqual(contractInstanceResolver.options.address, undefined);

      await contractInstanceRegistry.methods.setSubnodeOwner('0x0', sha3('eth'), accountDefault)
        .send({
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        });

      await contractInstanceRegistry.methods.setSubnodeOwner('0x0', sha3('ethsig'), accountSign.address)
        .send({
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        });
    });

    it('Check that no contenthash is returned from contract', async function() {
      const result = await contractInstanceResolver.methods.contenthash(nodeBySignature).call();

      assert.equal(result, null);

      //const version = Web3.utils.toBN(result.version);
      //assert.ok(version.isZero());
    });

    it('Create signature data (calculate and sign)', function() {
      const versionHex = ipfsSigner.versionStringToHex(versionString);
      const contenthashHex = ipfsSigner.cidStringToContenthashHex(cid1String);
      signatureData = ipfsSigner.signatureDataCreate(web3, accountSign, contenthashHex, versionHex);
    });

    it('Validate signature data', function() {
      var success = ipfsSigner.signatureDataValidate(web3, signatureData);
      assert.ok(success);
    });

    it('Set contenthash by signature in contract', function() {
      return contractInstanceResolver.methods.setContenthashBySignature(
        nodeBySignature, 
        signatureData.contenthash,
        signatureData.version,
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

    it('Get contenthash from contract', async function() {
      const result = await contractInstanceResolver.methods.contenthash(nodeBySignature).call();

      assert.notEqual(result, null);

      const contenthashBn = Web3.utils.toBN(result);
      //const version = Web3.utils.toBN(result.version);

      assert.ok(! contenthashBn.isZero());
      //assert.ok(! version.isZero());

      assert.equal(ipfsSigner.contenthashHexToCid(result), cid1String);
    });

  });

  describe('supportsInterface function', async () => {

    it('supports known interfaces', async () => {
      assert.equal(await contractInstanceResolver.methods.supportsInterface('0xbc1c58d1').call(), true);
    });

    it('does not support a random interface', async () => {
      assert.equal(await contractInstanceResolver.methods.supportsInterface('0x3b3b57df').call(), false);
    });
  });


  describe('contenthash', async () => {

    it('permits setting contenthash by owner', async () => {
      await contractInstanceResolver.methods.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001')
        .send({
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        });
      assert.equal(await contractInstanceResolver.methods.contenthash(nodeDefault).call(), '0x0000000000000000000000000000000000000000000000000000000000000001');
    });

    it('can overwrite previously set contenthash', async () => {
      await contractInstanceResolver.methods.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001')
        .send({
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        });
      assert.equal(await contractInstanceResolver.methods.contenthash(nodeDefault).call(), '0x0000000000000000000000000000000000000000000000000000000000000001');

      await contractInstanceResolver.methods.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000002')
        .send({
          gas: 4000000,
          gasPrice: '30000000000000',
          from: accountDefault
        });

      assert.equal(await contractInstanceResolver.methods.contenthash(nodeDefault).call(), '0x0000000000000000000000000000000000000000000000000000000000000002');
    });

    /*
    it('can overwrite to same contenthash', async () => {
      await contractInstanceResolver.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001', {from: accounts[0]});
      assert.equal(await contractInstanceResolver.contenthash(nodeDefault), '0x0000000000000000000000000000000000000000000000000000000000000001');

      await contractInstanceResolver.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000002', {from: accounts[0]});
      assert.equal(await contractInstanceResolver.contenthash(nodeDefault), '0x0000000000000000000000000000000000000000000000000000000000000002');
    });

    it('forbids setting contenthash by non-owners', async () => {
      try {
          await contractInstanceResolver.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001', {from: accounts[1]});
      } catch (error) {
          return utils.ensureException(error);
      }

      assert.fail('setting did not fail');
    });

    it('forbids writing same contenthash by non-owners', async () => {
      await contractInstanceResolver.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001', {from: accounts[0]});

      try {
          await contractInstanceResolver.setContenthash(nodeDefault, '0x0000000000000000000000000000000000000000000000000000000000000001', {from: accounts[1]});
      } catch (error) {
          return utils.ensureException(error);
      }

      assert.fail('setting did not fail');
    });
    */

    it('returns empty when fetching nonexistent contenthash', async () => {
      assert.equal(
        await contractInstanceResolver.methods.contenthash(namehash.hash('unknown')).call(),
        null
      );
    });
  });
});
