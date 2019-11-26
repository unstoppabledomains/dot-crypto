pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import './Resolver.sol';

// solium-disable error-reason

contract ManyResolver is Resolver {

    /**
     * @dev Function to get multiple record.
     * @param keys The keys to query the value of.
     * @param tokenId The token id to fetch.
     * @return The values.
     */
    function getMany(string[] calldata keys, uint256 tokenId) external view whenResolver(tokenId) returns (string[] memory) {
        address owner = _registry.ownerOf(tokenId);
        uint256 keyCount = keys.length;
        string[] memory values = new string[](keyCount);
        for (uint256 i = 0; i < keyCount; i++) {
            values[i] = _records[owner][tokenId][keys[i]];
        }
        return values;
    }

    // TODO
    function setMany(
        string[] calldata keys,
        string[] calldata values,
        uint256 tokenId
    ) external whenResolver(tokenId) {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        _setMany(_registry.ownerOf(tokenId), keys, values, tokenId);
    }

    /**
     * @dev Function to set record on behalf of an address.
     * @param keys The keys set the values of.
     * @param values The values to set keys to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setManyFor(
        string[] calldata keys,
        string[] calldata values,
        uint256 tokenId,
        bytes calldata signature
    ) external whenResolver(tokenId) {
        _validate(keccak256(abi.encodeWithSelector(this.setMany.selector, keys, values, tokenId)), tokenId, signature);
        _setMany(_registry.ownerOf(tokenId), keys, values, tokenId);
    }

    /**
     * @dev Internal function to to set multiple records. As opposed to setMany, this imposes
     * no restrictions on msg.sender.
     * @param owner owner address of token
     * @param keys keys of record to be set
     * @param values values of record to be set
     * @param tokenId uint256 ID of the token
     */
    function _setMany(address owner, string[] memory keys, string[] memory values, uint256 tokenId) internal {
        uint256 keyCount = keys.length;
        // If there are no values this could be a clear fuction for less gas.
        // require(keyCount == values.length);
        for (uint256 i = 0; i < keyCount; i++) {
            _set(owner, keys[i], values[i], tokenId);
        }
    }

}
