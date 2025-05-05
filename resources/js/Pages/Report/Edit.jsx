import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import SectionsInfo from "@/Pages/AcceptanceItem/Components/SectionsInfo";
import TestInfo from "@/Pages/AcceptanceItem/Components/TestInfo";
import ReportForm from "@/Pages/Report/Components/ReportForm";
import {useForm} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {useMemo, useCallback} from "react";

/**
 * Edit Report Page Component
 *
 * Responsible for editing an existing report in the Reception domain
 */
const Edit = ({patients, acceptanceItem, report, signers, templates}) => {
    // Initialize form with report data
    const {post, data, setData, errors, setError} = useForm({
        ...report,
        signers,
        _method: "put"
    });

    // Validation function
    const validateForm = useCallback(() => {
        // Check if all signers have signatures
        const allSignersHaveSignature = data.signers
            .map(signer => Boolean(signer.user.signature))
            .reduce((allValid, current) => allValid && current, true);

        if (!allSignersHaveSignature) {
            setError("signers", "All the Signers Must have signature");
            return false;
        }

        return true;
    }, [data.signers, setError]);

    // Form submission handler
    const handleSubmit = useCallback(() => {
        if (validateForm()) {
            post(route("reports.update", report.id));
        }
    }, [validateForm, post, report.id]);

    // Primary patient (for reports we typically have one patient)
    const primaryPatient = useMemo(() => patients[0], [patients]);

    return (
        <>
            <PageHeader title="Edit Report"/>

            {/* Patient Information Section */}
            <section className="patient-info-section">
                {patients.map(patient => (
                    <PatientInfo
                        key={patient.id}
                        patient={patient}
                        defaultExpanded={false}
                        showDocuments
                    />
                ))}
            </section>

            {/* Test Information Section */}
            <section className="test-info-section">
                <TestInfo
                    method={acceptanceItem.method}
                    test={acceptanceItem.test}
                    showSections={false}
                />
            </section>

            {/* Sections Information */}
            <section className="sections-info">
                <SectionsInfo
                    acceptanceItemStates={acceptanceItem.acceptance_item_states}
                />
            </section>

            {/* Report Form */}
            <section className="report-form-section">
                <ReportForm
                    data={data}
                    setData={setData}
                    onSubmit={handleSubmit}
                    patientID={primaryPatient.id}
                    errors={errors}
                    templates={templates}
                />
            </section>
        </>
    );
};

// Define breadcrumbs for navigation
const breadCrumbs = [
    {
        title: "Reports",
        link: route("reports.index"),
        icon: null
    },
];

// Setup layout with breadcrumbs
Edit.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: `Edit Report ${page.props.report.id}`,
                link: null,
                icon: null
            }
        ]}
    />
);

export default Edit;
