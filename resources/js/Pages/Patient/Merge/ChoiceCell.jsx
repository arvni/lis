import { Box, Radio, Stack, TableCell } from '@mui/material';

/** A clickable value cell that doubles as a radio. */
const ChoiceCell = ({ selected, onSelect, children }) => (
    <TableCell
        onClick={onSelect}
        sx={{
            cursor: 'pointer',
            borderLeft: '3px solid',
            borderLeftColor: selected ? 'primary.main' : 'transparent',
            backgroundColor: selected ? 'action.selected' : 'transparent',
            transition: 'background-color .15s',
            '&:hover': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
        }}
    >
        <Stack direction="row" spacing={1} alignItems="center">
            <Radio checked={selected} size="small" sx={{ p: 0.5 }} />
            <Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box>
        </Stack>
    </TableCell>
);

export default ChoiceCell;
