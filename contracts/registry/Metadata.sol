pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "./Root.sol";

// solium-disable error-reason

contract Metadata is Root, IERC721Metadata {

    event NewURI(uint256 indexed tokenId, string uri);
    event NewURIPrefix(string prefix);

    // Mapping from token ID to resolver address
    mapping (uint256 => address) internal _tokenResolvers;

    // Optional mapping for token URIs
    mapping(uint256 => string) internal _tokenURIs;

    string internal _prefix = "urn:udc:";

    constructor () public {
        // register the supported interfaces to conform to ERC721 via ERC165
        _registerInterface(0x5b5e139f); // ERC721 Metadata Interface
        _tokenURIs[root()] = "crypto";
        emit NewURI(root(), "crypto");
    }

    /// ERC721 Metadata ext.

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

    function controlledSetTokenURIPrefix(string calldata prefix) external onlyController {
        _prefix = prefix;
        emit NewURIPrefix(prefix);
    }

    /// Internal

    function _setTokenURI(uint256 tokenId, string memory label) internal {
        uint256 childId = _childId(tokenId, label);
        require(_exists(childId));
        _tokenURIs[childId] = string(abi.encodePacked(label, ".", _tokenURIs[tokenId]));
        emit NewURI(childId, label);
    }

    function _burn(uint256 tokenId) internal {
        super._burn(tokenId);
        // Clear metadata (if any)
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }

}