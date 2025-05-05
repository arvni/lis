import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "@/Pages/Setting/Components/Filter";
import AddForm from "@/Pages/Setting/Components/AddForm";
import {useForm} from "@inertiajs/react";
import {router, usePage} from "@inertiajs/react";
import {useMemo, useState} from "react";

// Material UI imports
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

// Material UI icons
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import SettingsIcon from "@mui/icons-material/Settings";

// Value renderer with improved styling
const renderValue = (value) => {
    switch (value?.type) {
        case "image":
            return (
                <Tooltip title="View full image">
                    <Avatar
                        src={value?.value}
                        sx={{
                            width: 40,
                            height: 40,
                            border: '1px solid #eee',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'scale(1.1)',
                            }
                        }}
                    />
                </Tooltip>
            );
        case "file":
            return (
                <Tooltip title="View file">
                    <IconButton
                        href={value?.value?.url}
                        target="_blank"
                        color="primary"
                        size="small"
                    >
                        <RemoveRedEyeIcon/>
                    </IconButton>
                </Tooltip>
            );
        case "html":
            return (
                <Box
                    sx={{
                        maxWidth: 180,
                        maxHeight: 100,
                        overflow: 'auto',
                        p: 1,
                        border: '1px solid #eee',
                        borderRadius: 1,
                        '&:hover': {
                            borderColor: '#ccc',
                        }
                    }}
                >
                    <div dangerouslySetInnerHTML={{__html: value?.value}}/>
                </Box>
            );
        default:
            return (
                <Chip
                    label={value?.value || "—"}
                    variant="outlined"
                    size="small"
                    sx={{
                        maxWidth: 180,
                        '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }
                    }}
                />
            );
    }
};

const Index = () => {
    const {post, setData, data, reset, processing} = useForm();
    const {settings, status, errors, success, requestInputs} = usePage().props;
    const [openAddForm, setOpenAddForm] = useState(false);

    // Define table columns with improved styling
    const columns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            type: "number",
            width: 70,
            hidden: true
        },
        {
            field: 'title',
            headerName: 'Title',
            type: "string",
            width: 200,
            renderCell: ({value}) => (
                <Tooltip title={value} placement="top">
          <span style={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
          }}>
            {value}
          </span>
                </Tooltip>
            )
        },
        {
            field: 'value',
            headerName: 'Value',
            type: "string",
            width: 220,
            renderCell: ({value}) => renderValue(value)
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    startIcon={<EditIcon fontSize="small"/>}
                    onClick={editSetting(params.row.id)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        }
                    }}
                >
                    Edit
                </Button>
            )
        }
    ], [settings]);

    const editSetting = (id) => () => {
        // Fixed the findIndex function
        const settingIndex = settings.data.findIndex(item => item.id === id);
        if (settingIndex !== -1) {
            setData({...settings.data[settingIndex], _method: 'put'});
            setOpenAddForm(true);
        }
    };

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('settings.index'), {
            data: {page, filters, sort, pageSize},
            only: ["settings", "status", "success", "requestInputs"]
        });
    };

    const handleSubmitForm = () => post(route('settings.update', data.id), {
        onSuccess: () => {
            setOpenAddForm(false);
            reset();
        },
    });

    const handleChangeValue = (value) => setData(previousData => ({
        ...previousData,
        value: {...previousData.value, value}
    }));


    return (
        <Box sx={{position: 'relative'}}>
            <PageHeader
                title="Settings"
                subtitle="Manage your application settings"
                icon={<SettingsIcon fontSize="large" sx={{mr: 2}}/>}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4
                }}
            >
                <TableLayout
                    defaultValues={requestInputs}
                    success={success}
                    status={status}
                    reload={pageReload}
                    columns={columns}
                    data={settings}
                    processing={processing}
                    Filter={Filter}
                    errors={errors}
                    sx={{
                        '& .MuiDataGrid-row': {
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                        }
                    }}
                />
            </Paper>

            {/* Floating action button to add new setting */}

            <AddForm
                title={`Edit ${data.title}`}
                loading={processing}
                open={openAddForm}
                value={data?.value}
                reset={reset}
                onChange={handleChangeValue}
                setOpen={setOpenAddForm}
                id={data?.id}
                submit={handleSubmitForm}
            />
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
        title: "Settings",
        link: null,
        icon: <SettingsIcon fontSize="small"/>
    }
];

Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Index;
