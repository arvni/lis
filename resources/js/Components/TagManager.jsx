import React, { useState, useEffect } from 'react';
import {
    Autocomplete,
    TextField,
    Chip,
    Box,
    Button,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { LocalOffer as TagIcon, Save as SaveIcon } from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { router } from '@inertiajs/react';

/**
 * TagManager Component
 *
 * @param {Array} initialTags - The current tags of the entity
 * @param {string} updateUrl - The URL to sync tags (PUT request)
 * @param {string} entityType - 'acceptance' or 'acceptanceItem' (used for reloading Inertia state)
 */
const TagManager = ({ initialTags = [], updateUrl, entityType, onSuccess }) => {
    const [selectedTags, setSelectedTags] = useState(initialTags.map((t) => t.name));
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                const response = await axios.get(route('api.tags.list'));
                setAllTags(response.data.data);
            } catch (error) {
                console.error('Error fetching tags:', error);
                enqueueSnackbar('Failed to load available tags', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [enqueueSnackbar]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(updateUrl, { tags: selectedTags });
            enqueueSnackbar('Tags updated successfully', { variant: 'success' });

            if (onSuccess) {
                onSuccess(selectedTags);
            }

            // Optionally reload Inertia state if we are on a show page
            if (entityType) {
                router.reload({
                    only: [entityType === 'acceptance' ? 'acceptance' : 'acceptanceItem'],
                });
            }
        } catch (error) {
            console.error('Error updating tags:', error);
            const message = error.response?.data?.message || 'Failed to update tags';
            enqueueSnackbar(message, { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Autocomplete
                    multiple
                    freeSolo
                    options={allTags.map((t) => t.name)}
                    value={selectedTags}
                    onChange={(event, newValue) => {
                        setSelectedTags(newValue);
                    }}
                    loading={loading}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const tagData = allTags.find((t) => t.name === option);
                            const color = tagData?.color;
                            return (
                                <Chip
                                    key={option ?? index}
                                    label={option}
                                    size="small"
                                    sx={{
                                        bgcolor: color ? `${color}15` : 'secondary.light',
                                        color: color || 'secondary.contrastText',
                                        borderColor: color || 'secondary.main',
                                        border: color ? '1px solid' : 'none',
                                    }}
                                    {...getTagProps({ index })}
                                />
                            );
                        })
                    }
                    renderInput={(params) => {
                        const { InputProps, ...rest } = params;
                        return (
                            <TextField
                                {...rest}
                                variant="outlined"
                                size="small"
                                label="Assign Tags"
                                placeholder="Add tags..."
                                InputProps={{
                                    ...InputProps,
                                    startAdornment: (
                                        <>
                                            <TagIcon
                                                color="action"
                                                sx={{ ml: 1, mr: 0.5 }}
                                                fontSize="small"
                                            />
                                            {InputProps?.startAdornment}
                                        </>
                                    ),
                                    endAdornment: (
                                        <React.Fragment>
                                            {loading ? (
                                                <CircularProgress color="inherit" size={20} />
                                            ) : null}
                                            {InputProps?.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        );
                    }}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                />
                <Tooltip title="Save Tags">
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={
                            saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />
                        }
                        sx={{ whiteSpace: 'nowrap', height: '40px' }}
                    >
                        Save
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default TagManager;
