<?php

use App\Modules\ToDo\Controllers\ToDoController;
use Illuminate\Support\Facades\Route;

Route::get('/todos', [ToDoController::class, 'index'])->name('todos.index');
Route::post('/todos', [ToDoController::class, 'store'])->name('todos.store');
// ponytail: carry-forward must be before {todo} param routes to avoid
// Laravel matching 'carry-forward' as a {todo} ID.
Route::post('/todos/carry-forward', [ToDoController::class, 'carryForward'])->name('todos.carryForward');
Route::patch('/todos/{todo}/toggle', [ToDoController::class, 'toggle'])->name('todos.toggle');
Route::patch('/todos/{todo}', [ToDoController::class, 'update'])->name('todos.update');
Route::delete('/todos/{todo}', [ToDoController::class, 'destroy'])->name('todos.destroy');
