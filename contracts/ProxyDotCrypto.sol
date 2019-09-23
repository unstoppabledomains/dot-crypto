pragma solidity ^0.5.0;

import './DotCrypto.sol';
import './SimpleResolver.sol';

contract ProxyDotCrypto is DotCrypto {
    using ECDSA for *;

    // Mapping from owner to a nonce
    mapping (address => uint256) public nonces;

    function _checkProxySignature(bytes32 hash, uint256 tokenId) internal {
        address owner = ownerOf(tokenId);
        uint256 nonce = nonces[owner];

        require(
            _isApprovedOrOwner(
                recover(toEthSignedMessageHash(hash, signature)),
                tokenId
            ),
            "ProxyDotCrypto: bad signature"
        );

        nonces[owner] += 1;
    }

    function transferFromFor(address from, address to, uint256 tokenId, bytes memory signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(from, to, tokenId, nonce)), signature);
        _transferFrom(from, to, tokenId);
    }

    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes memory signature) external {
        safeTransferFromFor(from, to, tokenId, "", signature);
    }

    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes memory signature, bytes memory _data) external {
        transferFromFor(from, to, tokenId, signature);
        require(_checkOnERC721Received(from, to, tokenId, _data), "ProxyDotCrypto: transfer to non ERC721Receiver implementer");
    }

    function resolveToFor(address to, uint256 tokenId, bytes memory signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(to, tokenId, nonce)), signature);
        _resolveTo(to, tokenId);
    }

    function mintFor(address to, uint256 tokenId, string memory label, bytes memory signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(to, tokenId, label)), signature);
        emit Mint(tokenId, label);
        _mint(to, tokenId, label);
    }

    function burnFor(uint256 tokenId, bytes memory signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(to, tokenId, label)), signature);
        _burn(tokenId);
    }
}