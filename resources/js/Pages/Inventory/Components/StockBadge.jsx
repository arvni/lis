import {Chip} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export const StockBadge = ({isLowStock, isExpiringSoon, isExpired}) => {
    if (isExpired)
        return <Chip icon={<ErrorIcon/>} label="EXPIRED" color="error" size="small"/>;
    if (isLowStock)
        return <Chip icon={<WarningIcon/>} label="LOW STOCK" color="warning" size="small"/>;
    if (isExpiringSoon)
        return <Chip icon={<AccessTimeIcon/>} label="EXPIRING SOON" color="warning" size="small" variant="outlined"/>;
    return null;
};

export default StockBadge;
