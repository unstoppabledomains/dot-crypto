pragma solidity ^0.5.0;

import "./MintingController.sol";
import "./ISunriseController.sol";
import "../registry/Registry.sol";

// solium-disable error-reason,security/no-block-members

/**
 * @title SunriseController
 * @dev Further refines the functions for distribution of Second Level Domains (SLD)s.
 * Adds revokable trademarked "sunrise" domains.
 */
contract SunriseController is ISunriseController, MintingController {

    using SafeMath for uint256;

    event NewSunrise(uint256 sunrise);
    event SunriseMinted(uint256 indexed tokenId);
    event SunriseRenounced(uint256 indexed tokenId);

    // Optional mapping for sunrise times
    mapping(uint256 => bool) private _tokenSunrises;

    // Sunrise end
    uint256 private _sunrise;

    constructor (Registry registry, uint256 sunrise) public MintingController(registry) {
        _setSunrise(sunrise);
    }

    modifier whenSunrise() {
        require(_sunrise > now, "whenSunrise");
        _;
    }

    function sunrise() external view whenSunrise returns (uint256) {
        return _sunrise - now;
    }

    function isSunriseOver() external view returns (bool) {
        return _sunrise <= now;
    }

    function isSunrise(uint256 tokenId) external view whenSunrise returns (bool) {
        require(_registry.ownerOf(tokenId) != address(0));
        return _tokenSunrises[tokenId];
    }

    function _setSunrise(uint256 length) internal {
        _sunrise = now.add(length);
        emit NewSunrise(_sunrise);
    }

    function setSunrise(uint256 length) public onlyMinter whenSunrise {
        _setSunrise(length);
    }

    function mintSunriseSLD(address to, string calldata label) external whenSunrise {
        uint256 childId = _childId(root(), label);
        _tokenSunrises[childId] = true;
        mintSLD(to, label);
        emit SunriseMinted(childId);
    }

    function safeMintSunriseSLD(address to, string calldata label, bytes calldata _data) external whenSunrise {
        uint256 childId = _childId(root(), label);
        _tokenSunrises[childId] = true;
        safeMintSLD(to, label, _data);
        emit SunriseMinted(childId);
    }

    function mintSLD(address to, string memory label) public {
        require(!_tokenSunrises[_childId(root(), label)]);
        super.mintSLD(to, label);
    }

    function safeMintSLD(address to, string memory label, bytes memory _data) public {
        require(!_tokenSunrises[_childId(root(), label)]);
        super.safeMintSLD(to, label, _data);
    }

    function resolveSunriseSLD(uint256 tokenId, bool intent) external onlyMinter whenSunrise {
        require(_tokenSunrises[tokenId]);

        // solium-disable-next-line security/no-low-level-calls
        (bool success, ) = address(_registry).call(abi.encodeWithSelector(_registry.ownerOf.selector, tokenId));
        if (success) {
            if (intent) {
                delete _tokenSunrises[tokenId];
                emit SunriseRenounced(tokenId);
            } else {
                _registry.controlledBurn(tokenId);
            }
        } else {
            // This means that tokenId was previously burned on the registry
            delete _tokenSunrises[tokenId];
        }
    }

}
