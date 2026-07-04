import React from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, Today } from '@mui/icons-material';

const CalendarHeader = ({ label, isMobile, onPreviousMonth, onToday, onNextMonth }) => (
    <Box sx={{ mb: 2 }}>
        <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
            <Typography variant="h5" fontWeight="600" color="text.primary">
                {label}
            </Typography>
            <Stack direction="row" spacing={1}>
                <IconButton
                    onClick={onPreviousMonth}
                    color="primary"
                    aria-label="Previous month"
                    size={isMobile ? 'small' : 'medium'}
                >
                    <ArrowBackIos fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
                <IconButton
                    onClick={onToday}
                    color="primary"
                    aria-label="Go to today"
                    size={isMobile ? 'small' : 'medium'}
                >
                    <Today fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
                <IconButton
                    onClick={onNextMonth}
                    color="primary"
                    aria-label="Next month"
                    size={isMobile ? 'small' : 'medium'}
                >
                    <ArrowForwardIos fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
            </Stack>
        </Stack>
    </Box>
);

export default CalendarHeader;
