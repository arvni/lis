import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import React, {useState} from "react";

import SelectSearch from "@/Components/SelectSearch.jsx";
import FilterTemplate from "@/Components/FilterWraper.jsx";

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleChange = (e) => setFilter(prevState => ({...prevState, [e.target.name]: e.target.value}))
    return (
        <FilterTemplate onFilter={onFilter(filter)}>
            <Grid size={{xs: 6, sm: 4}}>
                <TextField sx={{width: "100%"}}
                           name="search"
                           value={filter?.search}
                           onChange={handleChange}
                           label="Search title"/>
            </Grid>
            <Grid size={{xs: 6, sm: 4}}>
                <SelectSearch filterSelectedOptions
                              value={filter?.parent}
                              label="Parent"
                              fullWidth
                              onChange={handleChange}
                              name="parent"
                              url={route("api.sectionGroups.list")}/>
            </Grid>
        </FilterTemplate>
    );
}

export default Filter;
