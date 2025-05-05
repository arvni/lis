// src/components/modals/LegendModal.js
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LegendItem from './LegendItem';

/**
 * Modal displaying a legend for the pedigree chart symbols
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
const LegendModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="legend-dialog-title"
        >
            <DialogTitle
                id="legend-dialog-title"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}
            >
                Pedigree Chart Legend
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    size="small"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Column 1: Individuals & Status */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Individuals
                        </Typography>

                        <LegendItem
                            shape="square"
                            color="lightblue"
                            label="Male (Unaffected)"
                        />
                        <LegendItem
                            shape="circle"
                            color="lightpink"
                            label="Female (Unaffected)"
                        />
                        <LegendItem
                            shape="diamond"
                            color="lightgrey"
                            label="Unknown Gender"
                        />

                        <Divider sx={{ my: 2 }} />

                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Status Indicators
                        </Typography>

                        <LegendItem
                            shape="affected"
                            color="blue"
                            label="Affected Individual"
                            description="(Color may vary by gender)"
                        />
                        <LegendItem
                            shape="marker"
                            label="Carrier"
                            description="Genetic trait carrier (dot)"
                        />
                        <LegendItem
                            shape="deceased"
                            label="Deceased"
                            description="(Diagonal line)"
                        />
                        <LegendItem
                            shape="proband"
                            label="Proband / Index Case"
                            description="(Arrow marker)"
                        />
                    </Grid>

                    {/* Column 2: Connections & Tips */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Connection Types
                        </Typography>

                        <LegendItem
                            shape="line-solid"
                            label="Standard Relationship"
                        />
                        <LegendItem
                            shape="line-dashed"
                            label="Uncertain Relationship"
                            description="(Parentage unknown)"
                        />
                        <LegendItem
                            shape="line-double"
                            label="Consanguineous Relationship"
                            description="(Between blood relatives)"
                        />

                        <Divider sx={{ my: 2 }} />

                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Interaction Tips
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                            • Use <b>Shift + Click</b> to select multiple individuals
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                            • Select two parents, then click <b>Add Child</b>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                            • Click on individuals or connections to edit properties
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                            • Use mouse wheel or toolbar buttons to zoom
                        </Typography>
                        <Typography variant="body2" sx={{ pl: 2 }}>
                            • Click and drag on the background to pan
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    sx={{ px: 4 }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LegendModal;
