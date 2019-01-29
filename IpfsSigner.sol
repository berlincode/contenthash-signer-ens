/*
 Ipfs Signer Registry


 Copyright (c) Ulf Bartel

 Public repository:
 https://github.com/berlincode/ipfs-signer

 License: MIT

 Contact:
 elastic.code@gmail.com

 Version 0.3.0
*/

pragma solidity 0.5.3;
pragma experimental ABIEncoderV2;


contract IpfsCidRegistry {

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // remembed last cid and version for each addr
    mapping(address => bytes) internal addrToCid;
    mapping(address => uint256) internal addrToVersion;

    /* This is the constructor */
    constructor (
    ) public
    {
    }

    function update (
        bytes memory cid,
        uint256 version,
        address addr,
        Signature memory signature
    ) public
    {
        if (
            verify(
                keccak256(
                    abi.encodePacked(
                        cid,
                        version
                    )
                ),
                signature
            ) != addr
        ){
            return;
        }

        // update only if new version is higher than current version
        if (version > addrToVersion[addr]) {
            addrToCid[addr] = cid;
            addrToVersion[addr] = version;
        }
    }

    function get (
        address addr
    )
        public
        view
        returns (bytes memory cid, uint256 version)
    {
        return (addrToCid[addr], addrToVersion[addr]);
    }

    /* internal functions */

    function verify(
        bytes32 _message,
        Signature memory signature
    ) internal pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(
                prefix,
                _message
            )
        );
        address signer = ecrecover(
            prefixedHash,
            signature.v,
            signature.r,
            signature.s
        );
        return signer;
    }
}
