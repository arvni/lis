import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './PaintApp/constants';
import PaintToolbar from './PaintApp/PaintToolbar';
import NumberToolbox from './PaintApp/NumberToolbox';
import usePaintCanvas from './PaintApp/usePaintCanvas';
import ErrorBoundary from '@/Components/ErrorBoundary';

/**
 * MUI-styled freehand/shape paint canvas.
 *
 * All canvas/drawing state lives in {@link usePaintCanvas}; this component is
 * thin presentation wiring the hook to the toolbar and canvas elements.
 */
const ReactPaintMUI = ({ defaultImage = null, onChange = () => {} }) => {
    const {
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
    } = usePaintCanvas({ defaultImage, onChange });

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    bgcolor: '#f5f5f5',
                }}
            >
                <PaintToolbar
                    tool={tool}
                    onSelectTool={setTool}
                    color={color}
                    onColorChange={setColor}
                    lineWidth={lineWidth}
                    onLineWidthChange={setLineWidth}
                    shapeSize={shapeSize}
                    onShapeSizeChange={setShapeSize}
                    arrowRotation={arrowRotation}
                    onArrowRotationChange={setArrowRotation}
                    coplanarLineCount={coplanarLineCount}
                    onCoplanarLineCountChange={setCoplanarLineCount}
                    coplanarLineSpacing={coplanarLineSpacing}
                    onCoplanarLineSpacingChange={setCoplanarLineSpacing}
                    onUndo={undo}
                    onRedo={redo}
                    onClear={clearCanvas}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                />

                {/* Main Content Area */}
                <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    <NumberToolbox tool={tool} onSelectTool={setTool} />

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
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
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
                                    display: 'block',
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
                                    touchAction: 'none',
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

const ReactPaintMUIWithBoundary = (props) => (
    <ErrorBoundary
        variant="widget"
        title="The drawing tool couldn't be displayed"
        description="An unexpected error occurred while rendering the canvas editor."
    >
        <ReactPaintMUI {...props} />
    </ErrorBoundary>
);

export default ReactPaintMUIWithBoundary;
