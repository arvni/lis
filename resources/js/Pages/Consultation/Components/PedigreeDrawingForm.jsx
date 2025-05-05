import React, {useRef, useState, useEffect} from 'react';
import PedigreeChart from "pedigree-chart";
import {
    Grid,
    Typography,
    Box,
    ToggleButtonGroup,
    ToggleButton,
    IconButton,
    Card,
    Tooltip,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Divider,
    TextField,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    FormControlLabel,
    Checkbox,
    Paper, Chip
} from "@mui/material";

// Icons
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import PersonIcon from '@mui/icons-material/Person';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import PeopleIcon from '@mui/icons-material/People';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import LinkIcon from '@mui/icons-material/Link';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChipIcon from '@mui/icons-material/Abc';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * Enhanced pedigree drawing form component
 *
 * @param {Object} props Component properties
 * @param {Function} props.onChange Handler for when pedigree data changes
 * @param {string} props.defaultValue Default pedigree data JSON
 * @returns {JSX.Element} Enhanced PedigreeDrawingForm component
 */
const PedigreeDrawingForm = ({onChange, defaultValue, onClose}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Reference for the div that contains our canvas
    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const [stageSize, setStageSize] = useState({width: 800, height: 600});

    // Pedigree chart state
    const [chart, setChart] = useState(null);
    const [tool, setTool] = useState('select');
    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTabValue, setCurrentTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'success'});
    const [selectedPedigree, setSelectedPedigree] = useState(null);
    const [connectMode, setConnectMode] = useState(null);
    const [connectSource, setConnectSource] = useState(null);

    // Menu state
    const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null);

    // Modal visibility
    const [pedigreeFormOpen, setPedigreeFormOpen] = useState(false);

    // Pedigree form state
    const [pedigreeForm, setPedigreeForm] = useState({
        name: '',
        gender: 'unknown',
        age: '',
        deceased: false,
        diseaseStatus: 'unaffected',
        carrierStatus: false,
        diseaseColor: '#A42562',
        labels: []
    });

    // Current label being added
    const [currentLabel, setCurrentLabel] = useState({value: ''});

    // Handle window resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = isFullscreen
                    ? window.innerHeight - 150
                    : Math.min(600, window.innerHeight - 300);
                setStageSize({
                    width: width,
                    height: height
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize(); // Initial size

        return () => window.removeEventListener('resize', updateSize);
    }, [isFullscreen]);

    // Initialize pedigree chart
    useEffect(() => {
        if (containerRef.current && !chart) {
            const newChart = new PedigreeChart();
            newChart.setDiagram("pedigree-canvas");
            newChart.setConfig({
                width: containerRef.current.offsetWidth,
                height: isFullscreen ? window.innerHeight - 150 : Math.min(600, window.innerHeight - 300),
                dragEnabled: true,
                panEnabled: true,
            });

            // Set up event handlers
            newChart.on("pedigree-click", (pedigree) => {
                if (connectMode) {
                    // If we're in connect mode and have a source, connect the pedigrees
                    if (connectSource && connectSource.id !== pedigree.id) {
                        newChart.connect(connectSource, pedigree, connectMode);
                        setConnectMode(null);
                        setConnectSource(null);

                        setSnackbar({
                            open: true,
                            message: `Connected pedigrees with ${connectMode} relationship`,
                            severity: 'success'
                        });
                    } else {
                        // Set this as the source
                        setConnectSource(pedigree);
                        setSnackbar({
                            open: true,
                            message: 'Now select the second pedigree to connect',
                            severity: 'info'
                        });
                    }
                } else {
                    console.log(pedigree, "here 10", newChart,);
                    // Regular selection
                    setSelectedPedigree(pedigree);
                    // Populate the form with the pedigree's data
                    populateFormFromPedigree(pedigree);
                    setPedigreeFormOpen(true);
                }
            });

            newChart.on("diagram-click", (event) => {
                // If we're in add mode, create a new pedigree at the click position
                if (tool === 'add') {
                    const pos = event.evt.offsetX ?
                        {x: event.evt.offsetX, y: event.evt.offsetY} :
                        {x: event.evt.touches[0].clientX, y: event.evt.touches[0].clientY};

                    // Create a new unknown pedigree
                    const newPedigree = newChart.create('unknown', pos.x, pos.y);

                    // Select the new pedigree and open the form
                    setSelectedPedigree(newPedigree);

                    console.log(newPedigree, "here 11", chart);

                    // Reset form to defaults
                    setPedigreeForm({
                        name: '',
                        gender: 'unknown',
                        age: '',
                        deceased: false,
                        diseaseStatus: 'unaffected',
                        carrierStatus: false,
                        diseaseColor: '#A42562',
                        labels: []
                    });
                    setPedigreeFormOpen(true);
                } else {
                    // Deselect in other modes
                    setSelectedPedigree(null);
                }

                // Cancel connect mode if active
                if (connectMode) {
                    setConnectMode(null);
                    setConnectSource(null);
                }
            });

            // Create an initial pedigree
            const initialPedigree = newChart.create('unknown',
                stageSize.width / 2,
                stageSize.height / 2
            );
            initialPedigree.setLabel([{
                value: "Click to edit",
                order: 0
            }])

            setChart(newChart);

            // If we have default value, try to load it
            if (defaultValue) {
                try {
                    const data = JSON.parse(defaultValue);
                    // TODO: Load saved pedigree data
                } catch (e) {
                    console.error("Could not parse default pedigree data", e);
                }
            }
        }
    }, [containerRef.current]);

    // Update chart size when stage size changes
    useEffect(() => {
        if (chart) {
            chart.setConfig({
                width: stageSize.width,
                height: stageSize.height
            });
        }
    }, [stageSize, chart]);

    // Populate form from pedigree
    const populateFormFromPedigree = (pedigree) => {
        if (!pedigree) return;
        const labels = pedigree.label.labelData || [];

        // Check if pedigree has disease shapes (carrier status)
        const diseaseShapes = pedigree.shapes || [];
        const hasCarrierMark = diseaseShapes.length > 0;
        const diseaseColor = hasCarrierMark && diseaseShapes[0]?.color
            ? '#' + diseaseShapes[0].color
            : '#A42562';

        setPedigreeForm({
            name: pedigree?.name || "",
            gender: pedigree.type || 'unknown',
            age: pedigree.age || 1,
            deceased: pedigree.isDeceased || false,
            diseaseStatus: pedigree.isAffected ? 'affected' : hasCarrierMark ? 'carrier' : 'unaffected',
            carrierStatus: hasCarrierMark,
            diseaseColor,
            labels,
            dragEnabled: false
        });
    };

    // Save pedigree from form data
    const savePedigreeFromForm = () => {
        if (!selectedPedigree) return;

        // Update gender
        if (pedigreeForm.gender !== selectedPedigree.type) {
            selectedPedigree.type = pedigreeForm.gender;
        }

        // Update disease status
        if (pedigreeForm.diseaseStatus === 'affected') {
            selectedPedigree.isAffected = true;
            // Remove any disease shapes if switching from carrier to affected
            selectedPedigree.shapes = [];
        } else {
            selectedPedigree.isAffected = false;

            // Update carrier status
            if (pedigreeForm.diseaseStatus === 'carrier' && pedigreeForm.carrierStatus) {
                // Remove existing disease shapes first
                selectedPedigree.shapes = [];
                // Then add the new one with the selected color
                selectedPedigree.addDiseaseShape('dot', pedigreeForm.diseaseColor.replace('#', ''));
            } else {
                // Remove all disease shapes
                selectedPedigree.shapes = [];
            }
        }

        // Update deceased status
        selectedPedigree.isDeceased = pedigreeForm.deceased;

        // Update labels
        const labelObj = {};
        pedigreeForm.labels.forEach(label => {
            labelObj[label.key] = label.value;
        });

        if (pedigreeForm.name) labelObj.name = pedigreeForm.name;
        if (pedigreeForm.age) labelObj.age = pedigreeForm.age;

        console.log(labelObj, "here 1", selectedPedigree, chart);
        // selectedPedigree.label = labelObj;

        // Close form
        setPedigreeFormOpen(false);

        // Update the drawing
        if (typeof onChange === 'function') {
            onChange(exportPedigreeData());
        }

        setSnackbar({
            open: true,
            message: 'Pedigree updated successfully!',
            severity: 'success'
        });
    };

    // Add a new label to the form
    const handleAddLabel = () => {
        if (currentLabel.value) {
            console.log(pedigreeForm, "here 2")
            setPedigreeForm({
                ...pedigreeForm,
                labels: [...pedigreeForm.labels, {...currentLabel}]
            });
            setCurrentLabel({value: ''});
        }
    };

    // Remove a label from the form
    const handleRemoveLabel = (index) => {
        const newLabels = [...pedigreeForm.labels];
        newLabels.splice(index, 1);
        setPedigreeForm({
            ...pedigreeForm,
            labels: newLabels
        });
    };

    // Handle tool change
    const handleToolChange = (event, newTool) => {
        if (newTool !== null) {
            setTool(newTool);

            // Exit connect mode if switching tools
            if (connectMode && newTool !== 'connect') {
                setConnectMode(null);
                setConnectSource(null);
            }
        }
    };

    // Handle connect type change
    const handleConnectTypeChange = (type) => {
        setConnectMode(type);
        setConnectSource(null);

        setSnackbar({
            open: true,
            message: `Select first pedigree to create a ${type} connection`,
            severity: 'info'
        });
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setCurrentTabValue(newValue);
    };

    // Delete the selected pedigree
    const handleDeletePedigree = () => {
        if (!selectedPedigree) return;

        chart.delete(selectedPedigree.id);
        setSelectedPedigree(null);
        setPedigreeFormOpen(false);

        setSnackbar({
            open: true,
            message: 'Pedigree deleted successfully',
            severity: 'info'
        });

        // Update the drawing
        if (typeof onChange === 'function') {
            onChange(exportPedigreeData());
        }
    };

    // Generate parents for the selected pedigree
    const handleGenerateParents = () => {
        if (!selectedPedigree) return;

        const father = chart.create(
            "male",
            selectedPedigree.getRawX() - 90,
            selectedPedigree.getRawY() - 150
        );
        const mother = chart.create(
            "female",
            selectedPedigree.getRawX() + 90,
            selectedPedigree.getRawY() - 150
        );
        chart.connect(father, mother, "partnership");
        chart.connect(mother, selectedPedigree, "sibling");

        setSnackbar({
            open: true,
            message: 'Parents generated successfully!',
            severity: 'success'
        });

        // Update the drawing
        if (typeof onChange === 'function') {
            onChange(exportPedigreeData());
        }
    };

    // Clear the pedigree
    const handleClear = () => {
        if (!chart) return;

        // First, get all pedigrees
        const pedigrees = chart.getPedigrees();

        // Then delete them all
        pedigrees.forEach(pedigree => {
            chart.delete(pedigree.id);
        });

        // Create a new initial pedigree
        const initialPedigree = chart.create('unknown',
            stageSize.width / 2,
            stageSize.height / 2
        );
        initialPedigree.setLabel({name: "Mother", disease: "Carrier"})

        setSelectedPedigree(null);
        setPedigreeFormOpen(false);

        setSnackbar({
            open: true,
            message: 'Pedigree cleared successfully',
            severity: 'info'
        });

        // Update the drawing
        if (typeof onChange === 'function') {
            onChange(exportPedigreeData());
        }
    };

    // Save the pedigree
    const handleSave = () => {
        // Export pedigree data
        const data = exportPedigreeData();

        // Pass it to the onChange handler
        if (typeof onChange === 'function') {
            onChange(data);
        }

        setSnackbar({
            open: true,
            message: 'Pedigree saved successfully!',
            severity: 'success'
        });
    };

    // Export pedigree data
    const exportPedigreeData = () => {
        if (!chart) return null;
        // Get all pedigrees and connections
        const pedigrees = chart.pedigrees;
        const connections = chart.getConnections();

        // Format the data
        const pedigreeData = pedigrees.map(pedigree => ({
            id: pedigree.id,
            type: pedigree.type,
            x: pedigree.getRawX(),
            y: pedigree.getRawY(),
            affected: pedigree.isAffected,
            deceased: pedigree.isDeceased,
            diseaseShapes: pedigree.shapes,
            labels: pedigree?.label?.labelData || []
        }));

        const connectionData = connections.map(connection => ({
            id: connection.id,
            source: connection.getSource().id,
            target: connection.getTarget().id,
            type: connection.type
        }));

        return JSON.stringify({
            pedigrees: pedigreeData,
            connections: connectionData
        });
    };

    // Import pedigree data
    const importPedigreeData = (jsonData) => {
        if (!chart) return;

        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Clear existing pedigrees
            const pedigrees = chart.getPedigrees();
            pedigrees.forEach(pedigree => {
                chart.delete(pedigree.id);
            });

            // Create new pedigrees
            const pedigreeMap = {};
            data.pedigrees.forEach(pedigreeData => {
                const pedigree = chart.create(
                    pedigreeData.type,
                    pedigreeData.x,
                    pedigreeData.y,
                    pedigreeData.id // Use the same ID if possible
                );

                // Set properties
                if (pedigreeData.affected) {
                    pedigree.setAffected(true);
                }

                if (pedigreeData.deceased) {
                    pedigree.setDeceased(true);
                }

                if (pedigreeData.diseaseShapes && pedigreeData.diseaseShapes.length > 0) {
                    pedigreeData.diseaseShapes.forEach(shape => {
                        pedigree.addDiseaseShape(shape.type, shape.color);
                    });
                }

                if (pedigreeData.labels) {
                    console.log(pedigreeData);
                    pedigree.setLabel(pedigreeData.labels);
                }

                pedigreeMap[pedigreeData.id] = pedigree;
            });

            // Create connections
            data.connections.forEach(connectionData => {
                if (pedigreeMap[connectionData.source] && pedigreeMap[connectionData.target]) {
                    chart.connect(
                        pedigreeMap[connectionData.source],
                        pedigreeMap[connectionData.target],
                        connectionData.type
                    );
                }
            });

            setSnackbar({
                open: true,
                message: 'Pedigree imported successfully!',
                severity: 'success'
            });
        } catch (e) {
            console.error("Failed to import pedigree data", e);
            setSnackbar({
                open: true,
                message: 'Failed to import pedigree data',
                severity: 'error'
            });
        }
    };

    // Handle zoom in
    const handleZoomIn = () => {
        setScale(Math.min(scale + 0.1, 3));
        if (chart) {
            chart.setZoom(Math.min(scale + 0.1, 3));
        }
    };

    // Handle zoom out
    const handleZoomOut = () => {
        setScale(Math.max(scale - 0.1, 0.5));
        if (chart) {
            chart.setZoom(Math.max(scale - 0.1, 0.5));
        }
    };

    // Handle reset zoom
    const handleResetZoom = () => {
        setScale(1);
        if (chart) {
            chart.setZoom(1);
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // Give the DOM time to update before resizing
        setTimeout(() => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = !isFullscreen
                    ? window.innerHeight - 150
                    : Math.min(600, window.innerHeight - 300);
                setStageSize({
                    width: width,
                    height: height
                });

                if (chart) {
                    chart.setConfig({
                        width: width,
                        height: height
                    });
                }
            }
        }, 100);
    };

    // Menu handlers
    const handleMoreMenuOpen = (event) => {
        setMoreMenuAnchorEl(event.currentTarget);
    };

    const handleMoreMenuClose = () => {
        setMoreMenuAnchorEl(null);
    };

    const handleSnackbarClose = () => {
        setSnackbar({...snackbar, open: false});
    };

    // Handle file upload for import
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    importPedigreeData(e.target.result);
                } catch (error) {
                    console.error("Failed to parse file", error);
                    setSnackbar({
                        open: true,
                        message: 'Failed to parse file. Make sure it\'s a valid pedigree JSON.',
                        severity: 'error'
                    });
                }
            };
            reader.readAsText(file);
        }
    };

    // Handle export
    const handleExport = () => {
        const data = exportPedigreeData();
        if (data) {
            // Create a blob and download link
            const blob = new Blob([data], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'pedigree-data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: 'Pedigree exported as JSON file',
                severity: 'success'
            });
        }

        handleMoreMenuClose();
    };

    // Handle export as image
    const handleExportImage = (format = 'png') => {
        if (!chart) return;

        const canvas = document.getElementById('pedigree-canvas');
        if (!canvas) return;

        let dataURL, filename;

        if (format === 'png') {
            dataURL = canvas.toDataURL('image/png');
            filename = 'pedigree.png';
        } else if (format === 'jpeg' || format === 'jpg') {
            dataURL = canvas.toDataURL('image/jpeg', 0.8);
            filename = 'pedigree.jpg';
        } else {
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbar({
            open: true,
            message: `Pedigree exported as ${format.toUpperCase()} image`,
            severity: 'success'
        });

        handleMoreMenuClose();
    };

    // Generate a legend
    const handleGenerateLegend = () => {
        if (!chart) return;

        const legendTable = chart.createLegend(50, stageSize.height - 120);
        legendTable.setItemsPerRow(2);

        // Add common pedigree types to the legend
        const femaleNotAffected = chart.create("female", -1000, -1000);
        const maleNotAffected = chart.create("male", -1000, -1000);
        const femaleCarrier = chart.create("female", -1000, -1000);
        femaleCarrier.addDiseaseShape("dot", "A42562");
        const maleCarrier = chart.create("male", -1000, -1000);
        maleCarrier.addDiseaseShape("dot", "A42562");

        legendTable.setPedigree(femaleNotAffected, "Female not affected");
        legendTable.setPedigree(maleNotAffected, "Male not affected");
        legendTable.setPedigree(femaleCarrier, "Female carrier");
        legendTable.setPedigree(maleCarrier, "Male carrier");

        // Add affected pedigrees
        const femaleAffected = chart.create("female", -1000, -1000);
        femaleAffected.setAffected(true);
        const maleAffected = chart.create("male", -1000, -1000);
        maleAffected.setAffected(true);

        legendTable.setPedigree(femaleAffected, "Female affected");
        legendTable.setPedigree(maleAffected, "Male affected");

        setSnackbar({
            open: true,
            message: 'Legend added to pedigree chart',
            severity: 'success'
        });

        // Update the drawing
        if (typeof onChange === 'function') {
            onChange(exportPedigreeData());
        }
    };

    return (
        <Card elevation={isFullscreen ? 3 : 0} variant={isFullscreen ? "elevation" : "outlined"}
              sx={{
                  p: 0,
                  overflow: 'hidden',
                  position: isFullscreen ? 'fixed' : 'relative',
                  top: isFullscreen ? '0' : 'auto',
                  left: isFullscreen ? '0' : 'auto',
                  right: isFullscreen ? '0' : 'auto',
                  bottom: isFullscreen ? '0' : 'auto',
                  zIndex: isFullscreen ? 1300 : 'auto',
                  width: isFullscreen ? '100%' : 'auto',
                  height: isFullscreen ? '100%' : 'auto',
                  display: 'flex',
                  flexDirection: 'column'
              }}
        >
            {/* Pedigree Tools Header */}
            <Box sx={{
                p: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Main toolbar */}
                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                    <Typography variant="h6" sx={{flexGrow: 1, fontSize: {xs: '1rem', sm: '1.25rem'}}}>
                        Pedigree Editor
                    </Typography>

                    {/* Right side actions */}
                    <Box sx={{display: 'flex', gap: 1}}>
                        <Tooltip title="Clear">
                            <IconButton
                                onClick={handleClear}
                                size="small"
                            >
                                <ClearIcon/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Save">
                            <IconButton
                                onClick={handleSave}
                                size="small"
                                color="primary"
                            >
                                <SaveIcon/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                            <IconButton onClick={toggleFullscreen} size="small">
                                {isFullscreen ? <FullscreenExitIcon/> : <FullscreenIcon/>}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="More Options">
                            <IconButton onClick={handleMoreMenuOpen} size="small">
                                <MoreVertIcon/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* More options menu */}
                    <Menu
                        anchorEl={moreMenuAnchorEl}
                        open={Boolean(moreMenuAnchorEl)}
                        onClose={handleMoreMenuClose}
                    >
                        <MenuItem onClick={handleExport}>
                            <DownloadIcon fontSize="small" sx={{mr: 1}}/>
                            Export as JSON
                        </MenuItem>
                        <MenuItem onClick={() => handleExportImage('png')}>
                            <DownloadIcon fontSize="small" sx={{mr: 1}}/>
                            Export as PNG
                        </MenuItem>
                        <MenuItem onClick={() => handleExportImage('jpeg')}>
                            <DownloadIcon fontSize="small" sx={{mr: 1}}/>
                            Export as JPEG
                        </MenuItem>
                        <Divider/>
                        <MenuItem>
                            <label htmlFor="upload-json" style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                cursor: 'pointer'
                            }}>
                                <FileUploadIcon fontSize="small" sx={{mr: 1}}/>
                                Import from JSON
                                <input
                                    id="upload-json"
                                    type="file"
                                    accept="application/json"
                                    style={{display: 'none'}}
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </MenuItem>
                        <Divider/>
                        <MenuItem onClick={handleGenerateLegend}>
                            <ChipIcon fontSize="small" sx={{mr: 1}}/>
                            Generate Legend
                        </MenuItem>
                    </Menu>
                </Box>

                {/* Tabs for tool categories */}
                <Tabs
                    value={currentTabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{minHeight: 'auto', '& .MuiTab-root': {minHeight: 40, py: 0.5}}}
                >
                    <Tab label="Tools" icon={<PersonIcon fontSize="small"/>} iconPosition="start"/>
                    <Tab label="Connect" icon={<LinkIcon fontSize="small"/>} iconPosition="start"/>
                    <Tab label="View" icon={<ZoomInIcon fontSize="small"/>} iconPosition="start"/>
                </Tabs>
            </Box>

            {/* Tab panels for different tool categories */}
            <Box sx={{p: 1, borderBottom: `1px solid ${theme.palette.divider}`}}>
                {/* Tools Tab */}
                {currentTabValue === 0 && (
                    <Grid container spacing={1} alignItems="center">
                        {/* Basic tools */}
                        <Grid item xs={12} sm={6} md={8}>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2" sx={{mr: 1, minWidth: 40}}>Action:</Typography>
                                <ToggleButtonGroup
                                    value={tool}
                                    exclusive
                                    onChange={handleToolChange}
                                    aria-label="pedigree tool"
                                    size="small"
                                >
                                    <ToggleButton value="select" aria-label="select">
                                        <Tooltip title="Select/Edit Pedigree">
                                            <CreateIcon fontSize="small"/>
                                        </Tooltip>
                                    </ToggleButton>
                                    <ToggleButton value="add" aria-label="add">
                                        <Tooltip title="Add Pedigree">
                                            <PersonIcon fontSize="small"/>
                                        </Tooltip>
                                    </ToggleButton>
                                    <ToggleButton value="connect" aria-label="connect">
                                        <Tooltip title="Connect Pedigrees">
                                            <LinkIcon fontSize="small"/>
                                        </Tooltip>
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Grid>

                        {/* Quick add gender buttons */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                                <Typography variant="body2" sx={{mr: 1}}>Quick Add:</Typography>

                                <Tooltip title="Add Male">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => {
                                            if (chart) {
                                                const newPedigree = chart.create('male', stageSize.width / 2, stageSize.height / 2);
                                                // Update the drawing
                                                if (typeof onChange === 'function') {
                                                    onChange(exportPedigreeData());
                                                }
                                            }
                                        }}
                                    >
                                        <MaleIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Add Female">
                                    <IconButton
                                        size="small"
                                        color="secondary"
                                        onClick={() => {
                                            if (chart) {
                                                const newPedigree = chart.create('female', stageSize.width / 2, stageSize.height / 2);
                                                // Update the drawing
                                                if (typeof onChange === 'function') {
                                                    onChange(exportPedigreeData());
                                                }
                                            }
                                        }}
                                    >
                                        <FemaleIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Add Unknown">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (chart) {
                                                const newPedigree = chart.create('unknown', stageSize.width / 2, stageSize.height / 2);
                                                // Update the drawing
                                                if (typeof onChange === 'function') {
                                                    onChange(exportPedigreeData());
                                                }
                                            }
                                        }}
                                    >
                                        <QuestionMarkIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Grid>

                        {/* Selected pedigree actions */}
                        {selectedPedigree && (
                            <Grid item xs={12}>
                                <Paper variant="outlined" sx={{p: 1, mt: 1}}>
                                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                        <Typography variant="body2">
                                            Selected: {selectedPedigree?.type}
                                            {selectedPedigree?.label?.name ? ` (${selectedPedigree.label.name})` : ''}
                                        </Typography>

                                        <Box sx={{display: 'flex', gap: 1}}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="primary"
                                                startIcon={<CreateIcon/>}
                                                onClick={() => setPedigreeFormOpen(true)}
                                            >
                                                Edit
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="secondary"
                                                startIcon={<PeopleIcon/>}
                                                onClick={handleGenerateParents}
                                            >
                                                Generate Parents
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                startIcon={<ClearIcon/>}
                                                onClick={handleDeletePedigree}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                )}

                {/* Connect Tab */}
                {currentTabValue === 1 && (
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <Typography variant="body2" sx={{mb: 1}}>
                                Select connection type, then click on two pedigrees to connect:
                            </Typography>

                            <Grid container spacing={1}>
                                <Grid item xs={6} sm={4} md={3}>
                                    <Button
                                        variant={connectMode === 'partnership' ? 'contained' : 'outlined'}
                                        fullWidth
                                        size="small"
                                        onClick={() => handleConnectTypeChange('partnership')}
                                        startIcon={<FamilyRestroomIcon/>}
                                    >
                                        Partnership
                                    </Button>
                                </Grid>

                                <Grid item xs={6} sm={4} md={3}>
                                    <Button
                                        variant={connectMode === 'sibling' ? 'contained' : 'outlined'}
                                        fullWidth
                                        size="small"
                                        onClick={() => handleConnectTypeChange('sibling')}
                                        startIcon={<AccountTreeIcon/>}
                                    >
                                        Parent-Child
                                    </Button>
                                </Grid>

                                <Grid item xs={6} sm={4} md={3}>
                                    <Button
                                        variant={connectMode === 'twins' ? 'contained' : 'outlined'}
                                        fullWidth
                                        size="small"
                                        onClick={() => handleConnectTypeChange('twins')}
                                        startIcon={<PeopleIcon/>}
                                    >
                                        Twins
                                    </Button>
                                </Grid>

                                {connectSource && (
                                    <Grid item xs={12} sx={{mt: 1}}>
                                        <Typography variant="body2" color="primary">
                                            First pedigree selected. Now click on another pedigree to connect.
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* View Tab */}
                {currentTabValue === 2 && (
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant="body2" sx={{mr: 1, minWidth: 50}}>
                                    Zoom:
                                </Typography>
                                <Tooltip title="Zoom Out">
                                    <IconButton size="small" onClick={handleZoomOut}>
                                        <ZoomOutIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                <Typography variant="body2" sx={{mx: 1}}>
                                    {Math.round(scale * 100)}%
                                </Typography>

                                <Tooltip title="Zoom In">
                                    <IconButton size="small" onClick={handleZoomIn}>
                                        <ZoomInIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Reset Zoom">
                                    <IconButton size="small" onClick={handleResetZoom}>
                                        <SettingsBackupRestoreIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Fullscreen">
                                    <IconButton size="small" onClick={toggleFullscreen}>
                                        {isFullscreen ?
                                            <FullscreenExitIcon fontSize="small"/> :
                                            <FullscreenIcon fontSize="small"/>
                                        }
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Box>

            {/* Pedigree Canvas */}
            <Box
                ref={containerRef}
                sx={{
                    p: 1,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    overflow: 'auto',
                    flexGrow: 1,
                    '& canvas': {
                        borderRadius: 1,
                        boxShadow: '0 0 5px rgba(0,0,0,0.1)',
                        bgcolor: '#ffffff'
                    }
                }}
            >
                <canvas id="pedigree-canvas"></canvas>
            </Box>

            {/* Helper text */}
            {!isMobile && !isFullscreen && (
                <Box sx={{
                    p: 1,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <Typography variant="caption" color="text.secondary">
                        Tip: Click on pedigrees to edit them. Use the connect tool to create relationships.
                    </Typography>
                </Box>
            )}

            {/* Pedigree Edit Dialog */}
            <Dialog
                open={pedigreeFormOpen}
                onClose={() => setPedigreeFormOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedPedigree ? 'Edit Pedigree' : 'Create Pedigree'}
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Basic information */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={{mb: 2}}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Basic Information
                                </Typography>

                                <FormControl component="fieldset" fullWidth margin="normal">
                                    <InputLabel id="gender-label">Gender</InputLabel>
                                    <Select
                                        labelId="gender-label"
                                        value={pedigreeForm.gender}
                                        label="Gender"
                                        onChange={(e) => setPedigreeForm({
                                            ...pedigreeForm,
                                            gender: e.target.value
                                        })}
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="unknown">Unknown</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Name"
                                    fullWidth
                                    value={pedigreeForm.name}
                                    onChange={(e) => setPedigreeForm({
                                        ...pedigreeForm,
                                        name: e.target.value
                                    })}
                                    margin="normal"
                                />

                                <TextField
                                    label="Age"
                                    fullWidth
                                    value={pedigreeForm.age}
                                    onChange={(e) => setPedigreeForm({
                                        ...pedigreeForm,
                                        age: e.target.value
                                    })}
                                    margin="normal"
                                    type="number"
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={pedigreeForm.deceased}
                                            onChange={(e) => setPedigreeForm({
                                                ...pedigreeForm,
                                                deceased: e.target.checked
                                            })}
                                        />
                                    }
                                    label="Deceased"
                                />
                            </Box>
                        </Grid>

                        {/* Disease information */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={{mb: 2}}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Disease Information
                                </Typography>

                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="disease-status-label">Disease Status</InputLabel>
                                    <Select
                                        labelId="disease-status-label"
                                        value={pedigreeForm.diseaseStatus}
                                        label="Disease Status"
                                        onChange={(e) => setPedigreeForm({
                                            ...pedigreeForm,
                                            diseaseStatus: e.target.value
                                        })}
                                    >
                                        <MenuItem value="unaffected">Unaffected</MenuItem>
                                        <MenuItem value="affected">Affected</MenuItem>
                                        <MenuItem value="carrier">Carrier</MenuItem>
                                    </Select>
                                </FormControl>

                                {pedigreeForm.diseaseStatus === 'carrier' && (
                                    <Box sx={{mt: 2}}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={pedigreeForm.carrierStatus}
                                                    onChange={(e) => setPedigreeForm({
                                                        ...pedigreeForm,
                                                        carrierStatus: e.target.checked
                                                    })}
                                                />
                                            }
                                            label="Show carrier status"
                                        />

                                        {pedigreeForm.carrierStatus && (
                                            <Box sx={{mt: 1}}>
                                                <Typography variant="body2" gutterBottom>
                                                    Carrier Marker Color
                                                </Typography>
                                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                    {['#A42562', '#FF0000', '#0000FF', '#008000', '#FFA500', '#800080'].map(color => (
                                                        <Box
                                                            key={color}
                                                            onClick={() => setPedigreeForm({
                                                                ...pedigreeForm,
                                                                diseaseColor: color
                                                            })}
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '50%',
                                                                bgcolor: color,
                                                                cursor: 'pointer',
                                                                border: `2px solid ${pedigreeForm.diseaseColor === color ?
                                                                    theme.palette.primary.main : 'transparent'}`
                                                            }}
                                                        />
                                                    ))}

                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <input
                                                            type="color"
                                                            value={pedigreeForm.diseaseColor}
                                                            onChange={(e) => setPedigreeForm({
                                                                ...pedigreeForm,
                                                                diseaseColor: e.target.value
                                                            })}
                                                            style={{width: 32, height: 32}}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Additional labels */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>
                                Additional Information
                            </Typography>

                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                                {pedigreeForm.labels.map((label, index) => (
                                    <Chip
                                        key={index}
                                        label={`${label.key}: ${label.value}`}
                                        onDelete={() => handleRemoveLabel(index)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>

                            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-end'}}>

                                <TextField
                                    label="Label Value"
                                    value={currentLabel.value}
                                    onChange={(e) => setCurrentLabel({
                                        ...currentLabel,
                                        value: e.target.value
                                    })}
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddLabel}
                                    disabled={!currentLabel.value}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPedigreeFormOpen(false)}>Cancel</Button>
                    <Button onClick={savePedigreeFromForm} variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Card>
    );
};

export default PedigreeDrawingForm;
