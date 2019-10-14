pragma solidity ^0.5.0;

// import "./stripped_openzeppelin/ERC721.sol";
// import "./stripped_openzeppelin/ERC721Burnable.sol";
import "./ControllerRole.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";

// solium-disable error-reason

/**
 * @title ControlledERC721
 * @dev An ERC721 Token see https://eips.ethereum.org/EIPS/eip-721. With
 * additional functions so other trusted contracts to interact with the tokens.
 */
contract ControlledERC721 is ControllerRole, ERC721, ERC721Burnable {

    modifier onlyApprovedOrOwner(uint256 tokenId) {
        require(_isApprovedOrOwner(msg.sender, tokenId));
        _;
    }

    function controlledTransferFrom(address from, address to, uint256 tokenId) external onlyController {
        _transferFrom(from, to, tokenId);
    }

    function controlledSafeTransferFrom(address from, address to, uint256 tokenId, bytes calldata _data) external onlyController {
        _transferFrom(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data));
    }

    function controlledBurn(uint256 tokenId) external onlyController {
        _burn(tokenId);
    }

    function isApprovedOrOwner(address spender, uint256 tokenId) external view returns (bool) {
        return _isApprovedOrOwner(spender, tokenId);
    }

}
