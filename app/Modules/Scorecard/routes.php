<?php

use App\Modules\Scorecard\Controllers\ScorecardController;
use Illuminate\Support\Facades\Route;

Route::get('/scorecard', [ScorecardController::class, 'index'])->name('scorecard.index');
Route::post('/scorecard', [ScorecardController::class, 'store'])->name('scorecard.store');
Route::post('/scorecard/log', [ScorecardController::class, 'logScore'])->name('scorecard.log');
