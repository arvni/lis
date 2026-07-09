import { useCallback, useEffect, useRef, useState } from 'react';
import { SHAPE_TOOLS } from './constants';
import {
    floodFill,
    drawDiamond,
    drawTriangle,
    drawArrow,
    drawNumber,
    drawShape,
} from './canvasHelpers';

/**
 * Owns the paint canvas: refs, tool/style state, undo/redo history and all
 * pointer/touch drawing handlers. Extracted from the {@link ReactPaintMUI}
 * component body so the drawing logic is testable in isolation and the
 * component is thin presentation.
 */
export default function usePaintCanvas({ defaultImage = null, onChange = () => {} }) {
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
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [previewCanvas, setPreviewCanvas] = useState(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCursorPreview, setShowCursorPreview] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [coplanarLineCount, setCoplanarLineCount] = useState(2);
    const [coplanarLineSpacing, setCoplanarLineSpacing] = useState(5);

    // Update canvas size when window resizes
    const updateCanvasSize = useCallback(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            // Account for padding and leave space for the number toolbox
            const newWidth = Math.floor(rect.width - 160); // 140px for toolbox + padding
            const newHeight = Math.floor(rect.height - 16);
            setCanvasSize({ width: newWidth, height: newHeight });
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
            setHistoryIndex((prev) => prev + 1);
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
            y: (clientY - rect.top) * scaleY,
        };
    }, []);

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
        } else if (SHAPE_TOOLS.includes(tool) || tool.startsWith('number')) {
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
                    shapeSize,
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
                drawNumber(ctx, cursorPos.x, cursorPos.y, shapeSize, number, color);
                ctx.globalAlpha = 1;
                ctx.setLineDash([]);
                return;
            }

            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        }
    }, [tool, color, lineWidth, shapeSize, arrowRotation, cursorPos, showCursorPreview]);

    const handleMouseMove = useCallback(
        (e) => {
            const pos = getCanvasPosition(e);
            setCursorPos(pos);

            if (isDrawing) {
                draw(e);
            }
        },
        // draw is defined below and only runs while actively dragging (isDrawing); the
        // tool/colour cannot change mid-drag, so its identity is intentionally omitted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getCanvasPosition, isDrawing],
    );

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

    const startDrawing = useCallback(
        (e) => {
            e.preventDefault();
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const pos = getCanvasPosition(e);

            // Handle fixed-size shapes and numbers on a single click
            if (SHAPE_TOOLS.includes(tool) || tool.startsWith('number')) {
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
                    drawNumber(ctx, pos.x, pos.y, shapeSize, number, color);
                }

                saveToHistory();
                setIsDrawing(false);
                return;
            }

            setIsDrawing(true);
            setStartPos(pos);

            if (tool === 'fill') {
                floodFill(canvas, Math.floor(pos.x), Math.floor(pos.y), color);
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
        },
        [tool, color, lineWidth, shapeSize, arrowRotation, getCanvasPosition, saveToHistory],
    );

    const draw = useCallback(
        (e) => {
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
                    drawShape(ctx, startPos, pos, true, {
                        tool,
                        color,
                        lineWidth,
                        coplanarLineCount,
                        coplanarLineSpacing,
                    });
                };
                img.src = previewCanvas;
            }
        },
        [
            isDrawing,
            tool,
            color,
            lineWidth,
            coplanarLineCount,
            coplanarLineSpacing,
            startPos,
            previewCanvas,
            getCanvasPosition,
        ],
    );

    const stopDrawing = useCallback(
        (e) => {
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
                    drawShape(ctx, startPos, pos, false, {
                        tool,
                        color,
                        lineWidth,
                        coplanarLineCount,
                        coplanarLineSpacing,
                    });
                    saveToHistory();
                };
                img.src = previewCanvas;
            } else if (tool === 'pen' || tool === 'eraser') {
                saveToHistory();
            }

            setPreviewCanvas(null);
        },
        [
            isDrawing,
            tool,
            color,
            lineWidth,
            coplanarLineCount,
            coplanarLineSpacing,
            startPos,
            previewCanvas,
            getCanvasPosition,
            saveToHistory,
        ],
    );

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
        // Canvas (re)initialisation on resize only. saveToHistory changes on every stroke
        // and re-running this would clear the canvas and wipe in-progress drawing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const preventDefault = (e) => e.preventDefault();
        canvas.addEventListener('touchstart', preventDefault, { passive: false });
        canvas.addEventListener('touchmove', preventDefault, { passive: false });
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

    const getCursor = useCallback(() => {
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
    }, [tool]);

    return {
        canvasRef,
        previewCanvasRef,
        containerRef,
        tool,
        setTool,
        color,
        setColor,
        lineWidth,
        setLineWidth,
        shapeSize,
        setShapeSize,
        arrowRotation,
        setArrowRotation,
        coplanarLineCount,
        setCoplanarLineCount,
        coplanarLineSpacing,
        setCoplanarLineSpacing,
        history,
        historyIndex,
        canvasSize,
        undo,
        redo,
        clearCanvas,
        getCursor,
    };
}
