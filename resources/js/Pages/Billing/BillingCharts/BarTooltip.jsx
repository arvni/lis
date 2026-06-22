import { Paper, Typography } from '@mui/material';
import { fmt } from './constants';

const BarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const total = (d.invoiced_income ?? 0) + (d.non_invoiced_income ?? 0);
    return (
        <Paper elevation={3} sx={{ p: 1.5, minWidth: 190 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
                {d.name}
            </Typography>
            <Typography variant="caption" display="block" color="primary.main">
                Invoiced: <b>OMR {fmt(d.invoiced_income)}</b>
            </Typography>
            <Typography variant="caption" display="block" color="warning.main">
                Not invoiced: <b>OMR {fmt(d.non_invoiced_income)}</b>
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
                Total: OMR {fmt(total)}
            </Typography>
            {d.count != null && (
                <Typography variant="caption" display="block">
                    Items: {d.count}
                </Typography>
            )}
            {d.acceptance_count != null && (
                <Typography variant="caption" display="block">
                    Acceptances: {d.acceptance_count}
                </Typography>
            )}
        </Paper>
    );
};

export default BarTooltip;
