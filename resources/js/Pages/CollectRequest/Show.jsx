import React, {useEffect, useMemo} from "react";
import {RemoveRedEye, LocationOn} from "@mui/icons-material";
import {useSnackbar} from "notistack";
import {Paper, Typography, Grid2 as Grid, Divider, Chip, Box, Button, Card, CardContent} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoadMore from "@/Components/LoadMore";
import {usePage} from "@inertiajs/react";
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend} from 'recharts';

const Show = () => {
    const {
        collectRequest,
        sampleCollector,
        referrer,
        referrerOrders,
        success,
        status,
        errors
    } = usePage().props;

    const {enqueueSnackbar} = useSnackbar();

    const referrerOrdersColumns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            width: 70,
        },
        {
            field: 'order_id',
            headerName: 'Order ID',
            type: 'string',
            width: 150,
        },
        {
            field: 'patient',
            headerName: 'Patient',
            width: 200,
            renderCell: ({row}) => row.patient?.fullName || 'N/A'
        },
        {
            field: 'status',
            headerName: 'Status',
            type: 'string',
            width: 150,
        },
        {
            field: 'received_at',
            headerName: 'Received At',
            width: 180,
        },
        {
            field: "action",
            headerName: 'Action',
            type: 'string',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: ({row}) => (
                <a
                    href={route("referrer-orders.show", row.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RemoveRedEye/>
                </a>
            )
        }
    ], []);

    // Prepare temperature data for chart
    const temperatureData = useMemo(() => {
        if (!collectRequest?.logistic_information?.temperature_logs) return [];

        return collectRequest.logistic_information.temperature_logs.map((log, index) => ({
            time: new Date(log.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            temperature: parseFloat(log.value),
            fullTimestamp: new Date(log.timestamp).toLocaleString()
        }));
    }, [collectRequest]);

    // Calculate temperature statistics
    const temperatureStats = useMemo(() => {
        if (!collectRequest?.logistic_information?.temperature_logs?.length) return null;

        const temps = collectRequest.logistic_information.temperature_logs.map(l => parseFloat(l.value));
        return {
            min: Math.min(...temps).toFixed(2),
            max: Math.max(...temps).toFixed(2),
            avg: (temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(2),
            count: temps.length
        };
    }, [collectRequest]);

    // Generate Google Maps link
    const getGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    useEffect(() => {
        if (success) {
            enqueueSnackbar(status || 'Success', {
                variant: "success"
            });
        }

        if (errors) {
            Object.entries(errors).forEach(([_, message]) =>
                enqueueSnackbar(message, {
                    variant: "error"
                })
            );
        }
    }, [success, errors, enqueueSnackbar, status]);

    return (
        <div>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Collect Request Details
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Sample Collector
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {sampleCollector?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {sampleCollector?.email || ''}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Referrer
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {referrer?.name || referrer?.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {referrer?.email || ''}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs:12}}>
                        <Divider sx={{ my: 2 }}>Logistics Information</Divider>
                    </Grid>

                    {collectRequest?.logistic_information ? (
                        <>
                            {/* Journey Times */}
                            <Grid size={{ xs:12, sm:6}}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Journey Started
                                        </Typography>
                                        <Typography variant="h6">
                                            {collectRequest.logistic_information.started_at
                                                ? new Date(collectRequest.logistic_information.started_at).toLocaleString()
                                                : 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid size={{ xs:12, sm:6}}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" color="primary" gutterBottom>
                                            Journey Ended
                                        </Typography>
                                        <Typography variant="h6">
                                            {collectRequest.logistic_information.ended_at
                                                ? new Date(collectRequest.logistic_information.ended_at).toLocaleString()
                                                : 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Starting Location */}
                            {collectRequest.logistic_information.starting_location && (
                                <Grid size={{ xs:12, sm:6}}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Starting Location
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Lat: {collectRequest.logistic_information.starting_location.latitude},
                                                    Lng: {collectRequest.logistic_information.starting_location.longitude}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Accuracy: {parseFloat(collectRequest.logistic_information.starting_location.accuracy).toFixed(2)}m
                                                </Typography>
                                                <br />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(collectRequest.logistic_information.starting_location.timestamp).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<LocationOn />}
                                                href={getGoogleMapsLink(
                                                    collectRequest.logistic_information.starting_location.latitude,
                                                    collectRequest.logistic_information.starting_location.longitude
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                fullWidth
                                            >
                                                View on Google Maps
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Ending Location */}
                            {collectRequest.logistic_information.ending_location && (
                                <Grid size={{ xs:12, sm:6}}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Ending Location
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Lat: {collectRequest.logistic_information.ending_location.latitude},
                                                    Lng: {collectRequest.logistic_information.ending_location.longitude}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Accuracy: {parseFloat(collectRequest.logistic_information.ending_location.accuracy).toFixed(2)}m
                                                </Typography>
                                                <br />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(collectRequest.logistic_information.ending_location.timestamp).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<LocationOn />}
                                                href={getGoogleMapsLink(
                                                    collectRequest.logistic_information.ending_location.latitude,
                                                    collectRequest.logistic_information.ending_location.longitude
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                fullWidth
                                            >
                                                View on Google Maps
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Temperature Graph */}
                            {temperatureData.length > 0 && (
                                <Grid size={{ xs:12}}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Temperature Monitoring
                                            </Typography>

                                            {/* Statistics */}
                                            {temperatureStats && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    gap: 2,
                                                    mb: 2,
                                                    flexWrap: 'wrap',
                                                    justifyContent: 'space-around'
                                                }}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Min Temp
                                                        </Typography>
                                                        <Typography variant="h6" color="primary">
                                                            {temperatureStats.min}°C
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Max Temp
                                                        </Typography>
                                                        <Typography variant="h6" color="error">
                                                            {temperatureStats.max}°C
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Avg Temp
                                                        </Typography>
                                                        <Typography variant="h6" color="success.main">
                                                            {temperatureStats.avg}°C
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Total Readings
                                                        </Typography>
                                                        <Typography variant="h6">
                                                            {temperatureStats.count}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Graph */}
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
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Barcodes */}
                            {collectRequest.logistic_information.barcodes &&
                             collectRequest.logistic_information.barcodes.length > 0 && (
                                <Grid size={{ xs:12}}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Barcodes Scanned
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                                {collectRequest.logistic_information.barcodes.map((barcode, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={barcode}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </>
                    ) : (
                        <Grid size={{ xs:12}}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                                        No logistics information available
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    <Grid size={{ xs:12}}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid size={{ xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Created At
                        </Typography>
                        <Typography variant="body1">
                            {new Date(collectRequest?.created_at).toLocaleString()}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Updated At
                        </Typography>
                        <Typography variant="body1">
                            {new Date(collectRequest?.updated_at).toLocaleString()}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <LoadMore
                title="Referrer Orders"
                items={referrerOrders || []}
                columns={referrerOrdersColumns}
                defaultExpanded
                loadMoreLink={route("referrer-orders.index", {collect_request_id: collectRequest?.id})}
            />
        </div>
    );
};

Show.layout = (page) => {
    const {props} = page;
    return (
        <AuthenticatedLayout
            auth={props.auth}
            breadcrumbs={[
                {
                    title: "Collect Requests",
                    link: route("collect-requests.index"),
                    icon: null,
                },
                {
                    title: `Collect Request #${props.collectRequest?.id}`,
                    link: null,
                    icon: null,
                }
            ]}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default Show;
