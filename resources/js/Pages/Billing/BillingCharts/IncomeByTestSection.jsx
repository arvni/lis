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

const IncomeByTestSection = ({ byTest, loading }) => {
    const theme = useTheme();

    return (
        <ChartSection title="Income by Test" icon={BarChartIcon} loading={loading}>
            {byTest.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No data
                </Typography>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={byTest} margin={{ top: 8, right: 16, left: 8, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                angle={-40}
                                textAnchor="end"
                                tick={{ fontSize: 11 }}
                                interval={0}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <ReTooltip content={<BarTooltip />} />
                            <Legend verticalAlign="top" />
                            <Bar
                                dataKey="invoiced_income"
                                name="Invoiced"
                                stackId="a"
                                radius={[0, 0, 0, 0]}
                                fill={theme.palette.primary.main}
                            />
                            <Bar
                                dataKey="non_invoiced_income"
                                name="Not Invoiced"
                                stackId="a"
                                radius={[4, 4, 0, 0]}
                                fill={theme.palette.warning.main}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                    <TableContainer sx={{ maxHeight: 260, mt: 2 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Test</TableCell>
                                    <TableCell align="right">Items</TableCell>
                                    <TableCell align="right" sx={{ color: 'primary.main' }}>
                                        Invoiced
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'warning.main' }}>
                                        Not Invoiced
                                    </TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {byTest.map((r, i) => (
                                    <TableRow
                                        key={i}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            },
                                        }}
                                    >
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell align="right">{r.count}</TableCell>
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

export default IncomeByTestSection;
