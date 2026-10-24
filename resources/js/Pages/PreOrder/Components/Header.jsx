import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';
import SelectSearch from '@/Components/SelectSearch';
import CloseDialog from './CloseDialog';
import { OWNER_LABEL, daysSince, ownerColor, patientName } from './stage';

const post = (name, preOrder, data = {}) =>
    router.post(route(name, preOrder.id), data, { preserveScroll: true });

/** Who, what stage, who must act, and the stage actions BION can take now. */
export default function Header({ preOrder }) {
    const [closing, setClosing] = useState(false);
    const { can, stage, exception } = preOrder;
    const days = daysSince(stage.entered_at);

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        {preOrder.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {patientName(preOrder, preOrder.main_patient_ref)} ·{' '}
                        {preOrder.referrer?.fullName}
                        {preOrder.main_test ? ` · ${preOrder.main_test.name}` : ''}
                        {preOrder.flow ? ` (${preOrder.flow.name} flow)` : ' · no flow yet'}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1 }}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                    >
                        <Chip label={stage.label} color="primary" variant="outlined" />
                        <Chip
                            label={`Waiting on ${OWNER_LABEL[stage.owner]}`}
                            color={ownerColor(stage.owner)}
                            size="small"
                        />
                        {days !== null && (
                            <Chip label={`${days} d in stage`} size="small" variant="outlined" />
                        )}
                    </Stack>
                    {stage.next_action && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Next: {stage.next_action}
                        </Typography>
                    )}
                </Box>
                <Stack spacing={1} sx={{ minWidth: 260 }}>
                    <SelectSearch
                        label="Counsellor"
                        size="small"
                        url={route('api.users.list')}
                        value={preOrder.assignee}
                        name="assignee"
                        onChange={(e) =>
                            post('pre-orders.assign', preOrder, {
                                user_id: e.target.value?.id ?? null,
                            })
                        }
                    />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {can.open_review && (
                            <Button
                                variant="contained"
                                onClick={() => post('pre-orders.open-review', preOrder)}
                            >
                                Open review
                            </Button>
                        )}
                        {can.confirm && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => post('pre-orders.confirm', preOrder)}
                            >
                                Confirm tests & release
                            </Button>
                        )}
                        {can.hold && (
                            <Button
                                variant="outlined"
                                onClick={() => post('pre-orders.hold', preOrder)}
                            >
                                Hold
                            </Button>
                        )}
                        {can.resume && (
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={() => post('pre-orders.resume', preOrder)}
                            >
                                Resume
                            </Button>
                        )}
                        {can.close && (
                            <Button variant="text" color="error" onClick={() => setClosing(true)}>
                                Close…
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Stack>

            {exception && (
                <Alert severity={preOrder.closed_at ? 'error' : 'warning'} sx={{ mt: 2 }}>
                    {preOrder.closed_at ? 'Closed' : 'On hold'} by {exception.by ?? exception.side}
                    {exception.reason ? ` — ${exception.reason}` : ''}
                    {exception.comment ? `: ${exception.comment}` : ''}
                </Alert>
            )}

            <Stepper
                alternativeLabel
                sx={{ mt: 3, overflowX: 'auto' }}
                activeStep={preOrder.progress.findIndex((s) => s.current)}
            >
                {preOrder.progress.map((s) => (
                    <Step key={s.code} completed={s.done}>
                        <StepLabel>{s.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <CloseDialog preOrder={preOrder} open={closing} onClose={() => setClosing(false)} />
        </Paper>
    );
}

Header.propTypes = { preOrder: PropTypes.object.isRequired };
