import { Box } from '@mui/material';
import { BRAND, COMPANY } from './company';
import { formatDate } from './format';

export const SectionTitle = ({ children }) => (
    <Box
        sx={{
            mb: '2mm',
            fontSize: '7.5pt',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BRAND.sky,
        }}
    >
        {children}
    </Box>
);

const Field = ({ label, children }) =>
    children ? (
        <Box sx={{ display: 'flex', gap: '2mm' }}>
            <Box component="span" sx={{ minWidth: '22mm', color: BRAND.muted }}>
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

const Name = ({ children }) => (
    <Box sx={{ fontSize: '10.5pt', fontWeight: 700, color: BRAND.ink }}>{children}</Box>
);

const PartiesSection = ({ pr }) => {
    const supplier = pr.supplier;
    const contact = supplier?.contacts?.find((c) => c.is_primary) ?? supplier?.contacts?.[0];
    const supplierAddress = [supplier?.address, supplier?.city, supplier?.country]
        .filter(Boolean)
        .join(', ');

    return (
        <Box sx={{ display: 'flex', gap: '5mm', mt: '6mm' }}>
            <Panel title="Supplier">
                {supplier ? (
                    <>
                        <Name>{supplier.name}</Name>
                        {supplierAddress && (
                            <Box sx={{ mb: '1mm', color: BRAND.muted }}>{supplierAddress}</Box>
                        )}
                        <Field label="Contact">
                            {contact && [contact.name, contact.title].filter(Boolean).join(', ')}
                        </Field>
                        <Field label="Phone">{contact?.phone || contact?.mobile}</Field>
                        <Field label="Email">{contact?.email}</Field>
                        <Field label="Tax No.">{supplier.tax_number}</Field>
                        <Field label="Terms">{supplier.payment_terms}</Field>
                    </>
                ) : (
                    <Box sx={{ color: BRAND.muted, fontStyle: 'italic' }}>
                        To be confirmed when the order is issued
                    </Box>
                )}
            </Panel>

            <Panel title="Deliver to">
                <Name>{COMPANY.name}</Name>
                <Box sx={{ mb: '1mm', color: BRAND.muted }}>{COMPANY.address}</Box>
                <Field label="Expected">
                    {pr.expected_delivery_date && formatDate(pr.expected_delivery_date)}
                </Field>
            </Panel>
        </Box>
    );
};

export default PartiesSection;
