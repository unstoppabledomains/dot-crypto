pragma solidity ^0.5.0;

import './DotCrypto.sol';
import './SimpleResolver.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

contract ProxyResolver is SimpleResolver {
    using ECDSA for *;

    // Mapping from owner to a nonce
    mapping (address => uint256) public nonces;

    function _checkProxySignature(address owner, bytes32 hash, bytes memory signature) internal {
       uint256 nonce = nonces[owner];

        require(
            owner == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(hash, nonce))), signature),
            "ProxyResolver: bad signature"
        );

        nonces[owner] += 1;
    }

    /**
     * @dev Function to set record on behalf of an address.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setFor(string calldata key, string calldata value, uint256 tokenId, bytes calldata signature) external whenResolver(tokenId) {
        address owner = dotCrypto.ownerOf(tokenId);
        _checkProxySignature(owner, keccak256(abi.encodePacked(key, value, tokenId)), signature);
        _set(owner, key, value, tokenId);
    }
}
