Contenthash-Signer-ENS
======================

[![Version](https://img.shields.io/github/v/tag/berlincode/contenthash-signer-ens.svg?label=version&sort=semver&logo=github)](https://github.com/berlincode/contenthash-signer-ens)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/berlincode/contenthash-signer-ens/blob/master/LICENSE)
[![Travis CI](https://travis-ci.org/berlincode/contenthash-signer-ens.svg?branch=master&style=flat)](https://travis-ci.org/berlincode/contenthash-signer-ens)

**Sign ipfs CID hashes and content version (in an ethereum compatible way)**

This tool is an easy way to sign a distribution of files (e.g. a web page or a distributed app). It's intended to
be used with ipfs CIDs, so that you can directly access the signed content on any IPFS gateway.

Check out our [online example](https://berlincode.github.io/contenthash-signer-ens/sign_validate.html).

Additionally there is a solidity resolver contract which works directly with the signatures created by contenthash-signer-ens.
The contract can be updated by anybody with a valid signature. It stores only the most recent ipfs cid (based on the
signed version number).

Example usage:

1. Checkout the repo and cd into the repo.
2. Run
```bash
npm install
```
3. Create a signature of the js/ directory along with the version 'v1.2.3':¹
```bash
./examples/generate.js ----noninteractive "$(ipfs add -r -q --only-hash js" 2>/dev/null | tail -1)" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE
```
3. optionally validate the just create signature:
```bash
./examples/validate.js SIGNATURE
```


¹) you need to have the 'ipfs' command line tool installed



The resolver is currently deployed at:
 * ropsten: 0xc42fb86610be1f03b366251353cb41475cfeab11

Public repository
-----------------

[https://github.com/berlincode/contenthash-signer-ens](https://github.com/berlincode/contenthash-signer-ens)

Copyright and license
---------------------

Code and documentation copyright Ulf Bartel. Code is licensed under the
[MIT license](./LICENSE).


