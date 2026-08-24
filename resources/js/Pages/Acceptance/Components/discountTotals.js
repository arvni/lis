/**
 * How an item's `discount` field is derived from its discount lines.
 *
 * Two callers need the same answer and must not drift: DiscountManager, which owns
 * the editable lines, and TestConfigStep, which has to restate the total whenever a
 * method change moves the price out from under lines that stay put.
 */

/** Card lines are granted by a partner contract and are not editable here. */
export const cardDiscountLines = (lines = []) => lines.filter((line) => line?.source === 'CARD');

export const manualDiscountLines = (lines = []) => lines.filter((line) => line?.source !== 'CARD');

/**
 * A card line carries the amount the backend already decided, so it is taken as
 * given rather than recomputed against the price.
 */
export const cardDiscountTotal = (lines = []) =>
    cardDiscountLines(lines).reduce((total, line) => total + Number(line.amount || 0), 0);

/** @param lines manual lines only — a card line has no `value` to work from. */
export const manualDiscountTotal = (lines = [], price = 0) =>
    lines.reduce(
        (total, line) =>
            line.type === 'PERCENTAGE'
                ? total + (price * line.value) / 100
                : total + Number(line.value),
        0,
    );

/**
 * Manual lines capped at the operator's ceiling, with card lines added on top —
 * a contractual discount is not subject to the cap reception works within.
 */
export const discountTotalFor = (customParameters = {}, price = 0, maxDiscount = 0) => {
    const lines = customParameters?.discounts || [];
    const manual = manualDiscountTotal(manualDiscountLines(lines), price);

    return cardDiscountTotal(lines) + Math.min(manual, maxDiscount * price * 0.01);
};
