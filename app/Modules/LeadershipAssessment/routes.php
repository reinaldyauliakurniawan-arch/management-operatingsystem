<?php
use App\Modules\LeadershipAssessment\Controllers\LeadershipAssessmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/leadership-assessment', [LeadershipAssessmentController::class, 'index'])->name('leadership.index');
    Route::post('/leadership-assessment/cycles', [LeadershipAssessmentController::class, 'storeCycle'])->name('leadership.cycles.store');
    Route::post('/leadership-assessment/assignments', [LeadershipAssessmentController::class, 'storeAssignment'])->name('leadership.assignments.store');
    Route::get('/leadership-assessment/take/{cycle}/{user}', [LeadershipAssessmentController::class, 'showAssessment'])->name('leadership.take');
    Route::post('/leadership-assessment/submit', [LeadershipAssessmentController::class, 'submitResponse'])->name('leadership.submit');
});
