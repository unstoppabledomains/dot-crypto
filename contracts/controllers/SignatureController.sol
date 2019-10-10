pragma solidity ^0.5.0;

import "./ISignatureController.sol";
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import "../registry/Registry.sol";

// solium-disable error-reason,security/no-block-members

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

    function _childId(uint256 tokenId, string memory label) internal pure returns (uint256) {
        require(bytes(label).length != 0);
        return uint256(keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))));
    }

    function addressToString(address _addr) public pure returns(string memory) {
        bytes32 value = bytes32(uint256(_addr));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint(uint8(value[i + 12] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(value[i + 12] & 0x0f))];
        }
        return string(str);
    }

    function _validate(bytes32 hash, uint256 tokenId, bytes memory signature) internal {
        address owner = _registry.ownerOf(tokenId);
        uint256 nonce = _nonces[owner];
        address recovered = keccak256(abi.encode(hash, nonce)).toEthSignedMessageHash().recover(signature);

        require(owner == recovered, string(abi.encodePacked(addressToString(recovered), " ", addressToString(owner))));

        _nonces[owner] += 1;
    }

    function nonceOf(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    function getValidation(address from, address to, uint256 tokenId) external pure returns (bytes32) {
        return keccak256(abi.encode(this.transferFromFor.selector, from, to, tokenId, ""));
    }

    function transferFromFor(address from, address to, uint256 tokenId, bytes memory signature) public {
        _validate(keccak256(abi.encode(msg.sig, from, to, tokenId, "")), tokenId, signature);
        _registry.controlledTransferFrom(from, to, tokenId);
    }


    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes calldata _data, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, from, to, _data, tokenId)), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, tokenId, _data);
    }

    function safeTransferFromFor(address from, address to, uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, from, to, "", tokenId)), tokenId, signature);
        _registry.controlledSafeTransferFrom(from, to, tokenId, "");
    }

    function resolveToFor(address to, uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, to, tokenId)), tokenId, signature);
        _registry.controlledResolveTo(to, tokenId);
    }

    function burnFor(uint256 tokenId, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, tokenId)), tokenId, signature);
        _registry.controlledBurn(tokenId);
    }

    function mintChildFor(address to, uint256 tokenId, string calldata label, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, to, tokenId, label)), tokenId, signature);
        uint256 childId = _childId(tokenId, label);
        _registry.controlledMint(to, childId);
        _registry.setTokenURI(childId, tokenId, label);
    }

    function transferFromChildFor(address from, address to, uint256 tokenId, string memory label, bytes memory signature) public {
        _validate(keccak256(abi.encode(msg.sig, from, to, tokenId, label)), tokenId, signature);
        uint256 childId = _childId(tokenId, label);
        _registry.controlledTransferFrom(from, to, childId);
    }

    function safeTransferFromChildFor(
        address from,
        address to,
        uint256 tokenId,
        string calldata label,
        bytes calldata _data,
        bytes calldata signature
    ) external {
        _validate(keccak256(abi.encode(msg.sig, from, to, label, _data, tokenId)), tokenId, signature);
        uint256 childId = _childId(tokenId, label);
        _registry.controlledSafeTransferFrom(from, to, childId, _data);
    }

    function safeTransferFromChildFor(address from, address to, uint256 tokenId, string calldata label, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, from, to, label, tokenId)), tokenId, signature);
        uint256 childId = _childId(tokenId, label);
        _registry.controlledSafeTransferFrom(from, to, childId, "");
    }

    function burnChildFor(uint256 tokenId, string calldata label, bytes calldata signature) external {
        _validate(keccak256(abi.encode(msg.sig, tokenId, label)), tokenId, signature);
        uint256 childId = _childId(tokenId, label);
        _registry.controlledBurn(childId);
    }

}
