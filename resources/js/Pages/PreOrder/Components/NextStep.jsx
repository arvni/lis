import React from 'react';
import PropTypes from 'prop-types';
import { router } from '@inertiajs/react';
import { Alert, AlertTitle, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { CheckCircle as DoneIcon, RadioButtonUnchecked as TodoIcon } from '@mui/icons-material';

const post = (name, preOrder, data = {}) =>
    router.post(route(name, preOrder.id), data, { preserveScroll: true });

const PRE_SAMPLE_STAGES = [
    'AWAITING_PRE_SAMPLES',
    'PRE_RECEIVED',
    'PRE_IN_PROGRESS',
    'PRE_COMPLETED',
    'AWAITING_SAMPLES',
    'BATCH_OPEN',
    'READY_FOR_TESTING',
    'TESTING',
    'TESTING_COMPLETED',
    'RESULTS_RELEASED',
];

/** One review check: done or not, and where to go to do it. */
const Check = ({ done, label, action }) => (
    <Stack direction="row" spacing={1} alignItems="center">
        {done ? (
            <DoneIcon color="success" fontSize="small" />
        ) : (
            <TodoIcon color="disabled" fontSize="small" />
        )}
        <Typography variant="body2" color={done ? 'text.secondary' : 'text.primary'}>
            {label}
        </Typography>
        {!done && action}
    </Stack>
);

Check.propTypes = {
    done: PropTypes.bool,
    label: PropTypes.string.isRequired,
    action: PropTypes.node,
};

/**
 * What BION has to do now on this case, in plain words, with the button that does it. Everything
 * else on the page is detail.
 */
export default function NextStep({ preOrder, onTab }) {
    const { can, stage, exception } = preOrder;
    const go = (tab, label) => (
        <Button size="small" onClick={() => onTab(tab)}>
            {label}
        </Button>
    );

    if (preOrder.closed_at) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Closed</AlertTitle>
                {exception?.reason ?? 'This pre-order is closed.'}
                {exception?.comment ? ` — ${exception.comment}` : ''}
            </Alert>
        );
    }

    if (exception) {
        const text = {
            finance_rejected: [
                'The center rejected the quotation, or it expired',
                'Revise the quotation and send it again, or close the case.',
                go('finance', 'Open finance'),
            ],
            sample_issue: [
                'A sample needs replacing',
                'The center has been asked for a replacement batch.',
                go('orders', 'Open samples'),
            ],
        }[exception.type] ?? [
            `On hold by ${exception.by ?? exception.side}`,
            [exception.reason, exception.comment].filter(Boolean).join(' — '),
            can.resume && (
                <Button color="inherit" onClick={() => post('pre-orders.resume', preOrder)}>
                    Resume
                </Button>
            ),
        ];
        return (
            <Alert severity="warning" sx={{ mb: 2 }} action={text[2]}>
                <AlertTitle>{text[0]}</AlertTitle>
                {text[1]}
            </Alert>
        );
    }

    let body;
    if (can.open_review) {
        body = {
            title: `New case from ${preOrder.referrer?.fullName ?? 'a center'}`,
            text: 'Open the review to start. The center sees that BION is reviewing it.',
            action: (
                <Button
                    variant="contained"
                    onClick={() => post('pre-orders.open-review', preOrder)}
                >
                    Open review
                </Button>
            ),
        };
    } else if (can.confirm) {
        const missingMethod = preOrder.items.filter(
            (i) => i.needs_method && i.methods?.length > 0 && !i.method_test_id,
        );
        const openRequests = preOrder.requests.filter((r) => r.status === 'open');
        const needsQuotation = (preOrder.finance_preview ?? []).length > 0;
        const ready =
            Boolean(preOrder.main_test) && missingMethod.length === 0 && openRequests.length === 0;
        body = {
            title: 'Review the case and agree the tests',
            text: (
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                    <Check
                        done={Boolean(preOrder.assignee)}
                        label={
                            preOrder.assignee
                                ? `Counsellor: ${preOrder.assignee.name}`
                                : 'Assign a counsellor (top right)'
                        }
                    />
                    <Check
                        done={Boolean(preOrder.main_test)}
                        label={
                            preOrder.main_test
                                ? `Main test: ${preOrder.main_test.name}`
                                : 'Choose the main test (the star on the Tests tab). It sets the flow.'
                        }
                        action={go('tests', 'Tests')}
                    />
                    <Check
                        done={missingMethod.length === 0}
                        label={
                            missingMethod.length
                                ? `Pick the method for ${missingMethod.map((i) => i.test_name).join(', ')}`
                                : 'Every test has its method'
                        }
                        action={go('tests', 'Tests')}
                    />
                    <Check
                        done={openRequests.length === 0}
                        label={
                            openRequests.length
                                ? `${openRequests.length} request(s) still waiting on the center`
                                : 'No open requests'
                        }
                        action={go('requests', 'Requests')}
                    />
                </Stack>
            ),
            action: needsQuotation ? (
                <Button
                    variant="contained"
                    color="success"
                    disabled={!ready}
                    onClick={() => onTab('finance')}
                >
                    Prepare the quotation
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color="success"
                    disabled={!ready}
                    onClick={() => post('pre-orders.confirm', preOrder)}
                >
                    Confirm tests & release
                </Button>
            ),
            hint: needsQuotation
                ? 'These tests need the center to approve the cost first.'
                : 'No approval is needed: confirming sends the order to the center.',
        };
    } else if (stage.code === 'AWAITING_INFO') {
        body = {
            title: 'Waiting for the center to answer',
            text: 'They have been asked for more information or samples.',
            action: go('requests', 'Open requests'),
        };
    } else if (can.revise_quotation) {
        const q = preOrder.quotations.find((x) => x.status === 'awaiting_center');
        body = {
            title: `Waiting for the center to approve ${q?.number ?? 'the quotation'}`,
            text: 'Nothing goes to the lab until they approve. You can still revise the quotation.',
            action: go('finance', 'Open finance'),
        };
    } else if (can.verify_finance) {
        body = {
            title: "Check the center's approval",
            text: 'The center approved the quotation. BION finance confirms it before release.',
            action: go('finance', 'Open finance'),
        };
    } else if (PRE_SAMPLE_STAGES.includes(stage.code)) {
        body = {
            title: stage.label,
            text: stage.next_action,
            action: go('orders', 'Open samples & orders'),
        };
    } else {
        body = { title: stage.label, text: stage.next_action };
    }

    const waitingOnCenter = stage.owner === 'center' && !can.confirm && !can.open_review;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                mb: 2,
                borderWidth: 2,
                borderColor: waitingOnCenter ? 'warning.light' : 'primary.main',
            }}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ md: 'center' }}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" color="text.secondary">
                        {waitingOnCenter ? 'Waiting on the center' : 'Next step for BION'}
                    </Typography>
                    <Typography variant="h6">{body.title}</Typography>
                    {typeof body.text === 'string' ? (
                        <Typography variant="body2" color="text.secondary">
                            {body.text}
                        </Typography>
                    ) : (
                        body.text
                    )}
                </Box>
                {body.action && (
                    <Stack spacing={0.5} alignItems={{ md: 'flex-end' }}>
                        {body.action}
                        {body.hint && (
                            <Typography variant="caption" color="text.secondary">
                                {body.hint}
                            </Typography>
                        )}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

NextStep.propTypes = { preOrder: PropTypes.object.isRequired, onTab: PropTypes.func.isRequired };
