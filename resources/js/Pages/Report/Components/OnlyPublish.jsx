import React, {useState, useEffect} from "react";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import {
    Dialog,
    DialogActions,
    DialogContent,
    Stack,
    Typography,
    Box,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Fade,
    Checkbox,
    Chip,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse
} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
    Share,
    Close,
    Email,
    WhatsApp,
    Person,
    Visibility,
    VisibilityOff,
    CheckCircle,
    Info,
    Send,
    ExpandMore,
    ExpandLess
} from "@mui/icons-material";
import {useForm} from "@inertiajs/react";

/**
 * PublishForm Component - A dialog for publishing acceptance reports
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onCancel - Function to handle dialog close/cancel
 * @param {Object} props.acceptance - Acceptance data
 */
const PublishForm = ({open, onCancel, acceptance}) => {
    const [showRecipients, setShowRecipients] = useState(true);
    const [publishSuccess, setPublishSuccess] = useState(false);

    const {data, setData, post, errors, processing, wasSuccessful} = useForm({
        _method: "put",
        silently_publish: false
    });

    // Handle form submission
    const handleSubmit = () => {
        post(route("acceptances.publish", acceptance.id), {
            onSuccess: () => {
                setPublishSuccess(true);
                setTimeout(() => {
                    onCancel();
                    setPublishSuccess(false);
                }, 2000);
            }
        });
    };

    const handleChange = (e) => setData(prevState => ({
        ...prevState,
        silently_publish: e.target.checked
    }));

    // Get recipients from acceptance data
    const getRecipients = () => {
        let recipients = [];
        const howReport = acceptance?.howReport;

        if (howReport?.whatsapp && howReport?.whatsappNumber) {
            recipients.push({
                type: 'whatsapp',
                label: 'WhatsApp',
                value: howReport.whatsappNumber,
                icon: <WhatsApp />
            });
        }

        if (howReport?.email && howReport?.emailAddress) {
            recipients.push({
                type: 'email',
                label: 'Email',
                value: howReport.emailAddress,
                icon: <Email />
            });
        }

        if (howReport?.sendToReferrer && acceptance?.referrer?.email) {
            recipients.push({
                type: 'referrer',
                label: 'Referrer Email',
                value: acceptance.referrer.email,
                icon: <Person />
            });
            if(acceptance.referrer.reportReceivers && acceptance.referrer.reportReceivers.length){
                let reportReceivers = acceptance.referrer.reportReceivers.map(email => ({
                    type: 'referrer',
                    label: 'Referrer Email',
                    value: email,
                    icon: <Person />
                }))
                recipients = [...recipients, ...reportReceivers]
            }
        }

        return recipients;
    };

    const recipients = getRecipients();
    const hasRecipients = recipients.length > 0;

    // Get acceptance items info
    const acceptanceItems = acceptance?.acceptance_items || [];
    const totalTests = acceptanceItems.length;
    const testsToPublish = acceptanceItems.filter(item => !item.report?.published_at).length;

    // Reset success state when dialog closes
    useEffect(() => {
        if (!open) {
            setPublishSuccess(false);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={!processing ? onCancel : undefined}
            fullWidth
            maxWidth="sm"
            slots={{Transition: Fade}}
            transitionDuration={300}
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText'
            }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Share />
                    <Box>
                        <Typography variant="h6" fontWeight="600">
                            Publish Acceptance #{acceptance?.id}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Publishing {testsToPublish} of {totalTests} report{totalTests !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Stack>

                <Tooltip title="Close">
                    <span>
                        <IconButton
                            edge="end"
                            sx={{ color: 'primary.contrastText' }}
                            onClick={onCancel}
                            disabled={processing}
                            aria-label="close"
                            size="small"
                        >
                            <Close />
                        </IconButton>
                    </span>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Success Message */}
                {publishSuccess && (
                    <Alert
                        severity="success"
                        icon={<CheckCircle />}
                        sx={{ m: 3, mb: 0, borderRadius: 2 }}
                    >
                        All reports for acceptance #{acceptance?.id} published successfully!
                    </Alert>
                )}

                {/* Tests Info */}
                {testsToPublish > 0 && (
                    <Alert
                        severity="info"
                        sx={{ m: 3, mb: 0, borderRadius: 2 }}
                    >
                        <Typography variant="body2" fontWeight="500" gutterBottom>
                            Tests to be published:
                        </Typography>
                        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                            {acceptanceItems.filter(item => !item.report?.published_at).map((item, index) => (
                                <li key={index}>
                                    <Typography variant="body2">
                                        {item.test?.name || 'Unknown Test'}
                                    </Typography>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {/* Recipients Section */}
                <Box sx={{ p: 3, pb: 0 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                            cursor: 'pointer'
                        }}
                        onClick={() => setShowRecipients(!showRecipients)}
                    >
                        <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                            Recipients ({recipients.length})
                        </Typography>
                        <IconButton size="small">
                            {showRecipients ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>

                    <Collapse in={showRecipients}>
                        {hasRecipients ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    mb: 3
                                }}
                            >
                                <List sx={{ py: 0 }}>
                                    {recipients.map((recipient, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{
                                                borderBottom: index < recipients.length - 1 ? 1 : 0,
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                                                {recipient.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" fontWeight="500">
                                                            {recipient.label}
                                                        </Typography>
                                                        <Chip
                                                            label={recipient.type}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={recipient.value}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        ) : (
                            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                                No recipients configured for this report.
                            </Alert>
                        )}
                    </Collapse>
                </Box>

                {/* Publishing Options */}
                <Box sx={{ px: 3, pb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                        Publishing Options
                    </Typography>

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: data.silently_publish ? 'action.hover' : 'background.paper'
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={data.silently_publish}
                                    onChange={handleChange}
                                    icon={<Visibility />}
                                    checkedIcon={<VisibilityOff />}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight="500">
                                        Publish Silently
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Recipients won't receive notifications for these {testsToPublish} report{testsToPublish !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', m: 0 }}
                        />
                    </Paper>

                    {/* Error Display */}
                    {errors && Object.keys(errors).length > 0 && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            {Object.values(errors).join(', ')}
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{
                p: 3,
                justifyContent: 'space-between',
                bgcolor: 'background.default'
            }}>
                <Button
                    onClick={onCancel}
                    color="inherit"
                    disabled={processing}
                    size="large"
                >
                    Cancel
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={processing}
                    size="large"
                    startIcon={
                        processing ?
                            <CircularProgress size={20} color="inherit" /> :
                            <Send />
                    }
                    sx={{
                        minWidth: 140,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {processing ? 'Publishing...' : 'Publish Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PublishForm;
