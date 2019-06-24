// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3',
      'cids',
      'ethereumjs-util'
    ], function(Web3, Cids, ethUtil){
      // cids seems not to have a valid AMD loader so we use Cids from window namespace
      Cids = window.Cids;
      return factory(
        Web3,
        Cids,
        ethUtil
      );
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3'),
      require('cids'),
      require('ethereumjs-util')
    );
  }else {
    // Global (browser)
    root.ipfsSigner = factory(
      root.Web3,
      root.Cids,
      root.ethereumjsUtil // TODO
    );
  }
}(this, function (Web3, Cids, ethUtil) {

  var web3 = new Web3();
  var storageSystemHexIPFS = 'e301'; // as hex string // TODO 01?

  function versionStringToBn(versionString){
    // accepts only simple version strings like 'v0.1.2' or '0.1.2.3'

    // ignore a leading 'v'
    if (versionString[0] === 'v')
      versionString = versionString.substring(1);

    if (! /^[0-9.]*$/.test(versionString))
      throw 'invalid char in version';

    var fragments = versionString.split('.');
    if (fragments.length > 4)
      throw new Error('too many fragments');

    // pad to 4 fragments
    while(fragments.length < 4)
      fragments.push('0');

    var versionBn = web3.utils.toBN(0);
    var i;
    for (i=0 ; i < fragments.length ; i++){
      var fragmentInt = Number(fragments[i]);
      if (fragmentInt > 0xffff)
        throw 'version fragment > 0xffff';
      versionBn = versionBn.mul(web3.utils.toBN('0x10000'));
      versionBn = versionBn.add(web3.utils.toBN(fragmentInt));
    }
    return versionBn;
  }

  function versionStringToHex(versionString){
    return web3.utils.padLeft('0x' + versionStringToBn(versionString).toString(16), 16);
  }

  function cidStringToCid1HexRaw(cidAsString){
    var cid = new Cids(cidAsString);
    var cid1Hex = cid.toV1().toBaseEncodedString('base16');
    return cid1Hex.substring(1);
  }

  function cidStringToContenthashHex(cidAsString){
    return '0x' + storageSystemHexIPFS + cidStringToCid1HexRaw(cidAsString);
  }

  function updateHash(contenthashHex, versionHex) {
    return web3.utils.soliditySha3(
      {t: 'bytes', v: contenthashHex},
      {t: 'uint64', v: versionHex}
    );
  }

  function signatureDataCreate(web3, account, contenthash, versionHex) {
    // create the hash that will be signed
    var hash = updateHash(
      contenthash,
      versionHex
    );
    var sig = account.sign(hash);
    return({
      contenthash: contenthash,
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
      signatureData.contenthash,
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
    var msg = ethUtil.toBuffer(
      '0x' +
      '19457468657265756d205369676e6564204d6573736167653a0a'+ // '\x19Ethereum Signed Message:\n'
      '3332' + // length = "32"
      hash.replace(/^0x/, '')
    );

    var prefixedMsg = ethUtil.keccak(
      msg
    );


    var r = ethUtil.toBuffer('0x' + signatureData.sig.r.replace(/^0x/, ''));
    var s = ethUtil.toBuffer('0x' + signatureData.sig.s.replace(/^0x/, ''));
    //var v = new Buffer(signatureData.sig.v.replace(/^0x/, ''), 'hex');
    var v = parseInt(signatureData.sig.v);
    var pubKey = ethUtil.ecrecover(prefixedMsg, v, r, s);
    var addrBuf = ethUtil.pubToAddress(pubKey);
    var addr = ethUtil.bufferToHex(addrBuf);
    return addr.replace(/^0x/, '').toLowerCase() === signatureData.address.replace(/^0x/, '').toLowerCase();
  }

  function toCid1(cid){
    return (new Cids(cid)).toV1().toBaseEncodedString('base58btc');
  }

  function contenthashHexToCid(contenthash){
    contenthash = contenthash.replace(/^0x/, '');

    if (contenthash.substring(0,4).toLowerCase() !== storageSystemHexIPFS)
      throw 'first byte of contenthash must be 0x' + storageSystemHexIPFS;

    // remove byte for storage system
    contenthash = contenthash.substr(4);

    var buffer = ethUtil.toBuffer('0x' + contenthash);
    return (new Cids(buffer)).toBaseEncodedString('base58btc');
  }

  return {
    versionStringToBn: versionStringToBn,
    cidStringToCid1HexRaw: cidStringToCid1HexRaw,
    cidStringToContenthashHex: cidStringToContenthashHex,
    updateHash: updateHash,
    versionStringToHex: versionStringToHex,
    signatureDataCreate: signatureDataCreate,
    signatureDataValidate: signatureDataValidate,
    toCid1: toCid1,
    contenthashHexToCid: contenthashHexToCid
  };
}));
