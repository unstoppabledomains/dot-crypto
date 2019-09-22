const Registry = artifacts.require('Registry.sol')

contract('Registry', () => {
  it('should deploy', async () => {
    assert(await Registry.deployed())
  })
})
