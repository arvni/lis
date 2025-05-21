// constants.js
// All application constants in one place

// Canvas default settings
export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 600;

// Drawing element sizes
export const SQUARE_SIZE = 100;
export const CIRCLE_RADIUS = 50;
export const RESIZE_INCREMENT = 200;

// Math constants
export const EPSILON = 0.00001;

// Drawing defaults
export const DEFAULT_PEN_SIZE = 3;
export const DEFAULT_PEN_COLOR = '#000000';
export const DEFAULT_FILL_COLOR = 'transparent';
export const DEFAULT_TEXT_SIZE = 16;

// Grid settings
export const GRID_SIZE = 20;

// Element types for clarity
export const ElementTypes = {
    LINE: 'line',
    STRAIGHT_LINE: 'straight-line',
    SQUARE: 'square',
    CIRCLE: 'circle',
    ERASE_PATH: 'erase-path',
    FILL_PLACEHOLDER: 'fill-placeholder',
    TEXT: 'text'
};

// Action types for reducer
export const ActionTypes = {
    SET_TOOL: 'SET_TOOL',
    SET_PEN_SIZE: 'SET_PEN_SIZE',
    SET_PEN_COLOR: 'SET_PEN_COLOR',
    SET_FILL_COLOR: 'SET_FILL_COLOR',
    TOGGLE_GRID: 'TOGGLE_GRID',
    TOGGLE_SNAP_TO_GRID: 'TOGGLE_SNAP_TO_GRID',
    START_DRAWING: 'START_DRAWING',
    DRAWING: 'DRAWING',
    END_DRAWING: 'END_DRAWING',
    CANCEL_DRAWING_STATE: 'CANCEL_DRAWING_STATE',
    ADD_SHAPE: 'ADD_SHAPE',
    START_DRAG: 'START_DRAG',
    DRAG: 'DRAG',
    END_DRAG: 'END_DRAG',
    ADD_TEXT: 'ADD_TEXT',
    OPEN_TEXT_DIALOG: 'OPEN_TEXT_DIALOG',
    CLOSE_TEXT_DIALOG: 'CLOSE_TEXT_DIALOG',
    UPDATE_TEXT_INPUT: 'UPDATE_TEXT_INPUT',
    PERFORM_FILL: 'PERFORM_FILL',
    RESIZE_CANVAS: 'RESIZE_CANVAS',
    DELETE_SELECTED: 'DELETE_SELECTED',
    UNDO: 'UNDO',
    REDO: 'REDO',
    SELECT_CLICK: 'SELECT_CLICK',
    SET_LINE_TYPE_FROM_DIALOG: 'SET_LINE_TYPE_FROM_DIALOG',
    CLOSE_LINE_TYPE_DIALOG: 'CLOSE_LINE_TYPE_DIALOG',
    CLOSE_NOTIFICATION: 'CLOSE_NOTIFICATION',
    SET_TEXT_SIZE: 'SET_TEXT_SIZE'
};
