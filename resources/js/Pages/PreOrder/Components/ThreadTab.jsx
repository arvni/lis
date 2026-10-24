import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from '@inertiajs/react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';

const when = (iso) => (iso ? new Date(iso).toLocaleString() : '');

/**
 * Messages with the center, or BION-only internal notes. Text is always rendered as plain
 * text: nothing a center writes is ever interpreted as HTML.
 */
export default function ThreadTab({ preOrder, internal }) {
    const entries = internal
        ? preOrder.notes
        : preOrder.history.filter((h) => h.type === 'comment');
    const { data, setData, post, processing, errors, reset } = useForm({ body: '', internal });

    const send = () =>
        post(route('pre-orders.notes.store', preOrder.id), {
            preserveScroll: true,
            onSuccess: () => reset('body'),
        });

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {internal && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                    Internal notes are never shown to the center.
                </Alert>
            )}
            <Stack spacing={1.5}>
                {entries.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        Nothing yet.
                    </Typography>
                )}
                {entries.map((e, i) => (
                    <Box
                        key={e.id ?? i}
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: e.side === 'center' ? 'action.hover' : 'background.default',
                            border: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {e.actor_name ?? (e.side === 'center' ? 'Center' : 'BION')} ·{' '}
                            {when(e.created_at)}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {e.body}
                        </Typography>
                    </Box>
                ))}
            </Stack>
            <TextField
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                label={internal ? 'Internal note' : 'Message to the center'}
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
                error={Boolean(errors.body)}
                helperText={errors.body}
            />
            <Button
                sx={{ mt: 1 }}
                variant="contained"
                onClick={send}
                disabled={processing || !data.body.trim()}
            >
                {internal ? 'Save note' : 'Send'}
            </Button>
        </Paper>
    );
}

ThreadTab.propTypes = {
    preOrder: PropTypes.object.isRequired,
    internal: PropTypes.bool,
};
