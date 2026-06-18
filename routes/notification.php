<?php

use App\Http\Controllers\Notification\DeleteNotificationsController;
use App\Http\Controllers\Notification\GetUnreadNotificationsController;
use App\Http\Controllers\Notification\ListNotificationController;
use App\Http\Controllers\Notification\MarkAllNotificationsAsReadController;
use App\Http\Controllers\Notification\MarkNotificationsAsReadController;
use App\Http\Controllers\Notification\MarkNotificationsAsUnreadController;
use App\Http\Controllers\Notification\ShowNotificationPageController;
use App\Http\Controllers\Notification\WhatsappMessageController;
use Illuminate\Support\Facades\Route;

Route::group(["prefix" => "notifications"], function () {
    Route::get("/", ShowNotificationPageController::class)->name("notifications");
    Route::resource("whatsappMessages", WhatsappMessageController::class);
});

Route::group(["prefix" => "api/notifications", "as" => "api."], function () {
    Route::get("/", ListNotificationController::class)->name("notifications.index");
    Route::get("/unread", GetUnreadNotificationsController::class)->name("notifications.unread");
    Route::post("/mark-as-read", MarkNotificationsAsReadController::class)->name("notifications.markAsRead");
    Route::post("/mark-as-unread", MarkNotificationsAsUnreadController::class)->name("notifications.markAsUnread");
    Route::post("/mark-all-as-read", MarkAllNotificationsAsReadController::class)->name("notifications.markAllAsRead");
    Route::delete("/", DeleteNotificationsController::class)->name("notifications.delete");
});
