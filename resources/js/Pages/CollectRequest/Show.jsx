import React, { useEffect, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { Paper, Typography, Grid as Grid, Divider } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LoadMore from '@/Components/LoadMore';
import { Head, usePage } from '@inertiajs/react';
import { referrerOrdersColumns } from './Show/constants';
import { buildTemperatureData, buildTemperatureStats } from './Show/helpers';
import LogisticsSection from './Show/LogisticsSection';

const Show = () => {
    const { collectRequest, sampleCollector, referrer, referrerOrders, success, status, errors } =
        usePage().props;

    const { enqueueSnackbar } = useSnackbar();

    const temperatureData = useMemo(() => buildTemperatureData(collectRequest), [collectRequest]);
    const temperatureStats = useMemo(() => buildTemperatureStats(collectRequest), [collectRequest]);

    useEffect(() => {
        if (success) {
            enqueueSnackbar(status || 'Success', {
                variant: 'success',
            });
        }

        if (errors) {
            Object.entries(errors).forEach(([_, message]) =>
                enqueueSnackbar(message, {
                    variant: 'error',
                }),
            );
        }
    }, [success, errors, enqueueSnackbar, status]);

    return (
        <div>
            <Head title={`Collect Request #${collectRequest?.id ?? ''}`} />
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Collect Request Details
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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

                    <Grid size={{ xs: 12, sm: 6 }}>
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

                    {collectRequest?.barcode && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Barcode
                            </Typography>
                            <Typography variant="body1">{collectRequest.barcode}</Typography>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }}>Logistics Information</Divider>
                    </Grid>

                    <LogisticsSection
                        logistics={collectRequest?.logistic_information}
                        temperatureData={temperatureData}
                        temperatureStats={temperatureStats}
                    />

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Created At
                        </Typography>
                        <Typography variant="body1">
                            {new Date(collectRequest?.created_at).toLocaleString()}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
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
                loadMoreLink={route('referrer-orders.index', {
                    collect_request_id: collectRequest?.id,
                })}
            />
        </div>
    );
};

Show.layout = (page) => {
    const { props } = page;
    return (
        <AuthenticatedLayout
            auth={props.auth}
            breadcrumbs={[
                {
                    title: 'Collect Requests',
                    link: route('collect-requests.index'),
                    icon: null,
                },
                {
                    title: `Collect Request #${props.collectRequest?.id}`,
                    link: null,
                    icon: null,
                },
            ]}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default Show;
