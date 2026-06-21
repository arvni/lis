import { Badge, Box, Button, Paper, Typography } from '@mui/material';
import { Biotech, Schedule } from '@mui/icons-material';

export default function ProgressBanner({ validation, onQuickFill }) {
    return (
        <Box sx={{ px: 3, pt: 2 }}>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: validation.isValid ? 'success.50' : 'warning.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box display="flex" gap={1.5} sx={{ alignItems: 'center' }}>
                    <Badge badgeContent={validation.totalSamples} color="primary">
                        <Biotech color={validation.isValid ? 'success' : 'warning'} />
                    </Badge>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {validation.completedSamples} of {validation.totalSamples} samples
                            completed
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {validation.isValid
                                ? 'Ready for collection'
                                : 'Some fields need attention'}
                        </Typography>
                    </Box>
                </Box>
                {!validation.isValid && (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onQuickFill}
                        startIcon={<Schedule />}
                        sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                    >
                        Quick Fill
                    </Button>
                )}
            </Paper>
        </Box>
    );
}
