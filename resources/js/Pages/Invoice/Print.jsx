import { Table } from '@mui/material';
import Box from '@mui/material/Box';
import { Head } from '@inertiajs/react';
import CompanyHeader from './Print/CompanyHeader';
import ClientInfo from './Print/ClientInfo';
import ItemsTable from './Print/ItemsTable';
import PaymentSummary from './Print/PaymentSummary';

const Print = ({ invoice }) => {
    const address = [
        invoice.owner?.billingInfo?.address,
        invoice.owner?.billingInfo?.city,
        invoice.owner?.billingInfo?.country,
    ]
        .filter((item) => item !== undefined)
        .join(', ');
    const invoiceDate = new Date(invoice.created_at).toDateString();
    const invoiceTime = new Date(invoice.created_at).toLocaleTimeString();
    let advPayment = {
        date: null,
        price: 0,
    };
    if (
        invoice.patient_payments?.length > 1 ||
        (invoice.patient_payments_sum_price <
            invoice.acceptance_items_sum_price - invoice.acceptance_items_sum_discount &&
            invoice.patient_payments?.length)
    ) {
        advPayment = {
            date: new Date(invoice.patient_payments[0].created_at).toLocaleDateString(),
            price: invoice.patient_payments[0].price,
        };
    }
    return (
        <>
            <Head title={`Invoice ${invoice.invoiceNo}`} />
            <Table sx={{ maxWidth: '210mm', border: 'none' }}>
                <CompanyHeader
                    invoice={invoice}
                    invoiceDate={invoiceDate}
                    invoiceTime={invoiceTime}
                />
                <ClientInfo invoice={invoice} address={address} />
                <ItemsTable invoice={invoice} />
                <PaymentSummary invoice={invoice} advPayment={advPayment} />
            </Table>
            {invoice.status === 'Canceled' ? (
                <Box
                    sx={{
                        position: 'absolute',
                        display: 'flex',
                        width: '210mm',
                        height: '100%',
                        top: 0,
                        left: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <h1
                        style={{
                            transform: 'rotate(315deg)',
                            color: 'gray',
                            fontSize: '40px',
                        }}
                    >
                        Canceled
                    </h1>
                </Box>
            ) : null}
        </>
    );
};
export default Print;
