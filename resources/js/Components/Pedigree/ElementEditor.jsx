import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import Chip from '@mui/material/Chip';

// Improved Element Editor Panel
const ElementEditor = ({
    disabled,
    selectedNode,
    selectedEdge,
    selectedNodesCount,
    selectedEdgesCount,
    onUpdateNodeData,
    onUpdateNodeType,
    onToggleAffected,
    onToggleCarrier,
    onToggleDeceased,
    onToggleProband,
    onDelete,
    onOpenEdgeModal,
}) => {
    const [localLabel, setLocalLabel] = useState(selectedNode?.data.label || '');

    // Sync the editable label whenever the selected node changes.
    useEffect(() => {
        if (selectedNode) {
            setLocalLabel(selectedNode.data.label || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode?.id]);

    if (disabled) return null; // Hide editor completely if disabled

    const showNodeEditor = selectedNode && selectedEdgesCount === 0;
    const showEdgeEditor = selectedEdge && selectedNodesCount === 0;

    const handleLabelChange = (event) => {
        setLocalLabel(event.target.value);
    };

    const handleLabelBlur = () => {
        if (selectedNode && localLabel !== selectedNode.data.label) {
            onUpdateNodeData(selectedNode.id, { label: localLabel });
        }
    };

    if (!showNodeEditor && !showEdgeEditor) return null;

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'absolute',
                top: 16,
                right: 100,
                zIndex: 9,
                p: 2.5,
                width: 280,
                maxHeight: 'calc(100vh - 32px)',
                overflowY: 'auto',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
        >
            {/* Node Editor Section */}
            {showNodeEditor && (
                <>
                    <Stack
                        direction="row"
                        sx={{
                            mb: 2,
                            borderBottom: '1px solid lightgrey',
                            pb: 1,
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            {selectedNode.type === 'male' && <ManIcon sx={{ color: 'blue' }} />}
                            {selectedNode.type === 'female' && (
                                <WomanIcon sx={{ color: 'deeppink' }} />
                            )}
                            {selectedNode.type === 'unknown' && (
                                <QuestionMarkIcon sx={{ color: 'dimgray' }} />
                            )}
                            Edit Individual
                        </Typography>

                        <Tooltip title="Delete Selected Individual" arrow>
                            <IconButton onClick={onDelete} size="small" color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Stack spacing={2.5}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="gender-select-label">Gender</InputLabel>
                            <Select
                                labelId="gender-select-label"
                                id="gender-select"
                                value={selectedNode.type || 'unknown'}
                                label="Gender"
                                onChange={onUpdateNodeType}
                            >
                                <MenuItem value={'male'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ManIcon sx={{ color: 'blue' }} />
                                        <span>Male</span>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={'female'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WomanIcon sx={{ color: 'deeppink' }} />
                                        <span>Female</span>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={'unknown'}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <QuestionMarkIcon sx={{ color: 'dimgray' }} />
                                        <span>Unknown</span>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Label"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={localLabel}
                            onChange={handleLabelChange}
                            onBlur={handleLabelBlur}
                            placeholder="Enter name or ID"
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                                Status:
                            </Typography>

                            <Stack>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!selectedNode.data.isAffected}
                                            onChange={onToggleAffected}
                                            color="error"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Affected{' '}
                                            <Chip
                                                size="small"
                                                label="Medical condition"
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        </Typography>
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!selectedNode.data.isCarrier}
                                            onChange={onToggleCarrier}
                                            color="warning"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Carrier{' '}
                                            <Chip
                                                size="small"
                                                label="Gene carrier"
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        </Typography>
                                    }
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!selectedNode.data.isDeceased}
                                            onChange={onToggleDeceased}
                                            color="default"
                                        />
                                    }
                                    label={<Typography variant="body2">Deceased</Typography>}
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={!!selectedNode.data.isProband}
                                            onChange={onToggleProband}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">
                                            Proband{' '}
                                            <Chip
                                                size="small"
                                                label="Index case"
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        </Typography>
                                    }
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </>
            )}

            {/* Edge Editor Section */}
            {showEdgeEditor && (
                <>
                    <Stack
                        direction="row"
                        sx={{
                            mb: 2,
                            borderBottom: '1px solid lightgrey',
                            pb: 1,
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h6">Edit Connection</Typography>

                        <Tooltip title="Delete Selected Connection" arrow>
                            <IconButton onClick={onDelete} size="small" color="error">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Stack spacing={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                            Connection Type:
                        </Typography>

                        <Box
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1.5,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Current:{' '}
                                {selectedEdge?.type === 'consanguineous'
                                    ? 'Double Line (Consanguineous)'
                                    : selectedEdge?.style?.strokeDasharray
                                      ? 'Dashed Line'
                                      : 'Solid Line'}
                            </Typography>

                            <Button
                                startIcon={<EditIcon />}
                                variant="contained"
                                size="small"
                                onClick={onOpenEdgeModal}
                                fullWidth
                            >
                                Change Style
                            </Button>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            Use double lines to represent consanguineous relationships
                            (relationships between blood relatives).
                        </Typography>
                    </Stack>
                </>
            )}
        </Paper>
    );
};

ElementEditor.propTypes = {
    disabled: PropTypes.bool,
    selectedNode: PropTypes.object,
    selectedEdge: PropTypes.object,
    selectedNodesCount: PropTypes.number,
    selectedEdgesCount: PropTypes.number,
    onUpdateNodeData: PropTypes.func,
    onUpdateNodeType: PropTypes.func,
    onToggleAffected: PropTypes.func,
    onToggleCarrier: PropTypes.func,
    onToggleDeceased: PropTypes.func,
    onToggleProband: PropTypes.func,
    onDelete: PropTypes.func,
    onOpenEdgeModal: PropTypes.func,
};

export default ElementEditor;
