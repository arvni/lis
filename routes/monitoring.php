<?php

use App\Http\Controllers\Monitoring\NodeController as MonitoringNodeController;
use App\Http\Controllers\Monitoring\NodeSamplesExportController as MonitoringNodeSamplesExportController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "monitoring", "as" => "monitoring."], function () {
    Route::get("nodes", [MonitoringNodeController::class, "index"])->name("nodes.index");
    Route::post("nodes/fetch-all", [MonitoringNodeController::class, "fetchAll"])->name("nodes.fetchAll");
    Route::get("nodes/{nodeId}", [MonitoringNodeController::class, "show"])->name("nodes.show");
    Route::put("nodes/{nodeId}/section", [MonitoringNodeController::class, "updateSection"])->name("nodes.updateSection");
    Route::post("nodes/{nodeId}/fetch", [MonitoringNodeController::class, "fetchNode"])->name("nodes.fetch");
    Route::get("nodes/{nodeId}/samples/export", MonitoringNodeSamplesExportController::class)->name("nodes.samples.export");
});
