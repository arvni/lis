import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForm from "@/Components/DeleteForm";
import React, {useCallback, useMemo, useState} from "react";
import {
    RemoveRedEye,
    ExpandMore,
    KeyboardArrowRight,
    Male as MaleIcon,
    Female as FemaleIcon, QuestionMark as QuestionMarkIcon
} from "@mui/icons-material";
import {router, useForm, usePage} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Paper,
    Stack,
    Typography,
    useTheme,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import countries from "@/Data/Countries.js";
import Grid from "@mui/material/Grid2";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

const renderDebt = ({row}) => {
    let amount = row.payments_sum_price * 1 - row.acceptance_items_sum_price * 1 + row.acceptance_items_sum_discount * 1;
    return amount < 0 ? (
        <Chip
            label={`${Intl.NumberFormat().format(Math.abs(amount).toFixed(2))}`}
            color="error"
            size="small"
        />
    ) : (
        <Typography>{Intl.NumberFormat().format(amount)}</Typography>
    );
};

const StatsCard = ({title, children, elevation = 8}) => (
    <Grid size={{xs: 12, sm: 6, md: 4}} p={1}>
        <Card elevation={elevation} sx={{borderRadius: 2, height: '100%'}}>
            <CardHeader
                title={title}
                slotProps={{titleTypography: {variant: 'h6'}}}
                sx={{backgroundColor: 'primary.light', color: 'primary.contrastText', py: 1}}
            />
            <CardContent>
                {children}
            </CardContent>
        </Card>
    </Grid>
);

const NationalityList = ({stats}) => {
    const [open, setOpen] = useState(false);
    const nationEntries = Object.entries(stats.patientsPerNation);
    const initialItems = nationEntries.slice(0, 5); // Show top 5 initially
    const remainingCount = nationEntries.length - initialItems.length;

    return (
        <>
            <List dense>
                {initialItems.map(([code, count], idx) => (
                    <React.Fragment key={code}>
                        <ListItem>
                            <ListItemAvatar>
                                <Box
                                    component="img"
                                    loading="lazy"
                                    width="32"
                                    src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                    alt={countries.find(c => c.code === code)?.label || code}
                                    sx={{border: '1px solid #eee', borderRadius: 1}}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={countries.find(c => c.code === code)?.label || code}
                                secondary={`${count} patients`}
                            />
                        </ListItem>
                        {idx < initialItems.length - 1 && <Divider variant="inset" component="li"/>}
                    </React.Fragment>
                ))}
            </List>

            {remainingCount > 0 && (
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<KeyboardArrowRight/>}
                    onClick={() => setOpen(true)}
                    sx={{mt: 1}}
                >
                    Show {remainingCount} more
                </Button>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Patients by Nationality
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpen(false)}
                        sx={{position: 'absolute', right: 8, top: 8}}
                    >
                        <DeleteIcon/>
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <List dense>
                        {nationEntries.map(([code, count], idx) => (
                            <React.Fragment key={code}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Box
                                            component="img"
                                            loading="lazy"
                                            width="32"
                                            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                            alt={countries.find(c => c.code === code)?.label || code}
                                            sx={{border: '1px solid #eee', borderRadius: 1}}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={countries.find(c => c.code === code)?.label || code}
                                        secondary={`${count} patients`}
                                    />
                                </ListItem>
                                {idx < nationEntries.length - 1 && <Divider variant="inset" component="li"/>}
                            </React.Fragment>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        </>
    );
};

const getGenderInfo = (gender) => {
    switch (gender) {
        case 'male':
            return {
                icon: <MaleIcon sx={{color: 'white'}}/>,
                label: 'Male',
                color: 'primary'
            };
        case 'female':
            return {
                icon: <FemaleIcon sx={{color: 'white'}}/>,
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

const GenderStats = ({stats}) => {
    const genderColors = {
        'male': 'primary.light',
        'female': 'secondary.light',
        'unknown': 'info.light'
    };

    return (
        <Stack spacing={1}>
            {Object.entries(stats.patientsPerGender).map(([gender, count]) => (
                <Paper
                    key={gender}
                    sx={{
                        p: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        backgroundColor: genderColors[gender] || 'grey.200'
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {getGenderInfo(gender).icon}
                        <Typography variant="body2"> {getGenderInfo(gender).label}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                </Paper>
            ))}
        </Stack>
    );
};

const Index = () => {
    const {post, setData, data, reset, processing} = useForm();
    const {patients, status, success, requestInputs, stats} = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(false);

    const showPatient = useCallback((id) => () => router.visit(route('patients.show', id)), []);
    const deletePatient = useCallback((params) => () => {
        setData({_method: "delete", ...params});
        setOpenDeleteForm(true);
    }, []);

    const pageReload = useCallback((page, filters, sort, pageSize) => router.visit(route('patients.index'), {
        data: {
            page, filters, sort, pageSize
        },
        only: ["patients", "status", "success", "requestInputs"]
    }), []);

    const handleCloseDeleteForm = useCallback(() => {
        reset();
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => post(route('patients.destroy', data.id), {
        onSuccess: handleCloseDeleteForm
    }), [data.id]);

    const addPatient = useCallback(() => router.visit(route('patients.create')), []);

    const toggleStats = useCallback(() => {
        setStatsExpanded(prev => !prev);
    }, []);

    const columns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            type: "number",
            flex: 0.05,
            display: "flex",
            hidden: true
        },
        {
            field: 'fullName',
            headerName: 'Name',
            type: "string",
            flex: 1,
            display: "flex"
        },
        {
            field: 'idNo',
            headerName: 'ID No./Passport No.',
            type: "string",
            flex: 0.4,
            display: "flex"
        },
        {
            field: 'phone',
            headerName: 'Phone',
            type: "string",
            flex: 0.4,
            display: "flex"
        },
        {
            field: 'nationality',
            headerName: 'Nationality',
            type: "string",
            flex: .4,
            display: "flex",
            valueGetter: (value) => countries.find((item) => item.code === value)?.label,
            renderCell: ({row, value}) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                        component="img"
                        loading="lazy"
                        width="24"
                        height="16"
                        src={`https://flagcdn.com/w40/${row.nationality.toLowerCase()}.png`}
                        alt={value}
                        sx={{border: '1px solid #eee'}}
                    />
                    <span>{value}</span>
                </Stack>
            )
        },
        {
            field: 'dateOfBirth',
            headerName: 'Date Of Birth (Age)',
            flex: .4,
            display: "flex",
            renderCell: ({row}) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <span>{row.dateOfBirth}</span>
                    <Chip label={row.age} size="small" variant="outlined"/>
                </Stack>
            )
        },
        {
            field: 'debt',
            headerName: 'Debt',
            sortable: false,
            flex: .3,
            display: "flex",
            renderCell: renderDebt
        },
        {
            field: 'created_at',
            headerName: 'Register Date',
            flex: .6,
            display: "flex",
            type: "datetime",
            valueGetter: (value) => value ? new Date(value) : null
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            flex: 0.1,
            display: "flex",
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem
                        icon={<RemoveRedEye/>}
                        label="Show"
                        onClick={showPatient(params.row.id)}
                        showInMenu
                    />,
                ];

                if (params.row.acceptances_count < 1 && params.row.consultations_count < 1 && params.row.relatives_count < 1) {
                    cols.push(
                        <GridActionsCellItem
                            icon={<DeleteIcon/>}
                            label="Delete"
                            showInMenu
                            onClick={deletePatient(params.row)}
                        />
                    );
                }

                return cols;
            }
        }
    ], [showPatient, deletePatient]);

    return (
        <>
            <PageHeader
                title="Patients"
                description="Manage patient records and view statistics"
                actions={[
                    <Button
                        onClick={addPatient}
                        key="add-button"
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon/>}
                    >
                        Add Patient
                    </Button>
                ]}
            />

            <Box mb={3}>
                <Accordion
                    expanded={statsExpanded}
                    onChange={toggleStats}
                    elevation={6}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden'
                }}
                >
                    <AccordionSummary expandIcon={<ExpandMore/>}>
                        <Typography variant="h6">Statistics Dashboard</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={0}>
                            <StatsCard title="Total Patients">
                                <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                                    <Typography variant="h3" color="primary.main">
                                        {stats.patients}
                                    </Typography>
                                </Box>
                            </StatsCard>

                            <StatsCard title="Patients by Nationality">
                                <NationalityList stats={stats}/>
                            </StatsCard>

                            <StatsCard title="Patients by Gender">
                                <GenderStats stats={stats}/>
                            </StatsCard>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={patients}
                reload={pageReload}
                Filter={Filter}
                loading={processing}
                success={success}
                status={status}
            >
                <DeleteForm
                    title={`Delete ${data?.fullName}`}
                    message={`Are you sure you want to delete this patient? This action cannot be undone.`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
            </TableLayout>
        </>
    );
};

const breadCrumbs = [
    {
        title: "Patients",
        link: null,
        icon: null
    }
];

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>;

export default Index;
