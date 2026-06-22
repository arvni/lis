export const USES_EXISTING_LOTS = ['EXPORT', 'RETURN', 'EXPIRED_REMOVAL', 'TRANSFER'];

export const emptyLine = () => ({
    _item: null,
    _unit: null,
    _location: null,
    _lot: null,
    _barcode_locked: false,
    _lots_from_scan: [],
    item_id: null,
    unit_id: null,
    quantity: '',
    barcode: '',
    lot_number: '',
    brand: '',
    cat_no: '',
    expiry_date: '',
    unit_price: '',
    store_location_id: null,
    notes: '',
});

export const toPayloadLine = ({
    _item,
    _unit,
    _location,
    _lot,
    _barcode_locked,
    _lots_from_scan,
    ...rest
}) => rest;

const lineFromSource = (line) => ({
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _location: null,
    _lot: null,
    _barcode_locked: false,
    _lots_from_scan: [],
    item_id: line.item_id,
    unit_id: line.unit_id,
    quantity: line.quantity ?? '',
    barcode: '',
    lot_number: line.lot_number ?? '',
    brand: line.brand ?? '',
    cat_no: line.cat_no ?? '',
    expiry_date: line.expiry_date ?? '',
    unit_price: line.unit_price ?? '',
    store_location_id: null,
    notes: line.notes ?? '',
});

export const linesFromSource = (lines) => (lines ?? []).map(lineFromSource);

export const payloadFromSource = (line) => toPayloadLine(lineFromSource(line));

// Build a line state object from an existing transaction line (loaded from server, for Edit)
export const lineFromExisting = (line) => ({
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _location: line.location ?? null,
    _lot: null,
    _barcode_locked: false,
    _lots_from_scan: [],
    item_id: line.item_id,
    unit_id: line.unit_id,
    quantity: line.quantity,
    barcode: line.barcode ?? '',
    lot_number: line.lot_number ?? '',
    brand: line.brand ?? '',
    cat_no: line.cat_no ?? '',
    expiry_date: line.expiry_date ?? '',
    unit_price: line.unit_price ?? '',
    store_location_id: line.store_location_id ?? null,
    notes: line.notes ?? '',
});
