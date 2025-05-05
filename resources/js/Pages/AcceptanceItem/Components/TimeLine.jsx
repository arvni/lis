import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Paper,
    Typography,
    useTheme,
    Card,
    Tooltip,
    useMediaQuery
} from "@mui/material";
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator
} from "@mui/lab";
import {
    ExpandMore as ExpandMoreIcon,
    AccessTime as TimeIcon,
    Event as EventIcon
} from "@mui/icons-material";

const TimeLine = ({ timeline }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Format date strings if they appear to be dates
    const formatTimeValue = (value) => {
        // Check if value might be a date string
        if (typeof value === 'string' && (
            value.includes('/') ||
            value.includes('-') ||
            value.match(/\d{1,2}:\d{2}/)
        )) {
            try {
                const date = new Date(value);
                // Check if valid date
                if (!isNaN(date.getTime())) {
                    return new Intl.DateTimeFormat('default', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(date);
                }
            } catch (e) {
                // If parsing fails, return the original value
            }
        }
        return value;
    };

    // Generate a consistent color based on the string
    const generateColor = (str) => {
        const colors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
        ];

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

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
                defaultExpanded
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
                    expandIcon={<ExpandMoreIcon color="primary" />}
                    aria-controls="timeline-information"
                    id="timeline-information"
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
                        <TimeIcon />
                        <Typography variant="h5" fontWeight="medium">
                            Timeline
                        </Typography>
                        <Chip
                            label={`${Object.keys(timeline).length} Events`}
                            size="small"
                            color="secondary"
                            sx={{ ml: 1 }}
                        />
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                    <Timeline position={isMobile ? "right" : "alternate"}>
                        {Object.keys(timeline).map((key, index) => {
                            const dotColor = generateColor(key);
                            const formattedValue = formatTimeValue(timeline[key]);

                            return (
                                <TimelineItem key={index}>
                                    {!isMobile && (
                                        <TimelineOppositeContent
                                            sx={{
                                                pt: 3,
                                                maxWidth: '40%'
                                            }}
                                            color="text.secondary"
                                        >
                                            <Tooltip title="Date/Time" placement="top">
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        backgroundColor: theme.palette.background.paper,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            boxShadow: theme.shadows[3],
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <EventIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {formattedValue}
                                                    </Typography>
                                                </Paper>
                                            </Tooltip>
                                        </TimelineOppositeContent>
                                    )}

                                    <TimelineSeparator>
                                        {index > 0 && (
                                            <TimelineConnector
                                                sx={{
                                                    minHeight: 20,
                                                    bgcolor: theme.palette.mode === 'dark'
                                                        ? 'rgba(255,255,255,0.1)'
                                                        : 'rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        )}

                                        <Tooltip title={key} placement="top">
                                            <TimelineDot
                                                sx={{
                                                    bgcolor: dotColor,
                                                    boxShadow: theme.shadows[3],
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        transform: 'scale(1.2)',
                                                        boxShadow: theme.shadows[5]
                                                    },
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </Tooltip>

                                        {index < Object.keys(timeline).length - 1 && (
                                            <TimelineConnector
                                                sx={{
                                                    minHeight: 20,
                                                    bgcolor: theme.palette.mode === 'dark'
                                                        ? 'rgba(255,255,255,0.1)'
                                                        : 'rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        )}
                                    </TimelineSeparator>

                                    <TimelineContent sx={{ pt: 3 }}>
                                        <Card
                                            elevation={2}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                borderLeft: `4px solid ${dotColor}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    boxShadow: theme.shadows[4],
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight="bold"
                                                sx={{ wordBreak: 'break-word' }}
                                            >
                                                {key}
                                            </Typography>

                                            {isMobile && (
                                                <Box
                                                    sx={{
                                                        mt: 1,
                                                        pt: 1,
                                                        borderTop: `1px dashed ${theme.palette.divider}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}
                                                >
                                                    <EventIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formattedValue}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Card>
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                </AccordionDetails>
            </Accordion>
        </Card>
    );
};

export default TimeLine;
