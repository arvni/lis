import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { PlaylistAddCheck, RequestQuote, Receipt } from '@mui/icons-material';
import SummaryCard from './SummaryCard';

const SummaryCards = ({ totals }) => (
    <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                    title="Total Items"
                    value={totals.items}
                    icon={PlaylistAddCheck}
                    color="primary"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                    title="Total Amount"
                    value={`${totals.netTotal.toFixed(2)}`}
                    icon={RequestQuote}
                    color="secondary"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                    title="Amount Paid"
                    value={`${totals.paid ? totals.paid.toFixed(2) : '0.00'}`}
                    icon={(props) => <Typography {...props}>OMR</Typography>}
                    color="success"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SummaryCard
                    title="Amount Due"
                    value={`${totals.remaining.toFixed(2)}`}
                    icon={Receipt}
                    color={totals.remaining > 0 ? 'error' : 'success'}
                />
            </Grid>
        </Grid>
    </Box>
);

export default SummaryCards;
