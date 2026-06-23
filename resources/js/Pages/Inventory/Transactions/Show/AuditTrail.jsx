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

const AuditTrail = ({ histories }) => (
    <Card>
        <CardHeader title="Audit Trail" />
        <CardContent sx={{ p: 0, pt: 1 }}>
            {histories.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No history recorded yet.
                </Typography>
            ) : (
                <Timeline
                    sx={{
                        '& .MuiTimelineItem-root:before': { flex: 0, p: 0 },
                        pl: 1,
                    }}
                >
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
                                        {h.created_at}
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
                                </TimelineContent>
                            </TimelineItem>
                        );
                    })}
                </Timeline>
            )}
        </CardContent>
    </Card>
);

export default AuditTrail;
