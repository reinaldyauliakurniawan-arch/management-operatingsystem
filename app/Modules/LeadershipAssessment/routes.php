<?php

use App\Modules\LeadershipAssessment\Controllers\LeadershipAssessmentController;
use Illuminate\Support\Facades\Route;

// Cycles
Route::get('/leadership-assessment', [LeadershipAssessmentController::class, 'index'])->name('leadership.index');
Route::post('/leadership-assessment/cycles', [LeadershipAssessmentController::class, 'storeCycle'])->name('leadership.cycles.store');
Route::patch('/leadership-assessment/cycles/{cycle}', [LeadershipAssessmentController::class, 'updateCycle'])->name('leadership.cycles.update');
Route::post('/leadership-assessment/cycles/{cycle}/close', [LeadershipAssessmentController::class, 'closeCycle'])->name('leadership.cycles.close');
Route::delete('/leadership-assessment/cycles/{cycle}', [LeadershipAssessmentController::class, 'destroyCycle'])->name('leadership.cycles.destroy');

// Assignments
Route::post('/leadership-assessment/assignments', [LeadershipAssessmentController::class, 'storeAssignment'])->name('leadership.assignments.store');

// Assessment form & submit
Route::get('/leadership-assessment/cycles/{cycle}/assess', [LeadershipAssessmentController::class, 'show'])->name('leadership.assess');
Route::post('/leadership-assessment/responses', [LeadershipAssessmentController::class, 'submitResponse'])->name('leadership.responses.submit');

// Results
Route::get('/leadership-assessment/cycles/{cycle}/results', [LeadershipAssessmentController::class, 'results'])->name('leadership.results');
