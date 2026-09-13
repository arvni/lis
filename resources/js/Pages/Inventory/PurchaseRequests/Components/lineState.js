let lastKey = 0;

/**
 * A stable React key per line, so each line's widgets (e.g. the item search box)
 * keep their own state when another line is removed or duplicated.
 */
export const newLineKey = () => `line-${++lastKey}`;

/** Drops the trailing zeros the database adds ("2.000000" → "2"). */
const tidyNumber = (value) =>
    value === null || value === undefined ? '' : String(parseFloat(value));

export const emptyLine = () => ({
    _key: newLineKey(),
    _item: null,
    _unit: null,
    _preferred_supplier: null,
    _manual: false,
    item_id: null,
    item_name: '',
    unit_id: null,
    qty: '1',
    estimated_unit_price: '',
    preferred_supplier_id: '',
    cat_no: '',
    brand: '',
    notes: '',
});

/** A form line from a saved purchase request line (editing, or "repeat from"). */
export const lineFromSource = (line) => ({
    _key: newLineKey(),
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _preferred_supplier: line.preferred_supplier ?? null,
    _manual: !line.item_id,
    item_id: line.item_id,
    item_name: line.item_name ?? '',
    unit_id: line.unit_id,
    qty: tidyNumber(line.qty),
    estimated_unit_price: tidyNumber(line.estimated_unit_price),
    preferred_supplier_id: line.preferred_supplier_id ?? '',
    cat_no: line.cat_no ?? '',
    brand: line.brand ?? '',
    notes: line.notes ?? '',
});

/** What is sent to the server: everything except the UI-only `_` fields. */
export const toPayload = (line) =>
    Object.fromEntries(Object.entries(line).filter(([field]) => !field.startsWith('_')));

/** Quantity × estimated unit price, or null until both are numbers. */
export const lineTotal = (line) => {
    const qty = parseFloat(line.qty);
    const price = parseFloat(line.estimated_unit_price);

    return Number.isFinite(qty) && Number.isFinite(price) ? qty * price : null;
};

export const formatAmount = (value) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
