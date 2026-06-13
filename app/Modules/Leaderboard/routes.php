<?php

use App\Modules\Leaderboard\Controllers\LeaderboardController;
use Illuminate\Support\Facades\Route;

// View
Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');

// Parameters
Route::post('/leaderboard/parameters', [LeaderboardController::class, 'storeParameter'])->name('leaderboard.parameters.store');
Route::patch('/leaderboard/parameters/{parameter}', [LeaderboardController::class, 'updateParameter'])->name('leaderboard.parameters.update');
Route::delete('/leaderboard/parameters/{parameter}', [LeaderboardController::class, 'destroyParameter'])->name('leaderboard.parameters.destroy');

// Manual entries
Route::post('/leaderboard/entries', [LeaderboardController::class, 'storeEntry'])->name('leaderboard.entries.store');
Route::patch('/leaderboard/entries/{entry}', [LeaderboardController::class, 'updateEntry'])->name('leaderboard.entries.update');
Route::delete('/leaderboard/entries/{entry}', [LeaderboardController::class, 'destroyEntry'])->name('leaderboard.entries.destroy');
