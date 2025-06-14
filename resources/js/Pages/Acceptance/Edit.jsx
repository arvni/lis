import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AcceptanceForm from "@/Pages/Acceptance/Components/AcceptanceForm";
import Dialog from "@mui/material/Dialog";
import React, {useCallback, useState} from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {Dangerous} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {Stack} from "@mui/material";
import {router, useForm} from "@inertiajs/react";

const Edit = ({acceptance, maxDiscount, canAddPrescription = false}) => {
    const {data, setData, post, errors, setError, clearErrors, reset} = useForm({...acceptance, _method: "put"});

    const [open, setOpen] = useState(acceptance.status !== "pending");


    const handleClose = () => setOpen(false);

    // Memoized validation functions to prevent unnecessary re-creations
    const validateTests = useCallback((formData) => {
        if (!formData.acceptanceItems?.tests?.length && !formData.acceptanceItems?.panels?.length) {
            setError("acceptanceItems", "Please select at least one test");
            document.getElementById("add-test")?.focus();
            return false;
        }
        return true;
    }, [data?.acceptanceItems]);

    const validateReferrer = useCallback((formData) => {
        if (formData.referred && formData.referrer === "") {
            setError("referrer", "Please select referrer");
            document.getElementById("referrer")?.focus();
            return false;
        }
        return true;
    }, [data?.referred, data?.referrer, setError]);

    const validateReporting = useCallback((formData) => {
        const howReport = formData?.howReport || {};

        // Validate print option
        if (howReport.print) {
            if (!howReport.printReceiver || howReport.printReceiver.trim() === '') {
                setError("howReport.printReceiver", "Please enter the name of the person who will collect the report");
                document.getElementById("how-report-print-receiver")?.focus();
                return false;
            }
        }

        // Validate email option
        if (howReport.email) {
            if (!howReport.emailAddress || howReport.emailAddress.trim() === '') {
                setError("howReport.emailAddress", "Please enter an email address");
                document.getElementById("how-report-email")?.focus();
                return false;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(howReport.emailAddress)) {
                setError("howReport.emailAddress", "Please enter a valid email address");
                document.getElementById("how-report-email")?.focus();
                return false;
            }
        }

        // Validate WhatsApp option
        if (howReport.whatsapp) {
            if (!howReport.whatsappNumber || howReport.whatsappNumber.trim() === '') {
                setError("howReport.whatsappNumber", "Please enter a WhatsApp number");
                document.getElementById("how-report-whatsapp")?.focus();
                return false;
            }

            // Basic phone number validation (should contain digits and possibly +, -, (), spaces)
            const phoneRegex = /^[+\d\s\-()]{7,20}$/;
            if (!phoneRegex.test(howReport.whatsappNumber.replace(/\s/g, ''))) {
                setError("howReport.whatsappNumber", "Please enter a valid phone number with country code");
                document.getElementById("how-report-whatsapp")?.focus();
                return false;
            }
        }

        return true;
    }, [setError]);

    // Combined validation function
    // Step-based validation for Edit.jsx
    const validateForm = useCallback((step = data?.step, formData) => {
        clearErrors();

        // Define which validation functions to run based on current step
        switch (step) {
            case 0: // Patient Information
                // Usually no validation needed as this is often read-only
                return true;

            case 1: // Consultation Request
                // No specific validation needed for consultation checkbox
                return true;

            case 2: // Doctor & Referral
                return validateReferrer(formData);

            case 3: // Tests Selection
                return validateTests(formData);

            case 4: // Sampling & Delivery
                return validateReporting(formData);

            case 5: // Review & Submit
                // Run all validations for final submission
                return validateTests(formData) && validateReferrer(formData) && validateReporting(formData);

            default:
                // Run all validations if step is unknown
                return validateTests(formData) && validateReferrer(formData) && validateReporting(formData);
        }
    }, [clearErrors, validateTests, validateReferrer, validateReporting, data?.step]);

    // Update the save function to pass the current step
    const save = useCallback((formData, step, cb) => {
        if (!validateForm(step, formData)) {
            return;
        }

        router.post(
            route('acceptances.update', acceptance.id),
            {...formData, step},
            {
                onError: console.error,
                onSuccess: () => {
                    setData({...formData, step});
                    if (cb)
                    cb();
                }
            }
        );
    }, [setData, validateForm, reset]);

    return (<>
        <AcceptanceForm initialData={data}
                        onSubmit={save}
                        errors={errors}
                        reset={reset}
                        setData={setData}
                        defaultStep={data.step}
                        canAddPrescription={canAddPrescription}
                        maxDiscount={maxDiscount}/>
        <Dialog open={open}>
            <DialogTitle>
                <Stack direction="row" spacing={1}>
                    <Dangerous color="error"/>
                    <Typography>
                        Caution
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                Warning: Editing Test of Each item will result in the deletion of all histories of the item.
                Please proceed with caution.
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    </>);
}

const breadCrumbs = [
    {
        title: "Acceptances",
        link: route("acceptances.index"),
        icon: null,
    },
]

Edit.layout = page => <AuthenticatedLayout auth={page.props.auth}
                                           children={page}
                                           breadcrumbs={[...breadCrumbs, {
                                               title: "Edit Acceptance #" + page.props.acceptance.id,
                                               link: "",
                                               icon: null
                                           }]}/>
export default Edit;
