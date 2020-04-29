pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "../util/BulkWhitelistedRole.sol";
import "../IRegistry.sol";

contract IResolver {
    function reconfigure(string[] memory keys, string[] memory values, uint256 tokenId) public;
}

contract DomainZoneController is BulkWhitelistedRole {

    IRegistry internal _registry;

    constructor (IRegistry registry, address[] memory accounts) public {
        _registry = registry;
        for (uint256 index = 0; index < accounts.length; index++) {
            _addWhitelisted(accounts[index]);
        }
    }

    function mintChild(address to, uint256 tokenId, string memory label, string[] memory keys, string[] memory values) public onlyWhitelisted {
        address resolver = _registry.resolverOf(tokenId);
        uint256 childTokenId = _registry.childIdOf(tokenId, label);
        _registry.mintChild(address(this), tokenId, label);
        _registry.resolveTo(resolver, childTokenId);
        IResolver(resolver).reconfigure(keys, values, childTokenId);
        _registry.setOwner(to, childTokenId);
    }

}