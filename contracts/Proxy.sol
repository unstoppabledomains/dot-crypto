pragma solidity ^0.5.0;

/**
 * @title Proxy
 * @dev Forwards account call to a logic contracts. Each proxied
 * function call costs an extra 1003 gas.
 */
contract Proxy {

    constructor(address account) public {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            // 0x6000 (max number of bytes inside a solidity program) * 0x20 (the size of one word)
            // Using a uint32 saves us ~4000 gas when compared to a uint256
            sstore(0x000c0000, account)
        }
    }

    function () external payable {
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            // We use the same pointer to store both input and output calldata
            // Create the pointer ptr in memory
            let ptr := mload(0x40)

            // Copy the calldata into the pointer
            calldatacopy(ptr, 0, calldatasize)

            // Call the contract
            // Reference: delegatecall(g, a, in, insize, out, outsize)
            let result := delegatecall(gas, sload(0x000c0000), ptr, calldatasize, 0, 0)

            // Copy the returndata into ptr
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            // Check to make sure that the last call didn't fail
            if eq(result, 0) { revert(ptr, size) }
            return(ptr, size)
        }
    }
}

