pragma solidity ^0.5.0;

pragma experimental ABIEncoderV2;

import './SimpleResolver.sol';

contract GetAllResolver is SimpleResolver {

    /**
     * @dev Function designed to be called by a user to get multiple keys.
     * @param keys list of keys of records to be queried
     * @param tokenId uint256 ID of the token to be queried
     */
    function getMany(
        bytes[] calldata keys,
        uint256 tokenId
    ) external view returns (bytes[] memory) {
        address owner = registry.ownerOf(tokenId);
        bytes[] memory result = new bytes[](keys.length);

        for (uint256 i = 0; i < keys.length; i++) {
            result[i] = _records[owner][tokenId][keys[i]];
        }

        return result;
    }
}
