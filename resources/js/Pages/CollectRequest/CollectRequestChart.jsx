import React from 'react';
import { Paper, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CollectRequestChart = ({ temperatureData }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={temperatureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
            />
            <YAxis
                label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                            <Paper sx={{ p: 1 }}>
                                <Typography variant="caption" display="block">
                                    {payload[0].payload.fullTimestamp}
                                </Typography>
                                <Typography variant="body2" color="primary">
                                    Temperature: {payload[0].value}°C
                                </Typography>
                            </Paper>
                        );
                    }
                    return null;
                }}
            />
            <Legend />
            <Line
                type="monotone"
                dataKey="temperature"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ fill: '#1976d2', r: 4 }}
                activeDot={{ r: 6 }}
                name="Temperature (°C)"
            />
        </LineChart>
    </ResponsiveContainer>
);

export default CollectRequestChart;
