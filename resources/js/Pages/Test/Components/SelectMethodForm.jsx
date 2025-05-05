import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl, FormHelperText,
    InputLabel,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import SelectSearch from "@/Components/SelectSearch.jsx";
import React, {useState} from "react";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";

const SelectMethodForm = ({method, type, open, onClose, onChange, onSubmit, errors}) => {
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        let newMethod=test.method_tests.find((item) => item.method.id === e.target.value);
        onChange(
            e.target.name,
            newMethod.method
        );
    }
    const handleTestSelect = (e) => {
        if (e.target.value) {
            setLoading(true)
            axios.get(route("api.tests.show", e.target.value))
                .then(({data}) => setTest(data.data))
                .finally(() => setLoading(false));
        } else
            setTest(null);
        onChange("method", null);
    }

    return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Method</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} mt={2}>
                <Grid size={{xs: 4}}>
                    <SelectSearch value={test}
                                  label="Test"
                                  fullWidth
                                  defaultData={{type: ['TEST', 'SERVICE']}}
                                  url={route("api.tests.list")}
                                  onChange={handleTestSelect}
                                  name="test"/>
                </Grid>

                {loading ? <Grid size={{xs: 12}}>
                    <CircularProgress sx={{m: "auto"}}/>
                </Grid> : test && <>
                    <Grid container spacing={2}>
                        <Grid><strong>Full Name : </strong>{test.fullName}</Grid>
                        <Grid><strong>Test Code : </strong>{test.code}</Grid>
                        {type === '1' ? <>
                            <Grid><strong> Test Category : </strong>{test?.testGroup?.name}</Grid>
                            <Grid><strong> Acceptable Sample
                                Types: </strong>{test?.sampleTypes?.map(sampleType => sampleType.sampleType.name + ` ( ${sampleType.description} )`).join(", ")}
                            </Grid>
                        </> : null}
                        {test.description &&
                            <Grid size={{xs: 12}}><strong> Description : </strong>
                                <div dangerouslySetInnerHTML={{__html:test.description}}/>
                            </Grid>}
                        <Grid size={{xs: 12}}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            Name
                                        </TableCell>
                                        {test.type === '1' ? <TableCell>
                                            Turnaround Time(day)
                                        </TableCell> : null}
                                        <TableCell>
                                            Price(OMR)
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {test.method_tests?.map(method_test => <TableRow key={method_test.id}>
                                        <TableCell>{method_test.method?.name}</TableCell>
                                        {test.type === '1' ?
                                            <TableCell>{method_test.method?.turnaround_time}</TableCell> : null}
                                        <TableCell>{method_test.method.price_type === "Fix" ? method_test.method?.price : method_test.method.price_type}</TableCell>
                                    </TableRow>)}
                                </TableBody>
                            </Table>
                        </Grid>
                    </Grid>
                    <Grid size={{xs: 4}}>
                        <FormControl fullWidth>
                            <InputLabel id="method"
                                        error={Boolean(errors?.method)}>Method</InputLabel>
                            <Select onChange={handleChange}
                                    name="method"
                                    label="Method"
                                    value={method?.id}
                                    fullWidth
                                    labelId="method">
                                {test.method_tests?.map(m => m.status ? <MenuItem key={"method-" + m.method.id}
                                                                             value={ m.method.id}>{ m.method.name}</MenuItem> : null)}
                            </Select>
                            <FormHelperText error={errors?.hasOwnProperty("method")}>{errors?.method}</FormHelperText>
                        </FormControl>
                    </Grid>
                </>}
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            {method && <Button onClick={onSubmit}
                               disabled={!method?.id}
                               variant="contained">Submit</Button>}
        </DialogActions>
    </Dialog>
}
export default SelectMethodForm;
