<?php

use App\Http\Controllers\Api\Billing\BillingDashboardDataController;
use App\Http\Controllers\Api\Billing\ListContractOffersController;
use App\Http\Controllers\Api\Billing\ListDiscountPartnersController;
use App\Http\Controllers\Api\Billing\BillingTrendController;
use App\Http\Controllers\Api\Billing\GetInvoiceController;
use App\Http\Controllers\Api\Billing\ListReferrerInvoicesController;
use App\Http\Controllers\Billing\BillingDashboardController;
use App\Http\Controllers\Billing\DailyCashReportController;
use App\Http\Controllers\Billing\DiscountCardController;
use App\Http\Controllers\Billing\DiscountPartnerController;
use App\Http\Controllers\Billing\DiscountUsageReportController;
use App\Http\Controllers\Billing\ExportDiscountUsageController;
use App\Http\Controllers\Billing\IssueDiscountCardsController;
use App\Http\Controllers\Billing\PrintDiscountCardBatchController;
use App\Http\Controllers\Billing\RevokeDiscountCardController;
use App\Http\Controllers\Billing\ExportInvoicesController;
use App\Http\Controllers\Billing\InvoiceController;
use App\Http\Controllers\Billing\InvoiceItemController;
use App\Http\Controllers\Billing\PaymentController;
use App\Http\Controllers\Billing\ShowStatementController;
use App\Http\Controllers\Billing\StatementController;
use App\Http\Controllers\Billing\StatementExportController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "billing"], function () {
    Route::get("dashboard", BillingDashboardController::class)->name("billing.dashboard");
    Route::get("invoices/export", ExportInvoicesController::class)->name("invoices.export");
    Route::resource("invoices", InvoiceController::class);
    Route::post("invoices/{invoice}/items/{item}/unlock", [InvoiceItemController::class, "unlock"])
        ->name("invoices.items.unlock");
    Route::post("invoices/{invoice}/items/rebuild", [InvoiceItemController::class, "rebuild"])
        ->name("invoices.items.rebuild");
    Route::get("statements/{statement}/export", StatementExportController::class)->name("statements.export");
    Route::get("statements/{statement}/view", ShowStatementController::class)->name("statements.view");
    Route::resource("statements", StatementController::class)->except("show");
    Route::resource("payments", PaymentController::class);

    Route::resource("discount-partners", DiscountPartnerController::class)->except("create", "edit", "show");
    Route::post("discount-cards/issue", IssueDiscountCardsController::class)->name("discountCards.issue");
    Route::post("discount-cards/{discountCard}/revoke", RevokeDiscountCardController::class)->name("discountCards.revoke");
    Route::get("discount-card-batches/{batch}/print", PrintDiscountCardBatchController::class)->name("discountCardBatches.print");
    Route::resource("discount-cards", DiscountCardController::class)->only("index", "update");
    Route::get("discount-usage/export", ExportDiscountUsageController::class)->name("discountUsage.export");
    Route::get("discount-usage", DiscountUsageReportController::class)->name("discountUsage.index");
});

Route::group(["prefix" => "api/billing", "as" => "api."], function () {
    Route::get("invoices/{invoice}", GetInvoiceController::class)->name("invoices.show");
    Route::get("invoices-for-statement", ListReferrerInvoicesController::class)->name("invoices.forStatement");
    Route::get("daily-cash-report", DailyCashReportController::class)->name("dailyCashReport.export");
    Route::get("statements/{statement}", [StatementController::class, "show"])->name("statements.show");
    Route::get("dashboard-data", BillingDashboardDataController::class)->name("billing.dashboard.data");
    Route::get("dashboard-trend", BillingTrendController::class)->name("billing.dashboard.trend");
    Route::get("discount-partners", ListDiscountPartnersController::class)->name("discountPartners.list");
    Route::get("contract-offers", ListContractOffersController::class)->name("contractOffers.list");
});
