import React, {useCallback} from "react";
import {Head, router, useForm} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AcceptanceForm from "./Components/AcceptanceForm";


// Separate email validation into a utility function
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const Add = ({patient, canAddPrescription, maxDiscount}) => {
    // Initialize form with structured default values
    const {
        data,
        setData,
        errors,
        setError,
        clearErrors,
        reset,
        processing
    } = useForm({
        patient,
        samplerGender: 1,
        out_patient: false,
        howReport: {
            way: "print",
            who: patient?.fullName || ""
        },
        doctor: {
            name: "",
            expertise: "",
            phone: "",
            licenseNo: ""
        },
        acceptanceItems: {
            panels: [],
            tests: []
        },
        referrer: "",
        referenceCode: "",
        prescription: null,
        referred: false
    });

    // Memoized validation functions to prevent unnecessary re-creations
    const validateTests = useCallback(() => {
        if (!data.acceptanceItems.tests.length && !data.acceptanceItems.panels.length) {
            setError("acceptanceItems", "Please select at least one test");
            document.getElementById("add-test")?.focus();
            return false;
        }
        return true;
    }, [data.acceptanceItems, setError]);

    const validateReferrer = useCallback(() => {
        if (data.referred && data.referrer === "") {
            setError("referrer", "Please select referrer");
            document.getElementById("referrer")?.focus();
            return false;
        }
        return true;
    }, [data.referred, data.referrer, setError]);

    const validateReporting = useCallback(() => {
        if (!data.referred) {
            if (!["email", "print"].includes(data.howReport.way)) {
                setError("howReport.way", "Please select reporting method");
                document.getElementById("how-report")?.focus();
                return false;
            }

            if (data.howReport.who === "") {
                setError("howReport.who", "Please enter report receiver");
                document.getElementById("how-report-who")?.focus();
                return false;
            }

            if (data.howReport.way === "email" && !validateEmail(data.howReport.who)) {
                setError("howReport.who", "Please enter a valid email");
                document.getElementById("how-report-who")?.focus();
                return false;
            }
        }
        return true;
    }, [data.referred, data.howReport, setError]);

    // Combined validation function
    const validateForm = useCallback((step) => {
        clearErrors();
        if (step === 2)
            return validateReferrer()
        if (step === 3)
            return validateTests();
        if (step === 4)
            return validateReporting()
        if (step === 5)
            return validateTests() && validateReferrer() && validateReporting()
    }, [clearErrors, validateTests, validateReferrer, validateReporting]);

    // Form submission handler with error feedback
    const handleSubmit = useCallback((formData, step) => {
        setData(formData);
        if (!validateForm(step)) {
            return;
        }
        if (step > 0) {
            router.post(route('acceptances.store', patient), {...formData, step}, {
                onSuccess: () => {
                    reset();
                },
                onError: (errors) => {
                    // Scroll to the first error field
                    const firstErrorId = Object.keys(errors)[0]?.replace('.', '-');
                    if (firstErrorId) {
                        const errorElement = document.getElementById(firstErrorId);
                        errorElement?.scrollIntoView({behavior: 'smooth'});
                    }
                }
            });
        }
    }, [setData, validateForm, reset]);


    return (
        <>
            <Head title={`New Acceptance | ${patient?.fullName}`}/>
            <AcceptanceForm
                initialData={data}
                setData={setData}
                onSubmit={handleSubmit}
                errors={errors}
                reset={reset}
                processing={processing}
                canAddPrescription={canAddPrescription}
                maxDiscount={maxDiscount}
            />
        </>
    );
};

// Use a function for layout rather than a property assignment
Add.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {
                title: "Patients",
                link: route("patients.index"),
                icon: null,
            },
            {
                title: page.props.patient.fullName,
                link: route("patients.show", page.props.patient.id),
                icon: null,
            },
            {
                title: "Add New Acceptance",
                link: "",
                icon: null
            }
        ]}
    />
);

export default Add;
