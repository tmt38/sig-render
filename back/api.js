const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const wkx = require('wkx');
const fs = require('fs');
const { log } = require('console');

// Lire db_config.json et le mettre dans data
const filePath = 'db_config.json';
const jsonData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(jsonData);

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json())

// Connect to postgreSQL (bien verifiez-vous 'host' and 'port')
const dbConfig = {
  user: data.user,
  host: data.host,
  database: data.database,
  password: data.password,
  port: data.port,
};

// GET POINTS
app.get('/points', (req, res) => {
  const client = new Client(dbConfig);

  client.connect()
    .then(() => {
      const query = 'SELECT * FROM points';
      return client.query(query);
    })
    .then((result) => {
      const pois = result.rows.map(poi => {
        const buffer = Buffer.from(poi.position, 'hex');
        const geometry = wkx.Geometry.parse(buffer);
        const longitude = geometry.y;
        const latitude = geometry.x;

        return {
          ...poi,
          positionLatLon:[latitude,longitude],
        };
      });

      console.log('POI data (express):', pois);
      res.json(pois); // Send POI data as JSON
    })
    .catch((error) => {
      console.error('Error connecting to the database:', error);
      res.status(500).json({ error: 'An error occurred while connecting to the database' });
    })
    .finally(() => {
      client.end();
    });
});

// GET SERVICES
app.get('/services', (req, res) => {
    const client = new Client(dbConfig);
  
    client.connect()
      .then(() => {
        const query = 'SELECT * FROM services';
        return client.query(query);
      })
      .then((result) => {
        const services = result.rows.map(service => {  
          return {
            ...service,
          };
        });
  
        console.log('services data: ', services);
        res.json(services); // Send POI data as JSON
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
  });

// GET CIBLES
app.get('/cibles', (req, res) => {
    const client = new Client(dbConfig);
  
    client.connect()
      .then(() => {
        const query = 'SELECT * FROM cibles';
        return client.query(query);
      })
      .then((result) => {
        const cibles = result.rows.map(cible => {
          return {
            ...cible,
          };
        });
  
        console.log('cibles data: ', cibles);
        res.json(cibles); // Send POI data as JSON
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
  });

// GET CAMPUS
app.get('/campus', (req, res) => {
    const client = new Client(dbConfig);
  
    client.connect()
      .then(() => {
        const query = 'SELECT * FROM campus';
        return client.query(query);
      })
      .then((result) => {
        const campuses = result.rows.map(campus => {
          return {
            ...campus,
          };
        });
        res.json(campuses); // Send POI data as JSON
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
  });

  app.get('/get-or-create-campus', (req, res) => {
    const { nom_campus } = req.query;
    const client = new Client(dbConfig);
    var exist = true;

    client.connect()
        .then(() => {
            // First, try to find the campus
            const findQuery = 'SELECT id_campus FROM campus WHERE nom_campus = $1';
            return client.query(findQuery, [nom_campus]);
        })
        .then(result => {
            if (result.rows.length > 0) {
                // Campus exists, return the id
                return result.rows[0];
            } else {
                // Campus does not exist, create a new one
                const createQuery = 'INSERT INTO campus (nom_campus) VALUES ($1) RETURNING id_campus';
                exist=false;
                return client.query(createQuery, [nom_campus]);
            }
        })
        .then(result => {
            if(!exist){
              res.json(result.rows[0]); 

            }
            else{
              res.json(result); // Send back the campus id
            }


        })
        .catch(error => {
            console.error('Error processing campus:', error);
            res.status(500).send('Error processing campus');
        })
        .finally(() => {
            client.end();
        });
});


// ADD POINT
app.post('/point', (req, res) => {
    /*
    commande dans terminal pour teste api /point : 
        curl -X POST http://localhost:3000/point -H 'Content-Type: application/json' -d '{
        "nom_point": "BU",
        "composante": "ORLEANS - ST",
        "adresse": "9 Rue de Saint-Amand (45100)",
        "id_campus": 1,
        "longitude": 47.845096,
        "latitude": 1.936165
        }'

     */
    console.log("objet avant INSERT a BDD = ",req.body);
    const client = new Client(dbConfig);
    const { nom_point, composante, adresse, id_campus, latitude, longitude } = req.body;
    const query = 'INSERT INTO points (nom_point, composante, adresse, id_campus, position) VALUES ($1, $2, $3, $4, ST_SetSRID(ST_Point($5, $6), 4326)) RETURNING *;';

    client.connect()
        .then(() => {
            return client.query(query, [nom_point, composante, adresse, id_campus, latitude, longitude]);
        })
        .then((result) => {
            res.status(201).json(result.rows[0]);
        })
        .catch((error) => {
            console.error('Error adding new point:', error);
            res.status(500).json({ error: 'An error occurred while adding the new point' });
        })
        .finally(() => {
            client.end();
        });
});

app.delete('/point/:id_point', (req, res) => {
  const { id_point } = req.params;
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = 'DELETE FROM points WHERE id_point = $1 RETURNING *;';
          return client.query(query, [id_point]);
      })
      .then((result) => {
          if (result.rowCount > 0) {
              res.json({ message: `Point with id_point = ${id_point} was deleted successfully.` });
          } else {
              res.status(404).json({ error: `Point with id_point = ${id_point} not found.` });
          }
      })
      .catch((error) => {
          console.error('Error deleting point:', error);
          res.status(500).json({ error: 'An error occurred while deleting the point' });
      })
      .finally(() => {
          client.end();
      });
});

app.put('/point/:id_point', (req, res) => {

    /*
        commande dans terminal pour teste PUT : /point/IDPOINT : 
        curl -X PUT http://localhost:3000/point/8 -H 'Content-Type: application/json' -d '{
        "nom_point": "EGS-MAN",
        "composante": "ORLEANS - ST",
        "adresse": "3 Rue de Chartres (45067)",
        "id_campus": 2,
        "latitude": 1.9364293850294995,
        "longitude": 47.8468313303539
        }'
    */

    const { id_point } = req.params;
    const { nom_point, composante, adresse, id_campus, latitude, longitude } = req.body;
    const client = new Client(dbConfig);

    // Start building the query
    let query = 'UPDATE points SET ';
    const queryParams = [];
    let queryParamIndex = 1;

    /** QUERY static 
     *  const query = '
        UPDATE points 
        SET nom_point = $1, composante = $2, adresse = $3, id_campus = $4, position = ST_SetSRID(ST_Point($5, $6), 4326) 
        WHERE id_point = $7
        RETURNING *;';
     */
    // Dynamically add parameters to the query
    if (nom_point !== undefined) {
        // queryParamIndex++ return value then post-increment (++)
        query += `nom_point = $${queryParamIndex++}, `;
        queryParams.push(nom_point);
    }
    if (composante !== undefined) {
        query += `composante = $${queryParamIndex++}, `;
        queryParams.push(composante);
    }
    if (adresse !== undefined) {
        query += `adresse = $${queryParamIndex++}, `;
        queryParams.push(adresse);
    }
    if (id_campus !== undefined) {
        query += `id_campus = $${queryParamIndex++}, `;
        queryParams.push(id_campus);
    }

    if (longitude !== undefined && latitude !== undefined) {
        query += `position = ST_SetSRID(ST_Point($${queryParamIndex}, $${queryParamIndex + 1}), 4326), `;
        queryParams.push(latitude, longitude);
        queryParamIndex += 2;
    }

    // Remove the last comma and space
    query = query.slice(0, -2);

    // Add the WHERE clause and RETURNING
    query += ` WHERE id_point = $${queryParamIndex} RETURNING *;`;
    
    //console.log("\n\033[01;95m(#) query de la forme : " + query + "\033[00m")
    
    queryParams.push(id_point);

    client.connect()
        .then(() => client.query(query, queryParams))
        .then((result) => {
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).send('Point not found');
            }
        })
        .catch((error) => {
            console.error('Error updating point:', error);
            res.status(500).json({ error: 'An error occurred while updating the point' });
        })
        .finally(() => {
            client.end();
        });
});

// Pour ajouter un services liés à un point/cible on peut faire 'insert into point_service values (id_point,id_service);' ou 'insert into service_cible values (id_service,id_cible);' depuis psql

// Pour avoir la liste des services d'un point en particulier
app.get('/services_of_point/', (req, res) => { // Exemple d'URL : http://localhost:3000/services_of_point?idPoint=5
  const idPoint = req.query.idPoint;

  const client = new Client(dbConfig);
    client.connect()
      .then(() => {
        const query = 'SELECT * FROM services WHERE id_service IN (SELECT id_service FROM point_service WHERE id_point=$1)';
        //console.log("\n\033[01;95m(#) query de la forme : " + query + "\033[00m")
        return client.query(query,[idPoint]);
      })
      .then((result) => {
        const services = result.rows.map(services => {
          return {
            ...services,
          };
        });
  
        console.log('services data: ', services);
        res.json(services);
      })
      .catch((error) => {
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
});

// Pour avoir la liste des services d'une cible spécifique
app.get('/services_of_cible/', (req, res) => { // Exemple d'URL : http://localhost:3000/services_of_cible?idCible=1
  const idCible = req.query.idCible;

  const client = new Client(dbConfig);
    client.connect()
      .then(() => {
        const query = 'SELECT * FROM services WHERE id_service IN (SELECT id_service FROM service_cible WHERE id_cible=$1)';
        return client.query(query,[idCible]);
      })
      .then((result) => {
        const services = result.rows.map(services => {
          return {
            ...services,
          };
        });
  
        console.log('services data: ', services);
        res.json(services);
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
});

//get campus id by nom_campus
app.get('/get-campus-id', (req, res) => {
  const { nom_campus } = req.query;
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = 'SELECT id_campus FROM campus WHERE nom_campus = $1';
          return client.query(query, [nom_campus]);
      })
      .then(result => {
          if (result.rows.length > 0) {
              res.json(result.rows[0]);
          } else {
              res.status(404).send('Campus not found');
          }
      })
      .catch(error => {
          console.error('Error querying the database:', error);
          res.status(500).json({ error: 'Internal server error' });
      })
      .finally(() => {
          client.end();
      });
});

//get id_point by nom_point
app.get('/get-point-id', (req, res) => {
  const { nom_point } = req.query;
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = 'SELECT id_point FROM points WHERE nom_point = $1';
          return client.query(query, [nom_point]);
      })
      .then(result => {
          if (result.rows.length > 0) {
              console.log("result.rows[0]", result.rows[0]);
              res.json(result.rows[0]); // Send the point ID
          } else {
              res.status(404).send('Point not found');
          }
      })
      .catch(error => {
          console.error('Error querying the database:', error);
          res.status(500).json({ error: 'Internal server error' });
      })
      .finally(() => {
          client.end();
      });
});
//get id_service by nom_service
app.get('/get-service-id', (req, res) => {
  const { nom_service } = req.query;
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = 'SELECT id_service FROM services WHERE nom_service = $1';
          return client.query(query, [nom_service]);
      })
      .then(result => {
          if (result.rows.length > 0) {

              res.json(result.rows[0]); // Send the service ID
          } else {
              res.status(404).send('Service not found');
          }
      })
      .catch(error => {
          console.error('Error querying the database:', error);
          res.status(500).json({ error: 'Internal server error' });
      })
      .finally(() => {
          client.end();
      });
});
//get id_cible by nom_cible
app.get('/get-cible-id', (req, res) => {
  const { nom_cible } = req.query;
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = 'SELECT id_cible FROM cibles WHERE nom_cible = $1';
          return client.query(query, [nom_cible]);
      })
      .then(result => {
          if (result.rows.length > 0) {

              res.json(result.rows[0]); // Send the id_cible
          } else {
              res.status(404).send('Service not found');
          }
      })
      .catch(error => {
          console.error('Error querying the database:', error);
          res.status(500).json({ error: 'Internal server error' });
      })
      .finally(() => {
          client.end();
      });
});


// (nom,descriptif,coordonée) de tous les services associés à un point
app.get('/extracted_services_by_points/', (req, res) => {
  const client = new Client(dbConfig);
  client.connect()
      .then(() => {
          const query = 'SELECT services.nom_service, services.descriptif, points.position FROM points INNER JOIN services ON (services.id_service,points.id_point) IN (SELECT id_service,id_point FROM point_service);';
          return client.query(query);
      })
      .then((result) => {
        const services = result.rows.map(service => {
          const buffer = Buffer.from(service.position, 'hex');
          const geometry = wkx.Geometry.parse(buffer);
          const longitude = geometry.y;
          const latitude = geometry.x;
          return {
            ...service,
            positionLatLon:[latitude,longitude],
          };
        });
  
        console.log('services data: ', services);
        res.json(services);
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
});

app.get('/extracted_services_by_cibles', (req, res) => {  //Exemple d'URL : http://localhost:3000/extracted_services_by_cibles?liste=1,2,3
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = `SELECT services.nom_service, services.descriptif, points.position FROM points INNER JOIN services ON (services.id_service,points.id_point) IN (SELECT id_service,id_point  FROM point_service WHERE id_service IN (SELECT id_service FROM service_cible WHERE id_cible IN (${req.query['liste']}) ));`
          return client.query(query);
      })
      .then((result) => {
        const services = result.rows.map(service => {
          const buffer = Buffer.from(service.position, 'hex');
          const geometry = wkx.Geometry.parse(buffer);
          const longitude = geometry.y;
          const latitude = geometry.x;
          return {
            ...service,
            positionLatLon:[latitude,longitude],
          };
        });
  
        console.log('services data: ', services);
        res.json(services);
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
});

app.get('/extracted_services_by_campus', (req, res) => {  //Exemple d'URL : http://localhost:3000/extracted_services_by_campus?liste=1,2,3
  const client = new Client(dbConfig);

  client.connect()
      .then(() => {
          const query = `SELECT services.nom_service, services.descriptif, points.position FROM points INNER JOIN services ON (services.id_service,points.id_point) IN (SELECT id_service,id_point  FROM point_service WHERE id_point IN (SELECT id_point FROM points WHERE id_campus IN (${req.query['liste']})));`
          return client.query(query);
      })
      .then((result) => {
        const services = result.rows.map(service => {
          const buffer = Buffer.from(service.position, 'hex');
          const geometry = wkx.Geometry.parse(buffer);
          const longitude = geometry.y;
          const latitude = geometry.x;
          return {
            ...service,
            positionLatLon:[latitude,longitude],
          };
        });
  
        console.log('services data: ', services);
        res.json(services);
      })
      .catch((error) => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'An error occurred while connecting to the database' });
      })
      .finally(() => {
        client.end();
      });
});

// Handle 404 for other routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
