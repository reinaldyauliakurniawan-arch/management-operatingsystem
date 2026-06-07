<?php

use App\Modules\AccountabilityChart\Controllers\AccountabilityChartController;
use Illuminate\Support\Facades\Route;

Route::get('/accountability-chart', [AccountabilityChartController::class, 'index'])->name('accountability.index');
Route::post('/accountability-chart', [AccountabilityChartController::class, 'store'])->name('accountability.store');
Route::patch('/accountability-chart/{seat}', [AccountabilityChartController::class, 'update'])->name('accountability.update');
Route::delete('/accountability-chart/{seat}', [AccountabilityChartController::class, 'destroy'])->name('accountability.destroy');
