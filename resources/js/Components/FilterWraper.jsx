import AccordionSummary from "@mui/material/AccordionSummary";
import {Stack} from "@mui/material";
import FilterIcon from "@mui/icons-material/FilterAlt";
import React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const FilterTemplate = ({children, onFilter}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter();
    };
    return <Accordion>
        <AccordionSummary>
            <Stack direction="row" spacing={1} alignItems="center">
                <FilterIcon/>
                <Typography>Filters</Typography>
            </Stack>
        </AccordionSummary>
        <AccordionDetails>
            <form action={"#"} onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    {children}
                    <Grid size={{xs: 12, sm: 2}} sx={{display: "flex"}} justifyContent="center">
                        <Button variant="outlined" type="submit">Filter</Button>
                    </Grid>
                </Grid>
            </form>
        </AccordionDetails>
    </Accordion>
}
export default FilterTemplate;
