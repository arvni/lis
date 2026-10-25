import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

/**
 * The stage flows tests run on. Publishing a change makes a new version; pre-orders already
 * running keep the version they started on.
 */
const Index = () => {
    const { flows, errors, status, success } = usePage().props;
    const [copying, setCopying] = useState(null);
    const [name, setName] = useState('');

    const copy = () =>
        router.post(
            route('pre-orders.flows.copy', copying.id),
            { name },
            { onSuccess: () => setCopying(null) },
        );

    return (
        <>
            <Head title="Pre-order flows" />
            {errors?.action && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.action}
                </Alert>
            )}
            {success && status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    A test uses a flow once it is switched on for pre-orders in the test catalogue.
                    Publishing a change makes a new version: new pre-orders follow it, open ones
                    keep theirs.
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Flow</TableCell>
                            <TableCell>Family</TableCell>
                            <TableCell align="right">Version</TableCell>
                            <TableCell align="right">Tests</TableCell>
                            <TableCell align="right">Open pre-orders</TableCell>
                            <TableCell>Active</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {flows.map((f) => (
                            <TableRow key={f.id}>
                                <TableCell>
                                    <Link href={route('pre-orders.flows.edit', f.id)}>
                                        {f.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Chip size="small" variant="outlined" label={f.family} />
                                </TableCell>
                                <TableCell align="right">v{f.version}</TableCell>
                                <TableCell align="right">{f.tests_count}</TableCell>
                                <TableCell align="right">{f.open_pre_orders_count}</TableCell>
                                <TableCell>
                                    <Switch
                                        size="small"
                                        checked={f.active}
                                        onChange={(e) =>
                                            router.post(
                                                route('pre-orders.flows.active', f.id),
                                                { active: e.target.checked },
                                                { preserveScroll: true },
                                            )
                                        }
                                        inputProps={{ 'aria-label': `${f.name} active` }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            size="small"
                                            component={Link}
                                            href={route('pre-orders.flows.edit', f.id)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setName(`${f.name} (copy)`);
                                                setCopying(f);
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog
                open={Boolean(copying)}
                onClose={() => setCopying(null)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Copy {copying?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        label="Name of the new flow"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={Boolean(errors?.name)}
                        helperText={errors?.name}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCopying(null)}>Cancel</Button>
                    <Button variant="contained" onClick={copy} disabled={name.trim() === ''}>
                        Copy
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

Index.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Pre-orders', link: route('pre-orders.index'), icon: null },
            { title: 'Flows', link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Index;
