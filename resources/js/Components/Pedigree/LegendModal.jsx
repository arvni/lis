import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';

import LegendItem from './LegendItem';

// Legend Modal Component
const LegendModal = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Pedigree Chart Legend</DialogTitle>

        <DialogContent>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Individuals
                    </Typography>

                    <LegendItem shape="square" color="lightblue" label="Male" />

                    <LegendItem shape="circle" color="lightpink" label="Female" />

                    <LegendItem shape="diamond" color="lightgrey" label="Unknown Gender" />

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Status Indicators
                    </Typography>

                    <LegendItem
                        shape="square"
                        color="blue"
                        label="Affected Individual"
                        description="Has the medical condition"
                    />

                    <LegendItem
                        shape="marker"
                        label="Carrier"
                        description="Carries genetic trait but not affected"
                    />

                    <LegendItem shape="deceased" label="Deceased" />

                    <LegendItem
                        shape="proband"
                        label="Proband"
                        description="Starting point/index case"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Connection Types
                    </Typography>

                    <LegendItem shape="line-solid" label="Standard Relationship" />

                    <LegendItem shape="line-dashed" label="Uncertain Relationship" />

                    <LegendItem
                        shape="line-double"
                        label="Consanguineous Relationship"
                        description="Between blood relatives"
                    />

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Tips
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        • Use <b>Shift+Click</b> to select multiple individuals
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        • Select two individuals and click <b>Add Child</b> to create a new
                        individual between them
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        • Click on individuals or connections to edit their properties
                    </Typography>

                    <Typography variant="body2">
                        • Use the mouse wheel to zoom in/out or drag to pan around
                    </Typography>
                </Grid>
            </Grid>
        </DialogContent>

        <DialogActions>
            <Button onClick={onClose} variant="contained">
                Close
            </Button>
        </DialogActions>
    </Dialog>
);

LegendModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
};

export default LegendModal;
