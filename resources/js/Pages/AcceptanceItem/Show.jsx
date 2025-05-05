import Container from "@mui/material/Container";
import {Box, Button} from "@mui/material";
import React from "react";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TestInfo from "./Components/TestInfo";
import TimeLine from "./Components/TimeLine";
import ReportInfo from "./Components/ReportInfo";
import SectionsInfo from "./Components/SectionsInfo";
import {router} from "@inertiajs/react";

const Show = ({acceptanceItem}) => {
    const handleCheckWorkflow = () => router.visit(route("acceptanceItems.check-workflow", acceptanceItem.id))
    return <Container sx={{p: "1em"}}>
        {acceptanceItem.patients.map(patient => <PatientInfo patient={patient}/>)}
        <TestInfo method={acceptanceItem.method} test={acceptanceItem.test}/>
        <SectionsInfo acceptanceItemStates={acceptanceItem.acceptance_item_states}/>
        <TimeLine timeline={acceptanceItem.timeline}/>
        {acceptanceItem.report ? <ReportInfo report={acceptanceItem.report}/> : <Box>
            <Button onClick={handleCheckWorkflow}>Check Workflow</Button>
        </Box>}
    </Container>;
}
const breadCrumbs = [
    {
        title: "Acceptances",
        link: route("acceptances.index"),
        icon: null
    },
]
Show.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                           children={page}
                                           breadcrumbs={[
                                               ...breadCrumbs,
                                               {
                                                   title: `Acceptance #${page.props.acceptanceItem.acceptance.id}`,
                                                   link: route("acceptances.show", page.props.acceptanceItem.acceptance.id),
                                                   icon: null
                                               },
                                               {
                                                   title: `${page.props?.acceptanceItem?.test?.name} Test`,
                                                   link: null,
                                                   icon: null
                                               },
                                           ]}/>

export default Show;
