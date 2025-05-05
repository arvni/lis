import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import SectionsInfo from "@/Pages/AcceptanceItem/Components/SectionsInfo";
import DocumentsInfo from "@/Components/DocumentsInfo";
import TestInfo from "@/Pages/AcceptanceItem/Components/TestInfo";
import ReportForm from "@/Pages/Report/Components/ReportForm";
import History from "@/Pages/Report/Components/History";
import PageHeader from "@/Components/PageHeader.jsx";
import {useForm} from "@inertiajs/react";

const Add = ({patients, acceptanceItem, templates, history, test, method}) => {
    const {post, data, setData, reset, processing,} = useForm({
        reported_document: null,
        report_template: null,
        parameters: {},
        acceptance_item_id: acceptanceItem.id,
        files: [],
        patient_id: patients[0]?.id
    });
    const handleSubmit = () => post(route("reports.store"));

    return (
        <>
            <PageHeader title="Add Report"/>
            {patients.map(patient => <React.Fragment key={patient.id}>
                <PatientInfo patient={patient} defaultExpanded={false}/>
                <DocumentsInfo documents={patient.owned_documents}
                               defaultExpanded={false}
                               patientId={patient.id}/>
            </React.Fragment>)}
            <TestInfo method={method}
                      test={test}
                      showSections={false}/>
            <SectionsInfo acceptanceItemStates={acceptanceItem.acceptance_item_states}/>
            {history.length ? <History history={history}/> : null}
            <ReportForm data={data}
                        setData={setData}
                        onSubmit={handleSubmit}
                        patientID={patients[0]?.id}
                        templates={templates}/>
        </>);
}
const breadCrumbs = [
    {
        title: "Reports Waiting For Creating",
        link: route("reports.waitingList"),
        icon: null
    },

    {
        title: "Creating Report",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
