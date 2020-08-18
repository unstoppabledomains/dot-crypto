pragma solidity 0.5.12;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";

contract IRegistryReader is IERC165, IERC721Metadata {
    /**
     * @dev Returns whether the given spender can transfer a given token ID. Registry related function.
     * @param spender address of the spender to query
     * @param tokenId uint256 ID of the token to be transferred
     * @return bool whether the msg.sender is approved for the given token ID,
     * is an operator of the owner, or is the owner of the token
     */
    function isApprovedOrOwner(address spender, uint256 tokenId) external view returns (bool);

    /**
     * @dev Gets the resolver of the specified token ID. Registry related function.
     * @param tokenId uint256 ID of the token to query the resolver of
     * @return address currently marked as the resolver of the given token ID
     */
    function resolverOf(uint256 tokenId) external view returns (address);

    /**
     * @dev Provides child token (subdomain) of provided tokenId. Registry related function.
     * @param tokenId uint256 ID of the token
     * @param label label of subdomain (for `aaa.bbb.crypto` it will be `aaa`)
     */
    function childIdOf(uint256 tokenId, string calldata label) external pure returns (uint256);

    /**
     * @dev Controller related function.
     * @return bool whether the account is a controller
     */
    function isController(address account) public view returns (bool);

    /**
     * @dev Returns the number of NFTs in `owner`'s account. ERC721 related function.
     */
    function balanceOf(address owner) public view returns (uint256 balance);

    /**
     * @dev Returns the owner of the NFT specified by `tokenId`. ERC721 related function.
     */
    function ownerOf(uint256 tokenId) public view returns (address owner);
    
    /**
     * @dev ERC721 related function.
     */
    function getApproved(uint256 tokenId) public view returns (address operator);
    
    /**
     * @dev ERC721 related function.
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool);

    /**
     * @dev Registry related function.
     * @return root hash.
     */
    function root() public pure returns (uint256);
}