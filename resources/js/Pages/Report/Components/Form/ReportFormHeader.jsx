import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';

const ReportFormHeader = ({ activeStep }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ArticleIcon />
        <Typography variant="h6" fontWeight="500">
            Report Documentation
        </Typography>
        <Chip
            size="small"
            label={activeStep === 0 ? 'Draft' : activeStep === 1 ? 'Approved' : 'Published'}
            color={activeStep === 0 ? 'warning' : activeStep === 1 ? 'info' : 'success'}
            sx={{ ml: 2 }}
        />
    </Box>
);

export default ReportFormHeader;
