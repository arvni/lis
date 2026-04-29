<?php

use App\Http\Controllers\Api\Referrer\ListReferrersController;
use App\Http\Controllers\Referrer\Api\CheckMaterialBarcodeIsAvailableController;
use App\Http\Controllers\Referrer\Api\CheckMaterialForReferrerController;
use App\Http\Controllers\Referrer\CollectRequestController;
use App\Http\Controllers\Referrer\CopyReferrerTestsFromOtherReferrerController;
use App\Http\Controllers\Referrer\ExportReferrerTestsController;
use App\Http\Controllers\Referrer\GetPatientAcceptancesController;
use App\Http\Controllers\Referrer\ListCollectRequestsController;
use App\Http\Controllers\Referrer\ListMaterialsBasedOnPackingSeriesController;
use App\Http\Controllers\Referrer\MaterialController;
use App\Http\Controllers\Referrer\OrderMaterialController;
use App\Http\Controllers\Referrer\PrintMaterialsBarcodeController;
use App\Http\Controllers\Referrer\PrintOrderMaterialController;
use App\Http\Controllers\Referrer\ReferrerController;
use App\Http\Controllers\Referrer\ReferrerOrderController;
use App\Http\Controllers\Referrer\ReferrerTestController;
use App\Http\Controllers\Referrer\SampleCollectorController;
use App\Http\Controllers\Referrer\StoreReferrerOrderAcceptanceController;
use App\Http\Controllers\Referrer\StoreReferrerOrderPatientController;
use App\Http\Controllers\Referrer\StoreReferrerOrderSamplesController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "referrer"], function () {
    Route::get("referrer/{referrer}/tests", ExportReferrerTestsController::class)
        ->name("referrer.export-tests");
    Route::post("referrer/{referrer}/tests", CopyReferrerTestsFromOtherReferrerController::class)
        ->name("referrer.copy-from-other");
    Route::resource("referrers", ReferrerController::class);
    Route::resource("referrer-tests", ReferrerTestController::class);
    Route::post("referrer-orders/{referrerOrder}/patient", StoreReferrerOrderPatientController::class)
        ->name("referrerOrders.patient");
    Route::post("referrer-orders/{referrerOrder}/acceptance", StoreReferrerOrderAcceptanceController::class)
        ->name("referrerOrders.acceptance");
    Route::post("referrer-orders/{referrerOrder}/samples", StoreReferrerOrderSamplesController::class)
        ->name("referrerOrders.samples");
    Route::resource("referrer-orders", ReferrerOrderController::class);
    Route::get("materials/packing-series", ListMaterialsBasedOnPackingSeriesController::class)
        ->name("materials.packing-series");
    Route::get("materials/packing-series/{packingSeries}/print", PrintMaterialsBarcodeController::class)
        ->name("materials.packing-series.print");
    Route::resource("materials", MaterialController::class)->except("create", "edit", "show");
    Route::resource("orderMaterials", OrderMaterialController::class)->except("create", "edit", "show");
    Route::get("orderMaterials/{orderMaterial}/print", PrintOrderMaterialController::class)
        ->name("orderMaterials.print");
    Route::resource("sample-collectors", SampleCollectorController::class);
    Route::resource("collect-requests", CollectRequestController::class);
});

Route::group(["prefix" => "api/referrer", "as" => "api."], function () {
    Route::get("referrers", ListReferrersController::class)->name("referrers.list");
    Route::get("check-materials", CheckMaterialBarcodeIsAvailableController::class)->name("materials.check");
    Route::get("check-materials-referrer", CheckMaterialForReferrerController::class)->name("materials.checkForReferrer");
    Route::get("order-materials/{orderMaterial}", [OrderMaterialController::class, "show"])->name("orderMaterials.show");
    Route::get("sample-collectors", [SampleCollectorController::class, "index"])->name("sampleCollectors.list");
    Route::get("collect-requests", ListCollectRequestsController::class)->name("collectRequests.list");
    Route::get("patient/{patient}/acceptances", GetPatientAcceptancesController::class)
        ->name("referrer.patient.acceptances");
});
