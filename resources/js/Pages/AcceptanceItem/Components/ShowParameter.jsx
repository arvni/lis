import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const ShowParameter = ({parameter}) => {
    const renderParameterValue = () => {
        switch (parameter.type) {
            case "file":

                if (parameter.value)
                    return <a href={route("documents.download", parameter.value.id)}
                              target={"_blank"}>{parameter.value.originalName}</a>
                return null;
            default :
                return <Typography>{parameter.value}</Typography>
        }
    }
    return <Stack direction={"row"} spacing={1}>
        <strong>{parameter.name}: </strong>
        {renderParameterValue()}
    </Stack>;
}
export default ShowParameter;
