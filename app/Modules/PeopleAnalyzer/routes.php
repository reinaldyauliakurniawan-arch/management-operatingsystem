<?php

use App\Modules\PeopleAnalyzer\Controllers\PeopleAnalyzerController;
use Illuminate\Support\Facades\Route;

Route::get('/people-analyzer', [PeopleAnalyzerController::class, 'index'])->name('people.index');
Route::post('/people-analyzer', [PeopleAnalyzerController::class, 'store'])->name('people.store');
