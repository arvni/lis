import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
    Button,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import {useForm} from "@inertiajs/react";

const Form = ({barcodes, samples, open, onClose, acceptance}) => {
    const {data, setData, errors, post, reset} = useForm({barcodes})
    const handleSubmit = () => post(route('referrerOrders.samples'), {
        onSuccess: () => {
            window.open(route("printBarcode", acceptance), "_blank");
            handleClose();
            reset();
        }
    });
    const handleClose = () => {
        reset();
        onClose();
    }
    const sampleChange = (index) => (e, v) => {
        let tmp = [...barcodes];
        let sample = samples.find(item => item.id === e.target.value);
        tmp[index] = {...tmp[index], sample, collectionDate: sample.collection_date, barcode: sample.sampleId ?? null}
        setData({barcodes: tmp});
    }
    const sampleTypeChange = (index) => (e, v) => {
        let tmp = [...barcodes];
        tmp[index] = {...tmp[index], sampleType: e.target.value}
        setData({barcodes: tmp});
    }

    return data.barcodes.length ? <Dialog open={open} fullWidth maxWidth="lg">
        <DialogTitle>Select Samples</DialogTitle>
        <DialogContent>
            <Box component="form" onSubmit={handleSubmit}>
                <TableContainer>
                    <Table border={1}>
                        <TableHead sx={{
                            "& th": {
                                borderBottom: "1px solid"
                            }
                        }}>
                            <TableRow>
                                <TableCell rowSpan={2} align={"center"}>
                                    Barcode Group
                                </TableCell>
                                <TableCell colSpan={2} align={"center"}>
                                    Test
                                </TableCell>
                                <TableCell colSpan={3} align={"center"}>
                                    Sample
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align={"center"}>
                                    Name
                                </TableCell>
                                <TableCell align={"center"}>
                                    Sample Types
                                </TableCell>
                                <TableCell align={"center"}>
                                    Sample Type
                                </TableCell>
                                <TableCell align={"center"}>
                                    Sample
                                </TableCell>
                                <TableCell align={"center"}>
                                    Sample Info
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.barcodes.map((barcode, index) => <TableRow key={"barcode-" + barcode.barcodeGroup.id}>
                                <TableCell rowSpan={barcode.acceptanceItems.length}>
                                    {barcode.barcodeGroup.name}
                                </TableCell>
                                <TableCell colSpan={2}>
                                    {barcode.acceptanceItems.map((item) => <Grid container
                                                                                 key={"test-" + item.method.id}>
                                        <Grid item xs={6}>
                                            {`${item.method.test.name} >> ${item.method.name}`}
                                        </Grid>
                                        <Grid item xs={6}>
                                            {item.method.test.sample_types.map(sampleType => `${sampleType.name}(${sampleType.pivot.description})`).join(", ")}
                                        </Grid>
                                    </Grid>)}

                                </TableCell>
                                <TableCell>
                                    <Select sx={{minWidth: "100px"}} onChange={sampleTypeChange(index)}
                                            variant="standard"
                                            value={barcode.sampleType ?? ""}>
                                        {barcode?.sampleTypes?.map(sampleType => <MenuItem
                                            key={"sample-type-" + sampleType.id}
                                            value={sampleType.id}>{sampleType.name}</MenuItem>)}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Stack spacing={1}>
                                        <Select sx={{minWidth: "100px"}} onChange={sampleChange(index)}
                                                variant="standard"
                                                value={barcode?.sample?.id || ""}>
                                            {samples?.map(sample => <MenuItem
                                                key={"sample-" + sample.id}
                                                value={sample.id}>
                                                <span>{sample.sample_type?.name} {sample.sampleId && ` | ${sample.sampleId}`}</span>
                                            </MenuItem>)}
                                        </Select>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    {barcode.sample && <ul>
                                        <li><span>Sample Type:</span> {barcode?.sample?.sample_type.name}</li>
                                        <li><span>Collection Date:</span> {barcode?.sample?.collectionDate}</li>
                                        {barcode?.sample?.sampleId &&
                                            <li><span>Barcode:</span> {barcode?.sample?.sampleId}</li>}
                                    </ul>}
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button type="reset" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" type="submit" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
    </Dialog> : null;
}
export default Form;
