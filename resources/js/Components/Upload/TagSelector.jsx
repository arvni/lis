import { memo, useState } from 'react';
import { Box, Chip, FormControl, MenuItem, Select, Typography } from '@mui/material';

// Tag Selection Dialog Component
const TagSelector = memo(({ files, tags, onConfirm, onCancel }) => {
    const [selectedTag, setSelectedTag] = useState(tags[0]?.value || 'TEMP');

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                p: 2,
                mb: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                boxShadow: 1,
            }}
        >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select a tag for {files.length} file{files.length !== 1 ? 's' : ''}:
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    displayEmpty
                    size="small"
                >
                    {tags.map((tag) => (
                        <MenuItem key={tag.value} value={tag.value}>
                            {tag.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Chip label="Cancel" onClick={onCancel} color="default" variant="outlined" />
                <Chip label="Confirm" onClick={() => onConfirm(selectedTag)} color="primary" />
            </Box>
        </Box>
    );
});

TagSelector.displayName = 'TagSelector';

export default TagSelector;
