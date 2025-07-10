import PropTypes from 'prop-types';
import './Charts.css'

export default function Charts({ meals, workouts}) {
  return (
    <div className='charts-container'>
        <h3>Progress Charts</h3>
        <div className='chart-placeholder'>
            <div className='content'>
                <div className='icon'> 📊 </div>
                <p>Calorie charts coming soonn</p>
                <span> weekly progress and nutrition trends </span>
            </div>
        </div>
    </div>
)};
