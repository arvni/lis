import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import {Autocomplete, Box} from "@mui/material";
import {useState} from "react";
import FilterTemplate from "@/Components/FilterWraper.jsx";
import {omanWilayats} from "@/Data/omanWilayats.js";
import countries from "@/Data/Countries.js";

const governorateOptions = Object.keys(omanWilayats);
const genderOptions = [
    {value: "male", label: "Male"},
    {value: "female", label: "Female"},
    {value: "ambiguous", label: "Ambiguous"},
    {value: "none", label: "None"},
];

const formatDate = (date) => date.toISOString().split("T")[0];

// Age <-> date of birth conversions. Age range and DOB range describe the same
// constraint, so the UI keeps them in sync (older age => earlier birth date).
const ageMinToDobTo = (ageMin) => {
    if (ageMin === "" || ageMin === null || isNaN(ageMin)) return "";
    const d = new Date();
    d.setFullYear(d.getFullYear() - parseInt(ageMin, 10));
    return formatDate(d);
};
const ageMaxToDobFrom = (ageMax) => {
    if (ageMax === "" || ageMax === null || isNaN(ageMax)) return "";
    const d = new Date();
    d.setFullYear(d.getFullYear() - parseInt(ageMax, 10) - 1);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
};
const dobToAge = (dob) => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age < 0 ? "" : String(age);
};

const Filter = ({defaultFilter, onFilter}) => {
    const [filter, setFilter] = useState(defaultFilter);
    const handleChange = (e) => {
        setFilter(prevState => ({...prevState, search: e.target.value}))
    };
    const handleNationalityChange = (e, v) => {
        const code = v?.code || "";
        setFilter(prevState => ({
            ...prevState,
            nationality: code,
            // Governorate/wilayat only apply to Omani patients — clear them otherwise.
            ...(code === "OM" ? {} : {governorate: "", wilayat: ""})
        }));
    };
    const handleGovernorateChange = (e, v) => {
        // Changing governorate invalidates the previously selected wilayat.
        setFilter(prevState => ({...prevState, governorate: v || "", wilayat: ""}));
    };
    const handleWilayatChange = (e, v) => {
        setFilter(prevState => ({...prevState, wilayat: v || ""}));
    };
    // Age min is the youngest patient => latest birth date (dobTo).
    const handleAgeMinChange = (e) => {
        const ageMin = e.target.value;
        setFilter(prevState => ({...prevState, ageMin, dobTo: ageMinToDobTo(ageMin)}));
    };
    // Age max is the oldest patient => earliest birth date (dobFrom).
    const handleAgeMaxChange = (e) => {
        const ageMax = e.target.value;
        setFilter(prevState => ({...prevState, ageMax, dobFrom: ageMaxToDobFrom(ageMax)}));
    };
    const handleDobFromChange = (e) => {
        const dobFrom = e.target.value;
        setFilter(prevState => ({...prevState, dobFrom, ageMax: dobToAge(dobFrom)}));
    };
    const handleDobToChange = (e) => {
        const dobTo = e.target.value;
        setFilter(prevState => ({...prevState, dobTo, ageMin: dobToAge(dobTo)}));
    };
    const handleRegisteredFromChange = (e) => {
        setFilter(prevState => ({...prevState, registeredFrom: e.target.value}));
    };
    const handleRegisteredToChange = (e) => {
        setFilter(prevState => ({...prevState, registeredTo: e.target.value}));
    };
    const handleGenderChange = (e) => {
        setFilter(prevState => ({...prevState, gender: e.target.value}));
    };

    const isOmani = filter?.nationality === "OM";
    const wilayatOptions = filter?.governorate ? (omanWilayats[filter.governorate] ?? []) : [];
    const dateProps = {slotProps: {inputLabel: {shrink: true}}, type: "date", fullWidth: true};
    return <FilterTemplate onFilter={onFilter(filter)}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
            <TextField sx={{width: "100%"}} name={"search"} value={filter?.search ?? ""} onChange={handleChange}
                       label={"Search title"} />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
            <Autocomplete
                options={countries}
                value={countries.find(c => c.code === filter?.nationality) || null}
                onChange={handleNationalityChange}
                autoHighlight
                getOptionLabel={(option) => option.label || ''}
                isOptionEqualToValue={(option, value) => option.code === value.code}
                renderOption={({key, ...props}, option) => (
                    <Box key={key} component="li" sx={{'& > img': {mr: 2, flexShrink: 0}}} {...props}>
                        <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                            alt=""
                        />
                        {option.label} ({option.code})
                    </Box>
                )}
                renderInput={(params) => <TextField {...params} label="Nationality" />}
            />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
            <TextField select fullWidth label="Gender" name="gender"
                       value={filter?.gender ?? ""} onChange={handleGenderChange}>
                <MenuItem value="">All</MenuItem>
                {genderOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
            </TextField>
        </Grid>
        {isOmani && (
            <>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Autocomplete
                        options={governorateOptions}
                        value={filter?.governorate || null}
                        onChange={handleGovernorateChange}
                        getOptionLabel={(option) => option || ''}
                        isOptionEqualToValue={(option, value) => option === value}
                        renderInput={(params) => <TextField {...params} label="Governorate" />}
                    />
                </Grid>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Autocomplete
                        options={wilayatOptions}
                        value={filter?.wilayat || null}
                        onChange={handleWilayatChange}
                        getOptionLabel={(option) => option || ''}
                        isOptionEqualToValue={(option, value) => option === value}
                        disabled={!filter?.governorate}
                        renderInput={(params) => <TextField {...params} label="Wilayat"
                                                            placeholder={filter?.governorate ? "" : "Select governorate first"} />}
                    />
                </Grid>
            </>
        )}
        <Grid size={{xs: 6, sm: 3, md: 2}}>
            <TextField type="number" fullWidth label="Age From" name="ageMin"
                       value={filter?.ageMin ?? ""} onChange={handleAgeMinChange}
                       slotProps={{htmlInput: {min: 0, max: 120}}} />
        </Grid>
        <Grid size={{xs: 6, sm: 3, md: 2}}>
            <TextField type="number" fullWidth label="Age To" name="ageMax"
                       value={filter?.ageMax ?? ""} onChange={handleAgeMaxChange}
                       slotProps={{htmlInput: {min: 0, max: 120}}} />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
            <TextField {...dateProps} label="Date Of Birth From" name="dobFrom"
                       value={filter?.dobFrom ?? ""} onChange={handleDobFromChange} />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
            <TextField {...dateProps} label="Date Of Birth To" name="dobTo"
                       value={filter?.dobTo ?? ""} onChange={handleDobToChange} />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
            <TextField {...dateProps} label="Registered From" name="registeredFrom"
                       value={filter?.registeredFrom ?? ""} onChange={handleRegisteredFromChange} />
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
            <TextField {...dateProps} label="Registered To" name="registeredTo"
                       value={filter?.registeredTo ?? ""} onChange={handleRegisteredToChange} />
        </Grid>
    </FilterTemplate>;
}

export default Filter;
