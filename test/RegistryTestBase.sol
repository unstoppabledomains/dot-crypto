pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/ChildrenController.sol";
import "../contracts/controllers/SignatureController.sol";
import "../contracts/controllers/SunriseController.sol";
import "../contracts/controllers/MintingController.sol";

contract RegistryTestBase {

  uint256 constant root = uint256(keccak256(abi.encodePacked(uint256(0x0), keccak256(abi.encodePacked("crypto")))));

  function namehash(
    uint256 tokenId,
    string memory label
  ) internal pure returns (uint256) {
    require(
      bytes(label).length != 0,
      "Registry: label length must be greater than zero"
    );
    return uint256(
      keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label))))
    );
  }

  uint256 tok = namehash(root, "label");

  function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
    return hex"150b7a02";
  }

}