import {useMemo, useState} from "react";
import {router, useForm, usePage} from "@inertiajs/react";
import dayjs from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip,
    Divider, FormControl, Grid, InputLabel, MenuItem, Select,
    TextField, Typography,
} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import SyncIcon from "@mui/icons-material/Sync";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as ChartTooltip, Legend, ResponsiveContainer,
} from "recharts";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Field = ({label, children}) => (
    <Box sx={{py: 0.75}}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{children ?? "—"}</Typography>
    </Box>
);

const formatTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : "—";

const tickTime = (ts) =>
    new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

const SensorChart = ({samples, hasHumidity}) => {
    const theme = useTheme();

    const chartData = useMemo(() =>
        [...samples].reverse().map((s) => ({
            time:     s.time,
            temp:     s.data?.tm != null ? parseFloat((s.data.tm / 100).toFixed(2)) : null,
            humidity: s.data?.hu != null ? parseFloat((s.data.hu / 100).toFixed(2)) : null,
        })),
        [samples],
    );

    if (chartData.length === 0) {
        return (
            <Box sx={{py: 4, textAlign: "center"}}>
                <Typography color="text.secondary">No data to chart.</Typography>
            </Box>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{top: 8, right: hasHumidity ? 40 : 16, left: 0, bottom: 4}}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider}/>
                <XAxis
                    dataKey="time"
                    tickFormatter={tickTime}
                    tick={{fontSize: 11, fill: theme.palette.text.secondary}}
                    tickLine={false}
                    axisLine={{stroke: theme.palette.divider}}
                />
                <YAxis
                    yAxisId="temp"
                    tickFormatter={(v) => `${v}°`}
                    tick={{fontSize: 11, fill: theme.palette.text.secondary}}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                />
                {hasHumidity && (
                    <YAxis
                        yAxisId="humidity"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{fontSize: 11, fill: theme.palette.text.secondary}}
                        tickLine={false}
                        axisLine={false}
                        width={38}
                    />
                )}
                <ChartTooltip
                    contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        fontSize: 12,
                    }}
                    labelFormatter={(ts) => formatTime(ts)}
                    formatter={(value, key) =>
                        key === "temp"
                            ? [`${value} °C`, "Temperature"]
                            : [`${value} %`, "Humidity"]
                    }
                />
                <Legend
                    formatter={(key) => key === "temp" ? "Temperature" : "Humidity"}
                    wrapperStyle={{fontSize: 12}}
                />
                <Line
                    yAxisId="temp"
                    dataKey="temp"
                    type="monotone"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                />
                {hasHumidity && (
                    <Line
                        yAxisId="humidity"
                        dataKey="humidity"
                        type="monotone"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                    />
                )}
            </ComposedChart>
        </ResponsiveContainer>
    );
};

const SamplesFilter = ({nodeId, limit, beginTime, endTime}) => {
    const [begin, setBegin] = useState(beginTime ? dayjs.unix(beginTime) : null);
    const [end,   setEnd]   = useState(endTime   ? dayjs.unix(endTime)   : null);

    const apply = () => {
        const params = {offset: 0};
        if (begin) params.beginTime = begin.unix();
        if (end)   params.endTime   = end.unix();
        params.limit = (begin || end) ? 5000 : 50;
        router.visit(route("monitoring.nodes.show", nodeId), {data: params});
    };

    const reset = () => {
        setBegin(null);
        setEnd(null);
        router.visit(route("monitoring.nodes.show", nodeId), {data: {limit: 50, offset: 0}});
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{
                display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap",
                p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2,
            }}>
                <DateTimePicker
                    label="From"
                    value={begin}
                    onChange={setBegin}
                    maxDateTime={end ?? undefined}
                    slotProps={{textField: {size: "small", sx: {minWidth: 200}}}}
                />
                <DateTimePicker
                    label="To"
                    value={end}
                    onChange={setEnd}
                    minDateTime={begin ?? undefined}
                    slotProps={{textField: {size: "small", sx: {minWidth: 200}}}}
                />
                <Button variant="contained" size="small" onClick={apply}>Apply</Button>
                {(begin || end) && (
                    <Button variant="outlined" size="small" onClick={reset}>Reset</Button>
                )}
            </Box>
        </LocalizationProvider>
    );
};

const SectionForm = ({nodeId, sections, sectionId, notes}) => {
    const {data, setData, put, processing, errors} = useForm({
        section_id: sectionId ?? "",
        notes:      notes    ?? "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("monitoring.nodes.updateSection", nodeId));
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth size="small" sx={{mb: 2}}>
                <InputLabel>Section</InputLabel>
                <Select
                    label="Section"
                    value={data.section_id}
                    onChange={(e) => setData("section_id", e.target.value)}
                    error={!!errors.section_id}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {sections.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth size="small" label="Notes" multiline rows={2}
                value={data.notes} onChange={(e) => setData("notes", e.target.value)}
                error={!!errors.notes} helperText={errors.notes}
                sx={{mb: 2}}
            />
            <Button type="submit" size="small" variant="contained" disabled={processing}>
                Save
            </Button>
        </Box>
    );
};

const Show = () => {
    const {node, samples = [], sections = [], limit, offset, beginTime, endTime, success, status} = usePage().props;

    const hasHumidity = node.info?.humidity !== undefined
        || samples.some((s) => s.data?.hu != null);

    const exportUrl = () => {
        const params = new URLSearchParams({
            limit:  beginTime || endTime ? 5000 : limit,
            offset: 0,
        });
        if (beginTime) params.set("beginTime", beginTime);
        if (endTime)   params.set("endTime",   endTime);
        return route("monitoring.nodes.samples.export", node.nodeId) + "?" + params.toString();
    };

    return (
        <>
            <PageHeader
                title={node.name || node.nodeId}
                actions={
                    <Box sx={{display: "flex", gap: 1}}>
                        <Button
                            startIcon={<SyncIcon/>}
                            variant="contained"
                            size="small"
                            onClick={() => router.post(route("monitoring.nodes.fetch", node.nodeId))}
                        >
                            Fetch Now
                        </Button>
                        <Button startIcon={<ArrowBackIcon/>} variant="outlined" size="small"
                            onClick={() => router.visit(route("monitoring.nodes.index"))}>
                            All Nodes
                        </Button>
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2}}>{status}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Left: node info + section assignment */}
                <Grid item xs={12} md={4}>
                    <Card elevation={0} variant="outlined" sx={{mb: 2}}>
                        <CardHeader
                            title="Node Info"
                            action={
                                <Box sx={{pt: 1, pr: 1}}>
                                    <Chip
                                        icon={node.onlined ? <WifiIcon fontSize="small"/> : <WifiOffIcon fontSize="small"/>}
                                        label={node.onlined ? "Online" : "Offline"}
                                        color={node.onlined ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={0}>
                                <Grid item xs={6}><Field label="Node ID">{node.nodeId}</Field></Grid>
                                <Grid item xs={6}><Field label="Type">{node.type}</Field></Grid>
                                <Grid item xs={6}><Field label="Model">{node.model}</Field></Grid>
                                <Grid item xs={6}><Field label="Thing Name">{node.thingName}</Field></Grid>
                            </Grid>
                            <Divider sx={{my: 1}}/>
                            <Box sx={{display: "flex", gap: 3}}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Signal</Typography>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                        <SignalCellularAltIcon fontSize="small" color="info"/>
                                        <Typography variant="body2" fontWeight={500}>{node.signalLevel ?? "—"}</Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Battery</Typography>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                        <BatteryChargingFullIcon fontSize="small"
                                            color={(node.batteryLevel ?? 100) < 20 ? "error" : "success"}/>
                                        <Typography variant="body2" fontWeight={500}>{node.batteryLevel ?? "—"}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            {node.section_name && (
                                <>
                                    <Divider sx={{my: 1}}/>
                                    <Field label="Section">
                                        <Chip label={node.section_name} size="small" variant="outlined"/>
                                    </Field>
                                </>
                            )}
                            {node.notes && (
                                <>
                                    <Divider sx={{my: 1}}/>
                                    <Field label="Notes">{node.notes}</Field>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card elevation={0} variant="outlined">
                        <CardHeader title="Section Assignment" subheader="Link this node to a lab section"/>
                        <CardContent>
                            <SectionForm
                                nodeId={node.nodeId}
                                sections={sections}
                                sectionId={node.section_id}
                                notes={node.notes}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: filter + chart + download */}
                <Grid item xs={12} md={8}>
                    <SamplesFilter
                        nodeId={node.nodeId}
                        limit={limit}
                        beginTime={beginTime}
                        endTime={endTime}
                    />
                    <Card elevation={0} variant="outlined">
                        <CardHeader
                            title="Readings"
                            subheader={
                                <Box sx={{display: "flex", gap: 1, mt: 0.5}}>
                                    <Chip icon={<ThermostatIcon fontSize="small"/>}
                                        label="Temperature" size="small" color="error" variant="outlined"/>
                                    {hasHumidity && (
                                        <Chip icon={<WaterDropIcon fontSize="small"/>}
                                            label="Humidity" size="small" color="primary" variant="outlined"/>
                                    )}
                                </Box>
                            }
                            action={
                                <Box sx={{pt: 1, pr: 1}}>
                                    <Button
                                        component="a"
                                        href={exportUrl()}
                                        startIcon={<DownloadIcon/>}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Download Excel
                                    </Button>
                                </Box>
                            }
                        />
                        <CardContent>
                            <SensorChart samples={samples} hasHumidity={hasHumidity}/>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

const breadcrumbs = (node) => [
    {title: "Monitoring", link: null},
    {title: "Sensor Nodes", link: route("monitoring.nodes.index")},
    {title: node?.name || node?.nodeId || "Node", link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.node)}>{page}</AuthenticatedLayout>
);

export default Show;
