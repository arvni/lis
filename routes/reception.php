<?php

use App\Http\Controllers\Api\Reception\ListPatientsController;
use App\Http\Controllers\Api\Reception\ListReferrerAcceptanceReportedOrExpectedToBeReportedController;
use App\Http\Controllers\Api\Reception\ListTagsController;
use App\Http\Controllers\Api\Reception\TATAnalyticsController;
use App\Http\Controllers\Api\Reception\TATItemsController;
use App\Http\Controllers\Document\DownloadReportController;
use App\Http\Controllers\Reception\AcceptanceController;
use App\Http\Controllers\Reception\AcceptanceItemStateController;
use App\Http\Controllers\Reception\AcceptancePrescriptionController;
use App\Http\Controllers\Reception\AddPoolingController;
use App\Http\Controllers\Reception\Api\GetAcceptancePoolingItemsController;
use App\Http\Controllers\Reception\ApproveFinancialController;
use App\Http\Controllers\Reception\ApproveReportController;
use App\Http\Controllers\Reception\CancelAcceptanceController;
use App\Http\Controllers\Reception\CheckAcceptanceItemWorkflowController;
use App\Http\Controllers\Reception\CheckAcceptanceStatusController;
use App\Http\Controllers\Reception\CreateReportController;
use App\Http\Controllers\Reception\EnterSectionSampleController;
use App\Http\Controllers\Reception\ExportAcceptanceItemsController;
use App\Http\Controllers\Reception\ExportAcceptancesController;
use App\Http\Controllers\Reception\FinancialCheckController;
use App\Http\Controllers\Reception\GetPatientWithIdNoController;
use App\Http\Controllers\Reception\GetPrevSectionsController;
use App\Http\Controllers\Reception\ListAcceptanceItemReadyReportController;
use App\Http\Controllers\Reception\ListAcceptanceItemsController;
use App\Http\Controllers\Reception\ListApprovingReportController;
use App\Http\Controllers\Reception\ListBarcodesController;
use App\Http\Controllers\Reception\PatientController;
use App\Http\Controllers\Reception\PrintAcceptanceBarcodeController;
use App\Http\Controllers\Reception\PrintAcceptanceController;
use App\Http\Controllers\Reception\PrintAcceptanceSamplesController;
use App\Http\Controllers\Reception\PublishAcceptanceController;
use App\Http\Controllers\Reception\PublishReportController;
use App\Http\Controllers\Reception\RejectReportController;
use App\Http\Controllers\Reception\RelativeController;
use App\Http\Controllers\Reception\ReportController;
use App\Http\Controllers\Reception\SampleCollectionController;
use App\Http\Controllers\Reception\SampleController;
use App\Http\Controllers\Reception\ShowAcceptanceItemController;
use App\Http\Controllers\Reception\TagAssignmentController;
use App\Http\Controllers\Reception\TagController;
use App\Http\Controllers\Reception\TATDashboardController;
use App\Http\Controllers\Reception\ToggleReportlessAcceptanceItemController;
use App\Http\Controllers\Reception\ToggleSamplelessAcceptanceItemController;
use App\Http\Controllers\Reception\UnPublishReportController;
use App\Http\Controllers\Reception\UpdateAcceptancePriorityController;
use App\Http\Controllers\Reception\UpdatePatientMetaController;
use App\Http\Controllers\Reception\WaitingForPublishController;
use App\Http\Controllers\ShowSectionController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "reception"], function () {
    Route::resource("patients", PatientController::class);
    Route::put("/patients/{patient}/patient-metas", UpdatePatientMetaController::class)
        ->name("patients.updateMetas");
    Route::resource("relatives", RelativeController::class)->only(["store", "update", "destroy"]);
    Route::get("acceptances/financial-check", FinancialCheckController::class)->name("acceptances.financialCheck");
    Route::get("acceptances/export", ExportAcceptancesController::class)->name("acceptances.export");
    Route::resource("acceptances", AcceptanceController::class)->except("create", "store");
    Route::get("acceptances/{acceptance}/print", PrintAcceptanceController::class)->name("acceptances.print");
    Route::get("acceptances/{acceptance}/print-samples", PrintAcceptanceSamplesController::class)->name("acceptances.printSamples");
    Route::get("acceptances/{acceptance}/barcodes", PrintAcceptanceBarcodeController::class)->name("acceptances.barcodes");
    Route::put("acceptances/{acceptance}/tags", [TagAssignmentController::class, "syncAcceptance"])->name("acceptances.tags.update");
    Route::put("acceptances/{acceptance}/cancel", CancelAcceptanceController::class)->name("acceptances.cancel");
    Route::patch("acceptances/{acceptance}/priority", UpdateAcceptancePriorityController::class)->name("acceptances.updatePriority");
    Route::get("tat-dashboard", TATDashboardController::class)->name("tat.dashboard");
    Route::post("acceptances/{acceptance}/pooling", AddPoolingController::class)->name("acceptances.addPooling");
    Route::put("acceptances/{acceptance}/check-status", CheckAcceptanceStatusController::class)->name("acceptances.checkStatus");
    Route::post("acceptances/{acceptance}/prescription", AcceptancePrescriptionController::class)
        ->name("acceptances.prescription");
    Route::get("patients/{patient}/acceptances/create", [AcceptanceController::class, "create"])->name("acceptances.create");
    Route::post("patients/{patient}/acceptances", [AcceptanceController::class, "store"])->name("acceptances.store");
    Route::get("sample-collection", SampleCollectionController::class)->name("sampleCollection");
    Route::resource("samples", SampleController::class)->except("create", "edit");
    Route::get(
        "acceptances/{acceptance}/acceptance-items/{acceptanceItem}",
        ShowAcceptanceItemController::class
    )->name("acceptanceItems.show");
    Route::put("acceptanceItemStates/bulk-update", [AcceptanceItemStateController::class, "bulkUpdate"])->name("acceptanceItemStates.bulkUpdate");
    Route::resource("acceptanceItemStates", AcceptanceItemStateController::class)->only("show", "update");
    Route::get("acceptanceItems", ListAcceptanceItemsController::class)->name("acceptanceItems.index");
    Route::get("acceptanceItems/export", ExportAcceptanceItemsController::class)->name("acceptanceItems.export");
    Route::put("acceptanceItems/{acceptanceItem}/tags", [TagAssignmentController::class, "syncAcceptanceItem"])->name("acceptanceItems.tags.update");
    Route::get("acceptanceItems/{acceptanceItem}/check-workflow", CheckAcceptanceItemWorkflowController::class)->name("acceptanceItems.check-workflow");
    Route::put("acceptances/{acceptance}/acceptance-items/{acceptanceItem}/toggle-reportless", ToggleReportlessAcceptanceItemController::class)->name("acceptanceItems.toggleReportless");
    Route::put("acceptances/{acceptance}/acceptance-items/{acceptanceItem}/toggle-sampleless", ToggleSamplelessAcceptanceItemController::class)->name("acceptanceItems.toggleSampleless");
    Route::get("acceptanceItemStates/{acceptanceItemState}/prev-sections", GetPrevSectionsController::class)->name("acceptanceItemStates.prevSections");
    Route::get("reports/waiting-list", ListAcceptanceItemReadyReportController::class)->name("reports.waitingList");
    Route::get("reports/approving-ist", ListApprovingReportController::class)->name("reports.approvingList");
    Route::get("acceptanceItems/{acceptanceItem}/create-report", CreateReportController::class)->name("acceptanceItems.createReport");
    Route::put("acceptances/{acceptance}/approve-financial", ApproveFinancialController::class)->name("acceptances.approveFinancial");
    Route::get("reports/publishing", WaitingForPublishController::class)->name("reports.publishing");
    Route::resource("reports", ReportController::class)->except("create");
    Route::get("reports/{report}/download", DownloadReportController::class)->name("reports.download");
    Route::put("reports/{report}/approve", ApproveReportController::class)->name("reports.approve");
    Route::put("reports/{report}/reject", RejectReportController::class)->name("reports.reject");
    Route::put("reports/{report}/publish", PublishReportController::class)->name("reports.publish");
    Route::put("reports/{report}/unpublish", UnPublishReportController::class)->name("reports.unpublish");
    Route::put("acceptances/{acceptance}/publish", PublishAcceptanceController::class)->name("acceptances.publish");
    Route::resource("tags", TagController::class)->only(["index", "update", "destroy"]);
});

Route::get("sections/{section}", ShowSectionController::class)->name("sections.show");
Route::post("sections/{section}/enter", EnterSectionSampleController::class)->name("sections.enter");

Route::group(["prefix" => "api/reception", "as" => "api."], function () {
    Route::get("acceptances/reported", ListReferrerAcceptanceReportedOrExpectedToBeReportedController::class)
        ->name("acceptances.reported");
    Route::get("patients/{idNo}", GetPatientWithIdNoController::class)->name("patients.getByIdNo");
    Route::get("patients", ListPatientsController::class)->name("patients.list");
    Route::get("tags", ListTagsController::class)->name("tags.list");
    Route::get("sample-collection/{acceptance}", ListBarcodesController::class)->name("sampleCollection.list");
    Route::get("acceptances/{acceptance}/pooling-items", GetAcceptancePoolingItemsController::class)->name("acceptances.poolingItems");
    Route::get("tat/items", TATItemsController::class)->name("tat.items");
    Route::get("tat/analytics", TATAnalyticsController::class)->name("tat.analytics");
});
