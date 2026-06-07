<?php

use App\Modules\L10Meeting\Controllers\L10MeetingController;
use Illuminate\Support\Facades\Route;

Route::get('/l10', [L10MeetingController::class, 'index'])->name('l10.index');
Route::get('/l10/create', [L10MeetingController::class, 'create'])->name('l10.create');
Route::post('/l10', [L10MeetingController::class, 'store'])->name('l10.store');
Route::get('/l10/{meeting}/workspace', [L10MeetingController::class, 'workspace'])->name('l10.workspace');
Route::post('/l10/{meeting}/finish', [L10MeetingController::class, 'finish'])->name('l10.finish');
