import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import {
    Edit,
    ExpandMore as ExpandMoreIcon,
    DownloadOutlined,
    MedicalServices,
} from '@mui/icons-material';

const ClinicalReport = ({ report, canEdit, expanded, onChange, onEdit }) => (
    <Accordion
        expanded={expanded}
        onChange={onChange}
        elevation={2}
        sx={{
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            '&:before': { display: 'none' },
        }}
    >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <MedicalServices color="primary" />
                <Typography variant="h6">Clinical Report</Typography>
            </Stack>
        </AccordionSummary>
        <AccordionDetails>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    borderRadius: 1,
                    '& img': { maxWidth: '100%' },
                }}
            >
                {report.clinical_comment ? (
                    <Box
                        sx={{
                            overflow: 'auto',
                            maxWidth: '100%',
                            '& table': { borderCollapse: 'collapse' },
                            '& td, & th': { border: '1px solid #ddd', padding: '8px' },
                        }}
                        dangerouslySetInnerHTML={{ __html: report.clinical_comment }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No clinical comment content available
                    </Typography>
                )}

                {report.clinical_comment_document && (
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadOutlined />}
                            target="_blank"
                            href={route(
                                'documents.download',
                                report.clinical_comment_document.id ??
                                    report.clinical_comment_document.hash,
                            )}
                        >
                            Download Clinical Report
                        </Button>
                    </Box>
                )}
            </Paper>
        </AccordionDetails>
        {canEdit && report.approver && (
            <AccordionActions>
                <Button onClick={onEdit} startIcon={<Edit />} size="small" color="primary">
                    Edit Clinical Report
                </Button>
            </AccordionActions>
        )}
    </Accordion>
);

export default ClinicalReport;
