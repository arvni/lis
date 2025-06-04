import React, {useEffect, useRef} from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    styled,
    Grid2 as Grid,
    Chip
} from '@mui/material';
import {
    Person,
    Payments,
    Science,
    AccessTime
} from '@mui/icons-material';
import {calculateBusinessDays} from "@/Services/helper.js";

// A5 paper dimensions - optimized for printing
const A5_WIDTH = '148mm';
const A5_HEIGHT = '210mm';

// Styled components optimized for A5 paper
const InvoiceContainer = styled(Paper)(({theme}) => ({
    width: A5_WIDTH,
    maxHeight: A5_HEIGHT,
    margin: 'auto',
    padding: '5mm',
    lineHeight: '1.2',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontSize: '9pt',
    '@media print': {
        backgroundColor: 'white',
        boxShadow: 'none',
        margin: 0,
        width: '100%',
        height: '100%'
    }
}));

const InvoiceHeader = styled(Box)(({theme}) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
}));

const SectionHeading = styled(Box)(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
}));

const StyledTable = styled(Table)(({theme}) => ({
    '& .MuiTableCell-root': {
        padding: '2px 4px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.7rem',
    },
    '& .MuiTableRow-root.total td': {
        borderTop: `1px solid ${theme.palette.divider}`,
        fontWeight: 'bold',
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
        backgroundColor: theme.palette.grey[100],
        fontWeight: 'bold',
        padding: '3px 4px',
    }
}));

const HeaderCell = styled(TableCell)(({theme}) => ({
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
    fontSize: '0.7rem',
    padding: '3px 4px',
}));

const RightAlignedCell = styled(TableCell)({
    textAlign: 'right !important',
    fontSize: '0.7rem',
    padding: '2px 4px',
});

const LeftAlignedCell = styled(TableCell)({
    textAlign: 'left !important',
    fontSize: '0.7rem',
    padding: '2px 4px',
});

const TotalRow = styled(TableRow)(({theme}) => ({
    '& .MuiTableCell-root': {
        padding: '2px 4px',
        backgroundColor: theme.palette.grey[50],
        fontSize: '0.7rem',
    }
}));

const FinalTotal = styled(TotalRow)(({theme}) => ({
    '& .MuiTableCell-root': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        fontSize: '0.75rem',
    }
}));

const InfoLabel = styled(Typography)(({theme}) => ({
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
    display: 'inline-block',
    fontSize: '0.7rem',
}));

const InfoValue = styled(Typography)({
    display: 'inline-block',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const SmallChip = styled(Chip)({
    height: '16px',
    fontSize: '0.6rem',
    '& .MuiChip-label': {
        padding: '0 6px',
    }
});

const InfoItem = ({label, value, icon}) => (
    <Box sx={{display: 'flex', alignItems: 'center', mb: 0.3}}>
        {icon && <Box sx={{mr: 0.5, color: 'primary.main', '& .MuiSvgIcon-root': {fontSize: '0.7rem'}}}>{icon}</Box>}
        <InfoLabel variant="body2" component="span">{label}:</InfoLabel>
        <Box sx={{ml: 0.5, maxWidth: '70%'}}>
            <InfoValue variant="body2" component="span">{value || 'N/A'}</InfoValue>
        </Box>
    </Box>
);

const ReceiptBadge = styled(Box)(({theme}) => ({
    position: 'absolute',
    top: '5mm',
    right: '5mm',
    transform: 'rotate(15deg)',
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.3, 0.8),
    color: theme.palette.secondary.main,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '0.6rem',
    '@media print': {
        display: 'block'
    }
}));

const InvoiceFooter = styled(Box)(({theme}) => ({
    marginTop: theme.spacing(1),
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.5),
    fontSize: '0.6rem',
    color: theme.palette.text.secondary
}));

const OptimizedInvoiceReceipt = ({acceptance, onPrint, showLogo}) => {
    const printRef = useRef(null);

    // Calculate totals
    const subtotal = (acceptance?.acceptanceItems?.panels?.reduce(
        (sum, item) => sum + parseFloat(item.price || 0), 0
    ) || 0) + (acceptance?.acceptanceItems?.tests?.reduce(
        (sum, item) => sum + parseFloat(item.price || 0), 0
    ) || 0);

    const totalDiscount = (acceptance?.acceptanceItems?.tests?.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0), 0
    ) || 0) + (acceptance?.acceptanceItems?.panels?.reduce(
        (sum, item) => sum + parseFloat(item.discount || 0), 0
    ) || 0);

    const totalPayment = acceptance?.invoice?.payments?.reduce(
        (sum, payment) => sum + parseFloat(payment.price || 0), 0
    ) || 0;

    const finalTotal = subtotal - totalPayment - totalDiscount;

    // Get estimated report date
    const reportDays = Math.max(acceptance?.acceptanceItems?.tests?.reduce((max, item) => {
        const turnaroundTime = item?.method_test?.method?.turnaround_time || 0;
        return Math.max(max, turnaroundTime);
    }, 0), (acceptance?.acceptanceItems?.panels || [])?.reduce((max, item) => {
        const turnaroundTime = item?.acceptanceItems?.reduce((pMax, acceptanceItem) => {
            const tTime = acceptanceItem?.method_test?.method?.turnaround_time || 0;
            return Math.max(pMax, tTime);
        }, 0) || 0;
        return Math.max(max, turnaroundTime);
    }, 0));

    // Print functionality
    useEffect(() => {
        if (onPrint) {
            window.print();
        }
    }, [onPrint]);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    };

    const formatPaymentDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    return (
        <>
            <Box sx={{position: 'relative'}}>
                <ReceiptBadge>Receipt</ReceiptBadge>

                <InvoiceContainer elevation={3} ref={printRef}>
                    <InvoiceHeader>
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            {showLogo && (<>
                                <Box
                                    component="img"
                                    src="https://biongenetic.com/wp-content/uploads/2021/11/mmclogo-1.png"
                                    sx={{
                                        height: '20px',
                                        marginRight: 1
                                    }}
                                    alt="Company Logo"
                                />

                                <Box>
                                    <Typography variant="body1"
                                                sx={{fontWeight: 'bold', color: 'primary.main', fontSize: '0.85rem'}}>
                                        Muscat Medical Center
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{fontSize: '0.6rem'}}>
                                        Healthcare Excellence
                                    </Typography>
                                </Box>
                            </>)}
                        </Box>

                        <Box sx={{textAlign: 'right'}}>
                            <Typography variant="subtitle2" sx={{color: 'secondary.main', fontSize: '0.75rem'}}>
                                Receipt #{acceptance?.id || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{fontSize: '0.6rem'}}>
                                Date: {formatDate(acceptance?.created_at)}
                            </Typography>
                        </Box>
                    </InvoiceHeader>

                    <Divider sx={{my: 0.5}}/>

                    <SectionHeading>
                        <Person sx={{mr: 0.5, fontSize: '0.75rem'}}/>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', fontSize: '0.75rem'}}>
                            Patient Information
                        </Typography>
                    </SectionHeading>

                    <Grid container spacing={1} sx={{mb: 1}}>
                        <Grid size={{xs: 8}}>
                            <InfoItem
                                label="Full Name"
                                value={acceptance?.patient?.fullName}
                                icon={<Person fontSize="small"/>}
                            />
                            <InfoItem
                                label="ID/Passport"
                                value={acceptance?.patient?.idNo}
                            />
                        </Grid>
                        <Grid size={{xs: 4}}>
                            <InfoItem
                                label="Age/Gender"
                                value={`${acceptance?.patient?.age || ''} / ${
                                    acceptance?.patient?.gender ? acceptance.patient.gender.charAt(0).toUpperCase() : ''
                                }`}
                            />
                            <InfoItem
                                label="Report Via"
                                value={Object.keys(acceptance?.howReport || {}).filter(item => ["print","email", "whatsapp", "sendToReferrer"].includes(item) && Boolean(acceptance.howReport[item]))}
                            />
                        </Grid>
                    </Grid>

                    <SectionHeading>
                        <Science sx={{mr: 0.5, fontSize: '0.75rem'}}/>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', fontSize: '0.75rem'}}>
                            Test Details
                        </Typography>
                    </SectionHeading>

                    <TableContainer component={Box} sx={{mb: 1}}>
                        <StyledTable size="small" padding="none">
                            <TableHead>
                                <TableRow>
                                    <HeaderCell>#</HeaderCell>
                                    <HeaderCell>Test Name</HeaderCell>
                                    <HeaderCell align="right">Price</HeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {acceptance?.acceptanceItems?.panels?.length > 0 && acceptance.acceptanceItems.panels.map((panel, index) => (
                                    <TableRow key={`panel-${panel.id}-${index}`}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell align="left" sx={{
                                            maxWidth: '22mm',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {panel?.panel?.name}
                                        </TableCell>
                                        <TableCell align="right">
                                            {panel.price}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {acceptance?.acceptanceItems?.tests?.length > 0 && acceptance.acceptanceItems.tests.map((item, index) => (
                                    <TableRow key={`test-${item.id}-${index}`}>
                                        <TableCell>{index + (acceptance?.acceptanceItems?.panels?.length || 0) + 1}</TableCell>
                                        <TableCell align="left" sx={{
                                            maxWidth: '22mm',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {item?.method_test?.test?.name}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.price}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </StyledTable>
                    </TableContainer>

                    <SectionHeading>
                        <Payments sx={{mr: 0.5, fontSize: '0.75rem'}}/>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', fontSize: '0.75rem'}}>
                            Payment Details
                        </Typography>
                    </SectionHeading>

                    <TableContainer component={Box} sx={{mb: 1}}>
                        <StyledTable size="small" padding="none">
                            <TableHead>
                                <TableRow>
                                    <HeaderCell>Method</HeaderCell>
                                    <HeaderCell>Cashier</HeaderCell>
                                    <HeaderCell align="right">Amount</HeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {acceptance?.invoice?.payments?.length > 0 ? (
                                    acceptance.invoice.payments.map((payment, index) => (
                                        <TableRow key={`payment-${payment.id}-${index}`}>
                                            <TableCell>
                                                <SmallChip
                                                    label={payment.paymentMethod || ''}
                                                    size="small"
                                                    color={payment.paymentMethod === 'card' ? 'info' : 'default'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{payment.cashier?.name || ''}</TableCell>
                                            <TableCell
                                                align="right">{parseFloat(payment.price || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">No payment records</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </StyledTable>
                    </TableContainer>

                    <TableContainer component={Box} sx={{mb: 1}}>
                        <StyledTable size="small" padding="none">
                            <TableBody>
                                <TotalRow>
                                    <TableCell width="60%"></TableCell>
                                    <LeftAlignedCell>
                                        <Typography variant="caption" sx={{fontWeight: 'bold'}}>
                                            Sub Total:
                                        </Typography>
                                    </LeftAlignedCell>
                                    <RightAlignedCell>
                                        <Typography variant="caption">
                                            OMR {subtotal.toFixed(2)}
                                        </Typography>
                                    </RightAlignedCell>
                                </TotalRow>
                                {totalDiscount > 0 && (
                                    <TotalRow>
                                        <TableCell></TableCell>
                                        <LeftAlignedCell>
                                            <Typography variant="caption" sx={{fontWeight: 'bold'}}>
                                                Discount:
                                            </Typography>
                                        </LeftAlignedCell>
                                        <RightAlignedCell>
                                            <Typography variant="caption">
                                                - OMR {totalDiscount.toFixed(2)}
                                            </Typography>
                                        </RightAlignedCell>
                                    </TotalRow>
                                )}
                                <TotalRow>
                                    <TableCell></TableCell>
                                    <LeftAlignedCell>
                                        <Typography variant="caption" sx={{fontWeight: 'bold'}}>
                                            Payments:
                                        </Typography>
                                    </LeftAlignedCell>
                                    <RightAlignedCell>
                                        <Typography variant="caption">
                                            - OMR {totalPayment.toFixed(2)}
                                        </Typography>
                                    </RightAlignedCell>
                                </TotalRow>
                                <FinalTotal>
                                    <TableCell></TableCell>
                                    <LeftAlignedCell>
                                        <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                                            Balance Due:
                                        </Typography>
                                    </LeftAlignedCell>
                                    <RightAlignedCell>
                                        <Typography variant="body2" sx={{fontWeight: 'bold'}}>
                                            OMR {finalTotal.toFixed(2)}
                                        </Typography>
                                    </RightAlignedCell>
                                </FinalTotal>
                            </TableBody>
                        </StyledTable>
                    </TableContainer>

                    <Box sx={{mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1, display: 'flex', alignItems: 'center'}}>
                        <AccessTime color="primary" sx={{mr: 1, fontSize: '0.75rem'}}/>
                        <Typography variant="caption">
                            The report will be available at
                            <Box component="span" sx={{ml: 1, fontWeight: 'bold', color: 'primary.main'}}>
                                {calculateBusinessDays(acceptance.created_at, reportDays).toDateString()}
                            </Box>.
                        </Typography>
                    </Box>

                    <InvoiceFooter>
                        <Typography variant="caption" sx={{fontSize: '0.6rem'}}>
                            Thank you for choosing Bion Genetic Laboratory.
                        </Typography>
                    </InvoiceFooter>
                </InvoiceContainer>
            </Box>
        </>
    );
};

export default OptimizedInvoiceReceipt;
