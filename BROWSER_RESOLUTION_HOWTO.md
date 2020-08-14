# Browser Resolution How-to

This document describes the recommended way to resolve blockchain domains within a classical HTTP Web Browser or a Dapp Browser.
The document assumes that a reader has a basic understanding of Unstoppable domains resolution in general. See [Domain Resolution](./ARCHITECTURE.md#domain-resolution)

## End user features

Here are some of the end user scenarios that should give an idea which features should be available in a browser supporting crypto domains.

### HTTP Website Browsing

This scenario assumes that a blockchain domain has a DNS record configured.

1. A user enters the domain name into a browser address bar.
2. A browser resolves the domain and gets the specified DNS records.
3. A browser requests and displays the content using DNS protocol and HTTP protocol.

### Distributed Website Browsing

This scenario assumes that a blockchain domain has an dweb content identifier record configured (e.g. IPFS hash).

1. A user enters the domain name into a browser address bar.
2. A browser resolves the domain and gets the content hash of a domain.
3. A browser retrieves the content by the hash using a related protocol and displays the content.

### Domain Level Redirect

This scenario assumes that a blockchain domain has a redirect url and IPFS hash configured, and a user's browser doesn't support IPFS protocol.

1. A user enters the domain name into a browser address bar.
2. The browser resolves the domain and gets redirect url and IPFS hash records.
3. The browser redirects a user to the redirect URL because IPFS protocol is not supported.

### Resolution Configuration

1. Given a user that want to change its ETH provider service.
2. User goes to browser settings crypto domains section.
3. User changes ethereum node URL from default to any other.
4. User changes Registry Address for each support crypto registry.
5. User changes network for ethereum node.
6. If network is not specified explicitly, it can be retrieved from the ethereum node URL.
7. If Registry Address is not specified, it can use a default for specified network.

## Content Display Protocol

In addition to base browser content display protocol like `http` blockchain domains can also be configured for distributed content protocol like `ipfs`. Here is the list of content display protocols that can be associated with a crypto domain:

* Traditional
  * HTTP
  * HTTPS
  * FTP
* Distributed
  * [IPFS](https://en.wikipedia.org/wiki/InterPlanetary_File_System) defining `ipfs://` protocol
  * [Swarm](https://swarm-guide.readthedocs.io/en/stable/architecture.html#the-bzz-protocol) defining `bzz://` protocol

A browser may support any subset of traditional or distributed protocols that would still make crypto domains websites displayable.

## Records related to browser resolution

All records related to browser resolution are stored within these namespaces:

* `dns.*` - for traditional DNS records
* `dweb.*` - for distributed content records
* `browser.*` - hint records to help browser determine a preferred content display method

For a detailed records reference see [Records Reference](./RECORDS_REFERENCE.md).

If you are looking for a way to get records associated to a domain,
see [Domain Resolution](./ARCHITECTURE.md#domain-resolution).

## Browser Resolution Algorithm

This section explains how different domain record configurations should be interpreted by browsers.

A browser can select a protocol it has a support for.
If a domain is configured for multiple protocols, it should prioritize a protocol based on `browser.preferred_protocol` record that can be set to one of the defined protocols.

Browsers supporting distributed content protocol should always prioritize distributed content to be displayed for domains that do not have `browser.preferred_protocol` record set to traditional protocol. 
A domain can have a single content identifier for each distributed protocol stored in `dweb.<protocol>.hash`. Ex: `dweb.bzz.hash` for Swarm's `bzz` protocol. See [Dweb Records](./ARCHITECTURE.md#dweb-records) for more information.

If none of `dweb` hash records is set, a browser should fall back to DNS resolution that is set within `dns.*` namespace.
See [DNS Records](./ARCHITECTURE.md#dns-records) for more information

Generally browsers automatically add `http://` prefix for any domain in the address bar if the protocol is not specified explicitly by a user. In case of blockchain domain names (assuming a browser supports many protocols), it is preferred to determine a protocol only after resolving domain records.

### Legacy Records Support

As of Q3 2020, most .crypto domains are configured using legacy record names for IPFS hash and redirect domain:

1. `ipfs.html.value` deprecated in favor of `dweb.ipfs.hash`
2. `ipfs.redirect_domain` deprecated in favor of `browser.redirect_url`

Browsers are strongly recommended to support those records as a fallback when corresponding replacement records are not set.
