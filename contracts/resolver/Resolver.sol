pragma solidity 0.5.12;

import '../Registry.sol';

// solium-disable error-reason

contract Resolver {

    event Set(address indexed owner, bytes indexed key, bytes value, uint256 indexed tokenId);

    Registry internal _registry;

    // Mapping from owner to token ID to key to value
    mapping (address => mapping (uint256 => mapping (bytes => bytes))) internal _records;

    constructor(Registry registry) public {
        _registry = registry;
    }

    /**
     * @dev Throws if called when not the resolver.
     */
    modifier whenResolver(uint256 tokenId) {
        require(address(this) == _registry.resolverOf(tokenId), "SimpleResolver: is not the resolver");
        _;
    }

    /**
     * @dev Function to get record.
     * @param key The key to query the value of.
     * @param tokenId The token id to fetch.
     * @return The value bytes.
     */
    function get(bytes memory key, uint256 tokenId) public view whenResolver(tokenId) returns (bytes memory) {
        address owner = _registry.ownerOf(tokenId);
        return _records[owner][tokenId][key];
    }

    /**
     * @dev Internal function to to set record. As opposed to set, this imposes
     * no restrictions on msg.sender.
     * @param owner owner address of token
     * @param key key of record to be set
     * @param value value of record to be set
     * @param tokenId uint256 ID of the token
     */
    function _set(address owner, bytes memory key, bytes memory value, uint256 tokenId) internal {
        _records[owner][tokenId][key] = value;
        emit Set(owner, key, value, tokenId);
    }

    /**
     * @dev Function to set record.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     */
    function set(bytes calldata key, bytes calldata value, uint256 tokenId) external whenResolver(tokenId) {
        address owner = _registry.ownerOf(tokenId);
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        _registry.sync(tokenId, uint256(keccak256(key)));
        _set(owner, key, value, tokenId);
    }
}
