import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./LogWorkout.css";
import axios from "axios";
import WorkoutSection from "./WorkoutSection";
import WorkoutSearch from './WorkoutSearch';



const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function LogWorkout() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
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

    const [modalOpen, setModalOpen]     = useState(false);
    const [currentType, setCurrentType] = useState(null);


    useEffect(() => {
        const dateParam = searchParams.get('date');
        if (dateParam) {
            const paramDate = new Date(dateParam);
            if (!isNaN(paramDate.getTime())) {
                setSelectedDate(paramDate);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        setLoading(true);
        axios
        .get(`/api/exercises?date=${selectedDate.toISOString().slice(0, 10)}`, {withCredentials: true})
        .then(({ data }) => {
            setWorkouts(data);
        })
        .catch(err => {
            console.error("Failed to load workouts:", err);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [selectedDate]);

    const handleAddWorkout = type => {
        setCurrentType(type);
        setModalOpen(true);
    }

    const handleRemoveWorkout = (id, type) => {
        axios
        .delete(`/api/exercises/${id}`, {withCredentials: true})
        .then(() => {
            setWorkouts(prev => ({
            ...prev,
            [type]: prev[type].filter(w => w.id !== id)
            }));
        })
        .catch(err => console.error("Delete workout failed:", err));
    };

    const handleAddToState = async entry => {
        const res = await axios.post("/api/exercises", entry, {withCredentials: true});
        setWorkouts(prev => ({
            ...prev,
            [entry.type]: [...prev[entry.type], res.data]
        }));
    };

    const calculateTotals = () => {
        let totals = { calories: 0, duration: 0, exercises: 0 };

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
        duration: Math.max(0, dailyGoals.duration - totals.duration),
        exercises: Math.max(0, dailyGoals.exercises - totals.exercises),
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const handleQuickTools = (workoutType) => {
        console.log("quick tools for", workoutType);
        // TODO: Add quick tools functionality
    };

    const handleCompleteEntry = async () => {
        try {
            const dateString = selectedDate.toISOString().slice(0, 10);
            const totals = calculateTotals();
            const workoutSummary = Object.entries(workouts)
                .filter(([_, exercises]) => exercises.length > 0)
                .map(([workoutType, exercises]) => `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}: ${exercises.length} exercises`)
                .join(', ');

            const response = await axios.post('/api/exercises/complete-entry', {
                date: dateString,
                summary: workoutSummary || 'No workouts logged',
                totalCaloriesBurned: Math.round(totals.calories),
                totalDuration: Math.round(totals.duration),
                totalExercises: totals.exercises
            }, { withCredentials: true });

            if (response.status === 200) {
                alert('Entry completed successfully! Your daily workout log has been saved.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error completing entry:', error);
            alert('Failed to complete entry. Please try again.');
        }
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
                    new Date(selectedDate.getTime() - ONE_DAY_MS)
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
                    new Date(selectedDate.getTime() + ONE_DAY_MS)
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


            <div className="workout-section-wrapper">
                {Object.entries(workouts).map(([type, list]) => (
                <WorkoutSection
                    key={type}
                    name={type.charAt(0).toUpperCase() + type.slice(1)}
                    items={list}
                    onAdd={() => handleAddWorkout(type)}
                    onRemove={(id) => handleRemoveWorkout(id, type)}
                />
                ))}
            </div>


            {modalOpen && (
            <WorkoutSearch
                date={selectedDate.toISOString().slice(0,10)}
                onClose={() => setModalOpen(false)}
                onAdd={entry => handleAddToState({ ...entry, type: currentType ,
                date: selectedDate.toISOString().slice(0,10)
                })}
            />
            )}


            <div className="totals-section workout">
                <div className="totals-row workout">
                <span className="totals-label workout">Totals</span>
                <div className="totals-values workout">
                    <span className="total-value workout">{totals.duration}</span>
                    <span className="total-value workout">{totals.calories}</span>
                    <span className="total-value workout">-</span>
                    <span className="total-value workout">-</span>
                    <span className="total-value workout">-</span>
                    <span></span>
                </div>
                </div>


                <div className="goals-row workout">
                <span className="goals-label workout">Your Daily Goal</span>
                <div className="goals-values workout">
                    <span className="goal-value workout">{dailyGoals.duration}</span>
                    <span className="goal-value workout">{dailyGoals.calories}</span>
                    <span className="goal-value workout">-</span>
                    <span className="goal-value workout">-</span>
                    <span className="goal-value workout">-</span>
                    <span></span>
                </div>
                </div>


                <div className="remaining-row workout">
                <span className="remaining-label workout">Remaining</span>
                <div className="remaining-values workout">
                    <span
                    className={`remaining-value workout ${
                        remaining.duration <= 10 ? "low" : ""
                    }`}
                    >
                    {remaining.duration}
                    </span>
                    <span
                    className={`remaining-value workout ${
                        remaining.calories <= 50 ? "low" : ""
                    }`}
                    >
                    {remaining.calories}
                    </span>
                    <span className="remaining-value workout">-</span>
                    <span className="remaining-value workout">-</span>
                    <span className="remaining-value workout">-</span>
                    <span></span>
                </div>
                </div>
            </div>
            </div>


            <div className="complete-entry-section workout">
            <p className="complete-text workout">
                When you're finished logging all workouts for this day, click here:
            </p>
            <button className="complete-entry-btn workout" onClick={handleCompleteEntry}>Complete This Entry</button>
            </div>


            <div className="recovery-section">
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
                <div className="quick-add-section workout">
                    <h4>Quick Status</h4>
                    <div className="quick-add-buttons workout">
                    <button className="recovery-btn"> Energized</button>
                    <button className="recovery-btn"> Good</button>
                    <button className="recovery-btn"> Tired</button>
                    <button className="recovery-btn"> Sore</button>
                    </div>
                </div>


                <div className="custom-add-section workout">
                    <h4>Add Notes</h4>
                    <div className="custom-add-controls workout">
                    <textarea
                        placeholder="How did you feel during/after the workout?"
                        className="custom-notes-input"
                        rows="3"
                    />
                    <button className="add-custom-btn workout">Save Note</button>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}
