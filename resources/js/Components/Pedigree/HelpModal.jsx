import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';

// Help Modal Component
const HelpModal = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Pedigree Chart Help</DialogTitle>

        <DialogContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Getting Started
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
                A pedigree chart is a diagram that shows the occurrence and appearance of phenotypes
                of a particular gene or organism and its ancestors from one generation to the next.
                This tool allows you to create professional pedigree charts for genetic counseling,
                research, or educational purposes.
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Basic Controls
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Add Individuals:</b> Use the Male, Female, or Unknown buttons to add new
                        individuals to the chart.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Connect Individuals:</b> Drag from the handles (small dots) on one
                        individual to another to create connections.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Add Children:</b> Select two individuals (using Shift+Click), then click
                        the &quot;Add Child&quot; button.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Edit Properties:</b> Click on any individual or connection to edit its
                        properties in the side panel.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Delete:</b> Select elements and press Delete key or use the trash icon in
                        the editor panel.
                    </Typography>

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        Navigation
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Pan:</b> Click and drag on empty space to move around.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Zoom:</b> Use the mouse wheel or the zoom controls in the toolbar.
                    </Typography>

                    <Typography variant="body2">
                        <b>Fit View:</b> Click the &quot;Fit to View&quot; button to show all
                        elements.
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Advanced Features
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Auto-Arrange:</b> Automatically organize the family tree layout.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Save/Load:</b> Save your work as JSON and load it later to continue.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Export:</b> Export your pedigree chart as PNG or SVG for publications or
                        presentations.
                    </Typography>

                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        Status Indicators
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Affected:</b> Indicates an individual with the medical condition.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Carrier:</b> Indicates an individual who carries the gene but is not
                        affected.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <b>Deceased:</b> Indicates an individual who has died.
                    </Typography>

                    <Typography variant="body2">
                        <b>Proband:</b> Indicates the index case that brought the family to medical
                        attention.
                    </Typography>
                </Grid>
            </Grid>
        </DialogContent>

        <DialogActions>
            <Button onClick={onClose} variant="contained">
                Got It
            </Button>
        </DialogActions>
    </Dialog>
);

HelpModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
};

export default HelpModal;
