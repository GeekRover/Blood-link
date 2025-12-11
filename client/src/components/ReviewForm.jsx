import { useState } from 'react';

const ReviewForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <div className="form-group">
        <label>Rating</label>
        <select
          value={formData.rating}
          onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
        >
          {[5, 4, 3, 2, 1].map(rating => (
            <option key={rating} value={rating}>{rating} Stars</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Comment</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          required
          rows="4"
        />
      </div>

      <button type="submit" className="btn-primary">Submit Review</button>
    </form>
  );
};

export default ReviewForm;
