import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {useState} from "react";
import FilterTemplate from "@/Components/FilterWraper.jsx";
import SelectSearch from "@/Components/SelectSearch.jsx";

const ApprovingFilter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const [reporter, setReporter] = useState(defaultFilter?.reporter_object ?? null);

    const handleChange = (e) => {
        setFilter(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleReporterChange = (e) => {
        const value = e.target.value;
        setReporter(value);
        setFilter(prev => ({...prev, reporter_id: value?.id ?? null}));
    };

    return (
        <FilterTemplate onFilter={onFilter(filter)}>
            <Grid size={{xs: 12, sm: 4}}>
                <TextField
                    fullWidth
                    name="search"
                    value={filter?.search ?? ""}
                    onChange={handleChange}
                    label="Search (patient / test)"
                />
            </Grid>
            <Grid size={{xs: 12, sm: 4}}>
                <SelectSearch
                    fullWidth
                    name="reporter_id"
                    label="Reporter"
                    url={route("api.users.list")}
                    value={reporter}
                    onChange={handleReporterChange}
                />
            </Grid>
        </FilterTemplate>
    );
};

export default ApprovingFilter;
