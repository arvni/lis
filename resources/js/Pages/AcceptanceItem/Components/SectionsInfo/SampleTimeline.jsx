import React, { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Chip,
    Divider,
    ListItem,
    Paper,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import List from '@mui/material/List';
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator,
} from '@mui/lab';
import {
    Done as DoneIcon,
    Close as CloseIcon,
    Info as InfoIcon,
    CheckCircle,
    ErrorOutlined as ErrorOutline,
    CalendarToday,
} from '@mui/icons-material';
import { Link } from '@inertiajs/react';
import Document from '@/Pages/Document.jsx';
import { workflowStatus, formatDateTime } from './constants.jsx';
import StatusDot from './StatusDot.jsx';
import UserAvatar from './UserAvatar.jsx';

// Timeline Component for individual sample
const SampleTimeline = ({ acceptanceItemStates, onOpenDoneForm, onOpenRejectForm }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedDoc, setSelectedDoc] = useState(null);

    const handleOpenFile = (doc) => (e) => {
        e.preventDefault();
        setSelectedDoc(doc);
    };

    const handleCloseFile = () => setSelectedDoc(null);

    const renderParameterValue = (parameter) => {
        if (parameter.type === 'file' && parameter.value) {
            return (
                <>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={handleOpenFile(parameter.value)}
                        href={route(
                            'documents.download',
                            parameter.value.id || parameter.value.hash,
                        )}
                        target="_blank"
                        sx={{ mt: 0.5, borderRadius: 1 }}
                        title={parameter.value.originalName}
                    >
                        View File
                    </Button>
                    <Document document={selectedDoc} onClose={handleCloseFile} />
                </>
            );
        }

        return <Typography variant="body2">{parameter.value || '-'}</Typography>;
    };

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
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    backgroundColor: theme.palette.background.paper,
                                    borderRight:
                                        index % 2 === 0
                                            ? `4px solid ${theme.palette.primary.main}`
                                            : 'none',
                                    borderLeft:
                                        index % 2 !== 0
                                            ? `4px solid ${theme.palette.primary.main}`
                                            : 'none',
                                    borderRadius: 2,
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        boxShadow: theme.shadows[4],
                                        transform: 'translateY(-3px)',
                                    },
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    href={route('sections.show', acceptanceItemState.section.id)}
                                    component={Link}
                                    fontWeight="bold"
                                    gutterBottom
                                    sx={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {acceptanceItemState.section.name}
                                </Typography>

                                <Chip
                                    icon={workflowStatus[acceptanceItemState.status].icon}
                                    label={workflowStatus[acceptanceItemState.status].label}
                                    size="small"
                                    color={workflowStatus[acceptanceItemState.status].color}
                                    sx={{ fontWeight: 'medium', mt: 0.5 }}
                                />
                            </Paper>
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
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ mb: 2, alignItems: 'center' }}
                                    >
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            badgeContent={
                                                <CalendarToday fontSize="small" color="action" />
                                            }
                                        >
                                            <UserAvatar
                                                name={acceptanceItemState.started_by?.name}
                                            />
                                        </Badge>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Started by{' '}
                                                <Typography component="span" fontWeight="bold">
                                                    {acceptanceItemState.started_by?.name ||
                                                        'Unknown'}
                                                </Typography>
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDateTime(acceptanceItemState.started_at)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                )}

                                {['finished', 'rejected'].includes(acceptanceItemState.status) && (
                                    <>
                                        {acceptanceItemState.parameters &&
                                            acceptanceItemState.parameters.length > 0 && (
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
                                                        <InfoIcon
                                                            fontSize="small"
                                                            color="primary"
                                                        />
                                                        Parameters
                                                    </Typography>

                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 1,
                                                            mb: 2,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <List dense disablePadding>
                                                            {(typeof acceptanceItemState.parameters !==
                                                            'string'
                                                                ? acceptanceItemState.parameters
                                                                : JSON.parse(
                                                                      acceptanceItemState.parameters,
                                                                  )
                                                            ).map((parameter, paramIndex) => (
                                                                <React.Fragment key={paramIndex}>
                                                                    {paramIndex > 0 && <Divider />}
                                                                    <ListItem
                                                                        sx={{
                                                                            py: 1,
                                                                            px: 2,
                                                                            backgroundColor:
                                                                                paramIndex % 2 === 0
                                                                                    ? 'transparent'
                                                                                    : theme.palette
                                                                                          .action
                                                                                          .hover,
                                                                        }}
                                                                    >
                                                                        <Stack
                                                                            direction={{
                                                                                xs: 'column',
                                                                                sm: 'row',
                                                                            }}
                                                                            spacing={1}
                                                                            sx={{
                                                                                justifyContent:
                                                                                    'space-between',
                                                                                alignItems: {
                                                                                    xs: 'flex-start',
                                                                                    sm: 'center',
                                                                                },
                                                                                width: '100%',
                                                                            }}
                                                                        >
                                                                            <Typography
                                                                                variant="subtitle2"
                                                                                color="text.primary"
                                                                                fontWeight="medium"
                                                                            >
                                                                                {parameter.name}:
                                                                            </Typography>
                                                                            {renderParameterValue(
                                                                                parameter,
                                                                            )}
                                                                        </Stack>
                                                                    </ListItem>
                                                                </React.Fragment>
                                                            ))}
                                                        </List>
                                                    </Paper>
                                                </>
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
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    alignItems: 'center',
                                                    mt: 2,
                                                    pt: 2,
                                                    borderTop: `1px dashed ${theme.palette.divider}`,
                                                }}
                                            >
                                                <Badge
                                                    overlap="circular"
                                                    anchorOrigin={{
                                                        vertical: 'bottom',
                                                        horizontal: 'right',
                                                    }}
                                                    badgeContent={
                                                        acceptanceItemState.status ===
                                                        'finished' ? (
                                                            <CheckCircle
                                                                fontSize="small"
                                                                color="success"
                                                            />
                                                        ) : (
                                                            <CloseIcon
                                                                fontSize="small"
                                                                color="error"
                                                            />
                                                        )
                                                    }
                                                >
                                                    <UserAvatar
                                                        name={acceptanceItemState.finished_by?.name}
                                                    />
                                                </Badge>
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {acceptanceItemState.status === 'finished'
                                                            ? 'Completed'
                                                            : 'Rejected'}{' '}
                                                        by{' '}
                                                        <Typography
                                                            component="span"
                                                            fontWeight="bold"
                                                        >
                                                            {acceptanceItemState.finished_by
                                                                ?.name || 'Unknown'}
                                                        </Typography>
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {formatDateTime(
                                                            acceptanceItemState.finished_at,
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        )}
                                    </>
                                )}

                                {acceptanceItemState.status === 'processing' && (
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={{ mt: 2, justifyContent: 'center' }}
                                    >
                                        <Button
                                            variant="outlined"
                                            startIcon={<DoneIcon />}
                                            onClick={onOpenDoneForm(acceptanceItemState.id)}
                                            color="success"
                                            sx={{
                                                borderRadius: 6,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.success.light,
                                                    borderColor: theme.palette.success.dark,
                                                    boxShadow: theme.shadows[2],
                                                },
                                            }}
                                        >
                                            Complete
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            startIcon={<CloseIcon />}
                                            onClick={onOpenRejectForm(acceptanceItemState.id)}
                                            color="error"
                                            sx={{
                                                borderRadius: 6,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.error.light,
                                                    borderColor: theme.palette.error.dark,
                                                    boxShadow: theme.shadows[2],
                                                },
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </Stack>
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
