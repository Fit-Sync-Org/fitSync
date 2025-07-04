import { useState, useEffect } from 'react';
import axios from 'axios';
import './FoodSearch.css';

export default function FoodSearch({ mealType, onClose, onAdd }) {
  const [query, setQuery]       = useState('');
  const [suggestions, setSuggs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!query) {
      setSuggs([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        const res = await axios.get('/api/foods/search', { params: { query } });
        console.log('search res.data →', res.data);
        setSuggs(Array.isArray(res.data) ? res.data.slice(0, 10) : []);
      } catch (err) {
        console.error('Search error:', err);
        setSuggs([]);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const handlePick = async (food) => {
    try {
      const res = await axios.post('/api/foods/nutrients', {
        query: `${quantity} ${food.food_name}`
      });
      setSelected(res.data || null);
    } catch (err) {
      console.error('Nutrients error:', err);
    }
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd({
      mealType,
      name: selected.food_name,
      calories: selected.nf_calories,
      carbs: selected.nf_total_carbohydrate,
      fat: selected.nf_total_fat,
      protein: selected.nf_protein,
      sodium: selected.nf_sodium,
      sugar: selected.nf_sugars
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Add food to {mealType}</h2>

        <input
          autoFocus
          value={query}
          placeholder="Search food…"
          onChange={e => setQuery(e.target.value)}
        />

        {/* show suggestions once we have them */}
        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((f, i) => (
              <li key={`${f.tag_id}-${i}`} onClick={() => handlePick(f)}>
                {f.food_name} ({f.serving_qty} {f.serving_unit}) –{' '}
                {Math.round(f.nf_calories)} kcal
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <>
            <label>
              Quantity
              <input
                type="number"
                value={quantity}
                min="0.1"
                step="0.1"
                onChange={e => setQuantity(e.target.value)}
              />
            </label>
            <p>
              {quantity} × {selected.serving_unit} ={' '}
              {Math.round(
                selected.nf_calories * (quantity / selected.serving_qty)
              )}{' '}
              kcal
            </p>
            <button onClick={handleAdd}>Add to Diary</button>
          </>
        )}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
);
}
