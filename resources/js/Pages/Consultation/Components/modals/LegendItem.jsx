import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Component for displaying a single item in the legend
 *
 * @param {Object} props - Component props
 * @param {string} props.shape - Shape type ('square', 'circle', 'diamond', 'marker', 'deceased', 'proband', 'affected', 'line-solid', 'line-dashed', 'line-double')
 * @param {string} props.color - Color for the shape (if applicable)
 * @param {string} props.label - Label text
 * @param {string} props.description - Optional description text
 */
const LegendItem = ({ shape, color = 'black', label, description }) => {
    // Render different shape types
    const renderShape = () => {
        switch (shape) {
            case 'square':
                return (
                    <Box sx={{
                        width: 20,
                        height: 20,
                        bgcolor: color,
                        borderRadius: 0,
                        mr: 1.5,
                        border: '1px solid #000'
                    }}/>
                );

            case 'circle':
                return (
                    <Box sx={{
                        width: 20,
                        height: 20,
                        bgcolor: color,
                        borderRadius: '50%',
                        mr: 1.5,
                        border: '1px solid #000'
                    }}/>
                );

            case 'diamond':
                return (
                    <Box sx={{
                        width: 20,
                        height: 20,
                        bgcolor: color,
                        mr: 1.5,
                        border: '1px solid #000',
                        transform: 'rotate(45deg)'
                    }}/>
                );

            case 'marker':
                return (
                    <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1.5 }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            bgcolor: 'black',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}/>
                    </Box>
                );

            case 'deceased':
                return (
                    <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1.5 }}>
                        <Box sx={{
                            width: '100%',
                            height: '2px',
                            bgcolor: 'black',
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            transform: 'rotate(45deg)'
                        }}/>
                    </Box>
                );

            case 'proband':
                return (
                    <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1.5 }}>
                        <Typography sx={{
                            position: 'absolute',
                            fontSize: '1.25rem',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            lineHeight: 1
                        }}>➤</Typography>
                    </Box>
                );

            case 'affected':
                return (
                    <Box sx={{ position: 'relative', width: 20, height: 20, mr: 1.5 }}>
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: color,
                            opacity: 0.8,
                            borderRadius: 0,
                            border: '1px solid #000'
                        }}/>
                    </Box>
                );

            case 'line-solid':
                return (
                    <Box sx={{
                        width: 35,
                        height: 2,
                        bgcolor: 'black',
                        mr: 1.5,
                        alignSelf: 'center'
                    }}/>
                );

            case 'line-dashed':
                return (
                    <Box sx={{
                        width: 35,
                        height: 2,
                        mr: 1.5,
                        borderTop: '2px dashed black',
                        alignSelf: 'center'
                    }}/>
                );

            case 'line-double':
                return (
                    <Box sx={{ position: 'relative', width: 35, height: 6, mr: 1.5, alignSelf: 'center' }}>
                        <Box sx={{ position: 'absolute', top: 0, width: '100%', height: 2, bgcolor: 'black' }}/>
                        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', height: 2, bgcolor: 'black' }}/>
                    </Box>
                );

            default:
                return <Box sx={{ width: 20, height: 20, mr: 1.5 }}/>;
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            mb: 1,
            py: 0.5
        }}>
            {renderShape()}
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
};

export default LegendItem;
