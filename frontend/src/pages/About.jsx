export default function About({ go }) {
  return (
    <div className="page narrow about">
      <h1>About SpeedCap</h1>
      <p className="lead">
        Coverage maps from network providers show where a signal exists, not how fast it is. SpeedCap ranks networks
        using speed tests that real people run on their phones, so the ranking reflects what you'll actually get.
      </p>

      <h2>How the score works</h2>
      <p>Each network gets a score out of 100 from the readings near you:</p>
      <table className="weights">
        <thead>
          <tr><th>What's measured</th><th>Counts for</th><th>Full marks at</th></tr>
        </thead>
        <tbody>
          <tr><td>Download speed</td><td>40%</td><td>50 Mbps or more</td></tr>
          <tr><td>Response time (latency)</td><td>25%</td><td>20 ms or less</td></tr>
          <tr><td>Upload speed</td><td>20%</td><td>20 Mbps or more</td></tr>
          <tr><td>Stability (jitter)</td><td>15%</td><td>5 ms or less</td></tr>
        </tbody>
      </table>
      <p>
        Recent tests matter more than old ones: a result counts half as much after 30 days. SpeedCap first looks
        within 2 km of you and widens the search if there aren't enough readings.
      </p>

      <h2>Sample data</h2>
      <p>
        To get started, SpeedCap includes sample readings for 15 Port Harcourt areas. They're labelled as sample data
        on every results page, and real speed tests replace them as people share results.
      </p>

      <h2>Your privacy</h2>
      <p>
        When you share a result, SpeedCap stores your network, your speeds and your location rounded to about 100
        metres. It doesn't store your name, phone number or IP address, and there's no account to create.
      </p>

      <button className="btn btn-primary btn-lg" onClick={() => go("test")}>Test my speed</button>
    </div>
  );
}
