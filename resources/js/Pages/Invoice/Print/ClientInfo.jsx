import { Table, TableCell, TableRow } from '@mui/material';
import countries from '@/Data/Countries';

// Client billing block + custom subject / patient details
const ClientInfo = ({ invoice, address }) => (
    <TableRow>
        <TableCell sx={{ paddingX: 0 }}>
            <Table>
                <TableRow>
                    <TableCell sx={{ padding: 0, width: '105mm', border: '2px solid' }}>
                        <Table sx={{ '& td': { paddingY: '5px', border: 'none' } }}>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <strong>Client: </strong>
                                    {invoice?.owner?.billingInfo?.name ?? invoice.owner.fullName}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <strong>Place of Supply: </strong>
                                    {invoice?.acceptance?.out_patient ? 'Out Patient' : 'In Bion'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <strong>Address: </strong>
                                    {address}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <strong>Phone: </strong>
                                    {invoice.owner?.billingInfo?.phone}
                                </TableCell>
                                <TableCell>
                                    <strong>VATIN: </strong>
                                    {invoice.owner?.billingInfo?.vatIn}
                                </TableCell>
                            </TableRow>
                        </Table>
                    </TableCell>
                    <TableCell sx={{ padding: 0, width: '105mm', border: '2px solid' }}>
                        {(() => {
                            const subject = invoice?.subject;
                            const populatedLines = (subject?.lines || []).filter(
                                (l) => l && (l.label || l.value),
                            );
                            const hasCustomSubject =
                                Boolean(subject?.title) || populatedLines.length > 0;
                            return hasCustomSubject;
                        })() ? (
                            <Table sx={{ '& td': { paddingY: '5px', border: 'none' } }}>
                                {invoice.subject.title && (
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>{invoice.subject.title}</strong>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {(invoice.subject.lines || [])
                                    .filter((l) => l && (l.label || l.value))
                                    .map((line, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell colSpan={2}>
                                                {line.label && <strong>{line.label}: </strong>}
                                                {line.value}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </Table>
                        ) : (
                            <Table sx={{ '& td': { paddingY: '5px', border: 'none' } }}>
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <strong>Patient: </strong>
                                        {invoice?.acceptance?.patient?.fullName}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <strong>ID/Reference No.: </strong>
                                        {invoice?.acceptance?.referrer_order?.orderInformation
                                            ?.patient?.reference_id ??
                                            invoice?.acceptance?.referenceCode ??
                                            invoice?.acceptance?.patient?.idNo}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        <strong>Age: </strong>
                                        {invoice?.acceptance?.patient?.age}
                                    </TableCell>
                                    <TableCell>
                                        <strong>Nationality: </strong>
                                        {
                                            countries.find(
                                                (item) =>
                                                    item.code ===
                                                    invoice?.acceptance?.patient?.nationality,
                                            )?.label
                                        }
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        <strong>Gender: </strong>
                                        {invoice?.acceptance?.patient?.gender}
                                    </TableCell>
                                    <TableCell>
                                        <strong>Phone: </strong>
                                        {invoice?.acceptance?.patient?.phone}
                                    </TableCell>
                                </TableRow>
                            </Table>
                        )}
                    </TableCell>
                </TableRow>
            </Table>
        </TableCell>
    </TableRow>
);

export default ClientInfo;
