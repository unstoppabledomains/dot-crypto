pragma solidity ^0.5.0;

import "./ControlledERC721.sol";
import "./IRegistry.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";

// solium-disable error-reason

contract Registry is IRegistry, ControlledERC721, IERC721Metadata {

    event Resolve(uint256 indexed tokenId, address indexed to);
    event NewURI(uint256 indexed tokenId, string uri);

    // Mapping from token ID to resolver address
    mapping (uint256 => address) internal _tokenResolvers;

    // Optional mapping for token URIs
    mapping(uint256 => string) internal _tokenURIs;

    string internal _prefix = "urn:udc:";

    // uint256(keccak256(abi.encodePacked(uint256(0x0), keccak256(abi.encodePacked("crypto")))))
    uint256 private constant _CRYPTO_HASH =
        0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f;

    constructor () public {
        // register the supported interfaces to conform to ERC721 via ERC165
        _registerInterface(0x5b5e139f); // _INTERFACE_ID_ERC721_METADATA
        _registerInterface(0x80ac58cd); // _INTERFACE_ID_DOTCRYPTO_RESOLUTION

        _mint(address(0xdead), _CRYPTO_HASH);
        // _setTokenURI(_CRYPTO_HASH, "crypto.");

        _tokenURIs[_CRYPTO_HASH] = "crypto.";
        emit NewURI(_CRYPTO_HASH, "crypto.");
    }

    function _resolveTo(address to, uint256 tokenId) internal {
        emit Resolve(tokenId, to);
        _tokenResolvers[tokenId] = to;
    }

    function resolveTo(address to, uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId));
        _resolveTo(to, tokenId);
    }

    function controlledResolveTo(address to, uint256 tokenId) external onlyController {
        _resolveTo(to, tokenId);
    }

    function resolverOf(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId));
        return _tokenResolvers[tokenId];
    }

    function name() external view returns (string memory) {
        return ".crypto";
    }

    function symbol() external view returns (string memory) {
        return "UDC";
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId));
        return string(abi.encodePacked(_prefix, _tokenURIs[tokenId]));
    }

    function setTokenURI(uint256 tokenId, uint256 parentId, string calldata label) external onlyController {
        require(_exists(tokenId));
        _tokenURIs[tokenId] = string(abi.encodePacked(label, ".", _tokenURIs[parentId]));
        emit NewURI(tokenId, label);
    }

    function setTokenURIPrefix(string calldata prefix) external onlyController {
        _prefix = prefix;
    }

    function _transferFrom(address from, address to, uint256 tokenId) internal {
        super._transferFrom(from, to, tokenId);
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
    }

    function _burn(uint256 tokenId) internal {
        super._burn(tokenId);
        if (_tokenResolvers[tokenId] != address(0x0)) {
            delete _tokenResolvers[tokenId];
        }
        // Clear metadata (if any)
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

}