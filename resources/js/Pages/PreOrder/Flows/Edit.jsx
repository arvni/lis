import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    FormControlLabel,
    MenuItem,
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

const PRE_TEST = ['AWAITING_PRE_SAMPLES', 'PRE_RECEIVED', 'PRE_IN_PROGRESS', 'PRE_COMPLETED'];
const BATCHES = ['BATCH_OPEN', 'READY_FOR_TESTING'];
const BATCH_MODE_LABEL = {
    per_batch: 'One order per batch',
    pooled: 'Pooled into the first order',
    join: 'Later samples join the first order',
};

/** The stage that switches its group: the pre-test and batch stages go on and off together. */
const leaderOf = (code) =>
    PRE_TEST.includes(code) ? PRE_TEST[0] : BATCHES.includes(code) ? BATCHES[0] : code;

/**
 * One row per library stage. The order is fixed; a flow only switches optional stages, words
 * them for the center (English and Arabic), and sets reminders and the files it asks for.
 */
const Edit = () => {
    const { flow, library, documentTags, batchModes, errors, status, success } = usePage().props;
    const { data, setData, put, processing } = useForm({ name: flow.name, stages: flow.stages });

    const value = (code, field) => data.stages[code]?.[field] ?? '';
    const set = (code, field, v) =>
        setData('stages', {
            ...data.stages,
            [code]: { ...(data.stages[code] ?? { stage: code }), [field]: v },
        });
    const modeOf = (code) => value(leaderOf(code), 'mode') || 'off';
    const batchesOn = modeOf('BATCH_OPEN') !== 'off';
    const error = (code, field) => errors?.[`stages.${code}.${field}`];

    const publish = () => put(route('pre-orders.flows.update', flow.id), { preserveScroll: true });

    return (
        <>
            <Head title={`Flow: ${flow.name}`} />
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
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        label="Flow name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={Boolean(errors?.name)}
                        helperText={errors?.name}
                        sx={{ minWidth: 320 }}
                    />
                    <Chip variant="outlined" label={`Family: ${flow.family}`} />
                    <Chip label={`Published: v${flow.version}`} />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="contained" onClick={publish} disabled={processing}>
                        Publish as v{flow.version + 1}
                    </Button>
                </Stack>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                >
                    Pre-orders already running stay on v{flow.version}. Leave a label empty to use
                    the library wording.
                </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Stage</TableCell>
                            <TableCell>Used</TableCell>
                            <TableCell>Label for the center (EN / AR)</TableCell>
                            <TableCell>Next action (EN / AR)</TableCell>
                            <TableCell>Remind / escalate after (hours)</TableCell>
                            <TableCell>Files asked for</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {library.map((s) => {
                            const leader = leaderOf(s.code) === s.code;
                            const mode = modeOf(s.code);
                            return (
                                <TableRow key={s.code} sx={{ opacity: mode === 'off' ? 0.55 : 1 }}>
                                    <TableCell sx={{ minWidth: 200 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {s.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {s.code}
                                            {s.read_from_orders && ' · follows the lab'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>
                                        {s.always_on ? (
                                            <Chip size="small" label="Always" />
                                        ) : leader ? (
                                            <TextField
                                                select
                                                size="small"
                                                value={mode}
                                                onChange={(e) =>
                                                    set(s.code, 'mode', e.target.value)
                                                }
                                                fullWidth
                                            >
                                                <MenuItem value="on">On</MenuItem>
                                                <MenuItem value="off">Off</MenuItem>
                                                {s.rule && (
                                                    <MenuItem value="rule">When needed</MenuItem>
                                                )}
                                            </TextField>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                with{' '}
                                                {leaderOf(s.code)
                                                    .toLowerCase()
                                                    .replaceAll('_', ' ')}
                                            </Typography>
                                        )}
                                        {s.code === 'AWAITING_SAMPLES' && batchesOn && (
                                            <Stack spacing={1} sx={{ mt: 1 }}>
                                                <TextField
                                                    select
                                                    size="small"
                                                    label="Batches"
                                                    value={
                                                        value(s.code, 'batch_mode') || 'per_batch'
                                                    }
                                                    onChange={(e) =>
                                                        set(s.code, 'batch_mode', e.target.value)
                                                    }
                                                    error={Boolean(error(s.code, 'batch_mode'))}
                                                >
                                                    {batchModes.map((m) => (
                                                        <MenuItem key={m} value={m}>
                                                            {BATCH_MODE_LABEL[m] ?? m}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={Boolean(
                                                                data.stages[s.code]
                                                                    ?.center_can_close,
                                                            )}
                                                            onChange={(e) =>
                                                                set(
                                                                    s.code,
                                                                    'center_can_close',
                                                                    e.target.checked,
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label="Center can close batches"
                                                />
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 220 }}>
                                        <Stack spacing={1}>
                                            <TextField
                                                size="small"
                                                placeholder={s.label}
                                                value={value(s.code, 'label_en')}
                                                onChange={(e) =>
                                                    set(s.code, 'label_en', e.target.value)
                                                }
                                                inputProps={{ maxLength: 120 }}
                                            />
                                            <TextField
                                                size="small"
                                                placeholder="بالعربية"
                                                value={value(s.code, 'label_ar')}
                                                onChange={(e) =>
                                                    set(s.code, 'label_ar', e.target.value)
                                                }
                                                inputProps={{ maxLength: 120, dir: 'rtl' }}
                                            />
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 240 }}>
                                        <Stack spacing={1}>
                                            <TextField
                                                size="small"
                                                placeholder={s.action ?? ''}
                                                value={value(s.code, 'action_en')}
                                                onChange={(e) =>
                                                    set(s.code, 'action_en', e.target.value)
                                                }
                                                inputProps={{ maxLength: 200 }}
                                            />
                                            <TextField
                                                size="small"
                                                placeholder="بالعربية"
                                                value={value(s.code, 'action_ar')}
                                                onChange={(e) =>
                                                    set(s.code, 'action_ar', e.target.value)
                                                }
                                                inputProps={{ maxLength: 200, dir: 'rtl' }}
                                            />
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 170 }}>
                                        <Stack direction="row" spacing={1}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                label="Remind"
                                                value={value(s.code, 'remind_after_hours')}
                                                onChange={(e) =>
                                                    set(
                                                        s.code,
                                                        'remind_after_hours',
                                                        e.target.value,
                                                    )
                                                }
                                                error={Boolean(error(s.code, 'remind_after_hours'))}
                                                inputProps={{ min: 1, max: 2160 }}
                                            />
                                            <TextField
                                                size="small"
                                                type="number"
                                                label="Escalate"
                                                value={value(s.code, 'escalate_after_hours')}
                                                onChange={(e) =>
                                                    set(
                                                        s.code,
                                                        'escalate_after_hours',
                                                        e.target.value,
                                                    )
                                                }
                                                error={Boolean(
                                                    error(s.code, 'escalate_after_hours'),
                                                )}
                                                inputProps={{ min: 1, max: 2160 }}
                                            />
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 220 }}>
                                        <Autocomplete
                                            multiple
                                            size="small"
                                            options={documentTags}
                                            value={data.stages[s.code]?.required_documents ?? []}
                                            onChange={(_, v) =>
                                                set(s.code, 'required_documents', v)
                                            }
                                            getOptionLabel={(t) =>
                                                t.toLowerCase().replaceAll('_', ' ')
                                            }
                                            renderInput={(params) => (
                                                <TextField {...params} placeholder="None" />
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>
        </>
    );
};

Edit.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Pre-orders', link: route('pre-orders.index'), icon: null },
            { title: 'Flows', link: route('pre-orders.flows.index'), icon: null },
            { title: page.props.flow.name, link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Edit;
