pragma solidity 0.5.11;

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

    function setSunrise(uint256 length) public onlyMinter whenSunrise {
        _setSunrise(length);
    }

    function mintSunriseSLD(address to, string calldata label) external whenSunrise {
        uint256 childId = _registry.childOf(_registry.root(), label);
        require(!_tokenSunrises[childId]);
        mintSLD(to, label);
        _tokenSunrises[childId] = true;
        emit SunriseMinted(childId);
    }

    function safeMintSunriseSLD(address to, string calldata label, bytes calldata _data) external whenSunrise {
        uint256 childId = _registry.childOf(_registry.root(), label);
        require(!_tokenSunrises[childId]);
        safeMintSLD(to, label, _data);
        _tokenSunrises[childId] = true;
        emit SunriseMinted(childId);
    }

    function resolveSunriseSLD(uint256 tokenId, bool intent) external onlyMinter whenSunrise {
        require(_tokenSunrises[tokenId]);

        delete _tokenSunrises[tokenId];
        // solium-disable-next-line security/no-low-level-calls
        (bool success, ) = address(_registry).call(abi.encodeWithSelector(_registry.ownerOf.selector, tokenId));
        if (success) {
            if (intent) {
                emit SunriseRenounced(tokenId);
            } else {
                _registry.controlledBurn(tokenId);
            }
        }
    }

    function _setSunrise(uint256 length) internal {
        _sunrise = now.add(length);
        emit NewSunrise(_sunrise);
    }

}
