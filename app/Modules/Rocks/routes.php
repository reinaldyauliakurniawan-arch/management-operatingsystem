<?php

use App\Modules\Rocks\Controllers\RockController;
use Illuminate\Support\Facades\Route;

Route::get('/rocks', [RockController::class, 'index'])->name('rocks.index');
Route::post('/rocks', [RockController::class, 'store'])->name('rocks.store');

// ponytail: milestone routes MUST be before {rock} param routes to avoid
// Laravel matching 'milestones' as a {rock} ID.
Route::post('/rocks/{rock}/milestones', [RockController::class, 'storeMilestone'])->name('rocks.milestones.store');
Route::patch('/rocks/milestones/{milestone}/toggle', [RockController::class, 'toggleMilestone'])->name('rocks.milestones.toggle');
Route::delete('/rocks/milestones/{milestone}', [RockController::class, 'destroyMilestone'])->name('rocks.milestones.destroy');

Route::patch('/rocks/{rock}/status', [RockController::class, 'updateStatus'])->name('rocks.updateStatus');
Route::patch('/rocks/{rock}', [RockController::class, 'update'])->name('rocks.update');
Route::delete('/rocks/{rock}', [RockController::class, 'destroy'])->name('rocks.destroy');
