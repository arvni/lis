import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';

const ConsultantInfo = ({ consultant, getThemedColor, getThemedBgColor }) => (
    <>
        <Typography
            variant="subtitle2"
            sx={{ color: getThemedColor('text.secondary', 'grey.400'), mb: 1 }}
        >
            Consultant
        </Typography>
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 2,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: getThemedBgColor('background.paper', 'grey.800'),
                border: '1px solid',
                borderColor: getThemedColor('grey.200', 'grey.600'),
            }}
        >
            <Avatar
                src={consultant.avatar}
                alt={consultant.name}
                sx={{
                    width: 48,
                    height: 48,
                    border: '2px solid',
                    borderColor: getThemedColor('primary.light', 'primary.dark'),
                    backgroundColor: getThemedBgColor('primary.light', 'primary.dark'),
                }}
            >
                {consultant.name?.charAt(0) || 'C'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
                <Typography
                    variant="body1"
                    fontWeight="600"
                    sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                >
                    {consultant.name}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                >
                    {consultant.title || 'Consultant'}
                </Typography>
            </Box>
        </Box>
    </>
);

export default ConsultantInfo;
