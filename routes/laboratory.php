<?php

use App\Http\Controllers\Api\Laboratory\GetMethodController;
use App\Http\Controllers\Api\Laboratory\ListActiveSectionsController;
use App\Http\Controllers\Api\Laboratory\ListBarcodeGroupsController;
use App\Http\Controllers\Api\Laboratory\ListConsentFormsController;
use App\Http\Controllers\Api\Laboratory\ListDoctorsController;
use App\Http\Controllers\Api\Laboratory\ListInstructionsController;
use App\Http\Controllers\Api\Laboratory\ListReportTemplatesController;
use App\Http\Controllers\Api\Laboratory\ListRequestFormsController;
use App\Http\Controllers\Api\Laboratory\ListSampleTypesController;
use App\Http\Controllers\Api\Laboratory\ListSectionGroupsController;
use App\Http\Controllers\Api\Laboratory\ListTestGroupsController;
use App\Http\Controllers\Api\Laboratory\ListTestsController;
use App\Http\Controllers\Api\Laboratory\ListWorkflowsController;
use App\Http\Controllers\Laboratory\BarcodeGroupController;
use App\Http\Controllers\Laboratory\ConsentFormController;
use App\Http\Controllers\Laboratory\DoctorController;
use App\Http\Controllers\Laboratory\ExportReportTemplateParametersController;
use App\Http\Controllers\Laboratory\ExportTestsController;
use App\Http\Controllers\Laboratory\InstructionController;
use App\Http\Controllers\Laboratory\OfferController;
use App\Http\Controllers\Laboratory\ReportTemplateController;
use App\Http\Controllers\Laboratory\RequestFormController;
use App\Http\Controllers\Laboratory\SampleTypeController;
use App\Http\Controllers\Laboratory\SectionController;
use App\Http\Controllers\Laboratory\SectionGroupController;
use App\Http\Controllers\Laboratory\ShowTestListController;
use App\Http\Controllers\Laboratory\TestController;
use App\Http\Controllers\Laboratory\TestGroupController;
use App\Http\Controllers\Laboratory\ApprovalFlowController;
use App\Http\Controllers\Laboratory\WorkflowController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "laboratory"], function () {
    Route::resource("sectionGroups", SectionGroupController::class)->except("create", "edit");
    Route::resource("sections", SectionController::class)->except("create", "edit", "show");
    Route::resource("workflows", WorkflowController::class)->except("show");
    Route::resource("approvalFlows", ApprovalFlowController::class)->except("create", "edit", "show");
    Route::resource("sampleTypes", SampleTypeController::class)->except("create", "edit", "show");
    Route::resource("barcodeGroups", BarcodeGroupController::class)->except("create", "edit", "show");
    Route::resource("offers", OfferController::class)->except("create", "edit", "show");
    Route::resource("doctors", DoctorController::class)->except("create", "edit", "show");
    Route::resource("testGroups", TestGroupController::class)->except("create", "edit", "show");
    Route::resource("reportTemplates", ReportTemplateController::class)->except("create", "edit");
    Route::get("reportTemplate/{reportTemplate}/parameters", ExportReportTemplateParametersController::class)
        ->name("reportTemplates.export-parameters");
    Route::get("tests/export", ExportTestsController::class)->name("tests.export");
    Route::resource("tests", TestController::class)->except("show");
    Route::resource("requestForms", RequestFormController::class)->except("edit");
    Route::resource("consentForms", ConsentFormController::class)->except("edit", "show");
    Route::resource("instructions", InstructionController::class)->except("edit", "show");
});

Route::get("test-list", ShowTestListController::class)->middleware("can:Test List")->name("test-list");

Route::group(["prefix" => "api/laboratory", "as" => "api."], function () {
    Route::get("section-groups", ListSectionGroupsController::class)->name("sectionGroups.list");
    Route::get("sections", ListActiveSectionsController::class)->name("sections.list");
    Route::get("test-groups", ListTestGroupsController::class)->name("testGroups.list");
    Route::get("barcode-groups", ListBarcodeGroupsController::class)->name("barcodeGroups.list");
    Route::get("doctors", ListDoctorsController::class)->name("doctors.list");
    Route::get("report-templates", ListReportTemplatesController::class)->name("reportTemplates.list");
    Route::get("sample-types", ListSampleTypesController::class)->name("sampleTypes.list");
    Route::get("request-forms", ListRequestFormsController::class)->name("requestForms.list");
    Route::get("consent-forms", ListConsentFormsController::class)->name("consentForms.list");
    Route::get("instructions", ListInstructionsController::class)->name("instructions.list");
    Route::get("workflows", ListWorkflowsController::class)->name("workflows.list");
    Route::get("tests", ListTestsController::class)->name("tests.list");
    Route::get("tests/{test}", [TestController::class, "show"])->name("tests.show");
    Route::get("methods/{method}", GetMethodController::class)->name("methods.show");
});
