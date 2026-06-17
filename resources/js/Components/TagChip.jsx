import React from 'react';
import { Chip } from '@mui/material';

const TagChip = ({ tag, sx = {}, ...props }) => {
    const color = tag.color;

    return (
        <Chip
            key={tag.id ?? tag.name}
            label={tag.name}
            size="small"
            sx={{
                fontSize: '0.7rem',
                bgcolor: color ? `${color}15` : 'grey.100',
                color: color || 'text.primary',
                borderColor: color || 'divider',
                border: color ? '1px solid' : 'none',
                fontWeight: color ? 'bold' : 'normal',
                ...sx,
            }}
            {...props}
        />
    );
};

export default TagChip;
