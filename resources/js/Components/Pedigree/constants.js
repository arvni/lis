// --- Custom Node Constants & Styles ---
export const nodeSize = { width: 50, height: 50 };
export const siblingSpacing = 40; // Horizontal space between siblings

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
    transition: 'all 0.2s ease',
};

export const markerBaseSx = { position: 'absolute', zIndex: 1 };

export const affectedMarkerSx = (bgColor) => ({
    ...markerBaseSx,
    inset: 0,
    bgcolor: bgColor,
    opacity: 0.8,
});

export const carrierMarkerSx = {
    ...markerBaseSx,
    width: 8,
    height: 8,
    bgcolor: 'black',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
};

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

export const probandMarkerSx = {
    ...markerBaseSx,
    left: '-50%',
    top: '100%',
    fontSize: '1.25rem',
    rotate: '-45deg',
    lineHeight: 1,
};

export const labelSx = {
    position: 'absolute',
    bottom: -24,
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    width: '100%',
    left: 0,
    zIndex: 1,
};

export const handleStyle = { width: 8, height: 8, background: '#555' };
