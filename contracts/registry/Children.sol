pragma solidity 0.5.11;

import "./Metadata.sol";
import "./IChildren.sol";

// solium-disable error-reason

contract Children is IChildren, Metadata {

    /// Minting

    function mintChild(address to, uint256 tokenId, string calldata label) external onlyApprovedOrOwner(tokenId) {
        _mintChild(to, tokenId, label);
    }

    function safeMintChild(address to, uint256 tokenId, string calldata label) external onlyApprovedOrOwner(tokenId) {
        _safeMintChild(to, tokenId, label, "");
    }

    function safeMintChild(address to, uint256 tokenId, string calldata label, bytes calldata _data)
        external
        onlyApprovedOrOwner(tokenId)
    {
        _safeMintChild(to, tokenId, label, _data);
    }

    function controlledMintChild(address to, uint256 tokenId, string calldata label) external onlyController {
        _mintChild(to, tokenId, label);
    }

    function controlledSafeMintChild(address to, uint256 tokenId, string calldata label, bytes calldata _data)
        external
        onlyController
    {
        _safeMintChild(to, tokenId, label, _data);
    }

    /// Transfering

    function transferFromChild(address from, address to, uint256 tokenId, string memory label)
        public
        onlyApprovedOrOwner(tokenId)
    {
        _transferFrom(from, to, _childId(tokenId, label));
    }

    function safeTransferFromChild(
        address from,
        address to,
        uint256 tokenId,
        string memory label,
        bytes memory _data
    ) public onlyApprovedOrOwner(tokenId) {
        uint256 childId = _childId(tokenId, label);
        _transferFrom(from, to, childId);
        require(_checkOnERC721Received(address(0), to, childId, _data));
    }

    function safeTransferFromChild(address from, address to, uint256 tokenId, string calldata label) external {
        safeTransferFromChild(from, to, tokenId, label, "");
    }

    function burnChild(uint256 tokenId, string calldata label) external onlyApprovedOrOwner(tokenId) {
        _burn(_childId(tokenId, label));
    }

    /// Internal functions

    function _mintChild(address to, uint256 tokenId, string memory label) internal {
        uint256 childId = _childId(tokenId, label);
        _mint(to, childId);
        _setTokenURI(tokenId, label);
    }

    function _safeMintChild(address to, uint256 tokenId, string memory label, bytes memory _data) internal {
        _mintChild(to, tokenId, label);
        require(_checkOnERC721Received(address(0), to, _childId(tokenId, label), _data));
    }

}