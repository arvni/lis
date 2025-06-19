import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    IconButton,
    Tooltip,
    Slider,
    Grid,
    Menu,
    MenuItem,
    Divider,
    Typography
} from '@mui/material';
import {
    Brush as BrushIcon,
    ColorLens as ColorLensIcon,
    Delete as DeleteIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Save as SaveIcon,
    FormatPaint as FormatPaintIcon,
    Create as PencilIcon,
    Cancel as EraserIcon,
    Square as RectangleIcon,
    RadioButtonUnchecked as CircleIcon,
    Timeline as LineIcon
} from '@mui/icons-material';

/**
 * PaintCanvas - A React component that provides drawing functionality on an image
 * @param {Object} props - Component props
 * @param {string|null} props.defaultImage - URL or data URL of the default image to load (optional)
 * @param {function} props.onChange - Callback function that receives the canvas data URL when changes occur
 * @returns {JSX.Element} The PaintCanvas component
 */
const PaintCanvas = ({ defaultImage = null, onChange = () => {} }) => {
    // Canvas references
    const canvasRef = useRef(null);
    const contextRef = useRef(null);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState('pen'); // pen, eraser, rectangle, circle, line, fill
    const [history, setHistory] = useState([]);
    const [historyPointer, setHistoryPointer] = useState(-1);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

    // Menu state
    const [colorMenuAnchor, setColorMenuAnchor] = useState(null);
    const [shapeMenuAnchor, setShapeMenuAnchor] = useState(null);

    // Color options
    const colors = [
        '#000000', '#808080', '#C0C0C0', '#FFFFFF',
        '#800000', '#FF0000', '#808000', '#FFFF00',
        '#008000', '#00FF00', '#008080', '#00FFFF',
        '#000080', '#0000FF', '#800080', '#FF00FF'
    ];

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to match the container
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Get and configure canvas context
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        // Clear canvas with white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Load default image if provided
        if (defaultImage) {
            const img = new Image();
            img.src = defaultImage;
            img.onload = () => {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                saveToHistory();
            };
        } else {
            saveToHistory();
        }

        // Handle window resize
        const handleResize = () => {
            // Save current image
            const imageData = canvas.toDataURL();

            // Resize canvas
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            // Restore context settings
            context.lineCap = 'round';
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            // Restore image
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = imageData;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [defaultImage]);

    // Update context when color or line width changes
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth, tool]);

    // Save current canvas state to history
    const saveToHistory = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL();

        // If we're not at the end of history, remove everything ahead
        if (historyPointer < history.length - 1) {
            setHistory(history.slice(0, historyPointer + 1));
        }

        // Add current state to history
        setHistory([...history.slice(0, historyPointer + 1), imageData]);
        setHistoryPointer(historyPointer + 1);

        // Call onChange with the new image data
        onChange(imageData);
    };

    // Undo action
    const handleUndo = () => {
        if (historyPointer > 0) {
            const newPointer = historyPointer - 1;
            setHistoryPointer(newPointer);
            loadImageFromHistory(newPointer);
        }
    };

    // Redo action
    const handleRedo = () => {
        if (historyPointer < history.length - 1) {
            const newPointer = historyPointer + 1;
            setHistoryPointer(newPointer);
            loadImageFromHistory(newPointer);
        }
    };

    // Load image from history at given index
    const loadImageFromHistory = (index) => {
        if (!canvasRef.current || !contextRef.current) return;

        const canvas = canvasRef.current;
        const context = contextRef.current;

        const img = new Image();
        img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            onChange(history[index]);
        };
        img.src = history[index];
    };

    // Clear canvas
    const handleClear = () => {
        if (!canvasRef.current || !contextRef.current) return;

        const canvas = canvasRef.current;
        const context = contextRef.current;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    // Start drawing
    const startDrawing = ({ nativeEvent }) => {
        if (!contextRef.current) return;

        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();

        if (tool === 'pen' || tool === 'eraser') {
            contextRef.current.moveTo(offsetX, offsetY);
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'line') {
            setStartPoint({ x: offsetX, y: offsetY });
        } else if (tool === 'fill') {
            fillArea(offsetX, offsetY);
            return;
        }

        setIsDrawing(true);
    };

    // Continue drawing
    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !contextRef.current) return;

        const { offsetX, offsetY } = nativeEvent;

        if (tool === 'pen' || tool === 'eraser') {
            contextRef.current.lineTo(offsetX, offsetY);
            contextRef.current.stroke();
        }
    };

    // Finish drawing
    const finishDrawing = ({ nativeEvent }) => {
        if (!isDrawing || !contextRef.current || !canvasRef.current) return;

        const { offsetX, offsetY } = nativeEvent;
        const context = contextRef.current;
        const canvas = canvasRef.current;

        if (tool === 'pen' || tool === 'eraser') {
            contextRef.current.closePath();
        } else if (tool === 'rectangle') {
            // Draw rectangle
            const width = offsetX - startPoint.x;
            const height = offsetY - startPoint.y;

            // Save current context state
            context.save();

            // Draw shape
            context.beginPath();
            context.rect(startPoint.x, startPoint.y, width, height);
            context.stroke();

            // Restore context
            context.restore();
        } else if (tool === 'circle') {
            // Calculate radius for circle
            const radius = Math.sqrt(
                Math.pow(offsetX - startPoint.x, 2) +
                Math.pow(offsetY - startPoint.y, 2)
            );

            // Save current context state
            context.save();

            // Draw shape
            context.beginPath();
            context.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            context.stroke();

            // Restore context
            context.restore();
        } else if (tool === 'line') {
            // Draw line
            context.save();

            context.beginPath();
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(offsetX, offsetY);
            context.stroke();

            context.restore();
        }

        setIsDrawing(false);
        saveToHistory();
    };

    // Fill an area with current color
    const fillArea = (x, y) => {
        if (!contextRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = contextRef.current;

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Get color of clicked pixel
        const targetColor = getPixelColor(imageData, x, y);

        // Convert current color to array [r, g, b, a]
        const fillColor = hexToRgba(color);

        // Check if target color is the same as fill color
        if (colorsEqual(targetColor, fillColor)) return;

        // Flood fill algorithm
        const pixelsToCheck = [{x, y}];
        const visitedPixels = new Set();

        while (pixelsToCheck.length > 0) {
            const {x, y} = pixelsToCheck.pop();
            const index = (y * width + x) * 4;

            // Skip if pixel is outside canvas or already visited
            if (
                x < 0 || y < 0 || x >= width || y >= height ||
                visitedPixels.has(`${x},${y}`)
            ) {
                continue;
            }

            // Skip if pixel color doesn't match target color
            const pixelColor = [
                data[index],
                data[index + 1],
                data[index + 2],
                data[index + 3]
            ];

            if (!colorsEqual(pixelColor, targetColor)) {
                continue;
            }

            // Fill pixel with new color
            data[index] = fillColor[0];
            data[index + 1] = fillColor[1];
            data[index + 2] = fillColor[2];
            data[index + 3] = fillColor[3];

            // Mark as visited
            visitedPixels.add(`${x},${y}`);

            // Add adjacent pixels to check
            pixelsToCheck.push({x: x + 1, y});
            pixelsToCheck.push({x: x - 1, y});
            pixelsToCheck.push({x, y: y + 1});
            pixelsToCheck.push({x, y: y - 1});
        }

        // Update canvas with filled area
        context.putImageData(imageData, 0, 0);
        saveToHistory();
    };

    // Helper: Get color of pixel at (x, y)
    const getPixelColor = (imageData, x, y) => {
        const index = (y * imageData.width + x) * 4;
        return [
            imageData.data[index],
            imageData.data[index + 1],
            imageData.data[index + 2],
            imageData.data[index + 3]
        ];
    };

    // Helper: Check if two colors are equal
    const colorsEqual = (color1, color2) => {
        return (
            color1[0] === color2[0] &&
            color1[1] === color2[1] &&
            color1[2] === color2[2] &&
            color1[3] === color2[3]
        );
    };

    // Helper: Convert hex color to rgba array
    const hexToRgba = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 255]; // Full opacity
    };

    // Export current canvas as image
    const handleSave = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.download = 'canvas-drawing.png';
        link.href = dataUrl;
        link.click();
    };

    // Handle color menu
    const handleColorMenuOpen = (event) => {
        setColorMenuAnchor(event.currentTarget);
    };

    const handleColorMenuClose = () => {
        setColorMenuAnchor(null);
    };

    const handleColorSelect = (newColor) => {
        setColor(newColor);
        handleColorMenuClose();
    };

    // Handle shape menu
    const handleShapeMenuOpen = (event) => {
        setShapeMenuAnchor(event.currentTarget);
    };

    const handleShapeMenuClose = () => {
        setShapeMenuAnchor(null);
    };

    const handleShapeSelect = (shapeTool) => {
        setTool(shapeTool);
        handleShapeMenuClose();
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            minHeight: '400px'
        }}>
            {/* Toolbar */}
            <Paper
                elevation={3}
                sx={{
                    p: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <Tooltip title="Pen Tool">
                    <IconButton
                        color={tool === 'pen' ? 'primary' : 'default'}
                        onClick={() => setTool('pen')}
                    >
                        <PencilIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Eraser">
                    <IconButton
                        color={tool === 'eraser' ? 'primary' : 'default'}
                        onClick={() => setTool('eraser')}
                    >
                        <EraserIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Fill Tool">
                    <IconButton
                        color={tool === 'fill' ? 'primary' : 'default'}
                        onClick={() => setTool('fill')}
                    >
                        <FormatPaintIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Shapes">
                    <IconButton
                        onClick={handleShapeMenuOpen}
                        color={['rectangle', 'circle', 'line'].includes(tool) ? 'primary' : 'default'}
                    >
                        <BrushIcon />
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={shapeMenuAnchor}
                    open={Boolean(shapeMenuAnchor)}
                    onClose={handleShapeMenuClose}
                >
                    <MenuItem onClick={() => handleShapeSelect('rectangle')}>
                        <RectangleIcon sx={{ mr: 1 }} /> Rectangle
                    </MenuItem>
                    <MenuItem onClick={() => handleShapeSelect('circle')}>
                        <CircleIcon sx={{ mr: 1 }} /> Circle
                    </MenuItem>
                    <MenuItem onClick={() => handleShapeSelect('line')}>
                        <LineIcon sx={{ mr: 1 }} /> Line
                    </MenuItem>
                </Menu>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Line Width">
                    <Box sx={{ width: 100, mx: 1 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item>
                                <Typography variant="body2">
                                    {lineWidth}px
                                </Typography>
                            </Grid>
                            <Grid item xs>
                                <Slider
                                    value={lineWidth}
                                    onChange={(_, value) => setLineWidth(value)}
                                    min={1}
                                    max={20}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Tooltip>

                <Tooltip title="Color">
                    <IconButton onClick={handleColorMenuOpen}>
                        <ColorLensIcon sx={{ color }} />
                    </IconButton>
                </Tooltip>

                <Menu
                    anchorEl={colorMenuAnchor}
                    open={Boolean(colorMenuAnchor)}
                    onClose={handleColorMenuClose}
                >
                    <Box sx={{
                        p: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 0.5
                    }}>
                        {colors.map((c) => (
                            <Box
                                key={c}
                                sx={{
                                    width: 30,
                                    height: 30,
                                    backgroundColor: c,
                                    border: '1px solid #ddd',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    '&:hover': {
                                        opacity: 0.8,
                                    },
                                    ...(c === color && {
                                        border: '2px solid #333',
                                    }),
                                }}
                                onClick={() => handleColorSelect(c)}
                            />
                        ))}
                    </Box>
                </Menu>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="Undo">
          <span>
            <IconButton
                onClick={handleUndo}
                disabled={historyPointer <= 0}
            >
              <UndoIcon />
            </IconButton>
          </span>
                </Tooltip>

                <Tooltip title="Redo">
          <span>
            <IconButton
                onClick={handleRedo}
                disabled={historyPointer >= history.length - 1}
            >
              <RedoIcon />
            </IconButton>
          </span>
                </Tooltip>

                <Tooltip title="Clear Canvas">
                    <IconButton onClick={handleClear} color="error">
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Save Image">
                    <IconButton onClick={handleSave} color="success">
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Canvas */}
            <Box
                sx={{
                    flexGrow: 1,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    mt: 1,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={finishDrawing}
                    onMouseLeave={finishDrawing}
                    style={{
                        width: '100%',
                        height: '100%',
                        cursor: tool === 'pen' ? 'crosshair' :
                            tool === 'eraser' ? 'cell' :
                                tool === 'fill' ? 'copy' : 'crosshair'
                    }}
                />
            </Box>
        </Box>
    );
};

export default PaintCanvas;
