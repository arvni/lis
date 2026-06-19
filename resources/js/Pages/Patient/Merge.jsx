import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControlLabel,
    Paper,
    Radio,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MergeIcon from '@mui/icons-material/Merge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import axios from 'axios';
import countries from '@/Data/Countries.js';

const FIELD_LABELS = {
    firstName: 'First Name',
    secondName: 'Second Name',
    thirdName: 'Third Name',
    lastName: 'Last Name',
    fullName: 'Full Name',
    idNo: 'ID No./Passport No.',
    nationality: 'Nationality',
    dateOfBirth: 'Date Of Birth',
    gender: 'Gender',
    phone: 'Phone',
    tribe: 'Tribe',
    wilayat: 'Wilayat',
    governorate: 'Governorate',
    village: 'Village',
};

const META_FIELD_LABELS = {
    maritalStatus: 'Marital Status',
    company: 'Company',
    profession: 'Profession',
    address: 'Address',
    email: 'Email',
    details: 'Details',
};

const RELATION_LABELS = {
    acceptances: 'Acceptances',
    consultations: 'Consultations',
    samples: 'Samples',
    invoices: 'Invoices',
    payments: 'Payments',
    documents: 'Documents',
    relatives: 'Relatives',
};

const isEmpty = (v) => v === null || v === undefined || v === '';

const avatarUrl = (value, gender) =>
    value || `/images/${['male', 'female'].includes(gender) ? gender : 'unknown'}.png`;

const formatAge = (date) => {
    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    let days = now.getDate() - date.getDate();
    if (days < 0) months -= 1;
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    if (years >= 1) return `${years} Y`;
    if (months >= 1) return `${months} M`;
    return `${Math.max(0, Math.round((now - date) / 86400000))} D`;
};

const formatDob = (value) => {
    if (isEmpty(value)) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const date = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
    return `${date} (${formatAge(d)})`;
};

const displayValue = (field, value) => {
    if (isEmpty(value)) return '—';
    if (field === 'dateOfBirth') return formatDob(value);
    if (field === 'nationality') return countries.find((c) => c.code === value)?.label ?? value;
    return String(value);
};

const displayMetaValue = (field, value) => {
    if (field === 'maritalStatus') {
        if (value === 1 || value === '1') return 'Married';
        if (value === 0 || value === '0') return 'Single';
        return 'Unknown';
    }
    if (isEmpty(value)) return '—';
    return String(value);
};

// Default value source per key: the kept patient's value, falling back to the
// other patient only when the kept value is empty.
const smartDefaults = (keys, bucket, data, keepSide) => {
    const other = keepSide === 'first' ? 'second' : 'first';
    const next = {};
    keys.forEach((key) => {
        next[key] = isEmpty(data[keepSide][bucket][key]) ? other : keepSide;
    });
    return next;
};

/** A clickable value cell that doubles as a radio. */
const ChoiceCell = ({ selected, onSelect, children }) => (
    <TableCell
        onClick={onSelect}
        sx={{
            cursor: 'pointer',
            borderLeft: '3px solid',
            borderLeftColor: selected ? 'primary.main' : 'transparent',
            backgroundColor: selected ? 'action.selected' : 'transparent',
            transition: 'background-color .15s',
            '&:hover': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
        }}
    >
        <Stack direction="row" spacing={1} alignItems="center">
            <Radio checked={selected} size="small" sx={{ p: 0.5 }} />
            <Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box>
        </Stack>
    </TableCell>
);

const PatientSummaryCard = ({ patient, keep, onKeep }) => (
    <Card
        variant="outlined"
        sx={{
            height: '100%',
            borderWidth: 2,
            borderColor: keep ? 'success.main' : 'error.light',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <Box
            sx={{
                px: 2,
                py: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#fff',
                backgroundColor: keep ? 'success.main' : 'error.main',
            }}
        >
            {keep ? <CheckCircleIcon fontSize="small" /> : <DeleteOutlineIcon fontSize="small" />}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                {keep ? 'KEEP — survives the merge' : 'DELETE — removed after merge'}
            </Typography>
        </Box>
        <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    src={avatarUrl(patient.fields.avatar, patient.fields.gender)}
                    sx={{ width: 64, height: 64, border: '1px solid', borderColor: 'divider' }}
                />
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                        {patient.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {displayValue('idNo', patient.fields.idNo)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {displayValue('phone', patient.fields.phone)}
                    </Typography>
                </Box>
            </Stack>
            {!keep && (
                <Button
                    size="small"
                    sx={{ mt: 1.5 }}
                    startIcon={<SwapHorizIcon />}
                    onClick={onKeep}
                >
                    Keep this one instead
                </Button>
            )}
        </CardContent>
    </Card>
);

const Merge = () => {
    const { fields, metaFields } = usePage().props;
    const textFields = useMemo(() => fields.filter((f) => f !== 'avatar'), [fields]);

    const [first, setFirst] = useState(null);
    const [second, setSecond] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(false);
    const [keepSide, setKeepSide] = useState('first'); // which selected patient survives
    const [choices, setChoices] = useState({}); // profile field => "first" | "second"
    const [metaChoices, setMetaChoices] = useState({}); // meta field => "first" | "second"
    const [onlyDiff, setOnlyDiff] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { post, processing, errors, transform } = useForm();

    // Load side-by-side comparison whenever both patients are picked.
    useEffect(() => {
        if (!first?.id || !second?.id || first.id === second.id) {
            setComparison(null);
            return;
        }
        setLoading(true);
        axios
            .get(route('api.patients.mergeCompare'), {
                params: { first_id: first.id, second_id: second.id },
            })
            .then(({ data }) => setComparison(data))
            .finally(() => setLoading(false));
    }, [first?.id, second?.id]);

    // (Re)compute smart defaults whenever the data or the kept side changes.
    useEffect(() => {
        if (!comparison) return;
        setChoices(smartDefaults(fields, 'fields', comparison, keepSide));
        setMetaChoices(smartDefaults(metaFields, 'meta', comparison, keepSide));
    }, [comparison, keepSide, fields, metaFields]);

    const keepPatient = comparison?.[keepSide];
    const removePatient = comparison?.[keepSide === 'first' ? 'second' : 'first'];

    const setChoice = (field, source) => setChoices((p) => ({ ...p, [field]: source }));
    const setMetaChoice = (field, source) => setMetaChoices((p) => ({ ...p, [field]: source }));

    const preferAll = (source) => {
        setChoices(Object.fromEntries(fields.map((f) => [f, source])));
        setMetaChoices(Object.fromEntries(metaFields.map((f) => [f, source])));
    };
    const resetDefaults = () => {
        setChoices(smartDefaults(fields, 'fields', comparison, keepSide));
        setMetaChoices(smartDefaults(metaFields, 'meta', comparison, keepSide));
    };

    const diffCount = useMemo(() => {
        if (!comparison) return 0;
        const f = fields.filter(
            (k) => (comparison.first.fields[k] ?? '') !== (comparison.second.fields[k] ?? ''),
        ).length;
        const m = metaFields.filter(
            (k) => (comparison.first.meta[k] ?? '') !== (comparison.second.meta[k] ?? ''),
        ).length;
        return f + m;
    }, [comparison, fields, metaFields]);

    const submit = () => {
        if (!comparison) return;
        const attributes = {};
        fields.forEach((field) => {
            attributes[field] = comparison[choices[field] ?? keepSide].fields[field];
        });
        const meta = {};
        metaFields.forEach((field) => {
            meta[field] = comparison[metaChoices[field] ?? keepSide].meta[field];
        });
        transform(() => ({
            keep_id: keepPatient.id,
            remove_id: removePatient.id,
            attributes,
            meta,
        }));
        post(route('patients.merge'), { onSuccess: () => setConfirmOpen(false) });
    };

    const ready = comparison && keepPatient && removePatient;

    const sameSelected = first?.id && second?.id && first.id === second.id;

    return (
        <>
            <Head title="Merge Patients" />
            <PageHeader
                title="Merge Patients"
                description="Combine two patient records into one. Pick the surviving patient and the best value for each field; all acceptances, samples, invoices, documents and other relations move to the kept patient and the other is permanently deleted."
            />

            <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="overline" color="text.secondary">
                        Step 1 — Select two patients
                    </Typography>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={first}
                                onChange={(e) => setFirst(e.target.value)}
                                url={route('api.patients.list')}
                                label="Patient A"
                                name="first"
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={second}
                                onChange={(e) => setSecond(e.target.value)}
                                url={route('api.patients.list')}
                                label="Patient B"
                                name="second"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    {sameSelected && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Please select two different patients.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {loading && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, mb: 3 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading comparison…</Typography>
                </Stack>
            )}

            {ready && (
                <>
                    {/* Step 2 — which record survives */}
                    <Typography variant="overline" color="text.secondary" sx={{ px: 0.5 }}>
                        Step 2 — Choose the record to keep
                    </Typography>
                    <Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5, mb: 3 }}>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <PatientSummaryCard
                                patient={comparison.first}
                                keep={keepSide === 'first'}
                                onKeep={() => setKeepSide('first')}
                            />
                        </Grid>
                        <Grid
                            size={{ xs: 12, md: 2 }}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Tooltip title="Swap which patient is kept">
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        setKeepSide((s) => (s === 'first' ? 'second' : 'first'))
                                    }
                                    sx={{ minWidth: 0, borderRadius: '50%', width: 56, height: 56 }}
                                >
                                    <SwapHorizIcon />
                                </Button>
                            </Tooltip>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <PatientSummaryCard
                                patient={comparison.second}
                                keep={keepSide === 'second'}
                                onKeep={() => setKeepSide('second')}
                            />
                        </Grid>
                    </Grid>

                    {/* Step 3 — resolve field values */}
                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1.5}
                                sx={{
                                    alignItems: { md: 'center' },
                                    justifyContent: 'space-between',
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Step 3 — Pick the winning value for each field
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {diffCount} field{diffCount === 1 ? '' : 's'} differ between
                                        the two records.
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => preferAll('first')}
                                    >
                                        Use all from {comparison.first.fullName}
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => preferAll('second')}
                                    >
                                        Use all from {comparison.second.fullName}
                                    </Button>
                                    <Button size="small" onClick={resetDefaults}>
                                        Smart defaults
                                    </Button>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={onlyDiff}
                                                onChange={(e) => setOnlyDiff(e.target.checked)}
                                            />
                                        }
                                        label="Only differences"
                                    />
                                </Box>
                            </Stack>

                            {/* Avatar picker */}
                            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                    Photo / ID image
                                </Typography>
                                <Grid container spacing={2} alignItems="center">
                                    {['first', 'second'].map((side) => {
                                        const selected = (choices.avatar ?? keepSide) === side;
                                        const p = comparison[side];
                                        return (
                                            <Grid size={{ xs: 6, sm: 3 }} key={side}>
                                                <Paper
                                                    onClick={() => setChoice('avatar', side)}
                                                    elevation={selected ? 6 : 0}
                                                    variant={selected ? 'elevation' : 'outlined'}
                                                    sx={{
                                                        p: 1,
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        borderColor: selected
                                                            ? 'primary.main'
                                                            : 'divider',
                                                        outline: selected ? '2px solid' : 'none',
                                                        outlineColor: 'primary.main',
                                                    }}
                                                >
                                                    <Box
                                                        component="img"
                                                        src={avatarUrl(
                                                            p.fields.avatar,
                                                            p.fields.gender,
                                                        )}
                                                        alt={p.fullName}
                                                        sx={{
                                                            width: '100%',
                                                            height: 120,
                                                            objectFit: 'cover',
                                                            borderRadius: 1,
                                                            mb: 1,
                                                            backgroundColor: 'grey.100',
                                                        }}
                                                    />
                                                    <Stack
                                                        direction="row"
                                                        spacing={0.5}
                                                        justifyContent="center"
                                                        alignItems="center"
                                                    >
                                                        <Radio
                                                            checked={selected}
                                                            size="small"
                                                            sx={{ p: 0 }}
                                                        />
                                                        <Typography variant="caption" noWrap>
                                                            {p.fullName}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Typography variant="caption" color="text.secondary">
                                                Result
                                            </Typography>
                                            <Avatar
                                                src={avatarUrl(
                                                    comparison[choices.avatar ?? keepSide].fields
                                                        .avatar,
                                                    comparison[choices.avatar ?? keepSide].fields
                                                        .gender,
                                                )}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    border: '2px solid',
                                                    borderColor: 'primary.main',
                                                }}
                                            />
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <ComparisonTable
                                title="Basic information"
                                keys={textFields}
                                labels={FIELD_LABELS}
                                bucket="fields"
                                display={displayValue}
                                comparison={comparison}
                                choices={choices}
                                keepSide={keepSide}
                                onlyDiff={onlyDiff}
                                onChoose={setChoice}
                                alwaysShow={['nationality']}
                            />

                            <Box sx={{ mt: 3 }}>
                                <ComparisonTable
                                    title="Patient details"
                                    keys={metaFields}
                                    labels={META_FIELD_LABELS}
                                    bucket="meta"
                                    display={displayMetaValue}
                                    comparison={comparison}
                                    choices={metaChoices}
                                    keepSide={keepSide}
                                    onlyDiff={onlyDiff}
                                    onChoose={setMetaChoice}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Related records — all of these move to the kept patient
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Object.entries(RELATION_LABELS).map(([key, label]) => (
                                    <Chip
                                        key={key}
                                        icon={<SwapHorizIcon />}
                                        label={`${label}: +${removePatient.relations[key]} (had ${keepPatient.relations[key]})`}
                                        variant="outlined"
                                    />
                                ))}
                            </Box>

                            {errors && Object.keys(errors).length > 0 && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {Object.values(errors).join(' ')}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sticky action bar */}
                    <Paper
                        elevation={8}
                        sx={{
                            position: 'sticky',
                            bottom: 16,
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="body2">
                            Keeping{' '}
                            <Chip size="small" color="success" label={keepPatient.fullName} /> ·
                            deleting{' '}
                            <Chip size="small" color="error" label={removePatient.fullName} />
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button onClick={() => router.visit(route('patients.index'))}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<MergeIcon />}
                                disabled={processing}
                                onClick={() => setConfirmOpen(true)}
                            >
                                Merge Patients
                            </Button>
                        </Stack>
                    </Paper>
                </>
            )}

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" /> Confirm merge
                </DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        This will permanently delete <strong>{removePatient?.fullName}</strong> and
                        move all of its acceptances, samples, invoices, payments, documents and
                        other records to <strong>{keepPatient?.fullName}</strong>.
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This action cannot be undone.
                        </Alert>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        disabled={processing}
                        onClick={submit}
                    >
                        Merge &amp; Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const ComparisonTable = ({
    title,
    keys,
    labels,
    bucket,
    display,
    comparison,
    choices,
    keepSide,
    onlyDiff,
    onChoose,
    alwaysShow = [],
}) => {
    const rows = keys.filter((key) => {
        if (!onlyDiff || alwaysShow.includes(key)) return true;
        return (comparison.first[bucket][key] ?? '') !== (comparison.second[bucket][key] ?? '');
    });

    return (
        <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {title}
            </Typography>
            {rows.length === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ mb: 1 }}>
                    All {title.toLowerCase()} fields match — nothing to choose.
                </Alert>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow
                                sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.50' } }}
                            >
                                <TableCell sx={{ width: '20%' }}>Field</TableCell>
                                <TableCell>{comparison.first.fullName}</TableCell>
                                <TableCell>{comparison.second.fullName}</TableCell>
                                <TableCell sx={{ width: '22%' }}>Result</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((key) => {
                                const a = comparison.first[bucket][key];
                                const b = comparison.second[bucket][key];
                                const source = choices[key] ?? keepSide;
                                return (
                                    <TableRow key={key} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {labels[key] ?? key}
                                        </TableCell>
                                        <ChoiceCell
                                            selected={source === 'first'}
                                            onSelect={() => onChoose(key, 'first')}
                                        >
                                            {display(key, a)}
                                        </ChoiceCell>
                                        <ChoiceCell
                                            selected={source === 'second'}
                                            onSelect={() => onChoose(key, 'second')}
                                        >
                                            {display(key, b)}
                                        </ChoiceCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {display(key, comparison[source][bucket][key])}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
};

const breadCrumbs = [
    { title: 'Patients', link: route('patients.index'), icon: null },
    { title: 'Merge', link: '', icon: null },
];

Merge.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Merge;
