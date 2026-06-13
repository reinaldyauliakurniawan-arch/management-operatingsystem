<?php

use App\Modules\IDS\Controllers\IDSController;
use Illuminate\Support\Facades\Route;

Route::get('/ids', [IDSController::class, 'index'])->name('ids.index');
Route::post('/ids', [IDSController::class, 'store'])->name('ids.store');
Route::patch('/ids/{issue}', [IDSController::class, 'update'])->name('ids.update');
Route::patch('/ids/{issue}/resolve', [IDSController::class, 'resolve'])->name('ids.resolve');
Route::delete('/ids/{issue}', [IDSController::class, 'destroy'])->name('ids.destroy');
