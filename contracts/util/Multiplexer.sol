pragma solidity 0.5.11;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";

/**
 * @title Multiplexer
 * @dev Forwards whitelisted account calls a specified contract.
 */
contract Multiplexer is WhitelistedRole {

    address internal _account;

    constructor(address account) public {
        uint256 size;
        // retrieve the size of the code at account, non-zero values are contracts
        // solium-disable-next-line security/no-inline-assembly
        assembly { size := extcodesize(account) }
        require(size > 0, "Multiplexer: account must be a contract");
        _account = account;
    }

    /**
    * @dev Fallback function allowing to perform the call to the given account.
    * This function will return whatever the forwarded call returns
    */
    function () external payable onlyWhitelisted {
        // Load account into memory
        address account = _account;

        // We use the same pointer to store both input and output calldata
        // Create the pointer ptr in memory
        // Notice we didn't declare ptr like `let ptr := mload(0x40)` inside the assembly.
        // This is because we inherit from WhitelistedRole.
        uint256 ptr;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            // Copy the calldata into the pointer
            calldatacopy(ptr, 0, calldatasize)

            // Call the contract
            // Reference: call(g, a, v, in, insize, out, outsize)
            let result := call(gas, account, callvalue, ptr, calldatasize, 0, 0)

            // Copy the returndata into ptr
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            // Check to make sure that the last call didn't fail
            if eq(result, 0) { revert(ptr, size) }
            return(ptr, size)
        }
    }

}