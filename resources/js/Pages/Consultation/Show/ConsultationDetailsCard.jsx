import React from 'react';
import { Typography, Divider, Paper, Box, Chip, Grid } from '@mui/material';
import {
    MedicalServicesOutlined,
    CalendarToday,
    LocalHospital,
    EventAvailable,
    AccessTime,
    AccessTimeFilledOutlined,
} from '@mui/icons-material';
import Counter from '@/Components/Counter';
import ActionContent from './ActionContent';
import { formatDate } from './helpers';

const ConsultationDetailsCard = ({
    consultant,
    consultation,
    canEdit,
    onStart,
    onComplete,
    onEdit,
}) => (
    <Paper
        elevation={2}
        sx={{
            p: 0,
            borderRadius: 2,
            overflow: 'hidden',
            height: '100%',
        }}
    >
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesOutlined />
                <Typography variant="h6">Consultation Details</Typography>
            </Box>
        </Box>

        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalHospital color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            Consultant
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {consultant.name || 'Not assigned'}
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                            Due Date
                        </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {formatDate(consultation.dueDate) || 'Not scheduled'}
                    </Typography>
                </Grid>

                {consultation.started_at && (
                    <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <EventAvailable color="primary" fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                    Started At
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {formatDate(consultation.started_at)}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <AccessTimeFilledOutlined color="primary" fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                    Duration
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    mt: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {consultation.status === 'done' ? (
                                    <Chip
                                        icon={<AccessTime fontSize="small" />}
                                        label={`${consultation.duration} minutes`}
                                        variant="outlined"
                                        color="info"
                                        size="small"
                                        sx={{ borderRadius: 1 }}
                                    />
                                ) : (
                                    <Counter date={consultation.started_at} />
                                )}
                            </Box>
                        </Grid>
                    </>
                )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActionContent
                    consultation={consultation}
                    canEdit={canEdit}
                    onStart={onStart}
                    onComplete={onComplete}
                    onEdit={onEdit}
                />
            </Box>
        </Box>
    </Paper>
);

export default ConsultationDetailsCard;
