pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @title PerUserResolver
 * @dev A resolver system similar to what we have currently on ZNS.
 */
contract PerUserResolver is Ownable {

    event Set(bytes indexed key, bytes value, uint256 indexed tokenId);

    mapping (uint256 => mapping (bytes => bytes)) internal _records;

    function get(uint256 tokenId, bytes calldata key) external view returns (bytes memory) {
        return _records[tokenId][key];
    }

    function set(bytes calldata key, bytes calldata value, uint256 tokenId) external onlyOwner {
        _records[tokenId][key] = value;
        emit Set(key, value, tokenId);
    }
}