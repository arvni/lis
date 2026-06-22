import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from '@mui/material';

// Service line items table with totals + VAT footer
const ItemsTable = ({ invoice }) => (
    <TableRow>
        <TableCell sx={{ padding: 0 }}>
            <Table
                sx={{
                    '& td,th': {
                        border: '1px solid',
                        paddingY: '7px',
                        paddingX: '5px',
                    },
                }}
            >
                <TableHead
                    sx={{
                        border: '2px solid',
                        '& th': { textAlign: 'center', fontWeight: '900' },
                    }}
                >
                    <TableRow>
                        <TableCell>Service Code</TableCell>
                        <TableCell>Service Name</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Rate (incl.Vat)</TableCell>
                        <TableCell>Disc</TableCell>
                        <TableCell>Taxable</TableCell>
                        <TableCell>VAT Amount</TableCell>
                        <TableCell sx={{ width: '11mm' }}>VAT %</TableCell>
                        <TableCell>Net Amount</TableCell>
                        <TableCell>Description</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody sx={{ '& td': { paddingY: '1mm' } }}>
                    {invoice?.acceptance_items?.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.test?.code ?? item.code ?? ''}</TableCell>
                            <TableCell>{item.test?.name ?? item.title ?? ''} </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{item.qty}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{item.unit_price}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {Math.ceil(item.discount)}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {Math.floor(item.price - item.discount)}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>0</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>0</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {Math.floor(item.price - item.discount)}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'left' }}>{item.description}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={3} sx={{ fontWeight: '900', textAlign: 'center' }}>
                            Total
                        </TableCell>
                        <TableCell />
                        <TableCell sx={{ textAlign: 'center' }}>
                            {Math.ceil(invoice.acceptance_items_sum_discount * 1)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                            {Math.floor(
                                invoice.acceptance_items_sum_price * 1 -
                                    invoice.acceptance_items_sum_discount * 1,
                            )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>0</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>0</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                            {Math.floor(
                                invoice.acceptance_items_sum_price * 1 -
                                    invoice.acceptance_items_sum_discount * 1,
                            )}
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableBody>
                <TableFooter
                    sx={{
                        '& td': { border: 'none', color: '#000', fontWeight: '500' },
                    }}
                >
                    <TableRow>
                        <TableCell colSpan={5} />
                        <TableCell colSpan={3}>Total Rate (incl.Vat)(OMR):</TableCell>
                        <TableCell colspan={2} sx={{ textAlign: 'center' }}>
                            {Math.floor(invoice.acceptance_items_sum_price * 1)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} />
                        <TableCell colSpan={3}>Total Discount (OMR):</TableCell>
                        <TableCell colspan={2} sx={{ textAlign: 'center' }}>
                            {Math.ceil(invoice.acceptance_items_sum_discount * 1)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} />
                        <TableCell colSpan={3}>Total VAT(OMR):</TableCell>
                        <TableCell colspan={2} sx={{ textAlign: 'center' }}>
                            0
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={5} />
                        <TableCell colSpan={3}>Total Net Amount (OMR):</TableCell>
                        <TableCell colspan={2} sx={{ textAlign: 'center' }}>
                            {Math.floor(
                                invoice.acceptance_items_sum_price * 1 -
                                    invoice.acceptance_items_sum_discount * 1,
                            )}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </TableCell>
    </TableRow>
);

export default ItemsTable;
