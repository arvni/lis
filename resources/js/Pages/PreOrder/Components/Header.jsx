import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { router } from '@inertiajs/react';
import {
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';
import { MoreVert as MoreIcon } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';
import CloseDialog from './CloseDialog';
import { OWNER_LABEL, ageColor, daysSince, ownerColor, patientName } from './stage';

const post = (name, preOrder, data = {}) =>
    router.post(route(name, preOrder.id), data, { preserveScroll: true });

/** Who the case is, where it stands, its counsellor, and the rarely used hold/close actions. */
export default function Header({ preOrder }) {
    const [closing, setClosing] = useState(false);
    const [menu, setMenu] = useState(null);
    const { can, stage } = preOrder;
    const days = daysSince(stage.entered_at);
    const pick = (fn) => () => {
        setMenu(null);
        fn();
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        {patientName(preOrder, preOrder.main_patient_ref)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {preOrder.code} · {preOrder.referrer?.fullName}
                        {preOrder.main_test
                            ? ` · ${preOrder.main_test.name}${preOrder.flow ? ` (${preOrder.flow.name} flow)` : ''}`
                            : ' · no main test yet'}
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
                            <Chip
                                label={days === 0 ? 'Today' : `${days} d in this stage`}
                                size="small"
                                variant="outlined"
                                color={ageColor(days)}
                            />
                        )}
                    </Stack>
                </Box>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ ml: { md: 'auto' } }}
                >
                    <Box sx={{ width: 260 }}>
                        <SelectSearch
                            label="Counsellor"
                            size="small"
                            fullWidth
                            url={route('api.users.list')}
                            value={preOrder.assignee}
                            name="assignee"
                            onChange={(e) =>
                                post('pre-orders.assign', preOrder, {
                                    user_id: e.target.value?.id ?? null,
                                })
                            }
                        />
                    </Box>
                    {(can.hold || can.resume || can.close) && (
                        <>
                            <IconButton
                                aria-label="More actions"
                                onClick={(e) => setMenu(e.currentTarget)}
                            >
                                <MoreIcon />
                            </IconButton>
                            <Menu
                                anchorEl={menu}
                                open={Boolean(menu)}
                                onClose={() => setMenu(null)}
                            >
                                {can.hold && (
                                    <MenuItem
                                        onClick={pick(() => post('pre-orders.hold', preOrder))}
                                    >
                                        Put on hold
                                    </MenuItem>
                                )}
                                {can.resume && (
                                    <MenuItem
                                        onClick={pick(() => post('pre-orders.resume', preOrder))}
                                    >
                                        Resume
                                    </MenuItem>
                                )}
                                {can.close && (
                                    <MenuItem
                                        sx={{ color: 'error.main' }}
                                        onClick={pick(() => setClosing(true))}
                                    >
                                        Close case…
                                    </MenuItem>
                                )}
                            </Menu>
                        </>
                    )}
                </Stack>
            </Stack>

            {preOrder.progress.length > 0 && (
                <Box sx={{ overflowX: 'auto', mt: 2 }}>
                    <Stepper
                        alternativeLabel
                        sx={{ minWidth: 640 }}
                        activeStep={preOrder.progress.findIndex((s) => s.current)}
                    >
                        {preOrder.progress.map((s) => (
                            <Step key={s.code} completed={s.done}>
                                <StepLabel>{s.label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            )}

            <CloseDialog preOrder={preOrder} open={closing} onClose={() => setClosing(false)} />
        </Paper>
    );
}

Header.propTypes = { preOrder: PropTypes.object.isRequired };
