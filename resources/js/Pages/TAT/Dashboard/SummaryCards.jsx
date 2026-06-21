import { Grid } from '@mui/material';
import { CheckCircle, FlashOn, Warning, ErrorOutlined as ErrorOutline } from '@mui/icons-material';
import { SummaryCard } from './widgets';

const SummaryCards = ({ summary }) => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
                title="Overdue Items"
                value={summary.breached}
                icon={ErrorOutline}
                color="error"
                subtitle="Past deadline, not reported"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
                title="At Risk"
                value={summary.at_risk}
                icon={Warning}
                color="warning"
                subtitle="≥70% of TAT elapsed"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
                title="STAT Active"
                value={summary.stat_active}
                icon={FlashOn}
                color="error"
                subtitle="STAT items in progress"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard
                title="On-Time Rate (30d)"
                value={summary.on_time_pct != null ? `${summary.on_time_pct}%` : '—'}
                icon={CheckCircle}
                color="success"
                subtitle="Reported within TAT"
            />
        </Grid>
    </Grid>
);

export default SummaryCards;
