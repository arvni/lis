import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { alpha } from '@mui/material/styles';

const getInitialStyle = (selectedEdge) => {
    if (!selectedEdge) return 'solid';
    if (selectedEdge.type === 'consanguineous') return 'double';
    if (selectedEdge.style?.strokeDasharray) return 'dashed';
    return 'solid';
};

// --- Edge Settings Modal Component ---
const EdgeSettingsModal = ({ open, disabled, selectedEdge, onClose, onApply }) => {
    const [selectedStyle, setSelectedStyle] = useState(() => getInitialStyle(selectedEdge));

    // Initialize the selection from the current edge each time the modal opens.
    useEffect(() => {
        if (open) setSelectedStyle(getInitialStyle(selectedEdge));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (disabled) return null; // Don't render modal if disabled

    const handleStyleChange = (event) => {
        setSelectedStyle(event.target.value);
    };

    const handleApply = () => {
        onApply(selectedStyle);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Connection Style Settings</DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Choose the appropriate style for this connection:
                </DialogContentText>

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <RadioGroup
                        aria-label="connection-style"
                        name="connection-style-group"
                        value={selectedStyle}
                        onChange={handleStyleChange}
                    >
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        mb: 1,
                                        borderColor:
                                            selectedStyle === 'solid' ? 'primary.main' : 'divider',
                                        bgcolor:
                                            selectedStyle === 'solid'
                                                ? alpha('#1976d2', 0.05)
                                                : 'transparent',
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': { pb: 1 },
                                        }}
                                    >
                                        <Box sx={{ mr: 2, flex: '0 0 auto' }}>
                                            <Box sx={{ width: 40, height: 2, bgcolor: 'black' }} />
                                        </Box>
                                        <FormControlLabel
                                            value="solid"
                                            control={<Radio />}
                                            label="Solid Line (Standard Relationship)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        mb: 1,
                                        borderColor:
                                            selectedStyle === 'dashed' ? 'primary.main' : 'divider',
                                        bgcolor:
                                            selectedStyle === 'dashed'
                                                ? alpha('#1976d2', 0.05)
                                                : 'transparent',
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': { pb: 1 },
                                        }}
                                    >
                                        <Box sx={{ mr: 2, flex: '0 0 auto' }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 0,
                                                    borderTop: '2px dashed black',
                                                }}
                                            />
                                        </Box>
                                        <FormControlLabel
                                            value="dashed"
                                            control={<Radio />}
                                            label="Dashed Line (Uncertain Relationship)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={12}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        borderColor:
                                            selectedStyle === 'double' ? 'primary.main' : 'divider',
                                        bgcolor:
                                            selectedStyle === 'double'
                                                ? alpha('#1976d2', 0.05)
                                                : 'transparent',
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': { pb: 1 },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                mr: 2,
                                                flex: '0 0 auto',
                                                position: 'relative',
                                                height: 10,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    width: 40,
                                                    height: 2,
                                                    bgcolor: 'black',
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    width: 40,
                                                    height: 2,
                                                    bgcolor: 'black',
                                                }}
                                            />
                                        </Box>
                                        <FormControlLabel
                                            value="double"
                                            control={<Radio />}
                                            label="Double Line (Consanguineous Relationship)"
                                            sx={{ m: 0, flex: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </RadioGroup>
                </FormControl>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleApply} variant="contained" startIcon={<EditIcon />}>
                    Apply Style
                </Button>
            </DialogActions>
        </Dialog>
    );
};

EdgeSettingsModal.propTypes = {
    open: PropTypes.bool,
    disabled: PropTypes.bool,
    selectedEdge: PropTypes.object,
    onClose: PropTypes.func,
    onApply: PropTypes.func,
};

export default EdgeSettingsModal;
