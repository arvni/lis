import { Avatar, Box, Chip, DialogTitle, IconButton, Typography } from '@mui/material';
import { Close, OpenInNew, Science } from '@mui/icons-material';

export default function DialogHeader({ data, processing, onClose }) {
    return (
        <DialogTitle
            sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                px: 3,
            }}
        >
            <Box display="flex" gap={1.5} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <Science />
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={600} component="span">
                        Sample Collection
                    </Typography>
                    <Box display="flex" gap={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            Record collection details and print barcodes
                        </Typography>
                        {data.acceptanceId && (
                            <Chip
                                component="a"
                                href={route('acceptances.show', data.acceptanceId)}
                                target="_blank"
                                label={`#${data.acceptanceId}`}
                                size="small"
                                icon={<OpenInNew fontSize="small" />}
                                clickable
                                sx={{
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
            <IconButton color="inherit" onClick={onClose} disabled={processing} size="large">
                <Close />
            </IconButton>
        </DialogTitle>
    );
}
