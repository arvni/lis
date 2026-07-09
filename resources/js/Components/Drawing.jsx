import PropTypes from 'prop-types';
import ReactFlow, { ReactFlowProvider, Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css'; // Base React Flow styles

// --- MUI Imports ---
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// --- Pedigree subcomponents ---
import PedigreeToolbar from './Pedigree/PedigreeToolbar';
import ElementEditor from './Pedigree/ElementEditor';
import EdgeSettingsModal from './Pedigree/EdgeSettingsModal';
import LegendModal from './Pedigree/LegendModal';
import HelpModal from './Pedigree/HelpModal';
import usePedigreeChart from './Pedigree/usePedigreeChart';
import ErrorBoundary from './ErrorBoundary';

/**
 * Pedigree (family tree) chart editor.
 *
 * All graph state and actions live in {@link usePedigreeChart}; this component
 * is thin presentation wiring the hook to React Flow and the toolbar/editor.
 */
const PedigreeChart = ({
    defaultValue = { nodes: [], edges: [] }, // Default empty chart
    onChange = () => {}, // No-op default onChange
    disabled = false, // Default to enabled
}) => {
    const {
        reactFlowWrapper,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        nodeTypes,
        edgeTypes,
        setReactFlowInstance,
        isLoading,
        showGrid,
        notification,
        handleCloseNotification,
        selectedNodes,
        singleSelectedNode,
        singleSelectedEdge,
        selectedEdges,
        viewportControls,
        isEdgeModalOpen,
        isLegendOpen,
        isHelpModalOpen,
        addNode,
        addChildBetweenParents,
        autoArrangeFamily,
        saveData,
        loadData,
        exportChart,
        handleZoomIn,
        handleZoomOut,
        handleFitView,
        toggleGridDisplay,
        openLegendModal,
        closeLegendModal,
        openHelpModal,
        closeHelpModal,
        updateNodeData,
        updateSelectedNodeType,
        toggleAffected,
        toggleCarrier,
        toggleDeceased,
        toggleProband,
        deleteSelectedElements,
        openEdgeModal,
        closeEdgeModal,
        updateEdgeStyleAndType,
    } = usePedigreeChart({ defaultValue, onChange, disabled });

    return (
        // Main container with loading overlay
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: '500px',
                position: 'relative',
                // overflow: 'hidden',
                border: disabled ? 'none' : '1px solid #e0e0e0',
                borderRadius: 1,
            }}
            ref={reactFlowWrapper}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 20,
                    }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Processing...
                        </Typography>
                    </Box>
                </Box>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setReactFlowInstance}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                deleteKeyCode={disabled ? null : ['Backspace', 'Delete']} // Disable keyboard delete when in disabled mode
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Shift"
                selectNodesOnDrag={!disabled} // Disable selection via drag when in disabled mode
                elementsSelectable={!disabled} // Disable element selection when in disabled mode
                nodesDraggable={!disabled} // Disable node dragging when in disabled mode
                nodesConnectable={!disabled} // Disable connecting nodes when in disabled mode
                panOnDrag={!disabled ? true : 3} // Allow panning with middle mouse even when disabled
                zoomOnScroll={true} // Always allow zooming
                zoomOnPinch={true}
                zoomOnDoubleClick={true}
                className="reactflow-pedigree-canvas"
                minZoom={0.1}
                maxZoom={4}
                proOptions={{ hideAttribution: true }}
                style={{ minHeight: '500px' }}
            >
                {/* Conditionally show background based on showGrid state */}
                {showGrid && <Background variant="dots" gap={16} size={1} color="#ddd" />}

                {/* Controls and MiniMap - always visible */}
                <Controls showInteractive={false} />
                <MiniMap
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    nodeColor={(node) => {
                        if (node.type === 'male') return 'lightblue';
                        if (node.type === 'female') return 'lightpink';
                        return 'lightgrey';
                    }}
                />

                {/* Custom Components */}
                <PedigreeToolbar
                    disabled={disabled}
                    selectedNodes={selectedNodes}
                    showGrid={showGrid}
                    zoomLevel={viewportControls.zoomLevel}
                    onAddNode={addNode}
                    onAddChild={addChildBetweenParents}
                    onAutoArrange={autoArrangeFamily}
                    onSave={saveData}
                    onLoad={loadData}
                    onExport={exportChart}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    onToggleGrid={toggleGridDisplay}
                    onOpenLegend={openLegendModal}
                    onOpenHelp={openHelpModal}
                />
                <ElementEditor
                    disabled={disabled}
                    selectedNode={singleSelectedNode}
                    selectedEdge={singleSelectedEdge}
                    selectedNodesCount={selectedNodes.length}
                    selectedEdgesCount={selectedEdges.length}
                    onUpdateNodeData={updateNodeData}
                    onUpdateNodeType={updateSelectedNodeType}
                    onToggleAffected={toggleAffected}
                    onToggleCarrier={toggleCarrier}
                    onToggleDeceased={toggleDeceased}
                    onToggleProband={toggleProband}
                    onDelete={deleteSelectedElements}
                    onOpenEdgeModal={openEdgeModal}
                />
                <EdgeSettingsModal
                    open={isEdgeModalOpen}
                    disabled={disabled}
                    selectedEdge={singleSelectedEdge}
                    onClose={closeEdgeModal}
                    onApply={updateEdgeStyleAndType}
                />
                <LegendModal open={isLegendOpen} onClose={closeLegendModal} />
                <HelpModal open={isHelpModalOpen} onClose={closeHelpModal} />
            </ReactFlow>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

PedigreeChart.propTypes = {
    defaultValue: PropTypes.shape({
        nodes: PropTypes.array,
        edges: PropTypes.array,
    }),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
};

// --- Wrapper Component to provide ReactFlowProvider ---
// This is necessary because usePedigreeChart uses the useReactFlow hook internally
const PedigreeChartWrapper = (props) => (
    <ErrorBoundary
        variant="widget"
        title="The pedigree chart couldn't be displayed"
        description="An unexpected error occurred while rendering the pedigree editor."
    >
        <ReactFlowProvider>
            <PedigreeChart {...props} />
        </ReactFlowProvider>
    </ErrorBoundary>
);

PedigreeChartWrapper.propTypes = {
    defaultValue: PropTypes.shape({
        nodes: PropTypes.array,
        edges: PropTypes.array,
    }),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
};

export default PedigreeChartWrapper;
