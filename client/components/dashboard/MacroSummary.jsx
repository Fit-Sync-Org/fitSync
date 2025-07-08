import PropTypes from 'prop-types';
import './MacroSummary.css';

export default function MacroSummary({ meals, workouts }) {
  // mock totals
//   const totals = meals((t, m) => ({
//     carbs: t.carbs + (m.carbs||0),
//     fat:   t.fat   + (m.fat||0),
//     protein: t.protein + (m.protein||0)
//   }), { carbs:0, fat:0, protein:0 });

  return (
    <section className="macro-summary">
      <h2>Macro Breakdown</h2>
      <div className="macro-cards">
        <div className="macro-card carbs">
          <h3>Carbs</h3><p>g</p>
        </div>
        <div className="macro-card fat">
          <h3>Fat</h3><p>g</p>
        </div>
        <div className="macro-card protein">
          <h3>Protein</h3><p>g</p>
        </div>
      </div>
    </section>
  );
}

MacroSummary.propTypes = { meals: PropTypes.array.isRequired, workouts: PropTypes.array.isRequired };
