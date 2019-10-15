pragma solidity 0.5.11;

import "./ControlledERC721.sol";
import "./IRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";

// solium-disable error-reason

contract Resolution is ControlledERC721 {

    event Resolve(uint256 indexed tokenId, address indexed to);
    event Sync(address indexed resolver, uint256 indexed updateId);

    // Mapping from token ID to resolver address
    mapping (uint256 => address) internal _tokenResolvers;

    /// Resolution

    function resolveTo(address to, uint256 tokenId) external onlyApprovedOrOwner(tokenId) {
        _resolveTo(to, tokenId);
    }

    function controlledResolveTo(address to, uint256 tokenId) external onlyController {
        _resolveTo(to, tokenId);
    }

    function resolverOf(uint256 tokenId) external view returns (address) {
        address resolver = _tokenResolvers[tokenId];
        require(resolver != address(0));
        return resolver;
    }

    function sync(uint256 tokenId, uint256 updateId) external {
        require(_tokenResolvers[tokenId] == msg.sender);
        emit Sync(msg.sender, updateId);
    }

    /// Internal

    function _resolveTo(address to, uint256 tokenId) internal {
        require(_exists(tokenId));
        emit Resolve(tokenId, to);
        _tokenResolvers[tokenId] = to;
    }

    function _transferFrom(address from, address to, uint256 tokenId) internal {
        super._transferFrom(from, to, tokenId);
        // Clear resolver (if any)
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
    }

    function _burn(uint256 tokenId) internal {
        super._burn(tokenId);
        // Clear resolver (if any)
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
    }

}