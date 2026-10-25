<?php

use App\Http\Controllers\PreOrder\FlowController;
use App\Http\Controllers\PreOrder\PreOrderActionController as Actions;
use App\Http\Controllers\PreOrder\PreOrderController;
use App\Http\Controllers\PreOrder\PreOrderReportController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'pre-orders', 'as' => 'pre-orders.'], function () {
    Route::get('/', [PreOrderController::class, 'index'])->name('index');
    Route::get('finance', [PreOrderController::class, 'finance'])->name('finance');
    Route::get('reports', [PreOrderReportController::class, 'index'])->name('reports');
    Route::get('reports/export', [PreOrderReportController::class, 'export'])->name('reports.export');
    Route::get('flows', [FlowController::class, 'index'])->name('flows.index');
    Route::get('flows/{flow}', [FlowController::class, 'edit'])->name('flows.edit');
    Route::put('flows/{flow}', [FlowController::class, 'update'])->name('flows.update');
    Route::post('flows/{flow}/copy', [FlowController::class, 'copy'])->name('flows.copy');
    Route::post('flows/{flow}/active', [FlowController::class, 'setActive'])->name('flows.active');
    Route::get('{preOrder}', [PreOrderController::class, 'show'])->name('show');
    Route::get('{preOrder}/documents/{hash}', [PreOrderController::class, 'document'])->whereUuid('hash')->name('documents.show');

    Route::post('{preOrder}/open-review', [Actions::class, 'openReview'])->name('open-review');
    Route::post('{preOrder}/assign', [Actions::class, 'assign'])->name('assign');
    Route::post('{preOrder}/main-test', [Actions::class, 'setMainTest'])->name('main-test');
    Route::post('{preOrder}/items', [Actions::class, 'addTest'])->name('items.store');
    Route::delete('{preOrder}/items/{item}', [Actions::class, 'dropItem'])->whereNumber('item')->name('items.destroy');
    Route::post('{preOrder}/items/{item}/method', [Actions::class, 'setItemMethod'])->whereNumber('item')->name('items.method');
    Route::post('{preOrder}/items/{item}/pre-test', [Actions::class, 'setPreTest'])->whereNumber('item')->name('items.pre-test');
    Route::post('{preOrder}/requests', [Actions::class, 'raiseRequest'])->name('requests.store');
    Route::post('{preOrder}/requests/{number}/close', [Actions::class, 'closeRequest'])->whereNumber('number')->name('requests.close');
    Route::post('{preOrder}/confirm', [Actions::class, 'confirm'])->name('confirm');
    Route::post('{preOrder}/finance/verify', [Actions::class, 'verifyFinance'])->name('finance.verify');
    Route::post('{preOrder}/finance/revise', [Actions::class, 'reviseQuotation'])->name('finance.revise');
    Route::post('{preOrder}/next-step', [Actions::class, 'confirmNextStep'])->name('next-step');
    Route::post('{preOrder}/batches/close', [Actions::class, 'closeBatches'])->name('batches.close');
    Route::post('{preOrder}/batches/issue', [Actions::class, 'sampleIssue'])->name('batches.issue');
    Route::post('{preOrder}/testing/start', [Actions::class, 'startTesting'])->name('testing.start');
    Route::post('{preOrder}/notes', [Actions::class, 'note'])->name('notes.store');
    Route::post('{preOrder}/documents', [Actions::class, 'document'])->name('documents.store');
    Route::post('{preOrder}/hold', [Actions::class, 'hold'])->name('hold');
    Route::post('{preOrder}/resume', [Actions::class, 'resume'])->name('resume');
    Route::post('{preOrder}/close', [Actions::class, 'close'])->name('close');
});
