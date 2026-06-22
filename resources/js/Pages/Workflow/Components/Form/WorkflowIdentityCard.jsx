import {
    alpha,
    Box,
    Card,
    CardContent,
    Divider,
    Switch,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

/* ── Left: Workflow identity ─────────────────────────────────────────── */
export default function WorkflowIdentityCard({ data, setData, errors, isEdit, sections, totalParams }) {
    const theme = useTheme();

    return (
        <Card
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.06)}`,
            }}
        >
            {/* Card hero */}
            <Box
                sx={{
                    px: 3,
                    pt: 3,
                    pb: 2.5,
                    background: `linear-gradient(135deg,
                                ${alpha(theme.palette.primary.main, 0.08)} 0%,
                                ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                    borderBottom: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.12),
                }}
            >
                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2.5,
                        mb: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AccountTreeOutlinedIcon sx={{ fontSize: 26, color: 'primary.main' }} />
                </Box>
                <Typography
                    variant="overline"
                    fontWeight={700}
                    color="primary.main"
                    letterSpacing="0.12em"
                    display="block"
                    sx={{ mb: 0.25 }}
                >
                    {isEdit ? 'Editing' : 'New'} Workflow
                </Typography>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                    {data.name || 'Untitled'}
                </Typography>
            </Box>

            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Name field */}
                <TextField
                    fullWidth
                    label="Workflow Name"
                    placeholder="e.g. CBC Full Panel"
                    value={data.name}
                    name="name"
                    onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                    error={!!errors.name}
                    helperText={errors.name}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />

                {/* Status toggle */}
                <Box
                    onClick={() => setData((prev) => ({ ...prev, status: !prev.status }))}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: data.status
                            ? alpha(theme.palette.success.main, 0.4)
                            : alpha(theme.palette.divider, 1),
                        bgcolor: data.status
                            ? alpha(theme.palette.success.main, 0.05)
                            : 'transparent',
                        transition: 'all 0.25s ease',
                        userSelect: 'none',
                    }}
                >
                    <PowerSettingsNewIcon
                        sx={{
                            fontSize: 20,
                            color: data.status ? 'success.main' : 'text.disabled',
                            transition: 'color 0.25s',
                        }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color={data.status ? 'success.main' : 'text.secondary'}
                        >
                            {data.status ? 'Active' : 'Inactive'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            {data.status ? 'Workflow is enabled' : 'Workflow is disabled'}
                        </Typography>
                    </Box>
                    <Switch
                        checked={data.status}
                        size="small"
                        color="success"
                        name="status"
                        onChange={(e) => {
                            e.stopPropagation();
                            setData((prev) => ({ ...prev, status: e.target.checked }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Box>

                {/* Pipeline summary */}
                {sections.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    py: 1.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                }}
                            >
                                <Typography variant="h5" fontWeight={800} color="primary.main">
                                    {sections.length}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={500}
                                >
                                    Sections
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                    py: 1.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                                }}
                            >
                                <Typography variant="h5" fontWeight={800} color="secondary.main">
                                    {totalParams}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={500}
                                >
                                    Parameters
                                </Typography>
                            </Box>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
