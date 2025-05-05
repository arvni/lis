// src/components/modals/EdgeSettingsModal.js
import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * Modal for changing the style/type of a selected edge
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onApply - Function to apply the selected style
 * @param {Object} props.currentEdge - Currently selected edge
 */
const EdgeSettingsModal = ({ isOpen, onClose, onApply, currentEdge }) => {
    // Determine the initial style based on the current edge
    const getInitialStyle = () => {
        if (!currentEdge) return 'solid';
        if (currentEdge.type === 'consanguineous') return 'double';
        if (currentEdge.style?.strokeDasharray) return 'dashed';
        return 'solid';
    };

    // Local state for the selected style
    const [selectedStyle, setSelectedStyle] = useState('solid');

    // Update state when the modal opens or the selected edge changes
    useEffect(() => {
        if (isOpen && currentEdge) {
            setSelectedStyle(getInitialStyle());
        }
        // Reset if modal closes or edge becomes null
        if (!isOpen || !currentEdge) {
            setSelectedStyle('solid');
        }
    }, [isOpen, currentEdge]); // Include currentEdge in dependencies

    // Handle style selection
    const handleStyleChange = (event) => {
        setSelectedStyle(event.target.value);
    };

    // Apply selected style and close modal
    const handleApply = () => {
        if (currentEdge) {
            onApply(selectedStyle);
        }
    };

    // Don't render anything if not open
    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            aria-labelledby="edge-settings-dialog-title"
        >
            <DialogTitle
                id="edge-settings-dialog-title"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}
            >
                Connection Style Settings
                <Tooltip title="Close" arrow>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent dividers>
                <DialogContentText sx={{ mb: 2 }}>
                    Choose the appropriate style for the selected connection:
                </DialogContentText>

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <RadioGroup
                        aria-label="connection-style"
                        name="connection-style-group"
                        value={selectedStyle}
                        onChange={handleStyleChange}
                    >
                        <Grid container spacing={1.5}>
                            {/* Solid Line Option */}
                            <Grid item xs={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderColor: selectedStyle === 'solid' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'solid' ? alpha('#1976d2', 0.05) : 'transparent',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: selectedStyle === 'solid' ? 'primary.main' : alpha('#1976d2', 0.3),
                                            bgcolor: selectedStyle === 'solid' ? alpha('#1976d2', 0.05) : alpha('#1976d2', 0.02),
                                        }
                                    }}
                                >
                                    <CardContent sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        py: 1,
                                        '&:last-child': { pb: 1 }
                                    }}>
                                        <Box sx={{
                                            mr: 2,
                                            flex: '0 0 40px',
                                            height: 2,
                                            bgcolor: 'black'
                                        }} />
                                        <FormControlLabel
                                            value="solid"
                                            control={<Radio />}
                                            label="Solid Line (Standard)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Dashed Line Option */}
                            <Grid item xs={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderColor: selectedStyle === 'dashed' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'dashed' ? alpha('#1976d2', 0.05) : 'transparent',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: selectedStyle === 'dashed' ? 'primary.main' : alpha('#1976d2', 0.3),
                                            bgcolor: selectedStyle === 'dashed' ? alpha('#1976d2', 0.05) : alpha('#1976d2', 0.02),
                                        }
                                    }}
                                >
                                    <CardContent sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        py: 1,
                                        '&:last-child': { pb: 1 }
                                    }}>
                                        <Box sx={{
                                            mr: 2,
                                            flex: '0 0 40px',
                                            height: 2,
                                            borderTop: '2px dashed black'
                                        }} />
                                        <FormControlLabel
                                            value="dashed"
                                            control={<Radio />}
                                            label="Dashed Line (Uncertain)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Double Line Option */}
                            <Grid item xs={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderColor: selectedStyle === 'double' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'double' ? alpha('#1976d2', 0.05) : 'transparent',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: selectedStyle === 'double' ? 'primary.main' : alpha('#1976d2', 0.3),
                                            bgcolor: selectedStyle === 'double' ? alpha('#1976d2', 0.05) : alpha('#1976d2', 0.02),
                                        }
                                    }}
                                >
                                    <CardContent sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        py: 1,
                                        '&:last-child': { pb: 1 }
                                    }}>
                                        <Box sx={{
                                            mr: 2,
                                            flex: '0 0 40px',
                                            position: 'relative',
                                            height: 6
                                        }}>
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                width: '100%',
                                                height: 2,
                                                bgcolor: 'black'
                                            }} />
                                            <Box sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '100%',
                                                height: 2,
                                                bgcolor: 'black'
                                            }} />
                                        </Box>
                                        <FormControlLabel
                                            value="double"
                                            control={<Radio />}
                                            label="Double Line (Consanguineous)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </RadioGroup>
                </FormControl>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{ mr: 1 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleApply}
                    variant="contained"
                    disabled={!currentEdge}
                    startIcon={<EditIcon />}
                    color="primary"
                >
                    Apply Style
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EdgeSettingsModal;
