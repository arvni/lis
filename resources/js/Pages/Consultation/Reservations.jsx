import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import {router,} from "@inertiajs/react";

// Material UI components
import {
    Paper,
    Box,
} from "@mui/material";

// Material UI icons
import {
    MedicalServicesOutlined,
} from "@mui/icons-material";
import TimeCalendar from "./Components/TimeCalendar.jsx";
import Button from "@mui/material/Button";
import AddForm from "./Components/AddForm.jsx"
import EditForm from "./Components/EditForm.jsx"
import {useState} from "react";
import ConvertCustomerToPatientForm from "./Components/ConvertCustomerToPatientForm.jsx";
import {useSnackbar} from "notistack";


const Reservations = ({times, canEdit, canAdd, canDelete}) => {
    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openConversion, setOpenConversion] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [editingReservation, setEditingReservation] = useState(null);

    const { enqueueSnackbar } = useSnackbar();

    const pageReload = (startDate, endDate) => {
        router.visit(route('times.index'), {
            data: {
                startDate,
                endDate,
            },
            preserveState: true,
        });
    };

    // Add reservation handlers
    const handleAddNew = () => setOpenAdd(true);
    const handleCloseAddNew = () => setOpenAdd(false);

    // Edit reservation handlers
    const handleEdit = (time) => {
        console.log(time);
        setEditingReservation(time);
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setEditingReservation(null);
    };

    // Convert to patient handlers
    const handleCloseConvert = () => {
        setOpenConversion(false);
        setSelectedTime(null);
    };

    const handleTimeSelection = (time) => {
        setSelectedTime(time);
        setOpenConversion(true);
    };

    const handleDelete = (time) => {
        if (time.reservable_type === "customer" || (time.reservable_type === "consultation" && time.reservable.status === "booked")) {
            router.post(route('times.destroy', time.id),
                {_method: "delete"},
                {
                    onError: (errors) => {
                        if (typeof errors === 'object' && errors !== null) {
                            Object.values(errors).forEach(error => {
                                enqueueSnackbar(error, { variant: 'error' });
                            });
                        } else
                            enqueueSnackbar('An error occurred while deleting the time', { variant: 'error' });
                    },
                    onSuccess: () => enqueueSnackbar('Time slot deleted successfully', { variant: 'success' })
                });
        } else {
            enqueueSnackbar("This reservation cannot be deleted because the consultation has already taken place.", { variant: 'error' });
        }
    };

    return (
        <Box sx={{position: 'relative'}}>
            <PageHeader
                title="Reservation"
                subtitle="Manage reservations"
                icon={<MedicalServicesOutlined fontSize="large" sx={{mr: 2}}/>}
                actions={canAdd && <Button variant="contained" onClick={handleAddNew}>Add Reservation</Button>}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4
                }}
            >
                <TimeCalendar
                    canConvertToPatient
                    canDeleteTimeSlot={canDelete}
                    canEditTimeSlot={canEdit}
                    canViewConsultation
                    canViewPatient
                    onDateSelect={console.log}
                    onMonthChange={pageReload}
                    onTimeSlotDelete={handleDelete}
                    onTimeSlotEdit={handleEdit}
                    onTimeSlotSelect={handleTimeSelection}
                    timeSlots={times}
                />
            </Paper>

            {/* Add Form */}
            <AddForm
                openAdd={openAdd}
                onClose={handleCloseAddNew}
            />

            {/* Edit Form */}
            <EditForm
                openEdit={openEdit}
                onClose={handleCloseEdit}
                reservation={editingReservation}
            />

            {/* Convert to Patient Form */}
            {openConversion && selectedTime && (
                <ConvertCustomerToPatientForm
                    onClose={handleCloseConvert}
                    time={selectedTime}
                    open={openConversion}
                />
            )}
        </Box>
    );
};

const breadCrumbs = [
    {
        title: "Dashboard",
        link: route('dashboard'),
        icon: null
    },
    {
        title: "Reservations",
        link: null,
        icon: <MedicalServicesOutlined fontSize="small"/>
    }
];

Reservations.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Reservations;
