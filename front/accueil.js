document.addEventListener('DOMContentLoaded', function() {

    var inMemoryPI=null;
    var vectorSource = new ol.source.Vector();
    var listeDesPI = [];
    // faire attention !
    // minh: mini-projetSIG
    const persoWorkSpace='mini-projetSIG'
    var geoserver='http://localhost:8080/geoserver/'+persoWorkSpace+'/wms'



    var osm=new ol.layer.Tile({     
                                    //right,down,left,up                                
      extent: ol.proj.transformExtent([8.5,42.3,-5.5,51.1],'EPSG:4326','EPSG:3857'),
            source: new ol.source.OSM({opaque:false})
      });

    var points= new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: geoserver,
          params: {'LAYERS': persoWorkSpace+':points'},
          serverType: 'geoserver',
        }),
        visible:true,
      });

    var vue_campus= new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: geoserver,
          params: {'LAYERS': persoWorkSpace+':vue_campus'},
          serverType: 'geoserver',
        }),
        visible:false,
        preload:Infinity
      });
      

      var vue_service= new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: geoserver,
          params: {'LAYERS': persoWorkSpace+':vue_service'},
          serverType: 'geoserver',
        }),
        visible:false,
        preload:Infinity
      });

      var vue_cible= new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: geoserver,
          params: {'LAYERS': persoWorkSpace+':vue_cible'},
          serverType: 'geoserver',
        }),
        visible:false,
        preload:Infinity
      });

      var vue_batiment= new ol.layer.Tile({
        source: new ol.source.TileWMS({
          url: geoserver,
          params: {'LAYERS': persoWorkSpace+':vue_batiment'},
          serverType: 'geoserver',
        }),
        visible:false,
        preload:Infinity
      });


      var map = new ol.Map({
        target: "map",
        layers: [osm,points,vue_campus,vue_service,vue_cible,vue_batiment],
        view: new ol.View({
          center: ol.proj.fromLonLat([1.938990,47.846182]),
          zoom: 15
          })
        });
    const layers = [points,vue_campus,vue_service,vue_cible,vue_batiment];
        

    //popup service
    var popupServicesElement = document.getElementById('popup-services');
    var popupServicesContent = document.getElementById('popup-services-content');
    var popupServices = new ol.Overlay({
        element: popupServicesElement,
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -10]
    });

    //popup modification position PI
    var popupModifPIElement = document.getElementById('popup-modifPI');
    var popupModifPIContent = document.getElementById('popup-modifPI-content');
    var popupModifPI = new ol.Overlay({
        element: popupModifPIElement,
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -10]
    });

    //popup creer PI
    var popupCreerPIElement = document.getElementById('popup-creerPI');
    var popupCreerPIContent = document.getElementById('popup-creerPI-content');
    var popupCreerPICampusSearch= document.getElementById('campus-search');
    var popupCreerPI = new ol.Overlay({
        element: popupCreerPIElement,
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -10]
    });

    //fenêtre services
    var windowServicesElement = document.getElementById('window-services');


    map.addOverlay(popupServices);
    map.addOverlay(popupCreerPI);
    map.addOverlay(popupModifPI);

    var popupCloseButton = document.getElementById('popup-close');
    var popupModifCloseButton = document.getElementById('popupModif-close');
    var confirmerCreerPIButton = document.getElementById('confirmer-creerPI-button');
    var annulerCreerPIButton = document.getElementById('annuler-creerPI-button');
    var supprimerButton = document.getElementById('supprimer-point-button');
    var modifierButton = document.getElementById('modifier-point-button');
    var validerModifButton = document.getElementById('valider-modifPI-button');
    var formCreerPI = document.getElementById('creerPI-form');


    var checkboxes = document.querySelectorAll('#menu-filtrage input[type="checkbox"]');
    var searchBar = document.getElementById('search-bar');
    var searchSection = document.getElementById('search-section');
    var searchSubmit = document.getElementById('search-submit');
    var selectedCheckbox = null;
    var filtrage=null;

    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            // Uncheck all other checkboxes
            checkboxes.forEach(function(otherCheckbox) {
                if (otherCheckbox !== checkbox) {
                    otherCheckbox.checked = false;
                }
            });

            searchSection.style.display = checkbox.checked ? 'block' : 'none';
            searchBar.value = '';
        });
    });
    searchBar.addEventListener('input', function() {
        var checkedCheckbox = document.querySelector('#menu-filtrage input[type="checkbox"]:checked');
        
        if (checkedCheckbox) {
            switch (checkedCheckbox.name) {
                case 'checkboxCampus':
                    filtrage="campus";
                    console.log(filtrage);
                    break;
                case 'checkboxDescriptif':
                    filtrage="descriptif";
                    console.log(filtrage);
                    break;
                case 'checkboxServices':
                    filtrage="service";
                    console.log(filtrage);
                    break;
                case 'checkboxPublicsCibles':
                    filtrage="cible";
                    console.log(filtrage);
                    break;
            
            }
        }
    });


    searchSubmit.addEventListener('click', function() {
        var searchText = searchBar.value;
        var selectedCheckboxName = selectedCheckbox ? selectedCheckbox.name : 'none';
        if (searchText === '') {
            alert('Veuillez saisir un terme de recherche !'); 
            return; 
        }
       
        

        console.log("filtrage dans summit: ", filtrage);
        switch (filtrage) {
            case 'campus':
                //param = id_campus
                
                getCampusByName(searchText)
                .then(data =>{
                    if(data){
                        var paramKey = Object.keys(data)[0];
                        var paramValue=data.id_campus;
                        console.log("paramkey : ", paramKey, " paramValue: ", paramValue)
                        updateViewParams(vue_campus,paramKey,paramValue);
                    }
                    else{
                        alert('404 not found: ');
                    }
                   
                });
            
                break;
            case 'descriptif': 

                //param nom_point        
                updateViewParams(vue_batiment,"nom_point",searchText);
 
                
                break;
            case 'service':
                //param = id_service
                getServiceByName(searchText)
                .then(data=>{

                    if(data){
                        var paramKey = Object.keys(data)[0];
                        var paramValue=data.id_service;
                        console.log("paramkey : ", paramKey, " paramValue: ", paramValue)
                        updateViewParams(vue_service,paramKey,paramValue);
                    }
                    else{
                        console.log(searchText);
                        alert('404 not found: ');
                    }
                })
            
                console.log(filtrage);
                break;
            case 'cible':
                getCibleByName(searchText)
                .then(data=>{

                    if(data){
                        var paramKey = Object.keys(data)[0];
                        var paramValue=data.id_cible;
                        console.log("paramkey : ", paramKey, " paramValue: ", paramValue)
                        updateViewParams(vue_cible,paramKey,paramValue);
                    }
                    else{
                        console.log(searchText);
                        alert('404 not found: ');
                    }
                })
               
                console.log(filtrage);
                break;
            
        }
        
        console.log('Selected Checkbox:', selectedCheckboxName);

        searchBar.value = '';
        selectedCheckbox = null;
        searchSection.style.display = 'none';
    });
    function onOffLayers(layer){
        for(let i =0;i< layers.length;i++){
            layers[i].setVisible(false);
        }
        layer.setVisible(true);
    }
    
    function updateViewParams(layer, paramKey,paramValue) {
        var source = layer.getSource();
        var newParams = {
            'VIEWPARAMS': paramKey +':' + paramValue
        };
        source.updateParams(newParams);
        onOffLayers(layer);
    }
    function getCampusByName(nom_campus){

        return fetch('http://localhost:3000/get-campus-id?nom_campus=' + encodeURIComponent(nom_campus))
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(data => {
            console.log('Campus ID:', data);
            return data;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            return '';
        });
    }
    function getServiceByName(nom_service){
        return fetch('http://localhost:3000/get-service-id?nom_service=' + encodeURIComponent(nom_service))
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            return '';
        });

    }
    function getCibleByName(nom_cible){
        return fetch('http://localhost:3000/get-cible-id?nom_cible=' + encodeURIComponent(nom_cible))
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            return '';
        });

    }
    
    

    
    popupCloseButton.onclick = function() {
        popupServices.setPosition(undefined);
        popupCloseButton.blur(); 
        windowServicesElement.classList.remove('ol-window-services-active');
        return false;
    };

    popupModifCloseButton.onclick = function() {
        popupModifPI.setPosition(undefined);
        inMemoryPI=null;//On annule la modif donc on enlève le PI en mémoire
        popupModifCloseButton.blur();
        return false; 
    };


    function recommanderCampus() {
    fetch('http://localhost:3000/campus')
        .then(response => response.json())
        .then(campuses => {
            const campusList = document.getElementById('campus-list');
            campusList.innerHTML = ''; 
            campuses.forEach(campus => {
                const option = document.createElement('option');
                option.value = campus.nom_campus;
                campusList.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }
    document.getElementById('campus-search').addEventListener('focus',recommanderCampus);
    confirmerCreerPIButton.addEventListener('click', function(event) {
        var form = document.getElementById('creerPI-form');
        
        if (form.checkValidity() === false) {
            form.reportValidity();
            return; 
        }
    
        var nomCampus = form.querySelector('[name="campus_search"]').value; // Get the nom_campus from the form
    
        fetch('http://localhost:3000/get-or-create-campus?nom_campus=' + encodeURIComponent(nomCampus), {
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error fetching campus ID');
            }
            return response.json();
        })
        .then(data => {
            var idCampus = data.id_campus; // Get the id_campus
    
           
            var formData = new FormData(form);
            formData.append('id_campus', idCampus); // Add id_campus to the form data
    
            var object = {};
            formData.forEach((value, key) => object[key] = value);
            var json = JSON.stringify(object);
    
            return fetch('http://localhost:3000/point', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: json
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            popupCreerPI.setPosition(undefined);
            form.reset();
            location.reload();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });

    
    annulerCreerPIButton.onclick=function(){
        popupCreerPI.setPosition(undefined);
        document.getElementById('creerPI-form').reset();
    };


    function validerModification(latitude, longitude){

        var object = {"nom_point":inMemoryPI.features[0].properties.nom_point,
         "latitude":latitude, "longitude":longitude};
        var json = JSON.stringify(object);

        var pathIDPoint = 'http://localhost:3000/point/'+inMemoryPI.features[0].id.split('.')[1];

        fetch(pathIDPoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Close the popup and reset the form
            popupModifPI.setPosition(undefined);
            /*vectorSource.removeFeature(inMemoryPI);
            console.log("Feature modified (before):", inMemoryPI);
            inMemoryPI.set('positionLatLon',[latitude, longitude]);
            console.log("Feature modified (after):", inMemoryPI);*/
            //vectorSource.addFeature(inMemoryPI.setProperties({positionLatLon:[latitude, longitude]}));
            inMemoryPI=null;
            location.reload(); //Pour relancer la page et actualiser les nouveaux points
            //recuperationDesPI();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    function deletePoint(pointId) {
        fetch('http://localhost:3000/point/' + pointId, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Delete objet:', data);
            location.reload();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    function getServices(id_point){
        fetch('http://localhost:3000/services_of_point/?idPoint='+id_point)
        .then(response => response.json())
        .then(services => {
            var listeServices= document.getElementById('liste-services');
            var windowServicesContent = document.getElementById('window-services-content');
            listeServices.innerHTML =  '<li><div class="ol-service-element">';
            windowServicesContent.innerHTML = '';
            console.log('Contenu de services : '+services);
            if(services!=''){
                services.forEach(service => {
                    listeServices.innerHTML +='<h3>'
                    +service.nom_service+'</h3><p class="ol-service-descriptif">'
                    +service.descriptif+'</p></div></li>';
                    /*var entry = document.createElement('li');
                    console.log('Service : '+ service.nom_service);
                    entry.appendChild(document.createTextNode(service.nom_service));
                    listeServices.appendChild(entry);*/
                    
                });
                console.log("HTML: ",listeServices.innerHTML )
            }else{
                windowServicesContent.append(document.createTextNode("Aucun services disponibles"))
            }
        })
        .catch(error => console.error('Error:', error));
    }

        function extraire_csv(listeIdCible=[], listeIdCampus=[]){
      if( listeIdCible.length === 0 && listeIdCampus.length === 0){
        fetch('http://localhost:3000/extracted_services_by_points/')
        .then(response => {return response.json()})
        .then((services) => {
          let content ="";
          services.forEach((service) => {
            content += `${service['nom_service']};${service['descriptif']};${service.positionLatLon[0]},${service.positionLatLon[1]}\n`
          });
          downloadFile(content, "extraction.csv", 'text/csv');
          })
      }
      if(listeIdCible.length > 0 && listeIdCampus.length === 0){
        fetch(`http://localhost:3000/extracted_services_by_cibles?liste=${listeIdCible.toString()}`)
        .then(response => {return response.json()})
        .then((services) => {
          let content ="";
          services.forEach((service) => {
            content += `${service['nom_service']};${service['descriptif']};${service.positionLatLon[0]},${service.positionLatLon[1]}\n`
          });
          downloadFile(content, "extraction.csv", 'text/csv');
          })
      }
      if(listeIdCible.length === 0 && listeIdCampus.length > 0){
        fetch(`http://localhost:3000/extracted_services_by_campus?liste=${listeIdCible.toString()}`)
        .then(response => {return response.json()})
        .then((services) => {
          let content ="";
          services.forEach((service) => {
            content += `${service['nom_service']};${service['descriptif']};${service.positionLatLon[0]},${service.positionLatLon[1]}\n`
          });
          downloadFile(content, "extraction.csv", 'text/csv');
          })
      } 
    }

    function extraire_geojson(listeIdCible=[], listeIdCampus=[]){
      if( listeIdCible.length === 0 && listeIdCampus.length === 0){
        fetch(`http://localhost:3000/extracted_services_by_cibles?liste=${listeIdCible.toString()}`)
          .then(response => {return response.json()})
          .then((services) => {
            let content = [];
            services.forEach((service) => {
              content.push({
                "nom":service["nom_service"],
                "description":service["descriptif"],
                "position":{"type":"Point", "coordinates":[service.positionLatLon[0], service.positionLatLon[1]]}
              })
            });
            downloadFile(JSON.stringify(content), "extraction.geojson", 'application/geo+json');
            })
      }
      if( listeIdCible.length > 0 && listeIdCampus.length === 0){
        fetch('http://localhost:3000/extracted_services_by_points/')
          .then(response => {return response.json()})
          .then((services) => {
            let content = [];
            services.forEach((service) => {
              content.push({
                "nom":service["nom_service"],
                "description":service["descriptif"],
                "position":{"type":"Point", "coordinates":[service.positionLatLon[0], service.positionLatLon[1]]}
              })
            });
            downloadFile(JSON.stringify(content), "extraction.geojson", 'application/geo+json');
            })
      }
      if( listeIdCible.length === 0 && listeIdCampus.length > 0){
        fetch(`http://localhost:3000/extracted_services_by_campus?liste=${listeIdCible.toString()}`)
          .then(response => {return response.json()})
          .then((services) => {
            let content = [];
            services.forEach((service) => {
              content.push({
                "nom":service["nom_service"],
                "description":service["descriptif"],
                "position":{"type":"Point", "coordinates":[service.positionLatLon[0], service.positionLatLon[1]]}
              })
            });
            downloadFile(JSON.stringify(content), "extraction.geojson", 'application/geo+json');
            })
      }
    }

    function downloadFile(content, filename, contentType) {
      const a = document.createElement('a');
      const file = new Blob([content], { type: contentType });

      a.href = URL.createObjectURL(file);
      a.download = filename;
      a.click();

      URL.revokeObjectURL(a.href);
    }

    map.on('singleclick', function(evt) {
        var viewResolution = map.getView().getResolution();
        var url = points.getSource().getFeatureInfoUrl(
            evt.coordinate, viewResolution, 'EPSG:3857',
            { 'INFO_FORMAT': 'application/json' } // Or 'text/html' if you prefer
        );
    
        if (url) {
            fetch(url)
                .then(function(response) { return response.json(); })
                .then(function(json) {
                    // Process the response (json)
                    if(json.features && json.features.length > 0){
                        console.log(json); // Here you'll have your feature info
                        var coordinates = json.features[0].geometry.coordinates;
                        var titre= '<h3>' + json.features[0].properties.nom_point + '</h3>'
                        popupServicesContent.innerHTML=titre;
                        // popupServicesContent.innerHTML='<p class="popup-service-titre">'+json.features[0].properties.nom_point+' '+ '//TODO show Services</p>' 
                        /*getServices(json.features[0].id.split('.')[1])
                            .then(servicesListHtml =>{
                                console.log(servicesListHtml);
                                
                                popupServicesContent.innerHTML=titre+servicesListHtml;
                            });*/
                        //popupServices.innerHTML=getServices(json.features[0].id.split('.')[1]);
                        supprimerButton.onclick = function() {
                            deletePoint(json.features[0].id.split('.')[1]);
                                    
                            popupServices.setPosition(undefined);
                            
                        };
                        modifierButton.onclick = function() {
                            console.log('Try to modif POI at:', transformedCoordinates);
                            windowServicesElement.classList.remove('ol-window-services-active');
                            inMemoryPI = json;
                            popupServices.setPosition(undefined); // Hide the popup
                        };
                                
                            popupServices.setPosition(coordinates);
                            getServices(json.features[0].id.split('.')[1]);
                            windowServicesElement.classList.add('ol-window-services-active');
                            popupModifPI.setPosition(undefined);
                            popupCreerPI.setPosition(undefined);

                    }
                    else{
                        var coordinates = map.getCoordinateFromPixel(evt.pixel);
                        var transformedCoordinates = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
                        //hide when u click on another position on the map
                        document.getElementById('position-lat').value = transformedCoordinates[0].toFixed(6); // Latitude
                        document.getElementById('position-lon').value = transformedCoordinates[1].toFixed(6); // longitude
                        windowServicesElement.classList.remove('ol-window-services-active');
                        if(inMemoryPI){
                            validerModifButton.onclick = function() {
                            validerModification(transformedCoordinates[0].toFixed(6),transformedCoordinates[1].toFixed(6));
                        }
                        popupModifPI.setPosition(coordinates);
                        }else{
                            console.log('Create new POI at:', transformedCoordinates);
                            popupCreerPI.setPosition(coordinates);
                            popupModifPI.setPosition(undefined);
                            popupServices.setPosition(undefined);
                        }
                    }
                    
                    // You can create a popup or display info as needed
                });
        }
        else{
            console.log("json error map.on()");
        }
    });
});
  