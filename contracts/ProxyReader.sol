pragma solidity 0.5.12;
// TODO: check how to avoid experimental version
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/introspection/ERC165.sol";

import "./IRegistryReader.sol";
import "./IResolverReader.sol";
import "./Registry.sol";
import "./Resolver.sol";

contract ProxyReader is ERC165, IRegistryReader, IResolverReader {

    string public constant NAME = "Unstoppable Proxy Reader";
    string public constant VERSION = "0.1.0";
    
    Registry private _registry;

    /*
     * bytes4(keccak256(abi.encodePacked('supportsInterface(bytes4)'))) == 0x01ffc9a7
     */
    bytes4 private constant _INTERFACE_ID_ERC165 = 0x01ffc9a7;

    /*
     * bytes4(keccak256(abi.encodePacked('name()'))) == 0x06fdde03
     * bytes4(keccak256(abi.encodePacked('symbol()'))) == 0x95d89b41
     * bytes4(keccak256(abi.encodePacked('tokenURI(uint256)'))) == 0xc87b56dd
     * bytes4(keccak256(abi.encodePacked('isApprovedOrOwner(address,uint256)'))) == 0x430c2081
     * bytes4(keccak256(abi.encodePacked('resolverOf(uint256)'))) == 0xb3f9e4cb
     * bytes4(keccak256(abi.encodePacked('childIdOf(uint256,string)'))) == 0x68b62d32
     * bytes4(keccak256(abi.encodePacked('isController(address)'))) == 0xb429afeb
     * bytes4(keccak256(abi.encodePacked('balanceOf(address)'))) == 0x70a08231
     * bytes4(keccak256(abi.encodePacked('ownerOf(uint256)'))) == 0x6352211e
     * bytes4(keccak256(abi.encodePacked('getApproved(uint256)'))) == 0x081812fc
     * bytes4(keccak256(abi.encodePacked('isApprovedForAll(address,address)'))) == 0xe985e9c5
     * bytes4(keccak256(abi.encodePacked('root()'))) == 0xebf0c717
     *
     * => 0x06fdde03 ^ 0x95d89b41 ^ 0xc87b56dd ^ 0x430c2081 ^
     *    0xb3f9e4cb ^ 0x68b62d32 ^ 0xb429afeb ^ 0x70a08231 ^
     *    0x6352211e ^ 0x081812fc ^ 0xe985e9c5 ^ 0xebf0c717 == 0x6eabca0d
     */
    bytes4 private constant _INTERFACE_ID_REGISTRY_READER = 0x6eabca0d;
    
    /*
     * bytes4(keccak256(abi.encodePacked('nonceOf(uint256)'))) == 0x6ccbae5f
     * bytes4(keccak256(abi.encodePacked('registry()'))) == 0x7b103999
     * bytes4(keccak256(abi.encodePacked('get(string,uint256)'))) == 0x1be5e7ed
     * bytes4(keccak256(abi.encodePacked('getByHash(uint256,uint256)'))) == 0x672b9f81
     * bytes4(keccak256(abi.encodePacked('getMany(string[],uint256)'))) == 0x1bd8cc1a
     * bytes4(keccak256(abi.encodePacked('getManyByHash(uint256[],uint256)'))) == 0xb85afd28
     *
     * => 0x6ccbae5f ^ 0x7b103999 ^ 0x1be5e7ed ^ 
     *    0x672b9f81 ^ 0x1bd8cc1a ^ 0xb85afd28 == 0xc897de98
     */
    bytes4 private constant _INTERFACE_ID_RESOLVER_READER = 0xc897de98;

    constructor (Registry registry) public {
        require(address(registry) != address(0), "Registry is empty");
        _registry = registry;

        _registerInterface(_INTERFACE_ID_ERC165);
        _registerInterface(_INTERFACE_ID_REGISTRY_READER);
        _registerInterface(_INTERFACE_ID_RESOLVER_READER);
    }

    function name() external view returns (string memory) {
        return _registry.name();
    }

    function symbol() external view returns (string memory) {
        return _registry.symbol();
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return _registry.tokenURI(tokenId);
    }

    function isApprovedOrOwner(address spender, uint256 tokenId) external view returns (bool) {
        return _registry.isApprovedOrOwner(spender, tokenId);
    }

    function resolverOf(uint256 tokenId) external view returns (address) {
        return _registry.resolverOf(tokenId);
    }

    function childIdOf(uint256 tokenId, string calldata label) external view returns (uint256) {
        return _registry.childIdOf(tokenId, label);
    }

    function isController(address account) public view returns (bool) {
        return _registry.isController(account);
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _registry.balanceOf(owner);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _registry.ownerOf(tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        return _registry.getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _registry.isApprovedForAll(owner, operator);
    }

    function root() public view returns (uint256) {
        return _registry.root();
    }    

    function getMany(string[] calldata keys, uint256 tokenId) external view returns (string[] memory) {
        Resolver resolver = Resolver(_registry.resolverOf(tokenId));
        return resolver.getMany(keys, tokenId);
    }

    // TODO: (string[] calldata keys, uint256 tokenId) -> resolver address, owner address, values[]

    function nonceOf(uint256 tokenId) external view returns (uint256) {
        Resolver resolver = Resolver(_registry.resolverOf(tokenId));
        return resolver.nonceOf(tokenId);
    }

    function get(string memory key, uint256 tokenId) public view returns (string memory) {
        Resolver resolver = Resolver(_registry.resolverOf(tokenId));
        return resolver.get(key, tokenId);
    }

    function getByHash(uint256 keyHash, uint256 tokenId) public view returns (string memory key, string memory value) {
        Resolver resolver = Resolver(_registry.resolverOf(tokenId));
        return resolver.getByHash(keyHash, tokenId);
    }

    function getManyByHash(uint256[] memory keyHashes, uint256 tokenId) public view returns (string[] memory keys, string[] memory values) {
        Resolver resolver = Resolver(_registry.resolverOf(tokenId));
        return resolver.getManyByHash(keyHashes, tokenId);
    }

    // TODO: figure out right way to do this without tokenId
    function registry() external view returns (address) {
        return address(_registry);
    }
}