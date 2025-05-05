import {
    Accordion,
    AccordionDetails,
    Alert,
    Box,
    Chip,
    Divider,
    Paper,
    Stack,
    Typography,
    useTheme
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DocumentsInfo from "@/Components/DocumentsInfo";
import {
    HistoryOutlined,
    PersonOutlined,
    ThumbDownAlt,
    CalendarToday,
    Description
} from "@mui/icons-material";
import { useState } from "react";

/**
 * History Component - Displays the revision history of a report
 *
 * @param {Object} props - Component props
 * @param {Array} props.history - Array of historical report entries
 */
const History = ({ history }) => {
    const theme = useTheme();
    const [expandedItem, setExpandedItem] = useState(null);

    // Handle expansion change for nested accordions
    const handleChange = (index) => (event, isExpanded) => {
        setExpandedItem(isExpanded ? index : null);
    };

    // Format date for better readability
    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";

        try {
            // Attempt to format the date more nicely if possible
            // This assumes dateString is in a format that Date can parse
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            // If there's any error parsing, return the original string
            return dateString;
        }
    };

    return (
        <Accordion
            defaultExpanded
            elevation={2}
            sx={{
                mb: 2,
                borderRadius: 1,
                overflow: 'hidden',
                '&:before': { display: 'none' }
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    backgroundColor: theme.palette.background.default,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <HistoryOutlined color="primary" />
                    <Typography variant="h6">Report History</Typography>
                    <Chip
                        label={`${history.length} ${history.length === 1 ? 'Revision' : 'Revisions'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Stack>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 2 }}>
                {history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', p: 2 }}>
                        No revision history available
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {history.map((item, index) => (
                            <Accordion
                                key={`history-item-${index}`}
                                expanded={expandedItem === index}
                                onChange={handleChange(index)}
                                elevation={1}
                                sx={{
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    '&:before': { display: 'none' }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        backgroundColor: theme.palette.action.hover,
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                                            spacing={1}
                                            sx={{ width: '100%' }}
                                        >
                                            <Chip
                                                label={`Revision ${index + 1}`}
                                                size="small"
                                                color="secondary"
                                                sx={{ fontWeight: 'bold' }}
                                            />

                                            <Stack
                                                direction={{ xs: 'column', md: 'row' }}
                                                spacing={{ xs: 0.5, md: 2 }}
                                                divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
                                            >
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <PersonOutlined fontSize="small" color="primary" />
                                                    <Typography variant="body2">
                                                        Reported by <strong>{item?.reporter?.name || 'Unknown'}</strong>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <CalendarToday fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {formatDate(item?.reportedAt)}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <ThumbDownAlt fontSize="small" color="error" />
                                                    <Typography variant="body2">
                                                        Rejected by <strong>{item?.approver?.name || 'Unknown'}</strong>
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <CalendarToday fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {formatDate(item?.approvedAt)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ p: 0 }}>
                                    <Box sx={{ p: 2 }}>
                                        {/* Rejection Comment */}
                                        {item?.comment && (
                                            <Alert
                                                severity="warning"
                                                variant="outlined"
                                                icon={<ThumbDownAlt />}
                                                sx={{ mb: 2 }}
                                            >
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Rejection Reason:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {item.comment}
                                                </Typography>
                                            </Alert>
                                        )}

                                        {/* Report Content */}
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                <Description fontSize="small" color="primary" />
                                                <Typography variant="subtitle1">
                                                    Report Content
                                                </Typography>
                                            </Stack>

                                            <Divider sx={{ mb: 2 }} />

                                            {item?.value ? (
                                                <Box
                                                    sx={{
                                                        overflowX: "auto",
                                                        "& table": { borderCollapse: "collapse" },
                                                        "& td, & th": { border: "1px solid #ddd", padding: "8px" },
                                                        "& img": { maxWidth: "100%" }
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: item.value }}
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                    No content available for this revision
                                                </Typography>
                                            )}
                                        </Paper>

                                        {/* Attached Documents */}
                                        {item?.documents?.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Attached Documents
                                                </Typography>
                                                <DocumentsInfo
                                                    editable={false}
                                                    documents={item.documents}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

export default History;
