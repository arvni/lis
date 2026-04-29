<?php

use App\Http\Controllers\QC\ApproveSampleQCController;
use App\Http\Controllers\QC\QCSamplesController;
use App\Http\Controllers\QC\RejectSampleQCController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "qc", "as" => "qc."], function () {
    Route::get("samples", QCSamplesController::class)->name("samples.index");
    Route::post("samples/{sample}/approve", ApproveSampleQCController::class)->name("samples.approve");
    Route::post("samples/{sample}/reject", RejectSampleQCController::class)->name("samples.reject");
});
