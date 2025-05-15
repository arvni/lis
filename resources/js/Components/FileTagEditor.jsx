import React from "react";
import {
    Stack,
    IconButton,
    Tooltip,
    Typography,
    FormControl,
    Select,
    MenuItem
} from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";
import EditIcon from "@mui/icons-material/Edit";

/**
 * Component for displaying and editing file tags
 *
 * @param {Object} props - Component properties
 * @param {string} props.tag - Current tag value
 * @param {boolean} props.isEditing - Whether tag is being edited
 * @param {Function} props.onStartEdit - Handler for starting edit mode
 * @param {Function} props.onTagChange - Handler for tag change
 * @param {Array} props.availableTags - Available tags for selection
 * @param {boolean} props.editable - Whether tag can be edited
 * @param {boolean} props.isUpdating - Whether tag is being updated
 * @returns {JSX.Element}
 */
const FileTagEditor = ({
                           tag = "TEMP",
                           isEditing = false,
                           onStartEdit,
                           onTagChange,
                           availableTags = [],
                           editable = true,
                           isUpdating = false
                       }) => {
    // Handle tag selection
    const handleTagSelect = (event) => {
        const newTag = event.target.value;
        if (onTagChange) {
            onTagChange(newTag);
        }
    };

    if (isEditing && onTagChange && availableTags.length > 0) {
        return (
            <FormControl size="small" sx={{ minWidth: 100, maxWidth: 150 }}>
                <Select
                    value={tag}
                    onChange={handleTagSelect}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                    displayEmpty
                >
                    {availableTags.map((tagOption, index) => (
                        <MenuItem key={index} value={tagOption.value}>
                            {tagOption.label}
                        </MenuItem>
                    ))}
                    <MenuItem value="TEMP">TEMP</MenuItem>
                </Select>
            </FormControl>
        );
    }

    return (
        <>
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <LabelIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="primary">
                    {tag || "TEMP"}
                </Typography>
                {editable && onTagChange && availableTags.length > 0 && (
                    <Tooltip title="Edit tag">
                        <IconButton
                            size="small"
                            onClick={onStartEdit}
                            sx={{ p: 0, ml: 0.5 }}
                        >
                            <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            {isUpdating && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                    Updating tag...
                </Typography>
            )}
        </>
    );
};
export default FileTagEditor;
