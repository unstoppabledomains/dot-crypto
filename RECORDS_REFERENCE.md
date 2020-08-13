<!-- vim: set nowrap: -->

# Records Reference

Records Reference is an overview of all standardized resolver record, that have a defined interpretation.
Any other custom records are not forbidden to be set, however their interpretation remains custom to specific clients.

## List of Records

| Domain Name                  | Description                                                                                                                                                                                                    | Format                                           | Example                                          | Docs                                      |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|--------------------------------------------------|-------------------------------------------|
| `crypto.ETH.address`         | Ethereum Address to receive crypto payments                                                                                                                                                                    | `0x[0-9a-fA-F]{40}`                              | `0x0f4a10a4f46c288cea365fcf45cccf0e9d901b94`     | [Link](./ARCHITECTURE.md#crypto-payments) |
| `crypto.BTC.address`         | Bitcoin Address to receive crypto payments                                                                                                                                                                     | `[0-9a-zA-Z]{32}`                                | `1Nb7Mt1EqUqxxrAdmefUovS7aTgMUf2A6m`             | [Link](./ARCHITECTURE.md#crypto-payments) |
| `crypto.<TICKER>.address`    | Crypto currency address of the specified currency ticker. List of supported currencies can be found in [cripti/cryptocurrencies](https://github.com/crypti/cryptocurrencies/blob/master/cryptocurrencies.json) |                                                  |                                                  | [Link](./ARCHITECTURE.md#crypto-payments) |
| `browser.preferred_protocol` | A name of the protocol that browser should prioritize to display content for                                                                                                                                   | `ipfs|https?|bzz|ftp`                            | `ipfs`, `http`, `https`, `bzz`                   | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `browser.redirect_url`       | An URL where a browser should redirect a person if no other resolution method found.                                                                                                                           | [RFC-1738](https://tools.ietf.org/html/rfc1738)  | `http://example.com/home.html`                   | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `dweb.ipfs.hash`             | IPFS network content hash                                                                                                                                                                                      | `[0-9a-zA-Z]{46}`                                | `QmVaAtQbi3EtsfpKoLzALm6vXphdi2KjMgxEDKeGg6wHvK` | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `dweb.bzz.hash`              | Swarm network content hash                                                                                                                                                                                     |                                                  | TODO                                             | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `dweb.<PROTOCOL>.hash`       | Any other distributed content network content hash                                                                                                                                                             |                                                  |                                                  | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `dns.ttl`                    | Default TTL setting for all DNS records                                                                                                                                                                        | `\d+`                                            | `128`                                            | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.A`                      | JSON serialized array of DNS A record IP addresses                                                                                                                                                             |                                                  | `["10.0.0.1","10.0.0.2"]`                        | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.A.ttl`                  | TTL setting for all A records                                                                                                                                                                                  | `\d+`                                            | `128`                                            | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.CNAME`                  | JSON serialized array of DNS CNAME record IP addresses                                                                                                                                                         |                                                  | `["example.com."]`                               | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.CNAME.ttl`              | TTL setting for all CNAME records                                                                                                                                                                              | `\d+`                                            | `128`                                            | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.<RECORD>`               | JSON serialized array of specified DNS record values. A list of supported DNS records can be found [here](https://en.wikipedia.org/wiki/List_of_DNS_record_types)                                              |                                                  |                                                  | [Link](./ARCHITECTURE.md#dns-records)     |
| `dns.<RECORD>.ttl`           | TTL setting for corresponding type of records                                                                                                                                                                  | `\d+`                                            | `164`                                            | [Link](./ARCHITECTURE.md#dns-records)     |
| `ipfs.html.value`            | Deprecated: use `dweb.ipfs.hash` instead.                                                                                                                                                                      | `[0-9a-zA-Z]{46}`                                | `QmVaAtQbi3EtsfpKoLzALm6vXphdi2KjMgxEDKeGg6wHvK` | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |
| `ipfs.redirect_domain.value` | Deprecated: use `browser.redirect_url` instead.                                                                                                                                                                | [RFC-1738](https://tools.ietf.org/html/rfc1738)  | `http://example.com/home.html`                   | [Link](./BROWSER_RESOLUTION_HOWTO.md)     |


<style>
  table th:first-of-type {
  }
  table th:nth-of-type(2) {
      min-width: 300px;
  }
  table th:nth-of-type(3) {
      min-width: 170px;
  }
  table th:nth-of-type(4) {
      width: 30%;
  }
</style>
