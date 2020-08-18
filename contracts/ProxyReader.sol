pragma solidity 0.5.12;
// TODO: check how to avoid experimental version
pragma experimental ABIEncoderV2;

import "./IRegistryReader.sol";
import "./IResolverReader.sol";
import "./Registry.sol";
import "./Resolver.sol";

contract ProxyReader is IRegistryReader, IResolverReader {
    Registry private _registry;

    constructor (Registry registry) public {
        require(address(registry) != address(0), "Registry is empty");
        _registry = registry;
    }

    function supportsInterface(bytes4 interfaceId) external view returns (bool) {
        return _registry.supportsInterface(interfaceId);
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