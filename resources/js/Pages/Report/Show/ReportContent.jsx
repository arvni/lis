import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, DownloadOutlined, Description } from '@mui/icons-material';
import DocumentsInfo from '@/Components/DocumentsInfo';
import { formatDate } from './helpers';

const ReportContent = ({ report, canPrint, expanded, onChange }) => (
    <Accordion
        defaultExpanded={true}
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
                <Description color="primary" />
                <Typography variant="h6">Report Content</Typography>
            </Stack>
        </AccordionSummary>
        <AccordionDetails>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    '& img': { maxWidth: '100%' },
                }}
            >
                {report.value ? (
                    <Box
                        sx={{
                            overflowX: 'auto',
                            '& table': { borderCollapse: 'collapse' },
                            '& td, & th': { border: '1px solid #ddd', padding: '8px' },
                        }}
                        dangerouslySetInnerHTML={{ __html: report.value }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No report content available
                    </Typography>
                )}
            </Paper>

            {/* Report Metadata */}
            <Box sx={{ mt: 2 }}>
                <Stack spacing={2} divider={<Divider flexItem />}>
                    {/* Reported By */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{
                            justifyContent: 'space-between',
                            alignItems: { sm: 'center' },
                        }}
                    >
                        <Typography>
                            Reported by <strong>{report.reporter.name}</strong> at{' '}
                            {formatDate(report.reported_at)}
                        </Typography>
                        {report.reported_document && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadOutlined />}
                                target="_blank"
                                href={route('reports.download', report.id ?? report.hash)}
                            >
                                Download Report
                            </Button>
                        )}
                    </Stack>

                    {/* Approved By */}
                    {report.approver && (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{
                                justifyContent: 'space-between',
                                alignItems: { sm: 'center' },
                            }}
                        >
                            <Typography>
                                Approved by <strong>{report.approver.name}</strong> at{' '}
                                {formatDate(report.approved_at)}
                            </Typography>
                            {report.approved_document && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadOutlined />}
                                    target="_blank"
                                    href={route(
                                        'documents.show',
                                        report?.approved_document?.id ||
                                            report?.approved_document?.hash,
                                    )}
                                >
                                    Download Approved Version
                                </Button>
                            )}
                        </Stack>
                    )}

                    {/* Published By */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{
                            justifyContent: 'space-between',
                            alignItems: { sm: 'center' },
                        }}
                    >
                        {report.publisher && (
                            <Typography>
                                Published by <strong>{report.publisher.name}</strong> at{' '}
                                {formatDate(report.published_at)}
                            </Typography>
                        )}
                        {report.published_document && canPrint && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadOutlined />}
                                target="_blank"
                                href={route(
                                    'documents.show',
                                    report?.published_document?.id ||
                                        report?.published_document?.hash,
                                )}
                            >
                                Download Published Version
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {/* Attached Documents */}
            {report.documents.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Attached Documents
                    </Typography>
                    <DocumentsInfo
                        documents={report.documents}
                        editable={false}
                        patientId={report.acceptance_item.patients[0].id}
                    />
                </Box>
            )}
        </AccordionDetails>
    </Accordion>
);

export default ReportContent;
