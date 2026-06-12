<?php

use App\Modules\LeadershipAssessment\Controllers\LeadershipAssessmentController;
use Illuminate\Support\Facades\Route;

Route::prefix('leadership-assessment')->name('leadership-assessment.')->group(function () {
    Route::get('/', [LeadershipAssessmentController::class, 'index'])->name('index');

    // Cycle CRUD (leader only)
    Route::post('/cycles', [LeadershipAssessmentController::class, 'storeCycle'])->name('cycles.store');
    Route::post('/cycles/{cycle}/assign', [LeadershipAssessmentController::class, 'assignAssessee'])->name('cycles.assign');
    Route::patch('/cycles/{cycle}', [LeadershipAssessmentController::class, 'updateCycle'])->name('cycles.update');
    Route::post('/cycles/{cycle}/close', [LeadershipAssessmentController::class, 'closeCycle'])->name('cycles.close');
    Route::delete('/cycles/{cycle}', [LeadershipAssessmentController::class, 'destroyCycle'])->name('cycles.destroy');

    // Assessment form (semua member team)
    Route::get('/cycles/{cycle}/assess/{assessee}', [LeadershipAssessmentController::class, 'takeAssessment'])->name('take');
    Route::post('/cycles/{cycle}/assess/{assessee}', [LeadershipAssessmentController::class, 'submitResponse'])->name('submit');

    // Results
    Route::get('/cycles/{cycle}/results/{assessee}', [LeadershipAssessmentController::class, 'results'])->name('results');
});
