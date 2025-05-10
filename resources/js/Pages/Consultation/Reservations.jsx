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


const Reservations = ({times}) => {
    const [openAdd, setOpenAdd] = useState(false)
    const pageReload = (startDate, endDate) => {
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


    return (
        <Box sx={{position: 'relative'}}>
            <PageHeader
                title="Reservation"
                subtitle="Manage reservations"
                icon={<MedicalServicesOutlined fontSize="large" sx={{mr: 2}}/>}
                actions={<Button onClick={handleAddNew}>Add Reservation</Button>}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4
                }}
            >
                <TimeCalendar times={times} onChange={pageReload}/>
            </Paper>
            <AddForm openAdd={openAdd} onClose={handleCloseAddNew}/>
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
