pragma solidity 0.5.11;

import "truffle/Assert.sol";

contract RegistryTestBase {

  uint256 public root = namehash(0, "crypto");

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
    return 0x150b7a02;
  }

}