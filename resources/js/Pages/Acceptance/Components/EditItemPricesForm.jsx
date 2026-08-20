import React, { useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Divider,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    TextField,
    Paper,
    Alert,
    Chip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Close,
    Save,
    RequestQuote,
    PlaylistAddCheck,
    Functions,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import { router } from '@inertiajs/react';
import MethodPriceField from './MethodPriceField';

const round = (value, decimals) => {
    const factor = 10 ** decimals;
    return Math.round((parseFloat(value) || 0) * factor) / factor;
};

const DYNAMIC_PRICE_TYPES = ['Formulate', 'Conditional'];

/**
 * A method (for a test) or a panel test prices dynamically when it carries a
 * formula/conditions plus the parameters they are fed with — the same check the
 * add form makes before rendering MethodPriceField.
 */
const isDynamic = (source) =>
    DYNAMIC_PRICE_TYPES.includes(source?.price_type) &&
    (source?.extra?.parameters?.length ?? 0) > 0;

const itemName = (item) => item?.method_test?.test?.name ?? item?.test?.name ?? `Item #${item?.id}`;

/**
 * Turn the grouped acceptance items into editable rows: every test/service is a
 * row of its own, and a panel is a single row carrying the panel totals (the
 * server splits an edited panel total back over its items).
 *
 * Rows are built from the grouped payload — not the flat item list — because
 * that is the one whose method/panel pricing already has the referrer's
 * overrides applied.
 *
 * @param {Object} groupedItems - { tests: [...], panels: [...] }
 */
export const buildPriceRows = (groupedItems = {}) => {
    const rows = [];

    (groupedItems?.tests ?? []).forEach((item) => {
        const source = item?.method_test?.method ?? null;

        rows.push({
            key: `item-${item.id}`,
            type: 'item',
            id: item.id,
            name: itemName(item),
            methods: [],
            price: round(item.price, 3),
            discount: round(item.discount, 3),
            source,
            dynamic: isDynamic(source),
            customParameters: item.customParameters ?? {},
        });
    });

    (groupedItems?.panels ?? []).forEach((panel) => {
        const panelItems = panel?.acceptanceItems ?? [];
        const source = panel?.panel ?? null;

        rows.push({
            key: `panel-${panel.id}`,
            type: 'panel',
            panelId: panel.id,
            name: source?.name ?? `Panel #${panel.id}`,
            methods: panelItems.map((item) => item?.method_test?.method?.name),
            price: round(
                panelItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0),
                3,
            ),
            discount: round(
                panelItems.reduce((acc, item) => acc + (parseFloat(item.discount) || 0), 0),
                3,
            ),
            source,
            dynamic: isDynamic(source),
            // A panel prices as a whole, so its parameters live on every one of
            // its items; the first one is representative.
            customParameters: panelItems[0]?.customParameters ?? {},
        });
    });

    return rows;
};

/**
 * Dialog for editing the price and discount of each acceptance item before an
 * invoice is created. Submits to the acceptances.updateItemPrices endpoint.
 *
 * Formula/conditional rows are priced the way the add form prices them: the
 * parameters are edited and the price is calculated, never typed.
 *
 * @param {boolean} open
 * @param {Object} acceptance - acceptance with id
 * @param {Object} groupedItems - grouped acceptance items ({ tests, panels })
 * @param {Function} onClose
 */
const EditItemPricesForm = ({ open, acceptance, groupedItems = {}, onClose }) => {
    const theme = useTheme();

    const [rows, setRows] = useState(() => buildPriceRows(groupedItems));
    const [expandedRows, setExpandedRows] = useState({});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const hasPanels = rows.some((row) => row.type === 'panel');

    const handleField = (key, field) => (e) => {
        const value = e.target.value;
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
    };

    // MethodPriceField hands back the whole customParameters bag plus the price
    // it calculated from them.
    const handleParameters = (key) => (update) =>
        setRows((prev) =>
            prev.map((row) =>
                row.key === key
                    ? {
                          ...row,
                          customParameters: update.customParameters ?? row.customParameters,
                          price: update.price ?? row.price,
                      }
                    : row,
            ),
        );

    const toggleRow = (key) => setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));

    const totals = useMemo(() => {
        const price = rows.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0);
        const discount = rows.reduce((acc, row) => acc + (parseFloat(row.discount) || 0), 0);
        return { price, discount, net: price - discount };
    }, [rows]);

    const handleSubmit = () => {
        setProcessing(true);
        router.put(
            route('acceptances.updateItemPrices', acceptance.id),
            {
                items: rows.map((row) => ({
                    ...(row.type === 'panel' ? { panel_id: row.panelId } : { id: row.id }),
                    price: parseFloat(row.price) || 0,
                    discount: parseFloat(row.discount) || 0,
                    // Only dynamic rows own parameters; sending them for a fixed
                    // row would overwrite the stored bag with an empty one.
                    ...(row.dynamic
                        ? { custom_parameters: { price: row.customParameters?.price ?? {} } }
                        : {}),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 2 } } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RequestQuote sx={{ mr: 1.5, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="h6" component="span">
                            Edit Item Prices
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                        >
                            Adjust the price and discount of each item before creating the invoice
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} disabled={processing} aria-label="Close dialog">
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {rows.length === 0 ? (
                    <Alert severity="info">There are no items to edit.</Alert>
                ) : (
                    <>
                        {hasPanels && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                A panel is priced as a whole. The amount is split evenly across its
                                tests, and any leftover is added to the first tests so the shares
                                add up to the panel price exactly.
                            </Alert>
                        )}
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small" aria-label="edit item prices table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell align="right" width={160}>
                                            Price
                                        </TableCell>
                                        <TableCell align="right" width={160}>
                                            Discount
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, index) => (
                                        <React.Fragment key={row.key}>
                                            <TableRow>
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        {row.type === 'panel' && (
                                                            <PlaylistAddCheck
                                                                fontSize="small"
                                                                color="primary"
                                                            />
                                                        )}
                                                        <Box>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="medium"
                                                                color={
                                                                    row.type === 'panel'
                                                                        ? 'primary.main'
                                                                        : 'text.primary'
                                                                }
                                                            >
                                                                {row.name}
                                                                {row.type === 'panel' && (
                                                                    <Chip
                                                                        label={`${row.methods.length} tests`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="primary"
                                                                        sx={{
                                                                            ml: 1,
                                                                            height: 20,
                                                                            fontSize: '0.65rem',
                                                                        }}
                                                                    />
                                                                )}
                                                                {row.dynamic && (
                                                                    <Chip
                                                                        icon={
                                                                            <Functions fontSize="small" />
                                                                        }
                                                                        label={
                                                                            row.source.price_type
                                                                        }
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="secondary"
                                                                        onClick={() =>
                                                                            toggleRow(row.key)
                                                                        }
                                                                        sx={{
                                                                            ml: 1,
                                                                            height: 20,
                                                                            fontSize: '0.65rem',
                                                                        }}
                                                                    />
                                                                )}
                                                            </Typography>
                                                            {row.type === 'panel' && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                >
                                                                    {row.methods
                                                                        .filter(Boolean)
                                                                        .join(' • ')}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {row.dynamic && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => toggleRow(row.key)}
                                                                aria-label={`Toggle pricing parameters for ${row.name}`}
                                                            >
                                                                {expandedRows[row.key] ? (
                                                                    <ExpandLess fontSize="small" />
                                                                ) : (
                                                                    <ExpandMore fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={row.price}
                                                        onChange={handleField(row.key, 'price')}
                                                        disabled={row.dynamic}
                                                        error={Boolean(
                                                            errors[`items.${index}.price`],
                                                        )}
                                                        helperText={
                                                            errors[`items.${index}.price`] ||
                                                            (row.dynamic ? 'Calculated' : '')
                                                        }
                                                        slotProps={{
                                                            htmlInput: {
                                                                min: 0,
                                                                step: 0.01,
                                                                style: { textAlign: 'right' },
                                                                'aria-label': `Price for ${row.name}`,
                                                            },
                                                        }}
                                                        sx={{ width: 140 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={row.discount}
                                                        onChange={handleField(row.key, 'discount')}
                                                        error={Boolean(
                                                            errors[`items.${index}.discount`],
                                                        )}
                                                        helperText={
                                                            errors[`items.${index}.discount`]
                                                        }
                                                        slotProps={{
                                                            htmlInput: {
                                                                min: 0,
                                                                step: 0.01,
                                                                style: { textAlign: 'right' },
                                                                'aria-label': `Discount for ${row.name}`,
                                                            },
                                                        }}
                                                        sx={{ width: 140 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {row.dynamic && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={3}
                                                        sx={{ py: 0, borderBottom: 0 }}
                                                    >
                                                        <Collapse
                                                            in={Boolean(expandedRows[row.key])}
                                                            timeout="auto"
                                                            unmountOnExit
                                                        >
                                                            <Box sx={{ py: 2 }}>
                                                                <MethodPriceField
                                                                    method={row.source}
                                                                    values={row.customParameters}
                                                                    onChange={handleParameters(
                                                                        row.key,
                                                                    )}
                                                                    errors={errors}
                                                                />
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell>
                                            <Typography fontWeight="bold">Net Total</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="bold">
                                                {totals.price.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight="bold" color="error">
                                                -{totals.discount.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} align="right">
                                            <Typography variant="h6" fontWeight="bold">
                                                Net Amount:
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                color="success.main"
                                            >
                                                {totals.net.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    variant="outlined"
                    disabled={processing}
                    startIcon={<Close />}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={processing || rows.length === 0}
                    startIcon={<Save />}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditItemPricesForm;
