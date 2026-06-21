import React from 'react';
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material';
import { MedicalServices, Phone, Badge } from '@mui/icons-material';
import { getStatusConfig } from './helpers';

const ConsultationReservation = ({ reservable, getThemedColor, getThemedBgColor }) => {
    const statusConfig = reservable.status ? getStatusConfig(reservable.status) : null;

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                border: '2px solid',
                borderColor: getThemedColor('primary.main', 'primary.light'),
                backgroundColor: getThemedBgColor('primary.50', 'primary.900'),
            }}
        >
            <Stack spacing={2}>
                {/* Header */}
                <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedicalServices
                            sx={{ color: getThemedColor('primary.main', 'primary.light') }}
                        />
                        <Typography
                            variant="subtitle1"
                            fontWeight="600"
                            sx={{ color: getThemedColor('primary.dark', 'primary.light') }}
                        >
                            Medical Consultation
                        </Typography>
                    </Box>

                    {statusConfig && (
                        <Chip
                            size="small"
                            icon={statusConfig.icon}
                            label={reservable.status}
                            color={statusConfig.color}
                            variant="filled"
                            sx={{ fontWeight: 500 }}
                        />
                    )}
                </Stack>

                {/* Patient Information */}
                {reservable.patient && (
                    <Box
                        sx={{
                            p: 1.5,
                            backgroundColor: getThemedBgColor('white', 'grey.800'),
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: getThemedColor('primary.light', 'primary.dark'),
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ color: getThemedColor('text.secondary', 'grey.400'), mb: 1 }}
                        >
                            Patient Details
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Avatar
                                src={reservable.patient.avatar}
                                alt={reservable.patient.fullName}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    border: '2px solid',
                                    borderColor: getThemedColor('primary.main', 'primary.light'),
                                    backgroundColor: getThemedBgColor(
                                        'primary.light',
                                        'primary.dark',
                                    ),
                                }}
                            >
                                {reservable.patient.fullName?.charAt(0) || 'P'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="body1"
                                    fontWeight="600"
                                    sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                                >
                                    {reservable.patient.fullName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Phone
                                        fontSize="small"
                                        sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                                    />
                                    <Typography
                                        component="a"
                                        href={`tel:${reservable.patient.phone}`}
                                        variant="body2"
                                        sx={{
                                            color: getThemedColor('text.secondary', 'grey.400'),
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                                color: 'primary.main',
                                            },
                                        }}
                                    >
                                        {reservable.patient.phone}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {reservable.patient.idNo && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Badge
                                    fontSize="small"
                                    sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                                >
                                    <strong>ID:</strong> {reservable.patient.idNo}
                                </Typography>
                            </Box>
                        )}

                        {reservable.notes && (
                            <Box
                                sx={{
                                    mt: 1.5,
                                    p: 1.5,
                                    backgroundColor: getThemedBgColor('grey.50', 'grey.700'),
                                    borderRadius: 1,
                                    borderLeft: '3px solid',
                                    borderColor: 'primary.main',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: getThemedColor('text.secondary', 'grey.300'),
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {reservable.notes}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default ConsultationReservation;
