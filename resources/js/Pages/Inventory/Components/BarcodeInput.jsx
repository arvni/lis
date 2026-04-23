import {useState, useRef} from "react";
import {InputAdornment, TextField, CircularProgress, Tooltip} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import axios from "axios";

/**
 * Barcode scan input. Fires lookup on Enter keypress (barcode scanners append Enter).
 *
 * Props:
 *   value      – current barcode string
 *   onChange   – fn(barcode) — called as user types
 *   onFound    – fn(data)    — called when barcode matched a lot or history line
 *   onNotFound – fn(barcode) — called when barcode is new/unknown
 *   size       – MUI size
 *   disabled   – bool
 */
const BarcodeInput = ({value, onChange, onFound, onNotFound, size = "small", disabled = false}) => {
    const [status, setStatus] = useState("idle"); // idle | scanning | found | new
    const inputRef = useRef(null);

    const scan = async (barcode) => {
        if (!barcode) return;
        setStatus("scanning");
        try {
            const {data} = await axios.get(route("api.inventory.barcode.scan"), {params: {barcode}});
            if (data.found) {
                setStatus("found");
                onFound?.(data);
            } else {
                setStatus("new");
                onNotFound?.(barcode);
            }
        } catch {
            setStatus("new");
            onNotFound?.(barcode);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            scan(value);
        }
    };

    const handleChange = (e) => {
        setStatus("idle");
        onChange(e.target.value);
    };

    const endIcon = () => {
        if (status === "scanning") return <CircularProgress size={14}/>;
        if (status === "found")   return <Tooltip title="Barcode matched — fields auto-filled"><CheckCircleIcon fontSize="small" color="success"/></Tooltip>;
        if (status === "new")     return <Tooltip title="New barcode — fill details manually"><HelpOutlineIcon fontSize="small" color="warning"/></Tooltip>;
        return <QrCodeScannerIcon fontSize="small" color="disabled"/>;
    };

    return (
        <TextField
            inputRef={inputRef}
            size={size}
            fullWidth
            label="Barcode (scan or type + Enter)"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            InputProps={{
                endAdornment: <InputAdornment position="end">{endIcon()}</InputAdornment>,
            }}
        />
    );
};

export default BarcodeInput;
