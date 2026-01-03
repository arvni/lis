import Container from "@mui/material/Container";
import {Box, Button, Stack, FormControlLabel, Switch} from "@mui/material";
import React from "react";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TestInfo from "./Components/TestInfo";
import TimeLine from "./Components/TimeLine";
import ReportInfo from "./Components/ReportInfo";
import SectionsInfo from "./Components/SectionsInfo";
import {router, Link} from "@inertiajs/react";
import {Assignment as AssignmentIcon, Timeline as TimelineIcon} from "@mui/icons-material";

const Show = ({acceptanceItem, canCreateReport = false, canToggleReportless = false}) => {
    const handleCheckWorkflow = () => router.visit(route("acceptanceItems.check-workflow", acceptanceItem.id))

    const handleToggleReportless = () => {
        router.put(route("acceptanceItems.toggleReportless", {
            acceptance: acceptanceItem.acceptance_id,
            acceptanceItem: acceptanceItem.id
        }), {}, {
            preserveState: false,
            preserveScroll: true
        });
    };

    return <Container sx={{p: "1em"}}>
        {acceptanceItem.patients.map(patient => <PatientInfo patient={patient} key={patient.id}/>)}
        <TestInfo method={acceptanceItem.method} test={acceptanceItem.test}/>
        {canToggleReportless && (
            <Box sx={{mt: 2, mb: 2}}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={acceptanceItem.reportless}
                            onChange={handleToggleReportless}
                            color="primary"
                        />
                    }
                    label="Reportless (No Report Required)"
                />
            </Box>
        )}
        <SectionsInfo acceptanceItemStates={acceptanceItem.acceptance_item_states}/>
        {/*<TimeLine timeline={acceptanceItem.timeline}/>*/}
        {acceptanceItem.report ? <ReportInfo report={acceptanceItem.report}/> : <Box sx={{mt: 3}}>
            <Stack direction="row" spacing={2}>
                <Button
                    variant="outlined"
                    onClick={handleCheckWorkflow}
                    startIcon={<TimelineIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'medium'
                    }}
                >
                    Check Workflow
                </Button>
                {canCreateReport && !acceptanceItem.reportless && (
                    <Button
                        variant="contained"
                        color="success"
                        component={Link}
                        href={route("acceptanceItems.createReport", acceptanceItem.id)}
                        startIcon={<AssignmentIcon />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 'medium'
                        }}
                    >
                        Create Report
                    </Button>
                )}
            </Stack>
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
