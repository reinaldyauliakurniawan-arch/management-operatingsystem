<?php
use App\Modules\Scorecard\Controllers\ScorecardController;
use Illuminate\Support\Facades\Route;

Route::get('/scorecard', [ScorecardController::class, 'index'])->name('scorecard.index');
Route::post('/scorecard', [ScorecardController::class, 'store'])->name('scorecard.store');
Route::post('/scorecard/log', [ScorecardController::class, 'logScore'])->name('scorecard.log');
Route::patch('/scorecard/settings', [ScorecardController::class, 'updateSettings'])->name('scorecard.settings');
Route::patch('/scorecard/{metric}', [ScorecardController::class, 'update'])->name('scorecard.update');
Route::delete('/scorecard/{metric}', [ScorecardController::class, 'destroy'])->name('scorecard.destroy');
