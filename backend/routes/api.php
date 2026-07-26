<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/admin/ping', function (Request $request) {
        return response()->json(['message' => 'RBAC ok', 'user' => $request->user()->fullname]);
    })->middleware('role:Admin,Manager');

    Route::apiResource('tickets', TicketController::class);

    Route::get('/categories', [LookupController::class, 'categories']);
    Route::get('/priorities', [LookupController::class, 'priorities']);
    Route::get('/statuses', [LookupController::class, 'statuses']);
});
