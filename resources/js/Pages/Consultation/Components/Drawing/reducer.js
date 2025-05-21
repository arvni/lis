// reducer.js
// State management for the drawing application
import {
    ActionTypes,
    ElementTypes,
    SQUARE_SIZE,
    CIRCLE_RADIUS,
    RESIZE_INCREMENT,
    GRID_SIZE
} from './constants';

import {
    pointIsInElement,
    getLineEquation,
    areLinesParallel,
    isElementBetweenParallelLines,
    calculateTextDimensions,
    snapToGrid
} from './utils';

function paintReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_TOOL:
            return {
                ...state,
                currentTool: action.payload,
                isDrawing: false,
                isDragging: false,
                currentLinePoints: [],
                selectionStep: 0,
                tempSelectionPoints: []
            };

        case ActionTypes.SET_PEN_SIZE:
            return { ...state, penSize: action.payload };

        case ActionTypes.SET_PEN_COLOR:
            return { ...state, penColor: action.payload };

        case ActionTypes.SET_FILL_COLOR:
            return { ...state, fillColor: action.payload };

        case ActionTypes.TOGGLE_GRID:
            return { ...state, showGrid: !state.showGrid };

        case ActionTypes.TOGGLE_SNAP_TO_GRID:
            return { ...state, snapToGrid: !state.snapToGrid };

        case ActionTypes.START_DRAWING: {
            if (state.currentTool === 'draw' || state.currentTool === 'eraser') {
                return {
                    ...state,
                    isDrawing: true,
                    currentLinePoints: [action.payload]
                };
            } else if (state.currentTool === 'straight-line') {
                return {
                    ...state,
                    isDrawing: true,
                    currentLinePoints: [action.payload]
                };
            }
            return state;
        }

        case ActionTypes.DRAWING: {
            if (state.isDrawing && (state.currentTool === 'draw' || state.currentTool === 'eraser')) {
                let point = action.payload;
                if (state.snapToGrid) {
                    point = snapToGrid(point, GRID_SIZE);
                }
                return {
                    ...state,
                    currentLinePoints: [...state.currentLinePoints, point]
                };
            } else if (state.isDrawing && state.currentTool === 'straight-line') {
                // For straight line, we only need start and current point
                let point = action.payload;
                if (state.snapToGrid) {
                    point = snapToGrid(point, GRID_SIZE);
                }
                // Keep the first point and update the second point
                return {
                    ...state,
                    currentLinePoints: [state.currentLinePoints[0], point]
                };
            }
            return state;
        }

        case ActionTypes.END_DRAWING: {
            let newElement;

            // Create appropriate element based on tool
            if (state.currentTool === 'draw') {
                if (state.currentLinePoints.length <= 1) {
                    return { ...state, isDrawing: false, currentLinePoints: [] };
                }
                newElement = {
                    id: Date.now(),
                    item: {
                        shape: ElementTypes.LINE,
                        points: [...state.currentLinePoints]
                    },
                    lineStyle: 'solid',
                    color: state.penColor,
                    lineWidth: state.penSize
                };
            }

            else if (state.currentTool === 'eraser') {
                if (state.currentLinePoints.length <= 1) {
                    return { ...state, isDrawing: false, currentLinePoints: [] };
                }
                newElement = {
                    id: Date.now(),
                    item: {
                        shape: ElementTypes.ERASE_PATH,
                        points: [...state.currentLinePoints]
                    },
                    lineWidth: state.penSize
                };
            }

            else if (state.currentTool === 'straight-line') {
                if (state.currentLinePoints.length !== 2) {
                    return { ...state, isDrawing: false, currentLinePoints: [] };
                }
                newElement = {
                    id: Date.now(),
                    item: {
                        shape: ElementTypes.STRAIGHT_LINE,
                        start: state.currentLinePoints[0],
                        end: state.currentLinePoints[1]
                    },
                    lineStyle: 'solid',
                    color: state.penColor,
                    lineWidth: state.penSize
                };
            }

            if (newElement) {
                return {
                    ...state,
                    isDrawing: false,
                    currentLinePoints: [],
                    elementsOnCanvas: [...state.elementsOnCanvas, newElement],
                    undoOperations: [...state.undoOperations, {
                        op: 'ADD',
                        elementId: newElement.id,
                        elementData: newElement
                    }],
                    redoOperations: [],
                };
            }

            return { ...state, isDrawing: false, currentLinePoints: [] };
        }

        case ActionTypes.CANCEL_DRAWING_STATE:
            return {
                ...state,
                isDrawing: false,
                currentLinePoints: [],
            };

        case ActionTypes.ADD_SHAPE: {
            const { x, y, shapeType } = action.payload;
            let newShape;

            if (shapeType === 'square') {
                newShape = {
                    id: Date.now(),
                    item: {
                        shape: ElementTypes.SQUARE,
                        x,
                        y,
                        width: SQUARE_SIZE,
                        height: SQUARE_SIZE
                    },
                    lineStyle: 'solid',
                    color: state.penColor,
                    fillColor: state.fillColor,
                    lineWidth: state.penSize
                };
            }

            else if (shapeType === 'circle') {
                newShape = {
                    id: Date.now(),
                    item: {
                        shape: ElementTypes.CIRCLE,
                        cx: x,
                        cy: y,
                        radius: CIRCLE_RADIUS
                    },
                    lineStyle: 'solid',
                    color: state.penColor,
                    fillColor: state.fillColor,
                    lineWidth: state.penSize
                };
            }

            if (newShape) {
                return {
                    ...state,
                    elementsOnCanvas: [...state.elementsOnCanvas, newShape],
                    undoOperations: [...state.undoOperations, {
                        op: 'ADD',
                        elementId: newShape.id,
                        elementData: newShape
                    }],
                    redoOperations: [],
                };
            }

            return state;
        }

        case ActionTypes.START_DRAG: {
            const { elementId, startPosition } = action.payload;
            return {
                ...state,
                isDragging: true,
                dragStartPosition: startPosition,
                elementBeingDragged: elementId
            };
        }

        case ActionTypes.DRAG: {
            if (!state.isDragging || !state.elementBeingDragged) return state;

            const { currentPosition } = action.payload;
            const dx = currentPosition.x - state.dragStartPosition.x;
            const dy = currentPosition.y - state.dragStartPosition.y;

            let updatedElements = [...state.elementsOnCanvas];
            const elementIndex = updatedElements.findIndex(el => el.id === state.elementBeingDragged);

            if (elementIndex === -1) return state;

            const element = { ...updatedElements[elementIndex] };
            const shape = element.item.shape;

            // Apply grid snapping if enabled
            let newElement = { ...element };

            if (shape === ElementTypes.SQUARE) {
                let newX = element.item.x + dx;
                let newY = element.item.y + dy;

                if (state.snapToGrid) {
                    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                }

                newElement.item = {
                    ...element.item,
                    x: newX,
                    y: newY
                };
            }

            else if (shape === ElementTypes.CIRCLE) {
                let newCx = element.item.cx + dx;
                let newCy = element.item.cy + dy;

                if (state.snapToGrid) {
                    newCx = Math.round(newCx / GRID_SIZE) * GRID_SIZE;
                    newCy = Math.round(newCy / GRID_SIZE) * GRID_SIZE;
                }

                newElement.item = {
                    ...element.item,
                    cx: newCx,
                    cy: newCy
                };
            }

            else if (shape === ElementTypes.STRAIGHT_LINE) {
                let newStart = {
                    x: element.item.start.x + dx,
                    y: element.item.start.y + dy
                };

                let newEnd = {
                    x: element.item.end.x + dx,
                    y: element.item.end.y + dy
                };

                if (state.snapToGrid) {
                    newStart = snapToGrid(newStart, GRID_SIZE);
                    newEnd = snapToGrid(newEnd, GRID_SIZE);
                }

                newElement.item = {
                    ...element.item,
                    start: newStart,
                    end: newEnd
                };
            }

            else if (shape === ElementTypes.TEXT) {
                let newX = element.item.x + dx;
                let newY = element.item.y + dy;

                if (state.snapToGrid) {
                    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                }

                newElement.item = {
                    ...element.item,
                    x: newX,
                    y: newY
                };
            }

            updatedElements[elementIndex] = newElement;

            return {
                ...state,
                elementsOnCanvas: updatedElements,
                dragStartPosition: currentPosition
            };
        }

        case ActionTypes.END_DRAG: {
            if (!state.isDragging || !state.elementBeingDragged) {
                return {
                    ...state,
                    isDragging: false,
                    dragStartPosition: null,
                    elementBeingDragged: null
                };
            }

            return {
                ...state,
                isDragging: false,
                dragStartPosition: null,
                elementBeingDragged: null,
                undoOperations: [
                    ...state.undoOperations,
                    { op: 'MOVE', elementId: state.elementBeingDragged }
                ],
                redoOperations: []
            };
        }

        case ActionTypes.ADD_TEXT: {
            const { text, x, y } = action.payload;
            if (!text.trim()) return state;

            const dimensions = calculateTextDimensions(text, state.textSize);
            const newText = {
                id: Date.now(),
                item: {
                    shape: ElementTypes.TEXT,
                    x,
                    y,
                    text,
                    fontSize: state.textSize,
                    fontFamily: 'Arial',
                    width: dimensions.width,
                    height: dimensions.height
                },
                color: state.penColor
            };

            return {
                ...state,
                elementsOnCanvas: [...state.elementsOnCanvas, newText],
                undoOperations: [...state.undoOperations, {
                    op: 'ADD',
                    elementId: newText.id,
                    elementData: newText
                }],
                redoOperations: [],
                textInputDialogOpen: false,
                currentTextInput: ''
            };
        }

        case ActionTypes.OPEN_TEXT_DIALOG:
            return {
                ...state,
                textInputDialogOpen: true,
                currentTextInput: '',
                textPositionOnCanvas: action.payload
            };

        case ActionTypes.CLOSE_TEXT_DIALOG:
            return {
                ...state,
                textInputDialogOpen: false,
                currentTextInput: '',
                textPositionOnCanvas: null
            };

        case ActionTypes.UPDATE_TEXT_INPUT:
            return { ...state, currentTextInput: action.payload };

        case ActionTypes.PERFORM_FILL: {
            const { x, y } = action.payload;
            // For a more complete app, implement flood fill algorithm
            // For now, just place a fill marker
            const fillPlaceholderElement = {
                id: Date.now(),
                item: {
                    shape: ElementTypes.FILL_PLACEHOLDER,
                    x,
                    y,
                    radius: state.penSize < 5 ? 10 : state.penSize * 2,
                },
                color: state.fillColor || state.penColor
            };

            return {
                ...state,
                elementsOnCanvas: [...state.elementsOnCanvas, fillPlaceholderElement],
                undoOperations: [...state.undoOperations, {
                    op: 'ADD',
                    elementId: fillPlaceholderElement.id,
                    elementData: fillPlaceholderElement
                }],
                redoOperations: [],
                notificationOpen: true,
                notificationMessage: 'Fill tool clicked. A full implementation would flood fill from this point.',
                notificationSeverity: 'info'
            };
        }

        case ActionTypes.RESIZE_CANVAS: {
            const oldW = state.canvasWidth;
            const oldH = state.canvasHeight;
            const newW = state.canvasWidth + RESIZE_INCREMENT;
            const newH = state.canvasHeight + RESIZE_INCREMENT;

            return {
                ...state,
                canvasWidth: newW,
                canvasHeight: newH,
                undoOperations: [...state.undoOperations, {
                    op: 'RESIZE',
                    oldW,
                    oldH,
                    newW,
                    newH
                }],
                redoOperations: [],
            };
        }

        case ActionTypes.DELETE_SELECTED: {
            if (state.selectedElementIds.length === 0) return state;

            const elementsToDelete = state.elementsOnCanvas.filter(el =>
                state.selectedElementIds.includes(el.id)
            );

            return {
                ...state,
                elementsOnCanvas: state.elementsOnCanvas.filter(el =>
                    !state.selectedElementIds.includes(el.id)
                ),
                undoOperations: [
                    ...state.undoOperations,
                    { op: 'DELETE', elements: elementsToDelete }
                ],
                redoOperations: [],
                selectedElementIds: []
            };
        }

        case ActionTypes.UNDO: {
            if (state.undoOperations.length === 0) return state;

            const lastOp = state.undoOperations[state.undoOperations.length - 1];
            const newUndoOperations = state.undoOperations.slice(0, -1);
            let newElements = [...state.elementsOnCanvas];
            let newCanvasWidth = state.canvasWidth;
            let newCanvasHeight = state.canvasHeight;

            if (lastOp.op === 'ADD') {
                newElements = newElements.filter(el => el.id !== lastOp.elementId);
            }
            else if (lastOp.op === 'RESIZE') {
                newCanvasWidth = lastOp.oldW;
                newCanvasHeight = lastOp.oldH;
            }
            else if (lastOp.op === 'DELETE') {
                newElements = [...newElements, ...lastOp.elements];
            }

            return {
                ...state,
                elementsOnCanvas: newElements,
                canvasWidth: newCanvasWidth,
                canvasHeight: newCanvasHeight,
                undoOperations: newUndoOperations,
                redoOperations: [lastOp, ...state.redoOperations],
            };
        }

        case ActionTypes.REDO: {
            if (state.redoOperations.length === 0) return state;

            const opToRedo = state.redoOperations[0];
            const newRedoOperations = state.redoOperations.slice(1);
            let newElements = [...state.elementsOnCanvas];
            let newCanvasWidth = state.canvasWidth;
            let newCanvasHeight = state.canvasHeight;

            if (opToRedo.op === 'ADD') {
                if (opToRedo.elementData) {
                    newElements = [...newElements, opToRedo.elementData];
                }
            }
            else if (opToRedo.op === 'RESIZE') {
                newCanvasWidth = opToRedo.newW;
                newCanvasHeight = opToRedo.newH;
            }
            else if (opToRedo.op === 'DELETE') {
                newElements = newElements.filter(el =>
                    !opToRedo.elements.some(deletedEl => deletedEl.id === el.id)
                );
            }

            return {
                ...state,
                elementsOnCanvas: newElements,
                canvasWidth: newCanvasWidth,
                canvasHeight: newCanvasHeight,
                undoOperations: [...state.undoOperations, opToRedo],
                redoOperations: newRedoOperations,
            };
        }

        case ActionTypes.SELECT_CLICK: {
            const { x, y } = action.payload;

            // Check if we're clicking on an element for direct element selection
            if (state.currentTool === 'select' && state.selectionStep === 0) {
                // Check from top to bottom (last drawn first)
                for (let i = state.elementsOnCanvas.length - 1; i >= 0; i--) {
                    const el = state.elementsOnCanvas[i];

                    // Skip non-selectable elements
                    if (el.item.shape === ElementTypes.ERASE_PATH ||
                        el.item.shape === ElementTypes.FILL_PLACEHOLDER) {
                        continue;
                    }

                    if (pointIsInElement({ x, y }, el)) {
                        // If element is already selected, start dragging
                        if (state.selectedElementIds.includes(el.id)) {
                            return {
                                ...state,
                                isDragging: true,
                                dragStartPosition: { x, y },
                                elementBeingDragged: el.id
                            };
                        } else {
                            // Otherwise select this element
                            return {
                                ...state,
                                selectedElementIds: [el.id]
                            };
                        }
                    }
                }

                // If didn't hit any element, start parallel line selection
                return {
                    ...state,
                    tempSelectionPoints: [{ x, y }],
                    selectionStep: 1,
                    selectionLine1Props: null,
                    selectionLine2Props: null,
                    selectedElementIds: []
                };
            }

            // Create first selection line
            else if (state.selectionStep === 1) {
                const p1 = state.tempSelectionPoints[0];
                const p2 = { x, y };
                const line1Eq = getLineEquation(p1, p2);

                if (line1Eq) {
                    return {
                        ...state,
                        tempSelectionPoints: [],
                        selectionStep: 2,
                        currentSelectingLineRef: 'line1',
                        lineTypeDialogOpen: true,
                        selectionLine1Props: {
                            points: [p1, p2],
                            equation: line1Eq,
                            type: 'solid'
                        }
                    };
                } else {
                    return {
                        ...state,
                        tempSelectionPoints: [],
                        selectionStep: 0
                    }
                }
            }

            // Start second line after choosing first line type
            else if (state.selectionStep === 3) {
                return {
                    ...state,
                    tempSelectionPoints: [{ x, y }],
                    selectionStep: 4
                };
            }

            // Complete second line
            else if (state.selectionStep === 4) {
                const p1 = state.tempSelectionPoints[0];
                const p2 = { x, y };
                const line2Eq = getLineEquation(p1, p2);

                if (line2Eq && state.selectionLine1Props &&
                    areLinesParallel(state.selectionLine1Props.equation, line2Eq)) {
                    return {
                        ...state,
                        tempSelectionPoints: [],
                        selectionStep: 5,
                        currentSelectingLineRef: 'line2',
                        lineTypeDialogOpen: true,
                        selectionLine2Props: {
                            points: [p1, p2],
                            equation: line2Eq,
                            type: 'solid'
                        }
                    };
                } else {
                    return {
                        ...state,
                        tempSelectionPoints: [],
                        selectionStep: 3,
                        selectionLine2Props: null,
                        selectedElementIds: []
                    };
                }
            }

            return state;
        }

        case ActionTypes.SET_LINE_TYPE_FROM_DIALOG: {
            const { lineRef, lineType } = action.payload;
            let nextState = {
                ...state,
                lineTypeDialogOpen: false,
                currentSelectingLineRef: null
            };

            if (lineRef === 'line1') {
                nextState.selectionLine1Props = {
                    ...state.selectionLine1Props,
                    type: lineType
                };
                nextState.selectionStep = 3;
            }
            else if (lineRef === 'line2') {
                nextState.selectionLine2Props = {
                    ...state.selectionLine2Props,
                    type: lineType
                };
                nextState.selectionStep = 0;

                // Find elements between the two parallel lines
                const ids = [];
                if (nextState.selectionLine1Props &&
                    nextState.selectionLine2Props &&
                    areLinesParallel(
                        nextState.selectionLine1Props.equation,
                        nextState.selectionLine2Props.equation
                    )) {
                    state.elementsOnCanvas.forEach(el => {
                        // Ensure element is selectable (not an erase path or fill placeholder)
                        if (el.item.shape !== ElementTypes.ERASE_PATH &&
                            el.item.shape !== ElementTypes.FILL_PLACEHOLDER &&
                            isElementBetweenParallelLines(
                                el,
                                nextState.selectionLine1Props.equation,
                                nextState.selectionLine1Props.type,
                                nextState.selectionLine2Props.equation,
                                nextState.selectionLine2Props.type
                            )) {
                            ids.push(el.id);
                        }
                    });
                }

                nextState.selectedElementIds = ids;
            }

            return nextState;
        }

        case ActionTypes.CLOSE_LINE_TYPE_DIALOG: {
            let resetState = {
                ...state,
                lineTypeDialogOpen: false
            };

            if (state.currentSelectingLineRef === 'line1') {
                resetState.selectionStep = 0;
                resetState.selectionLine1Props = null;
            } else if (state.currentSelectingLineRef === 'line2') {
                resetState.selectionStep = 3;
                resetState.selectionLine2Props = null;
            }

            resetState.currentSelectingLineRef = null;
            return resetState;
        }

        case ActionTypes.CLOSE_NOTIFICATION:
            return {
                ...state,
                notificationOpen: false,
                notificationMessage: ''
            };

        case ActionTypes.SET_TEXT_SIZE:
            return { ...state, textSize: action.payload };

        default:
            return state;
    }
}

export default paintReducer;
