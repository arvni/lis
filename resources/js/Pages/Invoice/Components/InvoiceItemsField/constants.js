export const KIND_LABEL = {
    test: 'Test',
    panel: 'Panel',
    manual_fee: 'Manual',
    adjustment: 'Adjustment',
};

export const KIND_COLOR = {
    test: 'primary',
    panel: 'secondary',
    manual_fee: 'warning',
    adjustment: 'info',
};

export const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

export const blankItem = () => ({
    id: null,
    _new_id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'manual_fee',
    title: '',
    description: '',
    qty: 1,
    unit_price: 0,
    discount: 0,
    price: 0,
    locked: true,
    test: null,
});
