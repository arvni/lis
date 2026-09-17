import { Box } from '@mui/material';
import { BRAND } from '@/Pages/Inventory/PurchaseRequests/Print/company';
import { formatDate } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import SlipHeader from './SlipHeader';
import PayLines from './PayLines';
import WorkSummary from './WorkSummary';

// An A4 sheet on screen; on paper the @page margins take its place.
const sheet = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    width: '210mm',
    maxWidth: '100%',
    minHeight: '297mm',
    mx: 'auto',
    mb: 4,
    p: '14mm',
    overflow: 'hidden',
    bgcolor: '#fff',
    color: BRAND.ink,
    // The sheet is styled on its own, so it doesn't inherit the app's font.
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.12)',
    '@media print': { width: 'auto', minHeight: 'auto', m: 0, p: 0, boxShadow: 'none' },
};

const signature = {
    mt: '10mm',
    display: 'flex',
    gap: '10mm',
    breakInside: 'avoid',
    '& > div': {
        flex: 1,
        pt: '12mm',
        borderTop: `1px solid ${BRAND.rule}`,
        fontSize: '8pt',
        color: BRAND.muted,
    },
};

const SlipSheet = ({ slip, lines, net }) => (
    <Box component="article" sx={sheet}>
        <SlipHeader slip={slip} />
        <PayLines lines={lines} net={net} />
        <WorkSummary attendance={slip.attendance} leaveBalance={slip.leave_balance} />

        <Box sx={signature}>
            <div>Prepared by</div>
            <div>Received by — {slip.person.name}</div>
        </Box>

        <Box
            component="footer"
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '6mm',
                mt: 'auto',
                pt: '2.5mm',
                borderTop: `1px solid ${BRAND.rule}`,
                fontSize: '7.5pt',
                color: BRAND.muted,
                '@media print': { mt: '10mm' },
            }}
        >
            <span>This slip is confidential and issued for the named employee only.</span>
            <span>Printed {formatDate(new Date())}</span>
        </Box>
    </Box>
);

export default SlipSheet;
