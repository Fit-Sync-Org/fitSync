import PropTypes from 'prop-types';
import './WorkoutHistory.css';

export default function WorkoutHistory({ workouts }) {
  return (
    <div className="workout-history">
      <h2>Workout History</h2>
      <ul>
        {['cardio','strength','flexibility','sports'].map((type) => (
          <li key={type}>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <ul>
              {(workouts[type]||[]).map((w,i) => (
                <li key={i}>{w.name} — {w.duration} min</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
WorkoutHistory.propTypes = { workouts: PropTypes.object.isRequired };
