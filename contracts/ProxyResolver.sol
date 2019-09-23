pragma solidity ^0.5.0;

import './DotCrypto.sol';
import './SimpleResolver.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

contract ProxyResolver is SimpleResolver {
    using ECDSA for *;

    // Mapping from owner to a nonce
    mapping (address => uint256) public nonces;

    function _checkProxySignature(address owner, bytes32 hash, uint256 tokenId) internal {
        uint256 nonce = nonces[owner];

        require(
            owner == recover(toEthSignedMessageHash(hash, signature)),
            "ProxyDotCrypto: bad signature"
        );

        nonces[owner] += 1;
    }

    /**
     * @dev Function to set record on behalf of another user.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setFor(string calldata key, string calldata value, uint256 tokenId, bytes calldata signature) public withResolver {
        address owner = dotCrypto.ownerOf(tokenId);
        _checkProxySignature(owner, keccak256(abi.encodePacked(key, value, tokenId, nonce)), signature);
        _set(owner, key, value, tokenId);
    }
}
