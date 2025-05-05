import React from "react";
import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Divider,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useTheme
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    CheckCircle as ApproveIcon,
    CalendarToday as DateIcon,
    Visibility as VisibilityIcon,
    ArticleOutlined as ReportIcon
} from "@mui/icons-material";

// Format date string to be more readable
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';

    try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('default', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (e) {
        return dateTimeStr;
    }
};

// User avatar component that shows initials
const UserAvatar = ({ name, size = 40, icon }) => {
    const theme = useTheme();

    if (!name) return null;

    // Generate initials from name
    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <Tooltip title={name} arrow>
            <Avatar
                sx={{
                    width: size,
                    height: size,
                    bgcolor: icon === 'approver' ? theme.palette.success.main : theme.palette.primary.main,
                    fontSize: size / 2,
                    fontWeight: 'bold'
                }}
            >
                {initials}
            </Avatar>
        </Tooltip>
    );
};

const ReportInfo = ({ report, defaultExpanded = true }) => {
    const theme = useTheme();

    // Check if report is approved
    const isApproved = Boolean(report.approver);

    return (
        <Card
            elevation={2}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: theme.shadows[4],
                }
            }}
        >
            <Accordion
                defaultExpanded={defaultExpanded}
                sx={{
                    '&.MuiAccordion-root': {
                        boxShadow: 'none',
                        '&:before': {
                            display: 'none',
                        },
                    }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon color="inherit" />}
                    aria-controls="report-information"
                    id="report-information"
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                        },
                        '& .MuiAccordionSummary-expandIconWrapper': {
                            color: theme.palette.primary.contrastText
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ReportIcon />
                        <Typography variant="h5" fontWeight="medium">
                            Report Information
                        </Typography>

                        {isApproved && (
                            <Chip
                                icon={<ApproveIcon fontSize="small" />}
                                label="Approved"
                                size="small"
                                color="success"
                                sx={{ ml: 1 }}
                            />
                        )}

                        {!isApproved && report.reporter && (
                            <Chip
                                label="Pending Approval"
                                size="small"
                                color="warning"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: theme.palette.background.default,
                            borderRadius: 2
                        }}
                    >
                        {report.reporter && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mb: report.approver ? 3 : 0
                                }}
                            >
                                <UserAvatar name={report.reporter.name} icon="reporter" />

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <PersonIcon fontSize="small" color="primary" />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {report.reporter.name}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                        <DateIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Created at {formatDateTime(report.reportedAt)}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        )}

                        {report.approver && (
                            <>
                                {report.reporter && <Divider sx={{ my: 2 }} />}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <UserAvatar name={report.approver.name} icon="approver" />

                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <ApproveIcon fontSize="small" color="success" />
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {report.approver.name}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                            <DateIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                Approved at {formatDateTime(report.approvedAt)}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Paper>
                </AccordionDetails>

                <Divider />

                <AccordionActions sx={{ px: 2, py: 1.5, justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        href={route("reports.show", report.id)}
                        target="_blank"
                        sx={{
                            borderRadius: 6,
                            px: 3,
                            '&:hover': {
                                boxShadow: theme.shadows[4]
                            }
                        }}
                    >
                        View Full Report
                    </Button>
                </AccordionActions>
            </Accordion>
        </Card>
    );
};

export default ReportInfo;
