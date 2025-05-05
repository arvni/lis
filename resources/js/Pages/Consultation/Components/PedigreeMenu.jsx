import React from "react";
import {
    Box,
    Button,
    ButtonGroup,
    Paper,
} from "@mui/material";

export default function PedigreeMenu({
                                         x,
                                         y,
                                         chart,
                                         pedigree,
                                         onClose,
                                         onAdd,
                                         onModify,
                                     }) {
    function generateParents() {
        if (!chart || !pedigree) return;  // Safety check

        const father = chart.create(
            "male",
            pedigree.getRawX() - 90,
            pedigree.getRawY() - 150
        );
        const mother = chart.create(
            "female",
            pedigree.getRawX() + 90,
            pedigree.getRawY() - 150
        );
        chart.connect(father, mother, "partnership");
        chart.connect(mother, pedigree, "sibling");
    }

    return (
        <Box
            component={Paper}
            elevation={3}
            sx={{
                position: "absolute",
                top: y + 20,
                left: x + 30,
                p: 1,
                borderRadius: 2,
            }}
        >
            <ButtonGroup variant="contained" size="small">
                <Button color="primary" onClick={onAdd}>
                    Add
                </Button>
                <Button color="warning" onClick={onModify}>
                    Modify
                </Button>
                <Button
                    color="error"
                    onClick={() => {
                        if (chart && pedigree) {
                            chart.delete(pedigree.id);
                        }
                        onClose();
                    }}
                >
                    Remove
                </Button>
                <Button color="success" onClick={() => {
                    generateParents();
                    onClose();
                }}>
                    Generate Parents
                </Button>
            </ButtonGroup>
        </Box>
    );
}
