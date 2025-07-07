import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../src/firebase";
import "./LogWorkout.css";


export default function LogWorkout() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [workouts, setWorkouts] = useState({
        cardio: [],
        strength: [],
        flexibility: [],
        sports: []
    });

    const dailyGoals = {
        calories: 2800,
        duration: 60, // will change depending on their onboarding choice
        exercises: 5,
    };

    const calculateTotals = () => {
        let totals = { calories: 0, duration: 0, exercise: 0 };

        Object.values(workouts).flat().forEach(workout => {
            totals.calories += workout.calories || 0;
            totals.duration += workout.duration || 0;
            totals.exercises += 1;
        });
        return totals;
    };


    const totals = calculateTotals();
    const remaining = {
        calories: Math.max(0, dailyGoals.calories - totals.calories),
        carbs: Math.max(0, dailyGoals.duration - totals.duration),
        fat: Math.max(0, dailyGoals.exercises - totals.exercises),
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const handleAddWorkout = (workoutType) => {
        console.log("add workout to", workoutType);
        // TODO: Add workout modal functionality
    };


    const handleQuickTools = (workoutType) => {
        console.log("quick tools for", workoutType);
        // TODO: Add quick tools functionality
    };


    const handleRemoveWorkout = (workoutType, idx) => {
        console.log("remove workout from", workoutType, "at index", idx);
        // TODO: Add remove workout functionality
    };


    if (loading) {
        return (
        <div className="log-workout-page">
            <button
            className="back-btn loading"
            onClick={() => navigate("/dashboard")}
            >
            Back to Dashboard
            </button>
            <div className="log-workout-container">
            <div className="loading-state">
                <p>Loading your workouts...</p>
            </div>
            </div>
        </div>
        );
    }


    return (
        <div className="log-workout-page">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
        </button>


        <div className="log-workout-container">
            <header className="log-workout-header">
            <h1>Your workout log for:</h1>
            <div className="date-selector">
                <button
                className="date-nav-btn"
                onClick={() =>
                    setSelectedDate(
                    new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000)
                    )
                }
                >
                ←
                </button>
                <span className="selected-date">{formatDate(selectedDate)}</span>
                <button
                className="date-nav-btn"
                onClick={() =>
                    setSelectedDate(
                    new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
                    )
                }
                >
                →
                </button>
            </div>
            </header>


            <div className="workout-table">
            <div className="table-header">
                <div className="workout-column">Workout Type</div>
                <div className="workout-stats-columns">
                <span>
                    Duration
                    <br /> <small>min</small>
                </span>
                <span>
                    Calories
                    <br />
                    <small>burned</small>
                </span>
                <span>
                    Sets
                    <br />
                    <small>reps</small>
                </span>
                <span>
                    Weight
                    <br />
                    <small>lbs</small>
                </span>
                <span>
                    Notes
                    <br />
                    <small>details</small>
                </span>
                <span></span>
                </div>
            </div>


            {/* <div className="workout-section-wrapper">
                {Object.entries(workouts).map(([workoutKey, exercises]) => (
                <WorkoutSection
                    key={workoutKey}
                    name={workoutKey.charAt(0).toUpperCase() + workoutKey.slice(1)}
                    exercises={exercises}
                    onAddWorkout={() => handleAddWorkout(workoutKey)}
                    onQuickTools={() => handleQuickTools(workoutKey)}
                    onRemoveWorkout={(idx) => handleRemoveWorkout(workoutKey, idx)}
                />
                ))}
            </div> */}


            <div className="totals-section">
                <div className="totals-row">
                <span className="totals-label">Totals</span>
                <div className="totals-values">
                    <span className="total-value">{totals.duration}</span>
                    <span className="total-value">{totals.calories}</span>
                    <span className="total-value">-</span>
                    <span className="total-value">-</span>
                    <span className="total-value">-</span>
                    <span></span>
                </div>
                </div>


                <div className="goals-row">
                <span className="goals-label">Your Daily Goal</span>
                <div className="goals-values">
                    <span className="goal-value">{dailyGoals.duration}</span>
                    <span className="goal-value">{dailyGoals.calories}</span>
                    <span className="goal-value">-</span>
                    <span className="goal-value">-</span>
                    <span className="goal-value">-</span>
                    <span></span>
                </div>
                </div>


                <div className="remaining-row">
                <span className="remaining-label">Remaining</span>
                <div className="remaining-values">
                    <span
                    className={`remaining-value ${
                        remaining.duration <= 10 ? "low" : ""
                    }`}
                    >
                    {remaining.duration}
                    </span>
                    <span
                    className={`remaining-value ${
                        remaining.calories <= 50 ? "low" : ""
                    }`}
                    >
                    {remaining.calories}
                    </span>
                    <span className="remaining-value">-</span>
                    <span className="remaining-value">-</span>
                    <span className="remaining-value">-</span>
                    <span></span>
                </div>
                </div>
            </div>
            </div>


            <div className="complete-entry-section">
            <p className="complete-text">
                When you're finished logging all workouts for this day, click here:
            </p>
            <button className="complete-entry-btn">Complete This Entry</button>
            </div>


            <div className="hydration-section">
            <h2>Post-Workout Recovery</h2>
            <div className="recovery-content">
                <div className="recovery-data">
                <h3>Recovery Notes</h3>
                <div className="recovery-display">
                    <span className="recovery-status">Feeling Good</span>
                </div>
                <p className="recovery-goal">
                    Track how you feel after your workout. lorem lorem lorem lorme lorem
                </p>
                </div>


                <div className="recovery-controls">
                <div className="quick-add-section">
                    <h4>Quick Status</h4>
                    <div className="quick-add-buttons">
                    <button className="recovery-btn"> Energized</button>
                    <button className="recovery-btn"> Good</button>
                    <button className="recovery-btn"> Tired</button>
                    <button className="recovery-btn"> Sore</button>
                    </div>
                </div>


                <div className="custom-add-section">
                    <h4>Add Notes</h4>
                    <div className="custom-add-controls">
                    <textarea
                        placeholder="How did you feel during/after the workout?"
                        className="custom-notes-input"
                        rows="3"
                    />
                    <button className="add-custom-btn">Save Note</button>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
    }
