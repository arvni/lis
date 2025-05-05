import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {Divider} from "@mui/material";
import Grid from "@mui/material/Grid2";

const renderElement = (value, level) => (key, index) => {
    level += 1;
    if (typeof value[key] != "object")
        return <Grid item display="flex"
                     xs={12}
                     gap={2}
                     alignItems="center">
            <Typography align="left" variant="h6">
                {key}
            </Typography>
            <Typography align="right">
                {value[key]}
            </Typography>
        </Grid>
    return <DashboardCard title={key} value={value[key]} level={level}/>
}
const DashboardCard = ({title, value, level = 0}) => {
    level += 1;
    return <Grid item xs={level == 1 ? 6 : 12} padding={2}>
        <Paper sx={{p: "1em", height: "100%"}}>
            <Divider><Typography variant={"h" + (level + 3)}>{title}</Typography></Divider>
            <Grid container spacing={2}>
                {Object.keys(value).map(renderElement(value, level))}
            </Grid>
        </Paper>
    </Grid>
}
export default DashboardCard;
