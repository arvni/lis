import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    IconButton,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Zoom,
} from '@mui/material';
import {
    Deselect as DeselectAll,
    Info,
    Receipt,
    Search,
    SelectAll,
    Warning,
} from '@mui/icons-material';

export default function InvoiceSelectionPanel({
    data,
    invoiceList,
    filteredInvoices,
    loading,
    error,
    success,
    validationErrors,
    searchTerm,
    setSearchTerm,
    setError,
    setSuccess,
    processing,
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,
    onSelectAll,
    onDeselectAll,
    onInvoiceToggle,
}) {
    return (
        <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Receipt sx={{ mr: 1 }} color="primary" />
                            Available Invoices
                            {invoiceList.length > 0 && (
                                <Badge
                                    badgeContent={invoiceList.length}
                                    color="primary"
                                    sx={{ ml: 1.5 }}
                                >
                                    <Chip size="small" label="Total" variant="outlined" />
                                </Badge>
                            )}
                        </Typography>
                        {filteredInvoices.length !== invoiceList.length && (
                            <Typography variant="body2" color="text.secondary">
                                Showing {filteredInvoices.length} of {invoiceList.length}
                            </Typography>
                        )}
                    </Box>

                    {invoiceList.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Select All Visible">
                                <span>
                                    <IconButton
                                        onClick={onSelectAll}
                                        disabled={allSelected || processing}
                                        size="small"
                                        color="primary"
                                    >
                                        <SelectAll />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Deselect All Visible">
                                <span>
                                    <IconButton
                                        onClick={onDeselectAll}
                                        disabled={selectedCount === 0 || processing}
                                        size="small"
                                        color="secondary"
                                    >
                                        <DeselectAll />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    )}
                </Box>

                {/* Search */}
                {invoiceList.length > 0 && (
                    <TextField
                        placeholder="Search by invoice number or patient name…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ mb: 2 }}
                        slotProps={{
                            input: {
                                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                            },
                        }}
                    />
                )}

                {/* Alerts */}
                {error && (
                    <Zoom in>
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            onClose={() => setError(null)}
                            icon={<Warning />}
                        >
                            {error}
                        </Alert>
                    </Zoom>
                )}
                {success && (
                    <Zoom in>
                        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    </Zoom>
                )}
                {validationErrors.invoices && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {validationErrors.invoices}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: 'center', mt: 1 }}
                        >
                            Loading invoices…
                        </Typography>
                    </Box>
                )}

                {/* Table */}
                {!loading && filteredInvoices.length > 0 && (
                    <TableContainer component={Paper} sx={{ maxHeight: 450, flex: 1 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={someSelected}
                                            checked={allSelected}
                                            onChange={allSelected ? onDeselectAll : onSelectAll}
                                            disabled={processing}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <strong>Invoice No</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Date</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Patient</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Amount (OMR)</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredInvoices.map((inv) => {
                                    const isSelected = selectedIds.has(inv.id);
                                    return (
                                        <TableRow
                                            key={inv.id}
                                            hover
                                            selected={isSelected}
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => onInvoiceToggle(inv)}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={processing}
                                                    color="primary"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {inv.invoice_no || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(inv.created_at).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>
                                                    {inv.patient_name || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="medium">
                                                    {parseFloat(inv.payable_amount || 0).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Empty states */}
                {!loading && invoiceList.length === 0 && data.referrer && data.month && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No Invoices Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No unassigned invoices for this referrer in the selected month.
                        </Typography>
                    </Box>
                )}
                {!loading && (!data.referrer || !data.month) && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Info sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            Ready to Get Started
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Select a referrer and month to load available invoices.
                        </Typography>
                    </Box>
                )}
                {!loading && filteredInvoices.length === 0 && invoiceList.length > 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                            No invoices match your search.
                        </Typography>
                        <Button size="small" onClick={() => setSearchTerm('')} sx={{ mt: 1 }}>
                            Clear Search
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
