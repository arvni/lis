// initialState.js
// Initial state for the reducer
import {
    DEFAULT_CANVAS_WIDTH,
    DEFAULT_CANVAS_HEIGHT,
    DEFAULT_PEN_SIZE,
    DEFAULT_PEN_COLOR,
    DEFAULT_FILL_COLOR,
    DEFAULT_TEXT_SIZE
} from './constants';

const initialState = {
    // Canvas elements
    elementsOnCanvas: [],
    canvasWidth: DEFAULT_CANVAS_WIDTH,
    canvasHeight: DEFAULT_CANVAS_HEIGHT,

    // Undo/Redo state
    undoOperations: [],
    redoOperations: [],

    // Current tool state
    currentTool: 'draw',
    isDrawing: false,
    isDragging: false,
    currentLinePoints: [],

    // Dragging state
    dragStartPosition: null,
    elementBeingDragged: null,

    // Tool settings
    penSize: DEFAULT_PEN_SIZE,
    penColor: DEFAULT_PEN_COLOR,
    fillColor: DEFAULT_FILL_COLOR,
    textSize: DEFAULT_TEXT_SIZE,

    // Grid settings
    showGrid: false,
    snapToGrid: false,

    // Selection state
    selectionStep: 0,
    tempSelectionPoints: [],
    selectionLine1Props: null,
    selectionLine2Props: null,
    selectedElementIds: [],

    // Dialog states
    lineTypeDialogOpen: false,
    currentSelectingLineRef: null,
    textInputDialogOpen: false,
    currentTextInput: '',
    textPositionOnCanvas: null,

    // Notification state
    notificationOpen: false,
    notificationMessage: '',
    notificationSeverity: 'info'
};

export default initialState;
