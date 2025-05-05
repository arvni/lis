// src/components/ui/ElementEditor.js
import React, { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import LinkIcon from '@mui/icons-material/Link';

/**
 * Editor panel for modifying selected node or edge properties
 *
 * @param {Object} props - Component props
 * @param {boolean} props.disabled - Whether the chart is in read-only mode
 * @param {Object} props.singleSelectedNode - Currently selected node (or null)
 * @param {Object} props.singleSelectedEdge - Currently selected edge (or null)
 * @param {Function} props.onUpdateNodeData - Function to update node data
 * @param {Function} props.onUpdateNodeType - Function to update node type
 * @param {Function} props.onDeleteSelected - Function to delete selected elements
 * @param {Function} props.onOpenEdgeModal - Function to open edge style modal
 * @param {Function} props.onToggleAffected - Function to toggle affected status
 * @param {Function} props.onToggleCarrier - Function to toggle carrier status
 * @param {Function} props.onToggleDeceased - Function to toggle deceased status
 * @param {Function} props.onToggleProband - Function to toggle proband status
 */
const ElementEditor = ({
                           disabled,
                           singleSelectedNode,
                           singleSelectedEdge,
                           onUpdateNodeData,
                           onUpdateNodeType,
                           onDeleteSelected,
                           onOpenEdgeModal,
                           onToggleAffected,
                           onToggleCarrier,
                           onToggleDeceased,
                           onToggleProband
                       }) => {
    // State for the label input field
    const [localLabel, setLocalLabel] = useState('');

    // Update local label when selected node changes
    useEffect(() => {
        if (singleSelectedNode) {
            setLocalLabel(singleSelectedNode.data?.label || '');
        } else {
            setLocalLabel('');
        }
    }, [singleSelectedNode]);

    // Handle label input changes
    const handleLabelChange = (event) => {
        setLocalLabel(event.target.value);
    };

    // Apply label changes when focus leaves the field
    const commitLabelChange = useCallback(() => {
        if (singleSelectedNode && localLabel !== (singleSelectedNode.data?.label || '')) {
            onUpdateNodeData(singleSelectedNode.id, { label: localLabel });
        }
    }, [singleSelectedNode, localLabel, onUpdateNodeData]);

    // Handle Enter key in label field
    const handleLabelKeyDown = (event) => {
        if (event.key === 'Enter') {
            commitLabelChange();
            event.target.blur(); // Remove focus
        }
    };

    // Determine which editor to show
    const showNodeEditor = !disabled && singleSelectedNode && !singleSelectedEdge;
    const showEdgeEditor = !disabled && singleSelectedEdge && !singleSelectedNode;

    // Don't render if disabled or nothing selected
    if (disabled || (!showNodeEditor && !showEdgeEditor)) {
        return null;
    }

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 9,
                p: 2,
                width: 260,
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }
            }}
        >
            {/* ======== NODE EDITOR SECTION ======== */}
            {showNodeEditor && singleSelectedNode && (
                <>
                    {/* Header */}
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: '1.1rem'
                            }}
                        >
                            {singleSelectedNode.type === 'male' &&
                                <ManIcon sx={{ color: 'blue' }} fontSize="small" />}
                            {singleSelectedNode.type === 'female' &&
                                <WomanIcon sx={{ color: 'deeppink' }} fontSize="small" />}
                            {singleSelectedNode.type === 'unknown' &&
                                <QuestionMarkIcon sx={{ color: 'dimgray' }} fontSize="small" />}
                            Edit Individual
                        </Typography>

                        <Tooltip title="Delete Selected" arrow>
                            <IconButton
                                onClick={onDeleteSelected}
                                size="small"
                                color="error"
                                sx={{
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: alpha('#f44336', 0.1) // error light background
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Content */}
                    <Stack spacing={2}>
                        {/* Gender Selection */}
                        <FormControl fullWidth size="small">
                            <InputLabel id="gender-select-label">Gender</InputLabel>
                            <Select
                                labelId="gender-select-label"
                                value={singleSelectedNode.type || 'unknown'}
                                label="Gender"
                                onChange={onUpdateNodeType}
                            >
                                <MenuItem value={'male'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ManIcon sx={{ color: 'blue' }} fontSize="inherit" />
                                        <span>Male</span>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={'female'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WomanIcon sx={{ color: 'deeppink' }} fontSize="inherit" />
                                        <span>Female</span>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={'unknown'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <QuestionMarkIcon sx={{ color: 'dimgray' }} fontSize="inherit" />
                                        <span>Unknown</span>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Label Text Field */}
                        <TextField
                            label="Label / Name"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={localLabel}
                            onChange={handleLabelChange}
                            onBlur={commitLabelChange}
                            onKeyDown={handleLabelKeyDown}
                            placeholder="Enter name or ID"
                        />

                        {/* Status Checkboxes */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 0.5,
                                    fontWeight: 'medium',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Status:
                            </Typography>

                            <Stack spacing={0}> {/* Compact spacing */}
                                {/* Affected Status */}
                                <FormControlLabel
                                    sx={{ mr: 0 }}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!singleSelectedNode.data?.isAffected}
                                            onChange={onToggleAffected}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Affected
                                            <Chip
                                                size="small"
                                                label="Condition"
                                                sx={{ ml: 0.5, height: 18 }}
                                            />
                                        </Typography>
                                    }
                                />

                                {/* Carrier Status */}
                                <FormControlLabel
                                    sx={{ mr: 0 }}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!singleSelectedNode.data?.isCarrier}
                                            onChange={onToggleCarrier}
                                            color="warning"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Carrier
                                            <Chip
                                                size="small"
                                                label="Gene"
                                                sx={{ ml: 0.5, height: 18 }}
                                            />
                                        </Typography>
                                    }
                                />

                                {/* Deceased Status */}
                                <FormControlLabel
                                    sx={{ mr: 0 }}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!singleSelectedNode.data?.isDeceased}
                                            onChange={onToggleDeceased}
                                            color="default"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Deceased
                                        </Typography>
                                    }
                                />

                                {/* Proband Status */}
                                <FormControlLabel
                                    sx={{ mr: 0 }}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!singleSelectedNode.data?.isProband}
                                            onChange={onToggleProband}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Proband
                                            <Chip
                                                size="small"
                                                label="Index"
                                                sx={{ ml: 0.5, height: 18 }}
                                            />
                                        </Typography>
                                    }
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </>
            )}

            {/* ======== EDGE EDITOR SECTION ======== */}
            {showEdgeEditor && singleSelectedEdge && (
                <>
                    {/* Header */}
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontSize: '1.1rem'
                            }}
                        >
                            <LinkIcon color="action" fontSize="small" />
                            Edit Connection
                        </Typography>

                        <Tooltip title="Delete Selected Connection" arrow>
                            <IconButton
                                onClick={onDeleteSelected}
                                size="small"
                                color="error"
                                sx={{ p: 0.5 }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Content */}
                    <Stack spacing={2}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 'medium',
                                fontSize: '0.9rem'
                            }}
                        >
                            Connection Style:
                        </Typography>

                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1.5,
                            bgcolor: 'rgba(0,0,0,0.02)'
                        }}>
                            {/* Display current style */}
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Current: {
                                singleSelectedEdge?.type === 'consanguineous'
                                    ? 'Double Line (Consanguineous)'
                                    : (singleSelectedEdge?.style?.strokeDasharray
                                        ? 'Dashed Line (Uncertain)'
                                        : 'Solid Line (Standard)')
                            }
                            </Typography>

                            {/* Button to open style selection modal */}
                            <Button
                                startIcon={<EditIcon />}
                                variant="outlined"
                                size="small"
                                onClick={onOpenEdgeModal}
                                fullWidth
                                color="primary"
                            >
                                Change Style...
                            </Button>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            Use double lines for consanguineous relationships (between blood relatives).
                            Use dashed lines for uncertain relationships.
                        </Typography>
                    </Stack>
                </>
            )}
        </Paper>
    );
};

export default ElementEditor;
