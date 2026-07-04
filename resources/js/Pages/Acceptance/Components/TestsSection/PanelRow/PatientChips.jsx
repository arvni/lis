import React, { useState } from 'react';
import { Box, Chip, Button } from '@mui/material';

const PatientChips = ({ patients, maxVisible = 3 }) => {
    const [showAll, setShowAll] = useState(false);

    // Filter out any null/undefined patients from the array
    const validPatients = (patients || []).filter(Boolean);

    if (!validPatients.length) return null;

    const visiblePatients = showAll ? validPatients : validPatients.slice(0, maxVisible);
    const remainingCount = validPatients.length - maxVisible;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
            {visiblePatients.map((patient, index) => (
                <Chip
                    key={index}
                    label={patient.fullName || patient.name || 'Unknown Patient'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                />
            ))}
            {remainingCount > 0 && !showAll && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(true)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    +{remainingCount} more
                </Button>
            )}
            {showAll && patients.length > maxVisible && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(false)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    Show less
                </Button>
            )}
        </Box>
    );
};

export default PatientChips;
