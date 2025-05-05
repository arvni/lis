import React, {useState,} from "react";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import AddSection from "./AddSection";
import {CardsContainer} from "@/Pages/Workflow/Components/CardsContainer";
import {FormControlLabel, Switch} from "@mui/material";
import PageHeader from "@/Components/PageHeader.jsx";

export default function ({data, setData, submit, cancel,errors}) {
    const [sectionWorkflow, setSectionWorkflow] = useState({
        id: Date.now(),
        section: {
            id: "",
            name: ""
        },
        parameters: [],
    });
    const [openSection, setOpenSection] = useState(false);
    const closeSection = () => setOpenSection(false);
    const find = (id) => {
        let tmp = data.section_workflows.filter((item) => item?.id + "" === id + "")[0];
        return {section: tmp, index: data.section_workflows.indexOf(tmp)};
    }
    const editSection = (sectionId) => {
        setSectionWorkflow(find(sectionId).section);
        setOpenSection(true);
    }
    const deleteSection = (id) => {
        let tmp = data.section_workflows;
        tmp.splice(find(id).index, 1);
        setData(pervData => ({...pervData, section_workflows: tmp}));
    }
    const sectionChange = () => {
        let tmp = data.section_workflows;
        let index = find(sectionWorkflow.id).index;
        if (index > -1)
            tmp[index] = sectionWorkflow;
        else
            tmp.push(sectionWorkflow);
        setData(pervData => ({...pervData, section_workflows: tmp}));
        closeSection();
    }
    const addSection = () => {
        setSectionWorkflow({
            id: Date.now(),
            section: {
                id: "",
                name: ""
            },
            parameters: [],
        });
        setOpenSection(true);
    }
    const handleNameChanged = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleActiveChanged = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.checked}));

    return (
        <Container sx={{p: "1em"}}>
            <PageHeader title={data.id ? "Edit" : "Add New"+" Workflow"}/>
            <Grid container  sx={{mt:2}} spacing={2}>
                <Grid>
                    <TextField value={data.name}
                               name="name"
                               label="Title"
                               error={errors.hasOwnProperty('name')}

                               onChange={handleNameChanged}/>
                </Grid>
                <Grid item>
                    <FormControlLabel
                        control={<Switch color="primary"
                                         checked={data.status}
                                         onChange={handleActiveChanged}
                                         name="status"/>}
                        label="Is Active ?"
                        labelPlacement="start"
                    />
                </Grid>
            </Grid>
            <Divider><Typography variant="h5">Sections</Typography></Divider>
            <Grid container spacing={2} rowSpacing={2} sx={{mt: "1em", overflowX: "auto"}}>
                <DndProvider backend={HTML5Backend}>
                    <CardsContainer onEdit={editSection}
                                    setData={setData}
                                    sections={data.section_workflows}
                                    onDelete={deleteSection}/>
                </DndProvider>
            </Grid>
            <Button onClick={addSection}>Add Section</Button>
            <Divider sx={{my: "1em"}}/>
            <Grid container flex justifyItems="flex-end" justifyContent="flex-end" spacing={2}>
                <Grid item>
                    <Button onClick={cancel}>Cancel</Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={submit}>Submit</Button>
                </Grid>
            </Grid>
            <AddSection onClose={closeSection}
                        open={openSection}
                        onChange={sectionChange}
                        sectionWorkflow={sectionWorkflow}
                        setSectionWorkflow={setSectionWorkflow}/>
        </Container>
    );
}
