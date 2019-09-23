pragma solidity ^0.5.0;

import './SimpleResolver.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

contract RepresentitiveResolver is SimpleResolver {
    using ECDSA for *;

    // Mapping from owner to a nonce
    mapping (address => uint256) internal _nonces;

    function _checkProxySignature(address owner, bytes32 hash, bytes memory signature) internal {
       uint256 nonce = _nonces[owner];

        require(
            owner == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(hash, nonce))), signature),
            "RepresentitiveResolver: bad signature"
        );

        _nonces[owner] += 1;
    }

    /**
     * @dev Gets the nonce of the specified address.
     * @param addr address to query nonce for
     * @return nonce of the given address
     */
    function nonceOf(address addr) external view returns (uint256) {
        return _nonces[addr];
    }

    /**
     * @dev Function to set record on behalf of an address.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setFor(string calldata key, string calldata value, uint256 tokenId, bytes calldata signature) external whenResolver(tokenId) {
        address owner = registry.ownerOf(tokenId);
        _checkProxySignature(owner, keccak256(abi.encodePacked(key, value, tokenId)), signature);
        _set(owner, key, value, tokenId);
    }
}
