import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import { PersonOutlined } from '@mui/icons-material';
import PatientInfo from '@/Pages/Patient/Components/PatientInfo';

const PatientInfoCard = ({ patient }) => (
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
                <PersonOutlined />
                <Typography variant="h6">Patient Information</Typography>
            </Box>
        </Box>
        <Box sx={{ p: 2 }}>
            <PatientInfo patient={patient} viewPatient={true} />
        </Box>
    </Paper>
);

export default PatientInfoCard;
