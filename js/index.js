// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3',
      'bs58' // TODO
    ], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3'),
      require('bs58')
    );
  }else {
    // Global (browser)
    root.ipfsSigner = factory(
      root.Web3, // we expect that the whole Web3 was loaded an use only the utils from it
      root.xxx // TODO
    );
  }
}(this, function (Web3, bs58) {
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

  function updateHash(cidHex, versionHex) {
    return web3_utils.soliditySha3(
      {t: 'bytes', v: cidHex},
      {t: 'bytes32', v: versionHex}
    );
  }

  function signatureDataCreate(web3, account, cidBase58, versionHex) {
    // convert cid to hex
    var cidHex = '0x' + bs58.decode(cidBase58).toString('hex');
    // create the hash that will be signed
    var hash = updateHash(
      cidHex,
      versionHex
    );
    var sig = account.sign(hash);
    return({
      // cid stored redundant
      cidHex: cidHex,
      cidBase58: cidBase58,

      version: versionHex,
      addr: account.address,
      sig: {
        v: sig.v,
        r: sig.r,
        s: sig.s
      }
    });
  }

  function signatureDataValidate(){
    // TODO
  }

  return {
    versionStringToBn: versionStringToBn,
    updateHash: updateHash,
    versionStringToHex: versionStringToHex,
    signatureDataCreate: signatureDataCreate,
    signatureDataValidate: signatureDataValidate,
  };
}));
