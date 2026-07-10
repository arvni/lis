import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { ExpandMore, Settings } from '@mui/icons-material';

/** Optional per-test notes accordion. */
const PanelNotesSection = ({ acceptanceItems, onChange }) => (
    <Accordion
        elevation={1}
        sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
    >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings fontSize="small" color="action" />
                <Typography variant="subtitle2">
                    Additional Notes per Test{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                        (optional)
                    </Typography>
                </Typography>
            </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
            <Stack spacing={1.5}>
                {acceptanceItems.map((item) => (
                    <Box key={item.id}>
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                            {item.method_test?.method?.test?.name} —{' '}
                            {item.method_test?.method?.name}
                        </Typography>
                        <TextField
                            size="small"
                            fullWidth
                            multiline
                            rows={1}
                            value={item.details || ''}
                            onChange={(e) =>
                                onChange({
                                    acceptanceItems: acceptanceItems.map((i) =>
                                        i.id === item.id ? { ...i, details: e.target.value } : i,
                                    ),
                                })
                            }
                            placeholder="Optional notes..."
                            sx={{ mt: 0.5 }}
                        />
                    </Box>
                ))}
            </Stack>
        </AccordionDetails>
    </Accordion>
);

export default PanelNotesSection;
