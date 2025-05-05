import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    AccordionActions,
    Typography,
    Button,
    Stack,
    Tooltip
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";
import Upload from "@/Components/Upload";

/**
 * Prescription component for managing prescription documents
 *
 * @param {Object} props - Component props
 * @param {Object|null} props.prescription - The prescription document object
 * @param {Object} props.acceptance - The acceptance object
 * @param {boolean} [props.defaultExpanded=true] - Whether the accordion is expanded by default
 * @param {Function} [props.onUpdate] - Callback function when prescription is updated
 * @returns {JSX.Element}
 */
const Prescription = ({
                          prescription,
                          acceptance,
                          defaultExpanded = true,
                          onUpdate
                      }) => {
    // Track if we're in edit mode
    const [edit, setEdit] = useState(!prescription);

    // Set up form handling
    const { data, setData, reset, post, processing } = useForm({
        prescription,
        _method: "post"
    });

    // Form submission handler
    const handleSubmit = () => {
        post(route("acceptances.prescription", acceptance.id), {
            onSuccess: () => {
                setEdit(false);
                if (onUpdate) onUpdate(data.prescription);
            }
        });
    };

    // Cancel edit mode
    const handleCancel = () => {
        reset();
        setEdit(false);
    };

    // Enter edit mode
    const handleEdit = () => {
        setEdit(true);
    };

    // Handle file change
    const handleChange = (_, value) => {
        setData(previousData => ({ ...previousData, prescription: value }));
    };

    // Display prescription status
    const renderPrescriptionStatus = () => {
        if (prescription && !edit) {
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography>{prescription.originalName}</Typography>
                    <Tooltip title="View Prescription">
                        <Button
                            startIcon={<VisibilityIcon />}
                            component="a"
                            href={route("documents.show", prescription.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            variant="outlined"
                        >
                            View
                        </Button>
                    </Tooltip>
                </Stack>
            );
        }

        return (
            <Upload
                value={data.prescription}
                editable
                onChange={handleChange}
                url={route("documents.store")}
                maxFileSize={10485760} // 10MB
            />
        );
    };

    // Render action buttons
    const renderActions = () => {
        if (edit) {
            return (
                <Stack direction="row" spacing={2}>
                    {!processing && (
                        <Button
                            onClick={handleCancel}
                            disabled={processing}
                            color="secondary"
                        >
                            Cancel
                        </Button>
                    )}
                    {data.prescription && (
                        <LoadingButton
                            onClick={handleSubmit}
                            variant="contained"
                            loading={processing}
                            startIcon={<SaveIcon />}
                            color="primary"
                        >
                            Save
                        </LoadingButton>
                    )}
                </Stack>
            );
        }

        return (
            <Button
                onClick={handleEdit}
                startIcon={<EditIcon />}
                variant="outlined"
            >
                Edit
            </Button>
        );
    };

    return (
        <Accordion defaultExpanded={defaultExpanded}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="prescription-content"
                id="prescription-header"
            >
                <Typography variant="h5">Prescription</Typography>
            </AccordionSummary>

            <AccordionDetails>
                {renderPrescriptionStatus()}
            </AccordionDetails>

            <AccordionActions>
                {renderActions()}
            </AccordionActions>
        </Accordion>
    );
};

export default Prescription;
