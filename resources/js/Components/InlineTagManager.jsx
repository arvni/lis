import React, { useState, useEffect, useRef } from 'react';
import {
    Autocomplete,
    TextField,
    Box,
    CircularProgress,
    Typography,
    Stack,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { usePage } from '@inertiajs/react';
import TagChip from './TagChip';

const InlineTagManager = ({ initialTags = [], updateUrl, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTags, setSelectedTags] = useState(initialTags);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const containerRef = useRef(null);
    const { auth } = usePage().props;

    const canAssign = auth?.permissions?.includes('Reception.Acceptances.Assign Tag') ?? false;

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
        } catch (error) {
            console.error('Error updating tags:', error);
            enqueueSnackbar('Failed to update tags', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEdit = (e) => {
        e.stopPropagation();
        if (!canAssign) return;
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
                    openOnFocus
                    disablePortal
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
                    onChange={(event, newValue) => {
                        setSelectedTags(newValue);
                        handleSave(newValue);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setIsEditing(false);
                        }
                    }}
                    renderValue={(value, getTagProps) =>
                        value.map((option, index) => {
                            const tagObj = typeof option === 'string'
                                ? allTags.find(t => t.name === option) || { name: option }
                                : option;
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                                <TagChip
                                    tag={tagObj}
                                    key={key}
                                    {...tagProps}
                                    sx={{ m: 0.2 }}
                                />
                            );
                        })
                    }
                    renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps}>
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
                        );
                    }}
                    renderInput={(params) => {
                        const { slotProps, ...rest } = params;
                        return (
                            <TextField
                                {...rest}
                                variant="outlined"
                                placeholder="Add tags..."
                                autoFocus
                                slotProps={{
                                    ...slotProps,
                                    input: {
                                        ...slotProps?.input,
                                        endAdornment: (
                                            <React.Fragment>
                                                {loading || saving ? <CircularProgress color="inherit" size={16} /> : null}
                                                {slotProps?.input?.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }
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
                cursor: canAssign ? 'pointer' : 'default',
                minHeight: 40,
                width: '100%',
                '&:hover': {
                    bgcolor: canAssign ? 'action.hover' : 'transparent',
                    borderRadius: 1
                }
            }}
        >
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }} useFlexGap>
                {selectedTags.length > 0 ? (
                    selectedTags.map((tag) => (
                        <TagChip key={tag.id ?? tag.name} tag={tag} />
                    ))
                ) : canAssign ? (
                    <Typography variant="caption" color="text.secondary">
                        Click to add tags
                    </Typography>
                ) : null}
            </Stack>
        </Box>
    );
};

export default InlineTagManager;
