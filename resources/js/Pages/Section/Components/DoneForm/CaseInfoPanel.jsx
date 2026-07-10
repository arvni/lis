import React from 'react';
import { Box, Chip, Grid, Paper, Typography, useTheme } from '@mui/material';
import { LocalHospital, MedicalServices, Science } from '@mui/icons-material';

/**
 * The case-information header block: patients, sample, and test summary.
 * Shows a batch header when acting on multiple items.
 */
const CaseInfoPanel = ({ acceptanceItemState }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 3,
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
            }}
        >
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                {acceptanceItemState?.ids?.length > 1
                    ? `Batch Processing (${acceptanceItemState.ids.length} items)`
                    : 'Case Information'}
            </Typography>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocalHospital color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Patients ID/Age/Gender:
                        </Typography>
                        {acceptanceItemState?.patients?.map((patient) => (
                            <Typography key={patient.id} variant="body1" fontWeight="medium">
                                {`${patient?.id || '-'} / ${patient?.age || '-'} / ${patient?.gender || '-'}`}
                            </Typography>
                        ))}
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Science color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Sample Type/Date:
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {`${acceptanceItemState?.sample?.sampleType || '-'} / ${acceptanceItemState?.sample?.created_at || '-'}`}
                        </Typography>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MedicalServices color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            Test Name:
                        </Typography>
                        <Chip
                            label={acceptanceItemState?.test?.name || '-'}
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 'medium' }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default CaseInfoPanel;
