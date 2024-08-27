import { deleteEntrant, deleteRace, updateRaceDetails, updateEntrantDetails, deleteEntrantFull, getEntrantPb, fetchEntrantsByID, fetchRaceById } from './api.js';
import { formatDate, formatTime } from './utils.js';

function showStatsEntrant(entrant) {
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    const info = document.createElement('div');
    info.className = 'popup-content';

    let name = document.createElement('label');
    name.htmlFor = 'entrant-' + entrant.id;
    name.textContent = `Name: ${entrant.name}`;

    let club = document.createElement('label');
    club.htmlFor = 'entrant-' + entrant.id;
    club.textContent = `Club: ${entrant.club}`;

    let DOB = document.createElement('label');
    DOB.htmlFor = 'entrant-' + entrant.id;
    DOB.textContent = `DOB: ${formatDate(entrant.DOB)}`;

    let PB = document.createElement('label');
    PB.htmlFor = 'entrant-' + entrant.id;
    PB.textContent = `PB: ${entrant.personalBests}`;

    info.appendChild(name);
    info.appendChild(club);
    info.appendChild(DOB);
    info.appendChild(PB);
    popup.appendChild(info);

    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close-button';
    closeButton.textContent = 'Close';
    closeButton.onclick = function () {
        document.body.removeChild(popup);
    };
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
}

function showRaceDetails(race, onClose) {
    const { race_id, ...details } = race;

    // Create popup elements
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup';

    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.onclick = function () {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        if (onClose) onClose();  // Call the onClose callback
    };
    popup.appendChild(closeButton);

    const header = document.createElement('h2');
    header.id = 'popup-header-' + race_id;
    header.className = 'label';
    header.textContent = details.name;
    popup.appendChild(header);

    const fields = {};

    const detailMappings = {
        name: 'Name:',
        age_group: 'Age Group:',
        gender: 'Gender:',
        date: 'Date:',
        time: 'Time:',
        location: 'Location:',
        heat_size: 'Heat Size:',
        price: 'Entry Price:',
        description: 'Description:'
    };

    Object.keys(detailMappings).forEach(key => {
        const label = document.createElement('p');
        label.className = 'label';
        label.textContent = detailMappings[key];
        
        const value = document.createElement('p');
        value.id = `popup-${key}-${race_id}`;
        let textValue = details[key];
        if (key === 'date'){textValue = formatDate(details[key]);}
        if (key === 'time'){textValue = formatTime(details[key]);}
        value.textContent = textValue;

        const input = document.createElement('input');
        input.style.display = 'none';  // Move style setting to the top
        if (key === 'date') {
            input.type = 'date';
            
            // Assuming details[key] is in the format 'YYYY-MM-DD'
            const dateParts = details[key].split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const day = parseInt(dateParts[2], 10)+1;
        
            // Construct the date in ISO format (YYYY-MM-DD)
            const isoFormattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            input.value = isoFormattedDate;
        } else if (key === 'time') {
            input.type = 'time';
            input.value = details[key];  // Ensure the value is in 'HH:MM' format
        } else {
            input.type = 'text';
            input.value = details[key];
        }
        input.id = `input-${key}-${race_id}`;

        fields[key] = { label: value, input: input };

        popup.appendChild(label);
        popup.appendChild(value);
        popup.appendChild(input);
    });

    const editButton = document.createElement('button');
    editButton.className = 'edit-btn';
    editButton.textContent = 'Edit';
    editButton.onclick = function () {
        enterEditMode(fields);
    };
    popup.appendChild(editButton);

    const saveButton = document.createElement('button');
    saveButton.className = 'save-btn';
    saveButton.style.display ='none';
    saveButton.textContent = 'Save';
    saveButton.onclick = function () {
        saveChanges(fields, race);
        exitEditMode(fields);
    };
    popup.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-btn';
    cancelButton.style.display = 'none';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function () {
        exitEditMode(fields);
    };
    popup.appendChild(cancelButton);

    // Append elements to the body
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    function enterEditMode(fields) {
        Object.values(fields).forEach(({ label, input }) => {
            label.style.display = 'none';
            input.style.display = 'block';
        });
        editButton.style.display = 'none';
        saveButton.style.display = 'inline';
        cancelButton.style.display = 'inline';
    }

    function exitEditMode(fields) {
        Object.values(fields).forEach(({ label, input }) => {
            label.style.display = 'block';
            input.style.display = 'none';
        });
        editButton.style.display = 'inline';
        saveButton.style.display = 'none';
        cancelButton.style.display = 'none';
    }

    function saveChanges(fields, race) {
        Object.keys(fields).forEach(key => {
            race[key] = fields[key].input.value;
            fields[key].label.textContent = fields[key].input.value;
        });
        updateRaceDetails(race);
    }
}

async function showEntrantDetails(entrant, raceId, onClose) {
    const { entrant_number, ...details } = entrant;

    // Fetch PB for the entrant
    let pb = await getEntrantPb(raceId, entrant_number);
    pb = pb[0]['pb'];

    // Create popup elements
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup';

    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.onclick = function () {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        if (onClose) onClose();  // Call the onClose callback
    };
    popup.appendChild(closeButton);

    const header = document.createElement('h2');
    header.id = 'popup-header-' + entrant_number;
    header.className = 'label';
    header.textContent = details.forename + " " + details.surname;
    popup.appendChild(header);

    const fields = {};

    const detailMappings = {
        forename: 'Forename:',
        surname: 'Surname:',
        gender: 'Gender:',
        dob: 'DOB:',
        club: 'Club:',
        federation_member: 'Federation Member:',
        email: 'Email:',
        phone_number: 'Phone Number:',
        address: 'Address:',
        pb: 'PB:',
    };

    Object.keys(detailMappings).forEach(key => {
        const label = document.createElement('p');
        label.className = 'label';
        label.textContent = detailMappings[key];
        
        const value = document.createElement('p');
        value.id = `popup-${key}-${entrant_number}`;
        let textContent = key === 'pb' ? pb : details[key];
        if (key === 'dob'){
            textContent = formatDate(details[key]);
        }
        value.textContent = textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = textContent;
        if (key === 'dob') {
            input.type = 'date';
            
            // Assuming details[key] is in the format 'YYYY-MM-DD'
            const dateParts = details[key].split('-');
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const day = parseInt(dateParts[2], 10)+1; // plus one comes from assumed problems with midnight
        
            // Construct the date in ISO format (YYYY-MM-DD)
            const isoFormattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            input.value = isoFormattedDate;
        }
        if (key === 'pb'){
            input.type = 'text'; // Change to 'text' to allow custom format
            input.placeholder = 'PB'; // Update placeholder to show correct format
            input.pattern = '^[0-5]?[0-9]:[0-5][0-9]\\.[0-9]{2}$'; // Set pattern for validation
            input.title = 'Format: MM:SS.sss (e.g., 1:53.47)';
            input.value = textContent;
        }
        input.id = `input-${key}-${entrant_number}`;
        input.style.display = 'none';

        fields[key] = { label: value, input: input };

        popup.appendChild(label);
        popup.appendChild(value);
        popup.appendChild(input);
    });

    const editButton = document.createElement('button');
    editButton.className = 'edit-btn';
    editButton.textContent = 'Edit';
    editButton.onclick = function () {
        enterEditMode(fields);
    };
    popup.appendChild(editButton);

    const saveButton = document.createElement('button');
    saveButton.className = 'save-btn';
    saveButton.style.display ='none';
    saveButton.textContent = 'Save';
    saveButton.onclick = async function () {
        saveChanges(fields, entrant, raceId);
        exitEditMode(fields);
    };
    popup.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-btn';
    cancelButton.style.display = 'none';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = function () {
        exitEditMode(fields);
    };
    popup.appendChild(cancelButton);

    // Append elements to the body
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    function enterEditMode(fields) {
        Object.values(fields).forEach(({ label, input }) => {
            label.style.display = 'none';
            input.style.display = 'block';
        });
        editButton.style.display = 'none';
        saveButton.style.display = 'inline';
        cancelButton.style.display = 'inline';
    }

    function exitEditMode(fields) {
        Object.values(fields).forEach(({ label, input }) => {
            label.style.display = 'block';
            input.style.display = 'none';
        });
        editButton.style.display = 'inline';
        saveButton.style.display = 'none';
        cancelButton.style.display = 'none';
    }

    async function saveChanges(fields, entrant, raceId) {
        Object.keys(fields).forEach(key => {
            entrant[key] = fields[key].input.value;
            fields[key].label.textContent = fields[key].input.value;
        });
        console.log("saving");
        updateEntrantDetails(entrant);

        // Update PB separately
        const pbValue = fields.pb.input.value;
        try {
            const response = await fetch(`http://localhost:3000/pb/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ entrant_number, race_id: raceId, pb: pbValue })
            });
            if (!response.ok) {
                throw new Error(`Error updating PB: ${response.status}`);
            }
            const result = await response.json();
            console.log('PB updated:', result);
        } catch (error) {
            console.error('Failed to update PB:', error);
            alert('Failed to update PB. Please try again.');
        }
    }
}

async function confirmDeletionEntrant(entrantId, raceId, isDeclaredEditor) {
    const race = await fetchRaceById(raceId);
    if (race.heats && !isDeclaredEditor){
        alert("This race has already had heats generated, the entrant canot be deleted here");
        return;
    }
    else if (confirm("Are you sure you want to remove this entrant from this event?")) {
        deleteEntrant(entrantId, raceId);
    }
}

function confirmFullDeletionEntrant(entrantId) {
    if (confirm("Are you sure you want to delete this entrant? This action will remove the entrant permanently from the database")) {
        deleteEntrantFull(entrantId);
    }
}

async function confirmDeletionRace(race) {
    // Fetch entrants for the given race
    const entrants = await fetchEntrantsByID(race.race_id);
    
    // Check if the race has generated heats
    if (race.heats && race.heats.length > 0) {
        alert("This race has already had heats generated! It cannot be deleted.");
        return;
    }

    // Check if there are entrants in the race
    if (entrants && entrants.length > 0) {
        if (confirm("There are entrants in this race! Are you sure you want to delete this race?")) {
            await deleteRace(race.race_id);
            alert("Race deleted successfully.");
        }
    } else {
        if (confirm("Are you sure you want to delete this race?")) {
            await deleteRace(race.race_id);
            alert("Race deleted successfully.");
        }
    }
}

function toggleDeleteButtons() {
    const deleteButtons = document.querySelectorAll('button[id^="delete-btn-"]');
    const infoButtons = document.querySelectorAll('button[id^="info-btn-"]');
    deleteButtons.forEach(button => {
        button.style.display = button.style.display === 'none' ? 'block' : 'none';
    });
    infoButtons.forEach(button => {
        button.style.display = button.style.display === 'none' ? 'block' : 'none';
    });
}

export {showStatsEntrant, confirmDeletionEntrant, confirmFullDeletionEntrant, confirmDeletionRace, toggleDeleteButtons, showRaceDetails, showEntrantDetails };
