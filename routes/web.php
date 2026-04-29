<?php

use App\Http\Controllers\Api\ListRoleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Document\DocumentController;
use App\Http\Controllers\Document\UpdateBatchDocumentsController;
use App\Http\Controllers\Document\UploadPublicDocumentController;
use App\Http\Controllers\GetUserDetailsController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ListUsersController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->user())
        return redirect()->route("dashboard");
    else
        return redirect()->route("login");
});

Route::get('ping', fn() => response()->json(['status' => 'ok']))->name('ping');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::group(["prefix" => "user-management"], function () {
        Route::resource("users", UserController::class);
        Route::resource("roles", RoleController::class);
    });

    Route::resource("/documents", DocumentController::class)->except(["index", "edit", "create"]);
    Route::get("/documents/{document}/download", [DocumentController::class, "download"])->name("documents.download");
    Route::put("/batch-documents", UpdateBatchDocumentsController::class)->name("documents.batchUpdate");

    Route::resource("settings", SettingController::class)->only("index", "update");

    Route::get("import", [ImportController::class, "create"])->name("import");
    Route::post("import", [ImportController::class, "store"])->name("import.store");

    Route::post("upload-public", UploadPublicDocumentController::class)->name("upload-public");

    Route::group(["prefix" => "api", "as" => "api."], function () {
        Route::get("roles", ListRoleController::class)->name("roles.list");
        Route::get("users", ListUsersController::class)->name("users.list");
        Route::get("users/{user}", GetUserDetailsController::class)->name("users.show");
        Route::get("documents/{document}", [DocumentController::class, "download"])->name("api.documents.show");
    });

    require __DIR__ . '/reception.php';
    require __DIR__ . '/laboratory.php';
    require __DIR__ . '/billing.php';
    require __DIR__ . '/referrer.php';
    require __DIR__ . '/consultation.php';
    require __DIR__ . '/notification.php';
    require __DIR__ . '/qc.php';
    require __DIR__ . '/system.php';
    require __DIR__ . '/inventory.php';
    require __DIR__ . '/monitoring.php';
});

require __DIR__ . '/auth.php';
