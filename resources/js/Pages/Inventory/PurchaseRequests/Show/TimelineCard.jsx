import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineDot,
    TimelineContent,
} from '@mui/lab';
import { EVENT_META } from './constants';

const TimelineCard = ({ histories = [] }) => (
    <Card>
        <CardHeader title="Timeline" />
        <CardContent sx={{ p: 0 }}>
            {histories.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No history yet.
                </Typography>
            ) : (
                <Timeline sx={{ '& .MuiTimelineItem-root:before': { flex: 0, p: 0 } }}>
                    {histories.map((h, idx) => {
                        const meta = EVENT_META[h.event] ?? {
                            label: h.event,
                            color: 'grey',
                            icon: null,
                        };
                        const isLast = idx === histories.length - 1;
                        return (
                            <TimelineItem key={h.id}>
                                <TimelineSeparator>
                                    <TimelineDot
                                        color={meta.color}
                                        variant={isLast ? 'filled' : 'outlined'}
                                        sx={{ m: 0.5 }}
                                    >
                                        {meta.icon}
                                    </TimelineDot>
                                    {!isLast && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent sx={{ pb: 2, pt: 0.5 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {meta.label}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                    >
                                        {h.user?.name}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        display="block"
                                    >
                                        {h.created_at?.substring(0, 10)}
                                    </Typography>
                                    {h.notes && (
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                p: 1,
                                                bgcolor: 'warning.50',
                                                borderRadius: 1,
                                                borderLeft: '3px solid',
                                                borderColor: 'warning.main',
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                {h.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                    {h.change_notes && (
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                p: 1,
                                                bgcolor: 'info.50',
                                                borderRadius: 1,
                                                borderLeft: '3px solid',
                                                borderColor: 'info.main',
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight={600}
                                            >
                                                What changed:{' '}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {h.change_notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </TimelineContent>
                            </TimelineItem>
                        );
                    })}
                </Timeline>
            )}
        </CardContent>
    </Card>
);

export default TimelineCard;
