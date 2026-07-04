import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

const DetailsCell = ({ details, maxLength = 100 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!details) {
        return (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No details available
            </Typography>
        );
    }

    const shouldTruncate = details.length > maxLength;
    const displayText =
        expanded || !shouldTruncate ? details : `${details.substring(0, maxLength)}...`;

    return (
        <Box>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {displayText}
            </Typography>
            {shouldTruncate && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ minWidth: 'auto', p: 0, mt: 0.5, fontSize: '0.75rem' }}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                    {expanded ? 'Show less' : 'Read more'}
                </Button>
            )}
        </Box>
    );
};

export default DetailsCell;
