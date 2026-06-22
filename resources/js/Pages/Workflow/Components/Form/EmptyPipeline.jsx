import { alpha, Box, Button, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';

/* ── Empty pipeline placeholder ──────────────────────────────────────── */
export default function EmptyPipeline({ onAdd }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                py: 6,
                textAlign: 'center',
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TuneIcon sx={{ fontSize: 30, color: alpha(theme.palette.primary.main, 0.4) }} />
            </Box>
            <Typography
                variant="subtitle2"
                fontWeight={600}
                color="text.secondary"
                sx={{ mb: 0.5 }}
            >
                Pipeline is empty
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2.5 }}>
                Add sections to define how samples flow through the lab
            </Typography>
            <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={onAdd}
                sx={{ borderRadius: 2, textTransform: 'none' }}
            >
                Add first section
            </Button>
        </Box>
    );
}
