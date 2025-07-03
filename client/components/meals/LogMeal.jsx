import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LogMeal.css";

export default function LogMeal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterIntake, setWaterIntake] = useState(0);
  const [customWater, setCustomWater] = useState("");
  const navigate = useNavigate();

  const [meals, setMeals] = useState({
    breakfast: [
      { name: "Oatmea", calories: 320, carbs: 58, fat: 6, protein: 12, sodium: 180, sugar: 15 },
      { name: "Yogurt", calories: 150, carbs: 8, fat: 0, protein: 20, sodium: 65, sugar: 6 }
    ],
    lunch: [
      { name: "Chicken Salad", calories: 450, carbs: 15, fat: 22, protein: 48, sodium: 890, sugar: 8 }
    ],
    dinner: [],
    snacks: [
      { name: "Apple", calories: 280, carbs: 25, fat: 16, protein: 8, sodium: 150, sugar: 18 }
    ]
  });

  const dailyGoals = {
    calories: 2800,
    carbs: 350,
    fat: 93,
    protein: 140,
    sodium: 2300,
    sugar: 105
  };

  const calculateTotals = () => {
    let totals = { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0, sugar: 0 };

    Object.values(meals).flat().forEach(food => {
      totals.calories += food.calories;
      totals.carbs += food.carbs;
      totals.fat += food.fat;
      totals.protein += food.protein;
      totals.sodium += food.sodium;
      totals.sugar += food.sugar;
    });

    return totals;
  };

  const totals = calculateTotals();
  const remaining = {
    calories: Math.max(0, dailyGoals.calories - totals.calories),
    carbs: Math.max(0, dailyGoals.carbs - totals.carbs),
    fat: Math.max(0, dailyGoals.fat - totals.fat),
    protein: Math.max(0, dailyGoals.protein - totals.protein),
    sodium: Math.max(0, dailyGoals.sodium - totals.sodium),
    sugar: Math.max(0, dailyGoals.sugar - totals.sugar)
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const addWater = (amount) => {
    setWaterIntake(prev => prev + amount);
  };

  const addCustomWater = () => {
    const amount = parseFloat(customWater);
    if (amount > 0) {
      addWater(amount);
      setCustomWater("");
    }
  };

  return (
    <div className="log-meal-page">
      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>

      <div className="log-meal-container">
        <header className="log-meal-header">
          <h1>Your food log for:</h1>
          <div className="date-selector">
            <button className="date-nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24*60*60*1000))}>
              ←
            </button>
            <span className="selected-date">{formatDate(selectedDate)}</span>
            <button className="date-nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24*60*60*1000))}>
              →
            </button>
          </div>
        </header>

        <div className="meal-table">
          <div className="table-header">
            <div className="meal-column">Meal</div>
            <div className="nutrition-columns">
              <span>Calories <br/>
                <small>kcal</small>
            </span>
              <span>Carbs<br/>  <small>g</small></span>
              <span>Fat<br/><small>g</small></span>
              <span>Protein<br/><small>g</small></span>
              <span>Sodium<br/><small>g</small></span>
              <span>Sugar<br/><small>g</small></span>
            </div>
          </div>

          <div className="totals-section">
            <div className="totals-row">
              <span className="totals-label">Totals</span>
              <div className="totals-values">
                <span className="total-value">{totals.calories}</span>
                <span className="total-value">{totals.carbs}</span>
                <span className="total-value">{totals.fat}</span>
                <span className="total-value">{totals.protein}</span>
                <span className="total-value">{totals.sodium}</span>
                <span className="total-value">{totals.sugar}</span>
              </div>
            </div>

            <div className="goals-row">
              <span className="goals-label">Your Daily Goal</span>
              <div className="goals-values">
                <span className="goal-value">{dailyGoals.calories.toLocaleString()}</span>
                <span className="goal-value">{dailyGoals.carbs}</span>
                <span className="goal-value">{dailyGoals.fat}</span>
                <span className="goal-value">{dailyGoals.protein}</span>
                <span className="goal-value">{dailyGoals.sodium.toLocaleString()}</span>
                <span className="goal-value">{dailyGoals.sugar}</span>
              </div>
            </div>

            <div className="remaining-row">
              <span className="remaining-label">Remaining</span>
              <div className="remaining-values">
                <span className={`remaining-value ${remaining.calories < 500 ? 'low' : ''}`}>
                  {remaining.calories.toLocaleString()}
                </span>
                <span className="remaining-value">{remaining.carbs}</span>
                <span className="remaining-value">{remaining.fat}</span>
                <span className="remaining-value">{remaining.protein}</span>
                <span className="remaining-value">{remaining.sodium.toLocaleString()}</span>
                <span className="remaining-value">{remaining.sugar}</span>
              </div>
            </div>
          </div>
        </div>



        <div className="water-section">
          <h2>Water Consumption</h2>
          <div className="water-content">
            <div className="water-data">
              <h3>Water total</h3>
              <div className="water-display">
                <span className="water-amount">{waterIntake}</span>
                <span className="water-unit">cups</span>
              </div>
              <p className="water-goal">
                Aim to drink at least 8 cups of water today. You can quick add common sizes or enter a custom amount.
              </p>
            </div>

            <div className="water-controls">
              <div className="quick-add-section">
                <h4>Quick Add</h4>
                <div className="quick-add-buttons">
                  <button className="water-btn" onClick={() => addWater(1)}>+1 cup</button>
                  <button className="water-btn" onClick={() => addWater(2)}>+2 cup</button>
                  <button className="water-btn" onClick={() => addWater(4)}>+4 cup</button>
                </div>
              </div>

              <div className="custom-add-section">
                <h4>Add Custom</h4>
                <div className="custom-add-controls">
                  <input
                    type="number"
                    value={customWater}
                    onChange={(e) => setCustomWater(e.target.value)}
                    placeholder="0"
                    className="custom-water-input"
                    min="0"
                    step="0.5"
                  />
                  <span>cups</span>
                  <button className="add-custom-btn" onClick={addCustomWater}>Add</button>
                </div>
              </div>
            </div>

            <div className="water-progress">
              <div className="water-progress-bar">
                <div
                  className="water-progress-fill"
                  style={{ width: `${Math.min((waterIntake / 8) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="water-progress-text">
                {waterIntake >= 8 ? "Goal achieved! 🎉" : `${Math.max(0, 8 - waterIntake)} cups remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
