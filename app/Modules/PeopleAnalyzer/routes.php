<?php

use App\Modules\PeopleAnalyzer\Controllers\PeopleAnalyzerController;
use Illuminate\Support\Facades\Route;

Route::get('/people-analyzer', [PeopleAnalyzerController::class, 'index'])->name('people-analyzer.index');
Route::post('/people-analyzer', [PeopleAnalyzerController::class, 'store'])->name('people-analyzer.store');
Route::post('/people-analyzer/standard', [PeopleAnalyzerController::class, 'upsertStandard'])->name('people-analyzer.standard.upsert');
Route::patch('/people-analyzer/{evaluation}', [PeopleAnalyzerController::class, 'update'])->name('people-analyzer.update');
Route::delete('/people-analyzer/{evaluation}', [PeopleAnalyzerController::class, 'destroy'])->name('people-analyzer.destroy');
