import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Grid2 as Grid,
    Box,
    Typography,
    IconButton,
    Paper,
    InputAdornment,
    Tooltip,
    useTheme
} from "@mui/material";
import {
    Close as CloseIcon,
    QrCode as QrCodeIcon,
    InputOutlined as InputIcon,
    Send as SendIcon
} from "@mui/icons-material";

const EnteringForm = ({ open, barcode, onChange, submit, onClose }) => {
    const theme = useTheme();

    const checkAndSubmit = () => {
        if (barcode) {
            submit();
        }
    };

    const checkPressedEnter = e => {
        if (e.key === "Enter") {
            checkAndSubmit();
        }
    };

    const isSubmitDisabled = !barcode || barcode.trim() === '';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InputIcon />
                    <Typography variant="h6">Enter Sample to Section</Typography>
                </Box>
                <Tooltip title="Close">
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                        sx={{
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{ p: 3, mt: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        bgcolor: theme.palette.background.default,
                        textAlign: 'center',
                        borderRadius: 2
                    }}
                >
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        Please scan or enter the sample barcode below:
                    </Typography>

                    <Grid
                        container
                        justifyContent="center"
                        alignItems="center"
                        sx={{ minHeight: "150px", mt: 2 }}
                    >
                        <Grid item xs={12} sm={10} md={8}>
                            <TextField
                                value={barcode}
                                onChange={onChange}
                                autoFocus
                                onKeyDown={checkPressedEnter}
                                fullWidth
                                label="Sample Barcode"
                                variant="outlined"
                                placeholder="Scan or type barcode here"
                                slotProps={{
                                    Input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <QrCodeIcon color="primary"/>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 1.5,
                                            fontSize: '1.1rem',
                                            '&.Mui-focused': {
                                                boxShadow: `0 0 0 2px ${theme.palette.primary.light}`
                                            }
                                        }
                                    },
                                    InputLabel:{
                                        shrink: true,
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&:hover fieldset': {
                                            borderColor: theme.palette.primary.main,
                                        },
                                    },
                                }}
                            />

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1, textAlign: 'left' }}
                            >
                                Press Enter or click the Enter button to submit
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    bgcolor: theme.palette.background.default,
                    justifyContent: 'space-between'
                }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    sx={{ borderRadius: 1.5 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={isSubmitDisabled}
                    onClick={checkAndSubmit}
                    startIcon={<SendIcon />}
                    sx={{
                        borderRadius: 1.5,
                        px: 3,
                        '&:hover': {
                            boxShadow: theme.shadows[4]
                        }
                    }}
                >
                    Enter Sample
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EnteringForm;
