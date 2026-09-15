import { Box } from '@mui/material';
import { BRAND, COMPANY } from './company';
import { formatDate } from './format';

const MetaRow = ({ label, strong = false, children }) => (
    <tr>
        <Box
            component="td"
            sx={{
                pr: '5mm',
                py: '0.6mm',
                color: BRAND.muted,
                fontSize: '7.5pt',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </Box>
        <Box
            component="td"
            sx={{
                py: '0.6mm',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                fontSize: strong ? '11.5pt' : '9pt',
                fontWeight: strong ? 700 : 500,
                color: strong ? BRAND.navy : BRAND.ink,
            }}
        >
            {children}
        </Box>
    </tr>
);

// Letterhead on the left, the order's identity on the right, a brand rule beneath.
const OrderHeader = ({ pr, approvedAt }) => (
    <Box component="header">
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8mm',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '5mm', minWidth: 0 }}>
                <Box
                    component="img"
                    src={COMPANY.logo}
                    alt="Logo"
                    sx={{ width: '19mm', flexShrink: 0 }}
                />
                <Box sx={{ fontSize: '8pt', lineHeight: 1.55, color: BRAND.muted }}>
                    <Box sx={{ fontSize: '13pt', fontWeight: 700, color: BRAND.navy, mb: '1mm' }}>
                        {COMPANY.name}
                    </Box>
                    <div>{COMPANY.address}</div>
                    <div>
                        VATIN {COMPANY.vatin} · CR {COMPANY.cr}
                    </div>
                    <div>
                        {COMPANY.phone} · {COMPANY.email}
                    </div>
                </Box>
            </Box>

            <Box sx={{ flexShrink: 0 }}>
                <Box
                    component="h1"
                    sx={{
                        m: 0,
                        mb: '3mm',
                        fontSize: '21pt',
                        fontWeight: 800,
                        letterSpacing: '0.14em',
                        lineHeight: 1,
                        textAlign: 'right',
                        color: BRAND.navy,
                    }}
                >
                    PURCHASE ORDER
                </Box>
                <Box component="table" sx={{ ml: 'auto', borderCollapse: 'collapse' }}>
                    <tbody>
                        <MetaRow label="PO No." strong>
                            {pr.po_number}
                        </MetaRow>
                        <MetaRow label="PO Date">{formatDate(approvedAt)}</MetaRow>
                    </tbody>
                </Box>
            </Box>
        </Box>

        <Box
            sx={{
                mt: '5mm',
                height: '1.2mm',
                borderRadius: '1mm',
                background: `linear-gradient(90deg, ${BRAND.navy} 0%, ${BRAND.sky} 100%)`,
            }}
        />
    </Box>
);

export default OrderHeader;
