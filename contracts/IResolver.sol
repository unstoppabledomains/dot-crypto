pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

contract IResolver {
    /**
     * @dev Reset all domain records and set new ones
     * @param keys New record keys
     * @param values New record values
     * @param tokenId uint256 ID of the domain
     */
    function reconfigure(string[] memory keys, string[] memory values, uint256 tokenId) public;

    /**
     * @dev Set or update domain records
     * @param keys New record keys
     * @param values New record values
     * @param tokenId uint256 ID of the domain
     */
    function setMany(string[] memory keys, string[] memory values, uint256 tokenId) public;

    /**
     * @dev Function to set record.
     * @param key The key set the value of.
     * @param value The value to set key to.
     * @param tokenId The token id to set.
     */
    function set(string calldata key, string calldata value, uint256 tokenId) external;
}
