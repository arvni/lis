import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// --- Helper Component ---
const LegendItem = ({ color, shape, label, description }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {shape === 'square' && (
            <Box
                sx={{
                    width: 20,
                    height: 20,
                    bgcolor: color,
                    borderRadius: 0,
                    mr: 1,
                    border: '1px solid #000',
                }}
            />
        )}
        {shape === 'circle' && (
            <Box
                sx={{
                    width: 20,
                    height: 20,
                    bgcolor: color,
                    borderRadius: '50%',
                    mr: 1,
                    border: '1px solid #000',
                }}
            />
        )}
        {shape === 'diamond' && (
            <Box
                sx={{
                    width: 20,
                    height: 20,
                    bgcolor: color,
                    mr: 1,
                    border: '1px solid #000',
                    transform: 'rotate(45deg)',
                }}
            />
        )}
        {shape === 'marker' && (
            <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1 }}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        bgcolor: 'black',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            </Box>
        )}
        {shape === 'deceased' && (
            <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1 }}>
                <Box
                    sx={{
                        width: '100%',
                        height: '2px',
                        bgcolor: 'black',
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        transform: 'rotate(45deg)',
                    }}
                />
            </Box>
        )}
        {shape === 'proband' && (
            <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1 }}>
                <Typography sx={{ position: 'absolute', fontSize: '1.25rem' }}>➤</Typography>
            </Box>
        )}
        {shape === 'line-solid' && <Box sx={{ width: 30, height: 2, bgcolor: 'black', mr: 1 }} />}
        {shape === 'line-dashed' && (
            <Box
                sx={{
                    width: 30,
                    height: 2,
                    bgcolor: 'black',
                    mr: 1,
                    borderTop: '2px dashed black',
                }}
            />
        )}
        {shape === 'line-double' && (
            <Box sx={{ position: 'relative', width: 30, height: 6, mr: 1 }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        height: 2,
                        bgcolor: 'black',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: 2,
                        bgcolor: 'black',
                    }}
                />
            </Box>
        )}
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {label}
            </Typography>
            {description && (
                <Typography variant="caption" color="text.secondary">
                    {description}
                </Typography>
            )}
        </Box>
    </Box>
);

LegendItem.propTypes = {
    color: PropTypes.string,
    shape: PropTypes.string,
    label: PropTypes.string,
    description: PropTypes.string,
};

export default LegendItem;
