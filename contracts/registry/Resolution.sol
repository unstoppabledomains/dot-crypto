pragma solidity ^0.5.0;

import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Metadata.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/lifecycle/Pausable.sol";
import "./Metadata.sol";

contract Resolution is ERC721 {

    event Resolve(uint256 indexed tokenId, address indexed to);

    // Mapping from token ID to resolver address
    mapping (uint256 => address) internal _tokenResolvers;

    /*
     *     bytes4(keccak256('resolveTo(address,uint256)')) == 0x70a08231
     *     bytes4(keccak256('resolverOf(uint256)')) == 0x6352211e
     *     => 0x70a08231 ^ 0x6352211e == 0x80ac58cd
     */
    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_RESOLUTION = 0x80ac58cd;

    constructor () public {
        // register the supported interfaces to conform to Resolution via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_RESOLUTION);
    }

    /**
     * @dev Internal function to transfer ownership of a given token ID to another address.
     * As opposed to transferFrom, this imposes no restrictions on msg.sender.
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _transferFrom(address from, address to, uint256 tokenId) internal {
        super._transferFrom(from, to, tokenId);
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
    }

    /**
     * @dev Internal function to burn a specific token.
     * Reverts if the token does not exist.
     * @param tokenId uint256 ID of the token being burned
     */
    function _burn(uint256 tokenId) internal {
        super._burn(tokenId);
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
    }

    /**
     * @dev Internal function to set resolver for a given token ID to another
     * address. As opposed to resolveTo, this imposes no restrictions on
     * msg.sender.
     * @param to address the given token ID will resolve to
     * @param tokenId uint256 ID of the token to be transferred
     */
    function _resolveTo(address to, uint256 tokenId) internal {
        emit Resolve(tokenId, to);
        _tokenResolvers[tokenId] = to;
    }

    /**
     * @dev Sets the resolver of a given token ID to another address.
     * Requires the msg.sender to be the owner, approved, or operator.
     * @param to address the given token ID will resolve to
     * @param tokenId uint256 ID of the token to be transferred
     */
    function resolveTo(address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Resolution: transfer caller is not owner nor approved");
        _resolveTo(to, tokenId);
    }

    /**
     * @dev Gets the resolver of the specified token ID.
     * @param tokenId uint256 ID of the token to query the resolver of
     * @return address currently marked as the resolver of the given token ID
     */
    function resolverOf(uint256 tokenId) public view returns (address) {
        address resolver = _tokenResolvers[tokenId];
        require(resolver != address(0), "Resolution: resolver query for nonexistent token");
        return resolver;
    }
}