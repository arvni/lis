import React from 'react';
import { Box } from '@mui/material';
import MethodFields from '../MethodFields';

export default function MethodsStep({ data, errors, set, nav }) {
    return (
        <Box>
            <MethodFields
                onChange={set}
                methodTests={data?.method_tests || []}
                error={errors?.method_tests}
                name="method_tests"
                type={data.type}
                label={data.type === 'PANEL' ? 'Tests' : 'Methods'}
            />
            {nav}
        </Box>
    );
}
