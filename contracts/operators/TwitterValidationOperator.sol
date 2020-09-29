pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "@openzeppelin/contracts/access/roles/CapperRole.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.5/interfaces/LinkTokenInterface.sol";
import "../util/ERC677Receiver.sol";
import "../IRegistry.sol";
import "../IResolver.sol";

contract TwitterValidationOperator is WhitelistedRole, CapperRole, ERC677Receiver {
    using SafeMath for uint256;

    event Validation(uint256 indexed tokenId, uint256 requestId, uint256 paymentAmount);
    event ValidationRequest(uint256 indexed tokenId, address indexed owner, uint256 requestId, string code);
    event PaymentSet(uint256 operatorPaymentPerValidation, uint256 userPaymentPerValidation);

    uint256 public operatorPaymentPerValidation;
    uint256 public userPaymentPerValidation;
    uint256 public withdrawableTokens;

    uint256 private frozenTokens;
    uint256 private lastRequestId = 1;
    mapping(uint256 => uint256) private userRequests;
    IRegistry private Registry;
    LinkTokenInterface private LinkToken;

    /**
    * @notice Deploy with the address of the LINK token, domains registry and payment amount in LINK for one valiation
    * @dev Sets the LinkToken address, Registry address and payment in LINK tokens for one validation
    * @param _registry The address of the .crypto Registry
    * @param _linkToken The address of the LINK token
    * @param _paymentCappers Addresses allowed to update payment amount per validation
    */
    constructor (IRegistry _registry, LinkTokenInterface _linkToken, address[] memory _paymentCappers) public {
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
        require(
            availableBalance() >= withdrawableTokens.add(operatorPaymentPerValidation),
            "Not enough of LINK tokens on balance"
        );
        _;
    }

    /**
     * @dev Reverts if method called not from LINK token contract
     */
    modifier linkTokenOnly() {
        require(msg.sender == address(LinkToken), "Method can be invoked from LinkToken smart contract only");
        _;
    }

    /**
     * @dev Reverts if user sent incorrect amount of LINK tokens
     */
    modifier correctTokensAmount(uint256 _value) {
        require(_value == userPaymentPerValidation, "Amount should be equal to userPaymentPerValidation");
        _;
    }

    /**
     * @notice Method will be called by Chainlink node in the end of the job. Provides user twitter name and validation signature
     * @dev Sets twitter username and signature to .crypto domain records
     * @param _username Twitter username
     * @param _signature Signed twitter username. Ensures the validity of twitter username
     * @param _tokenId Domain token ID
     * @param _requestId Request id for validations were requested from Smart Contract. If validation was requested from operator `_requestId` should be equals to zero.
     */
    function setValidation(string calldata _username, string calldata _signature, uint256 _tokenId, uint256 _requestId)
    external
    onlyWhitelisted
    hasAvailableBalance {
        uint256 _payment = calculatePaymentForValidation(_requestId);
        withdrawableTokens = withdrawableTokens.add(_payment);
        IResolver Resolver = IResolver(Registry.resolverOf(_tokenId));
        Resolver.set("social.twitter.username", _username, _tokenId);
        Resolver.set("validation.social.twitter.username", _signature, _tokenId);
        emit Validation(_tokenId, _requestId, _payment);
    }

    /**
    * @notice Method returns true if Node Operator able to set validation
    * @dev Returns true or error
    */
    function canSetOperatorValidation() external view onlyWhitelisted hasAvailableBalance returns (bool) {
        return true;
    }

    /**
     * @notice Method allows to update payments per one validation in LINK tokens
     * @dev Sets operatorPaymentPerValidation and userPaymentPerValidation variables
     * @param _operatorPaymentPerValidation Payment amount in LINK tokens when verification initiated via Operator
     * @param _userPaymentPerValidation Payment amount in LINK tokens when verification initiated directly by user via Smart Contract call
     */
    function setPaymentPerValidation(uint256 _operatorPaymentPerValidation, uint256 _userPaymentPerValidation) external onlyCapper {
        operatorPaymentPerValidation = _operatorPaymentPerValidation;
        userPaymentPerValidation = _userPaymentPerValidation;
        emit PaymentSet(operatorPaymentPerValidation, userPaymentPerValidation);
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

    /**
    * @notice Initiate Twitter validation
    * @dev Method invoked when LINK tokens transferred via transferAndCall method. Requires additional encoded data
    * @param _sender Original token sender
    * @param _value Tokens amount
    * @param _data Encoded additional data needed to initiate domain verification: `abi.encode(uint256 tokenId, string code)`
    */
    function onTokenTransfer(address _sender, uint256 _value, bytes calldata _data) external linkTokenOnly correctTokensAmount(_value) {
        uint256 _tokenId;
        string memory _code;
        (_tokenId, _code) = abi.decode(_data, (uint256, string));
        address _owner = Registry.ownerOf(_tokenId);
        require(_owner == _sender, "Can't initiate verification for domain that you do not own");
        require(bytes(_code).length > 0, "Validation code should not be empty");
        require(Registry.isApprovedOrOwner(address(this), _tokenId));
        frozenTokens = frozenTokens.add(_value);
        userRequests[lastRequestId] = _value;

        emit ValidationRequest(_tokenId, _owner, lastRequestId, _code);
        lastRequestId = lastRequestId.add(1);
    }

    /**
    * @notice Method returns available LINK tokens balance minus held tokens
    * @dev Returns tokens amount
    */
    function availableBalance() public view returns (uint256) {
        return LinkToken.balanceOf(address(this)).sub(frozenTokens);
    }

    function calculatePaymentForValidation(uint256 _requestId) private returns (uint256 _paymentPerValidation) {
        if (_requestId > 0) { // Validation was requested from Smart Contract. We need to search for price in mapping
            _paymentPerValidation = userRequests[_requestId];
            frozenTokens = frozenTokens.sub(_paymentPerValidation);
            delete userRequests[_requestId];
        } else {
            _paymentPerValidation = operatorPaymentPerValidation;
        }
    }
}
