import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import React, {useState} from "react";
import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from "@mui/material/Button";
import {Tab, Tabs} from "@mui/material";

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleTabChange = (e, settingClass) => {
        setFilter({settingClass});
        onFilter({settingClass})();
    }
    const handleChange = (e) => {
        setFilter(prevState => ({...prevState, search: e.target.value}))
    };
    return (<>
            <Tabs value={filter?.settingClass ?? "Payment"} onChange={handleTabChange}
                  aria-label="list of setting classes">
                <Tab value="Payment" label="Payment"/>
                <Tab value="Consultation" label="Consultation"/>
                <Tab value="Report" label="Report"/>
            </Tabs>
            <Accordion>
                <AccordionSummary>
                    <FilterIcon/>Filter
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={5}>
                            <TextField sx={{width: "100%"}} name={"search"} value={filter?.search}
                                       onChange={handleChange}
                                       label={"Search title"}/>
                        </Grid>
                        <Grid item xs={12} sm={2} sx={{display: "flex"}} justifyContent={"center"}>
                            <Button variant={"outlined"} onClick={onFilter(filter)}>Filter</Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </>
    );
}

export default Filter;
