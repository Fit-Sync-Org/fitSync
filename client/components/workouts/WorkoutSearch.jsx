import { useState, useEffect } from "react";
import axios from "axios";
import "./WorkoutSearch.css";

export default function WorkoutSearch({ date, workoutType, onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState(30);
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/workouts/log`,
           {
            query,
            gender: "male",
            weight_kg: 70,
            age: 30,
            height_cm: 175,
          }
         );
        console.log('Workout search results:', res.data);
        setSuggestions(Array.isArray(res.data) ? res.data.slice(0, 20) : []);
      } catch (err) {
        console.error("Exercise lookup failed", err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const handlePick = (exercise) => {
    setSelected(exercise);
    setDuration(Math.round(exercise.duration_min) || 30);
    setNotes(`${exercise.name} - ${exercise.tag_name || 'exercise'}`);
  };

  const handleAdd = () => {
    if (!selected) return;

    onAdd({
      type: workoutType,
      name: selected.name,
      duration: duration,
      calories: Math.round(selected.nf_calories * (duration / selected.duration_min)),
      sets: sets,
      reps: reps,
      weight: weight,
      notes: notes,
      date,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="food-search-modal">
        <div className="modal-header">
          <h2>Log Workout for {date}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-section">
          <label className="search-label">Describe your workout:</label>
          <input
            className="search-input"
            autoFocus
            value={query}
            placeholder="e.g. ran 3 miles, did 20 push-ups, lifted weights"
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {query && (
          <div className="results-section">
            <h3 className="results-header">Matching Exercises:</h3>
            <div className="suggestions-container">
              {Array.isArray(suggestions) && suggestions.length > 0 ? (
                <ul className="suggestions">
                  {suggestions.map((exercise, i) => (
                    <li key={`${exercise.tag_id || i}`} className="suggestion-item" onClick={() => handlePick(exercise)}>
                      <div className="food-name">{exercise.name}</div>
                      <div className="food-details">
                        {exercise.tag_name && <span className="brand-name">{exercise.tag_name}, </span>}
                        {Math.round(exercise.duration_min)} min, {Math.round(exercise.nf_calories)} calories
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-results">No matching exercises found</div>
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="selected-food-section">
            <div className="selected-food-header">
              <h3>{selected.name}</h3>
            </div>

            <div className="quantity-section">
              <label className="quantity-label">Duration (minutes):</label>
              <div className="quantity-controls">
                <input
                  type="number"
                  className="quantity-input"
                  value={duration}
                  min="1"
                  step="1"
                  onChange={e => setDuration(parseInt(e.target.value) || 30)}
                />
                <span className="servings-text">minutes</span>
              </div>
            </div>

            <div className="quantity-section">
              <label className="quantity-label">Sets & Reps (optional):</label>
              <div className="quantity-controls">
                <input
                  type="number"
                  className="quantity-input"
                  value={sets}
                  min="0"
                  step="1"
                  placeholder="Sets"
                  onChange={e => setSets(parseInt(e.target.value) || 0)}
                />
                <span className="servings-text">sets of</span>
                <input
                  type="number"
                  className="quantity-input"
                  value={reps}
                  min="0"
                  step="1"
                  placeholder="Reps"
                  onChange={e => setReps(parseInt(e.target.value) || 0)}
                />
                <span className="servings-text">reps</span>
              </div>
            </div>

            <div className="quantity-section">
              <label className="quantity-label">Weight (lbs, optional):</label>
              <div className="quantity-controls">
                <input
                  type="number"
                  className="quantity-input"
                  value={weight}
                  min="0"
                  step="5"
                  placeholder="Weight"
                  onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                />
                <span className="servings-text">lbs</span>
              </div>
            </div>

            <div className="quantity-section">
              <label className="quantity-label">Notes (optional):</label>
              <textarea
                className="search-input"
                value={notes}
                placeholder="Add any notes about your workout..."
                rows="3"
                onChange={e => setNotes(e.target.value)}
                style={{resize: 'vertical', minHeight: '80px'}}
              />
            </div>

            <div className="nutrition-info">
              <h4>Workout Summary</h4>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Duration:</span>
                  <span className="nutrition-value">{duration} min</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_calories * (duration / selected.duration_min))}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Sets:</span>
                  <span className="nutrition-value">{sets || '-'}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Reps:</span>
                  <span className="nutrition-value">{reps || '-'}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Weight:</span>
                  <span className="nutrition-value">{weight ? `${weight} lbs` : '-'}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Type:</span>
                  <span className="nutrition-value">{selected.tag_name || 'Exercise'}</span>
                </div>
              </div>
            </div>

            <button
              className="add-food-btn"
              onClick={handleAdd}
              style={{
                background: 'linear-gradient(135deg, #adc97e, #c8e6a0)',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1.6rem',
                fontWeight: '700',
                color: '#2c332e',
                cursor: 'pointer',
                width: '100%',
                marginTop: '1rem'
              }}
            >
              Add Workout
            </button>
          </div>
        )}

        <div className="add-others-link">
          <span>Can't find your exercise? </span>
          <a href="#" className="others-link">Suggest an exercise</a>
        </div>
      </div>
    </div>
  );
}
