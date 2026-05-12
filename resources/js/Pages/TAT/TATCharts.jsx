import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
    Box, Paper, Skeleton, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography, Chip, alpha, useTheme,
} from '@mui/material';

const AnalyticsTooltip = ({active, payload}) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <Paper elevation={3} sx={{p: 1.5, minWidth: 200}}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>{d.test_name}</Typography>
            <Typography variant="caption" display="block">Avg: <b>{d.avg_days} working days</b></Typography>
            <Typography variant="caption" display="block">Min: {d.min_days}d — Max: {d.max_days}d</Typography>
            <Typography variant="caption" display="block">Count: {d.count} reports</Typography>
            {d.target_days != null && (
                <Typography variant="caption" display="block" color={d.on_target ? 'success.main' : 'error.main'}>
                    Target: {d.target_days}d — {d.on_target ? '✓ On target' : '✗ Over target'}
                </Typography>
            )}
        </Paper>
    );
};

const TATCharts = ({ chartData, analyticsLoading, analyticsData }) => {
    const theme = useTheme();

    return (
        <>
            {/* Bar chart */}
            <Paper elevation={1} sx={{p: 2, mb: 3, borderRadius: 2}}>
                {analyticsLoading ? (
                    <Box>
                        <Skeleton variant="rectangular" height={320} sx={{borderRadius: 1}}/>
                    </Box>
                ) : chartData.length === 0 ? (
                    <Box sx={{py: 6, textAlign: 'center'}}>
                        <Typography color="text.secondary">No published reports in this period.</Typography>
                    </Box>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{top: 8, right: 24, left: 0, bottom: 60}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="short_name" angle={-35} textAnchor="end" tick={{fontSize: 12}} interval={0}/>
                                <YAxis unit="d" tick={{fontSize: 12}} label={{value: 'Working Days', angle: -90, position: 'insideLeft', offset: 10}}/>
                                <ReTooltip content={<AnalyticsTooltip/>}/>
                                <Legend verticalAlign="top"/>
                                <Bar dataKey="avg_days" name="Avg TAT (working days)" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={
                                            entry.on_target === false ? theme.palette.error.main
                                            : entry.on_target === true ? theme.palette.success.main
                                            : theme.palette.primary.main
                                        }/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
  <Stack direction="row" spacing={2} mt={1} sx={{justifyContent: "center"}}>
  <Stack direction="row" spacing={0.5} ><Box sx={{alignItems: "center", width: 12, height: 12, borderRadius: 1, bgcolor: 'success.main'}}/><Typography variant="caption">On target</Typography></Stack>
  <Stack direction="row" spacing={0.5} ><Box sx={{alignItems: "center", width: 12, height: 12, borderRadius: 1, bgcolor: 'error.main'}}/><Typography variant="caption">Over target</Typography></Stack>
  <Stack direction="row" spacing={0.5} ><Box sx={{alignItems: "center", width: 12, height: 12, borderRadius: 1, bgcolor: 'primary.main'}}/><Typography variant="caption">No target set</Typography></Stack>
                        </Stack>
                    </>
                )}
            </Paper>

            {/* Analytics table */}
            {!analyticsLoading && analyticsData.length > 0 && (
                <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{p: 2, borderBottom: `1px solid ${theme.palette.divider}`}}>
                        <Typography variant="subtitle1" fontWeight="bold">Details ({analyticsData.length} tests)</Typography>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Test</TableCell>
                                    <TableCell align="right">Reports</TableCell>
                                    <TableCell align="right">Avg (days)</TableCell>
                                    <TableCell align="right">Min (days)</TableCell>
                                    <TableCell align="right">Max (days)</TableCell>
                                    <TableCell align="right">Target (days)</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {analyticsData.map((row) => (
                                    <TableRow key={row.test_id} sx={{'&:hover': {bgcolor: alpha(theme.palette.primary.main, 0.04)}}}>
                                        <TableCell><Typography variant="body2">{row.test_name}</Typography></TableCell>
                                        <TableCell align="right">{row.count}</TableCell>
                                        <TableCell align="right"><Typography variant="body2" fontWeight="medium">{row.avg_days}</Typography></TableCell>
                                        <TableCell align="right" sx={{color: 'text.secondary'}}>{row.min_days}</TableCell>
                                        <TableCell align="right" sx={{color: 'text.secondary'}}>{row.max_days}</TableCell>
                                        <TableCell align="right">{row.target_days ?? '—'}</TableCell>
                                        <TableCell align="center">
                                            {row.on_target === null
                                                ? <Chip label="No target" size="small" variant="outlined"/>
                                                : row.on_target
                                                    ? <Chip label="On target" size="small" color="success" variant="filled"/>
                                                    : <Chip label="Over target" size="small" color="error" variant="filled"/>
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </>
    );
};

export default TATCharts;
