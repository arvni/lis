import {
    Card,
    CardContent,
    CardHeader,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

const LineItemsCard = ({ lines = [] }) => (
    <Card sx={{ mb: 3 }}>
        <CardHeader title="Line Items" />
        <CardContent sx={{ p: 0 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Cat No</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell align="right">Ordered</TableCell>
                        <TableCell align="right">Received</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Notes</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lines.map((line) => {
                        const pct =
                            line.qty > 0
                                ? Math.min(
                                      100,
                                      (parseFloat(line.qty_received ?? 0) / parseFloat(line.qty)) *
                                          100,
                                  )
                                : 0;
                        return (
                            <TableRow key={line.id}>
                                <TableCell>
                                    <Typography variant="body2">{line.item?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {line.item?.item_code}
                                    </Typography>
                                </TableCell>
                                <TableCell>{line.cat_no || '—'}</TableCell>
                                <TableCell>{line.brand || '—'}</TableCell>
                                <TableCell align="right">
                                    {line.qty} {line.unit?.name}
                                </TableCell>
                                <TableCell align="right" sx={{ minWidth: 100 }}>
                                    <Typography variant="body2">
                                        {parseFloat(line.qty_received ?? 0)}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                                        color={pct >= 100 ? 'success' : 'warning'}
                                    />
                                </TableCell>
                                <TableCell>{line.unit?.name}</TableCell>
                                <TableCell>{line.preferred_supplier?.name || '—'}</TableCell>
                                <TableCell>{line.notes || '—'}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default LineItemsCard;
