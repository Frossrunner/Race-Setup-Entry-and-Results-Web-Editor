import { formatRaceName, filterAcceptableRaces, isEntered } from './utils.js';
import { addEntrant } from './api.js';

window.onload = function () {
    fetchAndPopulateRaces();
    document.getElementById('submit-button').style.display = 'none';
};

raceOptions

async function fetchAndPopulateRaces() {
    try {
        const response = await fetch('http://localhost:3000/events');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        if (document.getElementById('dob').value && document.getElementById('gender').value) {
            data = filterAcceptableRaces(document.getElementById('dob').value, document.getElementById('gender').value, data);
        } else {
            data = [];
        }
        console.log(data);
        // Populate the checkbox list
        const raceOptions = document.getElementById('raceOptions');
        raceOptions.innerHTML = ''; // Clear previous options

        // Add headers
        const headerRow = document.createElement('div');
        headerRow.classList.add('race-header');
        headerRow.innerHTML = `
            <span>Event</span>
            <span>PB</span>
            <span>Price</span>
        `;
        raceOptions.appendChild(headerRow);

        data.forEach(event => {
            const raceRow = document.createElement('div');
            raceRow.classList.add('race-row');

            let label = document.createElement('label');

            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = event.race_id;
            checkbox.name = 'races';
            checkbox.className = 'checkbox';

            let pbInput = document.createElement('input');
            pbInput.type = 'text'; // Change to 'text' to allow custom format
            pbInput.name = `pb_${event.race_id}`;
            pbInput.placeholder = 'MM:SS.sss'; // Update placeholder to show correct format
            pbInput.pattern = '^[0-5]?[0-9]:[0-5][0-9]\\.[0-9]{2}$'; // Set pattern for validation
            pbInput.title = 'Format: MM:SS.sss (e.g., 1:53.47)'; // Tooltip for user guidance
            pbInput.required = true;

            let priceDisplay = document.createElement('span');
            let price = event.price;
            if (price === 0.00){
                price = 'free';
            }
            priceDisplay.textContent = `£${price}`;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(formatRaceName(event)));
            raceRow.appendChild(label);
            raceRow.appendChild(pbInput);
            raceRow.appendChild(priceDisplay);

            raceOptions.appendChild(raceRow);
        });

        return data;  // Return the data for further processing
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

function nextPage(pageNumber) {
    const currentPage = document.querySelector('.form-page:not([style*="display: none"])');

    if (validatePage(currentPage)) {
        if (currentPage) currentPage.style.display = 'none';

        const nextPage = document.getElementById(`page-${pageNumber}`);
        if (nextPage) nextPage.style.display = 'block';

        if (pageNumber === 5) {
            fetchAndPopulateRaces();
            document.getElementById('submit-button').style.display = 'block';
        }
    }
}

function prevPage(pageNumber) {
    const currentPage = document.querySelector('.form-page:not([style*="display: none"])');
    if (currentPage) currentPage.style.display = 'none';

    const prevPage = document.getElementById(`page-${pageNumber}`);
    if (prevPage) prevPage.style.display = 'block';

    document.getElementById('submit-button').style.display = 'none';
}

function validatePage(page) {
    let isValid = true;
    const requiredFields = page.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    if (!isValid) {
        alert('Please fill out all required fields.');
    }

    return isValid;
}

async function handleFormSubmission(entrantData) {
    const entrantExists = await isEntered(entrantData);

    if (!entrantExists) {
        addEntrant(entrantData);  // Call the function to submit data
        console.log("Form submitted:", entrantData);
    } else {
        alert("Entrant has already been entered, email to update entrant's details");
    }
}

async function collectFormData() {
    // Collect form data from all pages
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

    await handleFormSubmission(entrantData);
}


window.fetchAndPopulateRaces = fetchAndPopulateRaces;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.collectFormData = collectFormData;