import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
    Accordion,
    AccordionDetails,
    Button,
    colors, List, ListItem, Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer, TableFooter,
    TableHead,
    TableRow
} from "@mui/material";
import Box from "@mui/material/Box";
import AccordionSummary from "@mui/material/AccordionSummary";
import {Delete as DeleteIcon, ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import React, {useState} from "react";
import {keyframes} from "@mui/system";
import AddTest from "@/Pages/Acceptance/Components/AddTest";
import DeleteForm from "@/Components/DeleteForm";
import {useForm} from "@inertiajs/react";

const blink = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;


const AcceptanceForm = ({defaultValues, open, onClose, referrer, patient, id, requestedTests = [],maxDiscount=0}) => {
    const {data, setData, errors, post, reset} = useForm({
        patient: patient,
        samplerGender: 1,
        out_patient: true,
        howReport: {},
        doctor: {
            name: "",
            expertise: "",
            phone: "",
            licenseNo: ""
        },
        acceptanceItems: [],
        referrer: referrer,
        referenceCode: defaultValues?.referenceCode,
        prescription: null,
        referred: true
    })
    const [openAdd, setOpenAdd] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [acceptanceItem, setAcceptanceItem] = useState({
        test: "",
        details: "",
        discount: 0
    });
    const handleSubmit = () => post(route('referrerOrders.acceptance', id), {onSuccess: closeAddAcceptance});


    const destroy = (index) => () => {
        setAcceptanceItem({...data.acceptanceItems[index], index});
        setOpenDelete(true);
    }

    const closeDelete = () => {
        setOpenDelete(false);
        setAcceptanceItem({
            test: "",
            details: "",
            discount: 0
        })
    }
    const handleDestroy = () => {
        let tmp = [...data.acceptanceItems];
        tmp.splice(acceptanceItem.index, 1);
        setData(prevData => ({...prevData, acceptanceItems: tmp}));
        closeDelete();
    }
    const edit = (index) => () => {
        setAcceptanceItem({...data.acceptanceItems[index], index});
        setOpenAdd(true);
    }

    const submit = () => {
        var tmp = [...data.acceptanceItems];
        if (acceptanceItem.hasOwnProperty("index"))
            tmp[acceptanceItem.index] = acceptanceItem
        else
            tmp.push(acceptanceItem);
        setData(prevData => ({...prevData, acceptanceItems: tmp}));
    }
    const add = () => {
        setOpenAdd(true);
    }
    const close = () => {
        setOpenAdd(false);
        setAcceptanceItem({
            test: "",
            details: "",
            discount: 0
        })
    }

    const closeAddAcceptance = () => {
        reset();
        onClose();
    }

    return <Dialog open={open} fullWidth maxWidth="lg">
        <DialogContent>
            <Box component="form" onSubmit={handleSubmit}>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>} aria-controls="test-information">
                        <Typography variant="h5">Tests</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List subheader="Requested Test" dense disablePadding>
                            {requestedTests.map(item => <ListItem>{item.name}</ListItem>)}
                        </List>
                        <TableContainer component={Paper}>
                            <Table aria-label="tests table" sx={{minWidth: 700}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan="7" align={"right"}>
                                            <IconButton onClick={add} id="add-test" sx={{
                                                "&:focus": {
                                                    background: colors.red.A100,
                                                    animation: `${blink} 1s linear 1s 2 forwards`,
                                                }
                                            }}>
                                                <AddIcon/>
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell align="left">Code</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="center">Full Name</TableCell>
                                        <TableCell align="center">Method</TableCell>
                                        <TableCell align="left">Details</TableCell>
                                        <TableCell align="right">Discount</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.acceptanceItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.test.code}</TableCell>
                                            <TableCell>{item.test.name}</TableCell>
                                            <TableCell align="center">{item.test.fullName}</TableCell>
                                            <TableCell align="center">{item.test.method.name}</TableCell>
                                            <TableCell align="left">{item.details}</TableCell>
                                            <TableCell align="center">{item.discount}</TableCell>
                                            <TableCell align="center">{item.test.method.price_type == "Fix" ? item.test.method.price : calcPrice(item.test.method.extra.formula, item.test.method.extra.parameters, item.price, item?.test?.method?.extra?.conditions)}</TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={2}>
                                                    <IconButton onClick={edit(index)}>
                                                        <EditIcon color="warning"/>
                                                    </IconButton>
                                                    <IconButton onClick={destroy(index)}>
                                                        <DeleteIcon color="error"/>
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!data.acceptanceItems.length && <TableRow>
                                        <TableCell sx={{textAlign: "center"}} colSpan={6}>
                                            <strong>Please Add Tests</strong>
                                        </TableCell>
                                    </TableRow>}
                                </TableBody>
                                {!!data.acceptanceItems.length && <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{textAlign: "center"}}>
                                            <Typography variant="h5">Total:</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="h5">
                                                {data.acceptanceItems.map(item => item.discount * 1).reduce((sum, a) => sum + a, 0)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="h5">
                                                {data.acceptanceItems.map(item => (item.test.method.price_type == "Fix" ? item.test.method.price : calcPrice(item.test.method.extra.formula, item.test.method.extra.parameters, item.price, item.test?.method?.extra?.conditions)) * 1).reduce((sum, a) => sum + a, 0)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>}
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button type="reset" onClick={closeAddAcceptance}>Cancel</Button>
            <Button variant="contained" type="submit" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
        <AddTest onClose={close} setData={setAcceptanceItem} open={openAdd} OnSubmit={submit} data={acceptanceItem}
                 maxDiscount={maxDiscount} referrer={referrer}/>
        <DeleteForm openDelete={openDelete} agreeCB={handleDestroy} disAgreeCB={closeDelete}
                    title={acceptanceItem.test?.name + " Test"}/>
    </Dialog>
}
export default AcceptanceForm;
