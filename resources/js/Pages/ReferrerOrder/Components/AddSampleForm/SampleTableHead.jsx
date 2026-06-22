import { TableCell, TableHead, TableRow } from '@mui/material';

const SampleTableHead = ({ isPooling }) => (
    <TableHead>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell rowSpan={2} align="center" sx={{ fontWeight: 'bold', minWidth: 120 }}>
                Barcode Group
            </TableCell>
            {isPooling && (
                <TableCell rowSpan={2} align="center" sx={{ fontWeight: 'bold', minWidth: 200 }}>
                    Linked Tests *
                </TableCell>
            )}
            <TableCell colSpan={2} align="center" sx={{ fontWeight: 'bold', borderBottom: 1 }}>
                Test Information
            </TableCell>
            <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', borderBottom: 1 }}>
                Sample Details
            </TableCell>
        </TableRow>
        <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                Test Name
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 180 }}>
                Accepted Sample Types
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 150 }}>
                Selected Sample Type *
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                Selected Sample *
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                Sample Information
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                Received Date & Time *
            </TableCell>
        </TableRow>
    </TableHead>
);

export default SampleTableHead;
