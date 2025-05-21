// components.js
// Reusable UI components for the drawing app
import React from 'react';
import {
    ToggleButtonGroup, ToggleButton, Tooltip, Box, Typography,
    Slider, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, RadioGroup, FormControlLabel, Radio, TextField, IconButton
} from '@mui/material';

import {
    BorderColor as DrawIcon,
    CropSquare as SquareIcon,
    RadioButtonUnchecked as CircleIcon,
    Timeline as SelectLineIcon,
    RemoveCircleOutline as EraserIcon,
    Create as TextIcon,
    Straighten as LineIcon,
    FormatColorFill as FillIcon,
    PanTool as HandIcon,
    GridOn as GridIcon
} from '@mui/icons-material';

// Drawing Tools toolbar
export const DrawingTools = ({ currentTool, onToolChange }) => {
    return (
        <ToggleButtonGroup
            value={currentTool}
            exclusive
            onChange={onToolChange}
            aria-label="drawing tools"
            size="small"
        >
            <ToggleButton value="draw" aria-label="draw">
                <Tooltip title="Draw Line (B/P)"><DrawIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="eraser" aria-label="eraser">
                <Tooltip title="Eraser (E)"><EraserIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="straight-line" aria-label="straight line">
                <Tooltip title="Straight Line (L)"><LineIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="square" aria-label="place square">
                <Tooltip title="Square (R)"><SquareIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="circle" aria-label="place circle">
                <Tooltip title="Circle (C)"><CircleIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="text" aria-label="add text">
                <Tooltip title="Text (T)"><TextIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="select" aria-label="select lines">
                <Tooltip title="Select (S)"><SelectLineIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="fill" aria-label="fill area">
                <Tooltip title="Fill (F)"><FillIcon /></Tooltip>
            </ToggleButton>

            <ToggleButton value="hand" aria-label="pan">
                <Tooltip title="Hand Tool (H)"><HandIcon /></Tooltip>
            </ToggleButton>
        </ToggleButtonGroup>
    );
};

// Pen Size Slider
export const PenSizeControl = ({ penSize, onPenSizeChange }) => {
    return (
        <Tooltip title="Pen/Line Size">
            <Box sx={{ width: 120, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{mr:1, fontSize:'0.7rem'}}>
                    Size:
                </Typography>
                <Slider
                    value={penSize}
                    onChange={onPenSizeChange}
                    min={1}
                    max={50}
                    step={1}
                    size="small"
                    aria-labelledby="pen-size-slider"
                />
            </Box>
        </Tooltip>
    );
};

// Color Picker
export const ColorPicker = ({ color, onChange, label }) => {
    return (
        <Tooltip title={label}>
            <input
                type="color"
                value={color === 'transparent' ? '#ffffff' : color}
                onChange={onChange}
                style={{
                    marginLeft: '4px',
                    border: '1px solid #ccc',
                    padding:'1px',
                    borderRadius: '4px',
                    cursor:'pointer',
                    width:'30px',
                    height:'25px'
                }}
            />
        </Tooltip>
    );
};

// Status Bar
export const StatusBar = ({ tool, penSize, selectedCount, showGrid, snapToGrid }) => {
    return (
        <Typography variant="caption">
            Tool: {tool} |
            Size: {penSize} |
            Selected: {selectedCount} |
            {showGrid ? ' Grid: On | ' : ' Grid: Off | '}
            {snapToGrid ? 'Snap to Grid: On' : 'Snap to Grid: Off'}
        </Typography>
    );
};

// Line Type Dialog
export const LineTypeDialog = ({ open, onClose, onSubmit, lineRef, value, onChange }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                Select Line Style for {lineRef === 'line1' ? "First" : "Second"} Selection Line
            </DialogTitle>
            <DialogContent>
                <RadioGroup
                    aria-label="line type"
                    name="lineType"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <FormControlLabel value="solid" control={<Radio />} label="Solid Line" />
                    <FormControlLabel value="dashed" control={<Radio />} label="Dashed Line" />
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onSubmit} autoFocus>OK</Button>
            </DialogActions>
        </Dialog>
    );
};

// Text Input Dialog
export const TextInputDialog = ({
                                    open,
                                    onClose,
                                    onSubmit,
                                    textValue,
                                    onTextChange,
                                    textSize,
                                    onTextSizeChange
                                }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add Text</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="text-input"
                    label="Text"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={textValue}
                    onChange={(e) => onTextChange(e.target.value)}
                />
                <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom>
                        Text Size: {textSize}px
                    </Typography>
                    <Slider
                        value={textSize}
                        min={8}
                        max={72}
                        step={1}
                        onChange={(e, newValue) => onTextSizeChange(newValue)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onSubmit}>Add</Button>
            </DialogActions>
        </Dialog>
    );
};

// Grid Toggle Button
export const GridToggle = ({ showGrid, onToggle }) => {
    return (
        <Tooltip title="Toggle Grid (G)">
            <IconButton
                size="small"
                onClick={onToggle}
                color={showGrid ? "primary" : "default"}
            >
                <GridIcon />
            </IconButton>
        </Tooltip>
    );
};
