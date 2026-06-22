import { alpha, Box, Button, Chip, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';

/* ── Section pipeline header ─────────────────────────────────────────── */
export default function PipelineHeader({ count, openSection, onAdd }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.default, 0.6),
            }}
        >
            <HubOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Section Pipeline
                    </Typography>
                    {count > 0 && (
                        <Chip
                            label={count}
                            size="small"
                            color="primary"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Sections execute top-to-bottom · drag to reorder
                </Typography>
            </Box>
            {!openSection && (
                <Button
                    startIcon={<AddIcon />}
                    size="small"
                    variant="contained"
                    disableElevation
                    onClick={onAdd}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        flexShrink: 0,
                    }}
                >
                    Add Section
                </Button>
            )}
        </Box>
    );
}
