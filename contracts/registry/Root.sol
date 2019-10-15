pragma solidity ^0.5.0;

import "./ControlledERC721.sol";
import "./IRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "./Resolution.sol";

// solium-disable error-reason

contract Root is ControlledERC721 {

    // uint256(keccak256(abi.encodePacked(uint256(0x0), keccak256(abi.encodePacked("crypto")))))
    uint256 private constant _CRYPTO_HASH =
        0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f;

    constructor () public {
        _mint(address(0xdead), _CRYPTO_HASH);
    }


    function root() public pure returns (uint256) {
        return _CRYPTO_HASH;
    }

    function _childId(uint256 tokenId, string memory label) internal pure returns (uint256) {
        require(bytes(label).length != 0);
        return uint256(keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))));
    }

    function childOf(uint256 tokenId, string calldata label) external pure returns (uint256) {
        return _childId(tokenId, label);
    }

}