import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    Autocomplete,
    TextField,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Popover,
    Typography,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    LocalOffer as TagIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { router, usePage } from '@inertiajs/react';
import TagChip from './TagChip';

const getTagName = (tag) => (typeof tag === 'string' ? tag : tag?.name);
const tagStateCache = new Map();

const InlineTagManager = ({ initialTags = [], updateUrl, onUpdate }) => {
    const cachedInitialTags = tagStateCache.get(updateUrl) || initialTags;
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedTags, setSelectedTags] = useState(cachedInitialTags);
    const [draftTags, setDraftTags] = useState(cachedInitialTags);
    const draftTagsRef = useRef(cachedInitialTags);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { auth } = usePage().props;

    const canAssign = auth?.permissions?.includes('Reception.Acceptances.Assign Tag') ?? false;
    const isOpen = Boolean(anchorEl);
    const visibleTags = selectedTags.slice(0, 2);
    const hiddenTagCount = Math.max(selectedTags.length - visibleTags.length, 0);
    const initialTagSignature = useMemo(
        () => initialTags.map(getTagName).filter(Boolean).sort().join('|'),
        [initialTags],
    );
    const draftTagNames = useMemo(() => draftTags.map(getTagName).filter(Boolean), [draftTags]);

    useEffect(() => {
        if (tagStateCache.has(updateUrl)) {
            const cachedTags = tagStateCache.get(updateUrl);
            setSelectedTags(cachedTags);
            setDraftTags(cachedTags);
            draftTagsRef.current = cachedTags;
            return;
        }

        setSelectedTags(initialTags);
        setDraftTags(initialTags);
        draftTagsRef.current = initialTags;
    }, [initialTagSignature, updateUrl]);

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

    const handleOpen = (event) => {
        event.stopPropagation();
        if (!canAssign) return;

        setDraftTags(selectedTags);
        draftTagsRef.current = selectedTags;
        setAnchorEl(event.currentTarget);
        fetchTags();
    };

    const handleClose = () => {
        setDraftTags(selectedTags);
        draftTagsRef.current = selectedTags;
        setAnchorEl(null);
    };

    const handleSave = async () => {
        const tagNames = draftTagsRef.current.map(getTagName).filter(Boolean);
        setSaving(true);
        try {
            const response = await axios.put(updateUrl, { tags: tagNames });
            const updatedTags = response.data.data || [];
            tagStateCache.set(updateUrl, updatedTags);
            setSelectedTags(updatedTags);
            setDraftTags(updatedTags);
            draftTagsRef.current = updatedTags;
            if (onUpdate) onUpdate(updatedTags);
            setAnchorEl(null);
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Error updating tags:', error);
            const message = error.response?.data?.message || 'Failed to update tags';
            enqueueSnackbar(message, { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const renderTagOption = (props, option) => {
        const { key, ...optionProps } = props;
        const tagName = typeof option === 'string' ? option : option.name;
        const tagColor = typeof option === 'string' ? null : option.color;

        return (
            <li key={key} {...optionProps} onMouseDown={(event) => event.preventDefault()}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: tagColor || 'grey.400',
                            flexShrink: 0,
                        }}
                    />
                    <Typography variant="body2" noWrap>
                        {tagName}
                    </Typography>
                </Box>
            </li>
        );
    };

    const renderSelectedTags = (value, getTagProps) =>
        value.map((option, index) => {
            const tagObj =
                typeof option === 'string'
                    ? allTags.find((t) => t.name === option) || { name: option }
                    : option;
            const { key, ...tagProps } = getTagProps({ index });
            return <TagChip tag={tagObj} key={key} {...tagProps} sx={{ maxWidth: 150 }} />;
        });

    const content = (
        <Box
            onClick={handleOpen}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                minHeight: 32,
                maxWidth: '100%',
                px: 0.5,
                borderRadius: 1,
                cursor: canAssign ? 'pointer' : 'default',
                transition: 'background-color 120ms ease',
                '&:hover': {
                    bgcolor: canAssign ? 'action.hover' : 'transparent',
                    '& .InlineTagManager-action': {
                        opacity: 1,
                    },
                },
            }}
        >
            {selectedTags.length > 0 ? (
                <>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ minWidth: 0, alignItems: 'center' }}
                        useFlexGap
                    >
                        {visibleTags.map((tag) => (
                            <TagChip
                                key={tag.id ?? tag.name}
                                tag={tag}
                                sx={{
                                    maxWidth: 86,
                                    '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    },
                                }}
                            />
                        ))}
                        {hiddenTagCount > 0 && (
                            <Box
                                sx={{
                                    height: 22,
                                    minWidth: 28,
                                    px: 0.75,
                                    borderRadius: 11,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.100',
                                    color: 'text.secondary',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                }}
                            >
                                +{hiddenTagCount}
                            </Box>
                        )}
                    </Stack>
                    {canAssign && (
                        <IconButton
                            className="InlineTagManager-action"
                            size="small"
                            aria-label="Edit tags"
                            sx={{
                                opacity: 0,
                                width: 24,
                                height: 24,
                                transition: 'opacity 120ms ease',
                            }}
                        >
                            <AddIcon fontSize="inherit" />
                        </IconButton>
                    )}
                </>
            ) : canAssign ? (
                <Button
                    size="small"
                    variant="text"
                    startIcon={<AddIcon />}
                    sx={{
                        minHeight: 28,
                        px: 0.75,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                    }}
                >
                    Add tag
                </Button>
            ) : (
                <Typography variant="caption" color="text.disabled">
                    No tags
                </Typography>
            )}
        </Box>
    );

    return (
        <>
            {canAssign ? (
                content
            ) : (
                <Tooltip title="You do not have permission to assign tags">{content}</Tooltip>
            )}

            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            width: 360,
                            maxWidth: 'calc(100vw - 24px)',
                            borderRadius: 2,
                            boxShadow: 8,
                            mt: 0.75,
                        },
                        onClick: (event) => event.stopPropagation(),
                    },
                }}
            >
                <Box sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 1,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <TagIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, lineHeight: 1.2 }}
                            >
                                Manage tags
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Search existing tags or type a new one.
                            </Typography>
                        </Box>
                    </Stack>

                    <Autocomplete
                        multiple
                        freeSolo
                        autoFocus
                        openOnFocus
                        disablePortal
                        size="small"
                        options={allTags}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option.name
                        }
                        value={draftTags}
                        loading={loading}
                        isOptionEqualToValue={(option, value) => {
                            const optionName = typeof option === 'string' ? option : option.name;
                            const valueName = typeof value === 'string' ? value : value.name;
                            return optionName === valueName;
                        }}
                        onChange={(event, newValue) => {
                            setDraftTags(newValue);
                            draftTagsRef.current = newValue;
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                handleClose();
                            }
                        }}
                        renderValue={renderSelectedTags}
                        renderOption={renderTagOption}
                        noOptionsText={loading ? 'Loading tags...' : 'No tags found'}
                        renderInput={(params) => {
                            const { slotProps, ...rest } = params;
                            return (
                                <TextField
                                    {...rest}
                                    variant="outlined"
                                    label="Tags"
                                    placeholder={draftTags.length ? 'Add another tag' : 'Add tags'}
                                    slotProps={{
                                        ...slotProps,
                                        input: {
                                            ...slotProps?.input,
                                            startAdornment: (
                                                <React.Fragment>
                                                    {slotProps?.input?.startAdornment}
                                                </React.Fragment>
                                            ),
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loading || saving ? (
                                                        <CircularProgress
                                                            color="inherit"
                                                            size={16}
                                                        />
                                                    ) : null}
                                                    {slotProps?.input?.endAdornment}
                                                </React.Fragment>
                                            ),
                                        },
                                    }}
                                />
                            );
                        }}
                    />

                    <Divider sx={{ my: 1.5 }} />

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {draftTagNames.length
                                ? `${draftTagNames.length} selected`
                                : 'No tags selected'}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<CloseIcon />}
                                onClick={handleClose}
                                disabled={saving}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                    saving ? (
                                        <CircularProgress size={14} color="inherit" />
                                    ) : (
                                        <CheckIcon />
                                    )
                                }
                                onClick={handleSave}
                                disabled={saving}
                                sx={{ textTransform: 'none' }}
                            >
                                Apply
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Popover>
        </>
    );
};

export default InlineTagManager;
