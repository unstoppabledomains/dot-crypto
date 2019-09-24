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

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_REGISTRY = 0x095ea7b3;

    constructor () public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_REGISTRY);
    }

    function _childId(uint256 tokenId, string memory label) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(uint256(tokenId), keccak256(abi.encodePacked(label)))));
    }

    function mintChild(address to, uint256 tokenId, string memory label) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: mint mintChild is not owner nor approved");
        uint256 childId = _childId(tokenId, label);
        _mint(to, childId);
    }

    function safeMintChild(address to, uint256 tokenId, string memory label, bytes memory _data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: safeMintChild caller is not owner nor approved");
        uint256 childId = _childId(tokenId, label);
        _mint(to, childId);
        _checkOnERC721Received(address(0x0), to, tokenId, _data);
    }

    function safeMintChild(address to, uint256 tokenId, string calldata label) external {
        safeMintChild(to, tokenId, label, "");
    }

    function burnChild(uint256 tokenId, string calldata label) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: burnChild caller is not owner nor approved");
        uint256 childId = _childId(tokenId, label);
        _burn(childId);
    }

    function transferChildFrom(address from, address to, uint256 tokenId, string calldata label) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: transferChildFrom caller is not owner nor approved");
        uint256 childId = _childId(tokenId, label);
        transferFrom(from, to, childId);
    }

    function safeTransferChildFrom(address from, address to, uint256 tokenId, string memory label, bytes memory _data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Registry: safeTransferChildFrom caller is not owner nor approved");
        uint256 childId = _childId(tokenId, label);
        transferFrom(from, to, childId);
        _checkOnERC721Received(from, to, childId, _data);
    }

    function safeTransferChildFrom(address from, address to, uint256 tokenId, string calldata label) external {
        safeTransferChildFrom(from, to, tokenId, label, "");
    }
}
