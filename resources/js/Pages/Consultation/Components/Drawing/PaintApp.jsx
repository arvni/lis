import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Button,
    ButtonGroup,
    Box,
    Typography,
    Slider,
    Tooltip,
    Divider,
    Grid2 as Grid,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import {
    Brush as BrushIcon,
    Circle as CircleIcon,
    Crop32 as RectangleIcon,
    Remove as LineIcon,
    FormatColorFill as FillIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Clear as ClearIcon,
    MoreHoriz as DottedLineIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {Eraser} from "lucide-react";

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    minWidth: '40px',
                },
            },
        },
    },
});

const ReactPaintMUI = ({
                           defaultImage = null,
                           onChange = () => {}
                       }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [previewCanvas, setPreviewCanvas] = useState(null);

    // Optimized color palette
    const colors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
        '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000',
        '#FF69B4', '#32CD32', '#87CEEB', '#DDA0DD', '#F0E68C', '#FA8072'
    ];

    const tools = [
        { name: 'pen', icon: BrushIcon, label: 'Pen' },
        { name: 'eraser', icon: Eraser, label: 'Eraser' },
        { name: 'fill', icon: FillIcon, label: 'Fill' },
        { name: 'line', icon: LineIcon, label: 'Line' },
        { name: 'dottedLine', icon: DottedLineIcon, label: 'Dotted Line' },
        { name: 'rectangle', icon: RectangleIcon, label: 'Rectangle' },
        { name: 'circle', icon: CircleIcon, label: 'Circle' }
    ];

    // Optimized history management
    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageData);

        // Limit history to prevent memory issues
        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setHistoryIndex(prev => prev + 1);
        }

        setHistory(newHistory);
        // Call onChange with the new image data
        onChange(imageData);
    }, [history, historyIndex]);

    // Optimized position calculation
    const getCanvasPosition = useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }, []);

    // Optimized flood fill algorithm
    const floodFill = useCallback((startX, startY, newColor) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const startIndex = (startY * canvas.width + startX) * 4;
        const targetColor = [
            data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]
        ];

        const fillColor = [
            parseInt(newColor.slice(1, 3), 16),
            parseInt(newColor.slice(3, 5), 16),
            parseInt(newColor.slice(5, 7), 16),
            255
        ];

        // Don't fill if colors are the same
        if (targetColor.every((c, i) => c === fillColor[i])) return;

        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;

            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height || visited.has(key)) continue;

            const index = (y * canvas.width + x) * 4;
            const currentColor = [data[index], data[index + 1], data[index + 2], data[index + 3]];

            if (!currentColor.every((c, i) => c === targetColor[i])) continue;

            visited.add(key);

            data[index] = fillColor[0];
            data[index + 1] = fillColor[1];
            data[index + 2] = fillColor[2];
            data[index + 3] = fillColor[3];

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }, []);

    // Fixed shape drawing with proper preview
    const drawShape = useCallback((ctx, start, end, isPreview = false) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isPreview) {
            ctx.globalAlpha = 0.7;
            if (tool === 'dottedLine') {
                ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
            } else {
                ctx.setLineDash([5, 5]);
            }
        } else {
            ctx.globalAlpha = 1;
            if (tool === 'dottedLine') {
                ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
            } else {
                ctx.setLineDash([]);
            }
        }

        ctx.beginPath();

        switch (tool) {
            case 'line':
            case 'dottedLine':
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                break;
            case 'rectangle':
                const width = end.x - start.x;
                const height = end.y - start.y;
                ctx.rect(start.x, start.y, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
                break;
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
    }, [tool, color, lineWidth]);

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPosition(e);

        setStartPos(pos);

        if (tool === 'fill') {
            floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
            saveToHistory();
            return;
        }

        // Save canvas state for shape tools
        if (['line', 'dottedLine', 'rectangle', 'circle'].includes(tool)) {
            setPreviewCanvas(canvas.toDataURL());
        }

        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'pen' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    }, [tool, color, lineWidth, getCanvasPosition, floodFill, saveToHistory]);

    const draw = useCallback((e) => {
        if (!isDrawing || tool === 'fill') return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPosition(e);

        if (tool === 'pen' || tool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (['line', 'dottedLine', 'rectangle', 'circle'].includes(tool)) {
            // Clear canvas and redraw from saved state
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                drawShape(ctx, startPos, pos, true);
            };
            img.src = previewCanvas;
        }
    }, [isDrawing, tool, startPos, previewCanvas, getCanvasPosition, drawShape]);

    const stopDrawing = useCallback((e) => {
        if (!isDrawing) return;
        e?.preventDefault();

        setIsDrawing(false);

        if (['line', 'dottedLine', 'rectangle', 'circle'].includes(tool)) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const pos = getCanvasPosition(e);

            // Clear and redraw final shape
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                drawShape(ctx, startPos, pos, false);
                saveToHistory();
            };
            img.src = previewCanvas;
        } else if (tool === 'pen' || tool === 'eraser') {
            saveToHistory();
        }

        setPreviewCanvas(null);
    }, [isDrawing, tool, startPos, previewCanvas, getCanvasPosition, drawShape, saveToHistory]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };

            img.src = history[historyIndex - 1];
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };

            img.src = history[historyIndex + 1];
            setHistoryIndex(prev => prev + 1);
        }
    }, [history, historyIndex]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    }, [saveToHistory]);


    // Color picker component
    const ColorPicker = ({ selectedColor, onColorChange }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 320 }}>
            {colors.map((c) => (
                <Box
                    key={c}
                    onClick={() => onColorChange(c)}
                    sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: c,
                        border: selectedColor === c ? '3px solid #1976d2' : '1px solid #ccc',
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2
                        }
                    }}
                />
            ))}
            <Box
                component="input"
                type="color"
                value={selectedColor}
                onChange={(e) => onColorChange(e.target.value)}
                sx={{
                    width: 24,
                    height: 24,
                    border: 'none',
                    borderRadius: 1,
                    cursor: 'pointer',
                    padding: 0
                }}
            />
        </Box>
    );

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;

        // Initialize with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Clear canvas with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load default image if provided

        if (defaultImage) {
            const img = new Image();
            img.src = defaultImage;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                saveToHistory();
            };
        } else {
            saveToHistory();
        }

    }, []);

    // Event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (e) => startDrawing(e);
        const handleMouseMove = (e) => draw(e);
        const handleMouseUp = (e) => stopDrawing(e);
        const handleMouseLeave = (e) => stopDrawing(e);

        const handleTouchStart = (e) => startDrawing(e);
        const handleTouchMove = (e) => draw(e);
        const handleTouchEnd = (e) => stopDrawing(e);

        // Mouse events
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        // Touch events
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [startDrawing, draw, stopDrawing]);

    const getCursor = () => {
        switch (tool) {
            case 'pen': return 'crosshair';
            case 'eraser': return 'grab';
            case 'fill': return 'cell';
            default: return 'crosshair';
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh'}}>
                {/* Tools Panel */}
                <Card elevation={3} sx={{mb: 3}}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="flex-start">
                            {/* Drawing Tools */}
                            <Grid size={{ xs:12, sm:6, md:3}}>
                                <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 600}}>
                                    Drawing Tools
                                </Typography>
                                <ButtonGroup variant="outlined" size="medium" sx={{flexWrap: 'wrap', gap: 0}}>
                                    {tools.map(({name, icon: Icon, label}) => (
                                        <Tooltip key={name} title={label}>
                                            <Button
                                                variant={tool === name ? 'contained' : 'outlined'}
                                                onClick={() => setTool(name)}
                                                sx={{
                                                    minWidth: 48,
                                                    height: 48,
                                                    mb: 1
                                                }}
                                            >
                                                <Icon/>
                                            </Button>
                                        </Tooltip>
                                    ))}
                                </ButtonGroup>
                                <Box sx={{mt: 1}}>
                                    <Chip
                                        label={`Active: ${tools.find(t => t.name === tool)?.label}`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            </Grid>

                            <Divider orientation="vertical" flexItem/>

                            {/* Color Palette */}
                            <Grid size={{ xs:12, sm:6, md:3}}>
                                <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 600}}>
                                    Color Palette
                                </Typography>
                                <ColorPicker selectedColor={color} onColorChange={setColor}/>
                                <Box sx={{mt: 1}}>
                                    <Chip
                                        label={`Selected: ${color}`}
                                        sx={{backgroundColor: color, color: color === '#000000' ? 'white' : 'black'}}
                                        size="small"
                                    />
                                </Box>
                            </Grid>

                            <Divider orientation="vertical" flexItem/>

                            {/* Brush Settings */}
                            <Grid  size={{ xs:12, sm:6, md:2}}>
                                <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 600}}>
                                    Brush Size
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {lineWidth}px
                                </Typography>
                                <Slider
                                    value={lineWidth}
                                    onChange={(e, value) => setLineWidth(value)}
                                    min={1}
                                    max={50}
                                    step={1}
                                    valueLabelDisplay="auto"
                                    size="medium"
                                />
                            </Grid>

                            <Divider orientation="vertical" flexItem/>

                            {/* Action Buttons */}
                            <Grid  size={{ xs:12, sm:6, md:2}}>
                                <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 600}}>
                                    Actions
                                </Typography>
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                    <ButtonGroup variant="outlined" size="small">
                                        <Tooltip title="Undo">
                        <span>
                          <Button
                              onClick={undo}
                              disabled={historyIndex <= 0}
                          >
                            <UndoIcon fontSize="small"/>
                          </Button>
                        </span>
                                        </Tooltip>
                                        <Tooltip title="Redo">
                        <span>
                          <Button
                              onClick={redo}
                              disabled={historyIndex >= history.length - 1}
                          >
                            <RedoIcon fontSize="small"/>
                          </Button>
                        </span>
                                        </Tooltip>
                                        <Tooltip title="Clear Canvas">
                                            <Button onClick={clearCanvas} color="error">
                                                <ClearIcon fontSize="small"/>
                                            </Button>
                                        </Tooltip>
                                    </ButtonGroup>
                                    <Typography variant="caption" color="text.secondary">
                                        History: {historyIndex + 1}/{history.length}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    style={{
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        cursor: getCursor(),
                        width: 'calc(100dvw - 4rem)',
                        height: '100dvh',
                        touchAction: 'none',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                />
            </Box>
        </ThemeProvider>
    );
};

export default ReactPaintMUI;
