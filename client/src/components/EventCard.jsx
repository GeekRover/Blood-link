const EventCard = ({ event }) => {
  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <p><strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
      <p><strong>Venue:</strong> {event.venue.name}</p>
    </div>
  );
};

export default EventCard;
