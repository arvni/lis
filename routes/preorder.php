<?php

use App\Http\Controllers\PreOrder\PreOrderActionController as Actions;
use App\Http\Controllers\PreOrder\PreOrderController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'pre-orders', 'as' => 'pre-orders.'], function () {
    Route::get('/', [PreOrderController::class, 'index'])->name('index');
    Route::get('finance', [PreOrderController::class, 'finance'])->name('finance');
    Route::get('{preOrder}', [PreOrderController::class, 'show'])->name('show');
    Route::get('{preOrder}/documents/{hash}', [PreOrderController::class, 'document'])->whereUuid('hash')->name('documents.show');

    Route::post('{preOrder}/open-review', [Actions::class, 'openReview'])->name('open-review');
    Route::post('{preOrder}/assign', [Actions::class, 'assign'])->name('assign');
    Route::post('{preOrder}/main-test', [Actions::class, 'setMainTest'])->name('main-test');
    Route::post('{preOrder}/items', [Actions::class, 'addTest'])->name('items.store');
    Route::delete('{preOrder}/items/{item}', [Actions::class, 'dropItem'])->whereNumber('item')->name('items.destroy');
    Route::post('{preOrder}/requests', [Actions::class, 'raiseRequest'])->name('requests.store');
    Route::post('{preOrder}/requests/{number}/close', [Actions::class, 'closeRequest'])->whereNumber('number')->name('requests.close');
    Route::post('{preOrder}/confirm', [Actions::class, 'confirm'])->name('confirm');
    Route::post('{preOrder}/finance/verify', [Actions::class, 'verifyFinance'])->name('finance.verify');
    Route::post('{preOrder}/finance/revise', [Actions::class, 'reviseQuotation'])->name('finance.revise');
    Route::post('{preOrder}/notes', [Actions::class, 'note'])->name('notes.store');
    Route::post('{preOrder}/hold', [Actions::class, 'hold'])->name('hold');
    Route::post('{preOrder}/resume', [Actions::class, 'resume'])->name('resume');
    Route::post('{preOrder}/close', [Actions::class, 'close'])->name('close');
});
