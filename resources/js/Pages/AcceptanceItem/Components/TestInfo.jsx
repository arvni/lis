import React from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Divider,
    Paper,
    Stack,
    Typography,
    useTheme
} from "@mui/material";
import {
    ArrowDownward,
    ExpandMore as ExpandMoreIcon,
    CheckCircle,
    Info as InfoIcon
} from "@mui/icons-material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineItem,
    TimelineSeparator
} from "@mui/lab";

const TestInfo = ({ method,test, defaultExpanded = true, showSections = true, showParameters = true }) => {
    const theme = useTheme();

    return (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                    expandIcon={<ExpandMoreIcon  sx={{color:"white"}} />}
                    aria-controls="test-information"
                    id="test-information"
                    sx={{
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon />
                        <Typography variant="h5" fontWeight="medium">Test Information</Typography>
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                    <Box sx={{
                        backgroundColor: theme.palette.background.paper,
                        p: 2,
                        borderRadius: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            sx={{ mb: 2 }}
                        >
                            <Chip
                                label={test.test_group?.name}
                                color="secondary"
                                size="medium"
                                sx={{ fontWeight: 500 }}
                            />
                            <KeyboardDoubleArrowRightIcon sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }} />
                            <Chip
                                label={test.name}
                                color="primary"
                                variant="outlined"
                                size="medium"
                                sx={{ fontWeight: 500 }}
                            />
                            <KeyboardDoubleArrowRightIcon sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }} />
                            <Typography
                                variant="h5"
                                component="span"
                                fontWeight="bold"
                                sx={{
                                    color: theme.palette.primary.main,
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: theme.palette.action.hover
                                }}
                            >
                                {method.name}
                            </Typography>
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    {showSections && (
                        <Accordion
                            sx={{
                                boxShadow: 'none',
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px !important',
                                '&:before': {
                                    display: 'none',
                                },
                                overflow: 'hidden'
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="workflow-information"
                                id="workflow-information"
                                sx={{
                                    backgroundColor: theme.palette.background.default,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircle fontSize="small" color="primary" />
                                    <Typography variant="h6" fontWeight="medium">Workflow</Typography>
                                    <Chip
                                        label={method.workflow.sections.length + " steps"}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ p: 3 }}>
                                <Timeline position="alternate">
                                    {method.workflow.sections.map((section, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineSeparator>
                                                <TimelineDot
                                                    color="primary"
                                                    variant={index === 0 ? "filled" : "outlined"}
                                                    sx={{
                                                        boxShadow: index === 0 ? 3 : 1,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            transform: 'scale(1.1)',
                                                        }
                                                    }}
                                                >
                                                    <ArrowDownward fontSize="small" />
                                                </TimelineDot>
                                                {index < method.workflow.sections.length - 1 && (
                                                    <TimelineConnector sx={{ bgcolor: theme.palette.primary.light }} />
                                                )}
                                            </TimelineSeparator>

                                            <TimelineContent sx={{ py: 1, px: 2 }}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: theme.palette.background.paper,
                                                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            boxShadow: 3,
                                                            transform: 'translateY(-2px)'
                                                        }
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                                                        {section.name}
                                                    </Typography>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent={index % 2 ? "flex-end" : "flex-start"}
                                                        flexWrap="wrap"
                                                        sx={{
                                                            mt: 1,
                                                            gap: 0.5
                                                        }}
                                                    >
                                                        {JSON.parse(section.pivot.parameters).map((parameter, paramIndex) => (
                                                            <Chip
                                                                key={paramIndex}
                                                                label={parameter.name}
                                                                size="small"
                                                                variant="outlined"
                                                                color="secondary"
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    fontWeight: 400,
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Paper>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
};

export default TestInfo;
