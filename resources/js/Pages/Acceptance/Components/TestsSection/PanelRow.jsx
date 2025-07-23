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
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import {Link} from "@inertiajs/react";

const PanelRow = ({panel, testTypes, onEdit, onDelete, showButton = false}) => (
    <>
        {panel.acceptanceItems.map((item, itemIndex) => (
            <TableRow
                key={item.id}
                hover
                sx={{
                    backgroundColor: itemIndex === 0 ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                    '&:last-child td, &:last-child th': {border: 0}
                }}
            >
                {itemIndex === 0 && (
                    <>
                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                            sx={{borderLeft: '3px solid', borderLeftColor: 'secondary.main'}}
                        >
                            <Box display="flex" alignItems="center">
                                <PlaylistAddCheckIcon color="secondary" sx={{mr: 1}}/>
                                <Typography fontWeight="medium">
                                    {panel?.panel?.name}
                                </Typography>
                            </Box>
                        </TableCell>

                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                        >
                            <Chip
                                label={panel?.panel?.code}
                                size="small"
                                variant="outlined"
                                color="secondary"
                            />
                        </TableCell>

                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                        >
                            {panel?.panel?.fullName}
                        </TableCell>

                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                        >
                            <Chip
                                label={testTypes[panel?.panel?.type]}
                                size="small"
                                color="secondary"
                            />
                        </TableCell>
                    </>
                )}

                <TableCell>
                    {showButton ?
                        <Link href={route("acceptanceItems.show", {acceptanceItem: item.id, acceptance: item.acceptance_id})}>
                            {item?.method_test?.method?.name}</Link> : item?.method_test?.method?.name}
                </TableCell>

                <TableCell>
                    {!item?.patients?.length ? item?.samples?.map((sample, sampleIndex) => (
                        <React.Fragment key={sampleIndex}>
                            {sample.patients.map((patient, patientIndex) =>
                                <Chip
                                    key={patientIndex}
                                    label={patient.fullName || patient.name}
                                    size="small"
                                    sx={{m: 0.5}}
                                />)}
                            {sampleIndex !== item.samples.length - 1 && <Divider/>}
                        </React.Fragment>
                    )) : item?.patients?.map((patient, patientIndex) =>
                        <Chip
                            key={patientIndex}
                            label={patient.name}
                            size="small"
                            sx={{m: 0.5}}
                        />)}
                </TableCell>

                <TableCell>
                    {item?.details ? (
                        <Box sx={{maxWidth: 200, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {item.details}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">No details</Typography>
                    )}
                </TableCell>

                {itemIndex === 0 && (
                    <>
                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                            align="right"
                        >
                            <Typography fontWeight="medium"
                                        color={Number(panel.discount) > 0 ? "success.main" : "text.primary"}>
                                {panel.discount}
                            </Typography>
                        </TableCell>

                        <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                            align="right"
                        >
                            <Typography fontWeight="medium">
                                {panel.price}
                            </Typography>
                        </TableCell>

                        {(onEdit || onDelete) && <TableCell
                            rowSpan={panel?.acceptanceItems?.length}
                            align="center"
                        >
                            <Stack direction="row" spacing={1} justifyContent="center">
                                {onEdit && <Tooltip title="Edit panel">
                                    <IconButton onClick={onEdit} size="small">
                                        <EditIcon color="primary"/>
                                    </IconButton>
                                </Tooltip>}
                                {onDelete && <Tooltip title="Remove panel">
                                    <IconButton onClick={onDelete} size="small">
                                        <DeleteIcon color="error"/>
                                    </IconButton>
                                </Tooltip>}
                            </Stack>
                        </TableCell>}
                    </>
                )}
            </TableRow>
        ))}
    </>
);

export default PanelRow;
