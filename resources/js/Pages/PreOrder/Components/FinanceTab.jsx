import React from 'react';
import PropTypes from 'prop-types';
import { router, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
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
import { patientName } from './stage';
import { calcPrice } from '@/Services/pricing-utils';

export const FINANCE_COLOR = {
    awaiting_center: 'warning',
    approved: 'success',
    partially_approved: 'info',
    rejected: 'error',
    expired: 'error',
    revision_required: 'default',
};

const LINE_COLOR = { approved: 'success', released: 'success', dropped: 'default' };

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

const OPEN_LINE = (i) => !['approved', 'released', 'dropped'].includes(i.status);

// The price a formula or conditional catalogue price gives for the values entered so far, as the
// server will work it out; null until every value is filled in or when no condition matches.
const rulePrice = (rule, values) => {
    if (rule.parameters.some((name) => values?.[name] === '' || values?.[name] === undefined)) {
        return null;
    }
    const price = calcPrice(
        rule.formula ?? '',
        rule.parameters.map((value) => ({ value })),
        Object.fromEntries(rule.parameters.map((name) => [name, Number(values[name])])),
        rule.conditions,
    );
    return Number.isFinite(price) && price > 0 ? price : null;
};

/**
 * The center's financial approval: every quotation on the case with its lines and decision, and
 * BION's quotation form when confirming the tests needs one. Prices come from the catalogue: a
 * formula or conditional price is worked out from the values BION enters (e.g. the number of
 * embryos), as reception would. Only the finance team can price a line the catalogue can't, or
 * give a discount.
 */
export default function FinanceTab({ preOrder, canQuote }) {
    const { can, finance_preview: reasons = [] } = preOrder;
    const ruled = preOrder.items.filter((i) => i.price_rule && OPEN_LINE(i));
    const unpriced = preOrder.items.filter(
        (i) => i.unit_price === null && !i.price_rule && OPEN_LINE(i),
    );
    const { data, setData, post, processing, errors, transform } = useForm({
        reason: '',
        discount: '',
        prices: Object.fromEntries(unpriced.map((i) => [i.id, ''])),
        params: Object.fromEntries(
            ruled.map((i) => [
                i.id,
                Object.fromEntries(
                    i.price_rule.parameters.map((name) => [name, i.price_params?.[name] ?? '']),
                ),
            ]),
        ),
    });
    const { data: revise, setData: setRevise } = useForm({ reason: '' });

    transform((form) => ({
        reason: form.reason || null,
        discount: canQuote && form.discount !== '' ? form.discount : null,
        prices: canQuote
            ? Object.entries(form.prices)
                  .filter(([, price]) => price !== '')
                  .map(([itemId, price]) => ({ item_id: Number(itemId), unit_price: price }))
            : null,
        params: Object.entries(form.params)
            .filter(([, values]) => Object.values(values).every((v) => v !== ''))
            .map(([itemId, values]) => ({ item_id: Number(itemId), values })),
    }));

    const send = () => post(route('pre-orders.confirm', preOrder.id), { preserveScroll: true });

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {can.confirm && reasons.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Confirming sends a quotation to the center first ({reasons.join(', ')}).
                        Nothing goes to the lab until their approver accepts it.
                    </Alert>
                    <Stack spacing={1}>
                        {ruled.map((item) => {
                            const price = rulePrice(item.price_rule, data.params[item.id]);
                            return (
                                <Stack
                                    key={item.id}
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flexWrap="wrap"
                                    useFlexGap
                                >
                                    {item.price_rule.parameters.map((name) => (
                                        <TextField
                                            key={name}
                                            size="small"
                                            type="number"
                                            label={`${name} · ${item.test_name}`}
                                            value={data.params[item.id]?.[name] ?? ''}
                                            onChange={(e) =>
                                                setData('params', {
                                                    ...data.params,
                                                    [item.id]: {
                                                        ...data.params[item.id],
                                                        [name]: e.target.value,
                                                    },
                                                })
                                            }
                                            inputProps={{ min: 0, step: 1 }}
                                            sx={{ maxWidth: 260 }}
                                        />
                                    ))}
                                    <Typography
                                        variant="body2"
                                        color={price === null ? 'text.secondary' : 'text.primary'}
                                    >
                                        {price === null
                                            ? 'Enter the values to price this test'
                                            : `Unit price ${price.toFixed(3)} (catalogue)`}
                                    </Typography>
                                </Stack>
                            );
                        })}
                        {canQuote &&
                            unpriced.map((item) => (
                                <TextField
                                    key={item.id}
                                    size="small"
                                    type="number"
                                    label={`Unit price · ${item.test_name}`}
                                    helperText="The catalogue has no fixed price for this center"
                                    value={data.prices[item.id] ?? ''}
                                    onChange={(e) =>
                                        setData('prices', {
                                            ...data.prices,
                                            [item.id]: e.target.value,
                                        })
                                    }
                                    inputProps={{ min: 0, step: '0.001' }}
                                    sx={{ maxWidth: 360 }}
                                />
                            ))}
                        {!canQuote && unpriced.length > 0 && (
                            <Alert severity="warning">
                                {unpriced.map((i) => i.test_name).join(', ')} has no catalogue
                                price. Ask the finance team to send this quotation.
                            </Alert>
                        )}
                        {canQuote && (
                            <TextField
                                size="small"
                                type="number"
                                label="Discount"
                                value={data.discount}
                                onChange={(e) => setData('discount', e.target.value)}
                                error={Boolean(errors.discount)}
                                helperText={errors.discount || 'Amount off the whole quotation'}
                                inputProps={{ min: 0, step: '0.001' }}
                                sx={{ maxWidth: 200 }}
                            />
                        )}
                        <TextField
                            multiline
                            minRows={2}
                            label="Note to the center"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            error={Boolean(errors.reason)}
                            helperText={errors.reason || 'Why these tests, in a sentence or two'}
                        />
                        <Box>
                            <Button variant="contained" onClick={send} disabled={processing}>
                                Send quotation
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            )}

            {preOrder.quotations.length === 0 && !(can.confirm && reasons.length) && (
                <Typography variant="body2" color="text.secondary">
                    No quotation on this case. Tests the center chose, with no price-raising scope,
                    go straight to the lab.
                </Typography>
            )}

            <Stack spacing={3} divider={<Divider />}>
                {[...preOrder.quotations].reverse().map((q) => (
                    <Box key={q.number}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Typography variant="subtitle1" fontWeight={600}>
                                {q.number}
                            </Typography>
                            <Chip
                                size="small"
                                color={FINANCE_COLOR[q.status] ?? 'default'}
                                label={q.status_label}
                            />
                            {q.request && (
                                <Chip size="small" variant="outlined" label={`R${q.request}`} />
                            )}
                            {q.pdf && (
                                <Button
                                    size="small"
                                    href={route('pre-orders.documents.show', [preOrder.id, q.pdf])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    PDF
                                </Button>
                            )}
                            <Typography variant="caption" color="text.secondary">
                                {q.reasons.join(' · ')} · sent {fmt(q.created_at)} · valid until{' '}
                                {fmt(q.expires_at)}
                            </Typography>
                        </Stack>
                        {q.reason && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {q.reason}
                            </Typography>
                        )}
                        <Table size="small" sx={{ mt: 1 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Test</TableCell>
                                    <TableCell>Patient</TableCell>
                                    <TableCell align="right">Qty</TableCell>
                                    <TableCell align="right">Unit price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {q.lines.map((line) => (
                                    <TableRow key={line.id}>
                                        <TableCell>
                                            {line.test_name}{' '}
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {line.test_code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {patientName(preOrder, line.patient_ref)}
                                        </TableCell>
                                        <TableCell align="right">{line.qty}</TableCell>
                                        <TableCell align="right">
                                            {line.unit_price ?? '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {line.line_total ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={LINE_COLOR[line.status] ?? 'default'}
                                                label={line.status}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={4} align="right">
                                        Subtotal
                                    </TableCell>
                                    <TableCell align="right">{q.subtotal}</TableCell>
                                    <TableCell />
                                </TableRow>
                                {Number(q.discount) > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="right">
                                            Discount
                                        </TableCell>
                                        <TableCell align="right">−{q.discount}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                )}
                                <TableRow>
                                    <TableCell colSpan={4} align="right">
                                        <strong>Total</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>{q.total}</strong>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                        {q.decided_at && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {q.status_label} by {q.decided_by ?? 'the center'} on{' '}
                                {fmt(q.decided_at)}
                                {q.approved_amount !== null && ` · approved ${q.approved_amount}`}
                                {q.center_reference && ` · their ref. ${q.center_reference}`}
                                {q.note && ` — “${q.note}”`}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Stack>

            {(can.revise_quotation || can.verify_finance) && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 3 }}>
                    {can.verify_finance && canQuote && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() =>
                                router.post(
                                    route('pre-orders.finance.verify', preOrder.id),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Approval checked — release tests
                        </Button>
                    )}
                    {can.revise_quotation && (
                        <>
                            <TextField
                                size="small"
                                label="Why revise"
                                value={revise.reason}
                                onChange={(e) => setRevise('reason', e.target.value)}
                                sx={{ minWidth: 280 }}
                            />
                            <Button
                                variant="outlined"
                                color="warning"
                                onClick={() =>
                                    router.post(
                                        route('pre-orders.finance.revise', preOrder.id),
                                        { reason: revise.reason || null },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Back to review to revise
                            </Button>
                        </>
                    )}
                </Stack>
            )}
        </Paper>
    );
}

FinanceTab.propTypes = {
    preOrder: PropTypes.object.isRequired,
    canQuote: PropTypes.bool,
};
