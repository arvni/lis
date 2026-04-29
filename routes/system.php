<?php

use App\Http\Controllers\System\AuditLogController;
use App\Http\Controllers\System\FailedJobController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "system", "as" => "system."], function () {
    Route::get("audit-log", AuditLogController::class)->name("auditLog");
    Route::middleware("indexProvider")->get("failed-jobs", [FailedJobController::class, "index"])->name("failed-jobs");
    Route::post("failed-jobs/{uuid}/retry", [FailedJobController::class, "retry"])->name("failed-jobs.retry");
    Route::delete("failed-jobs/{uuid}", [FailedJobController::class, "destroy"])->name("failed-jobs.destroy");
    Route::post("failed-jobs/retry-all", [FailedJobController::class, "retryAll"])->name("failed-jobs.retryAll");
    Route::post("failed-jobs/flush", [FailedJobController::class, "destroyAll"])->name("failed-jobs.flush");
});
