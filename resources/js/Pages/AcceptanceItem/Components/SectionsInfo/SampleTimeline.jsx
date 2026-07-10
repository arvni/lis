import React from 'react';
import { Box, Card, Chip, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator,
} from '@mui/lab';
import {
    Close as CloseIcon,
    CheckCircle,
    ErrorOutlined as ErrorOutline,
    CalendarToday,
} from '@mui/icons-material';
import { workflowStatus } from './constants.jsx';
import StatusDot from './StatusDot.jsx';
import SectionCard from './SampleTimeline/SectionCard.jsx';
import TimelineUserStamp from './SampleTimeline/TimelineUserStamp.jsx';
import ParametersList from './SampleTimeline/ParametersList.jsx';
import ProcessingActions from './SampleTimeline/ProcessingActions.jsx';

// Timeline Component for individual sample
const SampleTimeline = ({ acceptanceItemStates, onOpenDoneForm, onOpenRejectForm }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Timeline position={isMobile ? 'right' : 'alternate'} sx={{ px: { xs: 0, sm: 2 } }}>
            {acceptanceItemStates?.map((acceptanceItemState, index) => (
                <TimelineItem key={index}>
                    {!isMobile && (
                        <TimelineOppositeContent
                            sx={{
                                m: 'auto 0',
                                px: { xs: 1, sm: 2 },
                                py: 1,
                                maxWidth: { xs: '100%', sm: '30%' },
                            }}
                        >
                            <SectionCard acceptanceItemState={acceptanceItemState} index={index} />
                        </TimelineOppositeContent>
                    )}

                    <TimelineSeparator sx={{ justifyContent: 'center' }}>
                        {index > 0 && (
                            <TimelineConnector
                                sx={{
                                    bgcolor:
                                        acceptanceItemState.status === 'finished'
                                            ? theme.palette.success.light
                                            : acceptanceItemState.status === 'rejected'
                                              ? theme.palette.error.light
                                              : theme.palette.divider,
                                    minHeight: 40,
                                }}
                            />
                        )}

                        <StatusDot status={acceptanceItemState.status} />

                        {index < acceptanceItemStates.length - 1 && (
                            <TimelineConnector
                                sx={{
                                    bgcolor:
                                        acceptanceItemState.status === 'finished'
                                            ? theme.palette.success.light
                                            : theme.palette.divider,
                                    minHeight: 40,
                                }}
                            />
                        )}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
                        <Card
                            elevation={2}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    boxShadow: theme.shadows[4],
                                },
                            }}
                        >
                            {isMobile && (
                                <Box
                                    sx={{
                                        p: 2,
                                        backgroundColor: theme.palette.background.default,
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        sx={{
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {acceptanceItemState.section.name}
                                        </Typography>
                                        <Chip
                                            icon={workflowStatus[acceptanceItemState.status].icon}
                                            label={workflowStatus[acceptanceItemState.status].label}
                                            size="small"
                                            color={workflowStatus[acceptanceItemState.status].color}
                                            sx={{ fontWeight: 'medium' }}
                                        />
                                    </Stack>
                                </Box>
                            )}

                            <Box sx={{ p: 2 }}>
                                {acceptanceItemState.started_at && (
                                    <TimelineUserStamp
                                        badge={<CalendarToday fontSize="small" color="action" />}
                                        name={acceptanceItemState.started_by?.name}
                                        action="Started"
                                        timestamp={acceptanceItemState.started_at}
                                        sx={{ mb: 2 }}
                                    />
                                )}

                                {['finished', 'rejected'].includes(acceptanceItemState.status) && (
                                    <>
                                        {acceptanceItemState.parameters &&
                                            acceptanceItemState.parameters.length > 0 && (
                                                <ParametersList
                                                    parameters={acceptanceItemState.parameters}
                                                />
                                            )}

                                        {acceptanceItemState.details && (
                                            <>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    sx={{
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <ErrorOutline fontSize="small" color="error" />
                                                    Rejection Details
                                                </Typography>

                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: theme.palette.error.light,
                                                        color: theme.palette.error.dark,
                                                        borderLeft: `4px solid ${theme.palette.error.main}`,
                                                        borderRadius: 1,
                                                        mb: 2,
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {acceptanceItemState.details}
                                                    </Typography>
                                                </Paper>
                                            </>
                                        )}

                                        {acceptanceItemState.finished_at && (
                                            <TimelineUserStamp
                                                badge={
                                                    acceptanceItemState.status === 'finished' ? (
                                                        <CheckCircle
                                                            fontSize="small"
                                                            color="success"
                                                        />
                                                    ) : (
                                                        <CloseIcon fontSize="small" color="error" />
                                                    )
                                                }
                                                name={acceptanceItemState.finished_by?.name}
                                                action={
                                                    acceptanceItemState.status === 'finished'
                                                        ? 'Completed'
                                                        : 'Rejected'
                                                }
                                                timestamp={acceptanceItemState.finished_at}
                                                sx={{
                                                    mt: 2,
                                                    pt: 2,
                                                    borderTop: `1px dashed ${theme.palette.divider}`,
                                                }}
                                            />
                                        )}
                                    </>
                                )}

                                {acceptanceItemState.status === 'processing' && (
                                    <ProcessingActions
                                        onComplete={onOpenDoneForm(acceptanceItemState.id)}
                                        onReject={onOpenRejectForm(acceptanceItemState.id)}
                                    />
                                )}
                            </Box>
                        </Card>
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    );
};

export default SampleTimeline;
