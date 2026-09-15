<?php

use App\Http\Controllers\Attendance\Api\ListActiveShiftsController;
use App\Http\Controllers\Attendance\Api\ListCalendarPeopleController;
use App\Http\Controllers\Attendance\Api\ListLeavePeopleController;
use App\Http\Controllers\Attendance\AttendanceCalendarController;
use App\Http\Controllers\Attendance\AttendanceDayController;
use App\Http\Controllers\Attendance\AttendanceTransactionController;
use App\Http\Controllers\Attendance\ExportAttendanceDaysController;
use App\Http\Controllers\Attendance\HolidayController;
use App\Http\Controllers\Attendance\LeaveKindController;
use App\Http\Controllers\Attendance\LeaveRequestController;
use App\Http\Controllers\Attendance\ShiftController;
use App\Http\Controllers\Attendance\UserShiftController;
use Illuminate\Support\Facades\Route;

Route::prefix('attendance')->name('attendance.')->group(function () {
    Route::resource('shifts', ShiftController::class)->except('create', 'edit', 'show');
    Route::resource('holidays', HolidayController::class)->except('create', 'edit', 'show');
    Route::get('punches', [AttendanceTransactionController::class, 'index'])->name('transactions.index');
    Route::post('punches/import', [AttendanceTransactionController::class, 'import'])->name('transactions.import');
    Route::get('calendar', [AttendanceCalendarController::class, 'index'])->name('calendar.index');
    Route::get('calendar/export', [AttendanceCalendarController::class, 'export'])->name('calendar.export');
    Route::get('calendar/export-summary', [AttendanceCalendarController::class, 'exportSummary'])->name('calendar.export-summary');
    Route::get('days', [AttendanceDayController::class, 'index'])->name('days.index');
    Route::get('days/export', ExportAttendanceDaysController::class)->name('days.export');
    Route::put('days/{attendanceDay}', [AttendanceDayController::class, 'update'])->name('days.update');
    Route::put('days/{attendanceDay}/reset', [AttendanceDayController::class, 'reset'])->name('days.reset');
    Route::resource('leave-kinds', LeaveKindController::class)->except('create', 'edit', 'show');
    Route::get('leave-requests', [LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::post('leave-requests', [LeaveRequestController::class, 'store'])->name('leave-requests.store');
    Route::put('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->name('leave-requests.approve');
    Route::put('leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->name('leave-requests.reject');
    Route::put('leave-requests/{leaveRequest}/cancel', [LeaveRequestController::class, 'cancel'])->name('leave-requests.cancel');
});

Route::prefix('api/attendance')->name('api.attendance.')->group(function () {
    Route::get('shifts', ListActiveShiftsController::class)->name('shifts.list');
    Route::get('leave-people', ListLeavePeopleController::class)->name('leave-people.list');
    Route::get('calendar-people', ListCalendarPeopleController::class)->name('calendar-people.list');
    Route::get('users/{user}/shift-assignments', [UserShiftController::class, 'index'])->name('users.shift-assignments.index');
    Route::post('users/{user}/shift-assignments', [UserShiftController::class, 'store'])->name('users.shift-assignments.store');
    Route::delete('users/{user}/shift-assignments/{userShift}', [UserShiftController::class, 'destroy'])->name('users.shift-assignments.destroy');
});
