pragma solidity 0.5.11;

interface ISunriseController {

    /**
     * @dev Returns time left until the end of the sunrise period.
     * @return time to live as an uint256.
     */
    function sunrise() external view returns (uint256);

    /**
     * @dev Returns whether we are currently in a sunrise period
     * @return if we are in the sunrise period
     */
    function isSunriseOver() external view returns (bool);

    /**
     * @dev Returns whether the given token ID is a sunrise domain.
     * @param tokenId uint256 ID of the token to query sunrise status
     * @return time left until the end of the sunrise period.
     */
    function isSunrise(uint256 tokenId) external view returns (bool);

    /**
     * @dev Sets a new sunrise period length.
     * @param length uint256 the new ttl for sunrises.
     */
    function setSunrise(uint256 length) external;

    /**
     * @dev Mints a name that can be revoked during the sunrise period.
     * @param to address to mint the new SLD to.
     * @param label SLD label to mint.
     */
    function mintSunriseSLD(address to, string calldata label) external;
    function safeMintSunriseSLD(address to, string calldata label, bytes calldata _data) external;

    /**
     * @dev Renounces sunrise management or burns a sunrise token ID.
     * @param tokenId uint256 ID of the token to resolve status of.
     * @param intent bool to renounce or burn a token ID.
     */
    function resolveSunriseSLD(uint256 tokenId, bool intent) external;

}
