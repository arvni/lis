import React, {useState} from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FilterTemplate from "@/Components/FilterWraper.jsx";
import SelectSearch from "@/Components/SelectSearch.jsx";

const SampleCollectionFilter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter ?? {});

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFilter(prev => ({...prev, [name]: value}));
    };

    return (
        <FilterTemplate onFilter={onFilter(filter)}>
            <Grid size={{xs: 12, sm: 5}}>
                <TextField
                    fullWidth
                    name="search"
                    label="Search (patient name, ID)"
                    value={filter?.search ?? ''}
                    onChange={handleChange}
                />
            </Grid>
            <Grid size={{xs: 12, sm: 3}}>
                <SelectSearch
                    value={filter?.referrer ?? null}
                    onChange={handleChange}
                    label="Referrer"
                    fullWidth
                    name="referrer"
                    url={route("api.referrers.list")}
                />
            </Grid>
            <Grid size={{xs: 12, sm: 2}}>
                <TextField
                    fullWidth
                    name="from_date"
                    label="From Date"
                    type="date"
                    value={filter?.from_date ?? ''}
                    onChange={handleChange}
                    slotProps={{inputLabel: {shrink: true}}}
                />
            </Grid>
            <Grid size={{xs: 12, sm: 2}}>
                <TextField
                    fullWidth
                    name="to_date"
                    label="To Date"
                    type="date"
                    value={filter?.to_date ?? ''}
                    onChange={handleChange}
                    slotProps={{inputLabel: {shrink: true}}}
                />
            </Grid>
        </FilterTemplate>
    );
};

export default SampleCollectionFilter;
