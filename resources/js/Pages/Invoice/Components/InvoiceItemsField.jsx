import React, { useState } from 'react';
import {
    Box,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    TextField,
    Typography,
    Chip,
    Paper,
    TableContainer,
    TableFooter,
    Collapse,
    Button,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    MenuItem,
    Select,
    InputAdornment,
    Grid2 as Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

// Define discount types
const DISCOUNT_TYPES = [
    {id: 'PERCENTAGE', name: 'Percentage', icon: '%'},
    {id: 'FIXED', name: 'Fixed Amount', icon: 'OMR'}
];

// Advanced Discount Manager Component
const AdvancedDiscountManager = ({
                                     discounts = [],
                                     price = 0,
                                     maxDiscount = 100,
                                     onChange,
                                     errors = {}
                                 }) => {
    // Calculate total discount amount
    const calculateTotalDiscount = (discountArray) => {
        return discountArray.reduce((total, discount) => {
            if (discount.type === 'PERCENTAGE') {
                return total + (price * discount.value / 100);
            } else {
                return total + Number(discount.value);
            }
        }, 0);
    };

    // Calculate total discount percentage
    const calculateTotalDiscountPercentage = (discountArray) => {
        return discountArray.reduce((total, discount) => {
            if (discount.type === 'PERCENTAGE') {
                return total + Number(discount.value);
            } else {
                return total + (discount.value / price * 100);
            }
        }, 0);
    };

    // Add a new discount
    const handleAddDiscount = () => {
        const newDiscounts = [
            ...discounts,
            {id: Date.now(), type: 'PERCENTAGE', value: 0, reason: ''}
        ];
        onChange(newDiscounts);
    };

    // Remove a discount
    const handleRemoveDiscount = (id) => {
        const newDiscounts = discounts.filter(discount => discount.id !== id);
        onChange(newDiscounts);
    };

    // Update a discount field
    const handleDiscountChange = (id, field, value) => {
        const newDiscounts = discounts.map(discount => {
            if (discount.id === id) {
                return {...discount, [field]: value};
            }
            return discount;
        });

        // Calculate total discount
        const totalDiscount = calculateTotalDiscount(newDiscounts);
        const totalDiscountPercentage = calculateTotalDiscountPercentage(newDiscounts);

        // Check if exceeding max discount
        const maxAmount = maxDiscount * price * 0.01;
        let adjustedDiscounts = [...newDiscounts];

        if (totalDiscount > maxAmount && adjustedDiscounts.length > 0) {
            const lastIndex = adjustedDiscounts.length - 1;
            const lastDiscount = adjustedDiscounts[lastIndex];

            if (lastDiscount.type === 'PERCENTAGE') {
                const excess = totalDiscountPercentage - maxDiscount;
                const newValue = Math.max(0, Number(lastDiscount.value) - excess);
                adjustedDiscounts[lastIndex] = {...lastDiscount, value: newValue};
            } else {
                const excess = totalDiscount - maxAmount;
                const newValue = Math.max(0, Number(lastDiscount.value) - excess);
                adjustedDiscounts[lastIndex] = {...lastDiscount, value: newValue};
            }
        }

        onChange(totalDiscount > maxAmount ? adjustedDiscounts : newDiscounts);
    };

    // Calculate remaining available discount
    const remainingDiscountPercentage = Math.max(0, maxDiscount - calculateTotalDiscountPercentage(discounts));
    const remainingDiscountAmount = Math.max(0, (maxDiscount * price * 0.01) - calculateTotalDiscount(discounts));

    return (
        <Box>
            <Box sx={{mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="subtitle2">
                    Discounts
                </Typography>
                <Box>
                    <Tooltip title={`Remaining available discount: ${remainingDiscountPercentage.toFixed(2)}% (${remainingDiscountAmount.toFixed(2)} OMR)`}>
                        <Chip
                            label={`Available: ${remainingDiscountPercentage.toFixed(2)}%`}
                            color={remainingDiscountPercentage > 0 ? "success" : "error"}
                            size="small"
                            sx={{mr: 1}}
                        />
                    </Tooltip>
                    <Button
                        size="small"
                        startIcon={<AddIcon/>}
                        variant="outlined"
                        onClick={handleAddDiscount}
                        disabled={remainingDiscountPercentage <= 0}
                    >
                        Add Discount
                    </Button>
                </Box>
            </Box>

            {discounts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>
                    No discounts applied. Click "Add Discount" to apply one.
                </Typography>
            ) : (
                discounts.map((discount, index) => (
                    <Box
                        key={discount.id}
                        sx={{
                            mb: 2,
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid size={{xs: 12, sm: 3}}>
                                <FormControl fullWidth>
                                    <Select
                                        size="small"
                                        value={discount.type}
                                        onChange={(e) => handleDiscountChange(discount.id, 'type', e.target.value)}
                                    >
                                        {DISCOUNT_TYPES.map(type => (
                                            <MenuItem key={type.id} value={type.id}>
                                                {type.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{xs: 12, sm: 3}}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Value"
                                    value={discount.value}
                                    onChange={(e) => {
                                        const newValue = Math.max(0, parseFloat(e.target.value) || 0);
                                        handleDiscountChange(discount.id, 'value', newValue);
                                    }}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    {discount.type === 'PERCENTAGE' ? '%' : 'OMR'}
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 4}}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Reason"
                                    value={discount.reason || ''}
                                    onChange={(e) => handleDiscountChange(discount.id, 'reason', e.target.value)}
                                    placeholder="Why is this discount applied?"
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 2}} sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Tooltip title="Remove discount">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveDiscount(discount.id)}
                                        size="small"
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>

                        <Box sx={{mt: 1, display: 'flex', justifyContent: 'flex-end'}}>
                            <Typography variant="body2" color="text.secondary">
                                Amount:
                                <Typography
                                    component="span"
                                    fontWeight="medium"
                                    color="primary.main"
                                    sx={{ml: 1}}
                                >
                                    {discount.type === 'PERCENTAGE'
                                        ? (price * discount.value / 100).toFixed(2)
                                        : Number(discount.value).toFixed(2)
                                    } OMR
                                </Typography>
                            </Typography>
                        </Box>
                    </Box>
                ))
            )}

            {discounts.length > 0 && (
                <Box sx={{
                    p: 2,
                    bgcolor: 'primary.50',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="subtitle2">
                        Total Discount:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {calculateTotalDiscount(discounts).toFixed(2)} OMR
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ml: 1}}>
                            ({calculateTotalDiscountPercentage(discounts).toFixed(2)}%)
                        </Typography>
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

const InvoiceItemsField = ({ items = [], onChange, maxDiscount = 100 }) => {
    const [editingItem, setEditingItem] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [errors, setErrors] = useState({});
    const [expandedPanels, setExpandedPanels] = useState({});
    const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
    const [tempDiscounts, setTempDiscounts] = useState([]);

    // Group items by type
    const tests = items.filter(item => item.test?.type === "TEST");
    const services = items.filter(item => item.test?.type === "SERVICE");
    const panels = items.filter(item => item.test?.type === "PANEL");

    // Calculate totals
    const calculateTotals = (itemsList) => {
        return itemsList.reduce((acc, item) => ({
            totalPrice: acc.totalPrice + (parseFloat(item.price) || 0),
            totalDiscount: acc.totalDiscount + (parseFloat(item.discount) || 0),
            netAmount: acc.netAmount + ((parseFloat(item.price) || 0) - (parseFloat(item.discount) || 0))
        }), { totalPrice: 0, totalDiscount: 0, netAmount: 0 });
    };

    const grandTotals = calculateTotals(items);

    // Calculate discount from discount array
    const calculateDiscountFromArray = (discountArray, price) => {
        return discountArray.reduce((total, discount) => {
            if (discount.type === 'PERCENTAGE') {
                return total + (price * discount.value / 100);
            } else {
                return total + Number(discount.value);
            }
        }, 0);
    };

    // Handle edit start
    const handleEdit = (itemId) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            setEditingItem(itemId);
            setEditValues({
                price: item.price || 0
            });
            // Get existing discounts from customParameters or create empty array
            const existingDiscounts = item.customParameters?.discounts || [];
            setTempDiscounts(existingDiscounts);
            setErrors({});
        }
    };

    // Handle input changes during editing
    const handleEditChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        setEditValues(prev => ({ ...prev, [field]: numValue }));

        // Clear errors when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Handle discount dialog
    const handleDiscountDialog = () => {
        setDiscountDialogOpen(true);
    };

    const handleDiscountDialogClose = () => {
        setDiscountDialogOpen(false);
    };

    const handleDiscountDialogSave = () => {
        setDiscountDialogOpen(false);
    };

    // Validate edit values
    const validateEdit = () => {
        const newErrors = {};

        if (editValues.price < 0) {
            newErrors.price = "Price cannot be negative";
        }

        const totalDiscount = calculateDiscountFromArray(tempDiscounts, editValues.price);

        if (totalDiscount > editValues.price) {
            newErrors.discount = "Total discount cannot exceed price";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = () => {
        if (!validateEdit()) return;

        const totalDiscount = calculateDiscountFromArray(tempDiscounts, editValues.price);

        const updatedItems = items.map(item =>
            item.id === editingItem
                ? {
                    ...item,
                    ...editValues,
                    discount: totalDiscount,
                    customParameters: {
                        ...item.customParameters,
                        discounts: tempDiscounts
                    }
                }
                : item
        );

        onChange("acceptance_items",updatedItems);
        setEditingItem(null);
        setEditValues({});
        setErrors({});
        setTempDiscounts([]);
    };

    // Handle cancel
    const handleCancel = () => {
        setEditingItem(null);
        setEditValues({});
        setErrors({});
        setTempDiscounts([]);
    };

    // Toggle panel expansion
    const togglePanel = (panelId) => {
        setExpandedPanels(prev => ({
            ...prev,
            [panelId]: !prev[panelId]
        }));
    };

    // Render price cell (editable)
    const renderPriceCell = (item) => {
        const isEditing = editingItem === item.id;

        if (!isEditing) {
            return (
                <TableCell align="right">
                    <Typography variant="body2">
                        {parseFloat(item.price || 0).toFixed(2)}
                    </Typography>
                </TableCell>
            );
        }

        return (
            <TableCell align="right">
                <TextField
                    size="small"
                    type="number"
                    value={editValues.price || 0}
                    onChange={(e) => handleEditChange('price', e.target.value)}
                    error={Boolean(errors.price)}
                    helperText={errors.price}
                    inputProps={{
                        min: 0,
                        step: 0.01,
                        style: { textAlign: 'right' }
                    }}
                    sx={{ width: 100 }}
                />
            </TableCell>
        );
    };

    // Render discount cell (advanced)
    const renderDiscountCell = (item) => {
        const isEditing = editingItem === item.id;
        const totalDiscount = isEditing
            ? calculateDiscountFromArray(tempDiscounts, editValues.price)
            : item.discount;

        return (
            <TableCell align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography variant="body2">
                        {parseFloat(totalDiscount || 0).toFixed(2)}
                    </Typography>
                    {isEditing && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleDiscountDialog}
                            sx={{ ml: 1, minWidth: 'auto', px: 1 }}
                        >
                            Edit
                        </Button>
                    )}
                </Box>
            </TableCell>
        );
    };

    // Render action buttons
    const renderActions = (item) => {
        const isEditing = editingItem === item.id;

        return (
            <TableCell align="center">
                {isEditing ? (
                    <Box display="flex" gap={0.5}>
                        <Tooltip title="Save changes">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={handleSave}
                            >
                                <SaveIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel editing">
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={handleCancel}
                            >
                                <CancelIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Tooltip title="Edit price and discount">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(item.id)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </TableCell>
        );
    };

    // Render item row
    const renderItemRow = (item, isSubItem = false) => (
        <TableRow
            key={item.id}
            sx={{
                backgroundColor: isSubItem ? 'grey.50' : 'inherit',
                '&:hover': { backgroundColor: isSubItem ? 'grey.100' : 'grey.50' }
            }}
        >
            <TableCell sx={{ pl: isSubItem ? 4 : 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {!isSubItem && (
                        <Chip
                            label={item.test?.type || 'Unknown'}
                            size="small"
                            color={
                                item.test?.type === 'TEST' ? 'primary' :
                                    item.test?.type === 'SERVICE' ? 'secondary' : 'default'
                            }
                        />
                    )}
                    <Typography variant="body2" fontWeight={isSubItem ? 'normal' : 'medium'}>
                        {item.test?.name || 'Unknown Test'}
                    </Typography>
                </Box>
            </TableCell>

            <TableCell>
                <Typography variant="body2" color="text.secondary">
                    {item.patients?.map(patient => patient.fullName || patient.name).join(", ") || 'No patients'}
                </Typography>
            </TableCell>

            {renderPriceCell(item)}
            {renderDiscountCell(item)}

            <TableCell align="right">
                <Typography
                    variant="body2"
                    fontWeight="medium"
                    color="primary.main"
                >
                    {((parseFloat(item.price) || 0) - (parseFloat(item.discount) || 0)).toFixed(2)}
                </Typography>
            </TableCell>

            {renderActions(item)}
        </TableRow>
    );

    // Render panel with sub-items
    const renderPanelRow = (panel) => {
        const isExpanded = expandedPanels[panel.id];
        const subItems = panel.acceptanceItems || [];

        return (
            <React.Fragment key={panel.id}>
                <TableRow sx={{ backgroundColor: 'primary.light', opacity: 0.1 }}>
                    <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Chip label="PANEL" size="small" color="default" />
                            <Typography variant="body2" fontWeight="medium">
                                {panel.panel?.name || panel.test?.name || 'Unknown Panel'}
                            </Typography>
                            {subItems.length > 0 && (
                                <Button
                                    size="small"
                                    onClick={() => togglePanel(panel.id)}
                                    endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                >
                                    {subItems.length} tests
                                </Button>
                            )}
                        </Box>
                    </TableCell>

                    <TableCell>
                        <Typography variant="body2" color="text.secondary">
                            {panel.patients?.map(patient => patient.fullName || patient.name).join(", ") || 'No patients'}
                        </Typography>
                    </TableCell>

                    {renderPriceCell(panel)}
                    {renderDiscountCell(panel)}

                    <TableCell align="right">
                        <Typography
                            variant="body2"
                            fontWeight="medium"
                            color="primary.main"
                        >
                            {((parseFloat(panel.price) || 0) - (parseFloat(panel.discount) || 0)).toFixed(2)}
                        </Typography>
                    </TableCell>

                    {renderActions(panel)}
                </TableRow>

                {/* Sub-items collapse */}
                {subItems.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={6} sx={{ p: 0, border: 'none' }}>
                            <Collapse in={isExpanded}>
                                <Table size="small">
                                    <TableBody>
                                        {subItems.map(subItem => renderItemRow(subItem, true))}
                                    </TableBody>
                                </Table>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                )}
            </React.Fragment>
        );
    };

    if (items.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    No items in invoice
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add tests or panels to see them here
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Test/Service
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Patients
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Price
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Discount
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Net Amount
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Actions
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {/* Render panels first */}
                        {panels.map(panel => renderPanelRow(panel))}

                        {/* Render individual tests */}
                        {tests.map(test => renderItemRow(test))}

                        {/* Render services */}
                        {services.map(service => renderItemRow(service))}
                    </TableBody>

                    {/* Totals footer */}
                    <TableFooter>
                        <TableRow sx={{ backgroundColor: 'primary.light', opacity: 0.1 }}>
                            <TableCell colSpan={2}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Grand Total
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                    {grandTotals.totalPrice.toFixed(2)}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                                    {grandTotals.totalDiscount.toFixed(2)}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                    {grandTotals.netAmount.toFixed(2)}
                                </Typography>
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {/* Advanced Discount Dialog */}
            <Dialog
                open={discountDialogOpen}
                onClose={handleDiscountDialogClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            Manage Discounts
                        </Typography>
                        <IconButton onClick={handleDiscountDialogClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <AdvancedDiscountManager
                        discounts={tempDiscounts}
                        price={editValues.price || 0}
                        maxDiscount={maxDiscount}
                        onChange={setTempDiscounts}
                        errors={errors}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDiscountDialogClose} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleDiscountDialogSave} variant="contained" color="primary">
                        Apply Discounts
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoiceItemsField;
