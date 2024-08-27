import {
    fetchEntrantsData2, 
    fetchAndPopulateRaces, 
    addEntrant, 
    declare, 
    addRaceToEntrant, 
    fetchEntrants, 
    fetchRaceById,
    fetchDeclaredEntrants,
    createHeats,
    fetchHeats
} from './api.js';
import { formatRaceName, filterAcceptable } from './utils.js';
import { confirmFullDeletionEntrant } from './ui.js';
import { getEntrants, setEntrants } from './entrantState.js';

window.onload = function () {
    fetchAndPopulateRaces();
    // Initially hide modals and buttons
    document.getElementById("addEntrantModal").style.display = "none";
    document.getElementById('addExistingEntrantBtn').style.display = 'none';
    document.getElementById('deleteEntrantBtn').style.display = 'none';
};

// DOM element references
let addExistingBtn = document.getElementById('addExistingEntrantBtn');
let deleteEntrantButton = document.getElementById('deleteEntrantBtn');
let declareBtn = document.getElementById('declareButton');

// State management
let entrantList = getEntrants();

// Event listener for race selection
document.getElementById("raceSelect").addEventListener('change', async function() {
    try {
        document.getElementById('entrants').style.display = 'block';
        setEntrants(await fetchEntrantsData2());
        entrantList = getEntrants();
        // Show relevant buttons
        addExistingBtn.style.display = 'block';
        deleteEntrantButton.style.display = 'block';
        deleteEntrantButton.setAttribute('data-selected', false);// deselect the delete button
        declareBtn.style.display = 'block';
        console.log("Entrant List: ", entrantList); // Debug: Verify fetched data
    } catch (error) {
        console.error('Error fetching entrants:', error);
    }
});

// Event listener for form submission
document.getElementById('entrantModal').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the default form submission

    if (validateForm(event)) {
        collectFormData(); // Collect and process form data
        toggleModal(); // Hide the modal
        setEntrants(await fetchEntrantsData2()); // Fetch and set entrants data
        entrantList = getEntrants(); // Update the entrant list
    }
});

// Hide modal on outside click
window.onclick = function (event) {
    if (event.target == document.getElementById("entrantModal")) {
        document.getElementById("entrantModal").style.display = "none";
    }
};

// Event listener for declaring entrants
document.getElementById("declareButton").onclick = async () => {
    await declare();
};

// Fetch and populate race form
async function fetchAndPopulateRacesForm() {
    try {
        const response = await fetch('http://localhost:3000/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Populate the dropdown
        const raceOptions = document.getElementById('raceOptions');
        raceOptions.innerHTML = ''; // Clear previous options
        data.forEach(event => {
            let container = document.createElement('div');
            container.className = 'raceContainer';
            let label = document.createElement('label');
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = event.race_id;
            checkbox.name = 'races';
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(formatRaceName(event)));
            container.appendChild(label);
            let pbInput = document.createElement('input');
            pbInput.type = 'text'; // Allow custom format
            pbInput.name = `pb_${event.race_id}`;
            pbInput.placeholder = 'PB'; // Show correct format
            pbInput.pattern = '^[0-5]?[0-9]:[0-5][0-9]\\.[0-9]{2}$'; // Validation pattern
            pbInput.title = 'Format: MM:SS.sss (e.g., 1:53.47)'; // Tooltip for guidance
            pbInput.required = false;
            container.appendChild(pbInput);
            let brk = document.createElement('br');
            container.appendChild(brk);
            raceOptions.appendChild(container);
        });    
        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Collect form data and add an entrant
function collectFormData () {
    // Collect form data
    const entrantData = {
        forename: document.getElementById('forename').value.trim().toLowerCase(),
        surname: document.getElementById('surname').value.trim().toLowerCase(),
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        club: document.getElementById('club').value.trim().toLowerCase(),
        federation: document.getElementById('federation_member').value.trim().toLowerCase(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone_number').value.trim().toLowerCase(),
        address: document.getElementById('address').value.trim().toLowerCase(),
        races: Array.from(document.querySelectorAll('#raceOptions input[name="races"]:checked')).map(checkbox => ({
            race_id: checkbox.value,
            pb: document.querySelector(`input[name="pb_${checkbox.value}"]`).value
        }))
    };

    addEntrant(entrantData);  // Call the function to submit data
    console.log("Entrant added");
}

function validateForm(event) {
    const form = document.getElementById('entrantModal');
    if (!form.checkValidity()) {
        // Form is not valid, prevent submission
        event.preventDefault();
        event.stopPropagation();
        alert("Please fill in all required fields.");
        return false;
    }

    // Form is valid, allow submission
    return true;
}

// Toggle modal visibility
export function toggleModal () {
    if (document.getElementById("addEntrantModal").style.display === 'none') {
        document.getElementById("addEntrantModal").style.display = "block";
    } else {
        document.getElementById("addEntrantModal").style.display = "none";
    }
    fetchAndPopulateRacesForm();
}

// Toggle delete button visibility and state
export function toggleDeleteBtn () {
    const deleteButtons = document.querySelectorAll('button[id^="delete-btn-"]');
    const infoButtons = document.querySelectorAll('button[id^="info-btn-"]');
    const deleteBtn = document.getElementById('deleteEntrantBtn');
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
    }
    else {
        deleteBtn.style.backgroundColor = '#850000';
        deleteBtn.setAttribute('data-selected', 'false');
    }
}

// Display modal for removing entrant
export function deleteEntrantModal() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup-deleteEntrant';

    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.onclick = function () {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
        const raceSelect = document.getElementById('raceSelect');
        if (raceSelect) {
            const raceSelectValue = raceSelect.value;
            if (raceSelectValue !== "" && raceSelectValue !== "null") {
                fetchEntrantsData2();
                console.log(raceSelectValue);
            }
        } else {
            console.log("raceSelect element does not exist.");
        }
    };
    popup.appendChild(closeButton);

    const label = document.createElement('label');
    label.id = 'delete-label';
    label.textContent = 'Delete an entrant';

    const input = document.createElement('input');
    input.id = 'entrantInput';
    input.type = 'text';
    input.placeholder = 'Type to search...';

    const suggestions = document.createElement('div');
    suggestions.id = 'suggestions';
    suggestions.className = 'suggestions';

    const inputDiv = document.createElement('div');
    inputDiv.id = 'deleteInputDiv';
    inputDiv.appendChild(input);
    inputDiv.appendChild(suggestions);

    const middleDiv = document.createElement('div');
    middleDiv.id = 'deleteMiddleDiv';
    middleDiv.appendChild(label);
    middleDiv.appendChild(inputDiv);

    popup.appendChild(middleDiv);

    const save = document.createElement('button');
    save.id = 'deleteEntrantSave';
    save.className = 'delete-btn';
    save.textContent = 'Delete';
    save.onclick = async function () {
        const selectedEntrant = input.dataset.selectedEntrant;
        let heats;
        try {
            heats = await fetchHeats(selectedEntrant);
        } catch (error) {
            // Handle the error here
            console.error('Error fetching heats:', error);
        }
        console.log(heats);

        if (!selectedEntrant) {
            alert("Please select an entrant");
        } else if (heats.length !== 0) {
            alert("This entrant is already declared and entered into a heat, please go to declarations and un-declare the athlete, then re-generate the heats before deleting the athlete");
        } else {
            confirmFullDeletionEntrant(selectedEntrant);
            document.body.removeChild(popup);
            document.body.removeChild(overlay);
            fetchEntrantsData2();
        }
    };
    popup.appendChild(save);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    fetchPopulate();

    async function fetchPopulate() {
        const entrants = await fetchEntrants();
        input.addEventListener('input', () => filterSuggestions(entrants));
    }

    function filterSuggestions(entrants) {
        const query = input.value.toLowerCase();
        suggestions.innerHTML = '';
        if (!query) return;

        const filteredEntrants = entrants.filter(entrant => {
            const fullName = `${entrant.forename} ${entrant.surname}`.toLowerCase();
            return fullName.includes(query);
        });

        filteredEntrants.forEach(entrant => {
            const fullName = `${entrant.forename} ${entrant.surname}`;
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = fullName;
            suggestionItem.onclick = () => {
                input.value = fullName;
                input.dataset.selectedEntrant = entrant.entrant_number;
                suggestions.innerHTML = '';
            };
            suggestions.appendChild(suggestionItem);
        });
    }
}

// Add race to an entrant
export async function addEntrantRace() {
    try {
        // Fetch current entrants and race details
        entrantList = getEntrants();
        const raceSelect = document.getElementById('raceSelect');
        const race = await fetchRaceById(raceSelect.value);

        // Create overlay for the popup
        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';

        // Create the popup container
        const popup = document.createElement('div');
        popup.className = 'popup-addEntrant';

        // Create and configure the close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close';
        closeButton.onclick = function () {
            document.body.removeChild(popup);
            document.body.removeChild(overlay);
            fetchEntrantsData2();
        };
        popup.appendChild(closeButton);

        // Create the label for adding an entrant
        const label = document.createElement('label');
        label.id = 'add-existing-label';
        label.textContent = 'Add an entrant';
        popup.appendChild(label);

        // Create the input field for entrant search
        const input = document.createElement('input');
        input.id = 'entrantInput';
        input.type = 'text';
        input.placeholder = 'Type to search...';

        // Create the suggestions container
        const suggestions = document.createElement('div');
        suggestions.id = 'suggestions';
        suggestions.className = 'suggestions';

        // Create a div to wrap input and suggestions
        const inputDiv = document.createElement('div');
        inputDiv.id = 'addInputDiv';
        inputDiv.appendChild(input);
        inputDiv.appendChild(suggestions);

        // Create a div to wrap label and inputDiv
        const middleDiv = document.createElement('div');
        middleDiv.id = 'addMiddleDiv';
        middleDiv.appendChild(label);
        middleDiv.appendChild(inputDiv);

        popup.appendChild(middleDiv);

        // Create and configure the save button
        const save = document.createElement('button');
        save.id = 'addEntrantSave';
        save.className = 'save-btn';
        save.textContent = 'Add';
        const value = raceSelect.value;

        save.onclick = async function () {
            try {
                await addRaceToEntrant(input.dataset.selectedEntrant, value);
                console.log("entrant_id :", input.dataset.selectedEntrant);
                console.log("race_id :", value);
                document.body.removeChild(popup);
                document.body.removeChild(overlay);
                setEntrants(await fetchEntrantsData2());
                entrantList = getEntrants();
            } catch (error) {
                console.error('Failed to add race to entrant:', error);
                alert('Failed to add race to entrant. Please try again.');
            }
        };
        popup.appendChild(save);
        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // Fetch and populate suggestions with filtering
        fetchPopulate();

        async function fetchPopulate() {
            const entrants = await fetchEntrants();
            const filteredEntrants = filterAcceptable(race.age_group, race.gender, entrants, entrantList);
            console.log("filtered list: ", filteredEntrants);
            input.addEventListener('input', () => filterSuggestions(filteredEntrants));
            filterSuggestions(filteredEntrants); // Initial filter and display
            if (filteredEntrants.length === 0) {
                // Display warning if no entrants match
                const warning = document.createElement('div');
                warning.className = 'warning-message';
                warning.textContent = 'no entrants match the race description.';
                warning.style.color = 'rgba(255,0,0,1)';
                suggestions.appendChild(warning);
            } else {
                input.addEventListener('input', () => filterSuggestions(filteredEntrants));
                filterSuggestions(filteredEntrants); // Initial filter and display
            }
        }

        function filterSuggestions(entrants) {
            const query = input.value.toLowerCase();
            suggestions.innerHTML = '';
            if (!query) return;

            const filteredEntrants = entrants.filter(entrant => {
                const fullName = `${entrant.forename} ${entrant.surname}`.toLowerCase();
                return fullName.includes(query);
            });

            filteredEntrants.forEach(entrant => {
                const fullName = `${entrant.forename} ${entrant.surname}`;
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = fullName;
                suggestionItem.onclick = () => {
                    input.value = fullName;
                    input.dataset.selectedEntrant = entrant.entrant_number;
                    suggestions.innerHTML = '';
                };
                suggestions.appendChild(suggestionItem);
            });
        }
    } catch (error) {
        console.error('Error initializing add entrant race popup:', error);
        alert('Failed to initialize the add entrant race popup. Please try again.');
    }
}

// Generates heats based on declarations and pbs
export async function generateHeats() {
    const race_id = document.getElementById('raceSelect').value;
    console.log(race_id);

    if (race_id !== null && race_id !== 'Select a race' && document.getElementById('raceSelect').value) {
        const race = await fetchRaceById(race_id);
        const heat_size = race.heat_size;

        const entrants = await fetchDeclaredEntrants(race_id);

        if (!entrants || entrants.length === 0) {
            alert("There are no entrants declared in this race, please declare before generating the heats.");
            return;
        }

        // Function to convert time PB string to total milliseconds
        const pbToMilliseconds = (pb) => {
            const [minutes, rest] = pb.split(':');
            const [seconds, milliseconds] = rest.split('.');
            return (parseInt(minutes) * 60 * 1000) + (parseInt(seconds) * 1000) + parseInt(milliseconds);
        };

        // Function to convert distance PB string to a float (removing any 'm' suffix)
        const pbToFloat = (pb) => {
            return parseFloat(pb.replace('m', '').trim());
        };

        // Separate entrants with no PBs and those with valid PBs
        const noPbEntrants = entrants.filter(entrant => !entrant.pb || entrant.pb === "00:00.00" || entrant.pb === "0.00");
        const validPbEntrants = entrants.filter(entrant => entrant.pb && entrant.pb !== "00:00.00" && entrant.pb !== "0.00");

        // Detect if the PB is a time or a distance
        const isTimeFormat = (pb) => /^[0-9]+:[0-9]{2}\.[0-9]{2}$/.test(pb);
        const isDistanceFormat = (pb) => /^[0-9]+(\.[0-9]+)?m?$/.test(pb);

        // Sort entrants based on the format of their PBs
        const sortedEntrants = validPbEntrants
            .map(entrant => {
                if (isTimeFormat(entrant.pb)) {
                    return {
                        entrant_number: entrant.entrant_number,
                        pb: entrant.pb,
                        pbInValue: pbToMilliseconds(entrant.pb),
                        type: 'time'
                    };
                } else if (isDistanceFormat(entrant.pb)) {
                    return {
                        entrant_number: entrant.entrant_number,
                        pb: entrant.pb,
                        pbInValue: pbToFloat(entrant.pb),
                        type: 'distance'
                    };
                } else {
                    return {
                        entrant_number: entrant.entrant_number,
                        pb: entrant.pb,
                        pbInValue: null,
                        type: 'unknown'
                    };
                }
            })
            .filter(entrant => entrant.pbInValue !== null)
            .sort((a, b) => a.type === 'time' ? a.pbInValue - b.pbInValue : b.pbInValue - a.pbInValue);

        // Create heats
        const heats = [];
        for (let i = 0; i < sortedEntrants.length; i += heat_size) {
            heats.push(sortedEntrants.slice(i, i + heat_size).map(entrant => ({
                entrant_number: entrant.entrant_number,
                pb: entrant.pb
            })));
        }

        // Add entrants with no PB to the last heat
        if (heats.length === 0) {
            heats.push(noPbEntrants);
        } else {
            heats[heats.length - 1] = heats[heats.length - 1].concat(noPbEntrants.map(entrant => ({
                entrant_number: entrant.entrant_number,
                pb: entrant.pb
            })));
        }

        await createHeats(heats, entrants, race);

        // Update UI elements
        const headerRow = document.getElementById('headerRow');
        headerRow.style.backgroundColor = 'rgba(133, 0, 0, 1)';
        let warning = document.getElementById('warning');
        warning.textContent = '* this race has generated heats *';
        warning.style.color = 'red';
        
        alert("Heats generated successfully!");
    } else {
        alert('Please select a race first.');
    }
}

//Creates an info guide for the current editor
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

// Expose functions to global scope
window.toggleModal = toggleModal;
window.addEntrantRace = addEntrantRace;
window.toggleDeleteBtn = toggleDeleteBtn;
window.deleteEntrantModal = deleteEntrantModal;
window.generateHeats = generateHeats;
window.infoGuide = infoGuide;
