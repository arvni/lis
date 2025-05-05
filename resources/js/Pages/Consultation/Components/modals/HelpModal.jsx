import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

/**
 * Modal providing help and instructions for using the pedigree chart
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 */
const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="help-dialog-title"
        >
            <DialogTitle
                id="help-dialog-title"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}
            >
                Pedigree Chart Help
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    size="small"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        What is a Pedigree Chart?
                    </Typography>
                    <Typography paragraph sx={{ mb: 0 }}>
                        A pedigree chart is a visual tool used in genetics to track traits, diseases, or genetic
                        relationships across generations of a family. It uses standardized symbols and connections
                        to represent individuals and their biological relationships.
                    </Typography>
                </Paper>

                <Grid container spacing={3}>
                    {/* Column 1: Basic Controls & Navigation */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            Creating Your Pedigree
                        </Typography>

                        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Add Individuals:</b> Use the <Typography component="span" sx={{ color: 'blue' }}>Male</Typography>,
                                    <Typography component="span" sx={{ color: 'deeppink' }}> Female</Typography>, or
                                    <Typography component="span" sx={{ color: 'dimgray' }}> Unknown</Typography> buttons in the toolbar.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Connect Individuals:</b> Click and drag from a handle (small dot) on one person to a handle on another.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Add Children:</b> Select exactly two parents (hold Shift key while clicking),
                                    then click the "Add Child" button.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Edit Properties:</b> Click any individual or connection line to see and modify its properties
                                    in the panel that appears on the right.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <b>Delete:</b> Select elements and press <kbd>Delete</kbd> key or use the
                                    <Typography component="span" color="error"> trash icon</Typography> in the editor panel.
                                </Typography>
                            </li>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Navigation
                        </Typography>

                        <Box component="ul" sx={{ pl: 2 }}>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Pan:</b> Click and drag on the empty background to move around the chart.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Zoom:</b> Use the mouse wheel or the +/- buttons in the toolbar.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <b>Fit View:</b> Click the "Fit to View" button (screen icon) to see all elements.
                                </Typography>
                            </li>
                        </Box>
                    </Grid>

                    {/* Column 2: Advanced Features & Status */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Saving & Exporting
                        </Typography>

                        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Save:</b> Click the save icon (disk) to download your pedigree as a JSON file that can be loaded later.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Load:</b> Click the folder icon to upload a previously saved pedigree JSON file.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Export Image:</b> Use the PNG or SVG icons to export your chart as an image for reports or presentations.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <b>View Legend:</b> Click the list icon to see a complete legend of all symbols used.
                                </Typography>
                            </li>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Typography
                            variant="subtitle1"
                            sx={{
                                mb: 1.5,
                                fontWeight: 'bold',
                                color: 'primary.main'
                            }}
                        >
                            Individual Status Options
                        </Typography>

                        <Box component="ul" sx={{ pl: 2 }}>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Affected:</b> Indicates the individual has the medical condition or trait being tracked.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Carrier:</b> Indicates the individual carries the genetic trait but doesn't show symptoms.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <b>Deceased:</b> Indicates the individual is deceased.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <b>Proband:</b> Indicates this is the index case or starting point of the study.
                                </Typography>
                            </li>
                        </Box>
                    </Grid>
                </Grid>

                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        borderRadius: 1
                    }}
                >
                    <Typography variant="body2">
                        <b>Tip:</b> For more detailed information about pedigree chart standards and genetic symbols,
                        refer to the Bennett et al. (1995) guidelines or the National Society of Genetic Counselors'
                        standardized human pedigree nomenclature.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    sx={{ px: 4 }}
                >
                    Got It
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default HelpModal;
