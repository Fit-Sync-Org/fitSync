import PropTypes from 'prop-types';
import './WorkoutSection.css';

export default function WorkoutSection({
  name,
  items,
  onAdd,
  onRemove
}) {
  return (
    <div className="workout-section">
      <div className="section-header">
        <h3>{name}</h3>
        <button className="add-workout-btn" onClick={onAdd}>
          + Add
        </button>
      </div>

      <div className="workout-items">
        {items.length > 0 ? (
          items.map(w => (
            <div key={w.id} className="workout-item">
              <span className="wi-name">{w.name}</span>
              <span className="wi-duration">{w.duration}m</span>
              <span className="wi-cal">{Math.round(w.calories)} kcal</span>
              <span className="wi-sets">{w.sets ?? '-'}</span>
              <span className="wi-weight">{w.weight ?? '-'}</span>
              <button
                className="wi-remove"
                onClick={() => onRemove(w.id)}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="empty-section">No workouts</div>
        )}
      </div>
    </div>
  );
}

WorkoutSection.propTypes = {
  name:      PropTypes.string.isRequired,
  items:     PropTypes.array.isRequired,
  onAdd:     PropTypes.func.isRequired,
  onRemove:  PropTypes.func.isRequired,
};
