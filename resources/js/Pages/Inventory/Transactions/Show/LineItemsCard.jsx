import {
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

const money = (value) =>
    value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—';

const LineItemsCard = ({ transaction }) => (
    <Card>
        <CardHeader
            title="Line Items"
            subheader={`${transaction.lines?.length ?? 0} line${transaction.lines?.length !== 1 ? 's' : ''}`}
        />
        <CardContent sx={{ p: 0, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Lot #</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell>Cat No</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Expiry</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transaction.lines?.map((line) => (
                        <TableRow key={line.id} hover>
                            <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                    {line.item?.name}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontFamily: 'monospace' }}
                                >
                                    {line.item?.item_code}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {line.lot_number || '—'}
                                </Typography>
                            </TableCell>
                            <TableCell>{line.brand || '—'}</TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {line.cat_no || '—'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {line.location?.label || '—'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {line.expiry_date ? (
                                    <Typography variant="body2">{line.expiry_date}</Typography>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2" fontWeight={500}>
                                    {line.quantity}
                                </Typography>
                            </TableCell>
                            <TableCell>{line.unit?.name}</TableCell>
                            <TableCell align="right">{money(line.unit_price)}</TableCell>
                            <TableCell align="right">{money(line.total_price)}</TableCell>
                        </TableRow>
                    ))}
                    {!transaction.lines?.length && (
                        <TableRow>
                            <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No line items.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default LineItemsCard;
