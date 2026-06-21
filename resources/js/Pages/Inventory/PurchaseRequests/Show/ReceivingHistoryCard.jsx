import { router } from '@inertiajs/react';
import {
    Button,
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

const ReceivingHistoryCard = ({ receipts = [] }) => (
    <Card>
        <CardHeader title="Receiving History" />
        <CardContent sx={{ p: 0 }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Transaction</TableCell>
                        <TableCell>Lines Received</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {receipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                            <TableCell>{receipt.created_at?.substring(0, 10)}</TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() =>
                                        router.visit(
                                            route(
                                                'inventory.transactions.show',
                                                receipt.transaction_id,
                                            ),
                                        )
                                    }
                                >
                                    {receipt.transaction?.reference_number}
                                </Button>
                            </TableCell>
                            <TableCell>
                                {receipt.lines?.map((rl) => (
                                    <Typography key={rl.id} variant="caption" display="block">
                                        {rl.pr_line?.item?.name}: {rl.qty_received}{' '}
                                        {rl.pr_line?.unit?.name}
                                        {rl.lot_number ? ` · Lot ${rl.lot_number}` : ''}
                                    </Typography>
                                ))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default ReceivingHistoryCard;
