import React from 'react';
import { Link } from '@inertiajs/react';
import { Button, Chip, Tooltip } from '@mui/material';
import {
    Edit,
    ThumbDownAlt,
    ThumbUpAlt,
    VisibilityOffOutlined,
    Report as ReportIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import PageHeader from '@/Components/PageHeader.jsx';

const ReportHeader = ({
    report,
    statusChip,
    canEdit,
    canApprove,
    canUnpublish,
    onEdit,
    onApprove,
    onReject,
    onUnpublish,
}) => (
    <PageHeader
        title={`Report #${report.id}`}
        icon={<ReportIcon />}
        subtitle={
            <Chip
                icon={statusChip.icon}
                label={statusChip.label}
                color={statusChip.color}
                size="small"
            />
        }
        actions={[
            <Tooltip title="View Acceptance Item" key="view-acceptance-item">
                <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    href={route('acceptanceItems.show', {
                        acceptance: report.acceptance_item.acceptance_id,
                        acceptanceItem: report.acceptance_item.id,
                    })}
                    startIcon={<VisibilityIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 'medium',
                    }}
                >
                    View Acceptance Item
                </Button>
            </Tooltip>,
            canEdit ? (
                <Tooltip title="Edit Report" key="edit-report">
                    <Button
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={onEdit}
                        startIcon={<Edit />}
                    >
                        Edit
                    </Button>
                </Tooltip>
            ) : null,
            canApprove && !report.approver ? (
                <React.Fragment key="approve-reject">
                    <Tooltip title="Reject Report">
                        <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={onReject}
                            startIcon={<ThumbDownAlt />}
                        >
                            Reject
                        </Button>
                    </Tooltip>
                    <Tooltip title="Approve Report">
                        <Button
                            size="small"
                            variant="contained"
                            onClick={onApprove}
                            startIcon={<ThumbUpAlt />}
                        >
                            Approve
                        </Button>
                    </Tooltip>
                </React.Fragment>
            ) : null,
            canUnpublish && report.publisher ? (
                <Tooltip title="Unpublish Report">
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={onUnpublish}
                        startIcon={<VisibilityOffOutlined />}
                    >
                        Unpublish
                    </Button>
                </Tooltip>
            ) : null,
        ]}
    />
);

export default ReportHeader;
