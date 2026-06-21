import {
    Box,
    Typography,
    Paper,
    Chip,
    Alert,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from '@mui/material';
import { AccessTime, Paid } from '@mui/icons-material';

// ─── Method Selection Table ────────────────────────────────────────────────────
const MethodTable = ({ methodTests = [], selectedId, onSelect }) => {
    if (!methodTests.length)
        return <Alert severity="info">No methods available for this test.</Alert>;

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
            <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        <TableCell>Method</TableCell>
                        <TableCell align="center">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.5,
                                }}
                            >
                                <AccessTime fontSize="inherit" /> TAT
                            </Box>
                        </TableCell>
                        <TableCell align="right">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 0.5,
                                }}
                            >
                                <Paid fontSize="inherit" /> Price
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {methodTests
                        .filter((m) => m?.status)
                        .map(({ id, method }) => (
                            <TableRow
                                key={id}
                                hover
                                selected={selectedId === id}
                                onClick={() => onSelect(id)}
                                sx={{
                                    cursor: 'pointer',
                                    '&.Mui-selected': { bgcolor: 'primary.50' },
                                }}
                            >
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        fontWeight={selectedId === id ? 'bold' : 'normal'}
                                    >
                                        {method?.name}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {method?.turnaround_time ? (
                                        <Chip
                                            label={`${method.turnaround_time}d`}
                                            size="small"
                                            color={method.turnaround_time <= 2 ? 'success' : 'primary'}
                                        />
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">
                                            —
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {method?.price_type === 'Fix' ? (
                                        <Typography variant="body2" fontWeight="medium">
                                            {method.price} OMR
                                        </Typography>
                                    ) : (
                                        <Chip
                                            label={method?.price_type}
                                            size="small"
                                            color="warning"
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default MethodTable;
