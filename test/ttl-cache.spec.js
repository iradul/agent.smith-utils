const assert = require('assert');
const { TTLCache } = require('../jsrc/ttl-cache');

describe('TTLCache', () => {
    const timeout = 50;
    const cache = new TTLCache(timeout);
    describe('#set', () => {
        it('should set and get key-value pair', () => {
            cache.set('test', 123);
            assert.equal(cache.get('test'), 123);
        });
        it('should not expire', (done) => {
            setTimeout(() => {
                assert.ok(cache.has('test'));
                done();
            }, timeout / 2);
        });
        it('should expire', (done) => {
            setTimeout(() => {
                assert.ok(!cache.has('test'));
                done();
            }, timeout / 2);
        });
    });
})