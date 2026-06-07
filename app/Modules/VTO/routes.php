<?php

use App\Modules\VTO\Controllers\VTOController;
use Illuminate\Support\Facades\Route;

Route::get('/vto', [VTOController::class, 'index'])->name('vto.index');
Route::post('/vto', [VTOController::class, 'update'])->name('vto.update');
