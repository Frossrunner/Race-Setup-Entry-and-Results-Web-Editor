import { fetchEntrantsData, fetchAndPopulateRaces, addEntrant, fetchAndPopulateEntrants, addRaceToEntrant, fetchEntrants, fetchRaceById, fetchHeats} from './api.js';
import { formatRaceName, filterAcceptable } from './utils.js';
import { confirmFullDeletionEntrant } from './ui.js';
import { getEntrants, setEntrants} from './entrantState.js';

window.onload = function () {
    fetchAndPopulateRaces();
    document.getElementById("addEntrantModal").style.display = "none";
    document.getElementById('addExistingEntrantBtn').style.display = 'none';
    document.getElementById('deleteEntrantBtn').style.display = 'none';
};

let addExistingBtn = document.getElementById('addExistingEntrantBtn');
let deleteEntrantButton = document.getElementById('deleteEntrantBtn');

let entrantList = getEntrants();

document.getElementById("raceSelect").addEventListener('change', async function() {
    try {
        document.getElementById('entrants').style.display = 'block';
        setEntrants(await fetchEntrantsData());
        entrantList = getEntrants();
        addExistingBtn.style.display = 'block';
        deleteEntrantButton.style.display = 'block';
        deleteEntrantButton.setAttribute('data-selected', false);// deselect the delete button
        console.log("Entrant List: ", entrantList); // Verify the fetched data
    } catch (error) {
        console.error('Error fetching entrants:', error);
    }
});

document.getElementById('entrantModal').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the default form submission

    if (validateForm(event)) {
        collectFormData(); // Collect and process form data
        toggleModal(); // Hide the modal
        setEntrants(await fetchEntrantsData()); // Fetch and set entrants data
        entrantList = getEntrants(); // Update the entrant list
    }
});

window.onclick = function (event) {
    if (event.target == document.getElementById("entrantModal")) {
        document.getElementById("entrantModal").style.display = "none";
    }
};

// document.getElementById("saveButton").onclick = async () => {
//     await accept();
//     await fetchEntrantsData();
// };

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
                pbInput.type = 'text'; // Change to 'text' to allow custom format
                pbInput.name = `pb_${event.race_id}`;
                pbInput.placeholder = 'Enter PB'; // Update placeholder to show correct format
                pbInput.pattern = '^[0-5]?[0-9]:[0-5][0-9]\\.[0-9]{2}$'; // Set pattern for validation
                pbInput.title = 'Format: MM:SS.sss (e.g., 1:53.47)'; // Tooltip for user guidance
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

export function toggleModal () {
    console.log("toggle");
    if (document.getElementById("addEntrantModal").style.display === 'none') {
        document.getElementById("addEntrantModal").style.display = "block";
    } else {
        document.getElementById("addEntrantModal").style.display = "none";
    }
    fetchAndPopulateRacesForm();
}

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
        console.log("blueeee");
    }
    else {
        deleteBtn.style.backgroundColor = '#850000';
        deleteBtn.setAttribute('data-selected', 'false');
    }
}

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
                fetchEntrantsData();
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
            fetchEntrantsData();
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
            fetchEntrantsData();
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
                addRaceToEntrant(input.dataset.selectedEntrant, value);
                document.body.removeChild(popup);
                document.body.removeChild(overlay);
                setEntrants(await fetchEntrantsData());
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


window.toggleModal = toggleModal;
window.addEntrantRace = addEntrantRace;
window.toggleDeleteBtn = toggleDeleteBtn;
window.deleteEntrantModal = deleteEntrantModal;
window.infoGuide = infoGuide;