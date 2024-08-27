import { confirmDeletionEntrant, showEntrantDetails } from './ui.js';
import { filterAcceptable, formatRaceName} from './utils.js';
// import { removeFromEntrantList, getEntrantList } from './acceptList.js';
import { removeEntrant } from './entrantState.js';


async function fetchRaceById(raceId) {
    try {
        const response = await fetch(`http://localhost:3000/race/${raceId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const race = await response.json();
        return race;
    } catch (error) {
        console.error('Failed to fetch race:', error);
    }
}

async function fetchEntrantById(entrant_number){
    try {
        const response = await fetch(`http://localhost:3000/entrant/${entrant_number}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const race = await response.json();
        return race;
    } catch (error) {
        console.error('Failed to fetch entrant:', error);
    }
}

async function fetchEntrantsByID(raceId) {
    try {
        const response = await fetch(`http://localhost:3000/events/entrants/${raceId}`);
        if (response.status === 404) {
            // Handle 404 not found by returning an empty array without logging an error
            return [];
        }
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const entrants = await response.json();
        return entrants;
    } catch (error) {
        // Only log the error if it's not a 404 error
        if (!error.message.includes('404')) {
            console.error('Failed to fetch entrants:', error);
        }
        return []; // Return an empty array in case of an error
    }
}


async function fetchDeclaredEntrants(raceId){
    try {
        const response = await fetch(`http://localhost:3000/entrants/declared/${raceId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const entrants = await response.json();
        const entrantNumbers = entrants.map(entrant => ({
            entrant_number: entrant.entrant_number,
            pb: entrant.pb
          }));
        return entrantNumbers;
    } catch (error) {
        console.error('Failed to fetch entrants:', error);
    }
}

async function fetchAndPopulateRaces() {
    try {
        const response = await fetch('http://localhost:3000/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Populate the dropdown
        const select = document.getElementById('raceSelect');
        select.innerHTML = ''; // Clear previous options
        
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a race';
        defaultOption.disabled = true; // Make it non-selectable
        defaultOption.selected = true; // Make it selected by default
        select.appendChild(defaultOption);

        // Populate the select element with race options
        data.forEach(event => {
            let option = document.createElement('option');
            option.value = event.race_id;
            option.textContent = formatRaceName(event);
            select.appendChild(option);
        });
        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function fetchAndPopulateRacesResults() {
    try {
        const response = await fetch('http://localhost:3000/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        
        // Populate the dropdown
        const select = document.getElementById('raceSelect');
        select.innerHTML = ''; // Clear previous options
        
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a race';
        defaultOption.disabled = true; // Make it non-selectable
        defaultOption.selected = true; // Make it selected by default
        select.appendChild(defaultOption);
        data = data.filter(event => {
            if (event.heats) {
                return event;
            }
        });
        
        // Populate the select element with race options
        data.forEach(event => {
            let option = document.createElement('option');
            option.value = event.race_id;
            option.textContent = formatRaceName(event);
            select.appendChild(option);
        });
        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function fetchAndPopulateHeats(raceId) {
    try {
        const response = await fetch(`http://localhost:3000/events/heats/${raceId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const race = fetchRaceById(raceId);
        // Populate the dropdown
        const select = document.getElementById('heatSelect');
        select.innerHTML = ''; // Clear previous options
        
        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a race';
        defaultOption.disabled = true; // Make it non-selectable
        defaultOption.selected = true; // Make it selected by default
        select.appendChild(defaultOption);

        // Populate the select element with race options
        data.forEach(heat => {
            let option = document.createElement('option');
            option.value = heat.heat_id;
            option.textContent = 'heat '+heat.heat_id;
            select.appendChild(option);
        });
        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function fetchAndPopulateEntrants(race_id, currentEntrantList, isFilter) {
    try {
        const response = await fetch('http://localhost:3000/entrants');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();

        if (isFilter){
            const race = await fetchRaceById(race_id);
            data = filterAcceptable(race.age_group, race.gender, data, currentEntrantList);
        }

        // Populate the dropdown
        const select = document.getElementById('entrantSelect');
        select.innerHTML = ''; // Clear previous options

        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an entrant';
        defaultOption.disabled = true; // Make it non-selectable
        defaultOption.selected = true; // Make it selected by default
        select.appendChild(defaultOption);

        if (data.length === 0) {
            let noMatchMessage = document.createElement('p');
            noMatchMessage.textContent = 'No existing entrant matches race description';
            noMatchMessage.style.color = 'red';
            select.parentNode.appendChild(noMatchMessage);
        } else {
            // Populate the select element with race options
            data.forEach(entrant => {
                let option = document.createElement('option');
                option.value = entrant.entrant_number;
                option.textContent = `${entrant.forename} ${entrant.surname}`;
                select.appendChild(option);
            });
        }

        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

async function fetchRaces() {
    try {
        const response = await fetch('http://localhost:3000/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("fetchRaces data:", data);
        return data;  // Return the fetched data
    } catch (error) {
        console.error('Error fetching events:', error);
        return null;  // Return null in case of an error
    }
}

async function fetchEntrants() {
    try {
        const response = await fetch('http://localhost:3000/entrants');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("fetchentrants data:", data);
        return data;  // Return the fetched data
    } catch (error) {
        console.error('Error fetching entrants:', error);
        return null;  // Return null in case of an error
    }
}

async function fetchEntrantsData2() {
    document.getElementById('deleteEntrantBtn').style.backgroundColor = '#850000'; // resets to red as info buttons are reset
    const raceId = document.getElementById("raceSelect").value;
    const race = await fetchRaceById(raceId);
    return new Promise((resolve, reject) => {
        if (raceId !== "" && raceId !== "Select a race") {
            fetch(`http://localhost:3000/entrants/${raceId}`)
                .then(response => response.json())
                .then(async (data) => {
                    
                    const entrants = document.getElementById('entrants');
                    entrants.style.display = 'block';
                    entrants.innerHTML = ''; // Clear previous options
                    const entrantsList = [];

                    if (data.length === 0) {
                        // No entrants for this race, resolve early
                        resolve(entrantsList);
                        document.getElementById('entrants').style.display = 'none';
                        document.getElementById('warning').textContent = '';
                        return;
                    }
                    // Fetch current signed_in statuses for the race
                    const response = await fetch(`http://localhost:3000/entrants/current_signed_in`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ entrants: data.map(e => e.entrant_number) })
                    });
                    const currentSignedInData = await response.json();

                    // Fetch personal bests for all entrants
                    const pbPromises = data.map(entrant => getEntrantPb(raceId, entrant.entrant_number));
                    const pbResults = await Promise.all(pbPromises);

                    // Create a document fragment to minimize reflows
                    const fragment = document.createDocumentFragment();

                    // Create and append the header row
                    const headerRow = document.createElement('div');
                    headerRow.classList.add('race-header');
                    headerRow.id = 'headerRow';
                    let warning = document.getElementById('warning');
                    if (race.heats){
                        headerRow.style.backgroundColor = 'rgba(133, 0, 0, 1)';
                        warning.textContent = '* this race has generated heats *'
                        warning.style.color = 'red';
                    } else {
                        warning.textContent = '';
                    }
                    headerRow.innerHTML = `
                        <span>Declared</span>
                        <span>Name</span>
                        <span>Club</span>
                        <span>PB</span>
                        <span>Actions</span>
                    `;
                    fragment.appendChild(headerRow);
                    console.log(data);
                    // Process each entrant and append to the fragment
                    data.forEach((entrant, index) => {
                        const entrantRow = document.createElement('div');
                        entrantRow.classList.add('entrant-row');
                        entrantRow.style.display = 'grid';
                        entrantRow.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr'; // Adjust the columns as needed
                        entrantRow.style.alignItems = 'center';
                        entrantRow.style.gap = '10px'; // Adjust the gap between items
                        entrantRow.id = 'entrant-' + entrant.entrant_number;

                        // Create the checkbox input
                        let checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = 'entrant-' + entrant.entrant_number;
                        checkbox.value = entrant.entrant_number;
                        checkbox.dataset.raceId = raceId; // Store race_id for later use
                        // Set the checkbox state based on the signed_in status
                        checkbox.checked = currentSignedInData[entrant.entrant_number] && currentSignedInData[entrant.entrant_number].includes(parseInt(raceId));

                        if (checkbox.checked) {
                            entrantRow.style.background = 'rgba(0, 39, 129, 0.595)';
                            entrantRow.style.color = 'rgba(255,255,255,1)';
                        }

                        // Create name label
                        let nameLabel = document.createElement('span');
                        nameLabel.textContent = entrant.forename + " " + entrant.surname;

                        // Create club label
                        let clubLabel = document.createElement('span');
                        clubLabel.textContent = entrant.club;

                        // Get personal best
                        let pb = pbResults[index][0]['pb'];
                        if (pb === 'null' || pb === 'undefined') {
                            pb = 'no pb';
                        }
                        let pbLabel = document.createElement('span');
                        pbLabel.textContent = pb || 'N/A'; // Handle error gracefully

                        // Create the info button
                        let info = document.createElement('button');
                        info.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i>';
                        info.id = 'info-btn-' + entrant.entrant_number;
                        info.onclick = function () {
                            showEntrantDetails(entrant, raceId, fetchEntrantsData2);
                        };

                        // Create the delete button
                        let bin = document.createElement('button');
                        bin.innerHTML = '<i class="fa fa-trash-alt" aria-hidden="true"></i>';
                        bin.id = 'delete-btn-' + entrant.entrant_number;
                        bin.style.display = 'none';
                        bin.onclick = function () {
                            confirmDeletionEntrant(entrant.entrant_number, raceId, true);
                        };

                        // Create a container for the buttons and align them to the right
                        let actionsContainer = document.createElement('div');
                        actionsContainer.style.display = 'flex';
                        actionsContainer.style.justifyContent = 'center'; // Align buttons to the right
                        actionsContainer.appendChild(info);
                        actionsContainer.appendChild(bin);

                        // Append elements to the entrant row
                        entrantRow.appendChild(checkbox);
                        entrantRow.appendChild(nameLabel);
                        entrantRow.appendChild(clubLabel);
                        entrantRow.appendChild(pbLabel);
                        entrantRow.appendChild(actionsContainer);

                        // Append entrant row to the fragment
                        fragment.appendChild(entrantRow);

                        // Add entrant number to the list
                        entrantsList.push(entrant.entrant_number);
                    });

                    // Append the fragment to the DOM
                    entrants.appendChild(fragment);

                    resolve(entrantsList);
                    console.log(entrantsList);
                })
                .catch(error => {
                    console.error('Error fetching entrants data:', error);
                    reject(error);
                });
        } else {
            document.getElementById("addEntrantBtn").style.display = 'none';
            document.getElementById("deleteEntrantsBtn").style.display = 'none';
            resolve([]);
        }
    });
}

async function fetchEntrantResult(raceId, entrantNumber) {
    const response = await fetch(`http://localhost:3000/entrants/${raceId}/${entrantNumber}/result`);
    return response.json();
}

async function fetchEntrantsOrderedByResult(raceId) {
    const response = await fetch(`http://localhost:3000/entrants/${raceId}/ordered_results`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

async function displayEntrantsDataResults() {
    const raceId = document.getElementById("raceSelect").value;
    const race = await fetchRaceById(raceId);
    return new Promise((resolve, reject) => {
        if (raceId !== "" && raceId !== "Select a race") {
            fetchEntrantsOrderedByResult(raceId)
                .then(async (data) => {
                    const entrants = document.getElementById('entrants');
                    entrants.style.display = 'block';
                    entrants.innerHTML = ''; // Clear previous options
                    const entrantsList = [];

                    if (data.length === 0) {
                        // No entrants for this race, resolve early
                        resolve(entrantsList);
                        document.getElementById('entrants').style.display = 'none';
                        document.getElementById('warning').textContent = '';
                        return;
                    }

                    // Create a document fragment to minimize reflows
                    const fragment = document.createDocumentFragment();

                    // Create and append the header row
                    const headerRow = document.createElement('div');
                    headerRow.classList.add('race-header');
                    headerRow.id = 'headerRow';
                    headerRow.innerHTML = `
                        <span>Name</span>
                        <span>Club</span>
                        <span>Result</span>
                        <span>Info</span>
                    `;
                    fragment.appendChild(headerRow);
                    
                    // Process each entrant and append to the fragment
                    for (let entrant of data) {
                        let entrantDetails;
                        try {
                            entrantDetails = await fetchEntrantById(entrant.entrant_number);
                        } catch (error) {
                            console.error('Error fetching entrant details:', error);
                            entrantDetails = {}; // Set a default empty object in case of error
                        }
                        console.log(entrant.signed_in);
                        if (entrant.signed_in === 1){
                            const entrantRow = document.createElement('div');
                            entrantRow.classList.add('entrant-row');
                            entrantRow.style.display = 'grid';
                            entrantRow.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'; // Adjust the columns as needed
                            entrantRow.style.alignItems = 'center';
                            entrantRow.style.gap = '10px'; // Adjust the gap between items
                            entrantRow.id = 'entrant-' + entrant.entrant_number;

                            // Create name label
                            let nameLabel = document.createElement('span');
                            nameLabel.textContent = (entrantDetails.forename || '') + " " + (entrantDetails.surname || '');

                            // Create club label
                            let clubLabel = document.createElement('span');
                            clubLabel.textContent = entrantDetails.club || '';

                            // Use the result directly from the fetched data
                            const input = document.createElement('input');
                            input.type = 'text'; // Set input type to 'text' to allow custom format
                            input.placeholder = 'Result'; // Update placeholder to show correct format
                            input.pattern = '^[0-5]?[0-9]:[0-5][0-9]\\.[0-9]{2}$'; // Set pattern for validation
                            input.title = 'Format: MM:SS.sss (e.g., 1:53.47)';
                            input.value = entrant.result || ''; // Use the result directly from the fetched data
                            input.id = 'entrant-result-' + entrant.entrant_number; // Assign a unique ID

                            // Create the info button
                            let info = document.createElement('button');
                            info.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i>';
                            info.id = 'info-btn-' + entrant.entrant_number;
                            info.onclick = function () {
                                showEntrantDetails(entrantDetails, raceId, displayEntrantsDataResults);
                            };

                            // Create a container for the buttons and align them to the right
                            let actionsContainer = document.createElement('div');
                            actionsContainer.style.display = 'flex';
                            actionsContainer.style.justifyContent = 'center'; // Align buttons to the right
                            actionsContainer.appendChild(info);

                            // Append elements to the entrant row
                            entrantRow.appendChild(nameLabel);
                            entrantRow.appendChild(clubLabel);
                            entrantRow.appendChild(input);
                            entrantRow.appendChild(actionsContainer);

                            // Append entrant row to the fragment
                            fragment.appendChild(entrantRow);

                            // Add entrant number to the list
                            entrantsList.push(entrant.entrant_number);
                        }
                    }

                    // Append the fragment to the DOM
                    entrants.appendChild(fragment);

                    resolve(entrantsList);
                })
                .catch(error => {
                    console.error('Error fetching entrants data:', error);
                    reject(error);
                });
        } else {
            document.getElementById("addEntrantBtn").style.display = 'none';
            document.getElementById("deleteEntrantsBtn").style.display = 'none';
            resolve([]);
        }
    });
}

function fetchEntrantsData() {
    document.getElementById('deleteEntrantBtn').style.backgroundColor = '#850000';
    return new Promise((resolve, reject) => {
        const raceId = document.getElementById("raceSelect").value;
        if (raceId !== "" && raceId !== "Select a race") {
            fetch(`http://localhost:3000/entrants/${raceId}`)
                .then(response => response.json())
                .then(async (data) => { // Make this async to use await inside
                    const entrants = document.getElementById('entrants');
                    entrants.innerHTML = ''; // Clear previous options
                    const entrantsList = [];
                    
                    // Create and append the header row
                    const headerRow = document.createElement('div');
                    headerRow.classList.add('race-header');
                    headerRow.innerHTML = `
                        <span>Name</span>
                        <span>Club</span>
                        <span>PB</span>
                        <span>Actions</span>
                    `;
                    entrants.appendChild(headerRow);
                    
                    // Process each entrant
                    for (const entrant of data) {
                        const entrantRow = document.createElement('div');
                        entrantRow.classList.add('entrant-row');
                        entrantRow.style.display = 'grid';
                        entrantRow.style.gridTemplateColumns = '1fr 1fr 1fr 1fr'; // Adjust the columns as needed
                        entrantRow.style.alignItems = 'center';
                        entrantRow.style.gap = '10px'; // Adjust the gap between items
                        entrantRow.id = 'entrant-'+entrant.entrant_number;

                        // Create name label
                        let nameLabel = document.createElement('span');
                        nameLabel.textContent = entrant.forename + " " + entrant.surname;
                        
                        // Create club label
                        let clubLabel = document.createElement('span');
                        clubLabel.textContent = entrant.club;

                        // Fetch personal best asynchronously
                        let pbLabel = document.createElement('span');
                        try {
                            let pb = await getEntrantPb(raceId, entrant.entrant_number);
                            pb = pb[0]['pb'];
                            if (pb === 'null' || pb === 'undefined'){
                                pb = 'no pb';
                            }
                            pbLabel.textContent = pb;
                        } catch (error) {
                            pbLabel.textContent = 'N/A'; // Handle error gracefully
                        }

                        // Create the info button
                        let info = document.createElement('button');
                        info.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i>';
                        info.id = 'info-btn-' + entrant.entrant_number;
                        info.onclick = function () {
                            showEntrantDetails(entrant, raceId, fetchEntrantsData);
                        };

                        // Create the delete button
                        let bin = document.createElement('button');
                        bin.innerHTML = '<i class="fa fa-trash-alt" aria-hidden="true"></i>';
                        bin.id = 'delete-btn-' + entrant.entrant_number;
                        bin.style.display = 'none';
                        bin.onclick = async function () {
                            await confirmDeletionEntrant(entrant.entrant_number, raceId, false);
                        };

                        // Create a container for the buttons and align them to the right
                        let actionsContainer = document.createElement('div');
                        actionsContainer.style.display = 'flex';
                        actionsContainer.style.justifyContent = 'center'; // Align buttons to the right
                        actionsContainer.appendChild(info);
                        actionsContainer.appendChild(bin);

                        // Append elements to the entrant row
                        entrantRow.appendChild(nameLabel);
                        entrantRow.appendChild(clubLabel);
                        entrantRow.appendChild(pbLabel);
                        entrantRow.appendChild(actionsContainer);

                        // Append entrant row to the entrants container
                        entrants.appendChild(entrantRow);

                        // Add entrant number to the list
                        entrantsList.push(entrant.entrant_number);
                    }
                    
                    resolve(entrantsList);
                })
                .catch(error => reject(error));
        } else {
            if (document.getElementById('raceSelect').value !== '') {
                document.getElementById("addEntrantBtn").style.display = 'none';
                document.getElementById("deleteEntrantsBtn").style.display = 'none';
            }            
            resolve([]);
        }
    });
}

async function getEntrantPb(raceId, entrantNumber) {
    try {
        const response = await fetch(`http://localhost:3000/pb/${raceId}/${entrantNumber}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const pb = await response.json();
        return pb;
    } catch (error) {
        console.error('Failed to fetch PB:', error);
        return null; // Return null in case of an error
    }
}

async function fetchHeats(entrantNumber) {
    try {
        const response = await fetch(`http://localhost:3000/heats/${entrantNumber}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const heats = await response.json();
        return heats;
    } catch (error) {
        console.error('Failed to fetch heats:', error);
        return null; // Return null in case of an error
    }
}

// async function accept() {
//     const checkboxes = document.querySelectorAll('#entrantList input[type="checkbox"]');
//     const entrants = Array.from(checkboxes).map(cb => ({
//         entrant_number: cb.value,
//         race_id: cb.dataset.raceId, // Get race_id from dataset
//         accepted: cb.checked
//     }));

//     console.log("entrants: ", entrants);
//     try {
//         // Fetch current accepted arrays from the server
//         const response = await fetch('http://localhost:3000/entrants/current_accepted', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ entrants: entrants.map(e => e.entrant_number) })
//         });
//         const currentAcceptedData = await response.json();
//         console.log("currentAccepted: ", currentAcceptedData);

//         // Filter and prepare the data to be sent to the server for updating
//         const entrantsToUpdate = entrants.map(entrant => {
//             let currentAccepted = currentAcceptedData[entrant.entrant_number] || [];
//             console.log("current accepted before update: ", currentAccepted);

//             // Ensure currentAccepted is an array and filter out null values
//             currentAccepted = Array.isArray(currentAccepted) ? currentAccepted.filter(item => item !== null) : [];
//             console.log("current accepted after filter: ", currentAccepted);

//             if (entrant.accepted) {
//                 if (!currentAccepted.includes(entrant.race_id)) {
//                     currentAccepted.push(entrant.race_id);
//                 }
//             } else {
//                 currentAccepted = currentAccepted.filter(id => id !== entrant.race_id);
//             }
//             return {
//                 entrant_number: entrant.entrant_number,
//                 accepted: currentAccepted
//             };
//         });

//         // Send the updated accepted arrays to the server
//         const updateResponse = await fetch('http://localhost:3000/entrants/accept_entrants', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ entrants: entrantsToUpdate })
//         });
//         const data = await updateResponse.json();
//         console.log(data);

//         // Reload entrants after updating
//         await fetchEntrantsData();
//     } catch (error) {
//         console.error('Failed to accept entrants:', error);
//     }
// }

async function declare() {
    const checkboxes = document.querySelectorAll('#entrants input[type="checkbox"]');
    const entrants = Array.from(checkboxes).map(cb => ({
        entrant_number: cb.value,
        race_id: cb.dataset.raceId,
        signed_in: cb.checked
    }));

    try {
        // Send the updated signed_in statuses to the server
        const response = await fetch('http://localhost:3000/entrants/update_signed_in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ entrants })
        });

        if (!response.ok) {
            throw new Error(`Error updating signed_in statuses: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);

        // Update the DOM based on the checkboxes
        entrants.forEach(entrant => {
            const entrantRow = document.getElementById('entrant-' + entrant.entrant_number);
            const checkbox = entrantRow.querySelector('input[type="checkbox"]');
            checkbox.checked = entrant.signed_in;

            if (entrant.signed_in) {
                entrantRow.style.background = 'rgba(0, 39, 129, 0.595)';
                entrantRow.style.color = 'rgba(255,255,255,1)';
            } else {
                entrantRow.style.background = '';
                entrantRow.style.color = '';
            }
        });
    } catch (error) {
        console.error('Failed to update signed_in statuses:', error);
    }
}

function addRace(eventData, onClose) {
    const { name, age_group, gender, date, time, location, heat_size, price, description } = eventData;
    fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name, age_group, gender, date, time, location, heat_size, price,  description})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert("Race added successfully!");
        if(document.getElementById("addRaceModal") !== null){
            document.getElementById("addRaceModal").style.display = "none";
        }
        onClose();
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to add race. Please try again.");
    });
}

function updateRaceDetails(race) {
    const { race_id, ...details } = race;
    console.log("api function, race name: ",details.name);
    fetch(`http://localhost:3000/events/update/${race_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)  // Send details directly, not nested in an object
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert("Race updated successfully!");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to update race. Please try again.");
    });
}

function updateEntrantDetails(entrant){
    const { entrant_number, ...details } = entrant;
    console.log("api function, race name: ",details.forename);
    fetch(`http://localhost:3000/entrants/update/${entrant_number}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)  // Send details directly, not nested in an object
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert("Entrants details updated successfully!");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to update entrants details. Please try again.");
    });

}

function addEntrant(entrantData) {
    const {forename, surname, gender, dob, club, federation, email, phone, address, races} = entrantData;

    fetch('http://localhost:3000/entrants/addentrants', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forename, surname, gender, dob, club, federation, email, phone, address, races })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert("Entrant added successfully!");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to add entrant. Please try again.");
    });
}

function deleteEntrant(entrantId, raceId) {
    fetch(`http://localhost:3000/entrants/remove/${entrantId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entrantId, raceId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log(result);
        alert("Entrant deleted successfully!");
        const entrantRow = document.getElementById(`entrant-${entrantId}`);
        if (entrantRow) {
            entrantRow.remove();
            removeEntrant(entrantId);
        } else {
            console.error('Entrant row not found.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to delete entrant.");
    });
}

function deleteEntrantFull(entrantId) {
    fetch(`http://localhost:3000/entrants/delete/full/${entrantId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        alert("Entrant deleted successfully!");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to delete entrant.");
    });
}

function deleteRace(raceId) {
    fetch(`http://localhost:3000/races/delete/${raceId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(result => {
        console.log(result);
        alert("Race deleted successfully!");

        // Find the race element by ID and remove it
        const raceElement = document.getElementById(`race-${raceId}`);
        if (raceElement) {
            raceElement.remove();
        } else {
            console.warn(`Element with ID race-${raceId} not found`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to delete race. Frontend");
    });
}

async function addRaceToEntrant(entrantNumber, raceId) {
    try {
        const response = await fetch('http://localhost:3000/add/entrants/races', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entrantNumber: entrantNumber,
                raceId: raceId
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Race added successfully:', data);
    } catch (error) {
        console.error('Error adding race:', error);
    }
}

async function createHeats(heats, entrants, race) {
    try {
        const response = await fetch('http://localhost:3000/heats/set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entrants,
                heats,
                race
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);
        return data;
    }catch (error) {
        console.error('Error setting heats:', error);
    }
}

export { fetchRaces, fetchAndPopulateRaces, fetchEntrantsData, fetchEntrantsData2, addRace, addEntrant, declare, deleteEntrant, deleteEntrantFull, deleteRace, updateRaceDetails, updateEntrantDetails, fetchAndPopulateEntrants, addRaceToEntrant, fetchEntrants, getEntrantPb, fetchRaceById, fetchDeclaredEntrants, createHeats, fetchEntrantsByID, fetchAndPopulateRacesResults, displayEntrantsDataResults, fetchAndPopulateHeats, fetchHeats};
