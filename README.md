IPFS-Signer
===========

[![Travis CI](https://travis-ci.org/berlincode/ipfs-signer.svg?branch=master&style=flat)](https://travis-ci.org/berlincode/ipfs-signer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/berlincode/ipfs-signer/blob/master/LICENSE)

**Sign ipfs CID hashes and content version (in an ethereum compatible way)**

This tool is an easy way to sign a distribution of files (e.g. a web page or a distributed app). It's intended to
be used with ipfs CIDs, so that you can directly access the signed content on any IPFS gateway.

Check out our [online example](https://berlincode.github.io/ipfs-signer/sign_validate.html).

Additionally there is a solidity resolver contract which works directly with the signatures created by ipfs-signer.
The contract can be updated by anybody with a valid signature and stored only the most recent ipfs cid (based on the
signed version number).

Example usage:

1. Checkout the repo and cd into the repo.
2. Run
```bash
npm install
```
3. Create a signature of the js/ directory along with the version 'v1.2.3':¹
```bash
./examples/generate.js --forceCid1 --quiet "$(ipfs add -r -q --only-hash js" 2>/dev/null | tail -1)" v1.2.3 <<< "0xdc68bd96144c2963602d86b054ad67fd62d488edd78fecf44aa8d8cd90d59f35" > SIGNATURE
```
3. optionally validate the just create signature:
```bash
./examples/validate.js SIGNATURE
```


¹) you need to have the 'ipfs' command line tool installed



Public repository
-----------------

[https://github.com/berlincode/ipfs-signer](https://github.com/berlincode/ipfs-signer)

Copyright and license
---------------------

Code and documentation copyright Ulf Bartel. Code is licensed under the
[MIT license](./LICENSE).


