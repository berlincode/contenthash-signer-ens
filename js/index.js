// vim: sts=2:ts=2:sw=2
/* eslint-env mocha, es6 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3'
      //'ethereumjs-util'), // TODO
      //'bs58' // TODO
    ], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3'),
      require('ethereumjs-util'),
      require('bs58')
    );
  }else {
    // Global (browser)
    root.ipfsSigner = factory(
      root.Web3
      //root.ethereumjs-util'), // TODO
      //root.xxx // TODO
    );
  }
}(this, function (Web3, ethUtils, bs58) {
  var web3_utils = Web3.utils;

  function versionStringToBn(versionString){
    // accepts only simple version strings like 'v0.1.2' or '0.1.2.3'

    // ignore a leading 'v'
    if (versionString[0] === 'v')
      versionString = versionString.substring(1);

    var fragments = versionString.split('.');
    if (fragments.length > 4)
      throw new Error('too many fragments');

    // pad to 4 fragments
    while(fragments.length < 4)
      fragments.push('0');

    var versionBn = web3_utils.toBN(0);
    var i;
    for (i=0 ; i < fragments.length ; i++){
      // TODO validate >=0 and < 0xffff
      versionBn = versionBn.mul(web3_utils.toBN('0x10000'));
      versionBn = versionBn.add(web3_utils.toBN(Number(fragments[i])));
    }
    return versionBn;
  }

  function versionStringToHex(versionString){
    return web3_utils.padLeft('0x' + versionStringToBn(versionString).toString(16), 64);
  }

  function bnToBase58(bn){
    return bs58.encode(Buffer.from(bn.toString(16), 'hex'));
  }

  function hexFromBase58(dataBase58){
    return '0x' + bs58.decode(dataBase58).toString('hex');
  }


  function updateHash(cidHex, versionHex) {
    return web3_utils.soliditySha3(
      {t: 'bytes', v: cidHex},
      {t: 'bytes32', v: versionHex}
    );
  }

  function signatureDataCreate(web3, account, cidBase58, versionHex) {
    // create the hash that will be signed
    var hash = updateHash(
      hexFromBase58(cidBase58),
      versionHex
    );
    var sig = account.sign(hash);
    return({
      cid: cidBase58,
      version: versionHex,
      address: account.address,
      sig: {
        v: sig.v,
        r: sig.r,
        s: sig.s
      }
    });
  }

  function signatureDataValidate(web3, signatureData){
    var hash = updateHash(
      hexFromBase58(signatureData.cid),
      signatureData.version
    );

    /*
    var signature = (
      '0x' +
      signatureData.sig.r.replace(/^0x/, '') +
      signatureData.sig.s.replace(/^0x/, '') +
      signatureData.sig.v.replace(/^0x/, '')
    );
    console.log('signature', signature);
    console.log('hash', hash);
    return web3.eth.personal.ecRecover(hash, signature);
    */
    var msg = Buffer.from(hash.replace(/^0x/, ''), 'hex');
    const prefix = Buffer.from('\x19Ethereum Signed Message:\n');

    const prefixedMsg = ethUtils.keccak(
      Buffer.concat([prefix, Buffer.from(String(msg.length)), msg])
    );


    var r = Buffer.from(signatureData.sig.r.replace(/^0x/, ''), 'hex');
    var s = Buffer.from(signatureData.sig.s.replace(/^0x/, ''), 'hex');
    //var v = new Buffer(signatureData.sig.v.replace(/^0x/, ''), 'hex');
    var v = parseInt(signatureData.sig.v);
    var pubKey = ethUtils.ecrecover(prefixedMsg, v, r, s);
    var addrBuf = ethUtils.pubToAddress(pubKey);
    var addr = ethUtils.bufferToHex(addrBuf);
    return addr.replace(/^0x/, '').toLowerCase() === signatureData.address.replace(/^0x/, '').toLowerCase();
  }

  return {
    versionStringToBn: versionStringToBn,
    bnToBase58: bnToBase58,
    hexFromBase58: hexFromBase58,
    updateHash: updateHash,
    versionStringToHex: versionStringToHex,
    signatureDataCreate: signatureDataCreate,
    signatureDataValidate: signatureDataValidate
  };
}));
