import React from 'react';
import {
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select
} from "@mui/material";

const TestTypeSelector = ({ testType, onChange, error }) => (
    <FormControl fullWidth>
        <InputLabel id="test-type">Test Type</InputLabel>
        <Select
            onChange={onChange}
            name="testType"
            label="Test Type"
            value={testType}
            fullWidth
            labelId="test-type"
        >
            <MenuItem value="TEST">Test</MenuItem>
            <MenuItem value="SERVICE">Service</MenuItem>
        </Select>
        <FormHelperText error={Boolean(error)}>{error}</FormHelperText>
    </FormControl>
);

export default TestTypeSelector;
