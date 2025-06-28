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
import {useState} from "react";
import ConvertCustomerToPatientForm from "./Components/ConvertCustomerToPatientForm.jsx";
import {useSnackbar} from "notistack";


const Reservations = ({times, canEdit, canAdd, canDelete}) => {
    const [openAdd, setOpenAdd] = useState(false);
    const [openConversion, setOpenConversion] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);

    const { enqueueSnackbar } = useSnackbar();
    const pageReload = (startDate, endDate) => {
        console.log(startDate,endDate);
        router.visit(route('times.index'), {
            data: {
                startDate,
                endDate,
            },
            preserveState: true,
        });
    };
    const handleAddNew = () => setOpenAdd(true);
    const handleCloseAddNew = () => setOpenAdd(false);
    const handleCloseConvert = () => {
        setOpenAdd(false);
        setSelectedTime(null);
    }
    const handleTimeSelection = (time) => {
        setSelectedTime(time);
        setOpenConversion(true);
    }

    const handleEdit = (time) => {

    }
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
                    onSuccess:()=>enqueueSnackbar('Time slot deleted successfully', { variant: 'success' })
                });
        } else {
            enqueueSnackbar("This reservation cannot be deleted because the consultation has already taken place.", { variant: 'error' });
        }
    }
    return (<Box sx={{position: 'relative'}}>
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
                    {/* handleTimeSelection */}
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
                <AddForm openAdd={openAdd}
                         onClose={handleCloseAddNew}/>
                {openConversion && selectedTime && <ConvertCustomerToPatientForm onClose={handleCloseConvert}
                                                                                 time={selectedTime}
                                                                                 open={openConversion}/>}
            </Box>);
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
