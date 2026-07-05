import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    useReactFlow,
    getRectOfNodes,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Base React Flow styles
import { toPng, toSvg } from 'html-to-image';
import { saveAs } from 'file-saver'; // To trigger download

// --- MUI Imports ---
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// --- Pedigree subcomponents ---
import { nodeSize, siblingSpacing } from './Pedigree/constants';
import { MaleNode, FemaleNode, UnknownNode } from './Pedigree/nodes';
import ConsanguineousEdge from './Pedigree/ConsanguineousEdge';
import PedigreeToolbar from './Pedigree/PedigreeToolbar';
import ElementEditor from './Pedigree/ElementEditor';
import EdgeSettingsModal from './Pedigree/EdgeSettingsModal';
import LegendModal from './Pedigree/LegendModal';
import HelpModal from './Pedigree/HelpModal';
import ErrorBoundary from './ErrorBoundary';

// --- Main Application Component ---
let idCounter = 0; // Use a local counter within the component instance
const getId = (type = 'node') => `pedigree_${type}_${idCounter++}`;

// Define the PedigreeChart component accepting props
const PedigreeChart = ({
    defaultValue = { nodes: [], edges: [] }, // Default empty chart
    onChange = () => {}, // No-op default onChange
    disabled = false, // Default to enabled
}) => {
    const reactFlowWrapper = useRef(null);
    // Initialize state from defaultValue prop
    const [nodes, setNodes, onNodesStateChange] = useNodesState(defaultValue.nodes || []);
    const [edges, setEdges, onEdgesStateChange] = useEdgesState(defaultValue.edges || []);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [viewportControls] = useState({ zoomLevel: 1, fitView: false });

    // Use React Flow hooks
    const { project, getNodes, getEdges, deleteElements, fitView, zoomIn, zoomOut } =
        useReactFlow();

    // Get the currently selected elements
    const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);

    // Get the single selected node/edge for the editor
    const singleSelectedNode = useMemo(
        () => (selectedNodes.length === 1 ? selectedNodes[0] : null),
        [selectedNodes],
    );
    const singleSelectedEdge = useMemo(
        () => (selectedEdges.length === 1 ? selectedEdges[0] : null),
        [selectedEdges],
    );

    // Define custom node and edge types
    const nodeTypes = useMemo(
        () => ({
            male: MaleNode,
            female: FemaleNode,
            unknown: UnknownNode,
        }),
        [],
    );

    const edgeTypes = useMemo(
        () => ({
            consanguineous: ConsanguineousEdge,
        }),
        [],
    );

    // Effect to update state if defaultValue prop changes externally
    useEffect(() => {
        // Basic check to avoid unnecessary updates
        if (JSON.stringify(defaultValue.nodes) !== JSON.stringify(nodes)) {
            setNodes(defaultValue.nodes || []);
        }
        if (JSON.stringify(defaultValue.edges) !== JSON.stringify(edges)) {
            setEdges(defaultValue.edges || []);
        }
        // Optionally reset ID counter based on loaded data
        const maxNodeId = (defaultValue.nodes || []).reduce((max, n) => {
            const num = parseInt(n.id.split('_').pop());
            return !isNaN(num) && num > max ? num : max;
        }, 0);
        const maxEdgeId = (defaultValue.edges || []).reduce((max, e) => {
            const num = parseInt(e.id.split('_').pop());
            return !isNaN(num) && num > max ? num : max;
        }, 0);
        idCounter = Math.max(maxNodeId, maxEdgeId) + 1;

        // Fit view after setting default value
        if (reactFlowInstance) {
            setTimeout(() => fitView({ padding: 0.2 }), 0); // Use timeout to ensure nodes are rendered
        }
        // Syncs the external defaultValue prop into local node/edge state. Depending on
        // nodes/edges here would revert in-progress user edits back to defaultValue.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reactFlowInstance, fitView]);

    // Effect to call onChange prop when nodes or edges change
    useEffect(() => {
        // Check if it's not the initial render potentially caused by defaultValue
        if (reactFlowInstance) {
            onChange({ nodes, edges });
        }
        // Emits the current graph to the parent when nodes/edges change. onChange is the
        // emit sink, not a trigger; depending on it could re-emit and loop on each render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, reactFlowInstance]);

    // --- Notification Helper ---
    const showNotification = (message, severity = 'info') => {
        setNotification({
            open: true,
            message,
            severity,
        });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // --- Node/Edge Change Handlers ---
    const onNodesChange = useCallback(
        (changes) => {
            if (disabled) return; // Prevent changes if disabled
            onNodesStateChange(changes);
        },
        [onNodesStateChange, disabled],
    );

    const onEdgesChange = useCallback(
        (changes) => {
            if (disabled) return; // Prevent changes if disabled
            onEdgesStateChange(changes);
        },
        [onEdgesStateChange, disabled],
    );

    // Handle connecting nodes
    const onConnect = useCallback(
        (params) => {
            if (disabled) return; // Prevent connection if disabled
            const newEdge = {
                ...params,
                id: getId('edge'),
                type: 'smoothstep',
                style: { strokeWidth: 1.5, stroke: '#666' },
            };
            setEdges((eds) => addEdge(newEdge, eds));
            showNotification('Connection created', 'success');
        },
        [setEdges, disabled],
    );

    // --- Toolbar Actions ---
    const addNode = useCallback(
        (type) => {
            if (disabled) return; // Prevent adding if disabled
            let position;
            if (reactFlowInstance && reactFlowWrapper.current) {
                const pane = reactFlowWrapper.current.getBoundingClientRect();
                position = project({
                    x: pane.width / 2 - nodeSize.width / 2 + Math.random() * 100 - 50,
                    y: pane.height / 3 + Math.random() * 100 - 50,
                });
            } else {
                position = { x: Math.random() * 400 + 100, y: Math.random() * 200 + 50 };
            }

            const newNode = {
                id: getId('node'),
                type,
                position,
                data: {
                    label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    isAffected: false,
                    isCarrier: false,
                    isDeceased: false,
                    isProband: false,
                },
                style: { width: nodeSize.width, height: nodeSize.height },
            };

            setNodes((nds) => nds.concat(newNode));
            showNotification(`Added ${type} individual`, 'success');
        },
        [project, setNodes, reactFlowInstance, disabled],
    );

    // --- Improved Add Child Between Parents ---
    const addChildBetweenParents = useCallback(() => {
        if (disabled) return; // Prevent adding if disabled

        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const selectedParents = currentNodes.filter((n) => n.selected);

        if (selectedParents.length !== 2) {
            showNotification('Please select exactly two parent nodes', 'warning');
            return;
        }

        const [parent1, parent2] = selectedParents;

        if (!parent1.positionAbsolute || !parent2.positionAbsolute) {
            showNotification('Could not determine parent positions', 'error');
            return;
        }

        // Find existing children to place new child appropriately
        const childrenEdges = currentEdges.filter(
            (edge) =>
                (edge.source === parent1.id && edge.sourceHandle === 'b') ||
                (edge.source === parent2.id && edge.sourceHandle === 'b'),
        );

        const childrenNodes = currentNodes.filter((node) =>
            childrenEdges.some((edge) => edge.target === node.id),
        );

        const parentBounds = getRectOfNodes([parent1, parent2]);
        const baseY =
            Math.max(parent1.positionAbsolute.y, parent2.positionAbsolute.y) + nodeSize.height + 80;

        let childX;
        if (childrenNodes.length > 0) {
            const lastSibling = childrenNodes.reduce((last, current) =>
                current.positionAbsolute.x > last.positionAbsolute.x ? current : last,
            );
            childX = lastSibling.positionAbsolute.x + nodeSize.width + siblingSpacing;
        } else {
            childX = parentBounds.x + parentBounds.width / 2 - nodeSize.width / 2;
        }

        const childNode = {
            id: getId('node'),
            type: 'unknown', // Default to unknown gender
            position: { x: childX, y: baseY },
            data: {
                label: 'Child',
                isAffected: false,
                isCarrier: false,
                isDeceased: false,
                isProband: false,
            },
            style: { width: nodeSize.width, height: nodeSize.height },
        };

        const edgeStyle = { strokeWidth: 1.5, stroke: '#666' };

        const edge1 = {
            id: getId('edge'),
            source: parent1.id,
            sourceHandle: 'b',
            target: childNode.id,
            targetHandle: 't',
            type: 'smoothstep',
            style: edgeStyle,
        };

        const edge2 = {
            id: getId('edge'),
            source: parent2.id,
            sourceHandle: 'b',
            target: childNode.id,
            targetHandle: 't',
            type: 'smoothstep',
            style: edgeStyle,
        };

        setNodes((nds) => nds.concat(childNode));
        setEdges((eds) => eds.concat([edge1, edge2]));

        // Deselect parents and select the new child
        const deselectChanges = selectedParents.map((parent) => ({
            id: parent.id,
            type: 'select',
            selected: false,
        }));
        onNodesChange(deselectChanges);

        showNotification('Child added between selected parents', 'success');
    }, [disabled, getNodes, getEdges, setNodes, setEdges, onNodesChange]);

    // --- Node Data/Type Updates ---
    const updateNodeData = useCallback(
        (nodeId, newData) => {
            if (disabled) return; // Prevent update if disabled

            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n)),
            );
        },
        [setNodes, disabled],
    );

    const updateSelectedNodeType = useCallback(
        (event) => {
            if (disabled) return; // Prevent update if disabled

            const newType = event.target.value;
            if (!singleSelectedNode || !newType) return;

            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === singleSelectedNode.id) {
                        const currentLabel = n.data.label;
                        const defaultLabels = ['Male', 'Female', 'Unknown', 'Child'];
                        const newLabel = defaultLabels.includes(currentLabel)
                            ? newType.charAt(0).toUpperCase() + newType.slice(1)
                            : currentLabel;

                        const newWidth =
                            newType === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width;
                        const newHeight =
                            newType === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height;

                        return {
                            ...n,
                            type: newType,
                            data: { ...n.data, label: newLabel },
                            style: { ...n.style, width: newWidth, height: newHeight },
                        };
                    }
                    return n;
                }),
            );

            showNotification(`Changed individual to ${newType}`, 'info');
        },
        [singleSelectedNode, setNodes, disabled],
    );

    // --- Delete Selected Elements ---
    const deleteSelectedElements = useCallback(() => {
        if (disabled) return; // Prevent delete if disabled

        const nodesToDelete = nodes.filter((n) => n.selected);
        const edgesToDelete = edges.filter((e) => e.selected);

        if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
            deleteElements({ nodes: nodesToDelete, edges: edgesToDelete });

            if (nodesToDelete.length > 0) {
                showNotification(`Deleted ${nodesToDelete.length} individual(s)`, 'info');
            } else if (edgesToDelete.length > 0) {
                showNotification(`Deleted ${edgesToDelete.length} connection(s)`, 'info');
            }
        }
    }, [nodes, edges, deleteElements, disabled]);

    // --- Status Toggles with Meaningful Feedback ---
    const toggleAffected = () => {
        if (singleSelectedNode) {
            const newValue = !singleSelectedNode.data.isAffected;
            updateNodeData(singleSelectedNode.id, { isAffected: newValue });
            showNotification(
                `${singleSelectedNode.data.label} marked as ${newValue ? 'affected' : 'not affected'}`,
                'info',
            );
        }
    };

    const toggleCarrier = () => {
        if (singleSelectedNode) {
            const newValue = !singleSelectedNode.data.isCarrier;
            updateNodeData(singleSelectedNode.id, { isCarrier: newValue });
            showNotification(
                `${singleSelectedNode.data.label} marked as ${newValue ? 'carrier' : 'not carrier'}`,
                'info',
            );
        }
    };

    const toggleDeceased = () => {
        if (singleSelectedNode) {
            const newValue = !singleSelectedNode.data.isDeceased;
            updateNodeData(singleSelectedNode.id, { isDeceased: newValue });
            showNotification(
                `${singleSelectedNode.data.label} marked as ${newValue ? 'deceased' : 'not deceased'}`,
                'info',
            );
        }
    };

    const toggleProband = () => {
        if (singleSelectedNode) {
            // If setting this node as proband, clear proband status from all other nodes first
            if (!singleSelectedNode.data.isProband) {
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id !== singleSelectedNode.id
                            ? { ...node, data: { ...node.data, isProband: false } }
                            : node,
                    ),
                );
            }

            const newValue = !singleSelectedNode.data.isProband;
            updateNodeData(singleSelectedNode.id, { isProband: newValue });
            showNotification(
                `${singleSelectedNode.data.label} ${newValue ? 'set as proband' : 'no longer proband'}`,
                'info',
            );
        }
    };

    // --- Edge Modal Functions ---
    const openEdgeModal = () => {
        if (!disabled) setIsEdgeModalOpen(true);
    };

    const closeEdgeModal = () => setIsEdgeModalOpen(false);

    // --- Update Edge Style and Type ---
    const updateEdgeStyleAndType = useCallback(
        (styleType) => {
            if (disabled || !singleSelectedEdge) return; // Prevent update if disabled

            let newStyle = { ...singleSelectedEdge.style };
            let newType = singleSelectedEdge.type;
            delete newStyle.strokeDasharray;

            if (newType === 'consanguineous') {
                newType = 'smoothstep';
            }

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

            setEdges((eds) =>
                eds.map((edge) =>
                    edge.id === singleSelectedEdge.id
                        ? { ...edge, style: newStyle, type: newType }
                        : edge,
                ),
            );

            closeEdgeModal();
            showNotification('Connection style updated', 'success');
        },
        [singleSelectedEdge, setEdges, disabled],
    );

    // --- Advanced Layout Functions ---
    const autoArrangeFamily = useCallback(() => {
        if (disabled || nodes.length === 0) return;

        setIsLoading(true);

        // Simple tree-layout algorithm (for demo purposes)
        // In a real implementation, this would be more sophisticated
        setTimeout(() => {
            try {
                // Find root nodes (nodes without parents)
                const incomingEdges = {};
                edges.forEach((edge) => {
                    if (!incomingEdges[edge.target]) {
                        incomingEdges[edge.target] = [];
                    }
                    incomingEdges[edge.target].push(edge);
                });

                const rootNodes = nodes.filter((node) => !incomingEdges[node.id]);

                if (rootNodes.length === 0) {
                    showNotification('Could not identify family structure', 'warning');
                    setIsLoading(false);
                    return;
                }

                // Simple layout - place root nodes at top level
                const newNodes = [...nodes];
                const nodeWidth = 120;

                // Place root nodes
                rootNodes.forEach((node, index) => {
                    const updatedNode = {
                        ...node,
                        position: {
                            x: 100 + index * nodeWidth,
                            y: 100,
                        },
                    };
                    const nodeIndex = newNodes.findIndex((n) => n.id === node.id);
                    if (nodeIndex >= 0) {
                        newNodes[nodeIndex] = updatedNode;
                    }
                });

                // Simple BFS to lay out the rest
                setNodes(newNodes);
                setIsLoading(false);

                // Fit view after arranging
                setTimeout(() => fitView({ padding: 0.2 }), 100);

                showNotification('Family tree auto-arranged', 'success');
            } catch (err) {
                console.error('Layout error:', err);
                showNotification('Auto-arrange failed', 'error');
                setIsLoading(false);
            }
        }, 500);
    }, [nodes, edges, setNodes, disabled, fitView]);

    // --- Export Functionality ---
    const getFilename = (format) =>
        `pedigree-chart-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;

    const exportChart = useCallback((format = 'png') => {
        if (reactFlowWrapper.current) {
            setIsLoading(true);

            const el = reactFlowWrapper.current.querySelector('.react-flow__viewport');
            if (!el) {
                console.error('Viewport not found.');
                showNotification('Export failed', 'error');
                setIsLoading(false);
                return;
            }

            const opt = {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: 'white',
            };

            const saveFn = format === 'png' ? toPng : toSvg;

            saveFn(el, opt)
                .then((url) => {
                    saveAs(url, getFilename(format));
                    showNotification(`Exported as ${format.toUpperCase()}`, 'success');
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Export error:', err);
                    showNotification(`Export failed: ${err.message}`, 'error');
                    setIsLoading(false);
                });
        } else {
            console.error('Wrapper ref missing.');
            showNotification('Export failed', 'error');
        }
    }, []);

    // --- Save/Load Functionality ---
    const saveData = useCallback(() => {
        if (!reactFlowInstance) {
            showNotification('Cannot save data', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const flow = reactFlowInstance.toObject();
            const json = JSON.stringify(flow, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            saveAs(blob, getFilename('json'));

            showNotification('Pedigree saved successfully', 'success');
        } catch (error) {
            console.error('Save error:', error);
            showNotification('Failed to save pedigree', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [reactFlowInstance]);

    const loadData = useCallback(
        (event) => {
            if (disabled) return; // Prevent loading if disabled

            const file = event.target.files[0];
            if (!file || file.type !== 'application/json') {
                if (file) showNotification('Please select a valid JSON file', 'warning');
                event.target.value = null;
                return;
            }

            setIsLoading(true);

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const flow = JSON.parse(e.target.result);
                    if (flow && Array.isArray(flow.nodes) && Array.isArray(flow.edges)) {
                        const pNodes = flow.nodes.map((n) => ({
                            ...n,
                            style: {
                                ...n.style,
                                width: n.type === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width,
                                height:
                                    n.type === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height,
                            },
                        }));

                        setNodes(pNodes || []);
                        setEdges(
                            flow.edges.map((e) => ({ ...e, markerEnd: undefined })) || [],
                        ); /* Remove markerEnd on load */

                        if (flow.viewport && reactFlowInstance) {
                            reactFlowInstance.setViewport(flow.viewport);
                        } else if (reactFlowInstance) {
                            reactFlowInstance.fitView();
                        }

                        const maxNId = pNodes.reduce((max, n) => {
                            const num = parseInt(n.id.split('_').pop());
                            return !isNaN(num) && num > max ? num : max;
                        }, 0);

                        const maxEId = flow.edges.reduce((max, e) => {
                            const num = parseInt(e.id.split('_').pop());
                            return !isNaN(num) && num > max ? num : max;
                        }, 0);

                        idCounter = Math.max(maxNId, maxEId) + 1;
                        showNotification('Pedigree loaded successfully', 'success');
                    } else {
                        showNotification('Invalid pedigree file structure', 'error');
                    }
                } catch (err) {
                    console.error('Load error:', err);
                    showNotification('Load failed: Invalid JSON', 'error');
                } finally {
                    setIsLoading(false);
                }
            };

            reader.onerror = (err) => {
                console.error('File read error:', err);
                showNotification('Could not read file', 'error');
                setIsLoading(false);
            };

            reader.readAsText(file);
            event.target.value = null;
        },
        [setNodes, setEdges, reactFlowInstance, disabled],
    );

    const handleZoomIn = useCallback(() => {
        zoomIn();
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut();
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ padding: 0.2 });
        showNotification('View adjusted to fit all elements', 'info');
    }, [fitView]);

    const toggleGridDisplay = useCallback(() => {
        setShowGrid((prev) => !prev);
    }, []);

    // --- Help and Legend Functions ---
    const openLegendModal = () => setIsLegendOpen(true);
    const closeLegendModal = () => setIsLegendOpen(false);

    const openHelpModal = () => setIsHelpModalOpen(true);
    const closeHelpModal = () => setIsHelpModalOpen(false);

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
// This is necessary because PedigreeChart uses useReactFlow hook internally
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
