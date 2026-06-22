import Grid from '@mui/material/Grid';
import { Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import DocumentSelectItem, { SelectedDocumentValue } from './DocumentSelectItem';

const PublishedReportSelect = ({ documents, value, onChange, processing }) => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={12}>
            <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <PictureAsPdf fontSize="small" />
                Published Report
            </Typography>

            <FormControl fullWidth variant="outlined">
                <InputLabel id="published-report-label">Select Published Report</InputLabel>
                <Select
                    labelId="published-report-label"
                    id="published-report-select"
                    value={value || ''}
                    onChange={onChange}
                    label="Select Published Report"
                    disabled={processing || documents.length === 0}
                    renderValue={(selected) => (
                        <SelectedDocumentValue
                            document={documents.find((doc) => (doc.hash ?? doc.id) === selected)}
                            chipColor="primary"
                        />
                    )}
                >
                    {documents.length === 0 ? (
                        <MenuItem disabled>
                            <Typography color="text.secondary">
                                No PDF documents available
                            </Typography>
                        </MenuItem>
                    ) : (
                        documents.map((document) => (
                            <MenuItem
                                key={document.hash ?? document.id}
                                value={document.hash ?? document.id}
                            >
                                <DocumentSelectItem document={document} chipColor="primary" />
                            </MenuItem>
                        ))
                    )}
                </Select>
            </FormControl>
        </Grid>
    </Grid>
);

export default PublishedReportSelect;
