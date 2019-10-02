pragma solidity ^0.5.0;

import './Registry.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

contract RepresentativeRegistry is Registry {
    using ECDSA for *;

    // TODO: Consider using a counter?
    // Mapping from owner to a nonce
    mapping (address => uint256) private _nonces;

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_REPRESENTITIVE_REGISTRY =
        0x095ea7b3;

    constructor () public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_REPRESENTITIVE_REGISTRY);
    }

    function _requireSignature(
        bytes32 hash,
        uint256 tokenId,
        bytes memory signature
    ) internal {
        address owner = ownerOf(tokenId);
        uint256 nonce = _nonces[owner];

        require(
            _isApprovedOrOwner(
                ECDSA.recover(
                    ECDSA.toEthSignedMessageHash(
                        keccak256(abi.encodePacked(hash, nonce))
                    ),
                    signature
                ),
                tokenId
            ),
            "RepresentativeRegistry: bad signature"
        );

        _nonces[owner] += 1;
    }

    /**
     * @dev Gets the nonce of the specified address.
     * @param addr address to query nonce for
     * @return nonce of the given address
     */
    function nonceOf(address addr) external view returns (uint256) {
        return _nonces[addr];
    }

    /**
     * @dev Transfers the ownership of a given token ID to another address.
     * Usage of this method is discouraged, use `safeTransferFromFor` whenever
     * possible.
     * Requires signature to be signed by the owner, approved, or operator.
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
     * @param signature signature corasponing to `transferFrom` function call
     */
    function transferFromFor(
        address from,
        address to,
        uint256 tokenId,
        bytes memory signature
    ) public {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, from, to, tokenId)),
            tokenId,
            signature
        );
        _transferFrom(from, to, tokenId);
    }

    /**
     * @dev Safely transfers the ownership of given token ID to another address.
     * See `safeTransferFrom` for more details.
     * Requires signature to be signed by the owner, approved, or operator.
     * @param from current owner of the token.
     * @param to address to receive the ownership of the given token ID.
     * @param tokenId uint256 ID of the token to be transferred.
     * @param _data bytes data to send along with a safe transfer check.
     * @param signature corasponing to `safeTransferFrom` function call.
     */
    function safeTransferFromFor(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata _data,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, from, to, _data, tokenId)),
            tokenId,
            signature
        );
        _transferFrom(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId, _data),
            "RepresentativeRegistry: transfer to non ERC721Receiver implementer"
        );
    }

    // TODO: Should we even keep this version around?
    /**
     * @dev Safely transfers the ownership of given token ID to another address
     * See `safeTransferFrom` for more details.
     * Requires signature to be signed by the owner, approved, or operator.
     * @param from current owner of the token.
     * @param to address to receive the ownership of the given token ID.
     * @param tokenId ID of the token to be transferred.
     * @param signature corasponing to `safeTransferFrom` function call.
     */
    function safeTransferFromFor(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, from, to, "", tokenId)),
            tokenId,
            signature
        );
        _transferFrom(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId, ""),
            "RepresentativeRegistry: transfer to non ERC721Receiver implementer"
        );
    }

    /**
     * @dev Sets the resolver of a given token ID to another address.
     * See `resolveTo` for more details.
     * Requires signature to be signed by the owner, approved, or operator.
     * @param to address the given token ID will resolve to.
     * @param tokenId uint256 ID of the token to be transferred.
     * @param signature signature corasponing to `burn` function call.
     */
    function resolveToFor(
        address to,
        uint256 tokenId,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, to, tokenId)),
            tokenId,
            signature
        );
        _resolveTo(to, tokenId);
    }

    /**
     * @dev Burns a specific ERC721 token on behalf of another address.
     * See `burn` for more details.
     * Requires signature to be signed by the owner, approved, or operator.
     * @param tokenId The token id to burn.
     * @param signature signature corasponing to `burn` function call.
     */
    function burnFor(uint256 tokenId, bytes calldata signature) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, tokenId)),
            tokenId,
            signature
        );
        _burn(tokenId);
    }

    function mintChildFor(
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, to, tokenId, label)),
            tokenId,
            signature
        );
        _mintChild(to, tokenId, label);
    }

    function safeMintChildFor(
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata _data,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, to, tokenId, label, _data)),
            tokenId,
            signature
        );
        _safeMintChild(to, tokenId, label, _data);
    }

    function safeMintChildFor(
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, to, tokenId, label)),
            tokenId,
            signature
        );
        _safeMintChild(to, tokenId, label, "");
    }

    function burnChildFor(
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, tokenId, label)),
            tokenId,
            signature
        );
        _burn(_childId(tokenId, label));
    }

    function transferChildFromFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, from, to, tokenId, label)),
            tokenId,
            signature
        );
        _transferFrom(from, to, _childId(tokenId, label));
    }

    function safeTransferChildFromFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata _data,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(
                abi.encodePacked(msg.sig, from, to, tokenId, label, _data)
            ),
            tokenId,
            signature
        );
        uint256 childId = _childId(tokenId, label);
        _transferFrom(from, to, childId);
        _checkOnERC721Received(from, to, childId, _data);
    }

    function safeTransferChildFromFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    ) external {
        _requireSignature(
            keccak256(abi.encodePacked(msg.sig, from, to, tokenId, label)),
            tokenId,
            signature
        );
        uint256 childId = _childId(tokenId, label);
        _transferFrom(from, to, childId);
        _checkOnERC721Received(from, to, childId, "");
    }
}
