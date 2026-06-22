import { Avatar, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { avatarUrl, displayValue } from './helpers';

const PatientSummaryCard = ({ patient, keep, onKeep }) => (
    <Card
        variant="outlined"
        sx={{
            height: '100%',
            borderWidth: 2,
            borderColor: keep ? 'success.main' : 'error.light',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <Box
            sx={{
                px: 2,
                py: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#fff',
                backgroundColor: keep ? 'success.main' : 'error.main',
            }}
        >
            {keep ? <CheckCircleIcon fontSize="small" /> : <DeleteOutlineIcon fontSize="small" />}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                {keep ? 'KEEP — survives the merge' : 'DELETE — removed after merge'}
            </Typography>
        </Box>
        <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    src={avatarUrl(patient.fields.avatar, patient.fields.gender)}
                    sx={{ width: 64, height: 64, border: '1px solid', borderColor: 'divider' }}
                />
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                        {patient.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {displayValue('idNo', patient.fields.idNo)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {displayValue('phone', patient.fields.phone)}
                    </Typography>
                </Box>
            </Stack>
            {!keep && (
                <Button
                    size="small"
                    sx={{ mt: 1.5 }}
                    startIcon={<SwapHorizIcon />}
                    onClick={onKeep}
                >
                    Keep this one instead
                </Button>
            )}
        </CardContent>
    </Card>
);

export default PatientSummaryCard;
