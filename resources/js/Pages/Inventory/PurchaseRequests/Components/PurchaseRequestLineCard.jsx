import { useState } from 'react';
import {
    Box,
    Button,
    Collapse,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';
import UnitSelect from '@/Pages/Inventory/Components/UnitSelect';
import SupplierSelect from '@/Pages/Inventory/Components/SupplierSelect';
import BrandInput from '@/Pages/Inventory/Components/BrandInput';
import PriceHint from '@/Pages/Inventory/Components/PriceHint';
import { formatAmount } from './lineState';

const DETAIL_FIELDS = ['preferred_supplier_id', 'brand', 'cat_no', 'notes'];

/**
 * One requested item: what it is (a catalogue item or a typed name), how many and
 * at roughly what price, plus a collapsible section for supplier, brand, catalogue
 * number and notes.
 *
 * Props:
 *   line      – the form line (see lineState.js)
 *   index     – position in the list, for the "Item n" label
 *   total     – qty × estimated price, or null
 *   errors    – this line's validation errors keyed by field
 *   units     – all units, offered while the line has no catalogue item
 *   autoFocus – focus the item field when it mounts (a line just added or switched)
 *   on*       – change handlers, see PurchaseRequestLinesEditor
 */
const PurchaseRequestLineCard = ({
    line,
    index,
    total,
    errors,
    units,
    autoFocus,
    onItemChange,
    onManualChange,
    onUnitChange,
    onSupplierChange,
    onFieldChange,
    onRemove,
    onDuplicate,
}) => {
    const number = index + 1;
    const [detailsOpen, setDetailsOpen] = useState(
        Boolean(line._preferred_supplier || line.brand || line.cat_no || line.notes),
    );
    // A detail field with a server error is never left hidden.
    const showDetails = detailsOpen || DETAIL_FIELDS.some((field) => errors[field]);
    const itemError = errors.item_id ?? errors.item_name;
    const detailSummary = [
        line._preferred_supplier?.name,
        line.brand && `Brand: ${line.brand}`,
        line.cat_no && `Cat. no. ${line.cat_no}`,
        line.notes,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, borderColor: Object.keys(errors).length ? 'error.main' : undefined }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                    Item {number}
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={line._manual ? 'manual' : 'catalogue'}
                    onChange={(_, value) => value && onManualChange(value === 'manual')}
                    aria-label={`Where item ${number} comes from`}
                >
                    <ToggleButton value="catalogue" sx={{ py: 0.25, textTransform: 'none' }}>
                        From catalogue
                    </ToggleButton>
                    <ToggleButton value="manual" sx={{ py: 0.25, textTransform: 'none' }}>
                        Not in catalogue
                    </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flexGrow: 1 }} />
                {total !== null && (
                    <Typography variant="body2" color="text.secondary">
                        Est.{' '}
                        <Box component="strong" sx={{ color: 'text.primary' }}>
                            {formatAmount(total)}
                        </Box>
                    </Typography>
                )}
                <Tooltip title="Duplicate item">
                    <IconButton
                        size="small"
                        onClick={onDuplicate}
                        aria-label={`Duplicate item ${number}`}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Remove item">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={onRemove}
                        aria-label={`Remove item ${number}`}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                    {line._manual ? (
                        <TextField
                            size="small"
                            fullWidth
                            required
                            label="Item name"
                            value={line.item_name}
                            onChange={(e) => onFieldChange('item_name', e.target.value)}
                            error={!!itemError}
                            helperText={itemError ?? 'Linked to a catalogue item when received.'}
                            autoFocus={autoFocus}
                            slotProps={{ htmlInput: { maxLength: 255 } }}
                        />
                    ) : (
                        <ItemSelect
                            size="small"
                            value={line._item}
                            onChange={onItemChange}
                            required
                            error={!!itemError}
                            helperText={itemError}
                            autoFocus={autoFocus}
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <UnitSelect
                        size="small"
                        itemId={line._item?.id}
                        allUnits={units}
                        value={line._unit}
                        onChange={onUnitChange}
                        required
                        error={!!errors.unit_id}
                        helperText={errors.unit_id}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
                        required
                        type="number"
                        label="Quantity"
                        value={line.qty}
                        onChange={(e) => onFieldChange('qty', e.target.value)}
                        error={!!errors.qty}
                        helperText={errors.qty}
                        slotProps={{
                            htmlInput: { min: 0, step: 'any' },
                            input: line._unit
                                ? {
                                      endAdornment: (
                                          <InputAdornment position="end">
                                              {line._unit.abbreviation}
                                          </InputAdornment>
                                      ),
                                  }
                                : undefined,
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <TextField
                        size="small"
                        fullWidth
                        type="number"
                        label="Est. unit price"
                        value={line.estimated_unit_price}
                        onChange={(e) => onFieldChange('estimated_unit_price', e.target.value)}
                        error={!!errors.estimated_unit_price}
                        helperText={errors.estimated_unit_price}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                    <PriceHint itemId={line._item?.id} supplierId={line._preferred_supplier?.id} />
                </Grid>
            </Grid>

            <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1 }}>
                    <Button
                        size="small"
                        onClick={() => setDetailsOpen(!showDetails)}
                        startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        aria-expanded={showDetails}
                        sx={{ textTransform: 'none' }}
                    >
                        {showDetails ? 'Hide details' : 'Supplier, brand & notes'}
                    </Button>
                    {!showDetails && detailSummary && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {detailSummary}
                        </Typography>
                    )}
                </Box>
                <Collapse in={showDetails} unmountOnExit>
                    <Grid container spacing={2} sx={{ pt: 1.5 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SupplierSelect
                                size="small"
                                label="Preferred supplier"
                                value={line._preferred_supplier}
                                onChange={onSupplierChange}
                                error={!!errors.preferred_supplier_id}
                                helperText={errors.preferred_supplier_id}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <BrandInput
                                value={line.brand}
                                itemId={line._item?.id}
                                onChange={(v) => onFieldChange('brand', v)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Cat. no."
                                value={line.cat_no}
                                onChange={(e) => onFieldChange('cat_no', e.target.value)}
                                error={!!errors.cat_no}
                                helperText={errors.cat_no}
                            />
                        </Grid>
                        {/* Notes get a full row and grow with the text. */}
                        <Grid size={12}>
                            <TextField
                                size="small"
                                fullWidth
                                multiline
                                minRows={3}
                                maxRows={10}
                                label="Notes"
                                value={line.notes}
                                onChange={(e) => onFieldChange('notes', e.target.value)}
                                error={!!errors.notes}
                                helperText={errors.notes}
                            />
                        </Grid>
                    </Grid>
                </Collapse>
            </Box>
        </Paper>
    );
};

export default PurchaseRequestLineCard;
