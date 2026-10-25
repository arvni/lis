import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Button,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const heading = (key) => key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ');

/** One report as a plain table; the Excel export has the same rows. */
const ReportTable = ({ title, rows }) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            {title}
        </Typography>
        {rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
                Nothing in this period.
            </Typography>
        ) : (
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {Object.keys(rows[0]).map((k) => (
                            <TableCell
                                key={k}
                                align={typeof rows[0][k] === 'number' ? 'right' : 'left'}
                            >
                                {heading(k)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i}>
                            {Object.entries(row).map(([k, v]) => (
                                <TableCell key={k} align={typeof v === 'number' ? 'right' : 'left'}>
                                    {v}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
    </Paper>
);

/** Pre-order management reports for a period (open-by-stage is always as of now). */
const Reports = () => {
    const { reports, titles, period } = usePage().props;
    const [range, setRange] = useState(period);

    return (
        <>
            <Head title="Pre-order reports" />
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                sx={{ mb: 2 }}
                alignItems="center"
            >
                <TextField
                    size="small"
                    type="date"
                    label="From"
                    value={range.from}
                    onChange={(e) => setRange({ ...range, from: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    size="small"
                    type="date"
                    label="To"
                    value={range.to}
                    onChange={(e) => setRange({ ...range, to: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                />
                <Button
                    variant="outlined"
                    onClick={() => router.get(route('pre-orders.reports'), range)}
                >
                    Apply
                </Button>
                <Button
                    startIcon={<FileDownload />}
                    href={route('pre-orders.reports.export', range)}
                >
                    Excel
                </Button>
            </Stack>
            <Grid container spacing={2}>
                {Object.entries(titles).map(([key, title]) => (
                    <Grid key={key} size={{ xs: 12, lg: 6 }}>
                        <ReportTable title={title} rows={reports[key] ?? []} />
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

Reports.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Pre-orders', link: route('pre-orders.index'), icon: null },
            { title: 'Reports', link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Reports;
