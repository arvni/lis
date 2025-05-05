// src/components/ui/Toolbar.js
import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';

// Import icons
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import PeopleIcon from '@mui/icons-material/People';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import ImageIcon from '@mui/icons-material/Image';
import SvgIcon from '@mui/icons-material/DataObject'; // For SVG export
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import HelpIcon from '@mui/icons-material/Help';
import ListAltIcon from '@mui/icons-material/ListAlt';
import {colors, useTheme} from "@mui/material"; // For Legend


/**
 * Toolbar component providing control buttons for the pedigree chart
 *
 * @param {Object} props - Component props
 * @param {boolean} props.disabled - Whether the chart is in read-only mode
 * @param {Array} props.selectedNodes - Currently selected nodes
 * @param {boolean} props.showGrid - Whether grid is visible
 * @param {Object} props.viewportControls - Viewport state (zoom level)
 * @param {Function} props.onAddNode - Function to add a new node
 * @param {Function} props.onAddChildBetweenParents - Function to add a child between selected parents
 * @param {Function} props.onSaveData - Function to save the pedigree
 * @param {Function} props.onLoadData - Function to load a pedigree
 * @param {Function} props.onExportChart - Function to export as image
 * @param {Function} props.onZoomIn - Function to zoom in
 * @param {Function} props.onZoomOut - Function to zoom out
 * @param {Function} props.onFitView - Function to fit view to content
 * @param {Function} props.onToggleGrid - Function to toggle grid visibility
 * @param {Function} props.onOpenLegend - Function to open legend modal
 * @param {Function} props.onOpenHelp - Function to open help modal
 */
const Toolbar = ({
                     disabled,
                     selectedNodes,
                     showGrid,
                     viewportControls,
                     onAddNode,
                     onAddChildBetweenParents,
                     onSaveData,
                     onLoadData,
                     onExportChart,
                     onZoomIn,
                     onZoomOut,
                     onFitView,
                     onToggleGrid,
                     onOpenLegend,
                     onOpenHelp,
                 }) => {
    // Reset file input field to allow loading the same file again
    const handleLoadClick = (event) => {
        event.target.value = null;
    };

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                p: 1,
                display: 'flex',
                flexWrap: 'wrap', // Allow wrapping on smaller screens
                gap: 0.75,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
                maxWidth: 'calc(100% - 32px)', // Prevent overflow
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }
            }}
        >
            {/* Section: Add Nodes & Child (only if not disabled) */}
            {!disabled && (
                <>
                    <Box sx={{
                        display: 'flex',
                        gap: 0.5,
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 0.5,
                        transition: 'border-color 0.2s ease',
                        '&:hover': {
                            borderColor: 'primary.main',
                        }
                    }}>
                        <Tooltip title="Add Male Individual" arrow>
                            <IconButton
                                size="small"
                                onClick={() => onAddNode('male')}
                                sx={{
                                    color: 'blue',
                                    '&:hover': { backgroundColor: alpha(colors.blue.A700, 0.1) }
                                }}
                            >
                                <ManIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Add Female Individual" arrow>
                            <IconButton
                                size="small"
                                onClick={() => onAddNode('female')}
                                sx={{
                                    color: 'deeppink',
                                    '&:hover': { backgroundColor: alpha(colors.deepPurple.A100, 0.1) }
                                }}
                            >
                                <WomanIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Add Unknown Gender Individual" arrow>
                            <IconButton
                                size="small"
                                onClick={() => onAddNode('unknown')}
                                sx={{
                                    color: 'dimgray',
                                    '&:hover': { backgroundColor: alpha(colors.grey.A700, 0.1) }
                                }}
                            >
                                <QuestionMarkIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Tooltip title={
                        selectedNodes.length !== 2
                            ? "Select exactly two parents first (Shift+Click to select)"
                            : "Add child between selected parents"
                    } arrow>
                        <span> {/* Wrapper needed for disabled button tooltip */}
                            <Button
                                size="small"
                                onClick={onAddChildBetweenParents}
                                disabled={selectedNodes.length !== 2}
                                color="primary"
                                variant="outlined"
                                startIcon={<PeopleIcon />}
                                sx={{
                                    height: 32,
                                    px: 1, // Smaller horizontal padding
                                    minWidth: 0, // Allow button to shrink
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Add Child
                            </Button>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                </>
            )}

            {/* Section: Save/Load (only if not disabled) */}
            {!disabled && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Tooltip title="Save Pedigree as JSON" arrow>
                        <IconButton
                            size="small"
                            onClick={onSaveData}
                            color="success"
                            sx={{
                                '&:hover': {
                                    backgroundColor: alpha('#2e7d32', 0.1) // success light background
                                }
                            }}
                        >
                            <SaveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Load Pedigree from JSON" arrow>
                        <IconButton
                            size="small"
                            component="label"
                            color="warning"
                            sx={{
                                '&:hover': {
                                    backgroundColor: alpha('#ed6c02', 0.1) // warning light background
                                }
                            }}
                        >
                            <FileOpenIcon fontSize="small" />
                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept=".json"
                                onChange={onLoadData}
                                onClick={handleLoadClick}
                                hidden
                            />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {!disabled && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}

            {/* Section: Export (Always visible) */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title="Export as PNG Image" arrow>
                    <IconButton
                        size="small"
                        onClick={() => onExportChart('png')}
                        sx={{
                            color: 'purple',
                            '&:hover': { backgroundColor: alpha(colors.deepPurple.A700, 0.1) }
                        }}
                    >
                        <ImageIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Export as SVG Vector" arrow>
                    <IconButton
                        size="small"
                        onClick={() => onExportChart('svg')}
                        sx={{
                            color: 'indigo',
                            '&:hover': { backgroundColor: alpha(colors.indigo.A700, 0.1) }
                        }}
                    >
                        <SvgIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Section: View Controls (Always visible) */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title="Zoom Out" arrow>
                    <IconButton
                        size="small"
                        onClick={onZoomOut}
                        sx={{ color: 'text.secondary' }}
                    >
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                {/* Display current zoom level */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: alpha('#000', 0.05),
                    px: 1,
                    borderRadius: 1,
                    height: 32
                }}>
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 'medium',
                            color: 'text.secondary',
                            userSelect: 'none', // Prevent selection
                        }}
                    >
                        {Math.round(viewportControls.zoomLevel * 100)}%
                    </Typography>
                </Box>

                <Tooltip title="Zoom In" arrow>
                    <IconButton
                        size="small"
                        onClick={onZoomIn}
                        sx={{ color: 'text.secondary' }}
                    >
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Fit All Elements to View" arrow>
                    <IconButton
                        size="small"
                        onClick={onFitView}
                        sx={{ color: 'text.secondary' }}
                    >
                        <FitScreenIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Section: Grid/Legend/Help (Always visible) */}
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title={`${showGrid ? 'Hide' : 'Show'} Grid`} arrow>
                    <IconButton
                        size="small"
                        onClick={onToggleGrid}
                        sx={{
                            color: showGrid ? 'primary.main' : 'text.secondary',
                            backgroundColor: showGrid ? alpha('#1976d2', 0.08) : 'transparent',
                        }}
                    >
                        <DragIndicatorIcon
                            fontSize="small"
                            sx={{ transform: 'rotate(90deg)'}}
                        />
                    </IconButton>
                </Tooltip>

                <Tooltip title="View Symbol Legend" arrow>
                    <IconButton
                        size="small"
                        onClick={onOpenLegend}
                        color="info"
                    >
                        <ListAltIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Help & Instructions" arrow>
                    <IconButton
                        size="small"
                        onClick={onOpenHelp}
                        sx={{ color: 'text.secondary' }}
                    >
                        <HelpIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default Toolbar;
