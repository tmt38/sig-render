const http = require('http');
const { Client } = require('pg');
const cors = require('cors');
const wkx = require('wkx');


const server = http.createServer((req, res) => {
  // Enable CORS for all routes
  cors()(req, res, () => {
    // Check if the request is for the /fetch-poi-data endpoint
    if (req.url === '/fetch-poi-data' && req.method === 'GET') {
      // PostgreSQL database configuration
      const dbConfig = {
        user: 'admin',
        host: '172.17.0.2',
        database: 'bdd_points_interet',
        password: '1234',
        port: 5432,
      };

      // Create a new PostgreSQL client
      const client = new Client(dbConfig);

      client.connect()
        .then(() => {
          // Perform the SELECT query to fetch POI data
          const query = 'SELECT * FROM points';
          return client.query(query);
        })
        .then((result) => {
        const pois = result.rows.map(poi => {
            // Decode the WKB position
            const buffer = Buffer.from(poi.position, 'hex');
            const geometry = wkx.Geometry.parse(buffer);

            // Extract longitude and latitude
            const longitude = geometry.y;
            const latitude = geometry.x;

            // Return a new object with the decoded coordinates
            return {
              ...poi,
              longitude: longitude,
              latitude: latitude
            };
          });

          // debug
          console.log('POI data:', pois);
          // Send the POI data as JSON
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pois));
        })
        .catch((error) => {
          console.error('Error connecting to the database:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'An error occurred while connecting to the database' }));
        })
        .finally(() => {
          // Close the database connection
          client.end();
        });
    } else {
      // Handle other routes or requests
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
});

const port = 3000;

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
