import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import {useState} from "react";
import FilterTemplate from "@/Components/FilterWraper.jsx";

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleChange = (e) => {
        setFilter(prevState => ({...prevState, search: e.target.value}))
    };

    return (
        <FilterTemplate onFilter={onFilter(filter)}>
            <Grid isize={{xs: 12, sm: 4}}>
                <TextField fullWidth
                           name="search"
                           value={filter?.search}
                           onChange={handleChange}
                           label="Search title"/>
            </Grid>
        </FilterTemplate>
    );
}

export default Filter;
