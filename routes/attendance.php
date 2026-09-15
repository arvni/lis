<?php

use App\Http\Controllers\Attendance\Api\ListActiveShiftsController;
use App\Http\Controllers\Attendance\AttendanceTransactionController;
use App\Http\Controllers\Attendance\HolidayController;
use App\Http\Controllers\Attendance\ShiftController;
use App\Http\Controllers\Attendance\UserShiftController;
use Illuminate\Support\Facades\Route;

Route::prefix('attendance')->name('attendance.')->group(function () {
    Route::resource('shifts', ShiftController::class)->except('create', 'edit', 'show');
    Route::resource('holidays', HolidayController::class)->except('create', 'edit', 'show');
    Route::get('punches', [AttendanceTransactionController::class, 'index'])->name('transactions.index');
});

Route::prefix('api/attendance')->name('api.attendance.')->group(function () {
    Route::get('shifts', ListActiveShiftsController::class)->name('shifts.list');
    Route::get('users/{user}/shift-assignments', [UserShiftController::class, 'index'])->name('users.shift-assignments.index');
    Route::post('users/{user}/shift-assignments', [UserShiftController::class, 'store'])->name('users.shift-assignments.store');
    Route::delete('users/{user}/shift-assignments/{userShift}', [UserShiftController::class, 'destroy'])->name('users.shift-assignments.destroy');
});
