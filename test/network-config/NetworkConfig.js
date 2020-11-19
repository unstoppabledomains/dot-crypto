const chai = require('chai')
const assert = chai.assert

describe('NetworkConfig', () => {
  it('should match package.json and network config versions', () => {
    const packageJson = require('../../package.json');
    const networkConfigJson = require('../../src/network-config/network-config.json');

    assert.equal(packageJson.version, networkConfigJson.version)
  });

  it('should match configs', () => {
    const networkConfig = require('../../src/network-config/network-config');
    const networkConfigJson = require('../../src/network-config/network-config.json');

    assert.equal(networkConfig, networkConfigJson)
  });
});
