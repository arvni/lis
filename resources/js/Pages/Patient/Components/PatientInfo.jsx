import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import React, {useState} from "react";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
    AccordionActions,
    Box,
    Chip,
    Divider,
    Grid2 as Grid,
    Paper,
    Tooltip,
    Dialog
} from "@mui/material";
import Button from "@mui/material/Button";
import {LoadingButton} from "@mui/lab";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Male as MaleIcon,
    Female as FemaleIcon,
    QuestionMark as QuestionMarkIcon,
    Phone as PhoneIcon,
    Cake as CakeIcon,
    Badge as BadgeIcon,
    OpenInNew as OpenInNewIcon, AccessibilityNew, LocationCity, Home
} from "@mui/icons-material";
import {useForm,Link} from "@inertiajs/react";
import countries from "@/Data/Countries.js";
import PatientForm from "@/Pages/Patient/Components/PatientForm";
import DocumentsInfo from "@/Components/DocumentsInfo";


/**
 * Enhanced PatientInfo component
 *
 * @param {Object} props - Component props
 * @param {Object} props.patient - Patient information
 * @param {boolean} [props.editable=false] - Whether patient info is editable
 * @param {boolean} [props.defaultExpanded=true] - Whether accordion is expanded by default
 * @param {boolean} [props.showDocuments=false] - Whether to show document section
 * @param {boolean} [props.viewPatient=false] - Whether to show view patient button
 * @returns {JSX.Element}
 */
const PatientInfo = ({
                         patient,
                         editable = false,
                         defaultExpanded = true,
                         showDocuments = false,
                         viewPatient = false,
                         tags = []
                     }) => {
    // Initialize form with patient data
    const {data, setData, post, processing, reset} = useForm({
        ...patient,
        nationality: typeof patient.nationality !== "string"
            ? patient.nationality
            : countries.find(c => c.code === patient.nationality),
        _method: "put"
    });

    // State for edit mode
    const [edit, setEdit] = useState(false);

    // Handle form field changes
    const handlePatient = e => {
        setData(prevData => ({
            ...prevData,
            [e.target.name]: e.target.value
        }));
    };

    // Submit form handler
    const handleSubmit = () => {
        post(route("patients.update", patient.id), {onSuccess: () => setEdit(false)});
    };

    // Cancel edit handler
    const handleCancel = () => {
        reset();
        setEdit(false);
    };

    // Enter edit mode handler
    const handleEdit = () => {
        setEdit(true);
    };

    // Get gender icon and color
    const getGenderInfo = () => {
        switch (data.gender) {
            case 'male':
                return {
                    icon: <MaleIcon sx={{color: 'primary.main'}}/>,
                    label: 'Male',
                    color: 'primary'
                };
            case 'female':
                return {
                    icon: <FemaleIcon sx={{color: 'secondary.main'}}/>,
                    label: 'Female',
                    color: 'secondary'
                };
            default:
                return {
                    icon: <QuestionMarkIcon/>,
                    label: 'Unspecified',
                    color: 'default'
                };
        }
    };

    const genderInfo = getGenderInfo();

    const [openImage, setOpenImage] = useState(false);
    const handleClickImage = () => setOpenImage(true)
    const closeImgViewer = () => {
        setOpenImage(false)
    }

    const PatientAvatar = () => (
        <>
            <Box
                onClick={handleClickImage}
                component="img"
                src={data.avatar || `/images/${data.gender || 'unknown'}.png`}
                alt={data.fullName}
                sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid',
                    borderColor: `${genderInfo.color}.main`,
                    boxShadow: 2,
                    cursor: 'pointer'
                }}
            />
            <Dialog open={openImage} onClose={closeImgViewer} maxWidth="lg">
                <img src={data.avatar || `/images/${data.gender || 'unknown'}.png`} alt={data.fullName || ""}/>
            </Dialog>
        </>
    );

    // Patient summary section
    const PatientSummary = () => (
        <Box sx={{mb: 3}}>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{xs: 12, sm: 3, md: 2}} sx={{display: 'flex', justifyContent: 'center'}}>
                        <PatientAvatar/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 9, md: 10}}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid size={{xs: 12}}>
                                <Box sx={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                                    <Typography variant="h5" sx={{mr: 1, fontWeight: 'bold'}}>
                                        {data.fullName}
                                    </Typography>
                                    <Chip
                                        icon={genderInfo.icon}
                                        label={genderInfo.label}
                                        size="small"
                                        color={genderInfo.color}
                                        sx={{mr: 1}}
                                    />
                                    {data.nationality && (
                                        <Tooltip title={`Nationality: ${data.nationality.label}`}>
                                            <Box
                                                component="img"
                                                loading="lazy"
                                                width="24"
                                                height="16"
                                                src={`https://flagcdn.com/w40/${data.nationality.code.toLowerCase()}.png`}
                                                alt={data.nationality.label}
                                                sx={{ml: 1, border: '1px solid #eee'}}
                                            />
                                        </Tooltip>
                                    )}
                                </Box>
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <BadgeIcon fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                    <Typography variant="body1" color="text.secondary">
                                        ID: {data.idNo || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <AccessibilityNew fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                    <Typography variant="body1" color="text.secondary">
                                        Tribe: {data.tribe || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <CakeIcon fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                    <Typography variant="body1" color="text.secondary">
                                        DOB: {data.dateOfBirth || 'N/A'} ({data.age})
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{xs: 12, sm: 6, md: 3}}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <PhoneIcon fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                    <Typography variant="body1" color="text.secondary">
                                        Phone: {data.phone || 'N/A'}
                                    </Typography>
                                </Box>
                            </Grid>
                            {data.nationality.code === "OM" && <>
                                <Grid size={{xs: 12, sm: 6, md: 3}}>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <LocationCity fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                        <Typography variant="body1" color="text.secondary">
                                            Wilayat: {data.wilayat || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{xs: 12, sm: 6, md: 3}}>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Home fontSize="medium" sx={{color: 'text.secondary', mr: 1}}/>
                                        <Typography variant="body1" color="text.secondary">
                                            Village: {data.village || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </>}
                            {viewPatient && (
                                <Grid size={{xs: 12, sm: 6, md: 3}}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<OpenInNewIcon/>}
                                        href={patient.id ? route("patients.show", patient.id) : null}
                                        component={Link}
                                        sx={{borderRadius: 2}}
                                    >
                                        View Full Profile
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );

    return (
        <Accordion
            defaultExpanded={defaultExpanded}
            sx={{
                borderRadius: 1,
                '&:before': {display: 'none'},
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon/>}
                aria-controls="patient-information"
                id="patient-information"
                sx={{
                    backgroundColor: 'background.paper',
                    borderRadius: '8px 8px 0 0'
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <PersonIcon sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 500,
                            color: 'text.primary'
                        }}
                    >
                        Patient Information
                    </Typography>
                </Box>
            </AccordionSummary>

            <Divider/>

            <AccordionDetails sx={{backgroundColor: 'background.default', p: 3}}>
                {!edit ? <PatientSummary/> : <PatientForm
                    data={data}
                    onChange={handlePatient}
                    editable={edit}
                />}

                {showDocuments && (
                    <Box sx={{mt: 3}}>
                        <DocumentsInfo
                            defaultExpanded={false}
                            documents={patient.owned_documents}
                            patientId={patient.id}
                            editable={false}
                            titleVariant="h6"
                            tags={tags}
                        />
                    </Box>
                )}
            </AccordionDetails>

            {editable && (
                <>
                    <Divider/>
                    <AccordionActions sx={{p: 2, backgroundColor: 'background.paper'}}>
                        {edit ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleCancel}
                                    startIcon={<CancelIcon/>}
                                    variant="outlined"
                                    color="inherit"
                                    sx={{borderRadius: 2}}
                                >
                                    Cancel
                                </Button>
                                <LoadingButton
                                    onClick={handleSubmit}
                                    variant="contained"
                                    loading={processing}
                                    loadingPosition="start"
                                    startIcon={<SaveIcon/>}
                                    sx={{borderRadius: 2}}
                                >
                                    Save Changes
                                </LoadingButton>
                            </Stack>
                        ) : (
                            <Button
                                onClick={handleEdit}
                                startIcon={<EditIcon/>}
                                variant="outlined"
                                color="secondary"
                                sx={{borderRadius: 2}}
                            >
                                Edit Patient Info
                            </Button>
                        )}
                    </AccordionActions>
                </>
            )}
        </Accordion>
    );
};

export default PatientInfo;
