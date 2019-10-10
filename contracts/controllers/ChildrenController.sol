pragma solidity ^0.5.0;

import "@openzeppelin/contracts/access/roles/MinterRole.sol";
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import "./IChildrenController.sol";
import "../registry/Registry.sol";

// solium-disable error-reason,security/no-block-members

/**
 * @title ChildrenController
 * @dev Defines the parent/child relationship between domain tokens.
 */
contract ChildrenController is IChildrenController, MinterRole {

    Registry internal _registry;

    constructor (Registry registry) public {
        _registry = registry;
    }

    function _childId(uint256 tokenId, string memory label) internal pure returns (uint256) {
        require(bytes(label).length != 0);
        return uint256(keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))));
    }

    function mintChild(address to, uint256 tokenId, string calldata label) external {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        uint256 childId = _childId(tokenId, label);
        _registry.controlledMint(to, childId);
        _registry.setTokenURI(childId, tokenId, label);
    }

    function transferFromChild(address from, address to, uint256 tokenId, string memory label) public {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        uint256 childId = _childId(tokenId, label);
        _registry.controlledTransferFrom(from, to, childId);
    }

    function safeTransferFromChild(address from, address to, uint256 tokenId, string calldata label, bytes calldata _data) external {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        uint256 childId = _childId(tokenId, label);
        _registry.controlledSafeTransferFrom(from, to, childId, _data);
    }

    function safeTransferFromChild(address from, address to, uint256 tokenId, string calldata label) external {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        uint256 childId = _childId(tokenId, label);
        _registry.controlledSafeTransferFrom(from, to, childId, "");
    }

    function burnChild(uint256 tokenId, string calldata label) external {
        require(_registry.isApprovedOrOwner(msg.sender, tokenId));
        uint256 childId = _childId(tokenId, label);
        _registry.controlledBurn(childId);
    }

}
