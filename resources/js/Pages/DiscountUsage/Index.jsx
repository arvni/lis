import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
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
import DownloadIcon from '@mui/icons-material/Download';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SummaryCard from '@/Pages/Acceptance/Show/SummaryCard';
import Filter from './Components/Filter';

const money = (value) => Number(value ?? 0).toFixed(3);

const DiscountUsageIndex = () => {
    const { filters, summary, partners, busiest_cards: busiestCards } = usePage().props;
    const [partner, setPartner] = useState(null);

    const exportUrl = route('discountUsage.export', {
        filters: {
            from_date: filters.from_date,
            to_date: filters.to_date,
            discount_partner_id: filters.discount_partner_id ?? '',
        },
    });

    return (
        <>
            <Head title="Discount Usage" />
            <PageHeader
                title="Discount Usage"
                subtitle="What partner cards discounted, and which cards are working hardest"
                actions={
                    <Button
                        href={exportUrl}
                        component="a"
                        startIcon={<DownloadIcon />}
                        variant="contained"
                        size="medium"
                    >
                        Export
                    </Button>
                }
            />

            <Filter filters={filters} partner={partner} onPartnerChange={setPartner} />

            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Discount Given"
                        value={money(summary.total_amount)}
                        icon={(props) => <Typography {...props}>OMR</Typography>}
                        color="secondary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Visits"
                        value={summary.visits}
                        icon={EventAvailableIcon}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Tests Discounted"
                        value={summary.items}
                        icon={ScienceIcon}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Cards Used"
                        value={summary.cards_used}
                        icon={CardMembershipIcon}
                        color="success"
                    />
                </Grid>
            </Grid>

            <Paper elevation={1} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <HandshakeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="h6">By Partner</Typography>
                </Box>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Partner</TableCell>
                                <TableCell align="right">Cards Used</TableCell>
                                <TableCell align="right">Visits</TableCell>
                                <TableCell align="right">Tests</TableCell>
                                <TableCell align="right">Discount Given</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {partners.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ py: 2, textAlign: 'center' }}
                                        >
                                            No card discounts were given in this period.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {partners.map((row) => (
                                <TableRow key={row.partner_id} hover>
                                    <TableCell>{row.partner_name}</TableCell>
                                    <TableCell align="right">{row.cards_used}</TableCell>
                                    <TableCell align="right">{row.visits}</TableCell>
                                    <TableCell align="right">{row.items}</TableCell>
                                    <TableCell align="right">{money(row.total_amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <CardMembershipIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="h6">Busiest Cards</Typography>
                </Box>
                <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
                    Cards are bearer cards, so a single card appearing far more often than the rest
                    is worth a look — it may have been copied and shared.
                </Alert>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Card</TableCell>
                                <TableCell>Partner</TableCell>
                                <TableCell align="right">Visits</TableCell>
                                <TableCell align="right">Limit</TableCell>
                                <TableCell align="right">Discount Given</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {busiestCards.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ py: 2, textAlign: 'center' }}
                                        >
                                            Nothing to show yet.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {busiestCards.map((row) => {
                                const unlimited = row.usage_limit === null;
                                return (
                                    <TableRow key={row.card_id} hover>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {row.card_number}
                                        </TableCell>
                                        <TableCell>{row.partner_name}</TableCell>
                                        <TableCell align="right">
                                            {unlimited && row.visits > 20 ? (
                                                <Tooltip title="Heavy use on a card with no usage limit">
                                                    <Chip
                                                        size="small"
                                                        color="warning"
                                                        icon={<WarningAmberIcon />}
                                                        label={row.visits}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                row.visits
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {unlimited ? '∞' : row.usage_limit}
                                        </TableCell>
                                        <TableCell align="right">
                                            {money(row.total_amount)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Discount Usage',
        link: null,
        icon: null,
    },
];

DiscountUsageIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default DiscountUsageIndex;
