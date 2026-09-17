import { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    GlobalStyles,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import DeleteForm from '@/Components/DeleteForm';
import { DEFAULT_CURRENCY } from '@/Pages/Inventory/PurchaseRequests/Print/company';
import SlipSheet from './Print/SlipSheet';

const pageStyles = {
    '@page': { size: 'A4', margin: '12mm' },
    body: {
        // Keep the brand fills (table header, net chip) when printing.
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
    },
};

let addedKey = 0;

const SalarySlipShow = () => {
    const { slip, canEdit, canIssue, canDelete, status, success, warnings } = usePage().props;

    const [lines, setLines] = useState([]);
    const [openDelete, setOpenDelete] = useState(false);

    // Reset whenever the server hands back a different version of the slip.
    useEffect(() => {
        setLines((slip.lines ?? []).map((line, index) => ({ ...line, _key: `s-${index}` })));
    }, [slip]);

    const { data, setData, put, processing } = useForm({ lines: [], notes: slip.notes ?? '' });

    const net = useMemo(
        () => lines.reduce((total, line) => total + (Number(line.amount) || 0), 0).toFixed(3),
        [lines],
    );

    const patch = (key, change) =>
        setLines((rows) => rows.map((row) => (row._key === key ? { ...row, ...change } : row)));

    const addLine = () =>
        setLines((rows) => [
            ...rows,
            {
                _key: `a-${(addedKey += 1)}`,
                code: 'ITEM',
                label: '',
                amount: '0.000',
                note: null,
                payroll_item_id: null,
                installment_number: null,
            },
        ]);

    const save = () => {
        setData(
            'lines',
            // Drop the editor's bookkeeping and the row id the update doesn't take, but keep what
            // ties a line to the item that made it.
            lines.map(({ _key: _unusedKey, id: _unusedId, ...line }) => line),
        );
        put(route('payroll.salary-slips.update', slip.id), { preserveScroll: true });
    };

    const issue = () =>
        router.put(route('payroll.salary-slips.issue', slip.id), {}, { preserveScroll: true });

    const isIssued = slip.status === 'ISSUED';

    return (
        <>
            <Head title={`Salary Slip ${slip.number ?? ''}`} />
            <GlobalStyles styles={pageStyles} />

            <Box sx={{ '@media print': { display: 'none' } }}>
                <PageHeader
                    title={`Salary Slip — ${slip.person.name}`}
                    subtitle={slip.number ? `${slip.number} · issued` : 'Draft — not yet issued'}
                    actions={
                        <Stack direction="row" spacing={1}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={() => router.visit(route('payroll.salary-slips.index'))}
                            >
                                Back
                            </Button>
                            {canIssue && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<SendIcon />}
                                    onClick={issue}
                                >
                                    Issue
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                onClick={() => window.print()}
                            >
                                Print
                            </Button>
                        </Stack>
                    }
                />

                {success === false && status && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {status}
                    </Alert>
                )}

                {/* A loan that has fallen behind the calendar: the slip is fine, the schedule isn't. */}
                {(warnings ?? []).map((warning) => (
                    <Alert severity="warning" sx={{ mb: 2 }} key={warning}>
                        {warning}
                    </Alert>
                ))}

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                        label={slip.status_label}
                        color={isIssued ? 'success' : 'default'}
                        variant="outlined"
                    />
                    {slip.issued_by && (
                        <Chip label={`Issued by ${slip.issued_by}`} variant="outlined" />
                    )}
                </Stack>

                {canEdit && (
                    <Paper
                        elevation={0}
                        sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            Lines
                        </Typography>

                        {isIssued && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                This slip has already been issued. {slip.person.name} can see it, so
                                anything you change here changes the copy they are looking at.
                            </Alert>
                        )}

                        {lines.map((line) => (
                            <Grid
                                container
                                spacing={2}
                                key={line._key}
                                sx={{ mb: 1.5 }}
                                alignItems="center"
                            >
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <TextField
                                        label="Item"
                                        fullWidth
                                        size="small"
                                        value={line.label}
                                        onChange={(e) => patch(line._key, { label: e.target.value })}
                                        helperText={line.note || ' '}
                                    />
                                </Grid>
                                <Grid size={{ xs: 10, sm: 4 }}>
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        inputProps={{ step: '0.001' }}
                                        value={line.amount}
                                        onChange={(e) =>
                                            patch(line._key, { amount: e.target.value })
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    {DEFAULT_CURRENCY}
                                                </InputAdornment>
                                            ),
                                        }}
                                        helperText="Negative takes it off"
                                    />
                                </Grid>
                                <Grid size={{ xs: 2, sm: 1 }}>
                                    <IconButton
                                        aria-label="Remove line"
                                        onClick={() =>
                                            setLines((rows) =>
                                                rows.filter((r) => r._key !== line._key),
                                            )
                                        }
                                    >
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}

                        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                            <Button startIcon={<AddIcon />} onClick={addLine}>
                                Add line
                            </Button>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="h6">
                                    Net {DEFAULT_CURRENCY} {net}
                                </Typography>
                                <Button variant="contained" onClick={save} disabled={processing}>
                                    Save
                                </Button>
                            </Stack>
                        </Stack>

                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={2}
                            sx={{ mt: 2 }}
                            value={data.notes ?? ''}
                            onChange={(e) => setData('notes', e.target.value)}
                        />

                        {canDelete && (
                            <Button
                                color="error"
                                sx={{ mt: 2 }}
                                onClick={() => setOpenDelete(true)}
                            >
                                Delete draft
                            </Button>
                        )}
                    </Paper>
                )}
            </Box>

            <SlipSheet slip={slip} lines={lines} net={net} />

            {openDelete && (
                <DeleteForm
                    title="Delete this draft?"
                    message="It has not been issued, so nobody has seen it."
                    agreeCB={() =>
                        router.post(route('payroll.salary-slips.destroy', slip.id), {
                            _method: 'delete',
                        })
                    }
                    disAgreeCB={() => setOpenDelete(false)}
                    openDelete={openDelete}
                />
            )}
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Salary Slips', link: route('payroll.salary-slips.index'), icon: null },
    { title: 'Slip', link: null, icon: null },
];

SalarySlipShow.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default SalarySlipShow;
