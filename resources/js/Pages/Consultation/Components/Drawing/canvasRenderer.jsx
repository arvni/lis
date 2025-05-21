// canvasRenderer.js
// Functions to handle canvas rendering
import { ElementTypes, GRID_SIZE } from './constants';

// Main rendering function
export const renderCanvas = (ctx, state) => {
    // Clear canvas
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Draw background (white by default)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Draw grid if enabled
    if (state.showGrid) {
        drawGrid(ctx, state.canvasWidth, state.canvasHeight, GRID_SIZE);
    }

    // Draw all elements
    drawElements(ctx, state.elementsOnCanvas, state.selectedElementIds, state.penSize, state.fillColor);

    // Draw temporary editing UI elements (current drawing, selection UI)
    drawEditingUI(ctx, state);

    // Reset canvas state
    resetCanvasState(ctx);
};

// Draw grid lines
const drawGrid = (ctx, width, height, gridSize) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // Horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(y, width);
    }

    ctx.stroke();
};

// Draw all elements on the canvas
const drawElements = (ctx, elements, selectedElementIds, defaultPenSize, defaultFillColor) => {
    // Draw standard elements first
    elements.forEach(el => {
        if (el.item.shape === ElementTypes.FILL_PLACEHOLDER) {
            drawFillPlaceholder(ctx, el);
        } else if (el.item.shape !== ElementTypes.ERASE_PATH) {
            drawElement(ctx, el, selectedElementIds, defaultPenSize, defaultFillColor);
        }
    });

    // Apply eraser paths last
    applyEraserPaths(ctx, elements, defaultPenSize);
};

// Draw a single element
const drawElement = (ctx, element, selectedElementIds, defaultPenSize, defaultFillColor) => {
    ctx.beginPath();
    const isSelected = selectedElementIds.includes(element.id);
    ctx.strokeStyle = isSelected ? 'magenta' : (element.color || '#000');
    ctx.lineWidth = isSelected ? (element.lineWidth || defaultPenSize) + 2 : (element.lineWidth || defaultPenSize);
    ctx.setLineDash(element.lineStyle === 'dashed' ? [5, 5] : []);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.item.shape) {
        case ElementTypes.LINE:
            drawFreehandLine(ctx, element.item.points);
            break;

        case ElementTypes.STRAIGHT_LINE:
            drawStraightLine(ctx, element.item.start, element.item.end);
            break;

        case ElementTypes.SQUARE:
            drawSquare(ctx, element.item.x, element.item.y, element.item.width, element.item.height, element.fillColor);
            break;

        case ElementTypes.CIRCLE:
            drawCircle(ctx, element.item.cx, element.item.cy, element.item.radius, element.fillColor);
            break;

        case ElementTypes.TEXT:
            drawText(ctx, element, isSelected);
            break;
    }
};

// Draw a freehand line
const drawFreehandLine = (ctx, points) => {
    if (!points || points.length < 2) return;

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
};

// Draw a straight line
const drawStraightLine = (ctx, start, end) => {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
};

// Draw a square/rectangle
const drawSquare = (ctx, x, y, width, height, fillColor) => {
    // Fill if there's a fill color
    if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
    }
    ctx.strokeRect(x, y, width, height);
};

// Draw a circle
const drawCircle = (ctx, cx, cy, radius, fillColor) => {
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);

    // Fill if there's a fill color
    if (fillColor && fillColor !== 'transparent') {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
};

// Draw text
const drawText = (ctx, element, isSelected) => {
    ctx.font = `${element.item.fontSize}px ${element.item.fontFamily || 'Arial'}`;
    ctx.fillStyle = element.color || '#000';
    ctx.fillText(element.item.text, element.item.x, element.item.y + element.item.fontSize); // Add fontSize to y for proper baseline

    // Draw selection box if selected
    if (isSelected) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            element.item.x - 5,
            element.item.y - 2,
            element.item.width + 10,
            element.item.height + 4
        );
    }
};

// Draw fill placeholder (for fill tool)
const drawFillPlaceholder = (ctx, element) => {
    ctx.beginPath();
    ctx.fillStyle = element.color || '#000';
    ctx.arc(element.item.x, element.item.y, element.item.radius, 0, 2 * Math.PI);
    ctx.fill();
};

// Apply eraser paths
const applyEraserPaths = (ctx, elements, defaultPenSize) => {
    const originalCompositeOp = ctx.globalCompositeOperation;

    elements.forEach(el => {
        if (el.item.shape === ElementTypes.ERASE_PATH) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.lineWidth = el.lineWidth || defaultPenSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (!el.item.points || el.item.points.length < 2) return;

            ctx.moveTo(el.item.points[0].x, el.item.points[0].y);
            for (let i = 1; i < el.item.points.length; i++) {
                ctx.lineTo(el.item.points[i].x, el.item.points[i].y);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = originalCompositeOp;
        }
    });

    if (ctx.globalCompositeOperation !== originalCompositeOp) {
        ctx.globalCompositeOperation = originalCompositeOp;
    }
};

// Draw UI elements for current editing state
const drawEditingUI = (ctx, state) => {
    // Draw current drawing preview
    if (state.isDrawing && state.currentLinePoints.length > 0) {
        drawDrawingPreview(ctx, state);
    }

    // Draw selection UI elements
    drawSelectionUI(ctx, state);
};

// Draw preview for current drawing operation
const drawDrawingPreview = (ctx, state) => {
    ctx.beginPath();
    ctx.lineWidth = state.penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);

    if (state.currentTool === 'draw') {
        ctx.strokeStyle = state.penColor;

        if (state.currentLinePoints.length > 1) {
            ctx.moveTo(state.currentLinePoints[0].x, state.currentLinePoints[0].y);
            for (let i = 1; i < state.currentLinePoints.length; i++) {
                ctx.lineTo(state.currentLinePoints[i].x, state.currentLinePoints[i].y);
            }
            ctx.stroke();
        } else if (state.currentLinePoints.length === 1) {
            // Draw a dot for single click
            ctx.fillStyle = state.penColor;
            ctx.arc(
                state.currentLinePoints[0].x,
                state.currentLinePoints[0].y,
                state.penSize / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    else if (state.currentTool === 'straight-line') {
        ctx.strokeStyle = state.penColor;

        if (state.currentLinePoints.length === 2) {
            ctx.moveTo(state.currentLinePoints[0].x, state.currentLinePoints[0].y);
            ctx.lineTo(state.currentLinePoints[1].x, state.currentLinePoints[1].y);
            ctx.stroke();
        } else if (state.currentLinePoints.length === 1) {
            // Draw a dot for first click
            ctx.fillStyle = state.penColor;
            ctx.arc(
                state.currentLinePoints[0].x,
                state.currentLinePoints[0].y,
                state.penSize / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    else if (state.currentTool === 'eraser') {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'; // Semi-transparent gray for eraser head
        const lastPoint = state.currentLinePoints[state.currentLinePoints.length - 1];

        if (lastPoint) {
            ctx.arc(lastPoint.x, lastPoint.y, state.penSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Optionally draw the path being erased for preview
        if (state.currentLinePoints.length > 1) {
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.moveTo(state.currentLinePoints[0].x, state.currentLinePoints[0].y);
            for (let i = 1; i < state.currentLinePoints.length; i++) {
                ctx.lineTo(state.currentLinePoints[i].x, state.currentLinePoints[i].y);
            }
            ctx.stroke();
        }
    }
};

// Draw selection UI elements
const drawSelectionUI = (ctx, state) => {
    // Draw selection helper lines
    const drawHelperLine = (lineProps) => {
        if (lineProps && lineProps.points && lineProps.points.length === 2) {
            ctx.beginPath();
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 1;
            ctx.setLineDash(lineProps.type === 'dashed' ? [3,3] : []);
            ctx.moveTo(lineProps.points[0].x, lineProps.points[0].y);
            ctx.lineTo(lineProps.points[1].x, lineProps.points[1].y);
            ctx.stroke();
        }
    };

    if (state.selectionLine1Props) drawHelperLine(state.selectionLine1Props);
    if (state.selectionLine2Props) drawHelperLine(state.selectionLine2Props);

    // Draw temporary selection points
    if (state.currentTool === 'select' && state.tempSelectionPoints.length > 0) {
        ctx.fillStyle = 'green';
        state.tempSelectionPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
};

// Reset canvas state after drawing
const resetCanvasState = (ctx) => {
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
};
