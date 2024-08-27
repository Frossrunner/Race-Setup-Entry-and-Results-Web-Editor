import { fetchRaces, addRace } from './api.js';
import { confirmDeletionRace, showRaceDetails } from './ui.js';
import { formatDate, formatRaceGender, formatTime, orderTime } from './utils.js';


window.onload = async function () {
    await initializeRaces();
    const modal = document.getElementById('addRaceModal');
    modal.style.display = 'none';
};

// Initialize races and populate the grid
async function initializeRaces() {
    try {
        let races = await fetchRaces();
        if (!races) {
            console.error('No races fetched');
            return;
        }
        races = orderTime(races);
        
        const gridContainer = document.getElementById('raceGrid');
        gridContainer.innerHTML = '';  // Clear the grid container

        // Create headers
        const headerDiv = document.createElement('div');
        headerDiv.className = 'grid-item grid-item-header';
        headerDiv.innerHTML = '<div>Race Name</div><div>Date</div><div>Time</div><div>Info</div>';
        gridContainer.appendChild(headerDiv);

        races.forEach(race => {

            let raceDiv = document.createElement('div');
            raceDiv.id = 'race-' + race.race_id;
            raceDiv.className = 'grid-item';

            let nameDiv = document.createElement('div');
            nameDiv.textContent = formatRaceGender(race.gender) + ' ' + race.age_group + ' ' + race.name;
            raceDiv.appendChild(nameDiv);

            let dateDiv = document.createElement('div');
            dateDiv.textContent = formatDate(race.date);  // Format the date nicely
            raceDiv.appendChild(dateDiv);

            let timeDiv = document.createElement('div');
            timeDiv.textContent = formatTime(race.time);
            raceDiv.appendChild(timeDiv);

            let buttonDiv = document.createElement('div');
            let deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fa fa-trash-alt" aria-hidden="true"></i>';
            deleteButton.id = 'delete-btn-' + race.race_id;
            deleteButton.style.display = 'none';
            deleteButton.onclick = function () { 
                confirmDeletionRace(race); 
                initializeRaces(); 
                document.getElementById('removeRaceButton').style.backgroundColor = '#850000';
                document.getElementById('removeRaceButton').setAttribute('data-selected', 'false');
            };
            buttonDiv.appendChild(deleteButton);

            let infoButton = document.createElement('button');
            infoButton.innerHTML = '<i class="fas fa-info-circle" aria-hidden="true"></i>';
            infoButton.id = 'info-btn-' + race.race_id;
            infoButton.onclick = function () { showRaceDetails(race, initializeRaces); };
            buttonDiv.appendChild(infoButton);

            raceDiv.appendChild(buttonDiv);
            gridContainer.appendChild(raceDiv);
        });
    } catch (error) {
        console.error('Error initializing races:', error);
    }
}

// Capture form data and create a new race
export function handleRaceFormSubmit(event) {
    event.preventDefault();

    // Capture form data
    const raceName = document.getElementById('raceName').value;
    const raceAgeGroup = document.getElementById('raceAgeGroup').value;
    const raceGenderGroup = document.getElementById('raceGenderGroup').value;
    const raceDate = document.getElementById('raceDate').value;
    const raceTime = document.getElementById('raceTime').value;
    const raceLocation = document.getElementById('raceLocation').value;
    const raceHeatSize = document.getElementById('raceHeatSize').value;
    const racePrice = document.getElementById('racePrice').value;
    const raceDescription = document.getElementById('raceDescription').value;

    // Create an event object
    const eventData = {
        name: raceName,
        age_group: raceAgeGroup,
        gender: raceGenderGroup,
        date: raceDate,
        time: raceTime,
        location: raceLocation,
        heat_size: raceHeatSize,
        price: racePrice,
        description: raceDescription
    };

    addRace(eventData, initializeRaces);
    toggleAddRaceModal();
    document.getElementById('removeRaceButton').style.backgroundColor = '#850000';
    document.getElementById('removeRaceButton').setAttribute('data-selected', 'false');
    // Clear the form inputs
    const form = document.getElementById('createRaceForm');
    form.reset();
}

// Toggle the display of the add race modal
export function toggleAddRaceModal() {
    const modal = document.getElementById('addRaceModal');
    const addRaceBtn = document.getElementById('addRaceButton');
    if (modal.style.display === 'none' || modal.style.display === ''){
        modal.style.display = 'block';
        addRaceBtn.style.backgroundColor = '#230082';
    }
    else {
        modal.style.display = 'none';
        addRaceBtn.style.backgroundColor = '#850000';
    }
}

// Toggle the display of delete buttons
export function toggleDeleteButtons() {
    const deleteButtons = document.querySelectorAll('button[id^="delete-btn-"]');
    const infoButtons = document.querySelectorAll('button[id^="info-btn-"]');
    const deleteBtn = document.getElementById('removeRaceButton');
    deleteButtons.forEach(button => {
        button.style.display = button.style.display === 'none' ? 'block' : 'none';
    });
    infoButtons.forEach(button => {
        button.style.display = button.style.display === 'none' ? 'block' : 'none';
    });
    
    let isSelected = deleteBtn.getAttribute('data-selected') === 'true';
    if (!isSelected){
        deleteBtn.style.backgroundColor = '#230082';
        deleteBtn.setAttribute('data-selected',  'true');
        console.log("blueeee");
    }
    else {
        deleteBtn.style.backgroundColor = '#850000';
        deleteBtn.setAttribute('data-selected', 'false');
    }
}

//creates the event editor info Guide
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

// Expose functions to the global scope
window.toggleAddRaceModal = toggleAddRaceModal;
window.toggleDeleteButtons = toggleDeleteButtons;
window.handleRaceFormSubmit = handleRaceFormSubmit;
window.infoGuide = infoGuide;
