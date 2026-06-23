import { Box, Grid, Tab, Tabs, Typography, alpha, useTheme } from '@mui/material';
import { DocumentScanner as DocumentScannerIcon } from '@mui/icons-material';
import DocumentCard from './DocumentCard';

const DocumentsView = ({
    documents,
    tags,
    activeTab,
    onTabChange,
    uniqueTags,
    filteredDocuments,
    editable,
    onView,
}) => {
    const theme = useTheme();

    if (!documents || documents.length === 0) {
        return (
            <Box sx={{ p: 1 }}>
                <Box
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                    }}
                >
                    <DocumentScannerIcon
                        sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.6 }}
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
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            {/* Tabs for filtering documents by tag */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={onTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="document tag tabs"
                >
                    {uniqueTags.map((tag) => (
                        <Tab
                            key={tag}
                            label={
                                tag === 'all'
                                    ? 'All Documents'
                                    : tags.find((t) => t.value === tag)?.label
                            }
                            value={tag}
                            sx={{ textTransform: 'capitalize', minHeight: '48px' }}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Show count of filtered documents */}
            <Box sx={{ ml: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Showing {filteredDocuments.length} of {documents.length} documents
                </Typography>
            </Box>

            {/* Display filtered documents */}
            <Grid container spacing={2}>
                {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id || index}>
                            <DocumentCard doc={doc} tags={tags} onView={onView(doc)} />
                        </Grid>
                    ))
                ) : (
                    <Grid size={{ xs: 12 }}>
                        <Box
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: alpha(theme.palette.background.default, 0.5),
                                borderRadius: 2,
                                border: '1px dashed',
                                borderColor: 'divider',
                                m: 2,
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
        </Box>
    );
};

export default DocumentsView;
