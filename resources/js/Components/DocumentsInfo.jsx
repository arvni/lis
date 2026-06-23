import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AccordionActions, Box, Chip, Divider } from '@mui/material';
import Button from '@mui/material/Button';
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Add as AddIcon,
    DocumentScanner as DocumentScannerIcon,
} from '@mui/icons-material';
import { useForm } from '@inertiajs/react';
import Document from '@/Pages/Document.jsx';
import { allTags } from './DocumentsInfo/constants';
import DocumentsView from './DocumentsInfo/DocumentsView';
import UploadPanel from './DocumentsInfo/UploadPanel';

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
 * @param {array} props.allowedTags - Array of allowed tag values
 * @returns {JSX.Element}
 */
const DocumentsInfo = ({
    documents = [],
    appendData = {},
    defaultExpanded = true,
    titleVariant = 'h6',
    editable = true,
    url = '',
    allowedTags = allTags.map((tag) => tag.value),
}) => {
    const tags = allowedTags.reduce((acc, tag) => {
        const allowedTag = allTags.find((item) => item.value === tag);
        if (allowedTag) acc.push(allowedTag);
        return acc;
    }, []);

    // Initialize form with documents data
    const { data, setData, post, processing, reset } = useForm({
        documents,
        ...appendData,
        _method: 'put',
    });

    // State for edit mode
    const [edit, setEdit] = useState(false);

    // State for active tab
    const [activeTab, setActiveTab] = useState('all');

    // Extract unique tags from documents
    const [uniqueTags, setUniqueTags] = useState([]);

    // Filtered documents based on selected tag
    const [filteredDocuments, setFilteredDocuments] = useState(documents);

    // Extract unique tags and set filtered documents whenever documents change
    useEffect(() => {
        const tags = ['all'];
        documents.forEach((doc) => {
            if (doc.tag && !tags.includes(doc.tag)) {
                tags.push(doc.tag);
            }
        });
        setUniqueTags(tags);

        // Initial filtering
        if (activeTab === 'all') {
            setFilteredDocuments(documents);
        } else {
            setFilteredDocuments(documents.filter((doc) => doc.tag === activeTab));
        }
    }, [documents, activeTab]);

    // Filter documents when tab changes
    useEffect(() => {
        if (activeTab === 'all') {
            setFilteredDocuments(documents);
        } else {
            setFilteredDocuments(documents.filter((doc) => doc.tag === activeTab));
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
            },
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
    const handleChange = (_, value) =>
        setData((previousData) => ({ ...previousData, documents: value }));

    // Document viewer state
    const [selectedDoc, setSelectedDoc] = useState();
    const handleClick = (doc) => () => setSelectedDoc({ ...doc, hash: doc.hash || doc.id });
    const handleClose = () => setSelectedDoc(null);

    return (
        <>
            <Accordion
                defaultExpanded={defaultExpanded}
                sx={{
                    mt: 2,
                    borderRadius: 1,
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="patient-documents"
                    id="patient-documents"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '8px 8px 0 0',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <DocumentScannerIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography
                            variant={titleVariant}
                            sx={{
                                fontWeight: 500,
                                color: 'text.primary',
                                flexGrow: 1,
                            }}
                        >
                            Documents
                        </Typography>

                        <Chip
                            label={`${documents?.length || 0} files`}
                            size="small"
                            color={documents?.length > 0 ? 'primary' : 'default'}
                            sx={{ mr: 2 }}
                        />
                    </Box>
                </AccordionSummary>

                <Divider />

                <AccordionDetails sx={{ p: 0, backgroundColor: 'background.default' }}>
                    {edit ? (
                        <UploadPanel
                            documents={data.documents}
                            tags={tags}
                            onChange={handleChange}
                        />
                    ) : (
                        <DocumentsView
                            documents={documents}
                            tags={tags}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            uniqueTags={uniqueTags}
                            filteredDocuments={filteredDocuments}
                            editable={editable}
                            onView={handleClick}
                        />
                    )}
                </AccordionDetails>

                {editable && (
                    <>
                        <Divider />
                        <AccordionActions sx={{ p: 2, backgroundColor: 'background.paper' }}>
                            {edit ? (
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        onClick={handleCancel}
                                        startIcon={<CancelIcon />}
                                        variant="outlined"
                                        color="inherit"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        variant="contained"
                                        loading={processing}
                                        loadingPosition="start"
                                        startIcon={<SaveIcon />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Save Changes
                                    </Button>
                                </Stack>
                            ) : (
                                <Button
                                    onClick={handleEdit}
                                    startIcon={documents?.length > 0 ? <EditIcon /> : <AddIcon />}
                                    variant="outlined"
                                    color="secondary"
                                    sx={{ borderRadius: 2 }}
                                >
                                    {documents?.length > 0 ? 'Manage Documents' : 'Add Documents'}
                                </Button>
                            )}
                        </AccordionActions>
                    </>
                )}
            </Accordion>
            <Document document={selectedDoc} onClose={handleClose} />
        </>
    );
};

DocumentsInfo.propTypes = {
    documents: PropTypes.array,
    appendData: PropTypes.object,
    defaultExpanded: PropTypes.bool,
    titleVariant: PropTypes.string,
    editable: PropTypes.bool,
    url: PropTypes.string,
    allowedTags: PropTypes.arrayOf(PropTypes.string),
};

export default DocumentsInfo;
