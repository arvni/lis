import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Grid,
    MenuItem,
    TextField,
} from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import PurchaseRequestLinesEditor from '@/Pages/Inventory/PurchaseRequests/Components/PurchaseRequestLinesEditor';
import { lineFromSource, toPayload } from '@/Pages/Inventory/PurchaseRequests/Components/lineState';

const URGENCY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const Add = () => {
    const { defaults, units } = usePage().props;

    const [lineItems, setLineItems] = useState(() => defaults?.lines?.map(lineFromSource) ?? []);

    const { data, setData, post, processing, errors } = useForm({
        urgency: defaults?.urgency ?? 'NORMAL',
        notes: defaults?.notes ?? '',
        lines: lineItems.map(toPayload),
    });

    const syncLines = (updated) => {
        setLineItems(updated);
        setData('lines', updated.map(toPayload));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory.purchase-requests.store'));
    };

    return (
        <>
            <Head title="New Purchase Request" />
            <PageHeader title="New Purchase Request" />
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                <Card>
                    <CardHeader title="Request Details" />
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    label="Urgency"
                                    value={data.urgency}
                                    onChange={(e) => setData('urgency', e.target.value)}
                                >
                                    {URGENCY_OPTIONS.map((u) => (
                                        <MenuItem key={u} value={u}>
                                            {u}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Requested Items"
                        subheader="Add each item you need with its quantity. The estimated price is optional."
                    />
                    <CardContent>
                        <PurchaseRequestLinesEditor
                            lines={lineItems}
                            onChange={syncLines}
                            errors={errors}
                            units={units}
                        />
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        onClick={() => router.visit(route('inventory.purchase-requests.index'))}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Submit Request
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = [
    { title: 'Inventory', link: null },
    { title: 'Purchase Requests', link: route('inventory.purchase-requests.index') },
    { title: 'New Request', link: null },
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Add;
