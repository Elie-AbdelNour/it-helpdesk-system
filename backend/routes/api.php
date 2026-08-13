<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TicketAttachmentController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/login/otp/request', [AuthController::class, 'requestOtp']);
Route::post('/login/otp/verify', [AuthController::class, 'loginWithOtp']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/admin/ping', function (Request $request) {
        return response()->json(['message' => 'RBAC ok', 'user' => $request->user()->fullname]);
    })->middleware('role:Admin,Manager');

    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
    Route::post('/tickets/{ticket}/escalate', [TicketController::class, 'escalate']);
    Route::post('/tickets/{ticket}/status', [TicketController::class, 'changeStatus']);
    Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
    Route::get('/tickets/{ticket}/history', [TicketController::class, 'history']);
    Route::post('/tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store']);
    Route::get('/tickets/{ticket}/attachments/{attachment}/download', [TicketAttachmentController::class, 'download']);
    Route::delete('/tickets/{ticket}/attachments/{attachment}', [TicketAttachmentController::class, 'destroy']);
    Route::apiResource('tickets', TicketController::class);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/roles', [LookupController::class, 'roles'])->middleware('role:Admin');
    Route::get('/admin/users', [UserController::class, 'index'])->middleware('role:Admin');
    Route::post('/admin/users', [UserController::class, 'store'])->middleware('role:Admin');
    Route::patch('/admin/users/{user}', [UserController::class, 'update'])->middleware('role:Admin');
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])
        ->middleware('role:Admin,Manager');
    Route::post('/admin/categories', [CategoryController::class, 'store'])->middleware('role:Admin');
    Route::patch('/admin/categories/{category}', [CategoryController::class, 'update'])->middleware('role:Admin');

    Route::get('/categories', [LookupController::class, 'categories']);
    Route::get('/priorities', [LookupController::class, 'priorities']);
    Route::get('/statuses', [LookupController::class, 'statuses']);
    Route::get('/assignable-users', [LookupController::class, 'assignableUsers'])
        ->middleware('role:Admin,Manager,IT Support Agent');
});
