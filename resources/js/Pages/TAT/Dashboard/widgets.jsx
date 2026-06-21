import {
    Box,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    TableCell,
    TableRow,
    Typography,
    alpha,
    useTheme,
    Skeleton,
} from '@mui/material';

// ── Summary card ──────────────────────────────────────────────────────────────
export const SummaryCard = ({ title, value, icon: Icon, color, subtitle }) => {
    const theme = useTheme();
    return (
        <Card
            elevation={2}
            sx={{
                borderRadius: 2,
                borderTop: `4px solid ${theme.palette[color]?.main ?? theme.palette.grey[400]}`,
                height: '100%',
            }}
        >
            <CardContent>
                <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>
                            {value ?? '—'}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette[color]?.main ?? '#ccc', 0.12),
                        }}
                    >
                        <Icon sx={{ color: `${color}.main`, fontSize: 28 }} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export const PriorityChip = ({ priority }) => {
    const map = {
        stat: { label: 'STAT', color: 'error' },
        urgent: { label: 'Urgent', color: 'warning' },
        routine: { label: 'Routine', color: 'default' },
    };
    const cfg = map[priority] ?? map.routine;
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="filled" />;
};

export const TATBar = ({ pct, isBreached }) => {
    const color = isBreached ? 'error' : pct >= 70 ? 'warning' : 'success';
    return (
        <Box sx={{ minWidth: 80 }}>
            <LinearProgress
                variant="determinate"
                value={Math.min(pct ?? 0, 100)}
                color={color}
                sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
                {pct != null ? `${pct}%` : '—'}
            </Typography>
        </Box>
    );
};

// ── Row skeleton ──────────────────────────────────────────────────────────────
export const SkeletonRows = ({ count = 5, cols = 7 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <TableRow key={i}>
                {Array.from({ length: cols }).map((__, j) => (
                    <TableCell key={j}>
                        <Skeleton variant="text" width="80%" />
                    </TableCell>
                ))}
            </TableRow>
        ))}
    </>
);
