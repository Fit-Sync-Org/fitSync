import PropTypes from 'prop-types';
import './MealHistory.css';

export default function MealHistory({ meals }) {
  return (
    <div className="meal-history">
      <h2>Meal History</h2>
      <ul>
        {['Breakfast','Lunch','Dinner','Snacks'].map(type => (
          <li key={type}>
            <h3>{type}</h3>
            <ul>
              {(meals[type.toLowerCase()]||[]).map((m,i) => (
                <li key={i}>{m.name} — {m.calories} kcal</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
MealHistory.propTypes = { meals: PropTypes.object.isRequired };
