import React, { useState } from "react";
import {
    TableCell,
    TableRow,
    IconButton,
    Stack,
    Tooltip,
    Chip,
    Box,
    Divider,
    Typography,
    Button,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Badge
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restore as RestoreIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Science as ScienceIcon,
    LocalHospital as ServiceIcon,
    Warning as WarningIcon
} from "@mui/icons-material";
import { Link } from "@inertiajs/react";

const PatientChips = ({ patients, maxVisible = 3 }) => {
    const [showAll, setShowAll] = useState(false);

    if (!patients?.length) return null;

    const visiblePatients = showAll ? patients : patients.slice(0, maxVisible);
    const remainingCount = patients.length - maxVisible;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
            {visiblePatients.map((patient, index) => (
                <Chip
                    key={index}
                    label={patient.fullName || patient.name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                />
            ))}
            {remainingCount > 0 && !showAll && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(true)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    +{remainingCount} more
                </Button>
            )}
            {showAll && patients.length > maxVisible && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(false)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    Show less
                </Button>
            )}
        </Box>
    );
};

const DetailsCell = ({ details, maxLength = 100 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!details) {
        return (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No details available
            </Typography>
        );
    }

    const shouldTruncate = details.length > maxLength;
    const displayText = expanded || !shouldTruncate
        ? details
        : `${details.substring(0, maxLength)}...`;

    return (
        <Box>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {displayText}
            </Typography>
            {shouldTruncate && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ minWidth: 'auto', p: 0, mt: 0.5, fontSize: '0.75rem' }}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                    {expanded ? 'Show less' : 'Read more'}
                </Button>
            )}
        </Box>
    );
};

const TestTypeChip = ({ type, testTypes }) => {
    const getTypeConfig = (type) => {
        switch (type) {
            case 'TEST':
                return {
                    color: 'info',
                    icon: <ScienceIcon sx={{ fontSize: 12 }} />,
                    variant: 'filled'
                };
            case 'SERVICE':
                return {
                    color: 'success',
                    icon: <ServiceIcon sx={{ fontSize: 12 }} />,
                    variant: 'filled'
                };
            default:
                return {
                    color: 'warning',
                    icon: <WarningIcon sx={{ fontSize: 12 }} />,
                    variant: 'outlined'
                };
        }
    };

    const config = getTypeConfig(type);
    const label = testTypes[type] || 'Unknown';

    return (
        <Chip
            label={label}
            size="small"
            color={config.color}
            variant={config.variant}
            icon={config.icon}
            sx={{
                fontWeight: 'medium',
                '& .MuiChip-icon': {
                    ml: 0.5
                }
            }}
        />
    );
};

const ActionButtons = ({ test, onEdit, onDelete, onRestore }) => {
    if (test?.deleted) {
        return (
            <Tooltip title="Restore test">
                <IconButton
                    onClick={onRestore}
                    size="small"
                    color="success"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'success.main',
                            color: 'white'
                        }
                    }}
                >
                    <RestoreIcon />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <>
            <Stack direction="row" spacing={1} justifyContent="center">
                {onEdit && (
                    <Tooltip title="Edit test">
                        <IconButton
                            onClick={onEdit}
                            size="small"
                            color="primary"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip title="Remove test">
                        <IconButton
                            onClick={onDelete}
                            size="small"
                            color="error"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'error.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
        </>
    );
};

const PriceDisplay = ({ price, discount }) => {
    const hasDiscount = Number(discount) > 0;

    return (
        <Box sx={{ textAlign: 'right' }}>
            <Typography
                variant="body2"
                fontWeight="medium"
                color={hasDiscount ? "success.main" : "text.primary"}
            >
                {price}
            </Typography>
            {hasDiscount && (
                <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: 'block' }}
                >
                    -{discount} discount
                </Typography>
            )}
        </Box>
    );
};

const TestRow = ({
                     test,
                     testTypes,
                     onEdit,
                     onDelete,
                     onRestore,
                     showButton = false
                 }) => {
    const isDeleted = test?.deleted;
    const testName = test?.method_test?.test?.name;
    const testCode = test?.method_test?.test?.code;
    const testFullName = test?.method_test?.test?.fullName;
    const testType = test?.method_test?.test?.type;
    const methodName = test?.method_test?.method?.name;

    // Handle deleted tests with alert row
    if (isDeleted) {
        return (
            <TableRow>
                <TableCell colSpan={10}>
                    <Alert
                        severity="warning"
                        variant="outlined"
                        action={
                            <ActionButtons
                                test={test}
                                onRestore={onRestore}
                            />
                        }
                    >
                        <Typography variant="body2">
                            Test "{testName}" has been removed
                        </Typography>
                    </Alert>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow
            hover
            sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
            }}
        >
            {/* Test Name */}
            <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                    <ScienceIcon color="primary" sx={{ fontSize: 16 }} />
                    {showButton ? (
                        <Link
                            href={route("acceptanceItems.show", {
                                acceptanceItem: test.id,
                                acceptance: test.acceptance_id
                            })}
                            style={{ textDecoration: 'none' }}
                        >
                            <Button
                                variant="text"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    fontWeight: 'medium'
                                }}
                            >
                                {testName}
                            </Button>
                        </Link>
                    ) : (
                        <Typography variant="body2" fontWeight="medium">
                            {testName}
                        </Typography>
                    )}
                </Box>
            </TableCell>

            {/* Test Code */}
            <TableCell>
                <Chip
                    label={testCode}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }}
                />
            </TableCell>

            {/* Full Name */}
            <TableCell sx={{ maxWidth: 200 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {testFullName}
                </Typography>
            </TableCell>

            {/* Test Type */}
            <TableCell>
                <TestTypeChip type={testType} testTypes={testTypes} />
            </TableCell>

            {/* Method */}
            <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                    <Badge
                        badgeContent=""
                        color="secondary"
                        variant="dot"
                        sx={{
                            '& .MuiBadge-dot': {
                                width: 6,
                                height: 6
                            }
                        }}
                    >
                        <Typography variant="body2">
                            {methodName}
                        </Typography>
                    </Badge>
                </Box>
            </TableCell>

            {/* Patients */}
            <TableCell>
                {!test?.patients?.length ? (
                    test?.samples?.map((sample, sampleIndex) => (
                        <Box key={sampleIndex} sx={{ mb: sampleIndex < test.samples.length - 1 ? 1 : 0 }}>
                            <PatientChips patients={sample.patients} />
                            {sampleIndex < test.samples.length - 1 && (
                                <Divider sx={{ my: 1 }} />
                            )}
                        </Box>
                    ))
                ) : (
                    <PatientChips patients={test?.patients} />
                )}
            </TableCell>

            {/* Details */}
            <TableCell sx={{ maxWidth: 250 }}>
                <DetailsCell details={test?.details} />
            </TableCell>

            {/* Discount */}
            <TableCell>
                <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={Number(test.discount) > 0 ? "success.main" : "text.primary"}
                    sx={{ textAlign: 'right' }}
                >
                    {test.discount}
                </Typography>
            </TableCell>

            {/* Price */}
            <TableCell>
                <PriceDisplay price={test.price} discount={test.discount} />
            </TableCell>

            {/* Actions */}
            {(onEdit || onDelete || onRestore) && (
                <TableCell align="center">
                    <ActionButtons
                        test={test}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onRestore={onRestore}
                    />
                </TableCell>
            )}
        </TableRow>
    );
};

export default TestRow;
