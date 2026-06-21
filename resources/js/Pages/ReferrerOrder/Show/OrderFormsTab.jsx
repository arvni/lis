import { Alert, Box, Divider, Grid, Paper, Stack, Typography } from '@mui/material';

const OrderFormsTab = ({ orderForms }) =>
    orderForms && Object.keys(orderForms).length > 0 ? (
        <Grid container spacing={3}>
            {Object.entries(orderForms).map(([formKey, formData], index) => (
                <Grid size={{ xs: 12, md: 6 }} key={index}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            {formKey}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={2}>
                            {formData.map((item, idx) => (
                                <Box key={idx}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        fontWeight={500}
                                    >
                                        {item.label}
                                    </Typography>
                                    <Typography variant="body1">
                                        {item.value || 'Not specified'}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    ) : (
        <Alert severity="info">No order form data available.</Alert>
    );

export default OrderFormsTab;
