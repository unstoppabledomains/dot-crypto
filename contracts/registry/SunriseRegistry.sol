pragma solidity ^0.5.0;

import './Registry.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';

// TODO: use SafeMath
// TODO: calc sunrise
// TODO: Ownable is only an example we should probably have a root node ownership thing

contract SunriseRegistry is Registry, Ownable {

    event Sunrise(uint256 indexed tokenId, uint256 sunrise, uint256 deposit);
    event SunriseClosed(uint256 indexed tokenId, bool indexed accepted);

    // Optional mapping for sunrise times
    mapping(uint256 => uint256) private _tokenSunrises;

    // Optional mapping for sunrise deposits
    mapping(uint256 => uint256) private _tokenSunriseDeposits;

    // Claimable sunrise balance
    uint256 private _sunriseFund;

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_SUNRISE_REGISTRY = 0x095ea7b3;

    constructor () public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_SUNRISE_REGISTRY);
    }

    // TODO: subtract
    function sunriseOf(uint256 tokenId) external view returns (uint256) {
        uint256 sunrise = _tokenSunrises[tokenId];
        require(sunrise != 0, "SunriseRegistry: query for nonexistent sunrise");
        return sunrise;
    }

    function _isSunriseExpired(uint256 tokenId) private view returns (bool) {
        // TODO: flesh out
        uint256 sunrise = _tokenSunrises[tokenId];
        return sunrise != 0;
    }

    function openSunrise(address to, uint256 tokenId, string calldata label) external payable onlyOwner {
        // TODO: Requires no previous sunrise
        uint256 childId = _childId(tokenId, label);
        _tokenSunriseDeposits[childId] = msg.value;
        _tokenSunrises[childId] = now;
        emit Sunrise(childId, now, msg.value);
        _mint(to, childId);
        _checkOnERC721Received(address(0x0), to, tokenId, "");
    }

    function closeSunrise(uint256 tokenId, bool intent) external onlyOwner {
        if (_tokenSunrises[tokenId] < now || intent) {
            _sunriseFund += _tokenSunriseDeposits[tokenId];
            delete _tokenSunriseDeposits[tokenId];
            delete _tokenSunrises[tokenId];
            emit SunriseClosed(tokenId, true);
        } else {
            uint256 deposit = _tokenSunriseDeposits[tokenId];
            delete _tokenSunriseDeposits[tokenId];
            _burn(tokenId);
            address payable owner = address(uint160(ownerOf(tokenId)));
            owner.transfer(deposit);
            emit SunriseClosed(tokenId, false);
        }
    }

    function withdrawSunriseFundTo(address payable addr) external onlyOwner {
        uint256 amount = _sunriseFund;
        _sunriseFund = 0;
        addr.transfer(amount);
    }
}