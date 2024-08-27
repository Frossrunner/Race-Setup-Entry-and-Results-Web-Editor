import {
    displayEntrantsDataResults, 
    fetchAndPopulateRacesResults, 
    fetchAndPopulateHeats,
    addEntrant, 
    declare, 
    addRaceToEntrant, 
    fetchEntrants, 
    fetchRaceById,
    fetchDeclaredEntrants,
    createHeats
} from './api.js';
import { formatRaceName, filterAcceptable } from './utils.js';
import { confirmFullDeletionEntrant } from './ui.js';
import { getEntrants, setEntrants } from './entrantState.js';

window.onload = function () {
    fetchAndPopulateRacesResults();
    // document.getElementById('addExistingEntrantBtn').style.display = 'none';
    // document.getElementById('deleteEntrantBtn').style.display = 'none';
    document.getElementById('heatSelect').style.display = 'none';
};


let addExistingButton = document.getElementById('addExistingEntrantBtn');
// let deleteEntrantButton = document.getElementById('deleteEntrantBtn');
let heatSelect = document.getElementById('heatSelect');

document.getElementById("raceSelect").addEventListener('change', async function() {
    try {
        document.getElementById('entrants').style.display = 'none';
        heatSelect.style.display = 'block';
        fetchAndPopulateHeats(document.getElementById('raceSelect').value);
        // addExistingButton.style.display = 'none';
        // deleteEntrantButton.style.display = 'none';
        // deleteEntrantButton.setAttribute('data-selected', false);// deselect the delete button
    } catch (error) {
        console.error('Error fetching entrants:', error);
    }
});

document.getElementById("heatSelect").addEventListener('change', async function() {
    try {
        document.getElementById('entrants').style.display = 'block';
        setEntrants(await displayEntrantsDataResults());
        // addExistingButton.style.display = 'block';
        // deleteEntrantButton.style.display = 'block';
        // deleteEntrantButton.setAttribute('data-selected', false);
    } catch (error) {
        console.error('Error fetching entrants:', error);
    }
});

document.getElementById("resultSave").addEventListener('click', async function() {
    let raceId = document.getElementById('raceSelect').value;
    const race = await fetchRaceById(raceId); // Ensure raceId is available
    const entrantElements = document.querySelectorAll('[id^="entrant-result-"]');
    const results = [];
    
    entrantElements.forEach(input => {
        const entrantNumber = input.id.split('entrant-result-')[1];
        const result = input.value;    
        results.push({ race_id: raceId, entrant_number: entrantNumber, result: result });
    });
    
        // Send collected data to the server
    try {
        const response = await fetch(`http://localhost:3000/update-entrant-results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(results)
        });
    
        if (!response.ok) {
                throw new Error('Network response was not ok');
        }
    
        const responseData = await response.json();
        console.log('Update successful:', responseData);
    } catch (error) {
       console.error('Error updating entrant results:', error);
    }
    setEntrants(await displayEntrantsDataResults());
});

document.getElementById("resultPost").addEventListener('click', async function() {
    alert('Results posted to website succesfully!');
});

export function infoGuide() {
    // Create overlay for the popup
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    // Create the popup container
    const popup = document.createElement('div');
    popup.className = 'info-popup';

    // Create and configure the close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.onclick = function () {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
    };
    popup.appendChild(closeButton);

    // Create the content for the popup
    const content = document.createElement('div');
    content.className = 'info-content';

    const header = document.createElement('h2');
    header.textContent = 'Event Editor Information Guide';
    content.appendChild(header);

    const paragraph1 = document.createElement('p');
    paragraph1.textContent = 'Welcome to the Event Editor! This tool allows you to manage your events efficiently. Here is what you can do:';
    content.appendChild(paragraph1);

    const list = document.createElement('ul');
    const listItem1 = document.createElement('li');
    listItem1.textContent = 'Create new events with specific details such as name, date, location, and more.';
    list.appendChild(listItem1);

    const listItem2 = document.createElement('li');
    listItem2.textContent = 'Edit existing events to update any information or correct mistakes.';
    list.appendChild(listItem2);

    const listItem3 = document.createElement('li');
    listItem3.textContent = 'Remove events that are no longer needed or were created by mistake.';
    list.appendChild(listItem3);

    const listItem4 = document.createElement('li');
    listItem4.textContent = 'View a list of all events along with their details for easy management.';
    list.appendChild(listItem4);

    content.appendChild(list);

    const paragraph2 = document.createElement('p');
    paragraph2.textContent = 'Use the buttons and forms provided to perform these actions and keep your events up to date.';
    content.appendChild(paragraph2);

    popup.appendChild(content);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

window.infoGuide = infoGuide;



