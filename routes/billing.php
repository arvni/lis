<?php

use App\Http\Controllers\Api\Billing\BillingDashboardDataController;
use App\Http\Controllers\Api\Billing\BillingTrendController;
use App\Http\Controllers\Api\Billing\GetInvoiceController;
use App\Http\Controllers\Api\Billing\ListReferrerInvoicesController;
use App\Http\Controllers\Billing\BillingDashboardController;
use App\Http\Controllers\Billing\DailyCashReportController;
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
    Route::get("statements/{statement}/export", StatementExportController::class)->name("statements.export");
    Route::get("statements/{statement}/view", ShowStatementController::class)->name("statements.view");
    Route::resource("statements", StatementController::class)->except("show");
    Route::resource("payments", PaymentController::class);
});

Route::group(["prefix" => "api/billing", "as" => "api."], function () {
    Route::get("invoices/{invoice}", GetInvoiceController::class)->name("invoices.show");
    Route::get("invoices-for-statement", ListReferrerInvoicesController::class)->name("invoices.forStatement");
    Route::get("daily-cash-report", DailyCashReportController::class)->name("dailyCashReport.export");
    Route::get("statements/{statement}", [StatementController::class, "show"])->name("statements.show");
    Route::get("dashboard-data", BillingDashboardDataController::class)->name("billing.dashboard.data");
    Route::get("dashboard-trend", BillingTrendController::class)->name("billing.dashboard.trend");
});
