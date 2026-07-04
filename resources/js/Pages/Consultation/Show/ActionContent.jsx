import React from 'react';
import { Typography, Button } from '@mui/material';
import { PlayArrow, CheckCircleOutlined } from '@mui/icons-material';
import ConsultationReport from './ConsultationReport';

// Render different actions based on consultation status
const ActionContent = ({ consultation, canEdit, onStart, onComplete, onEdit }) => {
    switch (consultation.status?.toLowerCase()) {
        case 'booked':
        case 'waiting':
            return (
                <Button
                    onClick={onStart}
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 4,
                        },
                    }}
                >
                    Start Consultation
                </Button>
            );
        case 'started':
            return (
                <Button
                    onClick={onComplete}
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleOutlined />}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 4,
                        },
                    }}
                >
                    Complete Consultation
                </Button>
            );
        case 'done':
            return (
                <ConsultationReport
                    consultation={consultation}
                    canEdit={canEdit}
                    onEdit={onEdit}
                />
            );
        default:
            return <Typography color="text.secondary">Status not recognized</Typography>;
    }
};

export default ActionContent;
