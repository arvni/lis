import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import { DeleteOutlined } from '@mui/icons-material';

const TubesTableView = ({ tubesList, errors, onTubeChange, onDeleteTube }) => (
    <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
            <TableHead>
                <TableRow>
                    <TableCell width={60}>#</TableCell>
                    <TableCell>Tube Barcode</TableCell>
                    <TableCell>Tube Series</TableCell>
                    <TableCell>Manufactured Date</TableCell>
                    <TableCell>Expire Date</TableCell>
                    <TableCell width={50}></TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {tubesList.map((tube, index) => (
                    <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Enter tube barcode"
                                value={tube.tube_barcode}
                                onChange={(e) =>
                                    onTubeChange(index, 'tube_barcode', e.target.value)
                                }
                                error={!!errors?.[`tubes.${index}.tube_barcode`]}
                                helperText={errors?.[`tubes.${index}.tube_barcode`]}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Enter tube series"
                                value={tube.tube_series || ''}
                                onChange={(e) => onTubeChange(index, 'tube_series', e.target.value)}
                                error={!!errors?.[`tubes.${index}.tube_series`]}
                                helperText={errors?.[`tubes.${index}.tube_series`]}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                size="small"
                                fullWidth
                                type="date"
                                value={tube.manufactured_date || ''}
                                onChange={(e) =>
                                    onTubeChange(index, 'manufactured_date', e.target.value)
                                }
                                error={!!errors?.[`tubes.${index}.manufactured_date`]}
                                helperText={errors?.[`tubes.${index}.manufactured_date`]}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                size="small"
                                fullWidth
                                type="date"
                                value={tube.expire_date}
                                onChange={(e) => onTubeChange(index, 'expire_date', e.target.value)}
                                error={!!errors?.[`tubes.${index}.expire_date`]}
                                helperText={errors?.[`tubes.${index}.expire_date`]}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </TableCell>
                        <TableCell>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDeleteTube(index)}
                                disabled={tubesList.length <= 1}
                            >
                                <DeleteOutlined fontSize="small" />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

export default TubesTableView;
