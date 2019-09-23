pragma solidity ^0.5.0;

import './DotCrypto.sol';
import './SimpleResolver.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

contract ProxyDotCrypto is DotCrypto {
    using ECDSA for *;

    // Mapping from owner to a nonce
    mapping (address => uint256) public nonces;

    function _checkProxySignature(bytes32 hash, uint256 tokenId, bytes memory signature) internal {
        address owner = ownerOf(tokenId);
        uint256 nonce = nonces[owner];

        require(
            _isApprovedOrOwner(
                ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(hash, nonce))), signature),
                tokenId
            ),
            "ProxyDotCrypto: bad signature"
        );

        nonces[owner] += 1;
    }

    function transferFromFor(address from, address to, uint256 tokenId, bytes memory signature) public {
        _checkProxySignature(keccak256(abi.encodePacked(from, to, tokenId)), tokenId, signature);
        _transferFrom(from, to, tokenId);
    }

    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes memory signature, bytes memory _data) public {
        transferFromFor(from, to, tokenId, signature);
        require(_checkOnERC721Received(from, to, tokenId, _data), "ProxyDotCrypto: transfer to non ERC721Receiver implementer");
    }

        function safeTransferFromFor(address from, address to, uint256 tokenId, bytes calldata signature) external {
        safeTransferFromFor(from, to, tokenId, "", signature);
    }

    function resolveToFor(address to, uint256 tokenId, bytes calldata signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(to, tokenId)), tokenId, signature);
        _resolveTo(to, tokenId);
    }

    function mintFor(address to, uint256 tokenId, string calldata label, bytes calldata signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(to, tokenId, label)), tokenId, signature);
        emit Mint(tokenId, label);
        _mint(to, uint256(keccak256(abi.encodePacked(uint256(tokenId), keccak256(abi.encodePacked(label))))));
    }

    function burnFor(uint256 tokenId, bytes calldata signature) external {
        _checkProxySignature(keccak256(abi.encodePacked(tokenId)), tokenId, signature);
        _burn(tokenId);
    }
}