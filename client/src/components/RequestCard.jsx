const RequestCard = ({ request }) => {
  return (
    <div className={`request-card ${request.urgency}`}>
      <h3>{request.patientName}</h3>
      <p>Blood Type: {request.bloodType}</p>
      <p>Units: {request.unitsRequired}</p>
      <p>Hospital: {request.hospital.name}</p>
      <span className={`status-badge ${request.status}`}>{request.status}</span>
    </div>
  );
};

export default RequestCard;
