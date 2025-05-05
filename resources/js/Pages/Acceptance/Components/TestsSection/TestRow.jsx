import React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import { Box, Typography } from "@mui/material";

const TestRow = ({ test, testTypes, onEdit, onDelete }) => (
    <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell>
            <Typography fontWeight="medium">
                {test?.method_test?.test?.name}
            </Typography>
        </TableCell>

        <TableCell>
            <Chip
                label={test?.method_test?.test?.code}
                size="small"
                variant="outlined"
                color="primary"
            />
        </TableCell>

        <TableCell>
            {test?.method_test?.test?.fullName}
        </TableCell>

        <TableCell>
            <Chip
                label={testTypes[test?.method_test?.test?.type]}
                size="small"
                color={test?.method_test?.test?.type === 'TEST' ? "info" :
                    test?.method_test?.test?.type === 'SERVICE' ? "success" : "warning"}
            />
        </TableCell>

        <TableCell>
            {test?.method_test?.method?.name}
        </TableCell>

        <TableCell>
            {test?.patients?.map((item, index) => (
                <Chip
                    key={index}
                    label={item.name}
                    size="small"
                    sx={{ m: 0.5 }}
                />
            ))}
        </TableCell>

        <TableCell>
            {test?.details ? (
                <Box sx={{ maxWidth: 200, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {test.details}
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary">No details</Typography>
            )}
        </TableCell>

        <TableCell align="right">
            <Typography fontWeight="medium" color={Number(test.discount) > 0 ? "success.main" : "text.primary"}>
                {test.discount}
            </Typography>
        </TableCell>

        <TableCell align="right">
            <Typography fontWeight="medium">
                {test.price}
            </Typography>
        </TableCell>

        <TableCell align="center">
            <Stack direction="row" spacing={1} justifyContent="center">
                <Tooltip title="Edit test">
                    <IconButton onClick={onEdit} size="small">
                        <EditIcon color="primary" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Remove test">
                    <IconButton onClick={onDelete} size="small">
                        <DeleteIcon color="error" />
                    </IconButton>
                </Tooltip>
            </Stack>
        </TableCell>
    </TableRow>
);

export default TestRow;
