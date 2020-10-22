const chai = require('chai')
const assert = chai.assert

describe('NetworkConfig', function () {
    it('should match package.json and network config versions', function () {
        const packageJson = require('../../package.json');
        const networkConfigJson = require('../../src/network-config/network-config.json');

        assert.equal(packageJson.version, networkConfigJson.version)
    })
});
