# Questions:

* DNS protocol questions 
  * How do DNS records for sub domains work if the parent domains show these records?
  * Is `ttl` really unrequired for blockchain domain names?
    * Can DNS server always resolve domains in real time without cache?
    * Does browser relay on TTL to cache dns resolutions inside?
  * "browser.*" namespace problem
  * "ttl" has to be supported
* CloudFlare
  * Ethereum Gateway response format incompatibility: https://github.com/ethers-io/ethers.js/issues/949#issuecomment-662940656
  * We see your solution now works for DNS over HTTP. Is there any specific reason why it requires DNS over HTTP? It seems to be expandable to classical DNS easily. Is there any downside of that?
  * Are you planning to open source your IPFS gateway and DNS gateway you are using? We think it can be important to brand this solution as completely decentralized by allowing people to launch their own gateways.
* Brave
  * Is Cloudflare DNS over HTTPs a satisfyng solution to resolve domains instead of direct blockchain calls for Brave? Cloudflare DNS seems like more centralized approach to resovle domain records.
  * Would a browser be able to resolve a domain first and apply the protocol prefix then?
  * Brave currently has metamask built-in which uses infura eth endpoint by default. We think infura eth node is fine to be used for domains resolution too. Is there any reason why cloudflare eth node is better for domains resolution?
