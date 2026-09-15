import { Box } from '@mui/material';
import { BRAND } from './company';
import { formatMoney, formatQty, isPriced, lineAmount } from './format';

const cell = {
    px: '2.5mm',
    py: '2mm',
    borderBottom: `1px solid ${BRAND.rule}`,
    verticalAlign: 'top',
};

const head = {
    ...cell,
    py: '2.2mm',
    borderBottom: 'none',
    bgcolor: BRAND.navy,
    color: '#fff',
    fontSize: '7.5pt',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textAlign: 'left',
    textTransform: 'uppercase',
};

const right = { textAlign: 'right', whiteSpace: 'nowrap' };

const OrderLinesTable = ({ lines = [], currency }) => {
    // Prices are optional on a request; without any, the order lists quantities only.
    const priced = lines.some(isPriced);
    const total = lines.reduce((sum, line) => sum + lineAmount(line), 0);

    return (
        <Box sx={{ mt: '6mm' }}>
            <Box
                component="table"
                sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}
            >
                <thead>
                    <tr>
                        <Box component="th" sx={{ ...head, width: '8mm' }}>
                            #
                        </Box>
                        <Box component="th" sx={head}>
                            Description
                        </Box>
                        <Box component="th" sx={head}>
                            Cat. No.
                        </Box>
                        <Box component="th" sx={head}>
                            Brand
                        </Box>
                        <Box component="th" sx={{ ...head, ...right }}>
                            Qty
                        </Box>
                        <Box component="th" sx={head}>
                            Unit
                        </Box>
                        {priced && (
                            <>
                                <Box component="th" sx={{ ...head, ...right }}>
                                    Unit Price
                                </Box>
                                <Box component="th" sx={{ ...head, ...right }}>
                                    Amount
                                </Box>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {lines.map((line, index) => (
                        <Box
                            component="tr"
                            key={line.id}
                            sx={{
                                breakInside: 'avoid',
                                '&:nth-of-type(even)': { bgcolor: BRAND.tint },
                            }}
                        >
                            <Box component="td" sx={{ ...cell, color: BRAND.muted }}>
                                {index + 1}
                            </Box>
                            <Box component="td" sx={cell}>
                                <Box sx={{ fontWeight: 600 }}>
                                    {line.item?.name ?? line.item_name}
                                </Box>
                                {line.notes && (
                                    <Box
                                        sx={{
                                            fontSize: '7.5pt',
                                            fontStyle: 'italic',
                                            color: BRAND.muted,
                                        }}
                                    >
                                        {line.notes}
                                    </Box>
                                )}
                            </Box>
                            <Box component="td" sx={cell}>
                                {line.cat_no || '—'}
                            </Box>
                            <Box component="td" sx={cell}>
                                {line.brand || '—'}
                            </Box>
                            <Box component="td" sx={{ ...cell, ...right, fontWeight: 600 }}>
                                {formatQty(line.qty)}
                            </Box>
                            <Box component="td" sx={cell}>
                                {line.unit?.name}
                            </Box>
                            {priced && (
                                <>
                                    <Box component="td" sx={{ ...cell, ...right }}>
                                        {isPriced(line)
                                            ? formatMoney(line.estimated_unit_price)
                                            : '—'}
                                    </Box>
                                    <Box component="td" sx={{ ...cell, ...right, fontWeight: 600 }}>
                                        {isPriced(line) ? formatMoney(lineAmount(line)) : '—'}
                                    </Box>
                                </>
                            )}
                        </Box>
                    ))}
                </tbody>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '6mm',
                    mt: '3mm',
                }}
            >
                <Box sx={{ pt: '2mm', fontSize: '8pt', color: BRAND.muted }}>
                    {lines.length} {lines.length === 1 ? 'item' : 'items'}
                </Box>
                {priced && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10mm',
                            minWidth: '65mm',
                            px: '4mm',
                            py: '2.2mm',
                            borderRadius: '1.5mm',
                            bgcolor: BRAND.navy,
                            color: '#fff',
                            fontSize: '10pt',
                            fontWeight: 700,
                            breakInside: 'avoid',
                        }}
                    >
                        <span>Total ({currency})</span>
                        <span>{formatMoney(total)}</span>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default OrderLinesTable;
