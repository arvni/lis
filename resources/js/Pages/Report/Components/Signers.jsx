import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Zoom,
    useTheme,
} from '@mui/material';
import { Add, PersonAddAlt1Outlined } from '@mui/icons-material';
import SignerAddForm from './SignerAddForm';
import { useState } from 'react';
import {
    moveSignerDown,
    moveSignerUp,
    removeSigner,
    rowCompare,
    updateSignerTitle,
} from './Signers/helpers';
import SignerRow from './Signers/SignerRow';

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
        if (signersList.findIndex((sg) => sg.user?.id === signer.user.id) === -1) {
            onChange((prevState) => ({
                ...prevState,
                signers: [...prevState.signers, { ...signer, row: signersList.length + 1 }],
            }));
        }
        handleClose();
    };

    // Close add form dialog and reset signer state
    const handleClose = () => {
        setSigner({
            id: Math.floor(Math.random() * 35789542),
        });
        setOpen(false);
    };

    // Update signers in parent component; helpers return null for no-ops
    const changeSigners = (newSigners) => {
        if (newSigners) onChange((prevState) => ({ ...prevState, signers: newSigners }));
    };

    // Handle changes to the signer being added
    const handleSignerChange = (key, value) => {
        if (key === 'user') {
            setSigner((prevState) => ({
                ...prevState,
                [key]: value,
                user_id: value.id,
                title: value.title || '',
                name: value.name || '',
                signature: value.signature || null,
            }));
        } else {
            setSigner((prevState) => ({
                ...prevState,
                [key]: value,
            }));
        }
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
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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
                            <Alert severity="error" variant="filled" sx={{ mb: 2 }}>
                                {errorMessage || 'Please add at least one signer'}
                            </Alert>
                        </Box>
                    )}

                    <Box sx={{ p: 0 }}>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow
                                        sx={{ backgroundColor: theme.palette.background.default }}
                                    >
                                        <TableCell width="10%">Order</TableCell>
                                        <TableCell width="20%">Name</TableCell>
                                        <TableCell width="25%">Title</TableCell>
                                        <TableCell width="20%">Signature</TableCell>
                                        <TableCell width="20%">Stamp</TableCell>
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
                                            <TableCell
                                                colSpan={onChange ? 6 : 5}
                                                align="center"
                                                sx={{ py: 4 }}
                                            >
                                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                                    <Typography
                                                        variant="body1"
                                                        color="text.secondary"
                                                        gutterBottom
                                                    >
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
                                        signersList
                                            .sort(rowCompare)
                                            .map((signerItem) => (
                                                <SignerRow
                                                    key={signerItem.id}
                                                    signer={signerItem}
                                                    signerCount={signersList.length}
                                                    editable={editable}
                                                    showActions={Boolean(onChange)}
                                                    onUp={() =>
                                                        changeSigners(
                                                            moveSignerUp(
                                                                signersList,
                                                                signerItem.id,
                                                            ),
                                                        )
                                                    }
                                                    onDown={() =>
                                                        changeSigners(
                                                            moveSignerDown(
                                                                signersList,
                                                                signerItem.id,
                                                            ),
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        changeSigners(
                                                            removeSigner(
                                                                signersList,
                                                                signerItem.id,
                                                            ),
                                                        )
                                                    }
                                                    onTitleChange={(e) =>
                                                        changeSigners(
                                                            updateSignerTitle(
                                                                signersList,
                                                                signerItem.id,
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {onChange && editable && signersList.length > 0 && (
                            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Tooltip
                                    title="Add Another Signer"
                                    placement="right"
                                    slots={{ Transition: Zoom }}
                                >
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
                onClose={handleClose}
            />
        </>
    );
};

export default Signers;
