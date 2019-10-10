pragma solidity ^0.5.0;

import "@openzeppelin/contracts/access/roles/MinterRole.sol";
import "./IMintingController.sol";
import "../registry/Registry.sol";

// solium-disable error-reason,security/no-block-members

/**
 * @title MintingController
 * @dev Defines the functions for distribution of Second Level Domains (SLD)s.
 */
contract MintingController is IMintingController, MinterRole {

    Registry internal _registry;

    // uint256(keccak256(abi.encodePacked(uint256(0x0), keccak256(abi.encodePacked("crypto")))))
    uint256 private constant _CRYPTO_HASH = 0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f;

    constructor (Registry registry) public {
        _registry = registry;
    }

    function root() public view returns (uint256) {
        return _CRYPTO_HASH;
    }

    function _childId(uint256 tokenId, string memory label) internal pure returns (uint256) {
        require(bytes(label).length != 0);
        return uint256(keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))));
    }

    function mintSLD(address to, string memory label) public onlyMinter {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        _registry.controlledMint(to, childId);
        _registry.setTokenURI(childId, _CRYPTO_HASH, label);
    }

    function safeMintSLD(address to, string memory label, bytes memory _data) public onlyMinter {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        _registry.controlledSafeMint(to, childId, _data);
        _registry.setTokenURI(childId, _CRYPTO_HASH, label);
    }

}
