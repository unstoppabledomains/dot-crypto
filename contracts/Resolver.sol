pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

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
    function set(string calldata key, string calldata value, uint256 tokenId) external {
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
    ) external {
        _validate(keccak256(abi.encodeWithSelector(this.set.selector, key, value, tokenId)), tokenId, signature);
        _set(_registry.ownerOf(tokenId), key, value, tokenId);
    }

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
        string[] memory keys,
        string[] memory values,
        uint256 tokenId
    ) public {
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
        string[] memory keys,
        string[] memory values,
        uint256 tokenId,
        bytes memory signature
    ) public {
        _validate(keccak256(abi.encodeWithSelector(this.setMany.selector, keys, values, tokenId)), tokenId, signature);
        _setMany(_registry.ownerOf(tokenId), keys, values, tokenId);
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
        for (uint256 i = 0; i < keyCount; i++) {
            _set(owner, keys[i], values[i], tokenId);
        }
    }

}
