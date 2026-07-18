<?php

use App\Modules\Kanban\Controllers\KanbanController;
use Illuminate\Support\Facades\Route;

Route::get('/kanban', [KanbanController::class, 'index'])->name('kanban.index');

Route::post('/kanban/boards', [KanbanController::class, 'storeBoard'])->name('kanban.boards.store');
Route::patch('/kanban/boards/{board}', [KanbanController::class, 'updateBoard'])->name('kanban.boards.update');
Route::delete('/kanban/boards/{board}', [KanbanController::class, 'destroyBoard'])->name('kanban.boards.destroy');

Route::post('/kanban/boards/{board}/columns', [KanbanController::class, 'storeColumn'])->name('kanban.columns.store');
Route::patch('/kanban/columns/{column}', [KanbanController::class, 'updateColumn'])->name('kanban.columns.update');
Route::delete('/kanban/columns/{column}', [KanbanController::class, 'destroyColumn'])->name('kanban.columns.destroy');

Route::post('/kanban/columns/{column}/cards', [KanbanController::class, 'storeCard'])->name('kanban.cards.store');
Route::patch('/kanban/cards/{card}/move', [KanbanController::class, 'moveCard'])->name('kanban.cards.move');
Route::patch('/kanban/cards/{card}', [KanbanController::class, 'updateCard'])->name('kanban.cards.update');
Route::delete('/kanban/cards/{card}', [KanbanController::class, 'destroyCard'])->name('kanban.cards.destroy');

Route::post('/kanban/cards/{card}/steps', [KanbanController::class, 'storeStep'])->name('kanban.steps.store');
Route::patch('/kanban/steps/{step}/toggle', [KanbanController::class, 'toggleStep'])->name('kanban.steps.toggle');
Route::delete('/kanban/steps/{step}', [KanbanController::class, 'destroyStep'])->name('kanban.steps.destroy');

Route::post('/kanban/boards/{board}/calendar-events', [KanbanController::class, 'storeCalendarEvent'])->name('kanban.calendar-events.store');
Route::patch('/kanban/calendar-events/{calendarEvent}', [KanbanController::class, 'updateCalendarEvent'])->name('kanban.calendar-events.update');
Route::delete('/kanban/calendar-events/{calendarEvent}', [KanbanController::class, 'destroyCalendarEvent'])->name('kanban.calendar-events.destroy');
