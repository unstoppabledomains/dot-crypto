pragma solidity ^0.5.0;

import './DotCrypto.sol';

contract SimpleResolver {

    event Set(address indexed owner, string indexed key, string value, uint256 indexed tokenId);

    DotCrypto dotCrypto;

    // Mapping from owner to token ID to key to value
    mapping (address => mapping (uint256 => mapping (string => string))) internal _records;

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
    function get(string memory key, uint256 tokenId) public view whenResolver(tokenId) returns (string memory) {
        address owner = dotCrypto.ownerOf(tokenId);
        return _records[owner][tokenId][key];
    }

    /**
     * @dev Internal function to to set record. As opposed to set, this imposes
     * no restrictions on msg.sender.
     * @param to address the given token ID will resolve to
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _set(address owner, string memory key, string memory value, uint256 tokenId) internal {
        _records[owner][tokenId][key] = value;
        emit Set(owner, key, value, tokenId);
    }

    /**
     * @dev Function to set record.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     */
    function set(string memory key, string memory value, uint256 tokenId) public whenResolver(tokenId) {
        address owner = dotCrypto.ownerOf(tokenId);
        // TODO: f is this really necissary?
        require(msg.sender == owner, "SimpleResolver: caller is not the owner");

        _set(owner, key, value, tokenId);
    }
}