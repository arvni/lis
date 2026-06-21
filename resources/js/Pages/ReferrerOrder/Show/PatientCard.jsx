import { Avatar, Box, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import {
    Person,
    PersonAdd,
    CalendarToday,
    Email,
    Phone,
    HomeWork,
    Public,
    Male,
    Female,
    Fingerprint,
    Info,
    Biotech,
} from '@mui/icons-material';

const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
        return new Date(dateString).toLocaleDateString('en-GB');
    } catch (e) {
        return dateString;
    }
};

const getGenderInfo = (gender) => {
    const numGender = Number(gender);
    return numGender === 1
        ? { icon: <Male />, label: 'Male', color: 'primary.main' }
        : { icon: <Female />, label: 'Female', color: 'secondary.main' };
};

// Patient Card Component
const PatientCard = ({ patient, onSelectPatient, mainPatientID }) => {
    const genderInfo = getGenderInfo(patient.gender);
    const hasServerId = (patient.server_id || (patient.is_main && mainPatientID)) ?? false;
    return (
        <Paper
            elevation={patient.is_main ? 3 : 1}
            onClick={() => !hasServerId && onSelectPatient && onSelectPatient(patient)}
            sx={{
                p: 3,
                height: '100%',
                border: patient.is_main ? '2px solid' : '1px solid',
                borderColor: patient.is_main ? 'primary.main' : 'divider',
                bgcolor: patient.is_main ? 'primary.50' : 'background.paper',
                transition: 'all 0.3s ease',
                cursor: !hasServerId ? 'pointer' : 'default',
                position: 'relative',
                '&:hover': {
                    boxShadow: !hasServerId ? 6 : patient.is_main ? 3 : 1,
                    transform: !hasServerId ? 'translateY(-2px)' : 'none',
                },
            }}
        >
            {/* Header */}
            <Stack
                direction="row"
                mb={2}
                sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: patient.is_main ? 'primary.main' : 'grey.400',
                            width: 56,
                            height: 56,
                        }}
                    >
                        <Person fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            {patient.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ref ID: {patient.reference_id || 'N/A'}
                        </Typography>
                    </Box>
                </Stack>
                <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                    {patient.is_main && (
                        <Chip
                            label="Main Patient"
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                    {!hasServerId && (
                        <Chip
                            label="Click to Add"
                            color="warning"
                            size="small"
                            icon={<PersonAdd fontSize="small" />}
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Patient Details */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {genderInfo.icon}
                            <Typography variant="body2" color="text.secondary">
                                <strong>Gender:</strong> {genderInfo.label}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>DOB:</strong> {formatDate(patient.dateOfBirth)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Public fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Nationality:</strong> {patient.nationality?.label || 'N/A'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Fingerprint fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>ID No:</strong> {patient.id_no || 'N/A'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Info fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                <strong>Consanguineous:</strong>{' '}
                                {patient.consanguineousParents === '1'
                                    ? 'Yes'
                                    : patient.consanguineousParents === '0'
                                      ? 'No'
                                      : 'Unknown'}
                            </Typography>
                        </Box>

                        {patient.isFetus && (
                            <Chip
                                label="Fetus"
                                size="small"
                                color="info"
                                icon={<Biotech fontSize="small" />}
                            />
                        )}
                    </Stack>
                </Grid>

                {/* Contact Information (only for main patient) */}
                {patient.is_main && patient.contact && (
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }}>
                            <Chip label="Contact Information" size="small" />
                        </Divider>
                        <Stack spacing={1}>
                            {patient.contact.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email fontSize="small" color="action" />
                                    <Typography variant="body2">{patient.contact.email}</Typography>
                                </Box>
                            )}
                            {patient.contact.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Phone fontSize="small" color="action" />
                                    <Typography variant="body2">{patient.contact.phone}</Typography>
                                </Box>
                            )}
                            {patient.contact.address && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <HomeWork fontSize="small" color="action" sx={{ mt: 0.5 }} />
                                    <Typography variant="body2">
                                        {patient.contact.address}
                                        {patient.contact.city && <>, {patient.contact.city}</>}
                                        {patient.contact.state && <>, {patient.contact.state}</>}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
};

export default PatientCard;
