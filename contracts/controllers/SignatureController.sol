pragma solidity 0.5.11;

import "./ISignatureController.sol";
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import "../registry/Registry.sol";

// solium-disable error-reason

/**
 * @title SignatureController
 * @dev The SignatureController allows any account to submit select management
 * transactions on behalf of a token owner.
 */
contract SignatureController is ISignatureController {

    using ECDSA for bytes32;

    // Mapping from owner to a nonce
    mapping (address => uint256) private _nonces;

    Registry internal _registry;

    constructor (Registry registry) public {
        _registry = registry;
    }

    function nonceOf(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    function transferFromFor(address from, address to, uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, tokenId, "")), tokenId, signature);
        _registry.controlledTransferFrom(from, to, tokenId);
    }

    function safeTransferFromFor(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata _data,
        bytes calldata signature
    )
        external
    {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, tokenId, _data, "")), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, tokenId, _data);
    }

    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, "", tokenId)), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, tokenId, "");
    }

    function resolveToFor(address to, uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, to, tokenId, "")), tokenId, signature);
        _registry.controlledResolveTo(to, tokenId);
    }

    function burnFor(uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, tokenId, "")), tokenId, signature);
        _registry.controlledBurn(tokenId);
    }

    function mintChildFor(address to, uint256 tokenId, string calldata label, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, to, tokenId, label, "")), tokenId, signature);
        _registry.controlledMintChild(to, tokenId, label);
    }

    function transferFromChildFor(
        address from,
        address to,
        uint256 tokenId,
        string memory label,
        bytes memory signature
    )
        public
    {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, tokenId, label, "")), tokenId, signature);
        _registry.controlledTransferFrom(from, to, _registry.childOf(tokenId, label));
    }

    function safeTransferFromChildFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata _data,
        bytes calldata signature
    )
        external
    {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, tokenId, label, _data, "")), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, _registry.childOf(tokenId, label), _data);
    }

    function safeTransferFromChildFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata signature
    )
        external
    {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, from, to, tokenId, label, "")), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, _registry.childOf(tokenId, label), "");
    }

    function burnChildFor(uint256 tokenId, string calldata label, bytes calldata signature) external {
        _validate(keccak256(abi.encodeWithSelector(msg.sig, tokenId, label, "")), tokenId, signature);
        _registry.controlledBurn(_registry.childOf(tokenId, label));
    }

    function _validate(bytes32 hash, uint256 tokenId, bytes memory signature) internal {
        address owner = _registry.ownerOf(tokenId);
        uint256 nonce = _nonces[owner];

        require(owner == keccak256(abi.encodePacked(hash, nonce)).toEthSignedMessageHash().recover(signature));

        _nonces[owner] += 1;
    }

}
