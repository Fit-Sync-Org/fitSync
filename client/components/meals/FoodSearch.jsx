import { useState, useEffect } from 'react';
import axios from 'axios';
import './FoodSearch.css';

export default function FoodSearch({ mealType, onClose, onAdd }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1.0);
  const [servingUnit, setServingUnit] = useState('1 medium');
  const [selectedMeal, _setSelectedMeal] = useState(mealType);

  useEffect(() => {
    if (!query) {
      setSuggs([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/foods/search`, { params: { query } });
        console.log(res.data);
        setSuggs(Array.isArray(res.data) ? res.data.slice(0, 50) : []);
      } catch (err) {
        console.error('search error:', err);
        setSuggs([]);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const handlePick = async (food) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/foods/nutrients`, {
        query: `${quantity} ${food.food_name}`,
      });
      setSelected(res.data || null);
      setServingUnit(`${food.serving_qty} ${food.serving_unit}`);
    } catch (err) {
      console.error('Nutrients error:', err);
    }
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd({
      mealType: selectedMeal,
      name: selected.food_name,
      calories: Math.round(selected.nf_calories * (quantity / selected.serving_qty)),
      carbs: Math.round(selected.nf_total_carbohydrate * (quantity / selected.serving_qty)),
      fat: Math.round(selected.nf_total_fat * (quantity / selected.serving_qty)),
      protein: Math.round(selected.nf_protein * (quantity / selected.serving_qty)),
      sodium: Math.round(selected.nf_sodium * (quantity / selected.serving_qty)),
      sugar: Math.round(selected.nf_sugars * (quantity / selected.serving_qty)),
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="food-search-modal">
        <div className="modal-header">
          <h2>Add Food To {mealType}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-section">
          <label className="search-label">Search our food database by name:</label>
          <input
            className="search-input"
            autoFocus
            value={query}
            placeholder="Enter food name..."
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {query && (
          <div className="results-section">
            <h3 className="results-header">Matching Foods:</h3>
            <div className="suggestions-container">
              {Array.isArray(suggestions) && suggestions.length > 0 ? (
                <ul className="suggestions">
                  {suggestions.map((f, i) => (
                    <li key={`${f.tag_id}-${i}`} className="suggestion-item" onClick={() => handlePick(f)}>
                      <div className="food-name">{f.food_name}</div>
                      <div className="food-details">
                        {f.brand_name && <span className="brand-name">{f.brand_name}, </span>}
                        {f.serving_qty} {f.serving_unit}, {Math.round(f.nf_calories)} calories
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-results">No matching foods found</div>
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="selected-food-section">
            <div className="selected-food-header">
              <h3>{selected.food_name}</h3>
              <a href="#" className="learn-more">Learn more</a>
            </div>

            <div className="quantity-section">
              <label className="quantity-label">How much?</label>
              <div className="quantity-controls">
                <input
                  type="number"
                  className="quantity-input"
                  value={quantity}
                  min="0.1"
                  step="0.1"
                  onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                />
                <span className="servings-text">servings of</span>
                <select
                  className="serving-select"
                  value={servingUnit}
                  onChange={e => setServingUnit(e.target.value)}
                >
                  <option value="1 medium">1 medium</option>
                  <option value="1 large">1 large</option>
                  <option value="1 small">1 small</option>
                  <option value="100g">100g</option>
                  <option value="1 cup">1 cup</option>
                </select>
              </div>
            </div>

            <div className="nutrition-info">
              <h4>Nutrition Info</h4>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_calories * (quantity / selected.serving_qty))}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_total_carbohydrate * (quantity / selected.serving_qty))}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_total_fat * (quantity / selected.serving_qty))}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_protein * (quantity / selected.serving_qty))}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Sodium:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_sodium * (quantity / selected.serving_qty))}mg</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Sugar:</span>
                  <span className="nutrition-value">{Math.round(selected.nf_sugars * (quantity / selected.serving_qty))}g</span>
                </div>
              </div>
            </div>

            <button className="add-food-btn" onClick={handleAdd}>
              Add Food
            </button>
          </div>
        )}

        <div className="add-others-link">
          <span>Can't find what you're looking for? </span>
          <a href="#" className="others-link">Add a food to the database</a>
        </div>
      </div>
    </div>
  );
}
