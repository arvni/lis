' Paste this entire block into the code window of the UserForm named frmAddItem.
' Required controls (exact Name property values):
'
'  Labels    : lblStatus, lblCount
'  TextBoxes : txtName, txtScientificName, txtMinStock, txtMaxStock,
'              txtLeadTime, txtNotes, txtConversion1, txtConversion2
'  ComboBoxes: cmbDepartment, cmbMaterialType, cmbStorageCondition,
'              cmbDefaultUnit, cmbIsHazardous, cmbRequiresLotTracking,
'              cmbExtraUnit1, cmbExtraUnit2
'  Buttons   : btnAdd, btnClear, btnClose

Option Explicit

Private wsData  As Worksheet
Private wsUnits As Worksheet
Private itemsAdded As Long

' ─── Initialise ───────────────────────────────────────────────────────────────

Private Sub UserForm_Initialize()
    Set wsData  = ThisWorkbook.Worksheets("Items")
    Set wsUnits = ThisWorkbook.Worksheets("_units")
    itemsAdded = 0

    Call PopulateStaticDropdowns
    Call PopulateUnitDropdowns
    Call ResetForm
    Call UpdateCount
End Sub

Private Sub PopulateStaticDropdowns()
    With cmbDepartment
        .AddItem "LAB"
        .AddItem "ADM"
        .AddItem "MNT"
        .AddItem "CLN"
        .AddItem "IT"
        .AddItem "FAC"
    End With

    With cmbMaterialType
        .AddItem "CHM"
        .AddItem "SLD"
        .AddItem "LQD"
        .AddItem "ELC"
        .AddItem "CSM"
        .AddItem "BIO"
        .AddItem "GLS"
        .AddItem "PPE"
        .AddItem "RGT"
        .AddItem "OTH"
    End With

    With cmbStorageCondition
        .AddItem "ROOM_TEMP"
        .AddItem "REFRIGERATED"
        .AddItem "FROZEN"
        .AddItem "ULTRA_FROZEN"
        .AddItem "DRY_COOL"
        .AddItem "FLAMMABLE_CABINET"
    End With

    With cmbIsHazardous
        .AddItem "no"
        .AddItem "yes"
    End With

    With cmbRequiresLotTracking
        .AddItem "yes"
        .AddItem "no"
    End With
End Sub

Private Sub PopulateUnitDropdowns()
    Dim i       As Long
    Dim lastRow As Long
    Dim u       As String

    cmbDefaultUnit.Clear
    cmbExtraUnit1.Clear
    cmbExtraUnit2.Clear

    ' blank entry for optional extra-unit fields
    cmbExtraUnit1.AddItem ""
    cmbExtraUnit2.AddItem ""

    lastRow = wsUnits.Cells(wsUnits.Rows.Count, "A").End(xlUp).Row
    For i = 1 To lastRow
        u = Trim(CStr(wsUnits.Cells(i, 1).Value))
        If u <> "" Then
            cmbDefaultUnit.AddItem u
            cmbExtraUnit1.AddItem u
            cmbExtraUnit2.AddItem u
        End If
    Next i
End Sub

' ─── Add Item ─────────────────────────────────────────────────────────────────

Private Sub btnAdd_Click()
    If Not ValidateForm() Then Exit Sub

    Dim r As Long
    r = NextDataRow()

    wsData.Cells(r, 1).Value  = Trim(txtName.Text)             ' name
    wsData.Cells(r, 2).Value  = Trim(txtScientificName.Text)   ' scientific_name
    wsData.Cells(r, 3).Value  = cmbDepartment.Value            ' department
    wsData.Cells(r, 4).Value  = cmbMaterialType.Value          ' material_type
    wsData.Cells(r, 5).Value  = cmbStorageCondition.Value      ' storage_condition
    wsData.Cells(r, 6).Value  = cmbDefaultUnit.Value           ' default_unit
    wsData.Cells(r, 7).Value  = ToNumOrEmpty(txtMinStock.Text) ' minimum_stock_level
    wsData.Cells(r, 8).Value  = ToNumOrEmpty(txtMaxStock.Text) ' maximum_stock_level
    wsData.Cells(r, 9).Value  = ToNumOrEmpty(txtLeadTime.Text) ' lead_time_days
    wsData.Cells(r, 10).Value = cmbIsHazardous.Value           ' is_hazardous
    wsData.Cells(r, 11).Value = cmbRequiresLotTracking.Value   ' requires_lot_tracking
    wsData.Cells(r, 12).Value = Trim(txtNotes.Text)            ' notes
    wsData.Cells(r, 13).Value = cmbExtraUnit1.Value            ' extra_unit_1
    wsData.Cells(r, 14).Value = ToNumOrEmpty(txtConversion1.Text) ' conversion_1
    wsData.Cells(r, 15).Value = cmbExtraUnit2.Value            ' extra_unit_2
    wsData.Cells(r, 16).Value = ToNumOrEmpty(txtConversion2.Text) ' conversion_2

    itemsAdded = itemsAdded + 1
    SetStatus "'" & Trim(txtName.Text) & "' added (row " & r & ").", True
    Call UpdateCount
    Call ResetForm
End Sub

' ─── Clear / Close ────────────────────────────────────────────────────────────

Private Sub btnClear_Click()
    Call ResetForm
    SetStatus "", False
End Sub

Private Sub btnClose_Click()
    Unload Me
End Sub

' ─── Validation ───────────────────────────────────────────────────────────────

Private Function ValidateForm() As Boolean
    ValidateForm = False

    If Trim(txtName.Text) = "" Then
        SetStatus "Item Name is required.", False
        txtName.SetFocus
        Exit Function
    End If

    If Not IsNumericOrEmpty(txtMinStock.Text) Then
        SetStatus "Min Stock Level must be a number.", False
        txtMinStock.SetFocus
        Exit Function
    End If

    If Not IsNumericOrEmpty(txtMaxStock.Text) Then
        SetStatus "Max Stock Level must be a number.", False
        txtMaxStock.SetFocus
        Exit Function
    End If

    If Not IsNumericOrEmpty(txtLeadTime.Text) Then
        SetStatus "Lead Time must be a whole number.", False
        txtLeadTime.SetFocus
        Exit Function
    End If

    If Not IsNumericOrEmpty(txtConversion1.Text) Then
        SetStatus "Conversion Factor 1 must be a number.", False
        txtConversion1.SetFocus
        Exit Function
    End If

    If Not IsNumericOrEmpty(txtConversion2.Text) Then
        SetStatus "Conversion Factor 2 must be a number.", False
        txtConversion2.SetFocus
        Exit Function
    End If

    If cmbDefaultUnit.Value = "" Then
        SetStatus "Default Unit is required.", False
        cmbDefaultUnit.SetFocus
        Exit Function
    End If

    ValidateForm = True
End Function

' ─── Helpers ──────────────────────────────────────────────────────────────────

Private Function IsNumericOrEmpty(v As String) As Boolean
    IsNumericOrEmpty = (Trim(v) = "" Or IsNumeric(Trim(v)))
End Function

Private Function ToNumOrEmpty(v As String) As Variant
    Dim t As String
    t = Trim(v)
    If t = "" Then
        ToNumOrEmpty = ""
    Else
        ToNumOrEmpty = CDbl(t)
    End If
End Function

Private Function NextDataRow() As Long
    Dim r As Long
    r = wsData.Cells(wsData.Rows.Count, "A").End(xlUp).Row + 1
    If r < 2 Then r = 2
    NextDataRow = r
End Function

Private Sub ResetForm()
    txtName.Text              = ""
    txtScientificName.Text    = ""
    cmbDepartment.Value       = "LAB"
    cmbMaterialType.Value     = "OTH"
    cmbStorageCondition.Value = "ROOM_TEMP"
    cmbDefaultUnit.Value      = ""
    txtMinStock.Text          = ""
    txtMaxStock.Text          = ""
    txtLeadTime.Text          = ""
    cmbIsHazardous.Value      = "no"
    cmbRequiresLotTracking.Value = "yes"
    txtNotes.Text             = ""
    cmbExtraUnit1.Value       = ""
    txtConversion1.Text       = ""
    cmbExtraUnit2.Value       = ""
    txtConversion2.Text       = ""
    txtName.SetFocus
End Sub

Private Sub UpdateCount()
    Dim total As Long
    total = wsData.Cells(wsData.Rows.Count, "A").End(xlUp).Row - 1
    If total < 0 Then total = 0
    lblCount.Caption = "Items in sheet: " & total
End Sub

Private Sub SetStatus(msg As String, success As Boolean)
    lblStatus.Caption  = msg
    If success Then
        lblStatus.ForeColor = RGB(22, 163, 74)  ' green
    Else
        lblStatus.ForeColor = RGB(220, 38, 38)  ' red
    End If
End Sub
