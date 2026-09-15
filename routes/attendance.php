<?php

use App\Http\Controllers\Attendance\HolidayController;
use App\Http\Controllers\Attendance\ShiftController;
use Illuminate\Support\Facades\Route;

Route::prefix('attendance')->name('attendance.')->group(function () {
    Route::resource('shifts', ShiftController::class)->except('create', 'edit', 'show');
    Route::resource('holidays', HolidayController::class)->except('create', 'edit', 'show');
});
