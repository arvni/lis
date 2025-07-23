import React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import {Box, Divider, Typography} from "@mui/material";
import {Link} from "@inertiajs/react";

const TestRow = ({test, testTypes, onEdit, onDelete, showButton = false}) => (
    <TableRow hover sx={{'&:last-child td, &:last-child th': {border: 0}}}>
        <TableCell>
            <Typography fontWeight="medium">
                {showButton ? <Link
                    href={route("acceptanceItems.show", {
                        acceptanceItem: test.id,
                        acceptance: test.acceptance_id
                    })}>{test?.method_test?.test?.name}</Link> : test?.method_test?.test?.name}
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
            {!test?.patients?.length ? test?.samples?.map((sample, sampleIndex) => (
                <React.Fragment key={sampleIndex}>
                    {sample.patients.map((patient, patientIndex) =>
                        <Chip
                            key={patientIndex}
                            label={patient.fullName || patient.name}
                            size="small"
                            sx={{m: 0.5}}
                        />)}
                    {sampleIndex !== test.samples.length - 1 && <Divider/>}
                </React.Fragment>
            )) : test?.patients?.map((patient, patientIndex) =>
                <Chip
                    key={patientIndex}
                    label={patient.name}
                    size="small"
                    sx={{m: 0.5}}
                />)}
        </TableCell>

        <TableCell>
            {test?.details ? (
                <Box sx={{maxWidth: 200, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis'}}>
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

        {(onEdit || onDelete) && <TableCell align="center">
            <Stack direction="row" spacing={1} justifyContent="center">
                {onEdit && <Tooltip title="Edit test">
                    <IconButton onClick={onEdit} size="small">
                        <EditIcon color="primary"/>
                    </IconButton>
                </Tooltip>}
                {onDelete && <Tooltip title="Remove test">
                    <IconButton onClick={onDelete} size="small">
                        <DeleteIcon color="error"/>
                    </IconButton>
                </Tooltip>}
            </Stack>
        </TableCell>}
    </TableRow>
);

export default TestRow;
