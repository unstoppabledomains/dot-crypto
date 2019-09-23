pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Metadata.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/lifecycle/Pausable.sol";
import "./Metadata.sol";
import "./Resolution.sol";

contract Registry is ERC721, ERC721Burnable, Metadata, Resolution {

    // Mapping from token ID to resolver address
    mapping (uint256 => address) internal _tokenResolvers;

    /*
     *     bytes4(keccak256('assign(address,uint256,string)')) == 0x095ea7b3
     *     => 0x095ea7b3
     */
    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_REGISTRY = 0x095ea7b3;

    constructor () public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_REGISTRY);
    }

    /**
     * @dev Internal function to mint subdomain tokens.
     * As opposed to assign, this imposes no restrictions on msg.sender.
     * @param to The address that will receive the minted tokens.
     * @param tokenId The token id to mint.
     * @param label The new subdomain label
     */
    function _assign(address to, uint256 tokenId, string memory label) internal {
        uint256 childId = uint256(keccak256(abi.encodePacked(uint256(tokenId), keccak256(abi.encodePacked(label)))));
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            _setTokenURI(childId, string(abi.encodePacked(label, ".", _tokenURIs[tokenId])));
        }
        _mint(to, childId);
    }

    /**
     * @dev Function to mint subdomain tokens.
     * @param to The address that will receive the minted tokens.
     * @param tokenId The token id to mint.
     * @param label The new subdomain label
     */
    function assign(address to, uint256 tokenId, string calldata label) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: transfer caller is not owner nor approved");
        _assign(to, tokenId, label);
    }
}
