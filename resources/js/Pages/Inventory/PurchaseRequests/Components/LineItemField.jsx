import { Box, Link, TextField } from '@mui/material';
import ItemSelect from '@/Pages/Inventory/Components/ItemSelect';

/**
 * Item cell of a purchase request line: a catalogue item picked with ItemSelect,
 * or — for something not in the catalogue yet — a typed name. A named line is
 * linked to a real item when the goods are received.
 *
 * Props:
 *   manual         – bool, whether the line uses a typed name
 *   item           – selected catalogue item (or null)
 *   itemName       – typed name
 *   onItemChange   – fn(item | null)
 *   onNameChange   – fn(string)
 *   onManualChange – fn(bool)
 *   error          – validation message for the line's item or name
 */
const LineItemField = ({
    manual,
    item,
    itemName,
    onItemChange,
    onNameChange,
    onManualChange,
    error,
}) => (
    <Box>
        {manual ? (
            <TextField
                size="small"
                fullWidth
                required
                label="Item name"
                value={itemName}
                onChange={(e) => onNameChange(e.target.value)}
                error={!!error}
                helperText={error}
                slotProps={{ htmlInput: { maxLength: 255 } }}
            />
        ) : (
            <ItemSelect
                size="small"
                value={item}
                onChange={onItemChange}
                required
                error={!!error}
                helperText={error}
            />
        )}
        <Link
            component="button"
            type="button"
            variant="caption"
            onClick={() => onManualChange(!manual)}
        >
            {manual ? 'Pick from catalogue' : 'Not in catalogue? Type a name'}
        </Link>
    </Box>
);

export default LineItemField;
