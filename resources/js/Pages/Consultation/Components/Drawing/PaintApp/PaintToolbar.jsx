import React from 'react';
import {
    AppBar,
    Box,
    Button,
    ButtonGroup,
    Chip,
    Divider,
    Slider,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { Undo as UndoIcon, Redo as RedoIcon, Clear as ClearIcon } from '@mui/icons-material';
import { tools, SHAPE_TOOLS } from './constants';
import ColorPicker from './ColorPicker';

const PaintToolbar = ({
    tool,
    onSelectTool,
    color,
    onColorChange,
    lineWidth,
    onLineWidthChange,
    shapeSize,
    onShapeSizeChange,
    arrowRotation,
    onArrowRotationChange,
    coplanarLineCount,
    onCoplanarLineCountChange,
    coplanarLineSpacing,
    onCoplanarLineSpacingChange,
    onUndo,
    onRedo,
    onClear,
    historyIndex,
    historyLength,
}) => (
    <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar variant="dense" sx={{ minHeight: 48, gap: 2, flexWrap: 'wrap', py: 1 }}>
            {/* Tools */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                    Tools:
                </Typography>
                <ButtonGroup variant="outlined" size="small">
                    {tools.map(({ name, icon: Icon, label }) => (
                        <Tooltip key={name} title={label}>
                            <Button
                                variant={tool === name ? 'contained' : 'outlined'}
                                onClick={() => onSelectTool(name)}
                                sx={{ minWidth: 36, height: 36, p: 0.5 }}
                            >
                                <Icon sx={{ fontSize: 16 }} />
                            </Button>
                        </Tooltip>
                    ))}
                </ButtonGroup>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Color Palette */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Color:
                </Typography>
                <ColorPicker selectedColor={color} onColorChange={onColorChange} />
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Settings */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">
                        Brush: {lineWidth}px
                    </Typography>
                    <Slider
                        value={lineWidth}
                        onChange={(e, value) => onLineWidthChange(value)}
                        min={1}
                        max={50}
                        size="small"
                        sx={{ mt: -0.5 }}
                    />
                </Box>
                <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">
                        Shape: {shapeSize}px
                    </Typography>
                    <Slider
                        value={shapeSize}
                        onChange={(e, value) => onShapeSizeChange(value)}
                        min={10}
                        max={200}
                        size="small"
                        disabled={!SHAPE_TOOLS.includes(tool) && !tool.startsWith('number')}
                        sx={{ mt: -0.5 }}
                    />
                </Box>
                {tool === 'arrow' && (
                    <Box sx={{ minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">
                            Rotation: {arrowRotation}°
                        </Typography>
                        <Slider
                            value={arrowRotation}
                            onChange={(e, value) => onArrowRotationChange(value)}
                            min={0}
                            max={360}
                            size="small"
                            sx={{ mt: -0.5 }}
                        />
                    </Box>
                )}
                {tool === 'coplanarLines' && (
                    <>
                        <Box sx={{ minWidth: 100 }}>
                            <Typography variant="caption" color="text.secondary">
                                Lines: {coplanarLineCount}
                            </Typography>
                            <Slider
                                value={coplanarLineCount}
                                onChange={(e, value) => onCoplanarLineCountChange(value)}
                                min={2}
                                max={10}
                                size="small"
                                sx={{ mt: -0.5 }}
                            />
                        </Box>
                        <Box sx={{ minWidth: 120 }}>
                            <Typography variant="caption" color="text.secondary">
                                Spacing: {coplanarLineSpacing}px
                            </Typography>
                            <Slider
                                value={coplanarLineSpacing}
                                onChange={(e, value) => onCoplanarLineSpacingChange(value)}
                                min={5}
                                max={50}
                                size="small"
                                sx={{ mt: -0.5 }}
                            />
                        </Box>
                    </>
                )}
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ButtonGroup variant="outlined" size="small">
                    <Tooltip title="Undo">
                        <span>
                            <Button
                                onClick={onUndo}
                                disabled={historyIndex <= 0}
                                sx={{ minWidth: 36, height: 36 }}
                            >
                                <UndoIcon sx={{ fontSize: 16 }} />
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <span>
                            <Button
                                onClick={onRedo}
                                disabled={historyIndex >= historyLength - 1}
                                sx={{ minWidth: 36, height: 36 }}
                            >
                                <RedoIcon sx={{ fontSize: 16 }} />
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Clear">
                        <span>
                            <Button
                                onClick={onClear}
                                color="secondary"
                                sx={{ minWidth: 36, height: 36 }}
                            >
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </Button>
                        </span>
                    </Tooltip>
                </ButtonGroup>
                <Chip
                    label={`${historyIndex + 1}/${historyLength}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 24 }}
                />
            </Box>
        </Toolbar>
    </AppBar>
);

export default PaintToolbar;
