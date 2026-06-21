import React from 'react';
import { Box, Typography } from '@mui/material';
import Editor from '@/Components/Editor';

export default function DescriptionStep({ data, onField, nav }) {
    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Optional — patient preparation notes, clinical context, or any other relevant
                information.
            </Typography>
            <Editor value={data?.description || ''} name="description" onChange={onField} />
            {nav}
        </Box>
    );
}
