import { useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Chip,
    Collapse,
    Grid,
    ListItemButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import {
    Person,
    Science,
    ExpandMore,
    ExpandLess,
    MedicalServices,
} from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB');
    } catch (e) {
        return dateString;
    }
};

// Test Order Item Component
const TestOrderItem = ({ orderItem }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Paper elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
            {/* Test Header */}
            <ListItemButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                    bgcolor: 'primary.50',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    py: 2,
                }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <MedicalServices />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                            {orderItem.test?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Code: {orderItem.test?.code}
                        </Typography>
                    </Box>
                    <Chip
                        label={`${orderItem.samples?.length || 0} Samples`}
                        color="primary"
                        size="small"
                    />
                    <Chip
                        label={`${orderItem.patients?.length || 0} Patients`}
                        color="secondary"
                        size="small"
                    />
                </Stack>
                {expanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            {/* Expandable Content */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ p: 3 }}>
                    {/* Test Details */}
                    {orderItem.test?.turnaroundTime && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Turnaround Time:</strong> {orderItem.test.turnaroundTime}{' '}
                                days
                            </Typography>
                        </Alert>
                    )}

                    {/* Patients */}
                    {orderItem.patients?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="subtitle2"
                                gutterBottom
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <Person fontSize="small" color="primary" />
                                Associated Patients
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                                {orderItem.patients.map((patient) => (
                                    <Chip
                                        key={patient.id}
                                        avatar={<Avatar>{patient.fullName?.charAt(0)}</Avatar>}
                                        label={patient.fullName}
                                        variant={patient.is_main ? 'filled' : 'outlined'}
                                        color={patient.is_main ? 'primary' : 'default'}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Samples */}
                    {orderItem.samples?.length > 0 && (
                        <Box>
                            <Typography
                                variant="subtitle2"
                                gutterBottom
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <Science fontSize="small" color="primary" />
                                Sample Requirements
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                {orderItem.samples.map((sample, idx) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sample.id || idx}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                bgcolor: 'grey.50',
                                                '&:hover': { bgcolor: 'grey.100' },
                                            }}
                                        >
                                            <Stack spacing={1}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    Sample #{idx + 1}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Type:</strong>{' '}
                                                    {sample.sampleType?.name || 'Unknown'}
                                                </Typography>
                                                {sample.sampleId && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        <strong>ID:</strong> {sample.sampleId}
                                                    </Typography>
                                                )}
                                                {sample.collectionDate && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        Collected:{' '}
                                                        {formatDate(sample.collectionDate)}
                                                    </Typography>
                                                )}
                                                {sample.sampleType?.sample_id_required === 1 &&
                                                    !sample.sampleId && (
                                                        <Chip
                                                            label="ID Required"
                                                            size="small"
                                                            color="warning"
                                                            sx={{ mt: 1 }}
                                                        />
                                                    )}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default TestOrderItem;
