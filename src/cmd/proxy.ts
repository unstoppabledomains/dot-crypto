function erc1167ProxyOf(address: string): string {
  if (!/^(?:0x)?[a-f\d]{40}$/.test(address)) {
    throw new Error('bad address')
  }

  return `0x363d3d373d3d3d363d73${address.replace(
    /^0x/,
    '',
  )}5af43d82803e903d91602b57fd5bf3`
}
