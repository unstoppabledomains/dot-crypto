pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

interface IDataReader {
    /**
     * @dev Function to get resolver address, owner address and requested records.
     * @param keys The keys to query the value of.
     * @param tokenId The token id to fetch.
     * @return Resolver address, owner address and values.
     */
    function getData(string[] calldata keys, uint256 tokenId)
        external
        view
        returns (
            address resolver,
            address owner,
            string[] memory values
        );
    
    /**
     * @dev Function to get resolver address, owner address and requested records.
     * @param keyHashes Key hashes to query the value of.
     * @param tokenId The token id to fetch.
     * @return Resolver address, owner address, keys and values.
     */
    function getDataByHash(uint256[] calldata keyHashes, uint256 tokenId)
        external
        view
        returns (
            address resolver,
            address owner,
            string[] memory keys,
            string[] memory values
        );
}