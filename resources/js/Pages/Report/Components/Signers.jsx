import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Zoom,
    useTheme
} from "@mui/material";
import {
    Add,
    ArrowDownward,
    ArrowUpward,
    Close,
    EditOutlined,
    PersonAddAlt1Outlined
} from "@mui/icons-material";
import SignerAddForm from "./SignerAddForm";
import { useState } from "react";

/**
 * Compare function for sorting signers by row number
 * @param {Object} a - First signer
 * @param {Object} b - Second signer
 * @returns {number} Comparison result
 */
function rowCompare(a, b) {
    if (a.row > b.row) return 1;
    if (a.row < b.row) return -1;
    return 0;
}

/**
 * Signers Component - An enhanced component for managing document signers
 *
 * @param {Object} props - Component props
 * @param {Array} props.signers - Array of signer objects
 * @param {Function} props.onChange - Function to handle changes to signers
 * @param {boolean} props.editable - Whether signers can be edited
 * @param {boolean} props.error - Whether there is an error
 * @param {string} props.errorMessage - Error message to display
 */
const Signers = ({ signers, onChange, editable = true, error, errorMessage }) => {
    const theme = useTheme();
    const [signer, setSigner] = useState({ id: Math.floor(Math.random() * 35789542) });
    const [open, setOpen] = useState(false);
    const [expandedAccordion, setExpandedAccordion] = useState(true);
    const [hover, setHover] = useState(null);

    // Initialize an empty array if signers is undefined
    const signersList = signers || [];

    // Handle accordion expansion
    const handleAccordionChange = (event, isExpanded) => {
        setExpandedAccordion(isExpanded);
    };

    // Open add form dialog
    const openAddForm = () => setOpen(true);

    // Add a new signer
    const handleAdd = () => {
        if (findIndexByUserId(signer.user.id) === -1) {
            onChange(prevState => ({
                ...prevState,
                signers: [...prevState.signers, { ...signer, row: signersList.length + 1 }]
            }));
        }
        handleClose();
    };

    // Close add form dialog and reset signer state
    const handleClose = () => {
        setSigner({
            id: Math.floor(Math.random() * 35789542)
        });
        setOpen(false);
    };

    // Move a signer up in the order
    const handleUp = (id) => () => {
        let index = findIndexById(id);
        if (index <= 0) return; // Safety check

        let selectedSigner = { ...signersList[index] };
        let newSigners = [...signersList];
        newSigners[index - 1] = { ...selectedSigner, row: selectedSigner.row - 1 };
        newSigners[index] = { ...signersList[index - 1], row: selectedSigner.row };
        changeSigners(newSigners);
    };

    // Move a signer down in the order
    const handleDown = (id) => () => {
        let index = findIndexById(id);
        if (index >= signersList.length - 1) return; // Safety check

        let selectedSigner = { ...signersList[index] };
        let newSigners = [...signersList];
        newSigners[index + 1] = { ...selectedSigner, row: selectedSigner.row + 1 };
        newSigners[index] = { ...signersList[index + 1], row: selectedSigner.row };
        changeSigners(newSigners);
    };

    // Delete a signer
    const handleDelete = (id) => () => {
        let index = findIndexById(id);
        if (index === -1) return; // Safety check

        let newSigners = [...signersList];
        newSigners.splice(index, 1);

        // Reorder remaining signers
        newSigners = newSigners.map((signer, idx) => ({
            ...signer,
            row: idx + 1
        }));

        changeSigners(newSigners);
    };

    // Update a signer's title
    const handleChange = (id) => (e) => {
        let index = findIndexById(id);
        if (index === -1) return; // Safety check

        let selectedSigner = { ...signersList[index], title: e.target.value };
        let newSigners = [...signersList];
        newSigners[index] = selectedSigner;
        changeSigners(newSigners);
    };

    // Find index of signer by user ID
    const findIndexByUserId = (id) => signersList.findIndex((sg) => sg.user?.id === id);

    // Find index of signer by ID
    const findIndexById = (id) => signersList.findIndex((item) => item.id === id);

    // Update signers in parent component
    const changeSigners = (newSigners) => onChange(prevState => ({ ...prevState, signers: newSigners }));

    // Handle changes to the signer being added
    const handleSignerChange = (key, value) => {
        if (key === "user") {
            setSigner(prevState => ({
                ...prevState,
                [key]: value,
                title: value.title || '',
                name: value.name || '',
                signature: value.signature || null
            }));
        } else {
            setSigner(prevState => ({
                ...prevState,
                [key]: value,
            }));
        }
    };

    // Track mouse hover for row highlighting
    const handleMouseEnter = (id) => () => {
        setHover(id);
    };

    const handleMouseLeave = () => {
        setHover(null);
    };

    return (
        <>
            <Accordion
                expanded={expandedAccordion}
                onChange={handleAccordionChange}
                elevation={3}
                sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:before': {
                        display: 'none',
                    },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6" component="h2">
                            Signers
                        </Typography>
                        <Chip
                            size="small"
                            label={`${signersList.length} ${signersList.length === 1 ? 'Signer' : 'Signers'}`}
                            color="primary"
                            variant="outlined"
                        />
                    </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                    {error && (
                        <Box sx={{ p: 2 }}>
                            <Alert
                                severity="error"
                                variant="filled"
                                sx={{ mb: 2 }}
                            >
                                {errorMessage || "Please add at least one signer"}
                            </Alert>
                        </Box>
                    )}

                    <Box sx={{ p: 0 }}>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                                        <TableCell width="10%">
                                            Order
                                        </TableCell>
                                        <TableCell width="20%">
                                            Name
                                        </TableCell>
                                        <TableCell width="25%">
                                            Title
                                        </TableCell>
                                        <TableCell width="20%">
                                            Signature
                                        </TableCell>
                                        <TableCell width="20%">
                                            Stamp
                                        </TableCell>
                                        {onChange && (
                                            <TableCell width="5%" align="center">
                                                Actions
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {signersList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={onChange ? 6 : 5} align="center" sx={{ py: 4 }}>
                                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                                        No signers added yet
                                                    </Typography>
                                                    {editable && onChange && (
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<PersonAddAlt1Outlined />}
                                                            onClick={openAddForm}
                                                            sx={{ mt: 1 }}
                                                        >
                                                            Add First Signer
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        signersList.sort(rowCompare).map(signer => (
                                            <TableRow
                                                key={signer.id}
                                                onMouseEnter={handleMouseEnter(signer.id)}
                                                onMouseLeave={handleMouseLeave}
                                                sx={{
                                                    backgroundColor: hover === signer.id ?
                                                        theme.palette.action.hover : 'inherit',
                                                    transition: 'background-color 0.2s ease',
                                                }}
                                            >
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {onChange && editable && (
                                                            <Stack direction="column" spacing={0.5}>
                                                                <Tooltip title="Move Up" placement="left">
                                                                    <span>
                                                                        <IconButton
                                                                            onClick={handleUp(signer.id)}
                                                                            disabled={signer.row < 2 || !editable}
                                                                            size="small"
                                                                            color="primary"
                                                                        >
                                                                            <ArrowUpward fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                                <Tooltip title="Move Down" placement="left">
                                                                    <span>
                                                                        <IconButton
                                                                            onClick={handleDown(signer.id)}
                                                                            size="small"
                                                                            color="primary"
                                                                            disabled={signer.row >= signersList.length || !editable}
                                                                        >
                                                                            <ArrowDownward fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            </Stack>
                                                        )}
                                                        <Chip
                                                            label={signer.row}
                                                            color="default"
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 'bold',
                                                                minWidth: '30px'
                                                            }}
                                                        />
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {signer.name || "Not specified"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        value={signer.title || ""}
                                                        name="title"
                                                        onChange={handleChange(signer.id)}
                                                        disabled={!editable}
                                                        placeholder="Enter title"
                                                        slotProps={{
                                                            Input: {
                                                                endAdornment: editable && (
                                                                    <EditOutlined
                                                                        fontSize="small"
                                                                        color="action"
                                                                        sx={{opacity: 0.5}}
                                                                    />
                                                                )
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {signer.signature ? (
                                                        <Box
                                                            component="img"
                                                            src={signer.signature}
                                                            alt={`${signer.name}'s signature`}
                                                            sx={{
                                                                maxWidth: "100px",
                                                                maxHeight: "50px",
                                                                objectFit: "contain",
                                                                border: `1px solid ${theme.palette.divider}`,
                                                                borderRadius: 1,
                                                                p: 1
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                            No signature
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {signer.stamp ? (
                                                        <Box
                                                            component="img"
                                                            src={signer.stamp}
                                                            alt={`${signer.name}'s stamp`}
                                                            sx={{
                                                                maxWidth: "100px",
                                                                maxHeight: "50px",
                                                                objectFit: "contain",
                                                                border: `1px solid ${theme.palette.divider}`,
                                                                borderRadius: 1,
                                                                p: 1
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                            No stamp
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                {onChange && (
                                                    <TableCell align="center">
                                                        <Tooltip title="Remove Signer" placement="left">
                                                            <span>
                                                                <IconButton
                                                                    onClick={handleDelete(signer.id)}
                                                                    color="error"
                                                                    disabled={!editable}
                                                                    size="small"
                                                                >
                                                                    <Close fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {onChange && editable && signersList.length > 0 && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Tooltip title="Add Another Signer" placement="right" slots={{Transition:Zoom}}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={openAddForm}
                                        size="medium"
                                        color="primary"
                                    >
                                        Add Signer
                                    </Button>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            <SignerAddForm
                onChange={handleSignerChange}
                open={open}
                onSubmit={handleAdd}
                data={signer}
                onClose={handleClose}  // Fixed prop name from onclose to onClose
            />
        </>
    );
};

export default Signers;
