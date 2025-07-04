import { React } from 'react';
import PropTypes from 'prop-types';
import './MealSection.css';

export default function MealSection({ name, foods, onAddFood, onQuickTools, onRemoveFood }) {
  return (
    <div className="meal-section">
      <div className="meal-header">
        <h3 className="meal-name">{name}</h3>
        <div className="meal-actions">
          <button className="add-food-btn" onClick={onAddFood}>Add Food</button>
          <button className="quick-tools-btn" onClick={onQuickTools}>Quick Tools</button>
        </div>
      </div>

      <div className="meal-foods">
        {foods.length > 0 ? (
          foods.map((food, index) => (
            <div key={index} className="food-item">
              <span className="food-name">{food.name}</span>
              <span className="food-calories">{food.calories}</span>
              <span className="food-carbs">{food.carbs}</span>
              <span className="food-fat">{food.fat}</span>
              <span className="food-protein">{food.protein}</span>
              <span className="food-sodium">{food.sodium}</span>
              <span className="food-sugar">{food.sugar}</span>
              <button className="remove-food-btn" onClick={() => onRemoveFood(index)}>×</button>
            </div>
          ))
        ) : (

            <div className="empty-meal">
              <span className="empty-meal-text">No foods logged</span>
              <span className="food-calories">0</span>
              <span className="food-carbs">0</span>
              <span className="food-fat">0</span>
              <span className="food-protein">0</span>
              <span className="food-sodium">0</span>
              <span className="food-sugar">0</span>
              <button className="remove-food-btn" onClick={() => onRemoveFood(index)}>×</button>
              
            </div>
        )}
      </div>
    </div>
  );
}

MealSection.propTypes = {
  name: PropTypes.string.isRequired,
  foods: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      calories: PropTypes.number,
      carbs: PropTypes.number,
      fat: PropTypes.number,
      protein: PropTypes.number,
      sodium: PropTypes.number,
      sugar: PropTypes.number,
    })
  ).isRequired,
  onAddFood: PropTypes.func.isRequired,
  onQuickTools: PropTypes.func.isRequired,
  onRemoveFood: PropTypes.func.isRequired,
};
