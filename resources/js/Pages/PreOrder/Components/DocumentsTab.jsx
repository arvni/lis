import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControlLabel,
    Link,
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
import { UploadFile } from '@mui/icons-material';

const TAG_LABEL = {
    MEDICAL_HISTORY: 'Medical history',
    ID_CARD: 'ID card',
    CONSENT_FORM: 'Consent form',
    REQUEST_FORM: 'Request form',
    PRESCRIPTION: 'Prescription',
    ACCEPTANCE_FORM: 'Acceptance form',
    PURCHASE_ORDER: 'Purchase order',
    PAYMENT_RECEIPT: 'Payment receipt',
    QUOTATION: 'Quotation',
    DOCUMENT: 'Other',
};

/**
 * The pre-order's files. The center's passed the upload checks (PDF, PNG, JPEG) before they were
 * stored. BION staff may attach any file except SVG, HTML, scripts and programs, and choose
 * whether the center sees it.
 */
export default function DocumentsTab({ preOrder, canReview }) {
    const input = useRef(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        title: '',
        description: '',
        tag: 'DOCUMENT',
        shared: false,
    });

    // Start the name from the file name; staff usually make it clearer.
    const pickFile = (file) => {
        setData((d) => ({
            ...d,
            file,
            title: d.title || (file?.name ?? '').replace(/\.[^.]+$/, '').slice(0, 150),
        }));
    };
    const requestOf = Object.fromEntries(
        preOrder.history
            .filter((h) => h.type === 'document' && h.request)
            .map((h) => [h.body, h.request]),
    );

    const upload = () =>
        post(route('pre-orders.documents.store', preOrder.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                if (input.current) input.current.value = '';
            },
        });

    return (
        <Stack spacing={2}>
            {canReview && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        Attach a file
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ md: 'flex-start' }}
                    >
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFile />}
                            sx={{ minWidth: 200, justifyContent: 'flex-start' }}
                        >
                            <Box
                                component="span"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 220,
                                }}
                            >
                                {data.file ? data.file.name : 'Choose a file'}
                            </Box>
                            <input
                                ref={input}
                                hidden
                                type="file"
                                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                            />
                        </Button>
                        <TextField
                            size="small"
                            label="Name"
                            required
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            error={Boolean(errors.title)}
                            helperText={errors.title}
                            inputProps={{ maxLength: 150 }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Type"
                            value={data.tag}
                            onChange={(e) => setData('tag', e.target.value)}
                            sx={{ minWidth: 180 }}
                        >
                            {preOrder.document_tags.map((t) => (
                                <MenuItem key={t} value={t}>
                                    {TAG_LABEL[t] ?? t}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <TextField
                        size="small"
                        label="Details (optional)"
                        placeholder="What is this file and why it matters, e.g. the patient's earlier report from another lab"
                        multiline
                        minRows={2}
                        fullWidth
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        error={Boolean(errors.description)}
                        helperText={errors.description}
                        inputProps={{ maxLength: 2000 }}
                        sx={{ mt: 2 }}
                    />
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mt: 1 }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={data.shared}
                                    onChange={(e) => setData('shared', e.target.checked)}
                                />
                            }
                            label="Show to the center"
                        />
                        <Button
                            variant="contained"
                            onClick={upload}
                            disabled={processing || !data.file || !data.title.trim()}
                        >
                            Attach
                        </Button>
                    </Stack>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                    >
                        Any file up to 50 MB except SVG, HTML, scripts and programs.
                    </Typography>
                    {(errors.file || errors.tag) && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {errors.file || errors.tag}
                        </Alert>
                    )}
                </Paper>
            )}

            <Paper variant="outlined">
                {preOrder.documents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        No files yet.
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '40%' }}>File</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>For request</TableCell>
                                <TableCell>Added</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {preOrder.documents.map((d) => (
                                <TableRow key={d.hash}>
                                    <TableCell>
                                        <Link
                                            href={route('pre-orders.documents.show', [
                                                preOrder.id,
                                                d.hash,
                                            ])}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {d.name}
                                        </Link>
                                        {d.description && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ whiteSpace: 'pre-wrap', mt: 0.25 }}
                                            >
                                                {d.description}
                                            </Typography>
                                        )}
                                        {d.file_name && d.file_name !== d.name && (
                                            <Typography variant="caption" color="text.secondary">
                                                {d.file_name}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{TAG_LABEL[d.tag] ?? d.tag}</TableCell>
                                    <TableCell>
                                        {d.from === 'bion' ? (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                color={d.shared ? 'primary' : 'default'}
                                                label={d.shared ? 'BION · shared' : 'BION only'}
                                            />
                                        ) : (
                                            'Center'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {requestOf[d.name] ? `R${requestOf[d.name]}` : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {d.created_at
                                            ? new Date(d.created_at).toLocaleString()
                                            : ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>
        </Stack>
    );
}

DocumentsTab.propTypes = {
    preOrder: PropTypes.object.isRequired,
    canReview: PropTypes.bool,
};
