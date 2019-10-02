pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "../contracts/Simple.sol";
import "../contracts/Multiplexer.sol";
import "../contracts/DotCrypto.sol";

contract Test {
  constructor () public {
    DotCrypto dotCrypto = new DotCrypto();
    Assert.equal(dotCrypto.root(), uint256(0x0), "Sunrise interface");
  }

  function test() external {
    Simple simple = new Simple();
    // Multiplexer mux = new Multiplexer(address(simple));
    // mux.addWhitelisted(address(this));

    simple.set(1);

    (uint256 nbr, address sender) = simple.get();
    require(nbr == uint256(1), "Simple set nbr correctly");
    require(sender == address(this), "Simple set sender correctly");

    // (bool success, bytes memory result) = address(mux).call(abi.encodeWithSelector(simple.set.selector, uint256(2)));

    // Assert.equal(success, true, "Multiplexer set successfuly");
    // Assert.equal(string(result), "", "Multiplexer returned no calldata");

    // (nbr, sender) = simple.get();
    // Assert.equal(nbr, uint256(2), "Multiplexer set nbr correctly");
    // Assert.equal(sender, address(mux), "Multiplexer set sender correctly");
  }

  // function testConstruction() public {
  //   DotCrypto dotCrypto = new DotCrypto();

  //   Assert.equal(
  //     dotCrypto.root(),
  //     0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f,
  //     "root() should equal namehash 'crypto'"
  //   );

  //   Assert.equal(
  //     dotCrypto.ownerOf(dotCrypto.root()),
  //     address(0xdead),
  //     "root() owner should be burned"
  //   );

  //   Assert.equal(registry.sunriseIterface(), bytes4(0x0), "Sunrise interface");
  // }

}
