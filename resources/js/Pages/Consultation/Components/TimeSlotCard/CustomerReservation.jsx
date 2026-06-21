import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
    Person,
    Phone,
    Email,
    PersonOutlined,
    LocationOn,
} from '@mui/icons-material';

const CustomerReservation = ({ reservable, getThemedColor, getThemedBgColor }) => (
    <Box
        sx={{
            p: 2,
            backgroundColor: getThemedBgColor('blue.50', 'blue.900'),
            borderRadius: 2,
            border: '1px solid',
            borderColor: getThemedColor('blue.200', 'blue.700'),
        }}
    >
        <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ color: getThemedColor('blue.600', 'blue.300') }} />
                <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    sx={{ color: getThemedColor('blue.800', 'blue.100') }}
                >
                    Customer Appointment
                </Typography>
            </Box>

            <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutlined
                        fontSize="small"
                        sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                    />
                    <Typography
                        variant="body2"
                        sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                    >
                        <strong>Name:</strong> {reservable.name}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone
                        fontSize="small"
                        sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                    />
                    <Typography
                        component="a"
                        href={`tel:${reservable.phone}`}
                        variant="body2"
                        sx={{
                            color: getThemedColor('text.primary', 'grey.100'),
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                                color: 'primary.main',
                            },
                        }}
                    >
                        <strong>Phone:</strong> {reservable.phone}
                    </Typography>
                </Box>
                {reservable.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email
                            fontSize="small"
                            sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                        />
                        <Typography
                            component="a"
                            href={`mailto:${reservable.email}`}
                            variant="body2"
                            sx={{
                                color: getThemedColor('text.primary', 'grey.100'),
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: 'primary.main',
                                },
                            }}
                        >
                            <strong>Email:</strong> {reservable.email}
                        </Typography>
                    </Box>
                )}
                {reservable.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn
                            fontSize="small"
                            sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                        />
                        <Typography
                            variant="body2"
                            sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                        >
                            <strong>Location:</strong> {reservable.location}
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Stack>
    </Box>
);

export default CustomerReservation;
