pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../IRegistry.sol";
import "../IResolver.sol";

interface LinkTokenInterface {
  function transfer(address to, uint256 value) external returns (bool success);
}

contract TwitterValidationOperator is WhitelistedRole {
    using SafeMath for uint256;

    event Validation(uint256 indexed tokenId);

    uint256 public _withdrawableTokens;
    uint256 public _paymentPerValidation;

    IRegistry internal _registry;
    LinkTokenInterface internal _linkToken;

    /**
    * @notice Deploy with the address of the LINK token and .crypto domains registry and payment amount in LINK for one valiation
    * @dev Sets the LinkToken address, .crypto registry address and payment in LINK tokens for one validation
    * @param registry The address of the .crypto registry
    * @param linkToken The address of the LINK token
    * @param payment Payment amount in LINK tokens for one validation
    */
    constructor (IRegistry registry, LinkTokenInterface linkToken, uint256 payment) public {
        _registry = registry;
        _linkToken = linkToken;
        _paymentPerValidation = payment;
    }

    /**
    * @dev Reverts if amount requested is greater than withdrawable balance
    * @param amount The given amount to compare to `_withdrawableTokens`
    */
    modifier hasAvailableFunds(uint256 amount) {
        require(_withdrawableTokens >= amount, "Amount requested is greater than withdrawable balance");
        _;
    }

    /**
     * @notice Method will be called by Chainlink node in the end of the job. Provides user twitter name and validation signature.
     * @dev Sets twitter username and signature to .crypto domain records.
     * @param
     */
    function setValidation(string calldata username, string calldata signature, uint256 tokenId) external onlyWhitelisted {
        _withdrawableTokens = _withdrawableTokens.add(_paymentPerValidation);
        address resolver = _registry.resolverOf(tokenId);
        IResolver(resolver).set("social.twitter.username", username, tokenId);
        IResolver(resolver).set("validation.social.twitter.username", signature, tokenId);
        emit Validation(tokenId);
    }

    /**
    * @notice Allows the node operator to withdraw earned LINK to a given address
    * @dev The owner of the contract can be another wallet and does not have to be a Chainlink node
    * @param recipient The address to send the LINK token to
    * @param amount The amount to send (specified in wei)
    */
    function withdraw(address recipient, uint256 amount) external onlyWhitelistAdmin hasAvailableFunds(amount) {
        _withdrawableTokens = _withdrawableTokens.sub(amount);
        assert(_linkToken.transfer(recipient, amount));
    }

}
