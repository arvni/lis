import { Box, FormControlLabel, Paper, Switch, Typography } from '@mui/material';

const PanelOptionsCard = ({ sampleless, reportless, onSamplelessChange, onReportlessChange }) => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Panel Options
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={sampleless || false}
                        onChange={onSamplelessChange}
                        color="warning"
                        size="small"
                    />
                }
                label={
                    <Box>
                        <Typography variant="body2">Sampleless</Typography>
                        <Typography variant="caption" color="text.secondary">
                            No physical sample needed
                        </Typography>
                    </Box>
                }
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={reportless || sampleless || false}
                        onChange={onReportlessChange}
                        color="info"
                        size="small"
                        disabled={sampleless}
                    />
                }
                label={
                    <Box>
                        <Typography variant="body2">Reportless</Typography>
                        <Typography variant="caption" color="text.secondary">
                            No report generated
                        </Typography>
                    </Box>
                }
            />
        </Box>
    </Paper>
);

export default PanelOptionsCard;
