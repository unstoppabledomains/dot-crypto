pragma solidity ^0.5.0;

import './DotCrypto.sol';

contract SimpleResolver {

    event Set(address indexed owner, uint256 indexed key, string value, uint256 indexed tokenId);

    DotCrypto dotCrypto;

    // Mapping from owner to token ID to key to value
    mapping (address => mapping (uint256 => mapping (uint256 => string))) internal _records;

    constructor(DotCrypto _dotCrypto) public {
        dotCrypto = _dotCrypto;
    }

    /**
     * @dev Throws if called when not the resolver.
     */
    modifier whenResolver(uint256 tokenId) {
        require(address(this) == dotCrypto.resolverOf(tokenId), "SimpleResolver: caller is not the owner");
        _;
    }

    /**
     * @dev Function to get record.
     * @param key The key to query the value of.
     * @param tokenId The token id to fetch.
     * @return The value string.
     */
    function get(uint256 key, uint256 tokenId) public view whenResolver(tokenId) returns (string memory) {
        address owner = dotCrypto.ownerOf(tokenId);
        return _records[owner][tokenId][key];
    }

    /**
     * @dev Function to set record.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     */
    function set(uint256 key, string memory value, uint256 tokenId) public whenResolver(tokenId) {
        address owner = dotCrypto.ownerOf(tokenId);
        require(msg.sender == owner, "SimpleResolver: caller is not the owner");

        _records[owner][tokenId][key] = value;
        emit Set(owner, key, value, tokenId);
    }
}