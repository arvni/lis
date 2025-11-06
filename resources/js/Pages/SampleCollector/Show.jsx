import React, {useEffect, useMemo} from "react";
import {RemoveRedEye} from "@mui/icons-material";
import {useSnackbar} from "notistack";
import {Paper, Typography, Grid, Divider} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import LoadMore from "@/Components/LoadMore";
import {usePage} from "@inertiajs/react";

const Show = () => {
    const {
        sampleCollector,
        collectRequests,
        success,
        status,
        errors
    } = usePage().props;

    const {enqueueSnackbar} = useSnackbar();

    const collectRequestsColumns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            width: 70,
        },
        {
            field: 'referrer',
            headerName: 'Referrer',
            width: 200,
            renderCell: ({row}) => row.referrer?.name || row.referrer?.fullName || 'N/A'
        },
        {
            field: 'referrer_orders_count',
            headerName: 'Orders Count',
            type: 'number',
            width: 150,
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            type: 'dateTime',
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
                    href={route("collect-requests.show", row.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RemoveRedEye/>
                </a>
            )
        }
    ], []);

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
                    Sample Collector Details
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Name
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {sampleCollector?.name || 'N/A'}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Email
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            {sampleCollector?.email || 'N/A'}
                        </Typography>
                    </Grid>

                </Grid>
            </Paper>

            <LoadMore
                title="Collect Requests"
                items={collectRequests || []}
                columns={collectRequestsColumns}
                defaultExpanded
                loadMoreLink={route("collect-requests.index", {sample_collector_id: sampleCollector?.id})}
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
                    title: "Sample Collectors",
                    link: route("sample-collectors.index"),
                    icon: null,
                },
                {
                    title: props.sampleCollector?.name || 'N/A',
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
