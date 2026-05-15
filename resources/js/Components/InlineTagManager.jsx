import React, { useState, useEffect, useRef } from 'react';
import {
    Autocomplete,
    TextField,
    Box,
    CircularProgress,
    Typography,
    Stack,
    IconButton,
} from '@mui/material';
import { LocalOffer as TagIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import TagChip from './TagChip';

const InlineTagManager = ({ initialTags = [], updateUrl, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTags, setSelectedTags] = useState(initialTags);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const containerRef = useRef(null);

    // Fetch all available tags for the autocomplete options
    const fetchTags = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.tags.list'));
            setAllTags(response.data.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (newTags) => {
        const tagNames = newTags.map(t => typeof t === 'string' ? t : t.name);
        setSaving(true);
        try {
            const response = await axios.put(updateUrl, { tags: tagNames });
            const updatedTags = response.data.data || [];
            setSelectedTags(updatedTags);
            if (onUpdate) onUpdate(updatedTags);

            enqueueSnackbar('Tags updated', { variant: 'success', autoHideDuration: 2000 });
        } catch (error) {
            console.error('Error updating tags:', error);
            enqueueSnackbar('Failed to update tags', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEdit = (e) => {
        e.stopPropagation();
        if (!isEditing) {
            fetchTags();
            setIsEditing(true);
        }
    };

    // Close editing when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsEditing(false);
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    if (isEditing) {
        return (
            <Box ref={containerRef} sx={{ minWidth: 200, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                <Autocomplete
                    multiple
                    freeSolo
                    autoFocus
                    size="small"
                    options={allTags}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={selectedTags}
                    loading={loading}
                    isOptionEqualToValue={(option, value) => {
                        const optionName = typeof option === 'string' ? option : option.name;
                        const valueName = typeof value === 'string' ? value : value.name;
                        return optionName === valueName;
                    }}
                    onBlur={() => {
                        setIsEditing(false);
                    }}
                    onChange={(event, newValue) => {
                        setSelectedTags(newValue);
                        handleSave(newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const tagObj = typeof option === 'string'
                                ? allTags.find(t => t.name === option) || { name: option }
                                : option;
                            return (
                                <TagChip
                                    key={index}
                                    tag={tagObj}
                                    {...getTagProps({ index })}
                                    sx={{ m: 0.2 }}
                                />
                            );
                        })
                    }
                    renderOption={(props, option) => (
                        <li {...props}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: option.color || 'grey.400'
                                    }}
                                />
                                {option.name}
                            </Box>
                        </li>
                    )}
                    renderInput={(params) => {
                        const { InputProps, ...rest } = params;
                        return (
                            <TextField
                                {...rest}
                                variant="outlined"
                                placeholder="Add tags..."
                                autoFocus
                                InputProps={{
                                    ...InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {loading || saving ? <CircularProgress color="inherit" size={16} /> : null}
                                            {InputProps?.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        );
                    }}
                />
            </Box>
        );
    }

    return (
        <Box
            onClick={handleToggleEdit}
            sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                minHeight: 40,
                width: '100%',
                '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1
                }
            }}
        >
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }} useFlexGap>
                {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                        <TagChip key={tag.id ?? tag.name} tag={tag} />
                    ))
                ) : (
                    <Typography variant="caption" color="text.secondary">
                        Click to add tags
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

export default InlineTagManager;
