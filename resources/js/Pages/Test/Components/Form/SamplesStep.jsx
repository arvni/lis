import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import SampleTypeFields from '@/Pages/Test/Components/SampleTypesFields';

export default function SamplesStep({ data, errors, set, nav }) {
    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Define the specimen types accepted for this test. At least one is required.
            </Typography>
            {errors?.sample_type_tests && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.sample_type_tests}
                </Alert>
            )}
            <SampleTypeFields
                onChange={set}
                name="sample_type_tests"
                error={errors?.sample_type_tests}
                sampleTypes={data.sample_type_tests || []}
            />
            {nav}
        </Box>
    );
}
