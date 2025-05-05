/**
 * Constants and styling objects for pedigree chart
 * These define the appearance and behavior of nodes and markers
 */

// Base size constants
export const nodeSize = { width: 50, height: 50 };
export const siblingSpacing = 40; // Horizontal space between siblings

// -- Node base styling --
export const nodeBaseSx = {
    border: '2px solid black',
    padding: 1,
    boxShadow: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: nodeSize.width,
    height: nodeSize.height,
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'box-shadow 0.2s ease, background-color 0.2s ease',  // Only these properties will transition
    '&.dragging': {
        transition: 'none !important', // Disable transitions while dragging
    }
};

// -- Marker styling --
// Base marker style
export const markerBaseSx = { position: 'absolute', zIndex: 1 };

// Affected status marker (fills the node)
export const affectedMarkerSx = (bgColor) => ({
    ...markerBaseSx,
    inset: 0,             // Fill the entire node
    bgcolor: bgColor,     // Color based on node type
    opacity: 0.8,         // Semi-transparent
});

// Carrier status marker (center dot)
export const carrierMarkerSx = {
    ...markerBaseSx,
    width: 8,
    height: 8,
    bgcolor: 'black',
    borderRadius: '50%',   // Circle
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', // Center precisely
};

// Deceased status marker (diagonal line)
export const deceasedMarkerSx = {
    ...markerBaseSx,
    width: '100%',
    height: '2px',
    bgcolor: 'black',
    top: '50%',
    left: 0,
    transform: 'rotate(45deg)',
    transformOrigin: 'center center',
};

// Proband status marker (arrow)
export const probandMarkerSx = {
    ...markerBaseSx,
    left: '-50%',
    top: '100%',
    fontSize: '1.25rem',
    rotate: '-45deg',
    lineHeight: 1,
};

// Label style
export const labelSx = {
    position: 'absolute',
    bottom: -24,           // Position below node
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    width: '100%',
    left: 0,
    zIndex: 1,
};

// Handle style for connections
export const handleStyle = {
    width: 8,
    height: 8,
    background: '#555',
    opacity: 0.7,          // Slightly transparent
    border: '1px solid #fff',
    transition: 'opacity 0.2s, transform 0.2s',
    '&:hover': {           // This won't work with inline style, but shows intent
        opacity: 1,
        transform: 'scale(1.2)'
    }
};

// -- Node Type-Specific Styles --

// Male node (square)
export const getMaleNodeStyle = (selected) => ({
    ...nodeBaseSx,
    bgcolor: 'lightblue',
    borderRadius: 0,
    borderColor: selected ? 'blue' : 'black',
    borderWidth: selected ? '2.5px' : '2px',
    ...(selected && { boxShadow: '0 0 0 2px rgba(0,0,255,0.3), 0 4px 8px rgba(0,0,0,0.3)' }),
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: 4,
    },
});

// Female node (circle)
export const getFemaleNodeStyle = (selected) => ({
    ...nodeBaseSx,
    bgcolor: 'lightpink',
    borderRadius: '50%',
    borderColor: selected ? 'deeppink' : 'black',
    borderWidth: selected ? '2.5px' : '2px',
    ...(selected && { boxShadow: '0 0 0 2px rgba(255,20,147,0.3), 0 4px 8px rgba(0,0,0,0.3)' }),
    '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: 4,
    },
});

// Unknown gender node (diamond)
export const getUnknownNodeStyle = (selected) => ({
    ...nodeBaseSx,
    bgcolor: 'lightgrey',
    width: nodeSize.width * 0.8,
    height: nodeSize.height * 0.8,
    transform: 'rotate(45deg)',
    borderColor: selected ? 'dimgray' : 'black',
    borderWidth: selected ? '2.5px' : '2px',
    ...(selected && { boxShadow: '0 0 0 2px rgba(105,105,105,0.3), 0 4px 8px rgba(0,0,0,0.3)' }),
    '&:hover': {
        transform: 'rotate(45deg) scale(1.05)',
        boxShadow: 4,
    },
    // Class for rotating content back
    '.marker-content': {
        transform: 'rotate(-45deg)',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
});

// Adjustments for unknown node markers
export const getUnknownAffectedStyle = (selected) => ({
    ...affectedMarkerSx('dimgray'),
    transform: 'rotate(45deg) scale(1.25)',
    borderRadius: 0
});

export const getUnknownDeceasedStyle = (selected) => ({
    ...deceasedMarkerSx,
    transform: 'rotate(45deg) scale(0.75)',
    transformOrigin: 'center center'
});

export const getUnknownProbandStyle = (selected) => ({
    ...probandMarkerSx,
    transformOrigin: 'center left',
    left: -20
});
