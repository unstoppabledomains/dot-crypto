pragma solidity ^0.5.0;

/**
 * @title MultiSend
 * @dev Simple a onetime transaction that sends ether to multiple accounts.
 */
contract MultiSend {
    constructor (address payable[] memory accounts, uint256[] memory values) public {
        // solium-disable-next-line error-reason
        require(accounts.length != values.length);
        for(uint i = accounts.length - 1; i >= 0; i--) {
            accounts[i].transfer(values[i]);
        }
        selfdestruct(msg.sender);
    }
}
