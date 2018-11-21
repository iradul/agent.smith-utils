const assert = require('assert');
const { ChangeDetector } = require('../jsrc/change-detector');

describe('ChangeDetector', () => {
    describe('constructor', () => {
        it('should generate valid fields out of input array', () => {
            const arr = ['a', 'b', { field: 'c', shouldChange: true, ignoreValues: ['x', 'y']}];
            const cd = new ChangeDetector(arr);
            cd.fields.forEach((f, i) => {
                if (i !== arr.length - 1) {
                    assert.equal(f.field, arr[i]);
                    assert.equal(f.shouldChange, true);
                    assert.equal(f.ignoreValues.length, 0);
                } else {
                    assert.equal(f.field, arr[arr.length - 1].field);
                    assert.equal(f.shouldChange, arr[arr.length - 1].shouldChange);
                    assert.equal(f.ignoreValues, arr[arr.length - 1].ignoreValues);
                }
            })
        });
    });
    describe('#getStringValue()', () => {
        it('should return string value of a boolean field', () => {
            const cd = new ChangeDetector();
            assert.equal(cd.getStringValue({ x: true }, 'x'), 'true');
        });
        it('should return string value of a number field', () => {
            const cd = new ChangeDetector();
            assert.equal(cd.getStringValue({ x: 11 }, 'x'), '11');
        });
        it('should return string value of an object field', () => {
            const cd = new ChangeDetector();
            assert.equal(cd.getStringValue({ x: { a: 'x', b: 1, c: [ 1, '2', true ] } }, 'x'), '{"a":"x","b":1,"c":[1,"2",true]}');
        });
        it('should return string value of a complex field', () => {
            const cd = new ChangeDetector();
            assert.equal(cd.getStringValue({
                a: {
                    b: {
                        c: 11
                    }
                }
            }, 'a.b.c'), '11');
        });
    });
    describe('#add()', () => {
        it('should append fields on the top of existing one', () => {
            const cd = new ChangeDetector(['c']);
            cd.add('a', true, 0);
            cd.add('b', false, 0, 'x', 'y', 'z');
            assert.equal(cd.fields[1].field, 'a');
            assert.equal(cd.fields[1].shouldChange, true);
            assert.equal(cd.fields[1].ignoreValues.length, 0);
            assert.equal(cd.fields[2].field, 'b');
            assert.equal(cd.fields[2].shouldChange, false);
            assert.equal(cd.fields[2].ignoreValues.length, 3);
            assert.equal(cd.fields[2].ignoreValues[0], 'x');
            assert.equal(cd.fields[2].ignoreValues[1], 'y');
            assert.equal(cd.fields[2].ignoreValues[2], 'z');
        });
    });
    describe('#detect()', () => {
        const cd = new ChangeDetector([
            { field: 'a', shouldChange: false, detectInterval: 0, ignoreValues: ['x', 'y']},
            { field: 'b', shouldChange: true, detectInterval: 0, ignoreValues: ['100', '99']},
            { field: 'c', shouldChange: false, detectInterval: 100, ignoreValues: [] },
        ]);
        const obj = {
            a: 'v1',
            b: 5,
            c: false,
        };
        it('should not detect change on first check', () => {
            assert.equal(cd.detect(obj), false);
            assert.equal(cd.detectedFailures.length, 0);
        });
        it('should detect failure when there is a change for `shouldChange=false`', () => {
            obj.a = 'v2'; // this is invalid (shouldChange: false)
            obj.b = 2; // this valid (shouldChange: true)
            assert.equal(cd.detect(obj), true);
            assert.equal(cd.detectedFailures.length, 1);
        });
        it('should not detect failures with valid updates', () => {
            // obj.a not changed is valid (shouldChange: false)
            obj.b = 3; // this valid (shouldChange: true)
            assert.equal(cd.detect(obj), false);
            assert.equal(cd.detectedFailures.length, 0);
        });
        it('should detect failure when there is no change  for `shouldChange=true`', () => {
            // obj.a not changed is valid (shouldChange: false)
            // obj.b not changed is invalid (shouldChange: true)
            assert.equal(cd.detect(obj), true);
            assert.equal(cd.detectedFailures.length, 1);
        });
        it('should detect multiple failures with invalid updates', () => {
            obj.a = 'v3'; // this is invalid (shouldChange: false)
            // obj.b not changed is invalid (shouldChange: true)
            assert.equal(cd.detect(obj), true);
            assert.equal(cd.detectedFailures.length, 2);
        });
        it('should not detect failure for ignored values', () => {
            obj.a = 'x'; // this is invalid but ok because it's ignored (shouldChange: false)
            obj.b = 99; // this valid (shouldChange: true)
            assert.equal(cd.detect(obj), false);
            obj.a = 'y'; // this is invalid but ok because it's ignored (shouldChange: false)
            // obj.b not changed is invalid but ok because it's ignored (shouldChange: true)
            assert.equal(cd.detect(obj), false);
        });
        it('should not detect failure within `detectInterval` interval', () => {
            // obj.a not changed is valid (shouldChange: false)
            obj.b = 4; // this valid (shouldChange: true)
            obj.c = true; // this is invalid (shouldChange: false)
            assert.equal(cd.detect(obj), false);
            assert.equal(cd.detectedFailures.length, 0);
        });
        it('should not detect failure even after `detectInterval` interval when value gets fixed', (done) => {
            // obj.a not changed is valid (shouldChange: false)
            obj.b = 5; // this valid (shouldChange: true)
            obj.c = false; // this is invalid (shouldChange: false)
            setTimeout(() => {
                assert.equal(cd.detect(obj), false);
                assert.equal(cd.detectedFailures.length, 0);
                done();
            }, 100);
        });
        it('should detect failure after `detectInterval` interval', (done) => {
            // obj.a not changed is valid (shouldChange: false)
            obj.b = 6; // this valid (shouldChange: true)
            obj.c = true; // this is invalid (shouldChange: false)
            setTimeout(() => {
                assert.equal(cd.detect(obj), true);
                assert.equal(cd.detectedFailures.length, 1);
                done();
            }, 100);
        });
    });
});
