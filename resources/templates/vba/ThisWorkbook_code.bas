' Paste this code into the ThisWorkbook module (not a new module).
' It auto-opens the Add Item form one second after the workbook loads.

Option Explicit

Private Sub Workbook_Open()
    Application.OnTime Now + TimeValue("00:00:01"), "ShowAddItemForm"
End Sub
