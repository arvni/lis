import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
    Button,
    ButtonGroup,
    Box,
    Typography,
    Slider,
    Tooltip,
    AppBar,
    Toolbar,
    Divider,
    Chip,
    Paper
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
    Diamond as DiamondIcon,
    ChangeHistory as TriangleIcon,
    ViewStream as CoplanarLinesIcon,
    ArrowUpward as ArrowIcon
} from '@mui/icons-material';
import {createTheme, ThemeProvider} from '@mui/material/styles';
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
                           onChange = () => {
                           }
                       }) => {
    const canvasRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [shapeSize, setShapeSize] = useState(50);
    const [arrowRotation, setArrowRotation] = useState(0);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [startPos, setStartPos] = useState({x: 0, y: 0});
    const [previewCanvas, setPreviewCanvas] = useState(null);
    const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
    const [showCursorPreview, setShowCursorPreview] = useState(false);
    const [canvasSize, setCanvasSize] = useState({width: 800, height: 600});
    const [coplanarLineCount, setCoplanarLineCount] = useState(2);
    const [coplanarLineSpacing, setCoplanarLineSpacing] = useState(5);

    const colors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
        '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000',
        '#FF69B4', '#32CD32', '#87CEEB', '#DDA0DD', '#F0E68C', '#FA8072'
    ];

    const tools = [
        {name: 'pen', icon: BrushIcon, label: 'Pen'},
        {name: 'eraser', icon: Eraser, label: 'Eraser'},
        {name: 'fill', icon: FillIcon, label: 'Fill'},
        {name: 'line', icon: LineIcon, label: 'Line'},
        {name: 'dottedLine', icon: DottedLineIcon, label: 'Dotted Line'},
        {name: 'coplanarLines', icon: CoplanarLinesIcon, label: 'Parallel Lines'},
        {name: 'rectangle', icon: RectangleIcon, label: 'Rectangle'},
        {name: 'circle', icon: CircleIcon, label: 'Circle'},
        {name: 'diamond', icon: DiamondIcon, label: 'Diamond'},
        {name: 'triangle', icon: TriangleIcon, label: 'Triangle'},
        {name: 'arrow', icon: ArrowIcon, label: 'Arrow'}
    ];

    const numberTools = [
        {name: 'number0', label: '0'},
        {name: 'number1', label: '1'},
        {name: 'number2', label: '2'},
        {name: 'number3', label: '3'},
        {name: 'number4', label: '4'},
        {name: 'number5', label: '5'},
        {name: 'number6', label: '6'},
        {name: 'number7', label: '7'},
        {name: 'number8', label: '8'},
        {name: 'number9', label: '9'}
    ];

    // Update canvas size when window resizes
    const updateCanvasSize = useCallback(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            // Account for padding and leave space for the number toolbox
            const newWidth = Math.floor(rect.width - 160); // 140px for toolbox + padding
            const newHeight = Math.floor(rect.height - 16);
            setCanvasSize({width: newWidth, height: newHeight});
        }
    }, []);

    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        const timer = setTimeout(updateCanvasSize, 100);
        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            clearTimeout(timer);
        };
    }, [updateCanvasSize]);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const imageData = canvas.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageData);

        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setHistoryIndex(prev => prev + 1);
        }

        setHistory(newHistory);
        onChange(imageData);
    }, [history, historyIndex, onChange]);

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

    const floodFill = useCallback((startX, startY, newColor) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const targetColorRgba = [data[(startY * canvas.width + startX) * 4], data[(startY * canvas.width + startX) * 4 + 1], data[(startY * canvas.width + startX) * 4 + 2], data[(startY * canvas.width + startX) * 4 + 3]];
        const fillColorRgba = [parseInt(newColor.slice(1, 3), 16), parseInt(newColor.slice(3, 5), 16), parseInt(newColor.slice(5, 7), 16), 255];
        if (targetColorRgba.join(',') === fillColorRgba.join(',')) return;

        const stack = [[startX, startY]];
        while (stack.length) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
            const index = (y * canvas.width + x) * 4;
            if (data[index] === targetColorRgba[0] && data[index + 1] === targetColorRgba[1] && data[index + 2] === targetColorRgba[2] && data[index + 3] === targetColorRgba[3]) {
                data[index] = fillColorRgba[0];
                data[index + 1] = fillColorRgba[1];
                data[index + 2] = fillColorRgba[2];
                data[index + 3] = fillColorRgba[3];
                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }, []);

    const drawDiamond = useCallback((ctx, centerX, centerY, size) => {
        const halfSize = size / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - halfSize);
        ctx.lineTo(centerX + halfSize, centerY);
        ctx.lineTo(centerX, centerY + halfSize);
        ctx.lineTo(centerX - halfSize, centerY);
        ctx.closePath();
        ctx.stroke();
    }, []);

    const drawTriangle = useCallback((ctx, centerX, centerY, size) => {
        const height = (size * Math.sqrt(3)) / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - height / 2);
        ctx.lineTo(centerX - size / 2, centerY + height / 2);
        ctx.lineTo(centerX + size / 2, centerY + height / 2);
        ctx.closePath();
        ctx.stroke();
    }, []);

    const drawArrow = useCallback((ctx, centerX, centerY, size, rotation = 0) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);

        const arrowLength = size;
        const arrowHeadLength = size * 0.3;
        const arrowHeadWidth = size * 0.2;

        ctx.beginPath();
        ctx.moveTo(0, -arrowLength / 2);
        ctx.lineTo(0, arrowLength / 2 - arrowHeadLength);

        ctx.moveTo(-arrowHeadWidth, arrowLength / 2 - arrowHeadLength);
        ctx.lineTo(0, arrowLength / 2);
        ctx.lineTo(arrowHeadWidth, arrowLength / 2 - arrowHeadLength);

        ctx.stroke();
        ctx.restore();
    }, []);

    const drawNumber = useCallback((ctx, centerX, centerY, size, number) => {
        ctx.save();
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(number, centerX, centerY);
        ctx.restore();
    }, [color]);

    const drawShape = useCallback((ctx, start, end, isPreview = false) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isPreview) {
            ctx.globalAlpha = 0.7;
            ctx.setLineDash([5, 5]);
        } else {
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        }

        if (tool === 'dottedLine') {
            ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
        }

        if (tool === 'coplanarLines') {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) return;

            const perpX = -dy / length;
            const perpY = dx / length;

            const totalLines = coplanarLineCount;
            const startOffset = -((totalLines - 1) * coplanarLineSpacing) / 2;

            for (let i = 0; i < totalLines; i++) {
                const offset = startOffset + (i * coplanarLineSpacing);
                const offsetStartX = start.x + perpX * offset;
                const offsetStartY = start.y + perpY * offset;
                const offsetEndX = end.x + perpX * offset;
                const offsetEndY = end.y + perpY * offset;

                ctx.beginPath();
                ctx.moveTo(offsetStartX, offsetStartY);
                ctx.lineTo(offsetEndX, offsetEndY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
            return;
        }

        ctx.beginPath();
        switch (tool) {
            case 'line':
            case 'dottedLine':
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                break;
            case 'rectangle':
                ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
                break;
            case 'diamond':
                const diamondRadius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const halfDiamond = diamondRadius;
                ctx.moveTo(start.x, start.y - halfDiamond);
                ctx.lineTo(start.x + halfDiamond, start.y);
                ctx.lineTo(start.x, start.y + halfDiamond);
                ctx.lineTo(start.x - halfDiamond, start.y);
                ctx.closePath();
                break;
            case 'triangle':
                const triangleRadius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const triangleHeight = (triangleRadius * Math.sqrt(3)) / 2;
                ctx.moveTo(start.x, start.y - triangleHeight / 2);
                ctx.lineTo(start.x - triangleRadius / 2, start.y + triangleHeight / 2);
                ctx.lineTo(start.x + triangleRadius / 2, start.y + triangleHeight / 2);
                ctx.closePath();
                break;
            default:
                break;
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
    }, [tool, color, lineWidth, coplanarLineCount, coplanarLineSpacing]);

    const drawCursorPreview = useCallback(() => {
        const previewCanvas = previewCanvasRef.current;
        if (!previewCanvas || !showCursorPreview) return;

        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        if (tool === 'eraser') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(cursorPos.x, cursorPos.y, lineWidth / 2, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cursorPos.x - 5, cursorPos.y);
            ctx.lineTo(cursorPos.x + 5, cursorPos.y);
            ctx.moveTo(cursorPos.x, cursorPos.y - 5);
            ctx.lineTo(cursorPos.x, cursorPos.y + 5);
            ctx.stroke();

            ctx.globalAlpha = 1;
        } else if (['rectangle', 'circle', 'diamond', 'triangle', 'arrow'].includes(tool) || tool.startsWith('number')) {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, lineWidth / 2);
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();

            if (tool === 'rectangle') {
                ctx.rect(
                    cursorPos.x - shapeSize / 2,
                    cursorPos.y - shapeSize / 2,
                    shapeSize,
                    shapeSize
                );
            } else if (tool === 'circle') {
                ctx.arc(cursorPos.x, cursorPos.y, shapeSize / 2, 0, 2 * Math.PI);
            } else if (tool === 'diamond') {
                const halfSize = shapeSize / 2;
                ctx.moveTo(cursorPos.x, cursorPos.y - halfSize);
                ctx.lineTo(cursorPos.x + halfSize, cursorPos.y);
                ctx.lineTo(cursorPos.x, cursorPos.y + halfSize);
                ctx.lineTo(cursorPos.x - halfSize, cursorPos.y);
                ctx.closePath();
            } else if (tool === 'triangle') {
                const height = (shapeSize * Math.sqrt(3)) / 2;
                ctx.moveTo(cursorPos.x, cursorPos.y - height / 2);
                ctx.lineTo(cursorPos.x - shapeSize / 2, cursorPos.y + height / 2);
                ctx.lineTo(cursorPos.x + shapeSize / 2, cursorPos.y + height / 2);
                ctx.closePath();
            } else if (tool === 'arrow') {
                ctx.setLineDash([]);
                drawArrow(ctx, cursorPos.x, cursorPos.y, shapeSize, arrowRotation);
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
                return;
            } else if (tool.startsWith('number')) {
                ctx.setLineDash([]);
                ctx.globalAlpha = 0.6;
                const number = tool.replace('number', '');
                drawNumber(ctx, cursorPos.x, cursorPos.y, shapeSize, number);
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
                return;
            }

            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        }
    }, [tool, color, lineWidth, shapeSize, arrowRotation, cursorPos, showCursorPreview, drawArrow, drawNumber]);

    const handleMouseMove = useCallback((e) => {
        const pos = getCanvasPosition(e);
        setCursorPos(pos);

        if (isDrawing) {
            draw(e);
        }
    }, [getCanvasPosition, isDrawing]);

    const handleMouseEnter = useCallback(() => {
        setShowCursorPreview(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setShowCursorPreview(false);
        const previewCanvas = previewCanvasRef.current;
        if (previewCanvas) {
            const ctx = previewCanvas.getContext('2d');
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        }
    }, []);

    const startDrawing = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPosition(e);

        // Handle fixed-size shapes and numbers on a single click
        if (['rectangle', 'circle', 'diamond', 'triangle', 'arrow'].includes(tool) || tool.startsWith('number')) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([]);
            ctx.beginPath();

            if (tool === 'rectangle') {
                ctx.rect(pos.x - shapeSize / 2, pos.y - shapeSize / 2, shapeSize, shapeSize);
                ctx.stroke();
            } else if (tool === 'circle') {
                ctx.arc(pos.x, pos.y, shapeSize / 2, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (tool === 'diamond') {
                drawDiamond(ctx, pos.x, pos.y, shapeSize);
            } else if (tool === 'triangle') {
                drawTriangle(ctx, pos.x, pos.y, shapeSize);
            } else if (tool === 'arrow') {
                drawArrow(ctx, pos.x, pos.y, shapeSize, arrowRotation);
            } else if (tool.startsWith('number')) {
                const number = tool.replace('number', '');
                drawNumber(ctx, pos.x, pos.y, shapeSize, number);
            }

            saveToHistory();
            setIsDrawing(false);
            return;
        }

        setIsDrawing(true);
        setStartPos(pos);

        if (tool === 'fill') {
            floodFill(Math.floor(pos.x), Math.floor(pos.y), color);
            saveToHistory();
            return;
        }

        if (['line', 'dottedLine', 'coplanarLines'].includes(tool)) {
            setPreviewCanvas(canvas.toDataURL());
        }

        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash(tool === 'dottedLine' ? [lineWidth * 2, lineWidth * 2] : []);

        if (tool === 'pen' || tool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    }, [tool, color, lineWidth, shapeSize, arrowRotation, getCanvasPosition, floodFill, saveToHistory, drawDiamond, drawTriangle, drawArrow, drawNumber]);

    const draw = useCallback((e) => {
        if (!isDrawing || tool === 'fill') return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getCanvasPosition(e);

        if (tool === 'pen' || tool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (['line', 'dottedLine', 'coplanarLines'].includes(tool)) {
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

        if (['line', 'dottedLine', 'coplanarLines'].includes(tool)) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const pos = getCanvasPosition(e);
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
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[newIndex];
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[newIndex];
        }
    }, [history, historyIndex]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    }, [saveToHistory]);

    const ColorPicker = ({selectedColor, onColorChange}) => (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 320}}>
            {colors.map((c) => (
                <Box
                    key={c}
                    onClick={() => onColorChange(c)}
                    sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: c,
                        border: selectedColor === c ? '2px solid #1976d2' : '1px solid #ccc',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 1
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
                    width: 20,
                    height: 20,
                    border: 'none',
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    padding: 0
                }}
            />
        </Box>
    );

    useEffect(() => {
        drawCursorPreview();
    }, [drawCursorPreview]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const previewCanvas = previewCanvasRef.current;
        if (!canvas || !previewCanvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        previewCanvas.width = canvasSize.width;
        previewCanvas.height = canvasSize.height;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    }, [canvasSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const preventDefault = (e) => e.preventDefault();
        canvas.addEventListener('touchstart', preventDefault, {passive: false});
        canvas.addEventListener('touchmove', preventDefault, {passive: false});
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('mouseenter', handleMouseEnter);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            canvas.removeEventListener('touchstart', preventDefault);
            canvas.removeEventListener('touchmove', preventDefault);
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseleave', stopDrawing);
            canvas.removeEventListener('mouseenter', handleMouseEnter);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
        };
    }, [startDrawing, handleMouseMove, draw, stopDrawing, handleMouseEnter, handleMouseLeave]);

    const getCursor = () => {
        switch (tool) {
            case 'pen':
                return 'crosshair';
            case 'eraser':
                return 'none';
            case 'fill':
                return 'cell';
            case 'rectangle':
            case 'circle':
            case 'diamond':
            case 'triangle':
            case 'arrow':
                return 'none';
            default:
                if (tool.startsWith('number')) return 'none';
                return 'crosshair';
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5'}}>
                {/* Top Toolbar */}
                <AppBar position="static" elevation={1} sx={{bgcolor: 'white', color: 'text.primary'}}>
                    <Toolbar variant="dense" sx={{minHeight: 48, gap: 2, flexWrap: 'wrap', py: 1}}>
                        {/* Tools */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600, mr: 1}}>
                                Tools:
                            </Typography>
                            <ButtonGroup variant="outlined" size="small">
                                {tools.map(({name, icon: Icon, label}) => (
                                    <Tooltip key={name} title={label}>
                                        <Button
                                            variant={tool === name ? 'contained' : 'outlined'}
                                            onClick={() => setTool(name)}
                                            sx={{minWidth: 36, height: 36, p: 0.5}}
                                        >
                                            <Icon sx={{fontSize: 16}}/>
                                        </Button>
                                    </Tooltip>
                                ))}
                            </ButtonGroup>
                        </Box>

                        <Divider orientation="vertical" flexItem/>

                        {/* Color Palette */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Typography variant="subtitle2" sx={{fontWeight: 600}}>
                                Color:
                            </Typography>
                            <ColorPicker selectedColor={color} onColorChange={setColor}/>
                        </Box>

                        <Divider orientation="vertical" flexItem/>

                        {/* Settings */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <Box sx={{minWidth: 120}}>
                                <Typography variant="caption" color="text.secondary">
                                    Brush: {lineWidth}px
                                </Typography>
                                <Slider
                                    value={lineWidth}
                                    onChange={(e, value) => setLineWidth(value)}
                                    min={1}
                                    max={50}
                                    size="small"
                                    sx={{mt: -0.5}}
                                />
                            </Box>
                            <Box sx={{minWidth: 120}}>
                                <Typography variant="caption" color="text.secondary">
                                    Shape: {shapeSize}px
                                </Typography>
                                <Slider
                                    value={shapeSize}
                                    onChange={(e, value) => setShapeSize(value)}
                                    min={10}
                                    max={200}
                                    size="small"
                                    disabled={!['rectangle', 'circle', 'diamond', 'triangle', 'arrow'].includes(tool) && !tool.startsWith('number')}
                                    sx={{mt: -0.5}}
                                />
                            </Box>
                            {tool === 'arrow' && (
                                <Box sx={{minWidth: 120}}>
                                    <Typography variant="caption" color="text.secondary">
                                        Rotation: {arrowRotation}°
                                    </Typography>
                                    <Slider
                                        value={arrowRotation}
                                        onChange={(e, value) => setArrowRotation(value)}
                                        min={0}
                                        max={360}
                                        size="small"
                                        sx={{mt: -0.5}}
                                    />
                                </Box>
                            )}
                            {tool === 'coplanarLines' && (
                                <>
                                    <Box sx={{minWidth: 100}}>
                                        <Typography variant="caption" color="text.secondary">
                                            Lines: {coplanarLineCount}
                                        </Typography>
                                        <Slider
                                            value={coplanarLineCount}
                                            onChange={(e, value) => setCoplanarLineCount(value)}
                                            min={2}
                                            max={10}
                                            size="small"
                                            sx={{mt: -0.5}}
                                        />
                                    </Box>
                                    <Box sx={{minWidth: 120}}>
                                        <Typography variant="caption" color="text.secondary">
                                            Spacing: {coplanarLineSpacing}px
                                        </Typography>
                                        <Slider
                                            value={coplanarLineSpacing}
                                            onChange={(e, value) => setCoplanarLineSpacing(value)}
                                            min={5}
                                            max={50}
                                            size="small"
                                            sx={{mt: -0.5}}
                                        />
                                    </Box>
                                </>
                            )}
                        </Box>

                        <Divider orientation="vertical" flexItem/>

                        {/* Actions */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <ButtonGroup variant="outlined" size="small">
                                <Tooltip title="Undo">
                                    <span>
                                        <Button onClick={undo} disabled={historyIndex <= 0}
                                                sx={{minWidth: 36, height: 36}}>
                                            <UndoIcon sx={{fontSize: 16}}/>
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Redo">
                                    <span>
                                        <Button onClick={redo} disabled={historyIndex >= history.length - 1}
                                                sx={{minWidth: 36, height: 36}}>
                                            <RedoIcon sx={{fontSize: 16}}/>
                                        </Button>
                                    </span>
                                </Tooltip>
                                <Tooltip title="Clear">
                                    <span>
                                        <Button onClick={clearCanvas} color="secondary" sx={{minWidth: 36, height: 36}}>
                                            <ClearIcon sx={{fontSize: 16}}/>
                                        </Button>
                                    </span>
                                </Tooltip>
                            </ButtonGroup>
                            <Chip
                                label={`${historyIndex + 1}/${history.length}`}
                                size="small"
                                variant="outlined"
                                sx={{fontSize: '0.7rem', height: 24}}
                            />
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Main Content Area */}
                <Box sx={{display: 'flex', flexGrow: 1, overflow: 'hidden'}}>
                    {/* Number Toolbox */}
                    <Paper
                        elevation={2}
                        sx={{
                            width: 140,
                            m: 1,
                            mr: 0.5,
                            p: 1,
                            bgcolor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                        }}
                    >
                        <Typography variant="subtitle2" sx={{fontWeight: 600, textAlign: 'center', mb: 1}}>
                            Numbers
                        </Typography>
                        <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1}}>
                            {numberTools.map(({name, label}) => (
                                <Tooltip key={name} title={`Number ${label}`}>
                                    <Button
                                        variant={tool === name ? 'contained' : 'outlined'}
                                        onClick={() => setTool(name)}
                                        sx={{
                                            minWidth: 36,
                                            height: 36,
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {label}
                                    </Button>
                                </Tooltip>
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center', mt: 1}}>
                            Click to place numbers on canvas
                        </Typography>
                    </Paper>

                    {/* Canvas Container */}
                    <Box
                        ref={containerRef}
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 1,
                            pl: 0.5,
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{position: 'relative', width: '100%', height: '100%'}}>
                            <canvas
                                ref={canvasRef}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                style={{
                                    border: '2px solid #e0e0e0',
                                    borderRadius: 8,
                                    cursor: getCursor(),
                                    width: canvasSize.width,
                                    height: canvasSize.height,
                                    touchAction: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    backgroundColor: '#ffffff',
                                    display: 'block'
                                }}
                            />
                            <canvas
                                ref={previewCanvasRef}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    border: 'none',
                                    borderRadius: 8,
                                    pointerEvents: 'none',
                                    width: canvasSize.width,
                                    height: canvasSize.height,
                                    touchAction: 'none'
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>);
}
export default ReactPaintMUI;
