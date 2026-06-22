import { Stack, Table, TableCell, TableRow } from '@mui/material';
import Typography from '@mui/material/Typography';

// Bilingual company header + logo + invoice meta row
const CompanyHeader = ({ invoice, invoiceDate, invoiceTime }) => (
    <TableRow>
        <TableCell sx={{ padding: 0 }}>
            <Table sx={{ border: 'none' }}>
                <TableRow>
                    <TableCell sx={{ border: '2px solid', padding: 0, width: '80mm' }}>
                        <Table
                            sx={{
                                border: 'none',
                                '& td': { paddingX: '10px', paddingY: '5px' },
                            }}
                        >
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    sx={{
                                        border: 'none',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 'bolder' }}>
                                        Muscat Medical Center LLC
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} sx={{ border: 'none', fontSize: '12px' }}>
                                    <>
                                        Alley 3703,No.346,South Al Ghoubrah St. Muscat, Sultanat of
                                        Oman
                                    </>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        width: '35mm',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>VATIN: </strong>OM1100151715
                                </TableCell>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>CR: </strong>1840770
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>Email: </strong>Info@biongenetic.com
                                </TableCell>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>Phone:</strong>
                                    <br />
                                    +968 2207 3641
                                </TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                    <TableCell sx={{ padding: 0, border: 'none' }}>
                        <Stack sx={{ alignItems: 'center' }}>
                            <img src="/images/logo.png" alt="logo" style={{ width: '25mm' }} />
                            <span style={{ fontSize: '1rem', fontWeight: 'bolder' }}>
                                TAX Invoice
                            </span>
                        </Stack>
                    </TableCell>
                    <TableCell sx={{ border: '2px solid', padding: 0, width: '80mm' }}>
                        <Table
                            sx={{
                                border: 'none',
                                '& td': { paddingX: '10px', paddingY: '5px' },
                            }}
                        >
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    sx={{
                                        border: 'none',
                                        textAlign: 'center',
                                        fontSize: '18px',
                                    }}
                                >
                                    <span style={{ fontWeight: 'bolder' }}>
                                        مركز مسقط الطبي ش.م.م
                                    </span>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    sx={{
                                        border: 'none',
                                        fontSize: '14px',
                                        textAlign: 'right',
                                        direction: 'rtl',
                                    }}
                                >
                                    زقاق ۳۷۰۳، رقم ۳۴۶، الغبرة الجنوبية،محافظة مسقط، سلطنة عمان
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        width: '40mm',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>VATIN: </strong>OM1100151715
                                </TableCell>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>CR: </strong>1840770
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        direction: 'rtl',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>البريد الإلكتروني : </strong>
                                    Info@biongenetic.com
                                </TableCell>
                                <TableCell
                                    sx={{
                                        border: 'none',
                                        fontSize: '12px',
                                        direction: 'rtl',
                                        textAlign: 'center',
                                    }}
                                >
                                    <strong>هاتف:</strong>
                                    <br />
                                    <span style={{ direction: 'ltr' }}>۳۶۴۱ ۲۲۰۷ ۹۶۸+</span>
                                </TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={3} sx={{ border: '2px solid', padding: 0 }}>
                        <Table>
                            <TableRow>
                                <TableCell>
                                    <strong>Invoice: {invoice.invoiceNo}</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Date: {invoiceDate}</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Time: {invoiceTime}</strong>
                                </TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                </TableRow>
            </Table>
        </TableCell>
    </TableRow>
);

export default CompanyHeader;
