pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "../contracts/util/Multiplexer.sol";
import "./Simple.sol";

// solium-disable security/no-low-level-calls

contract TestMultiplexer {
  function test() external {
    Simple simple = new Simple();
    Multiplexer mux = new Multiplexer(address(simple));
    mux.addWhitelisted(address(this));

    simple.set(1);

    (uint256 nbr, address sender) = simple.get();
    require(nbr == uint256(1), "Simple set nbr correctly");
    require(sender == address(this), "Simple set sender correctly");

    (bool success, bytes memory result) = address(mux).call(abi.encodeWithSelector(simple.set.selector, uint256(2)));

    Assert.equal(success, true, "Multiplexer set successfuly");
    Assert.equal(string(result), "", "Multiplexer returned no calldata");

    (nbr, sender) = simple.get();
    Assert.equal(nbr, uint256(2), "Multiplexer set nbr correctly");
    Assert.equal(sender, address(mux), "Multiplexer set sender correctly");
  }
}