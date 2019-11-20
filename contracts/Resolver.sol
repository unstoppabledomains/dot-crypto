pragma solidity 0.5.12;

import './Registry.sol';
import './util/SignatureUtil.sol';

// solium-disable error-reason

contract Resolver is SignatureUtil {

    event Set(address indexed owner, string indexed key, string value, uint256 indexed tokenId);

    // Mapping from owner to token ID to key to value
    mapping (address => mapping (uint256 => mapping (string => string))) internal _records;

    constructor(Registry registry) public SignatureUtil(registry) {}

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
     * @return The value string.
     */
    function get(string memory key, uint256 tokenId) public view whenResolver(tokenId) returns (string memory) {
        address owner = _registry.ownerOf(tokenId);
        return _records[owner][tokenId][key];
    }

    /**
     * @dev Function to set record.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     */
    function set(string calldata key, string calldata value, uint256 tokenId) external whenResolver(tokenId) {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        _set(_registry.ownerOf(tokenId), key, value, tokenId);
    }

    /**
     * @dev Function to set record on behalf of an address.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     * @param signature The signature to verify the transaction with.
     */
    function setFor(
        string calldata key,
        string calldata value,
        uint256 tokenId,
        bytes calldata signature
    ) external whenResolver(tokenId) {
        _validate(keccak256(abi.encodeWithSelector(this.set.selector, key, value, tokenId)), tokenId, signature);
        _set(_registry.ownerOf(tokenId), key, value, tokenId);
    }

    /**
     * @dev Internal function to to set record. As opposed to set, this imposes
     * no restrictions on msg.sender.
     * @param owner owner address of token
     * @param key key of record to be set
     * @param value value of record to be set
     * @param tokenId uint256 ID of the token
     */
    function _set(address owner, string memory key, string memory value, uint256 tokenId) internal {
        _registry.sync(tokenId, uint256(keccak256(bytes(key))));
        _records[owner][tokenId][key] = value;
        emit Set(owner, key, value, tokenId);
    }

}
