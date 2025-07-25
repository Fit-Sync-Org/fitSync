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

            <div key={index} className="food-item-row">
              <div className='food-item-details'>
                <div>
                  <span className="food-name">{food.name}</span>
                </div>

                <div className='food-data'>
                  <span className="food-calories">{food.calories}</span>
                  <span className="food-carbs">{food.carbs}</span>
                  <span className="food-fat">{food.fat}</span>
                  <span className="food-protein">{food.protein}</span>
                  <span className="food-sodium">{food.sodium}</span>
                  <span className="food-sugar">{food.sugar}</span>
                </div>
              </div>
              <div className='item-remove-btn'>
                <button className="remove-food-btn" onClick={() => onRemoveFood(index)}>×</button>
              </div>
            </div>

          ))
        ) : (

          <div className="food-item-row empty">
            <div className='food-item-details'>
              <div>
                <span className="food-name empty">No foods logged</span>
              </div>

              <div className='food-data'>
                <span className="food-calories">0</span>
                <span className="food-carbs">0</span>
                <span className="food-fat">0</span>
                <span className="food-protein">0</span>
                <span className="food-sodium">0</span>
                <span className="food-sugar">0</span>
              </div>
            </div>
            <div className='item-remove-btn'>
              <button className="remove-food-btn empty" onClick={() => onRemoveFood(0)}>×</button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
