import React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Paper } from "@mui/material";

const FormAccordion = ({
                           children,
                           title,
                           id,
                           defaultExpanded = false,
                           icon = null
                       }) => (
    <Paper elevation={1} sx={{ mb: 3, overflow: "hidden", borderRadius: 2 }}>
        <Accordion defaultExpanded={defaultExpanded} disableGutters>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={id}
                id={id}
                sx={{
                    backgroundColor: "primary.light",
                    color: "primary.contrastText",
                    minHeight: 60
                }}
            >
                <Box display="flex" alignItems="center">
                    {icon && <Box mr={1}>{icon}</Box>}
                    <Typography variant="h6">{title}</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
                {children}
            </AccordionDetails>
        </Accordion>
    </Paper>
);

export default FormAccordion;
