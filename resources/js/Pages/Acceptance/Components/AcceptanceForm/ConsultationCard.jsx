import React, { memo } from 'react';
import { Box, Typography, Divider, Card, CardContent, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    AccessTime,
    CalendarToday,
    EventAvailable,
    LocalHospital,
    PersonOutlined,
} from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateString;
    }
};

const ConsultationCard = memo(({ initialData: { patient, consultant, ...consultation } }) => {
    return (
        <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <PersonOutlined />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {patient.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {patient.age} years • {patient.gender}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                        <Grid size={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocalHospital color="primary" fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                    Consultant
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                                {consultant.name || 'Not assigned'}
                            </Typography>
                        </Grid>

                        <Grid size={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday color="primary" fontSize="small" />
                                <Typography variant="body2" color="text.secondary">
                                    Due Date
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {formatDate(consultation.dueDate)}
                            </Typography>
                        </Grid>

                        {consultation.started_at && (
                            <>
                                <Grid size={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EventAvailable color="primary" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            Started At
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {formatDate(consultation.started_at)}
                                    </Typography>
                                </Grid>

                                <Grid size={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTime color="primary" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            Duration
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {consultation.duration} minutes
                                    </Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>

                    {consultation.status === 'done' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Report Summary
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        maxHeight: 80,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {consultation.information.report || 'No report available'}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
});
ConsultationCard.displayName = 'ConsultationCard';

export default ConsultationCard;
