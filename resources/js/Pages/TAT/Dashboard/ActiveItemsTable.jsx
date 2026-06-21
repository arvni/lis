import { Link } from '@inertiajs/react';
import {
    Box,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    alpha,
    useTheme,
    Pagination,
    CircularProgress,
} from '@mui/material';
import { ErrorOutlined as ErrorOutline } from '@mui/icons-material';
import { PriorityChip, TATBar, SkeletonRows } from './widgets';

const ActiveItemsTable = ({ itemsData, itemsLoading, onPageChange }) => {
    const theme = useTheme();

    return (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Typography variant="subtitle1" fontWeight="bold">
                    Active Items
                </Typography>
                <Chip
                    label={itemsLoading ? '…' : itemsData.meta.total}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
                {itemsLoading && <CircularProgress size={16} sx={{ ml: 'auto' }} />}
            </Box>
            <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Ref / Patient</TableCell>
                            <TableCell>Tests</TableCell>
                            <TableCell>Sections</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Last Added</TableCell>
                            <TableCell>Deadline</TableCell>
                            <TableCell>TAT Progress</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {itemsLoading && itemsData.data.length === 0 ? (
                            <SkeletonRows count={8} cols={7} />
                        ) : itemsData.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No active acceptances
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            itemsData.data.map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        bgcolor: row.is_breached
                                            ? alpha(theme.palette.error.main, 0.06)
                                            : row.is_at_risk
                                              ? alpha(theme.palette.warning.main, 0.06)
                                              : undefined,
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        },
                                        opacity: itemsLoading ? 0.5 : 1,
                                    }}
                                >
                                    <TableCell>
                                        <Link
                                            href={route('acceptances.show', row.id)}
                                            style={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight="medium"
                                                color="primary.main"
                                                sx={{
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                    },
                                                }}
                                            >
                                                {row.reference_code ?? `#${row.id}`}
                                            </Typography>
                                        </Link>
                                        <Typography variant="caption" color="text.secondary">
                                            {row.patient_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 180 }}>
                                        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
                                            {(row.tests ?? []).map((t, i) => (
                                                <Chip
                                                    key={i}
                                                    label={t}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap' }}>
                                            {(row.sections ?? []).length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    —
                                                </Typography>
                                            ) : (
                                                row.sections.map((s) => (
                                                    <Link
                                                        key={s.id}
                                                        href={route('sections.show', s.id)}
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        <Chip
                                                            label={s.name}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            clickable
                                                            sx={{ fontSize: '0.7rem' }}
                                                        />
                                                    </Link>
                                                ))
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <PriorityChip priority={row.priority} />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="TAT clock starts from when the last test was added">
                                            <Typography variant="body2" color="text.secondary">
                                                {row.start_time
                                                    ? new Date(row.start_time).toLocaleDateString()
                                                    : '—'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        {row.deadline ? (
                                            <Tooltip
                                                title={`${row.elapsed_working_days}d elapsed / ${row.max_tat}d TAT · ${row.active_items_count} pending test(s)`}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    sx={{ alignItems: 'center' }}
                                                >
                                                    {row.is_breached && (
                                                        <ErrorOutline
                                                            fontSize="small"
                                                            color="error"
                                                        />
                                                    )}
                                                    <Typography
                                                        variant="body2"
                                                        color={
                                                            row.is_breached
                                                                ? 'error.main'
                                                                : 'text.primary'
                                                        }
                                                        fontWeight={
                                                            row.is_breached ? 'bold' : 'normal'
                                                        }
                                                    >
                                                        {new Date(
                                                            row.deadline,
                                                        ).toLocaleDateString()}
                                                    </Typography>
                                                </Stack>
                                            </Tooltip>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>
                                        {row.max_tat > 0 ? (
                                            <TATBar
                                                pct={row.progress_pct}
                                                isBreached={row.is_breached}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                No TAT set
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {itemsData.meta.last_page > 1 && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        p: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Pagination
                        count={itemsData.meta.last_page}
                        page={itemsData.meta.current_page}
                        onChange={onPageChange}
                        color="primary"
                        disabled={itemsLoading}
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Paper>
    );
};

export default ActiveItemsTable;
