import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SelectSearch from '@/Components/SelectSearch.jsx';

const OwnerFilter = ({ ownerType, ownerObject, onOwnerTypeChange, onOwnerChange }) => (
    <>
        {/* Owner Type Selector */}
        <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
                <InputLabel id="owner-type-label">Owner Type</InputLabel>
                <Select
                    labelId="owner-type-label"
                    id="owner-type-select"
                    value={ownerType}
                    label="Owner Type"
                    onChange={onOwnerTypeChange}
                    startAdornment={
                        <InputAdornment position="start">
                            <PersonIcon color="action" />
                        </InputAdornment>
                    }
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value="referrer">Referrer</MenuItem>
                    <MenuItem value="patient">Patient</MenuItem>
                </Select>
            </FormControl>
        </Grid>

        {/* Owner (Referrer/Patient) Filter */}
        <Grid size={{ xs: 12, md: 6 }}>
            {ownerType ? (
                <SelectSearch
                    key={ownerType}
                    fullWidth
                    label={ownerType === 'referrer' ? 'Select Referrer' : 'Select Patient'}
                    url={
                        ownerType === 'referrer'
                            ? route('api.referrers.list')
                            : route('api.patients.list')
                    }
                    value={ownerObject}
                    name="owner_id"
                    onChange={onOwnerChange}
                />
            ) : (
                <TextField
                    fullWidth
                    label="Select Owner"
                    disabled
                    placeholder="Select owner type first"
                    helperText="Please select an owner type first"
                />
            )}
        </Grid>
    </>
);

export default OwnerFilter;
