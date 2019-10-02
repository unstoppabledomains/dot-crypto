pragma solidity >=0.4.25 <0.6.0;

import "truffle/Assert.sol";
import "../contracts/DotCrypto.sol";

contract TestDotCrypto {
    DotCrypto dotCrypto;

    function beforeEach() public {
            dotCrypto = new DotCrypto();
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

    function testConstruction() public {
        Assert.equal(
            dotCrypto.root(),
            0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f,
            "root() should equal namehash 'crypto'"
        );

        Assert.equal(
            dotCrypto.ownerOf(dotCrypto.root()),
            address(0xdead),
            "root() owner should be burned"
        );
    }

    // function testMetadata() public {
    //     Assert.equal(
    //         dotCrypto.tokenURI(dotCrypto.root()),
    //         "dotcrypto:crypto.",
    //         "root() owner should be burned"
    //     );

    //     dotCrypto.mintSLD(address(this), "sld");

    //     Assert.equal(
    //         dotCrypto.tokenURI(_childId(dotCrypto.root(), "sld")),
    //         "dotcrypto:sld.crypto.",
    //         "root() owner should be burned"
    //     );
    // }
}
