pragma solidity 0.5.12;
// TODO: check how to avoid experimental version
pragma experimental ABIEncoderV2;

import "./IRegistry.sol";
import "./Resolver.sol";

contract ProxyReader {
    IRegistry private _registry;

    constructor (IRegistry registry) public {
        // TODO: check registry interface if needed
        require(address(registry) != address(0), "Registry is empty");
        _registry = registry;
    }

    function getMany(string[] calldata keys, uint256 tokenId) external view returns (string[] memory) {
        address resolverAddress = _registry.resolverOf(tokenId);
        Resolver resolver = Resolver(resolverAddress);
        return resolver.getMany(keys, tokenId);
    }
}