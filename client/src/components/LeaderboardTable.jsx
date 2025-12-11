const LeaderboardTable = ({ entries }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Donor</th>
          <th>Blood Type</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(entry => (
          <tr key={entry._id}>
            <td>{entry.rank}</td>
            <td>{entry.donor?.name}</td>
            <td>{entry.donor?.bloodType}</td>
            <td>{entry.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LeaderboardTable;
