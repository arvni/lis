import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
} from "@mui/material";

const AddPedigreeModal = ({
                              open,
                              onClose,
                              chart,
                              pedigree,
                              onMenuClose,
                          }) => {
    const [sex, setSex] = useState("unknown");
    const [type, setType] = useState("");
    const [connectionType, setConnectionType] = useState("partnership"); // More specific
    const [xOffset, setXOffset] = useState(50); // More descriptive, default offset
    const [yOffset, setYOffset] = useState(50); // More descriptive, default offset

    const handleCreatePedigree = () => {
        if (!chart || !pedigree) return; // Safety check

        const newPedigree = chart.create(
            sex,
            pedigree.getX() + xOffset, // Use offset from parent
            pedigree.getY() + yOffset
        );

        if (type) {
            switch (type) {
                case "proband": newPedigree.setProband(true); break;
                case "deceased": newPedigree.setDeceased(true); break;
                case "pregnant": newPedigree.setPregnancy(true); break;
                case "multiple": newPedigree.setMultipleIndividuals(true, 4); break;
                default: break;
            }
        }

        chart.connect(pedigree, newPedigree, connectionType);
        onClose();
        onMenuClose(); // Close the menu as well
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Add New Pedigree Member</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sex</InputLabel>
                            <Select value={sex} label="Sex" onChange={(e) => setSex(e.target.value)}>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="unknown">Unknown</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select value={type} label="Type" onChange={(e) => setType(e.target.value)}>
                                <MenuItem value="">Standard</MenuItem>
                                <MenuItem value="proband">Proband</MenuItem>
                                <MenuItem value="deceased">Deceased</MenuItem>
                                <MenuItem value="multiple">Multiple</MenuItem>
                                <MenuItem value="pregnant">Pregnant</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Connection Type</InputLabel>
                            <Select
                                value={connectionType}
                                label="Connection Type"
                                onChange={(e) => setConnectionType(e.target.value)}
                            >
                                <MenuItem value="partnership">Partnership</MenuItem>
                                <MenuItem value="separation">Separation</MenuItem>
                                <MenuItem value="consanguineous">Consanguineous</MenuItem>
                                <MenuItem value="sibling">Sibling</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="X Offset"
                            type="number"
                            size="small"
                            value={xOffset}
                            onChange={(e) => setXOffset(Number(e.target.value))}
                            helperText="Offset from parent node"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Y Offset"
                            type="number"
                            size="small"
                            value={yOffset}
                            onChange={(e) => setYOffset(Number(e.target.value))}
                            helperText="Offset from parent node"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="contained" color="error" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={handleCreatePedigree}>
                    Add Member
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddPedigreeModal;
