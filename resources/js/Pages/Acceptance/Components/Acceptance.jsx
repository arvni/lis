import React from "react";
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Link
} from "@mui/material";
import {Inertia} from "@inertiajs/inertia";

const AcceptanceTable = ({acceptanceItems, canEdit}) => {
    const handleEdit = (id) => {
        Inertia.visit(route("acceptanceItems.edit", id));
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 700}} aria-label="tests table">
                <TableHead>
                    <TableRow>
                        <TableCell align="left">
                            <Typography variant="h6" fontWeight="bold">Patients</Typography>
                        </TableCell>
                        <TableCell align="left">
                            <Typography variant="h6" fontWeight="bold">Test Code</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="h6" fontWeight="bold">Test Name</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">Test Full Name</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">Method</Typography>
                        </TableCell>
                        <TableCell align="left">
                            <Typography variant="h6" fontWeight="bold">Details</Typography>
                        </TableCell>
                        <TableCell align="left">
                            <Typography variant="h6" fontWeight="bold">Status</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">Discount</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">Price</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">#</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {acceptanceItems.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item?.patients?.map(patient => patient.fullName).join(", ")}</TableCell>
                            <TableCell>{item.test.code}</TableCell>
                            <TableCell>{item.test.name }</TableCell>
                            <TableCell align="center">{item.test.fullName}</TableCell>
                            <TableCell align="center">{item.method.name}</TableCell>
                            <TableCell align="left">{item.details}</TableCell>
                            <TableCell align="left">{item.status}</TableCell>
                            <TableCell align="center">{item.discount}</TableCell>
                            <TableCell align="center">{item.price}</TableCell>
                            <TableCell align="center">
                                {item.method.test.type === '1' ? (
                                    <Link href={route("acceptanceItems.show", item.id)} target="_blank">
                                        view
                                    </Link>
                                ) : null}
                                {canEdit && (
                                    <Button onClick={() => handleEdit(item.id)}>Edit</Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AcceptanceTable;