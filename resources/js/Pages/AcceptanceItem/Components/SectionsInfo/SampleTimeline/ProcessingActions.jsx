import { Button, Stack, useTheme } from '@mui/material';
import { Done as DoneIcon, Close as CloseIcon } from '@mui/icons-material';

/** Complete/Reject buttons shown while a section is processing. */
const ProcessingActions = ({ onComplete, onReject }) => {
    const theme = useTheme();

    return (
        <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
            <Button
                variant="outlined"
                startIcon={<DoneIcon />}
                onClick={onComplete}
                color="success"
                sx={{
                    borderRadius: 6,
                    px: 2,
                    py: 1,
                    '&:hover': {
                        backgroundColor: theme.palette.success.light,
                        borderColor: theme.palette.success.dark,
                        boxShadow: theme.shadows[2],
                    },
                }}
            >
                Complete
            </Button>

            <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={onReject}
                color="error"
                sx={{
                    borderRadius: 6,
                    px: 2,
                    py: 1,
                    '&:hover': {
                        backgroundColor: theme.palette.error.light,
                        borderColor: theme.palette.error.dark,
                        boxShadow: theme.shadows[2],
                    },
                }}
            >
                Reject
            </Button>
        </Stack>
    );
};

export default ProcessingActions;
