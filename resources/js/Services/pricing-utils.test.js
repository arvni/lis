import { describe, it, expect } from 'vitest';
import { calcPrice, getCondition } from './pricing-utils';

const parameters = [{ value: 'colonies', label: 'Colonies' }];

const conditions = (value = (n) => n) => [
    { condition: 'colonies <= 5', value: value(8) },
    { condition: 'colonies > 5', value: value(20) },
];

describe('calcPrice', () => {
    it('evaluates a formula against the parameter values', () => {
        expect(calcPrice('cells * 3', [{ value: 'cells' }], { cells: 10 })).toBe(30);
    });

    it('treats a missing parameter value as zero rather than throwing', () => {
        expect(calcPrice('cells * 3', [{ value: 'cells' }], {})).toBe(0);
    });

    // The method JSON stores a condition's price as a number as readily as a
    // string; the numeric form used to throw inside the formula replacement and
    // silently price at 0.
    it('prices a matched condition whose value is a number', () => {
        expect(calcPrice('', parameters, { colonies: 3 }, conditions())).toBe(8);
        expect(calcPrice('', parameters, { colonies: 7 }, conditions())).toBe(20);
    });

    it('prices a matched condition whose value is a string', () => {
        expect(calcPrice('', parameters, { colonies: 3 }, conditions(String))).toBe(8);
        expect(calcPrice('', parameters, { colonies: 7 }, conditions(String))).toBe(20);
    });

    it('prices at zero when no condition matches', () => {
        expect(
            calcPrice('', parameters, { colonies: 3 }, [{ condition: 'colonies > 5', value: 20 }]),
        ).toBe(0);
    });
});

describe('getCondition', () => {
    it('returns the first condition that holds for the values', () => {
        expect(getCondition(conditions(), parameters, { colonies: 7 })).toMatchObject({
            condition: 'colonies > 5',
        });
    });

    it('returns null when no condition holds', () => {
        expect(
            getCondition([{ condition: 'colonies > 5', value: 20 }], parameters, { colonies: 3 }),
        ).toBeNull();
    });

    // An unset parameter reads as 0 rather than disqualifying every condition.
    it('treats a missing value as zero when matching', () => {
        expect(getCondition(conditions(), parameters, {})).toMatchObject({
            condition: 'colonies <= 5',
        });
    });
});
