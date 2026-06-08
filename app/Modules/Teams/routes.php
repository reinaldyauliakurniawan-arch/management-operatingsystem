<?php

use App\Modules\Teams\Controllers\TeamSwitchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/teams/switch', [TeamSwitchController::class, 'store'])->name('teams.switch');
});
