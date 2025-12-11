const DonorCard = ({ donor }) => {
  return (
    <div className="donor-card">
      <h3>{donor.name}</h3>
      <p>Blood Type: {donor.bloodType}</p>
      <p>Location: {donor.address?.city}</p>
      <p>Donations: {donor.totalDonations || 0}</p>
    </div>
  );
};

export default DonorCard;
