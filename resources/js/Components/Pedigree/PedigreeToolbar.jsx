import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import ImageIcon from '@mui/icons-material/Image';
import SvgIcon from '@mui/icons-material/DataObject';
import PeopleIcon from '@mui/icons-material/People';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import HelpIcon from '@mui/icons-material/Help';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Enhanced Toolbar Component with sections and tooltips
const PedigreeToolbar = ({
    disabled,
    selectedNodes,
    showGrid,
    zoomLevel,
    onAddNode,
    onAddChild,
    onAutoArrange,
    onSave,
    onLoad,
    onExport,
    onZoomIn,
    onZoomOut,
    onFitView,
    onToggleGrid,
    onOpenLegend,
    onOpenHelp,
}) => (
    <Paper
        elevation={3}
        sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            p: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '90%',
        }}
    >
        {/* Add Individual Buttons - Hidden when disabled */}
        {!disabled && (
            <>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 'medium' }}>
                        Add:
                    </Typography>
                    <Tooltip title="Add Male" arrow>
                        <IconButton
                            size="small"
                            onClick={() => onAddNode('male')}
                            sx={{
                                color: 'blue',
                                border: '1px solid',
                                borderColor: 'rgba(0,0,255,0.3)',
                            }}
                        >
                            <ManIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Female" arrow>
                        <IconButton
                            size="small"
                            onClick={() => onAddNode('female')}
                            sx={{
                                color: 'deeppink',
                                border: '1px solid',
                                borderColor: 'rgba(255,20,147,0.3)',
                            }}
                        >
                            <WomanIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Unknown" arrow>
                        <IconButton
                            size="small"
                            onClick={() => onAddNode('unknown')}
                            sx={{
                                color: 'dimgray',
                                border: '1px solid',
                                borderColor: 'rgba(105,105,105,0.3)',
                            }}
                        >
                            <QuestionMarkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

                <Tooltip
                    title={
                        selectedNodes.length !== 2
                            ? 'Select exactly two parent nodes first (use Shift+Click)'
                            : 'Add Child Between Selected Parents'
                    }
                    arrow
                >
                    <span>
                        <Button
                            size="small"
                            onClick={onAddChild}
                            disabled={selectedNodes.length !== 2}
                            color="primary"
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            sx={{ height: 32 }}
                        >
                            Add Child
                        </Button>
                    </span>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

                <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Tooltip title="Auto-Arrange Family Tree" arrow>
                        <IconButton
                            size="small"
                            onClick={onAutoArrange}
                            color="secondary"
                            sx={{ border: '1px solid rgba(156, 39, 176, 0.3)' }}
                        >
                            <FitScreenIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Save Pedigree" arrow>
                        <IconButton
                            size="small"
                            onClick={onSave}
                            color="success"
                            sx={{ border: '1px solid rgba(46, 125, 50, 0.3)' }}
                        >
                            <SaveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Load Pedigree" arrow>
                        <IconButton
                            size="small"
                            component="label"
                            color="warning"
                            sx={{ border: '1px solid rgba(237, 108, 2, 0.3)' }}
                        >
                            <FileOpenIcon fontSize="small" />
                            <input type="file" accept=".json" onChange={onLoad} hidden />
                        </IconButton>
                    </Tooltip>
                </Box>
            </>
        )}

        {/* Export Buttons - Always visible */}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Tooltip title="Export as PNG Image" arrow>
                <IconButton
                    size="small"
                    onClick={() => onExport('png')}
                    sx={{
                        color: 'purple',
                        border: '1px solid rgba(128,0,128,0.3)',
                    }}
                >
                    <ImageIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Export as SVG Vector" arrow>
                <IconButton
                    size="small"
                    onClick={() => onExport('svg')}
                    sx={{
                        color: 'indigo',
                        border: '1px solid rgba(75,0,130,0.3)',
                    }}
                >
                    <SvgIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        {/* View Controls - Always visible */}
        <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Tooltip title="Zoom Out" arrow>
                <IconButton size="small" onClick={onZoomOut} sx={{ color: 'text.secondary' }}>
                    <ZoomOutIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    px: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {Math.round(zoomLevel * 100)}%
                </Typography>
            </Box>

            <Tooltip title="Zoom In" arrow>
                <IconButton size="small" onClick={onZoomIn} sx={{ color: 'text.secondary' }}>
                    <ZoomInIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Fit to View" arrow>
                <IconButton size="small" onClick={onFitView} sx={{ color: 'text.secondary' }}>
                    <FitScreenIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

        {/* Help & Legend */}
        <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Tooltip title="Toggle Grid Display" arrow>
                <IconButton
                    size="small"
                    onClick={onToggleGrid}
                    sx={{
                        color: showGrid ? 'primary.main' : 'text.secondary',
                        border: showGrid ? '1px solid rgba(25, 118, 210, 0.3)' : 'none',
                    }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="View Legend" arrow>
                <IconButton size="small" onClick={onOpenLegend} color="info">
                    <PeopleIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Help" arrow>
                <IconButton size="small" onClick={onOpenHelp} sx={{ color: 'text.secondary' }}>
                    <HelpIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    </Paper>
);

PedigreeToolbar.propTypes = {
    disabled: PropTypes.bool,
    selectedNodes: PropTypes.array,
    showGrid: PropTypes.bool,
    zoomLevel: PropTypes.number,
    onAddNode: PropTypes.func,
    onAddChild: PropTypes.func,
    onAutoArrange: PropTypes.func,
    onSave: PropTypes.func,
    onLoad: PropTypes.func,
    onExport: PropTypes.func,
    onZoomIn: PropTypes.func,
    onZoomOut: PropTypes.func,
    onFitView: PropTypes.func,
    onToggleGrid: PropTypes.func,
    onOpenLegend: PropTypes.func,
    onOpenHelp: PropTypes.func,
};

export default PedigreeToolbar;
