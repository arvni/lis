import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    FormGroup,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { FIELDS } from './constants';

const PrintControls = ({ fields, onToggleField, printOnlyBarcode, fontSize, onFontSizeChange }) => (
    <Paper
        variant="outlined"
        sx={{
            mx: 2,
            mb: 2,
            p: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center',
            '@media print': { display: 'none' },
        }}
    >
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                Show on label
            </Typography>
            <FormGroup row>
                {FIELDS.map((f) => (
                    <FormControlLabel
                        key={f.key}
                        control={
                            <Checkbox
                                size="small"
                                checked={fields[f.key]}
                                onChange={() => onToggleField(f.key)}
                            />
                        }
                        label={f.label}
                    />
                ))}
            </FormGroup>
            {printOnlyBarcode && (
                <Typography variant="caption" color="text.secondary">
                    Field selection applies to the barcode view (turn off “Print Series & Dates”).
                </Typography>
            )}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

        <Box>
            <Typography variant="subtitle2" gutterBottom>
                Font size
            </Typography>
            <ToggleButtonGroup
                size="small"
                exclusive
                value={fontSize}
                onChange={(_, value) => value && onFontSizeChange(value)}
            >
                <ToggleButton value="sm">Small</ToggleButton>
                <ToggleButton value="md">Medium</ToggleButton>
                <ToggleButton value="lg">Large</ToggleButton>
                <ToggleButton value="xl">X-Large</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    </Paper>
);

export default PrintControls;
