pragma solidity ^0.5.0;

import "@openzeppelin/contracts/lifecycle/Pausable.sol";
import "./Registry.sol";

// TODO: are these really all of the functions we would need to pause?

contract PauseableRegistry is Registry, Pausable {

    /**
     * @dev Internal function to transfer ownership of a given token ID to
     * another address with pauseing.
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _transferFrom(address from, address to, uint256 tokenId) internal whenNotPaused {
        super._transferFrom(from, to, tokenId);
    }

    /**
     * @dev Internal function to set resolver with pauseing.
     * @param to address the given token ID will resolve to
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _resolveTo(address to, uint256 tokenId) internal whenNotPaused {
        super._resolveTo(to, tokenId);
    }

    /**
     * @dev Internal function mint tokens with pauseing.
     * @param to address the given token ID will resolve to
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _mint(address to, uint256 tokenId) internal whenNotPaused {
        super._mint(to, tokenId);
    }

    /**
     * @dev Internal function to burn tokens with pauseing.
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _burn(uint256 tokenId) internal whenNotPaused {
        super._burn(tokenId);
    }
}