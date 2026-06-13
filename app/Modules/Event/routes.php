<?php

use App\Modules\Event\Controllers\EventController;
use Illuminate\Support\Facades\Route;

Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::post('/events', [EventController::class, 'store'])->name('events.store');
Route::patch('/events/{event}', [EventController::class, 'update'])->name('events.update');
Route::post('/events/{event}/attend', [EventController::class, 'markAttended'])->name('events.attend');
Route::post('/events/{event}/override', [EventController::class, 'overrideAttendance'])->name('events.override');
Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
