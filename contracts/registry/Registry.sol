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

    /**
     * @dev Throws if called by any account other than approved or owner.
     */
    modifier onlyApprovedOrOwner(uint256 tokenId) {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Registry: caller is not approved or owner"
        );
        _;
    }

    constructor () public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_REGISTRY);
    }

    function _childId(
        uint256 tokenId,
        string memory label
    ) internal pure returns (uint256) {
        require(
            bytes(label).length != 0,
            "Registry: label length must be greater than zero"
        );
        return uint256(
            keccak256(
                abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))
            )
        );
    }

    function _mintChild(
        address to,
        uint256 tokenId,
        string memory label
    ) internal {
        uint256 childId = _childId(tokenId, label);
        _mint(to, childId);
        _setTokenURI(
            childId,
            string(abi.encodePacked(label, ".", _tokenURIs[tokenId]))
        );
    }

    function mintChild(
        address to,
        uint256 tokenId,
        string memory label
    ) public onlyApprovedOrOwner(tokenId) {
        _mintChild(to, tokenId, label);
    }

    function _safeMintChild(
        address to,
        uint256 tokenId,
        string memory label,
        bytes memory _data
    ) internal {
        uint256 childId = _childId(tokenId, label);
        _mint(to, childId);
        _setTokenURI(
            childId,
            string(abi.encodePacked(label, ".", _tokenURIs[tokenId]))
        );
        _checkOnERC721Received(address(0x0), to, tokenId, _data);
    }

    function safeMintChild(
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata _data
    ) external onlyApprovedOrOwner(tokenId) {
        _safeMintChild(to, tokenId, label, _data);
    }

    function safeMintChild(
        address to,
        uint256 tokenId,
        string calldata label
    ) external onlyApprovedOrOwner(tokenId) {
        _safeMintChild(to, tokenId, label, "");
    }

    function burnChild(
        uint256 tokenId,
        string calldata label
    ) external onlyApprovedOrOwner(tokenId)  {
        _burn(_childId(tokenId, label));
    }

    function transferChildFrom(
        address from,
        address to,
        uint256 tokenId,
        string calldata label
    ) external onlyApprovedOrOwner(tokenId) {
        _transferFrom(from, to, _childId(tokenId, label));
    }

    function safeTransferChildFrom(
        address from,
        address to,
        uint256 tokenId,
        string memory label,
        bytes memory _data
    ) public onlyApprovedOrOwner(tokenId) {
        uint256 childId = _childId(tokenId, label);
        _transferFrom(from, to, childId);
        _checkOnERC721Received(from, to, childId, _data);
    }

    function safeTransferChildFrom(
        address from,
        address to,
        uint256 tokenId,
        string calldata label
    ) external {
        safeTransferChildFrom(from, to, tokenId, label, "");
    }
}
