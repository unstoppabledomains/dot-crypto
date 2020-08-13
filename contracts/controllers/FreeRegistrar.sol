pragma solidity 0.5.12;

import "../IRegistry.sol";

contract FreeRegistrar {

    event MintChild(uint256 indexed tokenId, uint256 indexed parentTokenId, string label);

    IRegistry internal _registry;
    uint256 internal _parentTokenId;

    constructor (IRegistry registry, uint256 parentTokenId) public {
        _registry = registry;
        _parentTokenId = parentTokenId;
    }

    function registry() external view returns (address) {
        return address(_registry);
    }

    function parentTokenId() external view returns (uint256) {
        return _parentTokenId;
    }

    function mintChild(address to, string calldata label) external {
        uint256 childTokenId = _registry.childIdOf(_parentTokenId, label);
        _registry.mintChild(to, _parentTokenId, label);
        emit MintChild(childTokenId, _parentTokenId, label);
    }
}
