import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Sheet = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    justifyContent: 'flex-start',
    '@media print': {
        gap: 0,
    },
}));

// Credit-card sized so the sheet can be guillotined into wallet cards.
const Card = styled(Paper)(({ theme }) => ({
    width: '85.6mm',
    height: '54mm',
    padding: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    border: '1px dashed #bbb',
    borderRadius: '3mm',
    boxSizing: 'border-box',
    '@media print': {
        boxShadow: 'none',
        border: '1px solid #eee',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
    },
}));

const NoPrint = styled(Box)(() => ({
    '@media print': {
        display: 'none',
    },
}));

const PrintBatch = () => {
    const { batch, cards, range } = usePage().props;

    // Serials need not start at 1, so paging walks the batch's own window.
    const first = range.first ?? 1;
    const last = range.last ?? batch.quantity;
    const pageSize = range.to - range.from + 1;
    const hasPrevious = range.from > first;
    const hasNext = range.to < last;

    const goToRange = (from) => {
        router.visit(route('discountCardBatches.print', batch.id), {
            data: { from, to: from + pageSize - 1 },
        });
    };

    return (
        <>
            <Head title={`Print cards — ${batch.series}`} />

            <NoPrint sx={{ mb: 3 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                >
                    <Box>
                        <Typography variant="h5">{batch.partner ?? 'Unassigned stock'}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip size="small" label={`Series ${batch.series}`} />
                            <Chip
                                size="small"
                                label={`Cards ${range.from}–${range.to} of ${batch.quantity}`}
                            />
                            <Chip
                                size="small"
                                label={
                                    batch.expires_at ? `Expires ${batch.expires_at}` : 'No expiry'
                                }
                            />
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            disabled={!hasPrevious}
                            startIcon={<ArrowBackIcon />}
                            onClick={() => goToRange(Math.max(first, range.from - pageSize))}
                        >
                            Previous
                        </Button>
                        <Button
                            disabled={!hasNext}
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => goToRange(range.to + 1)}
                        >
                            Next
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                        >
                            Print
                        </Button>
                    </Stack>
                </Stack>
            </NoPrint>

            <Sheet>
                {cards.map((card) => (
                    <Card key={card.id} elevation={0}>
                        <Box
                            component="img"
                            src={card.qr}
                            alt={card.number}
                            sx={{ width: '32mm', height: '32mm' }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                                {batch.partner ?? batch.series}
                            </Typography>
                            <Typography
                                sx={{ fontFamily: 'monospace', fontSize: '3.2mm', mt: 0.5 }}
                                noWrap
                            >
                                {card.number}
                            </Typography>
                            <Typography sx={{ fontSize: '2.6mm', color: '#666', mt: 0.5 }}>
                                {card.expires_at ? `Valid until ${card.expires_at}` : 'No expiry'}
                            </Typography>
                            <Typography sx={{ fontSize: '2.4mm', color: '#888', mt: 1 }}>
                                Present this card at reception
                            </Typography>
                        </Box>
                    </Card>
                ))}
            </Sheet>
        </>
    );
};

export default PrintBatch;
