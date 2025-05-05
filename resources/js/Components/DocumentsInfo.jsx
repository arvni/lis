import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, {useState, useEffect} from "react";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
    AccordionActions,
    Box,
    Chip,
    Divider,
    Grid2 as Grid,
    IconButton,
    Paper,
    Tooltip,
    alpha,
    useTheme,
    Tabs,
    Tab,
} from "@mui/material";
import Button from "@mui/material/Button";
import {LoadingButton} from "@mui/lab";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Add as AddIcon,
    InsertDriveFile as InsertDriveFileIcon,
    DocumentScanner as DocumentScannerIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Photo as PhotoIcon,
    Description as DescriptionIcon,
    Archive as ArchiveIcon,
    CloudUpload as CloudUploadIcon,
    Download as DownloadIcon, RemoveRedEye,
} from "@mui/icons-material";
import {useForm} from "@inertiajs/react";
import Upload from "./Upload";
import Document from "@/Pages/Document.jsx";

/**
 * Enhanced DocumentsInfo component with tag-based filtering tabs
 *
 * @param {Object} props - Component props
 * @param {Array} props.documents - Array of document objects
 * @param {Object} props.appendData - Additional data to append to form
 * @param {boolean} props.defaultExpanded - Whether accordion is expanded by default
 * @param {string} props.titleVariant - Typography variant for the title
 * @param {boolean} props.editable - Whether documents can be edited
 * @param {string} props.url - URL for form submission
 * @param {array} props.tags - Array of tags
 * @returns {JSX.Element}
 */

// Define tags for DocumentsInfo
const tags = [
    {label: "Medical History", value: "MEDICAL_HISTORY"},
    {label: "ID Card", value: "ID_CARD"},
    {label: "Consent Form", value: "CONSENT_FORM"},
    {label: "Acceptance Form", value: "ACCEPTANCE_FORM"},
    {label: "Acceptance Item States", value: "ACCEPTANCE_ITEM_STATES"},
    {label: "Prescription", value: "PRESCRIPTION"},
    {label: "Request Form", value: "REQUEST_FORM"},
    {label: "Document", value: "DOCUMENT"},
];
const DocumentsInfo = ({
                           documents = [],
                           appendData = {},
                           defaultExpanded = true,
                           titleVariant = "h6",
                           editable = true,
                           url = "",
                       }) => {
    const theme = useTheme();

    // Initialize form with documents data
    const {data, setData, post, processing, reset} = useForm({
        documents,
        ...appendData,
        _method: "put"
    });

    // State for edit mode
    const [edit, setEdit] = useState(false);

    // State for active tab
    const [activeTab, setActiveTab] = useState("all");

    // Extract unique tags from documents
    const [uniqueTags, setUniqueTags] = useState([]);

    // Filtered documents based on selected tag
    const [filteredDocuments, setFilteredDocuments] = useState(documents);

    // Extract unique tags and set filtered documents whenever documents change
    useEffect(() => {
        const tags = ["all"];
        documents.forEach(doc => {
            if (doc.tag && !tags.includes(doc.tag)) {
                tags.push(doc.tag);
            }
        });
        setUniqueTags(tags);

        // Initial filtering
        if (activeTab === "all") {
            setFilteredDocuments(documents);
        } else {
            setFilteredDocuments(documents.filter(doc => doc.tag === activeTab));
        }
    }, [documents]);

    // Filter documents when tab changes
    useEffect(() => {
        if (activeTab === "all") {
            setFilteredDocuments(documents);
        } else {
            setFilteredDocuments(documents.filter(doc => doc.tag === activeTab));
        }
    }, [activeTab, documents]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Submit form handler
    const handleSubmit = () => {
        post(url, {
            onSuccess: () => {
                setEdit(false);
            }
        });
    };

    // Cancel edit handler
    const handleCancel = () => {
        reset();
        setEdit(false);
    };

    // Enter edit mode handler
    const handleEdit = () => setEdit(true);

    // Handle file changes
    const handleChange = (_, value) => setData(previousData => ({...previousData, documents: value}));

    // Get appropriate icon based on file type
    const getFileIcon = (mimeType) => {
        if (!mimeType) return <InsertDriveFileIcon/>;

        if (['pdf', 'application/pdf', 'application/x-pdf'].includes(mimeType)) {
            return <PictureAsPdfIcon sx={{color: '#f44336'}}/>;
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tif', 'tiff'].includes(mimeType)) {
            return <PhotoIcon sx={{color: '#4caf50'}}/>;
        } else if (["doc", "docx"].includes(mimeType)) {
            return <DescriptionIcon sx={{color: '#2196f3'}}/>;
        } else if (['zip', 'rar', 'archive', '7z', 'tar', 'gz', 'bz2'].includes(mimeType)) {
            return <ArchiveIcon sx={{color: '#ff9800'}}/>;
        }

        return <InsertDriveFileIcon sx={{color: '#9e9e9e'}}/>;
    };

    // Document management view based on edit state

    const [selectedDoc, setSelectedDoc] = useState()
    const handleClick = (doc) => () => setSelectedDoc({...doc, hash: doc.hash || doc.id});
    const handleClose = () => setSelectedDoc(null);
    const DocumentsManager = () => {
        if (edit) {
            return (
                <Box sx={{p: 2}}>
                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            borderStyle: 'dashed',
                            mb: 2
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <CloudUploadIcon color="primary" sx={{mr: 1}}/>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Manage Documents
                            </Typography>
                        </Box>

                        <Upload
                            value={data.documents}
                            url={route("documents.store")}
                            onChange={handleChange}
                            multiple
                            editable={true}
                            sx={{borderRadius: 2}}
                            tags={tags}
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{display: 'block', mt: 2}}
                        >
                            Drag and drop files here or click to browse.
                        </Typography>
                    </Paper>
                </Box>
            );
        }
        return (<Box sx={{p: 1}}>
                {documents && documents.length > 0 ? (
                    <>
                        {/* Tabs for filtering documents by tag */}
                        <Box sx={{borderBottom: 1, borderColor: 'divider', mb: 2}}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                aria-label="document tag tabs"
                            >
                                {uniqueTags.map(tag => (
                                    <Tab
                                        key={tag}
                                        label={tag === "all" ? "All Documents" : tags.find(t => t.value === tag)?.label}
                                        value={tag}
                                        sx={{
                                            textTransform: 'capitalize',
                                            minHeight: '48px'
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </Box>

                        {/* Show count of filtered documents */}
                        <Box sx={{ml: 2, mb: 2}}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Showing {filteredDocuments.length} of {documents.length} documents
                            </Typography>
                        </Box>

                        {/* Display filtered documents */}
                        <Grid container spacing={2}>
                            {filteredDocuments.length > 0 ? (
                                filteredDocuments.map((doc, index) => (
                                    <Grid size={{xs: 12, sm: 6, md: 4}} key={doc.id || index}>
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                mb: 1
                                            }}>
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        mr: 2
                                                    }}
                                                >
                                                    {getFileIcon(doc.ext)}
                                                </Box>
                                                <Box sx={{flexGrow: 1, overflow: 'hidden'}}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        noWrap
                                                        title={doc.originalName || doc.name}
                                                        sx={{maxWidth: '100%'}}
                                                    >
                                                        {doc.originalName || doc.name}
                                                    </Typography>
                                                    {doc.tag && (<>
                                                        <Chip
                                                            label={tags.find(item => item.value === doc.tag)?.label}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{mt: 0.5, mb: 0.5, textTransform: 'capitalize'}}
                                                        />
                                                        <br/>
                                                        </>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box
                                                sx={{
                                                    mt: 'auto',
                                                    pt: 1,
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    gap: 1
                                                }}
                                            >
                                                <Tooltip title="Download">
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={route("documents.download", doc.id || doc.hash)}
                                                        download
                                                        target="_blank"
                                                        sx={{
                                                            color: theme.palette.success.main,
                                                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                                                            '&:hover': {
                                                                backgroundColor: alpha(theme.palette.success.main, 0.2)
                                                            }
                                                        }}
                                                    >
                                                        <DownloadIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="View">
                                                    <IconButton
                                                        size="small"
                                                        onClick={handleClick(doc)}
                                                        sx={{
                                                            color: theme.palette.info.main,
                                                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                                                            '&:hover': {
                                                                backgroundColor: alpha(theme.palette.info.main, 0.2)
                                                            }
                                                        }}
                                                    >
                                                        <RemoveRedEye fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))
                            ) : (
                                <Grid size={{xs: 12}}>
                                    <Box
                                        sx={{
                                            p: 3,
                                            textAlign: 'center',
                                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                                            borderRadius: 2,
                                            border: '1px dashed',
                                            borderColor: 'divider',
                                            m: 2
                                        }}
                                    >
                                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                            No documents found with the selected tag
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Try selecting a different category or add new documents
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </>
                ) : (
                    <Box
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'divider'
                        }}
                    >
                        <DocumentScannerIcon
                            sx={{
                                fontSize: 48,
                                color: 'text.secondary',
                                mb: 2,
                                opacity: 0.6
                            }}
                        />
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            No Documents Available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {editable
                                ? 'Click "Edit" to upload documents'
                                : 'There are no documents attached to this record'}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    return (<>
            <Accordion
                defaultExpanded={defaultExpanded}
                sx={{
                    mt: 2,
                    borderRadius: 1,
                    '&:before': {display: 'none'},
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="patient-documents"
                    id="patient-documents"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', width: '100%'}}>
                        <DocumentScannerIcon sx={{mr: 1, color: 'primary.main'}}/>
                        <Typography
                            variant={titleVariant}
                            sx={{
                                fontWeight: 500,
                                color: 'text.primary',
                                flexGrow: 1
                            }}
                        >
                            Documents
                        </Typography>

                        <Chip
                            label={`${documents?.length || 0} files`}
                            size="small"
                            color={documents?.length > 0 ? "primary" : "default"}
                            sx={{mr: 2}}
                        />
                    </Box>
                </AccordionSummary>

                <Divider/>

                <AccordionDetails sx={{p: 0, backgroundColor: 'background.default'}}>
                    <DocumentsManager/>
                </AccordionDetails>

                {editable && (
                    <>
                        <Divider/>
                        <AccordionActions sx={{p: 2, backgroundColor: 'background.paper'}}>
                            {edit ? (
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        onClick={handleCancel}
                                        startIcon={<CancelIcon/>}
                                        variant="outlined"
                                        color="inherit"
                                        sx={{borderRadius: 2}}
                                    >
                                        Cancel
                                    </Button>
                                    <LoadingButton
                                        onClick={handleSubmit}
                                        variant="contained"
                                        loading={processing}
                                        loadingPosition="start"
                                        startIcon={<SaveIcon/>}
                                        sx={{borderRadius: 2}}
                                    >
                                        Save Changes
                                    </LoadingButton>
                                </Stack>
                            ) : (
                                <Button
                                    onClick={handleEdit}
                                    startIcon={documents?.length > 0 ? <EditIcon/> : <AddIcon/>}
                                    variant="outlined"
                                    color="secondary"
                                    sx={{borderRadius: 2}}
                                >
                                    {documents?.length > 0 ? "Manage Documents" : "Add Documents"}
                                </Button>
                            )}
                        </AccordionActions>
                    </>
                )}
            </Accordion>
            <Document document={selectedDoc}
                      onClose={handleClose}/>
        </>
    );
};

export default DocumentsInfo;
