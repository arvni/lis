import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
    DialogActions,
    DialogContent,
    Typography,
    IconButton,
    Box,
    Divider,
    CircularProgress,
    Paper,
    Tooltip,
    AppBar,
    Toolbar
} from "@mui/material";
import Button from "@mui/material/Button";
import Editor from "@/Components/Editor";
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import BrushIcon from '@mui/icons-material/Brush';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ImagePaintCanvas from "@/Pages/Consultation/Components/Drawing/PaintApp.jsx";

/**
 * Enhanced form component with drawing and rich text editor
 *
 * @param {Object} props Component properties
 * @param {Object} props.data Form data (can be undefined or null)
 * @param {Function} props.submit Submit handler
 * @param {boolean} props.open Dialog open state
 * @param {string} props.title Dialog title
 * @param {boolean} props.loading Loading state
 * @param {Function} props.onChange Change handler
 * @param {Function} props.onClose Close handler
 * @returns {JSX.Element} Enhanced DoneForm component
 */
const DoneForm = ({
                      data = {},
                      submit,
                      open,
                      title = "Create Consultation Report",
                      loading,
                      onChange,
                      onClose
                  }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleImageChanged = (imageData) => {
        if (typeof onChange === 'function') {
            onChange({
                target: {
                    name: "image",
                    value: imageData || ""
                }
            });
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSubmit =  () => {
        submit();
    };

    return (
        <Dialog
            open={open && !loading}
            onClose={onClose}
            fullScreen
            slotProps={{
                sx: {
                    bgcolor: 'background.default',
                    backgroundImage: 'none'
                }
            }}
        >
            {/* Custom AppBar for better mobile UX */}
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {title}
                    </Typography>
                    <Tooltip title="Close">
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={onClose}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* Tab navigation for better UX */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    aria-label="Form sections"
                >
                    <Tab icon={<BrushIcon />} label="Drawing" id="tab-0" aria-controls="tabpanel-0" />
                    <Tab icon={<TextFieldsIcon />} label="Report" id="tab-1" aria-controls="tabpanel-1" />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 2, height: "calc(100vh - 200px)" }}>
                <Paper
                    elevation={0}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Drawing Section */}
                    <Box
                        role="tabpanel"
                        hidden={activeTab !== 0}
                        id="tabpanel-0"
                        aria-labelledby="tab-0"
                        sx={{
                            height: '100%',
                            display: activeTab === 0 ? 'flex' : 'none',
                            flexDirection: 'column',
                            overflow: 'auto'
                        }}
                    >
                            <ImagePaintCanvas
                                onChange={handleImageChanged}
                                defaultValue={data.image}
                            />
                    </Box>

                    {/* Report Section */}
                    <Box
                        role="tabpanel"
                        hidden={activeTab !== 1}
                        id="tabpanel-1"
                        aria-labelledby="tab-1"
                        sx={{
                            height: '100%',
                            display: activeTab === 1 ? 'flex' : 'none',
                            flexDirection: 'column',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Write your report below
                        </Typography>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Editor
                                name="report"
                                value={data?.report || ""}
                                onChange={onChange}
                                label=""
                                height="calc(100vh - 260px)"
                            />
                        </Box>
                    </Box>
                </Paper>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DoneForm;
