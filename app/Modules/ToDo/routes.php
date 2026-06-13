<?php

use App\Modules\ToDo\Controllers\ToDoController;
use Illuminate\Support\Facades\Route;

Route::get('/todos', [ToDoController::class, 'index'])->name('todos.index');
Route::post('/todos', [ToDoController::class, 'store'])->name('todos.store');
Route::patch('/todos/{todo}/toggle', [ToDoController::class, 'toggle'])->name('todos.toggle');
Route::post('/todos/carry-forward', [ToDoController::class, 'carryForward'])->name('todos.carryForward');
Route::delete('/todos/{todo}', [ToDoController::class, 'destroy'])->name('todos.destroy');
