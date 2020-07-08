pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "@openzeppelin/contracts/access/roles/CapperRole.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../IRegistry.sol";
import "../IResolver.sol";

interface LinkTokenInterface {
  function transfer(address to, uint256 value) external returns (bool success);
  function balanceOf(address _owner) external view returns (uint256 balance);
}

contract TwitterValidationOperator is WhitelistedRole, CapperRole {
    using SafeMath for uint256;

    event Validation(uint256 indexed tokenId);
    event PaymentSet(uint256 paymentPerValidation);

    uint256 public withdrawableTokens;
    uint256 public paymentPerValidation;

    IRegistry internal Registry;
    LinkTokenInterface internal LinkToken;

    /**
    * @notice Deploy with the address of the LINK token, domains registry and payment amount in LINK for one valiation
    * @dev Sets the LinkToken address, Registry address and payment in LINK tokens for one validation
    * @param _registry The address of the .crypto Registry
    * @param _linkToken The address of the LINK token
    * @param _paymentCappers Addresses allowed to update payment amount per validation
    */
    constructor (IRegistry _registry, LinkTokenInterface _linkToken, address[] memory _paymentCappers) public {
        require(paymentPerValidation >= 0, "Payment for one validation must be positive or zero");
        require(address(_registry) != address(0), "Registry address can not be zero");
        require(address(_linkToken) != address(0), "LINK token address can not be zero");
        require(_paymentCappers.length > 0, "You should provide at least one address for setting payment per validation");
        Registry = _registry;
        LinkToken = _linkToken;
        uint256 cappersCount = _paymentCappers.length;
        for (uint256 i = 0; i < cappersCount; i++) {
            addCapper(_paymentCappers[i]);
        }
        renounceCapper();
    }

    /**
    * @dev Reverts if amount requested is greater than withdrawable balance
    * @param _amount The given amount to compare to `withdrawableTokens`
    */
    modifier hasAvailableFunds(uint256 _amount) {
        require(withdrawableTokens >= _amount, "Amount requested is greater than withdrawable balance");
        _;
    }

    /**
     * @dev Reverts if contract doesn not have enough LINK tokens to fulfil validation
     */
    modifier hasAvailableBalance() {
        require(LinkToken.balanceOf(address(this)) >= withdrawableTokens.add(paymentPerValidation), "Not enough of LINK tokens on balance");
        _;
    }

    /**
     * @notice Method will be called by Chainlink node in the end of the job. Provides user twitter name and validation signature
     * @dev Sets twitter username and signature to .crypto domain records
     * @param _username Twitter username
     * @param _signature Signed twitter username. Ensures the validity of twitter username
     * @param _tokenId Domain token ID
     */
    function setValidation(string calldata _username, string calldata _signature, uint256 _tokenId)
      external
      onlyWhitelisted
      hasAvailableBalance {
        withdrawableTokens = withdrawableTokens.add(paymentPerValidation);
        IResolver Resolver = IResolver(Registry.resolverOf(_tokenId));
        Resolver.set("social.twitter.username", _username, _tokenId);
        Resolver.set("validation.social.twitter.username", _signature, _tokenId);
        emit Validation(_tokenId);
    }

    /**
     * @notice Method allows to update payment per one validation in LINK tokens
     * @dev Sets paymentPerValidation variable
     * @param _paymentPerValidation Amount in LINK tokens
     */
    function setPaymentPerValidation(uint256 _paymentPerValidation) external onlyCapper {
        paymentPerValidation = _paymentPerValidation;
        emit PaymentSet(paymentPerValidation);
    }

    /**
    * @notice Allows the node operator to withdraw earned LINK to a given address
    * @dev The owner of the contract can be another wallet and does not have to be a Chainlink node
    * @param _recipient The address to send the LINK token to
    * @param _amount The amount to send (specified in wei)
    */
    function withdraw(address _recipient, uint256 _amount) external onlyWhitelistAdmin hasAvailableFunds(_amount) {
        withdrawableTokens = withdrawableTokens.sub(_amount);
        assert(LinkToken.transfer(_recipient, _amount));
    }

}
