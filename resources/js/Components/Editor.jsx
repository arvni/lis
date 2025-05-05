import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import {useEffect, useState} from "react";

const Editor = ({value, onChange, name, ...rest}) => {
    const [templates, setTemplates] = useState([]);
    const handleChange = (v) => {
        onChange({
            target: {
                name,
                value: v
            }
        })
    }
    useEffect(() => {
        if (rest.templates)
            setTemplates(rest.templates)
    }, [rest.templates]);
    return <SunEditor {...rest} name={name} defaultValue={value} width={"100%"} onChange={handleChange}
                      setOptions={{
                          templates: templates ?? [],
                          imageAccept: "jpg,png,jpeg",
                          imageUploadSizeLimit: "10000000",
                          imageResizing: true,
                          buttonList: [
                              // default
                              [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                              ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                              ['fontColor', 'hiliteColor', 'textStyle'],
                              ['removeFormat'],
                              ['outdent', 'indent'],
                              ['table'],
                              ['align', 'horizontalRule', 'list', 'lineHeight'],
                              ['image', 'link'],
                              ['undo', 'redo'],
                              ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save', 'template'],
                              // (min-width: 992)
                              ['%992', [
                                  ['undo', 'redo'],
                                  [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                                  ['bold', 'underline', 'italic', 'strike'],
                                  [':t-More Text-default.more_text', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle'],
                                  ['removeFormat'],
                                  ['outdent', 'indent'],
                                  ['align', 'horizontalRule', 'list', 'lineHeight'],
                                  ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save'],
                                  ['-right', ':r-More Rich-default.more_plus', 'table', 'video', 'audio']
                              ]],
                              // (min-width: 767)
                              ['%767', [
                                  ['undo', 'redo'],
                                  [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                                  [':t-More Text-default.more_text', 'bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle'],
                                  ['removeFormat'],
                                  ['outdent', 'indent'],
                                  [':e-More Line-default.more_horizontal', 'align', 'horizontalRule', 'list', 'lineHeight'],
                                  [':r-More Rich-default.more_plus', 'table', 'link', 'image', 'video'],
                                  ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save']
                              ]],
                              // (min-width: 480)
                              ['%480', [
                                  ['undo', 'redo'],
                                  [':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
                                  [':t-More Text-default.more_text', 'bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'fontColor', 'hiliteColor', 'textStyle', 'removeFormat'],
                                  [':e-More Line-default.more_horizontal', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'lineHeight'],
                                  [':r-More Rich-default.more_plus', 'table', 'link', 'image', 'video', 'audio'],
                                  ['-right', ':i-More Misc-default.more_vertical', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save']
                              ]],
                          ]
                      }} height={"calc(100vh - 400px)"}/>
}

export default Editor;
