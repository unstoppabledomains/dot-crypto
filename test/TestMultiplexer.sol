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

    Simple muxSimple = Simple(address(mux));

    simple.set(1);

    (uint256 nbr, address sender) = simple.get();
    require(nbr == uint256(1), "Simple set nbr correctly");
    require(sender == address(this), "Simple set sender correctly");

    muxSimple.set(2);

    (nbr, sender) = simple.get();
    Assert.equal(nbr, uint256(2), "Multiplexer set nbr correctly");
    Assert.equal(sender, address(mux), "Multiplexer set sender correctly");

    (nbr, sender) = muxSimple.get();

    Assert.equal(nbr, uint256(2), "Multiplexer get nbr correctly");
    Assert.equal(sender, address(mux), "Multiplexer get sender correctly");
  }
}