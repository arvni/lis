import { Box, Chip, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export const InfoRow = ({ label, children, chipContent }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
            {label}
        </Typography>
        {chipContent ? (
            <Box>{chipContent}</Box>
        ) : (
            <Typography variant="body2" fontWeight={500} align="right">
                {children || '—'}
            </Typography>
        )}
    </Box>
);

export const FileChip = ({ document, onClick }) =>
    document ? (
        <Chip
            icon={<AttachFileIcon />}
            label={document.originalName}
            size="small"
            variant="outlined"
            color="primary"
            onClick={onClick}
            sx={{ cursor: 'pointer', maxWidth: 220, fontFamily: 'monospace', fontSize: '0.7rem' }}
        />
    ) : null;
