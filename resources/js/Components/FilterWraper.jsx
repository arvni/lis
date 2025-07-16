import React from "react";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import {useTheme} from "@mui/material";

const FilterTemplate = ({children, onFilter}) => {
    const theme=useTheme();
    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter();
    };
    return <form action="#"
                 onSubmit={handleSubmit}
                 style={{background: theme.palette.background.paper,padding:"1rem",borderRadius:"1rem"}} >
        <Grid container spacing={2}>
            {children}
            <Grid size={{xs: 12, sm: 2}} sx={{display: "flex"}} justifyContent="center">
                <Button variant="outlined" type="submit">Filter</Button>
            </Grid>
        </Grid>
    </form>

}
export default FilterTemplate;
