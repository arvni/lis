Attribute VB_Name = "modItemForm"
Option Explicit

' Call this from a button on the sheet or from Workbook_Open
Public Sub ShowAddItemForm()
    Load frmAddItem
    frmAddItem.Show vbModeless
End Sub
