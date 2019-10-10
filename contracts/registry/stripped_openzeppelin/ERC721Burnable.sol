pragma solidity ^0.5.0;

// IMPORTANT: DO NOT MODIFY!!!
// We had to strip the require messages in order to get the bytecode size down.

import "./ERC721.sol";

/**
 * @title ERC721 Burnable Token
 * @dev ERC721 Token that can be irreversibly burned (destroyed).
 */
contract ERC721Burnable is ERC721 {
    /**
     * @dev Burns a specific ERC721 token.
     * @param tokenId uint256 id of the ERC721 token to be burned.
     */
    function burn(uint256 tokenId) public {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(msg.sender, tokenId));
        _burn(tokenId);
    }
}
