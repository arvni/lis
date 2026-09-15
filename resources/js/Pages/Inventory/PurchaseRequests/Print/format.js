export const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : '—';

// OMR is counted to three decimals (baisa).
export const formatMoney = (value) =>
    Number(value ?? 0).toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });

// Quantities are stored with six decimals; print them without the trailing zeros.
export const formatQty = (value) => String(parseFloat(value ?? 0));

export const isPriced = (line) =>
    line.estimated_unit_price !== null && line.estimated_unit_price !== undefined;

export const lineAmount = (line) =>
    parseFloat(line.qty ?? 0) * parseFloat(line.estimated_unit_price ?? 0);
