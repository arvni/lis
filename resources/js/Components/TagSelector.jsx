import React from 'react';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    Chip
} from '@mui/material';

/**
 * Tag selector component for file uploads
 *
 * @param {Object} props - Component props
 * @param {Array} props.availableTags - List of available tags [{value: string, label: string}]
 * @param {string} props.selectedTag - Currently selected tag
 * @param {Function} props.onTagChange - Callback when tag changes
 * @param {Function} props.onConfirm - Callback when selection is confirmed
 * @param {Function} props.onCancel - Callback when selection is canceled
 * @param {number} props.fileCount - Number of files being tagged
 */
const TagSelector = ({
                         availableTags = [],
                         selectedTag = '',
                         onTagChange,
                         onConfirm,
                         onCancel,
                         fileCount = 0
                     }) => {
    // Ensure we have a valid default tag
    const effectiveSelectedTag = selectedTag || (availableTags.length > 0 ? availableTags[0].value : '');

    return (
        <Box sx={{
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
            mb: 2,
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1
        }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select a tag for {fileCount} file{fileCount !== 1 ? 's' : ''}:
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                    value={effectiveSelectedTag}
                    onChange={(e) => onTagChange(e.target.value)}
                    displayEmpty
                    size="small"
                >
                    {availableTags.map((tag, index) => (
                        <MenuItem key={index} value={tag.value}>
                            {tag.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Chip
                    label="Cancel"
                    onClick={onCancel}
                    color="default"
                    variant="outlined"
                />
                <Chip
                    label="Confirm"
                    onClick={onConfirm}
                    color="primary"
                />
            </Box>
        </Box>
    );
};
export default TagSelector;
