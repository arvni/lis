import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MergeIcon from '@mui/icons-material/Merge';
import axios from 'axios';
import { FIELD_LABELS, META_FIELD_LABELS, RELATION_LABELS } from './Merge/constants';
import { displayMetaValue, displayValue, smartDefaults } from './Merge/helpers';
import PatientSummaryCard from './Merge/PatientSummaryCard';
import ComparisonTable from './Merge/ComparisonTable';
import AvatarPicker from './Merge/AvatarPicker';
import ConfirmMergeDialog from './Merge/ConfirmMergeDialog';

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

                            <AvatarPicker
                                comparison={comparison}
                                choices={choices}
                                keepSide={keepSide}
                                onChoose={setChoice}
                            />

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

            <ConfirmMergeDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={submit}
                processing={processing}
                keepPatient={keepPatient}
                removePatient={removePatient}
            />
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
