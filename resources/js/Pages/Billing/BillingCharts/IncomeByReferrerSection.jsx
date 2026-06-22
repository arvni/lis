import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    alpha,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import ChartSection from './ChartSection';
import BarTooltip from './BarTooltip';
import { fmt } from './constants';

const IncomeByReferrerSection = ({ byReferrer, loading }) => {
    const theme = useTheme();

    return (
        <ChartSection title="Income by Referrer" icon={BarChartIcon} loading={loading}>
            {byReferrer.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No data
                </Typography>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={Math.max(260, byReferrer.length * 40)}>
                        <BarChart
                            data={byReferrer}
                            layout="vertical"
                            margin={{ top: 4, right: 100, left: 120, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={115}
                            />
                            <ReTooltip content={<BarTooltip />} />
                            <Legend verticalAlign="top" />
                            <Bar
                                dataKey="invoiced_income"
                                name="Invoiced"
                                stackId="a"
                                fill={theme.palette.secondary.main}
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="non_invoiced_income"
                                name="Not Invoiced"
                                stackId="a"
                                fill={theme.palette.warning.main}
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                    <TableContainer sx={{ maxHeight: 220, mt: 2 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Referrer</TableCell>
                                    <TableCell align="right">Acceptances</TableCell>
                                    <TableCell align="right" sx={{ color: 'secondary.main' }}>
                                        Invoiced
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'warning.main' }}>
                                        Not Invoiced
                                    </TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {byReferrer.map((r, i) => (
                                    <TableRow
                                        key={i}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.secondary.main, 0.04),
                                            },
                                        }}
                                    >
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell align="right">{r.acceptance_count}</TableCell>
                                        <TableCell align="right">{fmt(r.invoiced_income)}</TableCell>
                                        <TableCell align="right">
                                            {fmt(r.non_invoiced_income)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <b>{fmt(r.invoiced_income + r.non_invoiced_income)}</b>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </ChartSection>
    );
};

export default IncomeByReferrerSection;
