<?php

use App\Http\Controllers\Api\Laboratory\GetMethodController;
use App\Http\Controllers\Api\Laboratory\ListActiveSectionsController;
use App\Http\Controllers\Api\Laboratory\ListBarcodeGroupsController;
use App\Http\Controllers\Api\Laboratory\ListDoctorsController;
use App\Http\Controllers\Api\Laboratory\ListReportTemplatesController;
use App\Http\Controllers\Api\Laboratory\ListSampleTypesController;
use App\Http\Controllers\Api\Laboratory\ListSectionGroupsController;
use App\Http\Controllers\Api\Laboratory\ListTestGroupsController;
use App\Http\Controllers\Api\Laboratory\ListTestsController;
use App\Http\Controllers\Api\Laboratory\ListWorkflowsController;
use App\Http\Controllers\Api\ListRoleController;
use App\Http\Controllers\Api\Reception\ListPatientsController;
use App\Http\Controllers\Api\Referrer\ListReferrersController;
use App\Http\Controllers\Billing\ExportInvoicesController;
use App\Http\Controllers\Billing\InvoiceController;
use App\Http\Controllers\Billing\PaymentController;
use App\Http\Controllers\Consultation\BookAnAppointmentController;
use App\Http\Controllers\Consultation\ConsultantController;
use App\Http\Controllers\Consultation\ConsultationController;
use App\Http\Controllers\Consultation\ListConsultantsController;
use App\Http\Controllers\Consultation\ListCustomersController;
use App\Http\Controllers\Consultation\ListReservationTimesController;
use App\Http\Controllers\Consultation\ListWaitingConsultationsController;
use App\Http\Controllers\Consultation\StartConsultationController;
use App\Http\Controllers\Consultation\TimeController;
use App\Http\Controllers\Consultation\UpdateCustomerToPatientWithConsultationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Document\DocumentController;
use App\Http\Controllers\Document\DownloadReportController;
use App\Http\Controllers\Document\UpdateBatchDocumentsController;
use App\Http\Controllers\Document\UploadPublicDocumentController;
use App\Http\Controllers\GetUserDetailsController;
use App\Http\Controllers\Laboratory\BarcodeGroupController;
use App\Http\Controllers\Laboratory\DoctorController;
use App\Http\Controllers\Laboratory\ExportReportTemplateParametersController;
use App\Http\Controllers\Laboratory\OfferController;
use App\Http\Controllers\Laboratory\ReportTemplateController;
use App\Http\Controllers\Laboratory\SampleTypeController;
use App\Http\Controllers\Laboratory\SectionController;
use App\Http\Controllers\Laboratory\SectionGroupController;
use App\Http\Controllers\Laboratory\TestController;
use App\Http\Controllers\Laboratory\TestGroupController;
use App\Http\Controllers\Laboratory\WorkflowController;
use App\Http\Controllers\ListUsersController;
use App\Http\Controllers\Notification\GetUnreadNotificationsController;
use App\Http\Controllers\Notification\ListNotificationController;
use App\Http\Controllers\Notification\ShowNotificationPageController;
use App\Http\Controllers\Reception\AcceptanceController;
use App\Http\Controllers\Reception\AcceptanceItemStateController;
use App\Http\Controllers\Reception\AcceptancePrescriptionController;
use App\Http\Controllers\Reception\ApproveReportController;
use App\Http\Controllers\Reception\CancelAcceptanceController;
use App\Http\Controllers\Reception\CheckAcceptanceItemWorkflowController;
use App\Http\Controllers\Reception\CreateReportController;
use App\Http\Controllers\Reception\EnterSectionSampleController;
use App\Http\Controllers\Reception\ExportAcceptanceItemsController;
use App\Http\Controllers\Reception\GetPatientWithIdNoController;
use App\Http\Controllers\Reception\GetPrevSectionsController;
use App\Http\Controllers\Reception\ListAcceptanceItemReadyReportController;
use App\Http\Controllers\Reception\ListAcceptanceItemsController;
use App\Http\Controllers\Reception\ListBarcodesController;
use App\Http\Controllers\Reception\PatientController;
use App\Http\Controllers\Reception\PrintAcceptanceBarcodeController;
use App\Http\Controllers\Reception\PrintAcceptanceController;
use App\Http\Controllers\Reception\PublishReportController;
use App\Http\Controllers\Reception\RejectReportController;
use App\Http\Controllers\Reception\RelativeController;
use App\Http\Controllers\Reception\ReportController;
use App\Http\Controllers\Reception\SampleCollectionController;
use App\Http\Controllers\Reception\SampleController;
use App\Http\Controllers\Reception\ShowAcceptanceItemController;
use App\Http\Controllers\Reception\UnPublishReportController;
use App\Http\Controllers\Reception\UpdatePatientMetaController;
use App\Http\Controllers\Referrer\ReferrerController;
use App\Http\Controllers\Referrer\ReferrerOrderController;
use App\Http\Controllers\Referrer\ReferrerTestController;
use App\Http\Controllers\Referrer\StoreReferrerOrderAcceptanceController;
use App\Http\Controllers\Referrer\StoreReferrerOrderPatientController;
use App\Http\Controllers\Referrer\StoreReferrerOrderSamplesController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ShowSectionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    if (auth()->user())
        return redirect()->route("dashboard");
    else
        return redirect()->route("login");
});


Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::group(["prefix" => "user-management"], function () {
        Route::resource("users", UserController::class);
        Route::resource("roles", RoleController::class);
    });

    Route::group(["prefix" => "reception"], function () {
        Route::resource("patients", PatientController::class);
        Route::put("/patients/{patient}/patient-metas", UpdatePatientMetaController::class)
            ->name("patients.updateMetas");
        Route::resource("relatives", RelativeController::class)->only(["store", "update", "destroy"]);
        Route::resource("acceptances", AcceptanceController::class)->except("create", "store");
        Route::get("acceptances/{acceptance}/print", PrintAcceptanceController::class)->name("acceptances.print");
        Route::get("acceptances/{acceptance}/barcodes", PrintAcceptanceBarcodeController::class)->name("acceptances.barcodes");
        Route::put("acceptances/{acceptance}/cancel", CancelAcceptanceController::class)->name("acceptances.cancel");
        Route::post("acceptances/{acceptance}/prescription", AcceptancePrescriptionController::class)
            ->name("acceptances.prescription");
        Route::get("patients/{patient}/acceptances/create", [AcceptanceController::class, "create"])->name("acceptances.create");
        Route::post("patients/{patient}/acceptances", [AcceptanceController::class, "store"])->name("acceptances.store");
        Route::get("sample-collection", SampleCollectionController::class)->name("sampleCollection");
        Route::resource("samples", SampleController::class)->except("create", "edit", "update",);
        Route::get(
            "acceptances/{acceptance}/acceptance-items/{acceptanceItem}",
            ShowAcceptanceItemController::class
        )
            ->name("acceptanceItems.show");
        Route::resource("acceptanceItemStates", AcceptanceItemStateController::class)->only("show", "update");
        Route::get("acceptanceItems", ListAcceptanceItemsController::class)->name("acceptanceItems.index");
        Route::get("acceptanceItems/export", ExportAcceptanceItemsController::class)->name("acceptanceItems.export");
        Route::get("acceptanceItems/{acceptanceItem}/check-workflow", CheckAcceptanceItemWorkflowController::class)->name("acceptanceItems.check-workflow");
        Route::get("acceptanceItemStates/{acceptanceItemState}/prev-sections", GetPrevSectionsController::class)->name("acceptanceItemStates.prevSections");

        Route::get("reports/waitingList", ListAcceptanceItemReadyReportController::class)->name("reports.waitingList");
        Route::get("acceptanceItems/{acceptanceItem}/create-report", CreateReportController::class)->name("acceptanceItems.createReport");
        Route::resource("reports", ReportController::class)->except("create");
        Route::get("reports/{report}/download", DownloadReportController::class)->name("reports.download");
        Route::put("reports/{report}/approve", ApproveReportController::class)->name("reports.approve");
        Route::put("reports/{report}/reject", RejectReportController::class)->name("reports.reject");
        Route::put("reports/{report}/publish", PublishReportController::class)->name("reports.publish");
        Route::put("reports/{report}/unpublish", UnPublishReportController::class)->name("reports.unpublish");
    });
    Route::get("sections/{section}", ShowSectionController::class)->name("sections.show");
    Route::post("sections/{section}/enter", EnterSectionSampleController::class)->name("sections.enter");

    Route::resource("/documents", DocumentController::class)->except(["index", "edit", "create"]);
    Route::get("/documents/{document}/download", [DocumentController::class, "download"])->name("documents.download");
    Route::put("/batch-documents", UpdateBatchDocumentsController::class)->name("documents.batchUpdate");

    Route::group(["prefix" => "consultation"], function () {
        Route::get("waiting-list", ListWaitingConsultationsController::class)->name("consultations.waiting-list");
        Route::resource("consultations", ConsultationController::class);
        Route::resource("consultants", ConsultantController::class);
        Route::put("consultations/{consultation}/start", StartConsultationController::class)->name("consultations.start");
        Route::get("consultants-list", ListConsultantsController::class)->name("list-consultants");
        Route::get("reservation-times", ListReservationTimesController::class)->name("list-reservation-times");
        Route::resource("times", TimeController::class)->except("create", "edit", "show",);
        Route::post("book-an-appointment", BookAnAppointmentController::class)->name("book-an-appointment");
        Route::put('convert-customer-to-patient/{time}', UpdateCustomerToPatientWithConsultationController::class)->name("update-customer-to-patient");
    });

    Route::resource("settings", SettingController::class)->only("index", "update");

    Route::group(["prefix" => "api", "as" => "api."], function () {
        Route::get("roles", ListRoleController::class)->name("roles.list");
        Route::get("users", ListUsersController::class)->name("users.list");
        Route::get("users/{user}", GetUserDetailsController::class)->name("users.show");
        Route::group(["prefix" => "laboratory"], function () {
            Route::get("section-groups", ListSectionGroupsController::class)->name("sectionGroups.list");
            Route::get("sections", ListActiveSectionsController::class)->name("sections.list");
            Route::get("test-groups", ListTestGroupsController::class)->name("testGroups.list");
            Route::get("barcode-groups", ListBarcodeGroupsController::class)->name("barcodeGroups.list");
            Route::get("doctors", ListDoctorsController::class)->name("doctors.list");
            Route::get("report-templates", ListReportTemplatesController::class)->name("reportTemplates.list");
            Route::get("sample-types", ListSampleTypesController::class)->name("sampleTypes.list");
            Route::get("workflows", ListWorkflowsController::class)->name("workflows.list");
            Route::get("tests", ListTestsController::class)->name("tests.list");
            Route::get("tests/{test}", [TestController::class, "show"])->name("tests.show");
            Route::get("methods/{method}", GetMethodController::class)->name("methods.show");
        });
        Route::group(["prefix" => "reception"], function () {
            Route::get("patients/{idNo}", GetPatientWithIdNoController::class)->name("patients.getByIdNo");
            Route::get("patients", ListPatientsController::class)->name("patients.list");
            Route::get("sample-collection/{acceptance}", ListBarcodesController::class)->name("sampleCollection.list");
        });
        Route::group(["prefix" => "referrer"], function () {
            Route::get("referrers", ListReferrersController::class)->name("referrers.list");
        });
        Route::group(["prefix" => "consultation"], function () {
            Route::get("customers", ListCustomersController::class)->name("customers.list");
        });
        Route::get("documents/{document}", [DocumentController::class, "download"])->name("api.documents.show");

        Route::group(["prefix" => "notifications"], function () {
            Route::get("/", ListNotificationController::class)->name("notifications.index");
            Route::get("/unread", GetUnreadNotificationsController::class)->name("notifications.unread");
        });

    });
    Route::group(["prefix" => "billing"], function () {
        Route::get("invoices/export", ExportInvoicesController::class)->name("invoices.export");
        Route::resource("invoices", InvoiceController::class);
        Route::resource("payments", PaymentController::class);
    });
    Route::group(["prefix" => "laboratory"], function () {
        Route::resource("sectionGroups", SectionGroupController::class)->except("create", "edit");
        Route::resource("sections", SectionController::class)->except("create", "edit", "show");
        Route::resource("workflows", WorkflowController::class)->except("show");
        Route::resource("sampleTypes", SampleTypeController::class)->except("create", "edit", "show");
        Route::resource("barcodeGroups", BarcodeGroupController::class)->except("create", "edit", "show");
        Route::resource("offers", OfferController::class)->except("create", "edit", "show");
        Route::resource("doctors", DoctorController::class)->except("create", "edit", "show");
        Route::resource("testGroups", TestGroupController::class)->except("create", "edit", "show");
        Route::resource("reportTemplates", ReportTemplateController::class)->except("create", "edit");
        Route::get("reportTemplate/{reportTemplate}/parameters", ExportReportTemplateParametersController::class)->name("reportTemplates.export-parameters");
        Route::resource("tests", TestController::class)->except("show");

    });
    Route::group(["prefix" => "referrer"], function () {
        Route::resource("referrers", ReferrerController::class);
        Route::resource("referrer-tests", ReferrerTestController::class);
        Route::post("referrer-tests/{referrerOrder}/patient", StoreReferrerOrderPatientController::class)->name("referrerOrders.patient");
        Route::post("referrer-tests/{referrerOrder}/acceptance", StoreReferrerOrderAcceptanceController::class)->name("referrerOrders.acceptance");
        Route::post("referrer-tests/{referrerOrder}/samples", StoreReferrerOrderSamplesController::class)->name("referrerOrders.samples");
        Route::resource("referrer-orders", ReferrerOrderController::class);
    });
    Route::post("upload-public", UploadPublicDocumentController::class)->name("upload-public");
    Route::get("/notifications", ShowNotificationPageController::class)->name("notifications");

});
require __DIR__ . '/auth.php';
