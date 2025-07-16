import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import {useState} from "react";
import FilterTemplate from "@/Components/FilterWraper.jsx";
import SelectSearch from "@/Components/SelectSearch.jsx";

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleChange = (e) => setFilter(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleFilter=()=>onFilter(filter)();
    return (
        <FilterTemplate onFilter={handleFilter}>
            <Grid size={{xs:12,sm:4}}>
                <TextField fullWidth
                           name="search"
                           value={filter?.search||""}
                           onChange={handleChange}
                           label="Search title"/>
            </Grid>
            <Grid size={{xs:12,sm:4}}>
                <SelectSearch onChange={handleChange}
                              fullWidth
                              multiple
                              label="Test Groups"
                              url={route("api.testGroups.list")}
                              value={filter?.test_groups?.filter(item=>item.id)||[]}
                              name="test_groups"/>
            </Grid>
        </FilterTemplate>
    );
}

export default Filter;
