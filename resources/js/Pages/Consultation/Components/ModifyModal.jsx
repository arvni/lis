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

export default function ModifyModal({
                                        chart,
                                        pedigree,
                                        setModifyModalVisible,
                                        setMenuVisible,
                                    }) {
    const [sex, setSex] = useState("unknown");
    const [type, setType] = useState("");
    const [x, setX] = useState(pedigree.x);
    const [y, setY] = useState(pedigree.y);

    function createPedigree() {
        const newPedigree = chart.create(sex, x, y);
        if (type !== "") {
            switch (type) {
                case "proband":
                    newPedigree.setProband(true);
                    break;
                case "deceased":
                    newPedigree.setDeceased(true);
                    break;
                case "pregnant":
                    newPedigree.setPregnancy(true);
                    break;
                case "multiple":
                    newPedigree.setMultipleIndividuals(true, 4);
                    break;
            }
        }
        chart.replace(pedigree.id, newPedigree);
    }

    return (
        <Dialog
            open={true}
            onClose={() => setModifyModalVisible(false)}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>Modify pedigree</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sex</InputLabel>
                            <Select
                                value={sex}
                                label="Sex"
                                onChange={(e) => setSex(e.target.value)}
                            >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="unknown">Unknown</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={type}
                                label="Type"
                                onChange={(e) => setType(e.target.value)}
                            >
                                <MenuItem value="">Standard</MenuItem>
                                <MenuItem value="proband">Proband</MenuItem>
                                <MenuItem value="deceased">Deceased</MenuItem>
                                <MenuItem value="multiple">Multiple</MenuItem>
                                <MenuItem value="pregnant">Pregnant</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="X Position"
                            type="number"
                            size="small"
                            value={x}
                            onChange={(e) => setX(Number(e.target.value))}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Y Position"
                            type="number"
                            size="small"
                            value={y}
                            onChange={(e) => setY(Number(e.target.value))}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                        setModifyModalVisible(false);
                        setMenuVisible(false);
                    }}
                >
                    Close
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        createPedigree();
                        setModifyModalVisible(false);
                        setMenuVisible(false);
                    }}
                >
                    Modify
                </Button>
            </DialogActions>
        </Dialog>
    );
}
