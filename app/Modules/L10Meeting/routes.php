<?php

use App\Modules\L10Meeting\Controllers\L10MeetingController;
use Illuminate\Support\Facades\Route;

Route::get('/l10', [L10MeetingController::class, 'index'])->name('l10.index');
Route::get('/l10/create', [L10MeetingController::class, 'create'])->name('l10.create');
Route::post('/l10', [L10MeetingController::class, 'store'])->name('l10.store');
Route::get('/l10/{meeting}/workspace', [L10MeetingController::class, 'workspace'])->name('l10.workspace');
Route::post('/l10/{meeting}/start', [L10MeetingController::class, 'start'])->name('l10.start');
Route::patch('/l10/{meeting}/segue', [L10MeetingController::class, 'updateSegue'])->name('l10.segue');
Route::patch('/l10/{meeting}/conclude', [L10MeetingController::class, 'updateConclude'])->name('l10.conclude');
Route::post('/l10/{meeting}/todos', [L10MeetingController::class, 'createTodo'])->name('l10.todos.store');
Route::post('/l10/{meeting}/issues', [L10MeetingController::class, 'createIssue'])->name('l10.issues.store');
Route::post('/l10/{meeting}/finish', [L10MeetingController::class, 'finish'])->name('l10.finish');
Route::delete('/l10/{meeting}', [L10MeetingController::class, 'destroy'])->name('l10.destroy');
