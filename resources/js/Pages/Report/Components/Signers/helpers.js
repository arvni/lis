// Pure list operations for the signers table. Each returns a new array,
// or null when the operation is a no-op (invalid id / already at the edge).

/** Compare function for sorting signers by row number. */
export function rowCompare(a, b) {
    if (a.row > b.row) return 1;
    if (a.row < b.row) return -1;
    return 0;
}

/** Swaps the signer one position up, adjusting both rows. */
export function moveSignerUp(signers, id) {
    const index = signers.findIndex((item) => item.id === id);
    if (index <= 0) return null;

    const selected = { ...signers[index] };
    const next = [...signers];
    next[index - 1] = { ...selected, row: selected.row - 1 };
    next[index] = { ...signers[index - 1], row: selected.row };
    return next;
}

/** Swaps the signer one position down, adjusting both rows. */
export function moveSignerDown(signers, id) {
    const index = signers.findIndex((item) => item.id === id);
    if (index === -1 || index >= signers.length - 1) return null;

    const selected = { ...signers[index] };
    const next = [...signers];
    next[index + 1] = { ...selected, row: selected.row + 1 };
    next[index] = { ...signers[index + 1], row: selected.row };
    return next;
}

/** Removes the signer and renumbers the remaining rows 1..n. */
export function removeSigner(signers, id) {
    const index = signers.findIndex((item) => item.id === id);
    if (index === -1) return null;

    return signers
        .filter((_, idx) => idx !== index)
        .map((signer, idx) => ({ ...signer, row: idx + 1 }));
}

/** Replaces the signer's title. */
export function updateSignerTitle(signers, id, title) {
    const index = signers.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const next = [...signers];
    next[index] = { ...signers[index], title };
    return next;
}
