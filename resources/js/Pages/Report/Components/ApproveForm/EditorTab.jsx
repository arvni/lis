import Grid from '@mui/material/Grid';
import { Typography, Paper } from '@mui/material';
import { EditNote } from '@mui/icons-material';
import Editor from '@/Components/Editor';

const EditorTab = ({ value, onChange, processing }) => (
    <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        <Grid size={12}>
            <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <EditNote fontSize="small" />
                Create Clinical Report
            </Typography>

            <Paper variant="outlined" sx={{ p: 1, minHeight: '300px', borderRadius: 1 }}>
                <Editor
                    value={value || ''}
                    onChange={onChange}
                    disabled={processing}
                    placeholder="Enter clinical report content here..."
                />
            </Paper>
        </Grid>
    </Grid>
);

export default EditorTab;
