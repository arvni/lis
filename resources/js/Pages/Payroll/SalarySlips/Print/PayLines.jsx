import { Box } from '@mui/material';
import { BRAND, DEFAULT_CURRENCY } from '@/Pages/Inventory/PurchaseRequests/Print/company';
import { formatMoney } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import { SectionTitle } from '@/Pages/Inventory/PurchaseRequests/Print/PartiesSection';

const cell = {
    px: '3mm',
    py: '2mm',
    fontSize: '8.5pt',
    borderBottom: `1px solid ${BRAND.rule}`,
};

const headCell = {
    px: '3mm',
    py: '2mm',
    fontSize: '7.5pt',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#fff',
    bgcolor: BRAND.navy,
};

/**
 * The money on the slip. Deductions carry their own minus sign from the server, so nothing here
 * has to know which lines subtract.
 */
const PayLines = ({ lines, net }) => (
    <Box sx={{ mt: '6mm', breakInside: 'avoid' }}>
        <SectionTitle>Payment</SectionTitle>

        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead" sx={{ display: 'table-header-group' }}>
                <Box component="tr">
                    <Box component="th" sx={{ ...headCell, textAlign: 'left' }}>
                        Item
                    </Box>
                    <Box component="th" sx={{ ...headCell, textAlign: 'right', width: '35mm' }}>
                        Amount ({DEFAULT_CURRENCY})
                    </Box>
                </Box>
            </Box>
            <Box component="tbody">
                {lines.map((line, index) => (
                    <Box
                        component="tr"
                        key={`${line.code}-${index}`}
                        sx={{ '&:nth-of-type(even)': { bgcolor: BRAND.tint } }}
                    >
                        <Box component="td" sx={cell}>
                            <Box sx={{ fontWeight: 500 }}>{line.label}</Box>
                            {line.note && (
                                <Box sx={{ fontSize: '7.5pt', color: BRAND.muted }}>
                                    {line.note}
                                </Box>
                            )}
                        </Box>
                        <Box
                            component="td"
                            sx={{
                                ...cell,
                                textAlign: 'right',
                                whiteSpace: 'nowrap',
                                fontVariantNumeric: 'tabular-nums',
                                color: Number(line.amount) < 0 ? '#B91C1C' : BRAND.ink,
                            }}
                        >
                            {formatMoney(line.amount)}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>

        <Box
            sx={{
                mt: '3mm',
                ml: 'auto',
                width: '70mm',
                display: 'flex',
                justifyContent: 'space-between',
                px: '3mm',
                py: '2.5mm',
                borderRadius: '1.5mm',
                bgcolor: BRAND.navy,
                color: '#fff',
                fontWeight: 700,
                fontSize: '10pt',
            }}
        >
            <span>Net pay</span>
            <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {DEFAULT_CURRENCY} {formatMoney(net)}
            </Box>
        </Box>
    </Box>
);

export default PayLines;
