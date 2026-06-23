import { Box, Stack, Typography, alpha } from '@mui/material';
import { Person, Business } from '@mui/icons-material';

const InvoiceSummary = ({ theme, formData }) => (
    <Box
        sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
        }}
    >
        <Typography variant="subtitle2" gutterBottom>
            Invoice Summary
        </Typography>

        <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                    Acceptance ID
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                    #{formData.acceptance_id}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                    Owner
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                    {formData.owner_type === 'patient'
                        ? formData.patient?.fullName
                        : formData.referrer?.fullName || formData.referrer?.name}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                    Type
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    {formData.owner_type === 'patient' ? (
                        <>
                            <Person fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                            Patient Invoice
                        </>
                    ) : (
                        <>
                            <Business fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />
                            Referrer Invoice
                        </>
                    )}
                </Typography>
            </Box>
        </Stack>
    </Box>
);

export default InvoiceSummary;
