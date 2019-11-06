pragma solidity 0.5.12;

import './Resolver.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import '../util/SignatureUtil.sol';

// solium-disable error-reason

contract SignatureResolver is Resolver, SignatureUtil {

    constructor(Registry registry) public Resolver(registry) SignatureUtil(registry) {}

    /**
     * @dev Function to set record on behalf of an address.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setFor(bytes calldata key, bytes calldata value, uint256 tokenId, bytes calldata signature) external whenResolver(tokenId) {
        _validate(keccak256(abi.encodeWithSelector(this.set.selector, key, value, tokenId)), tokenId, signature);
         _registry.sync(tokenId, uint256(keccak256(key)));
        _set(_registry.ownerOf(tokenId), key, value, tokenId);
    }

}
