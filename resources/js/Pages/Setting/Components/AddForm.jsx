import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    TextField,
    Typography,
    CircularProgress,
    Box,
    Paper,
    Divider,
    Chip,
    IconButton,
    Tooltip
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import AvatarUpload from "@/Components/AvatarUpload";
import Editor from "@/Components/Editor";
import Upload from "@/Components/Upload";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CodeIcon from "@mui/icons-material/Code";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SelectSearch from "@/Components/SelectSearch.jsx";

const AddForm = ({value, onChange, submit, open, setOpen, title, loading, reset, id}) => {
    const handleChange = (e) => onChange(e.target.value);

    const handleClose = () => {
        setOpen(false);
        reset();
    };

    const handleImageChange = ({data}) => onChange(data);

    const handleFileChange = (_, v) => onChange(v);

    // Get appropriate icon for the input type
    const getInputTypeIcon = () => {
        switch (value?.type) {
            case "image":
                return <ImageIcon color="primary"/>;
            case "file":
                return <AttachFileIcon color="primary"/>;
            case "html":
                return <CodeIcon color="primary"/>;
            default:
                return <TextFieldsIcon color="primary"/>;
        }
    };

    // Get helper text for the input type
    const getHelperText = () => {
        switch (value?.type) {
            case "image":
                return "Upload or drag and drop an image";
            case "file":
                return "Upload or select a file";
            case "html":
                return "Edit HTML content";
            case "selectSearch":
                return "Select an option";
            default:
                return "Enter text value";
        }
    };

    const renderInput = () => {
        switch (value?.type) {
            case "image":
                return (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
                        <Chip
                            icon={<ImageIcon/>}
                            label="Image Upload"
                            color="primary"
                            variant="outlined"
                            sx={{mb: 2}}
                        />
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                backgroundColor: '#f8f9fa',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <AvatarUpload
                                value={value.value}
                                onChange={handleImageChange}
                                uploadUrl={route("documents.store")}
                                ownerClass="Setting"
                                ownerId={id}
                                tag="setting"
                                sx={{
                                    width: '200px',
                                    height: '200px',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }
                                }}
                            />
                        </Paper>
                    </Box>
                );

            case "file":
                return (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
                        <Chip
                            icon={<AttachFileIcon/>}
                            label="File Upload"
                            color="primary"
                            variant="outlined"
                            sx={{mb: 2}}
                        />
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                backgroundColor: '#f8f9fa',
                                width: '100%'
                            }}
                        >
                            <Upload
                                value={value.value}
                                name={"file"}
                                onChange={handleFileChange}
                                editable
                                required
                                url={route("documents.store", {ownerClass: "Setting", id})}
                                sx={{
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.01)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }
                                }}
                            />
                        </Paper>
                    </Box>
                );

            case "html":
                return (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Chip
                            icon={<CodeIcon/>}
                            label="HTML Editor"
                            color="primary"
                            variant="outlined"
                            sx={{alignSelf: 'center', mb: 2}}
                        />
                        <Editor
                            style={{
                                borderRadius: "0.5em",
                                border: "1px solid #ccc",
                                minWidth: "500px",
                                minHeight: "300px",
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                padding: '0.5em'
                            }}
                            onChange={handleChange}
                            value={value?.value}
                            name={"template"}
                        />
                    </Box>
                );

            case "selectSearch":
                return (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Chip
                            icon={<CodeIcon/>}
                            label="Select"
                            color="primary"
                            variant="outlined"
                            sx={{alignSelf: 'center', mb: 2}}
                        />
                        <SelectSearch value={value?.value}
                                      onChange={handleChange}
                                      fullWidth
                                      label="Select "
                                      url={value.url}/>
                    </Box>
                );

            default:
                return (
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <Chip
                            icon={<TextFieldsIcon/>}
                            label="Text Input"
                            color="primary"
                            variant="outlined"
                            sx={{alignSelf: 'center', mb: 2}}
                        />
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={value?.value || ''}
                            onChange={handleChange}
                            placeholder="Enter value..."
                            slotProps={{
                                Input: {
                                    sx: {
                                        borderRadius: 2,
                                        '&:hover': {
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                        }
                                    }
                                }
                            }}
                        />
                    </Box>
                );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : handleClose}
            maxWidth={value?.type === "html" ? "md" : "sm"}
            fullWidth
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        overflow: 'hidden'
                    }
                }
            }}
        >
            {/* Custom dialog title with close button */}
            <DialogTitle sx={{
                bgcolor: '#f5f5f5',
                borderBottom: '1px solid #eaeaea',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {getInputTypeIcon()}
                    <Typography variant="h6" component="span" sx={{fontWeight: 500}}>
                        {title}
                    </Typography>
                </Box>
                <Tooltip title="Close">
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        disabled={loading}
                        aria-label="close"
                        sx={{
                            ':hover': {
                                color: 'error.main',
                                backgroundColor: 'rgba(211, 47, 47, 0.04)'
                            }
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{p: 3, minHeight: '200px'}}>
                <Container maxWidth="md">
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12}}>
                            {/* Helper text */}
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2.5,
                                color: 'text.secondary',
                                gap: 0.5
                            }}>
                                <HelpOutlineIcon fontSize="small"/>
                                <Typography variant="body2">
                                    {getHelperText()}
                                </Typography>
                            </Box>

                            {/* Main input */}
                            {renderInput()}
                        </Grid>
                    </Grid>
                </Container>
            </DialogContent>

            <Divider/>

            <DialogActions sx={{p: 2, bgcolor: '#f8f8f8'}}>
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="outlined"
                    startIcon={<CloseIcon/>}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={submit}
                    disabled={loading}
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 3
                        }
                    }}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddForm;
