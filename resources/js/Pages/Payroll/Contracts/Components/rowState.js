let nextKey = 0;

/** A stable key for a row that has no id yet, so React keeps focus while it is being filled in. */
export const newRowKey = () => `row-${(nextKey += 1)}`;

export const emptyEntitlement = () => ({
    _key: newRowKey(),
    leave_kind_id: '',
    entitled_days: '',
});

export const emptyAllowance = () => ({
    _key: newRowKey(),
    payroll_item_type_id: '',
    amount: '',
});

/** Rows as they arrive from the server, given the keys the editors need. */
export const rowsFrom = (rows, pick) =>
    (rows ?? []).map((row) => ({ _key: newRowKey(), ...pick(row) }));

/**
 * One row's validation errors, keyed "entitlements.2.entitled_days" → "entitled_days".
 */
export const errorsForRow = (errors, field, index) => {
    const prefix = `${field}.${index}.`;

    return Object.fromEntries(
        Object.entries(errors ?? {})
            .filter(([key]) => key.startsWith(prefix))
            .map(([key, message]) => [key.slice(prefix.length), message]),
    );
};

/** Drops the editor's bookkeeping before the rows are posted. */
export const toPayload = ({ _key, ...row }) => row;
