// src/components/PedigreeChart.js
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    useReactFlow,
    getRectOfNodes,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver';

// MUI Imports
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// Internal imports
import { nodeSize, siblingSpacing } from './constants';
import { getFilename } from './utils/helpers';
import { MaleNode, FemaleNode, UnknownNode } from './nodes/CustomNodes';
import { ConsanguineousEdge } from './edges/CustomEdges';
import Toolbar from './ui/Toolbar';
import ElementEditor from './ui/ElementEditor';
import EdgeSettingsModal from './modals/EdgeSettingsModal';
import LegendModal from './modals/LegendModal';
import HelpModal from './modals/HelpModal';
import { debounce } from './utils/helpers';


// ID generator
let idCounter = 0;
const getId = (type = 'node') => `pedigree_${type}_${idCounter++}`;

/**
 * Main PedigreeChart component for creating and editing family trees
 *
 * @param {Object} defaultValue - Initial nodes and edges for the chart
 * @param {Function} onChange - Callback when chart data changes
 * @param {boolean} disabled - Whether the chart is in read-only mode
 */
const PedigreeChart = ({
                           defaultValue = { nodes: [], edges: [] },
                           onChange = () => {},
                           disabled = false,
                       }) => {
    // Refs and state
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [isLoading, setIsLoading] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(1);

    // React Flow hooks
    const {
        project,
        getNodes,
        getEdges,
        fitView,
        zoomIn,
        zoomOut,
        setViewport,
        deleteElements,
    } = useReactFlow();

    // Selection state
    const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);
    const singleSelectedNode = useMemo(() =>
            selectedNodes.length === 1 ? selectedNodes[0] : null,
        [selectedNodes]);
    const singleSelectedEdge = useMemo(() =>
            selectedEdges.length === 1 ? selectedEdges[0] : null,
        [selectedEdges]);

    // Custom node and edge types
    const nodeTypes = useMemo(() => ({
        male: MaleNode,
        female: FemaleNode,
        unknown: UnknownNode
    }), []);

    const edgeTypes = useMemo(() => ({
        consanguineous: ConsanguineousEdge
    }), []);

    // Initialize chart when defaultValue changes
    useEffect(() => {
        const initialNodes = defaultValue?.nodes || [];
        const initialEdges = defaultValue?.edges || [];

        setNodes(initialNodes);
        setEdges(initialEdges);

        // Reset ID counter based on highest ID in data
        const maxNodeId = initialNodes.reduce(
            (max, n) => Math.max(max, parseInt(n.id.split('_').pop()) || 0), 0
        );
        const maxEdgeId = initialEdges.reduce(
            (max, e) => Math.max(max, parseInt(e.id.split('_').pop()) || 0), 0
        );
        idCounter = Math.max(maxNodeId, maxEdgeId) + 1;

        // Fit view after loading data
        if (reactFlowInstance) {
            if (initialNodes.length > 0) {
                setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
            } else {
                setTimeout(() => setViewport({x: 0, y: 0, zoom: 1}, {duration: 300}), 100);
            }
        }
    }, [defaultValue, setNodes, setEdges, fitView, reactFlowInstance, setViewport]);

    // Notify parent of changes
    useEffect(() => {
        if (reactFlowInstance) {
            onChange({ nodes, edges });
        }
    }, [nodes, edges, onChange, reactFlowInstance]);

    // Track current zoom level for display
    useEffect(() => {
        if (reactFlowInstance) {
            // const handleZoomChange = (e) => {
            //     setCurrentZoom(e.zoom);
            // };

            // // Add event listener for zoom changes
            // const instance = reactFlowInstance;
            // instance.on('zoom', handleZoomChange);
            //
            // // Initial zoom level
            // setCurrentZoom(instance.getZoom());
            //
            // return () => {
            //     instance.off('zoom', handleZoomChange);
            // };
        }
    }, [reactFlowInstance]);

    // Event handlers
    const handleNodesChange = useCallback((changes) => {
        if (disabled) return;
        onNodesChange(changes);
    }, [onNodesChange, disabled]);

    const handleEdgesChange = useCallback((changes) => {
        if (disabled) return;
        onEdgesChange(changes);
    }, [onEdgesChange, disabled]);

    const handleConnect = useCallback((params) => {
        if (disabled) return;
        const newEdge = {
            ...params,
            id: getId('edge'),
            type: 'smoothstep',
            style: { strokeWidth: 1.5, stroke: '#666' },
        };
        setEdges((eds) => addEdge(newEdge, eds));
        showNotification('Connection created', 'success');
    }, [setEdges, disabled]);

    // Notification system
    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification((prev) => ({ ...prev, open: false }));
    };

    // Node operations
    const handleAddNode = useCallback((type) => {
        if (disabled || !reactFlowInstance || !reactFlowWrapper.current) return;

        const wrapperBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = project({
            x: wrapperBounds.width / 2 - nodeSize.width / 2,
            y: wrapperBounds.height / 3,
        });

        // Add small random offset to prevent stacking
        position.x += Math.random() * 40 - 20;
        position.y += Math.random() * 40 - 20;

        const newNode = {
            id: getId('node'),
            type,
            position,
            data: {
                label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                isAffected: false,
                isCarrier: false,
                isDeceased: false,
                isProband: false
            },
            style: {
                width: type === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width,
                height: type === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height,
            },
        };

        setNodes((nds) => nds.concat(newNode));
        showNotification(`Added ${type} individual`, 'success');
    }, [project, setNodes, reactFlowInstance, disabled]);

    const handleAddChildBetweenParents = useCallback(() => {
        if (disabled) return;

        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const selectedParents = currentNodes.filter(n => n.selected);

        if (selectedParents.length !== 2) {
            showNotification("Please select exactly two parent nodes", "warning");
            return;
        }

        const [parent1, parent2] = selectedParents;

        if (!parent1.positionAbsolute || !parent2.positionAbsolute) {
            showNotification("Cannot determine parent positions", "error");
            return;
        }

        // Find existing children of these parents
        const childrenEdges = currentEdges.filter(edge =>
            ((edge.source === parent1.id && edge.sourceHandle === 'b') ||
                (edge.source === parent2.id && edge.sourceHandle === 'b'))
        );

        const childrenNodes = currentNodes.filter(node =>
            childrenEdges.some(edge => edge.target === node.id && node.positionAbsolute)
        );

        // Calculate child position
        const parentBounds = getRectOfNodes([parent1, parent2]);
        const baseY = Math.max(parent1.positionAbsolute.y, parent2.positionAbsolute.y) +
            nodeSize.height + 80;

        let childX;
        if (childrenNodes.length > 0) {
            // Find rightmost sibling
            const rightmostSibling = childrenNodes
                .filter(n => n.positionAbsolute)
                .reduce((rightmost, current) =>
                        (current.positionAbsolute.x > rightmost.positionAbsolute.x)
                            ? current : rightmost,
                    { positionAbsolute: { x: -Infinity } }
                );

            childX = rightmostSibling.positionAbsolute.x + nodeSize.width + siblingSpacing;
        } else {
            // Center below parents if no siblings
            childX = parentBounds.x + parentBounds.width / 2 - nodeSize.width / 2;
        }

        // Create child node
        const childNode = {
            id: getId('node'),
            type: 'unknown',
            position: { x: childX, y: baseY },
            data: {
                label: 'Child',
                isAffected: false,
                isCarrier: false,
                isDeceased: false,
                isProband: false
            },
            style: {
                width: nodeSize.width * 0.8,
                height: nodeSize.height * 0.8
            },
        };

        // Create connections to parents
        const edgeStyle = { strokeWidth: 1.5, stroke: '#666' };
        const edge1 = {
            id: getId('edge'),
            source: parent1.id,
            sourceHandle: 'b',
            target: childNode.id,
            targetHandle: 't',
            type: 'smoothstep',
            style: edgeStyle
        };
        const edge2 = {
            id: getId('edge'),
            source: parent2.id,
            sourceHandle: 'b',
            target: childNode.id,
            targetHandle: 't',
            type: 'smoothstep',
            style: edgeStyle
        };

        // Add to chart
        setNodes((nds) => nds.concat(childNode));
        setEdges((eds) => eds.concat([edge1, edge2]));

        // Deselect parents
        const deselectChanges = selectedParents.map(p => (
            { id: p.id, type: 'select', selected: false }
        ));
        handleNodesChange(deselectChanges);

        showNotification("Child added between selected parents", "success");
    }, [disabled, getNodes, getEdges, setNodes, setEdges, handleNodesChange]);

    const handleUpdateNodeData = useCallback((nodeId, newData) => {
        if (disabled) return;

        setNodes((nds) =>
            nds.map((n) => (
                n.id === nodeId
                    ? { ...n, data: { ...(n.data || {}), ...newData } }
                    : n
            ))
        );
    }, [setNodes, disabled]);

    const handleUpdateNodeType = useCallback((event) => {
        if (disabled || !singleSelectedNode) return;

        const newType = event.target.value;
        if (!newType) return;

        setNodes((nds) => nds.map((n) => {
            if (n.id === singleSelectedNode.id) {
                const currentLabel = n.data?.label || '';
                const defaultLabels = ['Male', 'Female', 'Unknown', 'Child'];
                const newLabel = defaultLabels.includes(currentLabel)
                    ? newType.charAt(0).toUpperCase() + newType.slice(1)
                    : currentLabel;

                // Adjust size based on type
                const newWidth = newType === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width;
                const newHeight = newType === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height;

                return {
                    ...n,
                    type: newType,
                    data: { ...(n.data || {}), label: newLabel },
                    style: { ...(n.style || {}), width: newWidth, height: newHeight }
                };
            }
            return n;
        }));

        showNotification(`Changed individual to ${newType}`, 'info');
    }, [singleSelectedNode, setNodes, disabled]);

    const handleDeleteSelectedElements = useCallback(() => {
        if (disabled) return;

        const nodesToDelete = nodes.filter(n => n.selected);
        const edgesToDelete = edges.filter(e => e.selected);

        if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
            deleteElements({ nodes: nodesToDelete, edges: edgesToDelete });

            // Build notification message
            const nodeCount = nodesToDelete.length;
            const edgeCount = edgesToDelete.length;
            let message = 'Deleted ';

            if (nodeCount > 0) {
                message += `${nodeCount} individual${nodeCount > 1 ? 's' : ''}`;
            }
            if (nodeCount > 0 && edgeCount > 0) {
                message += ' and ';
            }
            if (edgeCount > 0) {
                message += `${edgeCount} connection${edgeCount > 1 ? 's' : ''}`;
            }

            showNotification(message, 'info');
        }
    }, [nodes, edges, deleteElements, disabled]);

    // Node status toggles
    const handleToggleAffected = useCallback(() => {
        if (!singleSelectedNode) return;

        const newValue = !(singleSelectedNode.data?.isAffected);
        handleUpdateNodeData(singleSelectedNode.id, { isAffected: newValue });
        showNotification(
            `${singleSelectedNode.data?.label || 'Individual'} marked as ${newValue ? 'affected' : 'unaffected'}`,
            'info'
        );
    }, [singleSelectedNode, handleUpdateNodeData]);

    const handleToggleCarrier = useCallback(() => {
        if (!singleSelectedNode) return;

        const newValue = !(singleSelectedNode.data?.isCarrier);
        handleUpdateNodeData(singleSelectedNode.id, { isCarrier: newValue });
        showNotification(
            `${singleSelectedNode.data?.label || 'Individual'} marked as ${newValue ? 'carrier' : 'non-carrier'}`,
            'info'
        );
    }, [singleSelectedNode, handleUpdateNodeData]);

    const handleToggleDeceased = useCallback(() => {
        if (!singleSelectedNode) return;

        const newValue = !(singleSelectedNode.data?.isDeceased);
        handleUpdateNodeData(singleSelectedNode.id, { isDeceased: newValue });
        showNotification(
            `${singleSelectedNode.data?.label || 'Individual'} marked as ${newValue ? 'deceased' : 'alive'}`,
            'info'
        );
    }, [singleSelectedNode, handleUpdateNodeData]);

    const handleToggleProband = useCallback(() => {
        if (!singleSelectedNode) return;

        const willBeProband = !(singleSelectedNode.data?.isProband);

        // Update selected node
        handleUpdateNodeData(singleSelectedNode.id, { isProband: willBeProband });

        // If setting as proband, clear proband status from all other nodes
        if (willBeProband) {
            setNodes(currentNodes => currentNodes.map(node =>
                (node.id !== singleSelectedNode.id && node.data?.isProband)
                    ? { ...node, data: { ...node.data, isProband: false } }
                    : node
            ));
        }

        showNotification(
            `${singleSelectedNode.data?.label || 'Individual'} ${willBeProband ? 'set as proband' : 'unset as proband'}`,
            'info'
        );
    }, [singleSelectedNode, handleUpdateNodeData, setNodes]);

    // Edge operations
    const handleOpenEdgeModal = () => !disabled && singleSelectedEdge && setIsEdgeModalOpen(true);
    const handleCloseEdgeModal = () => setIsEdgeModalOpen(false);

    const handleUpdateEdgeStyleAndType = useCallback((styleType) => {
        if (disabled || !singleSelectedEdge) return;

        let newStyle = { ...(singleSelectedEdge.style || {}) };
        let newType = singleSelectedEdge.type === 'consanguineous'
            ? 'smoothstep'
            : singleSelectedEdge.type;

        // Reset dash array
        delete newStyle.strokeDasharray;

        // Apply new style
        switch (styleType) {
            case 'dashed':
                newStyle.strokeDasharray = '5 5';
                newType = 'smoothstep';
                break;
            case 'double':
                newType = 'consanguineous';
                break;
            case 'solid':
            default:
                newType = 'smoothstep';
                break;
        }

        // Update edge
        setEdges((eds) => eds.map((edge) => (
            edge.id === singleSelectedEdge.id
                ? { ...edge, style: newStyle, type: newType }
                : edge
        )));

        handleCloseEdgeModal();
        showNotification('Connection style updated', 'success');
    }, [singleSelectedEdge, setEdges, disabled]);

    // Export/import functions
    const handleExportChart = useCallback((format = 'png') => {
        if (!reactFlowWrapper.current) {
            showNotification("Export failed: Chart container not found", "error");
            return;
        }

        setIsLoading(true);

        const viewportEl = reactFlowWrapper.current.querySelector('.react-flow__viewport');
        if (!viewportEl) {
            showNotification("Export failed: Viewport element missing", "error");
            setIsLoading(false);
            return;
        }

        const exportFunc = format === 'png' ? toPng : toSvg;
        const options = {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            quality: 1.0
        };

        exportFunc(viewportEl, options)
            .then((dataUrl) => {
                saveAs(dataUrl, getFilename(format));
                showNotification(`Exported as ${format.toUpperCase()}`, "success");
            })
            .catch((err) => {
                console.error('Export error:', err);
                showNotification(`Export failed: ${err.message}`, "error");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSaveData = useCallback(() => {
        if (!reactFlowInstance) {
            showNotification("Save failed: Chart not ready", "error");
            return;
        }

        setIsLoading(true);

        try {
            const flow = reactFlowInstance.toObject();
            const json = JSON.stringify(flow, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            saveAs(blob, getFilename('json'));
            showNotification("Pedigree saved successfully", "success");
        } catch (error) {
            console.error('Save error:', error);
            showNotification("Failed to save pedigree", "error");
        } finally {
            setIsLoading(false);
        }
    }, [reactFlowInstance]);

    const handleLoadData = useCallback((event) => {
        if (disabled) return;

        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/json') {
            if (file) showNotification('Please select a valid JSON file (.json)', 'warning');
            if (event.target) event.target.value = null;
            return;
        }

        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const flow = JSON.parse(e.target?.result);
                if (flow && Array.isArray(flow.nodes) && Array.isArray(flow.edges)) {
                    // Process nodes
                    const processedNodes = flow.nodes.map(n => ({
                        ...n,
                        data: n.data || {},
                        style: {
                            ...(n.style || {}),
                            width: n.type === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width,
                            height: n.type === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height,
                        }
                    }));

                    // Process edges
                    const processedEdges = flow.edges.map(e => ({
                        ...e,
                        markerEnd: undefined
                    }));

                    // Update state
                    setNodes(processedNodes);
                    setEdges(processedEdges);

                    // Reset ID counter
                    const maxNId = processedNodes.reduce(
                        (max, n) => Math.max(max, parseInt(n.id.split('_').pop()) || 0), 0
                    );
                    const maxEId = processedEdges.reduce(
                        (max, e) => Math.max(max, parseInt(e.id.split('_').pop()) || 0), 0
                    );
                    idCounter = Math.max(maxNId, maxEId) + 1;

                    // Restore viewport
                    if (flow.viewport && reactFlowInstance) {
                        setViewport(flow.viewport, { duration: 300 });
                    } else if (reactFlowInstance) {
                        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
                    }

                    showNotification("Pedigree loaded successfully", "success");
                } else {
                    showNotification('Invalid pedigree file structure', 'error');
                }
            } catch (err) {
                console.error('Load error:', err);
                showNotification('Load failed: Invalid JSON format', 'error');
            } finally {
                setIsLoading(false);
                if (event.target) event.target.value = null;
            }
        };

        reader.onerror = (err) => {
            console.error('File read error:', err);
            showNotification('Could not read file', 'error');
            setIsLoading(false);
            if (event.target) event.target.value = null;
        };

        reader.readAsText(file);
    }, [disabled, setNodes, setEdges, reactFlowInstance, setViewport, fitView]);

    // View control functions
    const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
    const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ padding: 0.2, duration: 300 });
        showNotification("View adjusted to show all elements", "info");
    }, [fitView]);

    const handleToggleGrid = useCallback(() => setShowGrid(prev => !prev), []);

    // Modal functions
    const handleOpenLegend = () => setIsLegendOpen(true);
    const handleCloseLegend = () => setIsLegendOpen(false);
    const handleOpenHelp = () => setIsHelpModalOpen(true);
    const handleCloseHelp = () => setIsHelpModalOpen(false);

    const onNodeDragStart = useCallback((event, node) => {
        // Add a dragging class to the node
        setNodes(nodes => nodes.map(n =>
            n.id === node.id
                ? { ...n, className: 'dragging' }
                : n
        ));
    }, [setNodes]);

    const onNodeDragStop = useCallback((event, node) => {
        // Remove the dragging class
        setNodes(nodes => nodes.map(n =>
            n.id === node.id
                ? { ...n, className: '' }
                : n
        ));
    }, [setNodes]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: '500px',
                position: 'relative',
                border: disabled ? 'none' : '1px solid #e0e0e0',
                borderRadius: 1,
                overflow: 'hidden'
            }}
            ref={reactFlowWrapper}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 20
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Processing...
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* React Flow Canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setReactFlowInstance}
                onNodeDragStart={onNodeDragStart}
                onNodeDragStop={onNodeDragStop}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                deleteKeyCode={disabled ? null : ['Backspace', 'Delete']}
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Shift"
                selectNodesOnDrag={!disabled}
                elementsSelectable={!disabled}
                nodesDraggable={!disabled}
                nodesConnectable={!disabled}
                panOnDrag={!disabled ? [1, 2] : [2]}
                zoomOnScroll={true}
                zoomOnPinch={true}
                zoomOnDoubleClick={true}
                className="reactflow-pedigree-canvas"
                minZoom={0.1}
                maxZoom={4}
                proOptions={{ hideAttribution: true }}
                style={{ background: '#f8f8f8' }}
            >
                {/* Background & Controls */}
                {showGrid && <Background variant="dots" gap={16} size={1} color="#ddd" />}
                <Controls showInteractive={false} position="bottom-left" />
                <MiniMap
                    position="bottom-right"
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    nodeColor={(n) => {
                        if (n.type === 'male') return 'lightblue';
                        if (n.type === 'female') return 'lightpink';
                        return 'lightgrey';
                    }}
                />

                {/* UI Components */}
                <Toolbar
                    disabled={disabled}
                    selectedNodes={selectedNodes}
                    showGrid={showGrid}
                    viewportControls={{ zoomLevel: currentZoom }}
                    onAddNode={handleAddNode}
                    onAddChildBetweenParents={handleAddChildBetweenParents}
                    onSaveData={handleSaveData}
                    onLoadData={handleLoadData}
                    onExportChart={handleExportChart}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    onToggleGrid={handleToggleGrid}
                    onOpenLegend={handleOpenLegend}
                    onOpenHelp={handleOpenHelp}
                />

                <ElementEditor
                    disabled={disabled}
                    singleSelectedNode={singleSelectedNode}
                    singleSelectedEdge={singleSelectedEdge}
                    onUpdateNodeData={handleUpdateNodeData}
                    onUpdateNodeType={handleUpdateNodeType}
                    onDeleteSelected={handleDeleteSelectedElements}
                    onOpenEdgeModal={handleOpenEdgeModal}
                    onToggleAffected={handleToggleAffected}
                    onToggleCarrier={handleToggleCarrier}
                    onToggleDeceased={handleToggleDeceased}
                    onToggleProband={handleToggleProband}
                />

                {/* Modals */}
                <EdgeSettingsModal
                    isOpen={isEdgeModalOpen}
                    onClose={handleCloseEdgeModal}
                    onApply={handleUpdateEdgeStyleAndType}
                    currentEdge={singleSelectedEdge}
                />
                <LegendModal
                    isOpen={isLegendOpen}
                    onClose={handleCloseLegend}
                />
                <HelpModal
                    isOpen={isHelpModalOpen}
                    onClose={handleCloseHelp}
                />
            </ReactFlow>

            {/* Notifications */}
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

// Wrapper with ReactFlowProvider
const PedigreeChartWrapper = (props) => (
    <ReactFlowProvider>
        <PedigreeChart {...props} />
    </ReactFlowProvider>
);

export default PedigreeChartWrapper;
