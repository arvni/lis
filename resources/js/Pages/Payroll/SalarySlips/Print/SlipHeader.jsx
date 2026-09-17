import { Box } from '@mui/material';
import { BRAND, COMPANY } from '@/Pages/Inventory/PurchaseRequests/Print/company';
import { formatDate } from '@/Pages/Inventory/PurchaseRequests/Print/format';
import { SectionTitle } from '@/Pages/Inventory/PurchaseRequests/Print/PartiesSection';

const Field = ({ label, children }) =>
    children ? (
        <Box sx={{ display: 'flex', gap: '2mm' }}>
            <Box component="span" sx={{ minWidth: '24mm', color: BRAND.muted }}>
                {label}
            </Box>
            <span>{children}</span>
        </Box>
    ) : null;

const Panel = ({ title, children }) => (
    <Box
        sx={{
            flex: 1,
            minWidth: 0,
            p: '4mm',
            border: `1px solid ${BRAND.rule}`,
            borderRadius: '2mm',
            bgcolor: BRAND.tint,
            fontSize: '8.5pt',
            lineHeight: 1.6,
        }}
    >
        <SectionTitle>{title}</SectionTitle>
        {children}
    </Box>
);

/** The month the slip covers, written the way a person would say it. */
const monthLabel = (from) =>
    new Date(from).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

const SlipHeader = ({ slip }) => (
    <>
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '6mm',
                pb: '4mm',
                borderBottom: `2px solid ${BRAND.navy}`,
            }}
        >
            <Box sx={{ display: 'flex', gap: '4mm', alignItems: 'flex-start' }}>
                <Box
                    component="img"
                    src={COMPANY.logo}
                    alt=""
                    sx={{ height: '16mm', width: 'auto' }}
                />
                <Box sx={{ fontSize: '8pt', lineHeight: 1.5, color: BRAND.muted }}>
                    <Box sx={{ fontSize: '11pt', fontWeight: 700, color: BRAND.ink }}>
                        {COMPANY.name}
                    </Box>
                    <Box>{COMPANY.address}</Box>
                    <Box>
                        {COMPANY.phone} · {COMPANY.email}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ textAlign: 'right', fontSize: '8.5pt', lineHeight: 1.6 }}>
                <Box
                    sx={{
                        fontSize: '13pt',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: BRAND.navy,
                    }}
                >
                    Salary Slip
                </Box>
                <Box sx={{ color: BRAND.muted }}>{monthLabel(slip.from)}</Box>
                <Box sx={{ color: BRAND.muted }}>
                    {formatDate(slip.from)} – {formatDate(slip.to)}
                </Box>
                {/* Only an issued slip carries a number, so a draft prints without one. */}
                {slip.number && (
                    <Box sx={{ fontWeight: 700, color: BRAND.ink }}>{slip.number}</Box>
                )}
            </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: '5mm', mt: '6mm' }}>
            <Panel title="Employee">
                <Box sx={{ fontSize: '10.5pt', fontWeight: 700, color: BRAND.ink }}>
                    {slip.person.name}
                </Box>
                <Field label="Staff no.">{slip.person.attendance_number}</Field>
                <Field label="Position">{slip.contract.position}</Field>
                <Field label="Employment">{slip.contract.employment_type_label}</Field>
            </Panel>

            <Panel title="Contract">
                <Field label="Started">{formatDate(slip.contract.start_date)}</Field>
                <Field label="Ends">
                    {slip.contract.end_date ? formatDate(slip.contract.end_date) : 'Open-ended'}
                </Field>
                <Field label="Working day">
                    {slip.contract.working_day_minutes
                        ? `${(slip.contract.working_day_minutes / 60).toFixed(2).replace(/\.?0+$/, '')} hours`
                        : 'No shift assigned'}
                </Field>
                <Field label="Reference">{slip.contract.reference}</Field>
            </Panel>
        </Box>
    </>
);

export default SlipHeader;
