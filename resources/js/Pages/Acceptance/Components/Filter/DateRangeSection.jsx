import React from 'react';
import Grid from '@mui/material/Grid';
import PresetChipRow from './PresetChipRow';
import ClearableDateField from './ClearableDateField';

/**
 * A preset chip row plus from/to clearable date fields — the repeated
 * registered / est. report / published date-range block. Renders a fragment
 * of Grid items for the parent Grid container.
 */
const DateRangeSection = ({
    title,
    presets,
    color,
    onPreset,
    fromField,
    toField,
    error,
    onChange,
    onClearDate,
    max,
}) => (
    <>
        <Grid size={{ xs: 12 }}>
            <PresetChipRow title={title} presets={presets} color={color} onSelect={onPreset} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
            <ClearableDateField
                name={fromField.name}
                value={fromField.value}
                label={fromField.label}
                onChange={onChange}
                onClear={() => onClearDate(fromField.name)}
                error={error}
                max={max}
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
            <ClearableDateField
                name={toField.name}
                value={toField.value}
                label={toField.label}
                onChange={onChange}
                onClear={() => onClearDate(toField.name)}
                error={error}
                helperText={error}
                max={max}
            />
        </Grid>
    </>
);

export default DateRangeSection;
