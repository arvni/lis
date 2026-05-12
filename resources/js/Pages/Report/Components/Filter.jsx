import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {useState} from "react";
import FilterTemplate from "@/Components/FilterWraper.jsx";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {format, isValid} from "date-fns";

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);

    const handleChange = (e) => {
        setFilter(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleDateChange = (field) => (date) => {
        setFilter(prev => ({
            ...prev,
            [field]: date && isValid(date) ? format(date, "yyyy-MM-dd") : null,
        }));
    };

    const parseDate = (value) => {
        if (!value) return null;
        const d = new Date(value);
        return isValid(d) ? d : null;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                <Grid size={{xs: 12, sm: 3}}>
                    <DatePicker
                        label="From Date"
                        value={parseDate(filter?.from_date)}
                        onChange={handleDateChange("from_date")}
                        slotProps={{textField: {fullWidth: true}}}
                    />
                </Grid>
                <Grid size={{xs: 12, sm: 3}}>
                    <DatePicker
                        label="To Date"
                        value={parseDate(filter?.to_date)}
                        onChange={handleDateChange("to_date")}
                        slotProps={{textField: {fullWidth: true}}}
                    />
                </Grid>
            </FilterTemplate>
        </LocalizationProvider>
    );
};

export default Filter;
