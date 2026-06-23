import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatTime, tickFormatter } from './constants';

const SensorChart = ({ samples, hasHumidity, period, tz }) => {
    const theme = useTheme();

    if (samples.length === 0) {
        return (
            <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No data for this period.</Typography>
            </Box>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
                data={samples}
                margin={{ top: 8, right: hasHumidity ? 40 : 16, left: 0, bottom: 4 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                    dataKey="time"
                    tickFormatter={(ts) => tickFormatter(ts, period, tz)}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    tickLine={false}
                    axisLine={{ stroke: theme.palette.divider }}
                    minTickGap={40}
                />
                <YAxis
                    yAxisId="temp"
                    tickFormatter={(v) => `${v}°`}
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                />
                {hasHumidity && (
                    <YAxis
                        yAxisId="humidity"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                        tickLine={false}
                        axisLine={false}
                        width={38}
                    />
                )}
                <ChartTooltip
                    contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                    labelFormatter={(ts) => formatTime(ts, tz)}
                    formatter={(value, key) =>
                        key === 'temperature'
                            ? [`${value} °C`, 'Temperature']
                            : [`${value} %`, 'Humidity']
                    }
                />
                <Legend
                    formatter={(key) => (key === 'temperature' ? 'Temperature' : 'Humidity')}
                    wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                    yAxisId="temp"
                    dataKey="temperature"
                    type="monotone"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                />
                {hasHumidity && (
                    <Line
                        yAxisId="humidity"
                        dataKey="humidity"
                        type="monotone"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                    />
                )}
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default SensorChart;
