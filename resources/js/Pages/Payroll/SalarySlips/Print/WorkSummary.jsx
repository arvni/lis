import { Box } from '@mui/material';
import { BRAND } from '@/Pages/Inventory/PurchaseRequests/Print/company';
import { SectionTitle } from '@/Pages/Inventory/PurchaseRequests/Print/PartiesSection';
import { formatMinutes } from '@/Pages/Attendance/Days/attendanceFormat';

const cell = { px: '3mm', py: '1.5mm', fontSize: '8pt', borderBottom: `1px solid ${BRAND.rule}` };

const headCell = {
    px: '3mm',
    py: '1.5mm',
    fontSize: '7pt',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: BRAND.muted,
    borderBottom: `1px solid ${BRAND.rule}`,
};

const Stat = ({ label, children }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '3mm', py: '1mm' }}>
        <Box component="span" sx={{ color: BRAND.muted }}>
            {label}
        </Box>
        <Box component="span" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {children}
        </Box>
    </Box>
);

/** Minutes as hours, or a dash when there are none — "0 h" reads as a mistake on paper. */
const hours = (minutes) => (minutes ? formatMinutes(minutes) : '—');

/** Days and hours side by side, for when no shift says how to combine them. */
const usedApart = (line) => {
    const parts = [];
    if (line.used_days) parts.push(`${line.used_days} d`);
    if (line.used_minutes) parts.push(formatMinutes(line.used_minutes));

    return parts.length ? parts.join(' · ') : '—';
};

/**
 * What the month looked like, and where the leave allowance stands.
 *
 * The leave figures cover the whole contract, not just this month: an allowance is granted once
 * for the contract's duration, so "remaining" only means anything against that whole run.
 */
const WorkSummary = ({ attendance, leaveBalance }) => (
    <Box sx={{ mt: '6mm', display: 'flex', gap: '5mm', breakInside: 'avoid' }}>
        <Box sx={{ flex: '0 0 62mm', fontSize: '8pt', lineHeight: 1.5 }}>
            <SectionTitle>This month</SectionTitle>
            <Stat label="Scheduled">{hours(attendance.scheduled_minutes)}</Stat>
            <Stat label="Worked">{hours(attendance.worked_minutes)}</Stat>
            <Stat label="Overtime">{hours(attendance.overtime_minutes)}</Stat>
            <Stat label="Late">{hours(attendance.late_minutes)}</Stat>
            <Stat label="Days present">{attendance.present_days}</Stat>
            <Stat label="Days absent">{attendance.absent_days}</Stat>
            <Stat label="Days on leave">{attendance.leave_days}</Stat>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
            <SectionTitle>Leave allowance for the contract</SectionTitle>

            {leaveBalance.lines.length === 0 ? (
                <Box sx={{ fontSize: '8pt', color: BRAND.muted, fontStyle: 'italic' }}>
                    This contract grants no leave allowance, so there is no balance to show.
                </Box>
            ) : (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead">
                        <Box component="tr">
                            <Box component="th" sx={{ ...headCell, textAlign: 'left' }}>
                                Kind
                            </Box>
                            <Box component="th" sx={{ ...headCell, textAlign: 'right' }}>
                                Entitled
                            </Box>
                            <Box component="th" sx={{ ...headCell, textAlign: 'right' }}>
                                Used
                            </Box>
                            <Box component="th" sx={{ ...headCell, textAlign: 'right' }}>
                                Remaining
                            </Box>
                        </Box>
                    </Box>
                    <Box component="tbody">
                        {leaveBalance.lines.map((line) => (
                            <Box component="tr" key={line.kind}>
                                <Box component="td" sx={cell}>
                                    {line.kind}
                                    {!line.is_paid && (
                                        <Box
                                            component="span"
                                            sx={{ color: BRAND.muted, fontSize: '7pt' }}
                                        >
                                            {' '}
                                            (unpaid)
                                        </Box>
                                    )}
                                </Box>
                                <Box component="td" sx={{ ...cell, textAlign: 'right' }}>
                                    {line.entitled_days} d
                                </Box>
                                <Box component="td" sx={{ ...cell, textAlign: 'right' }}>
                                    {/* With no shift there is no way to add days and hours
                                        together, so they are reported as they were measured. */}
                                    {leaveBalance.has_shift
                                        ? hours(line.total_used_minutes)
                                        : usedApart(line)}
                                </Box>
                                <Box
                                    component="td"
                                    sx={{
                                        ...cell,
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        // Taking more than the contract grants is worth seeing.
                                        color: line.is_overdrawn ? '#B91C1C' : BRAND.ink,
                                    }}
                                >
                                    {line.is_overdrawn ? '−' : ''}
                                    {leaveBalance.has_shift
                                        ? hours(Math.abs(line.remaining_minutes))
                                        : `${Math.abs(line.remaining_days)} d`}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {leaveBalance.lines.some((line) => line.pending_minutes > 0) && (
                <Box sx={{ mt: '2mm', fontSize: '7pt', color: BRAND.muted }}>
                    Requests still waiting for approval are not counted as used.
                </Box>
            )}
        </Box>
    </Box>
);

export default WorkSummary;
