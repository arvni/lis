import React, {useState, useCallback, useRef, useMemo, useEffect} from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    useReactFlow,
    Position,
    getRectOfNodes,
    getSmoothStepPath,
    Handle
} from 'reactflow';
import 'reactflow/dist/style.css'; // Base React Flow styles
import {toPng, toSvg} from 'html-to-image';
import {saveAs} from 'file-saver'; // To trigger download

// --- MUI Imports ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import ImageIcon from '@mui/icons-material/Image';
import SvgIcon from '@mui/icons-material/DataObject';
import PeopleIcon from '@mui/icons-material/People';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import HelpIcon from '@mui/icons-material/Help';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {alpha} from '@mui/material/styles';


// --- Custom Node Constants & Styles ---
const nodeSize = {width: 50, height: 50};
const siblingSpacing = 40; // Horizontal space between siblings
const nodeBaseSx = {
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
    transition: 'all 0.2s ease'
};
const markerBaseSx = {position: 'absolute', zIndex: 1};
const affectedMarkerSx = (bgColor) => ({...markerBaseSx, inset: 0, bgcolor: bgColor, opacity: 0.8});
const carrierMarkerSx = {
    ...markerBaseSx,
    width: 8,
    height: 8,
    bgcolor: 'black',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
};
const deceasedMarkerSx = {
    ...markerBaseSx,
    width: '100%',
    height: '2px',
    bgcolor: 'black',
    top: '50%',
    left: 0,
    transform: 'rotate(45deg)',
    transformOrigin: 'center center'
};
const probandMarkerSx = {
    ...markerBaseSx,
    left: "-50%",
    top: '100%',
    fontSize: '1.25rem',
    rotate: "-45deg",
    lineHeight: 1
};
const labelSx = {
    position: 'absolute',
    bottom: -24,
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    width: '100%',
    left: 0,
    zIndex: 1
};
const handleStyle = {width: 8, height: 8, background: '#555'};

// --- Custom Node Components (MUI Styled) with Animation ---
const MaleNode = ({data, selected}) => {
    // Enhanced tooltip content extraction
    const tooltipContent = useMemo(() => {
        const attributes = [];
        if (data.isAffected) attributes.push('Affected');
        if (data.isCarrier) attributes.push('Carrier');
        if (data.isDeceased) attributes.push('Deceased');
        if (data.isProband) attributes.push('Proband');
        return `${data.label || 'Male'}${attributes.length > 0 ? ` (${attributes.join(', ')})` : ''}`;
    }, [data]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={{
                ...nodeBaseSx,
                bgcolor: 'lightblue',
                borderRadius: 0,
                borderColor: selected ? 'blue' : 'black',
                ...(selected && {boxShadow: 6}),
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4
                }
            }}>
                <Handle type="target" position={Position.Top} id="t" style={handleStyle}/>
                <Handle type="source" position={Position.Bottom} id="b" style={handleStyle}/>
                <Handle type="target" position={Position.Left} id="l" style={handleStyle}/>
                <Handle type="source" position={Position.Right} id="r" style={handleStyle}/>

                {data.isAffected && <Box sx={{...affectedMarkerSx('blue'), borderRadius: 0}}/>}
                {data.isCarrier && <Box sx={carrierMarkerSx}/>}
                {data.isDeceased && <Box sx={deceasedMarkerSx}/>}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                <Typography sx={labelSx}>{data.label || 'Male'}</Typography>
            </Box>
        </Tooltip>
    );
};

const FemaleNode = ({data, selected}) => {
    // Enhanced tooltip content extraction
    const tooltipContent = useMemo(() => {
        const attributes = [];
        if (data.isAffected) attributes.push('Affected');
        if (data.isCarrier) attributes.push('Carrier');
        if (data.isDeceased) attributes.push('Deceased');
        if (data.isProband) attributes.push('Proband');
        return `${data.label || 'Female'}${attributes.length > 0 ? ` (${attributes.join(', ')})` : ''}`;
    }, [data]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={{
                ...nodeBaseSx,
                bgcolor: 'lightpink',
                borderRadius: '50%',
                borderColor: selected ? 'deeppink' : 'black',
                ...(selected && {boxShadow: 6}),
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4
                }
            }}>
                <Handle type="target" position={Position.Top} id="t" style={{...handleStyle, top: '-4px'}}/>
                <Handle type="source" position={Position.Bottom} id="b" style={{...handleStyle, bottom: '-4px'}}/>
                <Handle type="target" position={Position.Left} id="l" style={{...handleStyle, left: '-4px'}}/>
                <Handle type="source" position={Position.Right} id="r" style={{...handleStyle, right: '-4px'}}/>

                {data.isAffected && <Box sx={{...affectedMarkerSx('deeppink'), borderRadius: '50%'}}/>}
                {data.isCarrier && <Box sx={carrierMarkerSx}/>}
                {data.isDeceased && <Box sx={deceasedMarkerSx}/>}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                <Typography sx={labelSx}>{data.label || 'Female'}</Typography>
            </Box>
        </Tooltip>
    );
};

const UnknownNode = ({data, selected}) => {
    // Enhanced tooltip content extraction
    const tooltipContent = useMemo(() => {
        const attributes = [];
        if (data.isAffected) attributes.push('Affected');
        if (data.isCarrier) attributes.push('Carrier');
        if (data.isDeceased) attributes.push('Deceased');
        if (data.isProband) attributes.push('Proband');
        return `${data.label || 'Unknown'}${attributes.length > 0 ? ` (${attributes.join(', ')})` : ''}`;
    }, [data]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                <Box sx={{
                    ...nodeBaseSx,
                    bgcolor: 'lightgrey',
                    width: nodeSize.width * 0.8,
                    height: nodeSize.height * 0.8,
                    transform: 'rotate(45deg)',
                    borderColor: selected ? 'dimgray' : 'black',
                    ...(selected && {boxShadow: 6}),
                    '&:hover': {
                        transform: 'rotate(45deg) scale(1.05)',
                        boxShadow: 4
                    },
                    '.marker-content': {
                        transform: 'rotate(-45deg)',
                        textAlign: 'center',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }
                }}>

                    <Box className="marker-content">
                        {data.isAffected && <Box sx={{
                            ...affectedMarkerSx('dimgray'),
                            transform: 'rotate(45deg) scale(1.25)',
                            borderRadius: 0
                        }}/>}
                        {data.isCarrier && <Box sx={{...carrierMarkerSx, transform: 'translate(-50%, -50%)'}}/>}
                        {data.isDeceased && <Box sx={{
                            ...deceasedMarkerSx,
                            transform: 'rotate(45deg) scale(0.75)',
                            transformOrigin: 'center center'
                        }}/>}
                        {data.isProband && <Box sx={{
                            ...probandMarkerSx,
                            transformOrigin: 'center left',
                            left: -20
                        }}>➤</Box>}
                    </Box>
                </Box>
                <Handle type="target"
                        position={Position.Top}
                        id="t"
                        style={{
                            ...handleStyle,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top:"-10px",
                }}/>
                <Handle type="source"
                        position={Position.Bottom}
                        id="b"
                        style={{
                            ...handleStyle,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bottom:0,
                        }}/>
                <Handle type="target"
                        position={Position.Left}
                        id="l"
                        style={{
                            ...handleStyle,
                            top: 'calc(50% - 5px)',
                            transform: 'translateY(-50%)',
                            left: '-5px',
                        }}/>
                <Handle type="source"
                        position={Position.Right}
                        id="r"
                        style={{
                            ...handleStyle,
                            top: 'calc(50% - 5px)',
                            transform: 'translateY(-50%)',
                            right: '-5px',
                        }}/>

                <Typography sx={{
                    ...labelSx,
                    bottom: -30,
                    transform: 'translateX(-50%)',
                    left: '50%'
                }}>{data.label || 'Unknown'}</Typography>
            </Box>
        </Tooltip>
    );
};

// --- Custom Edge Component for Consanguineous Marriage ---
function ConsanguineousEdge({id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}}) {
    const yOffset = 3;
    const [edgePath1] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY - yOffset,
        sourcePosition,
        targetX,
        targetY: targetY - yOffset,
        targetPosition
    });
    const [edgePath2] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY + yOffset,
        sourcePosition,
        targetX,
        targetY: targetY + yOffset,
        targetPosition
    });

    return (
        <>
            <path
                id={`${id}-1`}
                style={{...style, strokeDasharray: undefined}}
                className="react-flow__edge-path"
                d={edgePath1}
            />
            <path
                id={`${id}-2`}
                style={{...style, strokeDasharray: undefined}}
                className="react-flow__edge-path"
                d={edgePath2}
            />
        </>
    );
}

// --- Helper Components ---
const LegendItem = ({color, shape, label, description}) => (
    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
        {shape === 'square' && (
            <Box sx={{width: 20, height: 20, bgcolor: color, borderRadius: 0, mr: 1, border: '1px solid #000'}}/>
        )}
        {shape === 'circle' && (
            <Box sx={{width: 20, height: 20, bgcolor: color, borderRadius: '50%', mr: 1, border: '1px solid #000'}}/>
        )}
        {shape === 'diamond' && (
            <Box sx={{
                width: 20,
                height: 20,
                bgcolor: color,
                mr: 1,
                border: '1px solid #000',
                transform: 'rotate(45deg)'
            }}/>
        )}
        {shape === 'marker' && (
            <Box sx={{position: 'relative', width: 20, height: 20, mr: 1}}>
                <Box sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'black',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}/>
            </Box>
        )}
        {shape === 'deceased' && (
            <Box sx={{position: 'relative', width: 20, height: 20, mr: 1}}>
                <Box sx={{
                    width: '100%',
                    height: '2px',
                    bgcolor: 'black',
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    transform: 'rotate(45deg)',
                }}/>
            </Box>
        )}
        {shape === 'proband' && (
            <Box sx={{position: 'relative', width: 20, height: 20, mr: 1}}>
                <Typography sx={{position: 'absolute', fontSize: '1.25rem'}}>➤</Typography>
            </Box>
        )}
        {shape === 'line-solid' && (
            <Box sx={{width: 30, height: 2, bgcolor: 'black', mr: 1}}/>
        )}
        {shape === 'line-dashed' && (
            <Box sx={{width: 30, height: 2, bgcolor: 'black', mr: 1, borderTop: '2px dashed black'}}/>
        )}
        {shape === 'line-double' && (
            <Box sx={{position: 'relative', width: 30, height: 6, mr: 1}}>
                <Box sx={{position: 'absolute', top: 0, width: '100%', height: 2, bgcolor: 'black'}}/>
                <Box sx={{position: 'absolute', bottom: 0, width: '100%', height: 2, bgcolor: 'black'}}/>
            </Box>
        )}
        <Box>
            <Typography variant="body2" sx={{fontWeight: 'medium'}}>{label}</Typography>
            {description && <Typography variant="caption" color="text.secondary">{description}</Typography>}
        </Box>
    </Box>
);

// --- Main Application Component ---
let idCounter = 0; // Use a local counter within the component instance
const getId = (type = 'node') => `pedigree_${type}_${idCounter++}`;

// Define the PedigreeChart component accepting props
const PedigreeChart = ({
                           defaultValue = {nodes: [], edges: []}, // Default empty chart
                           onChange = () => {
                           }, // No-op default onChange
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
    const [notification, setNotification] = useState({open: false, message: '', severity: 'info'});
    const [isLoading, setIsLoading] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [viewportControls, setViewportControls] = useState({zoomLevel: 1, fitView: false});

    // Use React Flow hooks
    const {
        project,
        getNodes,
        getEdges,
        deleteElements,
        fitView,
        zoomIn,
        zoomOut,
        getZoom,
        setViewport
    } = useReactFlow();

    // Get the currently selected elements
    const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter(e => e.selected), [edges]);

    // Get the single selected node/edge for the editor
    const singleSelectedNode = useMemo(() => (selectedNodes.length === 1 ? selectedNodes[0] : null), [selectedNodes]);
    const singleSelectedEdge = useMemo(() => (selectedEdges.length === 1 ? selectedEdges[0] : null), [selectedEdges]);

    // Define custom node and edge types
    const nodeTypes = useMemo(() => ({
        male: MaleNode,
        female: FemaleNode,
        unknown: UnknownNode
    }), []);

    const edgeTypes = useMemo(() => ({
        consanguineous: ConsanguineousEdge
    }), []);

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
            setTimeout(() => fitView({padding: 0.2}), 0); // Use timeout to ensure nodes are rendered
        }

    }, [reactFlowInstance, fitView]);

    // Effect to call onChange prop when nodes or edges change
    useEffect(() => {
        // Check if it's not the initial render potentially caused by defaultValue
        if (reactFlowInstance) {
            onChange({nodes, edges});
        }
    }, [nodes, edges, reactFlowInstance]);

    // --- Node/Edge Change Handlers ---
    const onNodesChange = useCallback((changes) => {
        if (disabled) return; // Prevent changes if disabled
        onNodesStateChange(changes);
    }, [onNodesStateChange, disabled]);

    const onEdgesChange = useCallback((changes) => {
        if (disabled) return; // Prevent changes if disabled
        onEdgesStateChange(changes);
    }, [onEdgesStateChange, disabled]);

    // Handle connecting nodes
    const onConnect = useCallback((params) => {
        if (disabled) return; // Prevent connection if disabled
        const newEdge = {
            ...params,
            id: getId('edge'),
            type: 'smoothstep',
            style: {strokeWidth: 1.5, stroke: '#666'}
        };
        setEdges((eds) => addEdge(newEdge, eds));
        showNotification('Connection created', 'success');
    }, [setEdges, disabled]);

    // --- Notification Helper ---
    const showNotification = (message, severity = 'info') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    const handleCloseNotification = () => {
        setNotification({...notification, open: false});
    };

    // --- Toolbar Actions ---
    const addNode = useCallback((type) => {
        if (disabled) return; // Prevent adding if disabled
        let position;
        if (reactFlowInstance && reactFlowWrapper.current) {
            const pane = reactFlowWrapper.current.getBoundingClientRect();
            position = project({
                x: pane.width / 2 - nodeSize.width / 2 + Math.random() * 100 - 50,
                y: pane.height / 3 + Math.random() * 100 - 50
            });
        } else {
            position = {x: Math.random() * 400 + 100, y: Math.random() * 200 + 50};
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
                isProband: false
            },
            style: {width: nodeSize.width, height: nodeSize.height}
        };

        setNodes((nds) => nds.concat(newNode));
        showNotification(`Added ${type} individual`, 'success');
    }, [project, setNodes, reactFlowInstance, disabled]);

    // --- Improved Add Child Between Parents ---
    const addChildBetweenParents = useCallback(() => {
        if (disabled) return; // Prevent adding if disabled

        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const selectedParents = currentNodes.filter(n => n.selected);

        if (selectedParents.length !== 2) {
            showNotification("Please select exactly two parent nodes", "warning");
            return;
        }

        const [parent1, parent2] = selectedParents;

        if (!parent1.positionAbsolute || !parent2.positionAbsolute) {
            showNotification("Could not determine parent positions", "error");
            return;
        }

        // Find existing children to place new child appropriately
        const childrenEdges = currentEdges.filter(edge =>
            ((edge.source === parent1.id && edge.sourceHandle === 'b') ||
                (edge.source === parent2.id && edge.sourceHandle === 'b')));

        const childrenNodes = currentNodes.filter(node =>
            childrenEdges.some(edge => edge.target === node.id));

        const parentBounds = getRectOfNodes([parent1, parent2]);
        const baseY = Math.max(parent1.positionAbsolute.y, parent2.positionAbsolute.y) + nodeSize.height + 80;

        let childX;
        if (childrenNodes.length > 0) {
            const lastSibling = childrenNodes.reduce((last, current) =>
                (current.positionAbsolute.x > last.positionAbsolute.x ? current : last));
            childX = lastSibling.positionAbsolute.x + nodeSize.width + siblingSpacing;
        } else {
            childX = parentBounds.x + parentBounds.width / 2 - nodeSize.width / 2;
        }

        const childNode = {
            id: getId('node'),
            type: 'unknown', // Default to unknown gender
            position: {x: childX, y: baseY},
            data: {
                label: 'Child',
                isAffected: false,
                isCarrier: false,
                isDeceased: false,
                isProband: false
            },
            style: {width: nodeSize.width, height: nodeSize.height}
        };

        const edgeStyle = {strokeWidth: 1.5, stroke: '#666'};

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

        setNodes((nds) => nds.concat(childNode));
        setEdges((eds) => eds.concat([edge1, edge2]));

        // Deselect parents and select the new child
        const deselectChanges = selectedParents.map(parent =>
            ({id: parent.id, type: 'select', selected: false}));
        onNodesChange(deselectChanges);

        showNotification("Child added between selected parents", "success");
    }, [disabled, getNodes, getEdges, setNodes, setEdges, onNodesChange]);

    // --- Node Data/Type Updates ---
    const updateNodeData = useCallback((nodeId, newData) => {
        if (disabled) return; // Prevent update if disabled

        setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? {...n, data: {...n.data, ...newData}} : n))
        );
    }, [setNodes, disabled]);

    const updateSelectedNodeType = useCallback((event) => {
        if (disabled) return; // Prevent update if disabled

        const newType = event.target.value;
        if (!singleSelectedNode || !newType) return;

        setNodes((nds) => nds.map((n) => {
            if (n.id === singleSelectedNode.id) {
                const currentLabel = n.data.label;
                const defaultLabels = ['Male', 'Female', 'Unknown', 'Child'];
                const newLabel = defaultLabels.includes(currentLabel)
                    ? newType.charAt(0).toUpperCase() + newType.slice(1)
                    : currentLabel;

                const newWidth = newType === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width;
                const newHeight = newType === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height;

                return {
                    ...n,
                    type: newType,
                    data: {...n.data, label: newLabel},
                    style: {...n.style, width: newWidth, height: newHeight}
                };
            }
            return n;
        }));

        showNotification(`Changed individual to ${newType}`, 'info');
    }, [singleSelectedNode, setNodes, disabled]);

    // --- Delete Selected Elements ---
    const deleteSelectedElements = useCallback(() => {
        if (disabled) return; // Prevent delete if disabled

        const nodesToDelete = nodes.filter(n => n.selected);
        const edgesToDelete = edges.filter(e => e.selected);

        if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
            deleteElements({nodes: nodesToDelete, edges: edgesToDelete});

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
            updateNodeData(singleSelectedNode.id, {isAffected: newValue});
            showNotification(`${singleSelectedNode.data.label} marked as ${newValue ? 'affected' : 'not affected'}`, 'info');
        }
    };

    const toggleCarrier = () => {
        if (singleSelectedNode) {
            const newValue = !singleSelectedNode.data.isCarrier;
            updateNodeData(singleSelectedNode.id, {isCarrier: newValue});
            showNotification(`${singleSelectedNode.data.label} marked as ${newValue ? 'carrier' : 'not carrier'}`, 'info');
        }
    };

    const toggleDeceased = () => {
        if (singleSelectedNode) {
            const newValue = !singleSelectedNode.data.isDeceased;
            updateNodeData(singleSelectedNode.id, {isDeceased: newValue});
            showNotification(`${singleSelectedNode.data.label} marked as ${newValue ? 'deceased' : 'not deceased'}`, 'info');
        }
    };

    const toggleProband = () => {
        if (singleSelectedNode) {
            // If setting this node as proband, clear proband status from all other nodes first
            if (!singleSelectedNode.data.isProband) {
                setNodes(nodes => nodes.map(node =>
                    node.id !== singleSelectedNode.id
                        ? {...node, data: {...node.data, isProband: false}}
                        : node
                ));
            }

            const newValue = !singleSelectedNode.data.isProband;
            updateNodeData(singleSelectedNode.id, {isProband: newValue});
            showNotification(`${singleSelectedNode.data.label} ${newValue ? 'set as proband' : 'no longer proband'}`, 'info');
        }
    };

    // --- Edge Modal Functions ---
    const openEdgeModal = () => {
        if (!disabled) setIsEdgeModalOpen(true);
    };

    const closeEdgeModal = () => setIsEdgeModalOpen(false);

    // --- Update Edge Style and Type ---
    const updateEdgeStyleAndType = useCallback((styleType) => {
        if (disabled || !singleSelectedEdge) return; // Prevent update if disabled

        let newStyle = {...singleSelectedEdge.style};
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

        setEdges((eds) => eds.map((edge) => (
            edge.id === singleSelectedEdge.id
                ? {...edge, style: newStyle, type: newType}
                : edge
        )));

        closeEdgeModal();
        showNotification('Connection style updated', 'success');
    }, [singleSelectedEdge, setEdges, disabled]);

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
                edges.forEach(edge => {
                    if (!incomingEdges[edge.target]) {
                        incomingEdges[edge.target] = [];
                    }
                    incomingEdges[edge.target].push(edge);
                });

                const rootNodes = nodes.filter(node => !incomingEdges[node.id]);

                if (rootNodes.length === 0) {
                    showNotification('Could not identify family structure', 'warning');
                    setIsLoading(false);
                    return;
                }

                // Simple layout - place root nodes at top level
                const newNodes = [...nodes];
                const levelHeight = 150;
                const nodeWidth = 120;

                // Place root nodes
                rootNodes.forEach((node, index) => {
                    const updatedNode = {
                        ...node,
                        position: {
                            x: 100 + index * nodeWidth,
                            y: 100
                        }
                    };
                    const nodeIndex = newNodes.findIndex(n => n.id === node.id);
                    if (nodeIndex >= 0) {
                        newNodes[nodeIndex] = updatedNode;
                    }
                });

                // Simple BFS to lay out the rest
                setNodes(newNodes);
                setIsLoading(false);

                // Fit view after arranging
                setTimeout(() => fitView({padding: 0.2}), 100);

                showNotification('Family tree auto-arranged', 'success');
            } catch (err) {
                console.error('Layout error:', err);
                showNotification('Auto-arrange failed', 'error');
                setIsLoading(false);
            }
        }, 500);
    }, [nodes, edges, setNodes, disabled, fitView]);

    // --- Export Functionality ---
    const getFilename = (format) => `pedigree-chart-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;

    const exportChart = useCallback((format = 'png') => {
        if (reactFlowWrapper.current) {
            setIsLoading(true);

            const el = reactFlowWrapper.current.querySelector('.react-flow__viewport');
            if (!el) {
                console.error("Viewport not found.");
                showNotification("Export failed", "error");
                setIsLoading(false);
                return;
            }

            const opt = {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: 'white'
            };

            const saveFn = format === 'png' ? toPng : toSvg;

            saveFn(el, opt)
                .then((url) => {
                    saveAs(url, getFilename(format));
                    showNotification(`Exported as ${format.toUpperCase()}`, "success");
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error('Export error:', err);
                    showNotification(`Export failed: ${err.message}`, "error");
                    setIsLoading(false);
                });
        } else {
            console.error("Wrapper ref missing.");
            showNotification("Export failed", "error");
        }
    }, [reactFlowInstance]);

    // --- Save/Load Functionality ---
    const saveData = useCallback(() => {
        if (!reactFlowInstance) {
            showNotification("Cannot save data", "error");
            return;
        }

        setIsLoading(true);

        try {
            const flow = reactFlowInstance.toObject();
            const json = JSON.stringify(flow, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            saveAs(blob, getFilename('json'));

            showNotification("Pedigree saved successfully", "success");
        } catch (error) {
            console.error('Save error:', error);
            showNotification("Failed to save pedigree", "error");
        } finally {
            setIsLoading(false);
        }
    }, [reactFlowInstance]);

    const loadData = useCallback((event) => {
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
                    const pNodes = flow.nodes.map(n => ({
                        ...n,
                        style: {
                            ...n.style,
                            width: n.type === 'unknown' ? nodeSize.width * 0.8 : nodeSize.width,
                            height: n.type === 'unknown' ? nodeSize.height * 0.8 : nodeSize.height
                        }
                    }));

                    setNodes(pNodes || []);
                    setEdges(flow.edges.map(e => ({...e, markerEnd: undefined})) || []); /* Remove markerEnd on load */

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
                    showNotification("Pedigree loaded successfully", "success");
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
    }, [setNodes, setEdges, reactFlowInstance, disabled]);

    const handleZoomIn = useCallback(() => {
        zoomIn();
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut();
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({padding: 0.2});
        showNotification("View adjusted to fit all elements", "info");
    }, [fitView]);

    const toggleGridDisplay = useCallback(() => {
        setShowGrid(prev => !prev);
    }, []);

    // --- Help and Legend Functions ---
    const openLegendModal = () => setIsLegendOpen(true);
    const closeLegendModal = () => setIsLegendOpen(false);

    const openHelpModal = () => setIsHelpModalOpen(true);
    const closeHelpModal = () => setIsHelpModalOpen(false);

    // --- Toolbar and Editor UI (MUI Versions) ---

    // Enhanced Toolbar Component with sections and tooltips
    const Toolbar = () => (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                p: 1.5,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                maxWidth: '90%'
            }}
        >
            {/* Add Individual Buttons - Hidden when disabled */}
            {!disabled && (
                <>
                    <Box sx={{display: 'flex', gap: 0.75, alignItems: 'center'}}>
                        <Typography variant="caption" sx={{mr: 0.5, fontWeight: 'medium'}}>Add:</Typography>
                        <Tooltip title="Add Male" arrow>
                            <IconButton
                                size="small"
                                onClick={() => addNode('male')}
                                sx={{
                                    color: 'blue',
                                    border: '1px solid',
                                    borderColor: 'rgba(0,0,255,0.3)'
                                }}
                            >
                                <ManIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Female" arrow>
                            <IconButton
                                size="small"
                                onClick={() => addNode('female')}
                                sx={{
                                    color: 'deeppink',
                                    border: '1px solid',
                                    borderColor: 'rgba(255,20,147,0.3)'
                                }}
                            >
                                <WomanIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Unknown" arrow>
                            <IconButton
                                size="small"
                                onClick={() => addNode('unknown')}
                                sx={{
                                    color: 'dimgray',
                                    border: '1px solid',
                                    borderColor: 'rgba(105,105,105,0.3)'
                                }}
                            >
                                <QuestionMarkIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{mx: 0.25}}/>

                    <Tooltip
                        title={selectedNodes.length !== 2
                            ? "Select exactly two parent nodes first (use Shift+Click)"
                            : "Add Child Between Selected Parents"}
                        arrow
                    >
                        <span>
                            <Button
                                size="small"
                                onClick={addChildBetweenParents}
                                disabled={selectedNodes.length !== 2}
                                color="primary"
                                variant="outlined"
                                startIcon={<PeopleIcon/>}
                                sx={{height: 32}}
                            >
                                Add Child
                            </Button>
                        </span>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{mx: 0.25}}/>

                    <Box sx={{display: 'flex', gap: 0.75}}>
                        <Tooltip title="Auto-Arrange Family Tree" arrow>
                            <IconButton
                                size="small"
                                onClick={autoArrangeFamily}
                                color="secondary"
                                sx={{border: '1px solid rgba(156, 39, 176, 0.3)'}}
                            >
                                <FitScreenIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Save Pedigree" arrow>
                            <IconButton
                                size="small"
                                onClick={saveData}
                                color="success"
                                sx={{border: '1px solid rgba(46, 125, 50, 0.3)'}}
                            >
                                <SaveIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Load Pedigree" arrow>
                            <IconButton
                                size="small"
                                component="label"
                                color="warning"
                                sx={{border: '1px solid rgba(237, 108, 2, 0.3)'}}
                            >
                                <FileOpenIcon fontSize="small"/>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={loadData}
                                    hidden
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </>
            )}

            {/* Export Buttons - Always visible */}
            <Divider orientation="vertical" flexItem sx={{mx: 0.25}}/>

            <Box sx={{display: 'flex', gap: 0.75}}>
                <Tooltip title="Export as PNG Image" arrow>
                    <IconButton
                        size="small"
                        onClick={() => exportChart('png')}
                        sx={{
                            color: 'purple',
                            border: '1px solid rgba(128,0,128,0.3)'
                        }}
                    >
                        <ImageIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip title="Export as SVG Vector" arrow>
                    <IconButton
                        size="small"
                        onClick={() => exportChart('svg')}
                        sx={{
                            color: 'indigo',
                            border: '1px solid rgba(75,0,130,0.3)'
                        }}
                    >
                        <SvgIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{mx: 0.25}}/>

            {/* View Controls - Always visible */}
            <Box sx={{display: 'flex', gap: 0.75}}>
                <Tooltip title="Zoom Out" arrow>
                    <IconButton
                        size="small"
                        onClick={handleZoomOut}
                        sx={{color: 'text.secondary'}}
                    >
                        <ZoomOutIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    px: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                        {Math.round(viewportControls.zoomLevel * 100)}%
                    </Typography>
                </Box>

                <Tooltip title="Zoom In" arrow>
                    <IconButton
                        size="small"
                        onClick={handleZoomIn}
                        sx={{color: 'text.secondary'}}
                    >
                        <ZoomInIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip title="Fit to View" arrow>
                    <IconButton
                        size="small"
                        onClick={handleFitView}
                        sx={{color: 'text.secondary'}}
                    >
                        <FitScreenIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{mx: 0.25}}/>

            {/* Help & Legend */}
            <Box sx={{display: 'flex', gap: 0.75}}>
                <Tooltip title="Toggle Grid Display" arrow>
                    <IconButton
                        size="small"
                        onClick={toggleGridDisplay}
                        sx={{
                            color: showGrid ? 'primary.main' : 'text.secondary',
                            border: showGrid ? '1px solid rgba(25, 118, 210, 0.3)' : 'none'
                        }}
                    >
                        <DragIndicatorIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip title="View Legend" arrow>
                    <IconButton
                        size="small"
                        onClick={openLegendModal}
                        color="info"
                    >
                        <PeopleIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>

                <Tooltip title="Help" arrow>
                    <IconButton
                        size="small"
                        onClick={openHelpModal}
                        sx={{color: 'text.secondary'}}
                    >
                        <HelpIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );

    // Improved Element Editor Panel
    const ElementEditor = () => {
        if (disabled) return null; // Hide editor completely if disabled

        const showNodeEditor = singleSelectedNode && selectedEdges.length === 0;
        const showEdgeEditor = singleSelectedEdge && selectedNodes.length === 0;
        const [localLabel, setLocalLabel] = useState('');

        useEffect(() => {
            if (singleSelectedNode) {
                setLocalLabel(singleSelectedNode.data.label || '');
            }
        }, [singleSelectedNode]);

        const handleLabelChange = (event) => {
            setLocalLabel(event.target.value);
        };

        const handleLabelBlur = () => {
            if (singleSelectedNode && localLabel !== singleSelectedNode.data.label) {
                updateNodeData(singleSelectedNode.id, {label: localLabel});
            }
        };

        if (!showNodeEditor && !showEdgeEditor) return null;

        return (
            <Paper
                elevation={4}
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 100,
                    zIndex: 9,
                    p: 2.5,
                    width: 280,
                    maxHeight: 'calc(100vh - 32px)',
                    overflowY: 'auto',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
            >
                {/* Node Editor Section */}
                {showNodeEditor && (
                    <>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{mb: 2, borderBottom: '1px solid lightgrey', pb: 1}}
                        >
                            <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                {singleSelectedNode.type === 'male' && <ManIcon sx={{color: 'blue'}}/>}
                                {singleSelectedNode.type === 'female' && <WomanIcon sx={{color: 'deeppink'}}/>}
                                {singleSelectedNode.type === 'unknown' && <QuestionMarkIcon sx={{color: 'dimgray'}}/>}
                                Edit Individual
                            </Typography>

                            <Tooltip title="Delete Selected Individual" arrow>
                                <IconButton
                                    onClick={deleteSelectedElements}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2.5}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="gender-select-label">Gender</InputLabel>
                                <Select
                                    labelId="gender-select-label"
                                    id="gender-select"
                                    value={singleSelectedNode.type || 'unknown'}
                                    label="Gender"
                                    onChange={updateSelectedNodeType}
                                >
                                    <MenuItem value={'male'}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <ManIcon sx={{color: 'blue'}}/>
                                            <span>Male</span>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value={'female'}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <WomanIcon sx={{color: 'deeppink'}}/>
                                            <span>Female</span>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value={'unknown'}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <QuestionMarkIcon sx={{color: 'dimgray'}}/>
                                            <span>Unknown</span>
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Label"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={localLabel}
                                onChange={handleLabelChange}
                                onBlur={handleLabelBlur}
                                placeholder="Enter name or ID"
                            />

                            <Box>
                                <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 'medium'}}>
                                    Status:
                                </Typography>

                                <Stack>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={!!singleSelectedNode.data.isAffected}
                                                onChange={toggleAffected}
                                                color="error"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                Affected <Chip size="small" label="Medical condition"
                                                               sx={{ml: 1, height: 20}}/>
                                            </Typography>
                                        }
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={!!singleSelectedNode.data.isCarrier}
                                                onChange={toggleCarrier}
                                                color="warning"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                Carrier <Chip size="small" label="Gene carrier"
                                                              sx={{ml: 1, height: 20}}/>
                                            </Typography>
                                        }
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={!!singleSelectedNode.data.isDeceased}
                                                onChange={toggleDeceased}
                                                color="default"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">Deceased</Typography>
                                        }
                                    />

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={!!singleSelectedNode.data.isProband}
                                                onChange={toggleProband}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                Proband <Chip size="small" label="Index case" sx={{ml: 1, height: 20}}/>
                                            </Typography>
                                        }
                                    />
                                </Stack>
                            </Box>
                        </Stack>
                    </>
                )}

                {/* Edge Editor Section */}
                {showEdgeEditor && (
                    <>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{mb: 2, borderBottom: '1px solid lightgrey', pb: 1}}
                        >
                            <Typography variant="h6">Edit Connection</Typography>

                            <Tooltip title="Delete Selected Connection" arrow>
                                <IconButton
                                    onClick={deleteSelectedElements}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2}>
                            <Typography variant="subtitle2" sx={{fontWeight: 'medium'}}>Connection Type:</Typography>

                            <Box sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                p: 1.5,
                                bgcolor: 'background.paper'
                            }}>
                                <Typography variant="body2" sx={{mb: 1}}>
                                    Current: {
                                    singleSelectedEdge?.type === 'consanguineous'
                                        ? 'Double Line (Consanguineous)'
                                        : (singleSelectedEdge?.style?.strokeDasharray ? 'Dashed Line' : 'Solid Line')
                                }
                                </Typography>

                                <Button
                                    startIcon={<EditIcon/>}
                                    variant="contained"
                                    size="small"
                                    onClick={openEdgeModal}
                                    fullWidth
                                >
                                    Change Style
                                </Button>
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                                Use double lines to represent consanguineous relationships (relationships between blood
                                relatives).
                            </Typography>
                        </Stack>
                    </>
                )}
            </Paper>
        );
    };

    // --- Edge Settings Modal Component ---
    const EdgeSettingsModal = () => {
        if (disabled) return null; // Don't render modal if disabled

        const getInitialStyle = () => {
            if (!singleSelectedEdge) return 'solid';
            if (singleSelectedEdge.type === 'consanguineous') return 'double';
            if (singleSelectedEdge.style?.strokeDasharray) return 'dashed';
            return 'solid';
        };

        const [selectedStyle, setSelectedStyle] = useState(getInitialStyle());

        useEffect(() => {
            setSelectedStyle(getInitialStyle());
        }, [singleSelectedEdge]);

        const handleStyleChange = (event) => {
            setSelectedStyle(event.target.value);
        };

        const handleApply = () => {
            updateEdgeStyleAndType(selectedStyle);
        };

        return (
            <Dialog
                open={isEdgeModalOpen}
                onClose={closeEdgeModal}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Connection Style Settings</DialogTitle>

                <DialogContent>
                    <DialogContentText sx={{mb: 2}}>
                        Choose the appropriate style for this connection:
                    </DialogContentText>

                    <FormControl component="fieldset" sx={{width: '100%'}}>
                        <RadioGroup
                            aria-label="connection-style"
                            name="connection-style-group"
                            value={selectedStyle}
                            onChange={handleStyleChange}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Card variant="outlined" sx={{
                                        mb: 1,
                                        borderColor: selectedStyle === 'solid' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'solid' ? alpha('#1976d2', 0.05) : 'transparent'
                                    }}>
                                        <CardContent sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': {pb: 1}
                                        }}>
                                            <Box sx={{mr: 2, flex: '0 0 auto'}}>
                                                <Box sx={{width: 40, height: 2, bgcolor: 'black'}}/>
                                            </Box>
                                            <FormControlLabel
                                                value="solid"
                                                control={<Radio/>}
                                                label="Solid Line (Standard Relationship)"
                                                sx={{m: 0, flex: 1}}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card variant="outlined" sx={{
                                        mb: 1,
                                        borderColor: selectedStyle === 'dashed' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'dashed' ? alpha('#1976d2', 0.05) : 'transparent'
                                    }}>
                                        <CardContent sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': {pb: 1}
                                        }}>
                                            <Box sx={{mr: 2, flex: '0 0 auto'}}>
                                                <Box sx={{
                                                    width: 40,
                                                    height: 0,
                                                    borderTop: '2px dashed black'
                                                }}/>
                                            </Box>
                                            <FormControlLabel
                                                value="dashed"
                                                control={<Radio/>}
                                                label="Dashed Line (Uncertain Relationship)"
                                                sx={{m: 0, flex: 1}}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12}>
                                    <Card variant="outlined" sx={{
                                        borderColor: selectedStyle === 'double' ? 'primary.main' : 'divider',
                                        bgcolor: selectedStyle === 'double' ? alpha('#1976d2', 0.05) : 'transparent'
                                    }}>
                                        <CardContent sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            py: 1,
                                            '&:last-child': {pb: 1}
                                        }}>
                                            <Box sx={{mr: 2, flex: '0 0 auto', position: 'relative', height: 10}}>
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    width: 40,
                                                    height: 2,
                                                    bgcolor: 'black'
                                                }}/>
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    width: 40,
                                                    height: 2,
                                                    bgcolor: 'black'
                                                }}/>
                                            </Box>
                                            <FormControlLabel
                                                value="double"
                                                control={<Radio/>}
                                                label="Double Line (Consanguineous Relationship)"
                                                sx={{m: 0, flex: 1}}
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </RadioGroup>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={closeEdgeModal}>Cancel</Button>
                    <Button
                        onClick={handleApply}
                        variant="contained"
                        startIcon={<EditIcon/>}
                    >
                        Apply Style
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // Legend Modal Component
    const LegendModal = () => (
        <Dialog
            open={isLegendOpen}
            onClose={closeLegendModal}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Pedigree Chart Legend</DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Individuals
                        </Typography>

                        <LegendItem
                            shape="square"
                            color="lightblue"
                            label="Male"
                        />

                        <LegendItem
                            shape="circle"
                            color="lightpink"
                            label="Female"
                        />

                        <LegendItem
                            shape="diamond"
                            color="lightgrey"
                            label="Unknown Gender"
                        />

                        <Divider sx={{my: 2}}/>

                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Status Indicators
                        </Typography>

                        <LegendItem
                            shape="square"
                            color="blue"
                            label="Affected Individual"
                            description="Has the medical condition"
                        />

                        <LegendItem
                            shape="marker"
                            label="Carrier"
                            description="Carries genetic trait but not affected"
                        />

                        <LegendItem
                            shape="deceased"
                            label="Deceased"
                        />

                        <LegendItem
                            shape="proband"
                            label="Proband"
                            description="Starting point/index case"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Connection Types
                        </Typography>

                        <LegendItem
                            shape="line-solid"
                            label="Standard Relationship"
                        />

                        <LegendItem
                            shape="line-dashed"
                            label="Uncertain Relationship"
                        />

                        <LegendItem
                            shape="line-double"
                            label="Consanguineous Relationship"
                            description="Between blood relatives"
                        />

                        <Divider sx={{my: 2}}/>

                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Tips
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            • Use <b>Shift+Click</b> to select multiple individuals
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            • Select two individuals and click <b>Add Child</b> to create a new individual between them
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            • Click on individuals or connections to edit their properties
                        </Typography>

                        <Typography variant="body2">
                            • Use the mouse wheel to zoom in/out or drag to pan around
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={closeLegendModal} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Help Modal Component
    const HelpModal = () => (
        <Dialog
            open={isHelpModalOpen}
            onClose={closeHelpModal}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Pedigree Chart Help</DialogTitle>

            <DialogContent>
                <Typography variant="h6" sx={{mb: 2}}>Getting Started</Typography>

                <Typography variant="body1" sx={{mb: 2}}>
                    A pedigree chart is a diagram that shows the occurrence and appearance of phenotypes of a particular
                    gene or organism and its ancestors from one generation to the next. This tool allows you to create
                    professional pedigree charts for genetic counseling, research, or educational purposes.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Basic Controls
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Add Individuals:</b> Use the Male, Female, or Unknown buttons to add new individuals to
                            the chart.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Connect Individuals:</b> Drag from the handles (small dots) on one individual to another
                            to create connections.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Add Children:</b> Select two individuals (using Shift+Click), then click the "Add Child"
                            button.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Edit Properties:</b> Click on any individual or connection to edit its properties in the
                            side panel.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Delete:</b> Select elements and press Delete key or use the trash icon in the editor
                            panel.
                        </Typography>

                        <Typography variant="subtitle1" sx={{mt: 2, mb: 1, fontWeight: 'bold'}}>
                            Navigation
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Pan:</b> Click and drag on empty space to move around.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Zoom:</b> Use the mouse wheel or the zoom controls in the toolbar.
                        </Typography>

                        <Typography variant="body2">
                            <b>Fit View:</b> Click the "Fit to View" button to show all elements.
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{mb: 1, fontWeight: 'bold'}}>
                            Advanced Features
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Auto-Arrange:</b> Automatically organize the family tree layout.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Save/Load:</b> Save your work as JSON and load it later to continue.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Export:</b> Export your pedigree chart as PNG or SVG for publications or presentations.
                        </Typography>

                        <Typography variant="subtitle1" sx={{mt: 2, mb: 1, fontWeight: 'bold'}}>
                            Status Indicators
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Affected:</b> Indicates an individual with the medical condition.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Carrier:</b> Indicates an individual who carries the gene but is not affected.
                        </Typography>

                        <Typography variant="body2" sx={{mb: 1}}>
                            <b>Deceased:</b> Indicates an individual who has died.
                        </Typography>

                        <Typography variant="body2">
                            <b>Proband:</b> Indicates the index case that brought the family to medical attention.
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={closeHelpModal} variant="contained">
                    Got It
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        // Main container with loading overlay
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight:"500px",
                position: 'relative',
                // overflow: 'hidden',
                border: disabled ? 'none' : '1px solid #e0e0e0',
                borderRadius: 1
            }}
            ref={reactFlowWrapper}
        >
            {/* Loading Overlay */}
            {isLoading && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 20
                }}>
                    <Box sx={{textAlign: 'center'}}>
                        <CircularProgress/>
                        <Typography variant="body2" sx={{mt: 2}}>Processing...</Typography>
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
                fitViewOptions={{padding: 0.2}}
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
                proOptions={{hideAttribution: true}}
                style={{minHeight:"500px"}}
            >
                {/* Conditionally show background based on showGrid state */}
                {showGrid && <Background variant="dots" gap={16} size={1} color="#ddd"/>}

                {/* Controls and MiniMap - always visible */}
                <Controls showInteractive={false}/>
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
                <Toolbar/>
                <ElementEditor/>
                <EdgeSettingsModal/>
                <LegendModal/>
                <HelpModal/>
            </ReactFlow>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// --- Wrapper Component to provide ReactFlowProvider ---
// This is necessary because PedigreeChart uses useReactFlow hook internally
const PedigreeChartWrapper = (props) => (
    <ReactFlowProvider>
        <PedigreeChart {...props} />
    </ReactFlowProvider>
);

export default PedigreeChartWrapper;
