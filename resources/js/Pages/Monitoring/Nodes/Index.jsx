import {useMemo, useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, Chip, Grid, IconButton, InputAdornment,
    Paper, TextField, Tooltip, Typography, alpha, useTheme,
} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import {GridActionsCellItem} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import SearchIcon from "@mui/icons-material/Search";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const OnlineChip = ({value}) => (
    <Chip
        label={value ? "Online" : "Offline"}
        color={value ? "success" : "default"}
        size="small"
        variant={value ? "filled" : "outlined"}
    />
);

const LevelBar = ({value, max = 100, color = "primary"}) => {
    const pct = Math.round((value ?? 0) / max * 100);
    return (
        <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
            <Box sx={{
                width: 48, height: 6, borderRadius: 3,
                bgcolor: "action.hover", overflow: "hidden",
            }}>
                <Box sx={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    bgcolor: `${color}.main`, transition: "width 0.3s",
                }}/>
            </Box>
            <Typography variant="caption" color="text.secondary">{value ?? "—"}</Typography>
        </Box>
    );
};

const NodesIndex = () => {
    const {nodes, success, status} = usePage().props;
    const theme = useTheme();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return nodes;
        const q = search.toLowerCase();
        return nodes.filter((n) =>
            n.name?.toLowerCase().includes(q) ||
            n.nodeId?.toLowerCase().includes(q) ||
            n.model?.toLowerCase().includes(q) ||
            n.section_name?.toLowerCase().includes(q)
        );
    }, [nodes, search]);

    const columns = useMemo(() => [
        {
            field: "name",
            headerName: "Node Name",
            flex: 1.5,
            display:"flex",
            minWidth: 160,
            renderCell: ({row}) => (
                    <Typography variant="body2" fontWeight={500}>{row.name || row.nodeId}</Typography>
            ),
        },
        {field: "model", headerName: "Model", width: 100},
        {
            field: "info",
            headerName: "Sensors",
            width: 130,
            display:"flex",
            sortable: false,
            renderCell: ({row}) => (
                <Box sx={{display: "flex", gap: 0.5}}>
                    {row.info?.temperature !== undefined && (
                        <Chip label="Temp" size="small" color="error" variant="outlined"/>
                    )}
                    {row.info?.humidity !== undefined && (
                        <Chip label="Humid" size="small" color="primary" variant="outlined"/>
                    )}
                </Box>
            ),
        },
        {
            field: "onlined",
            headerName: "Status",
            width: 100,
            display:"flex",
            renderCell: ({value}) => <OnlineChip value={value}/>,
        },
        {
            field: "signalLevel",
            headerName: "Signal",
            width: 120,
            display:"flex",
            renderCell: ({value}) => <LevelBar value={value} color="info"/>,
        },
        {
            field: "batteryLevel",
            headerName: "Battery",
            width: 120,
            display:"flex",
            renderCell: ({value}) => <LevelBar value={value} color={value < 20 ? "error" : "success"}/>,
        },
        {
            field: "section_name",
            headerName: "Section",
            flex: 1,
            display:"flex",
            minWidth: 120,
            renderCell: ({value}) => value
                ? <Chip label={value} size="small" variant="outlined"/>
                : <Typography variant="caption" color="text.disabled">—</Typography>,
        },
        {
            field: "id",
            headerName: "Actions",
            type: "actions",
            width: 80,
            getActions: ({row}) => [
                <GridActionsCellItem
                    key="view"
                    icon={<VisibilityIcon/>}
                    label="View Samples"
                    onClick={() => router.visit(route("monitoring.nodes.show", row.nodeId))}
                />,
            ],
        },
    ], []);

    const online  = nodes.filter((n) => n.onlined).length;
    const offline = nodes.length - online;

    return (
        <>
            <PageHeader
                title="Sensor Nodes"
                actions={
                    <Button
                        startIcon={<SyncIcon/>}
                        variant="contained"
                        color="primary"
                        onClick={() => router.post(route("monitoring.nodes.fetchAll"), {}, {
                            onSuccess: () => router.reload(),
                        })}
                    >
                        Fetch All Now
                    </Button>
                }
            />

            <Grid container spacing={2} sx={{mb: 3}}>
                {[
                    {label: "Total Nodes",    value: nodes.length,  color: "primary"},
                    {label: "Online",         value: online,        color: "success"},
                    {label: "Offline",        value: offline,       color: "default"},
                ].map(({label, value, color}) => (
                    <Grid item xs={6} sm={4} md={2} key={label}>
                        <Card elevation={0} variant="outlined" sx={{textAlign: "center", p: 1}}>
                            <CardContent sx={{p: "8px !important"}}>
                                <Typography variant="h5" fontWeight={700} color={`${color}.main`}>{value}</Typography>
                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper elevation={0} variant="outlined" sx={{borderRadius: 2, overflow: "hidden"}}>
                <Box sx={{
                    p: 2,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: "1px solid", borderColor: "divider",
                    bgcolor: theme.palette.grey[50],
                }}>
                    <TextField
                        size="small"
                        placeholder="Search by name, ID, model or section…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{width: 320}}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action"/>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Tooltip title="Refresh nodes">
                        <IconButton size="small" onClick={() => router.reload()}>
                            <RefreshIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Box>

                <DataGrid
                    rows={filtered}
                    columns={columns}
                    getRowId={(row) => row.nodeId}
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{pagination: {paginationModel: {pageSize: 25}}}}
                    disableColumnFilter
                    autoHeight
                    getRowClassName={(p) => p.indexRelativeToCurrentPage % 2 === 0 ? "even-row" : "odd-row"}
                    sx={{
                        border: "none",
                        ".MuiDataGrid-columnHeader": {
                            bgcolor: theme.palette.grey[50],
                            fontWeight: 600, fontSize: "0.75rem",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                        },
                        ".MuiDataGrid-cell": {
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        },
                        ".even-row": {bgcolor: alpha(theme.palette.background.default, 0.4)},
                        ".MuiDataGrid-row:hover": {bgcolor: alpha(theme.palette.primary.main, 0.04)},
                        ".MuiDataGrid-footerContainer": {
                            borderTop: `1px solid ${theme.palette.divider}`,
                            bgcolor: theme.palette.grey[50],
                        },
                    }}
                />
            </Paper>
        </>
    );
};

const breadcrumbs = [{title: "Monitoring", link: null}, {title: "Sensor Nodes", link: null}];

NodesIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default NodesIndex;
