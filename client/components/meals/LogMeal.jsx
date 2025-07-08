import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../src/firebase";
import "./LogMeal.css";
import MealSection from "./MealSection";
import FoodSearch from "./FoodSearch";


export default function LogMeal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [waterIntake, setWaterIntake] = useState(0);
  const [customWater, setCustomWater] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  const dailyGoals = {
    calories: 2800,
    carbs: 350,
    fat: 93,
    protein: 140,
    sodium: 2300,
    sugar: 105
  };
  // Helper function to refresh authentication token
  const refreshAuthToken = async () => {
    if (auth.currentUser) {
      const freshToken = await auth.currentUser.getIdToken(true);
      await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: freshToken }),
      });
    }
  };

  const apiCallWithRetry = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
      });

      if (response.status === 401 && auth.currentUser) {
        await refreshAuthToken();
        const retryResponse = await fetch(url, {
          credentials: 'include',
          ...options,
        });
        return retryResponse;
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      try {
        const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        const response = await apiCallWithRetry(`${import.meta.env.VITE_API_URL}/api/meals?date=${dateString}`);

        if (response.ok) {
          const mealsData = await response.json();
          setMeals(mealsData);
        } else {
          console.error('Failed to fetch meals:', response.statusText);
          // Reset to empty meals on error
          setMeals({
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          });
        }
      } catch (error) {
        console.error('Error fetching meals:', error);
        setMeals({
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [selectedDate]);

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


  const [modal, setModal] = useState(null);

  const handleAddFood = (mealType) => {
    console.log('add food to', mealType);
    setModal ({ mealType });
  };
  const closeModal = () => setModal(null);


  const handleAddToState = async (entry) => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await apiCallWithRetry(`${import.meta.env.VITE_API_URL}/api/meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: entry.name,
          calories: entry.calories,
          carbs: entry.carbs,
          fat: entry.fat,
          protein: entry.protein,
          sodium: entry.sodium,
          sugar: entry.sugar,
          quantity: 1,
          mealType: entry.mealType,
          date: dateString,
        }),
      });

      if (response.ok) {
        const savedMeal = await response.json();
        setMeals((prev) => ({
          ...prev,
          [entry.mealType.toLowerCase()]: [...prev[entry.mealType.toLowerCase()], savedMeal]
        }));
      } else {
        console.error('Failed to save meal:', response.statusText);
        alert('Failed to save meal. Please try again.');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    }
  };

  const handleQuickTools = (mealType) => {
    // TODO: make a dropdown(quick-actions) for each mealType
    // TODO: not an MVP, dependent on time
    console.log('quick tools for', mealType);
  };

  const handleRemoveFood = async (mealType, idx) => {
    const meal = meals[mealType][idx];

    if (!meal || !meal.id) {
      setMeals(prev => ({
        ...prev,
        [mealType]: prev[mealType].filter((_, i) => i !== idx)
      }));
      return;
    }

    try {
      const response = await apiCallWithRetry(`${import.meta.env.VITE_API_URL}/api/meals/${meal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeals(prev => ({
          ...prev,
          [mealType]: prev[mealType].filter((_, i) => i !== idx)
        }));
      } else {
        console.error('Failed to delete meal:', response.statusText);
        alert('Failed to delete meal. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="log-meal-page">
        <button className="back-btn loading" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
        <div className="log-meal-container">
          <div className="loading-state">
            <p>Loading your meals...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <span></span>
            </div>
          </div>

           <div className="meal-section-wrapper">
          {Object.entries(meals).map(([mealKey, foods]) => (
            <MealSection
            key={mealKey}
            name={mealKey.charAt(0).toUpperCase() + mealKey.slice(1)}
            foods={foods}
            onAddFood={() => handleAddFood(mealKey)}
            onQuickTools={() => handleQuickTools(mealKey)}
            onRemoveFood={(idx) => handleRemoveFood(mealKey, idx)}
            />
          ))}
        </div>

        {modal && (
          <FoodSearch
            mealType={modal.mealType}
            onClose={closeModal}
            onAdd={handleAddToState}
          />
        )}

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



        <div>
          <div className="complete-entry-section">
            <p className="complete-text">
              When you're finished logging all foods for this day, click here:
            </p>
            <button className="complete-entry-btn">Complete This Entry</button>
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


            <div className="quick-add-section meal">
              <h4>Quick Add</h4>
              <div className="quick-add-buttons meal">
                <button className="water-btn" onClick={() => addWater(1)}>+1 cup</button>
                <button className="water-btn" onClick={() => addWater(2)}>+2 cup</button>
                <button className="water-btn" onClick={() => addWater(4)}>+4 cup</button>
              </div>
            </div>

            <div className="custom-add-section meal">
              <h4>Add Custom</h4>
              <div className="custom-add-controls meal">
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
                <button className="add-custom-btn meal" onClick={addCustomWater}>Add</button>
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
                {waterIntake >= 8 ? "Goal achieved! " : `${Math.max(0, 8 - waterIntake)} cups remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
