import { Table, TableCell, TableRow } from '@mui/material';

// Patient payment + company credit summary block
const PaymentSummary = ({ invoice, advPayment }) => (
    <TableRow>
        <TableCell sx={{ padding: '0' }}>
            <Table sx={{ '& td': { border: '2px solid' } }}>
                <TableRow>
                    <TableCell sx={{ width: '50%', padding: '0' }}>
                        <Table
                            sx={{
                                '& td': {
                                    border: 'none',
                                    paddingX: '7px',
                                    paddingY: '5px',
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell colSpan={4} sx={{ fontWeight: 'bolder' }}>
                                    Payment Method:{' '}
                                    {invoice?.patient_payments?.length
                                        ? invoice.patient_payments[
                                              invoice.patient_payments.length - 1
                                          ].paymentMethod
                                              .toString()
                                              .toUpperCase()
                                        : null}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} sx={{ width: '50%' }}>
                                    Total Patient Amount (OMR):
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {invoice.has_different_owner
                                        ? invoice.patient_payments_sum_price
                                        : Math.floor(
                                              invoice.acceptance_items_sum_price * 1 -
                                                  invoice.acceptance_items_sum_discount * 1,
                                          )}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>Adv.Paid (OMR):</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {advPayment?.price}
                                </TableCell>
                                <TableCell>Date: {advPayment?.date}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>Total Amount to pay (OMR):</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {invoice.has_different_owner
                                        ? 0
                                        : Math.floor(
                                              invoice.acceptance_items_sum_price * 1 -
                                                  invoice.acceptance_items_sum_discount * 1 -
                                                  invoice.patient_payments_sum_price * 1,
                                          )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={4} />
                            </TableRow>
                            <TableRow>
                                <TableCell> Cashier :</TableCell>
                                <TableCell>
                                    {invoice?.patient_payments.length
                                        ? invoice.patient_payments[0].cashier?.name
                                        : null}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell> Remark :</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                    <TableCell sx={{ width: '50%', padding: '0' }}>
                        <Table
                            sx={{
                                '& td': {
                                    border: 'none',
                                    paddingX: '7px',
                                    paddingY: '5px',
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell colSpan={4} sx={{ fontWeight: 'bolder' }}>
                                    Advance Payment Method:{' '}
                                    {invoice.has_different_owner ? 'CREDIT' : ''}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} sx={{ width: '50%' }}>
                                    Company Credit (OMR):
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {invoice.has_different_owner ? 0 : ''}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} sx={{ width: '50%' }}>
                                    Total Credit Amount(OMR):
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {invoice.has_different_owner && invoice.sponsor_payments_sum_price
                                        ? `-${invoice.sponsor_payments_sum_price ?? 0}`
                                        : ''}
                                </TableCell>

                                <TableCell />
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>Total Amount to pay (OMR):</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {invoice.has_different_owner && invoice.sponsor_payments_sum_price
                                        ? `${invoice.sponsor_payments_sum_price}`
                                        : ''}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell> Cashier :</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell> Remark :</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                </TableRow>
            </Table>
        </TableCell>
    </TableRow>
);

export default PaymentSummary;
