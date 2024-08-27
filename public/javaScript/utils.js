import { fetchEntrants } from "./api.js";

function formatDate(date) {
    const dateUpdate = new Date(date);
    const formattedDate = dateUpdate.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false
    });
    return formattedDate;
}

function formatTime(time) {
    // Assume the time is a string in the format "HH:MM:SS"
    const [hours, minutes, seconds] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function formatRaceGender(gender) {
    
    if (gender == 'male'){
        return 'mens';
    }
    else if (gender == 'female'){
        return 'womens';
    }
    else {
        return 'open';
    }
}

function formatRaceName(race) {
    let raceGender = 'open';

    if (race.gender === 'male'){
        raceGender = 'm';
    }
    else if (race.gender === 'female'){
        raceGender = 'w';
    }

    let raceDetails = race.age_group+raceGender;

    if ((race.gender === 'open' || race.gender === 'mixed') && (race.age_group === 'open' || race.age_group === 'mixed')){
        raceDetails = 'open'
    }

    return raceDetails+" "+race.name;
}

function isMember(array, value){
    return array.includes(value);
}

function filterAcceptable(raceAgeGroup, raceGender, entrantList, currentEntrantList){
    console.log("raceGender: ",raceGender);
    console.log("raceAgeGroup: ",raceAgeGroup);
    const newList = [];
    console.log("currentList", currentEntrantList);

    entrantList.forEach(entrant => {
        const entrantAgeGroup = getAgeGroup(entrant.dob);
        if (entrantAgeGroup === raceAgeGroup || raceAgeGroup === 'mixed' || raceAgeGroup === 'open'){
            if (entrant.gender === raceGender || raceGender === 'mixed' || raceGender === 'open'){
                if (!currentEntrantList.includes(entrant.entrant_number)){
                    newList.push(entrant);
                    console.log("entrantNumber", entrant.entrant_number);
                }
            }
        }
    });
    console.log(newList);
    return newList;
}

function filterAcceptableRaces(entrantDOB, entrantGender, raceList){
    const newList = [];
    const entrantAgeGroup = getAgeGroup(entrantDOB);

    raceList.forEach(race =>{
        if (race.age_group === entrantAgeGroup || race.age_group === 'mixed' || race.age_group === 'open'){
            if (race.gender === entrantGender || race.gender === 'mixed' || race.gender === 'open'){
                newList.push(race);
            }
        }
    });

    return newList
}

function getAgeGroup(date) {
        const competitionYearEnd = new Date(new Date().getFullYear(), 7, 31);
        const birthDate = new Date(date);
        const ageAtCompetitionYearEnd = competitionYearEnd.getFullYear() - birthDate.getFullYear() - (competitionYearEnd < new Date(competitionYearEnd.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
        
        if (ageAtCompetitionYearEnd >= 9 && ageAtCompetitionYearEnd <= 10) {
            return "u11";
        } else if (ageAtCompetitionYearEnd >= 11 && ageAtCompetitionYearEnd <= 12) {
            return "u13";
        } else if (ageAtCompetitionYearEnd >= 13 && ageAtCompetitionYearEnd <= 14) {
            return "u15";
        } else if (ageAtCompetitionYearEnd >= 15 && ageAtCompetitionYearEnd <= 16) {
            return "u17";
        } else if (ageAtCompetitionYearEnd >= 17 && ageAtCompetitionYearEnd < 20) {
            return "u20";
        } else if (ageAtCompetitionYearEnd >= 20) {
            return "seniors";
        } else if (ageAtCompetitionYearEnd >= 35) {
            return "masters";
        } else {
            return "Age not eligible for competition";
        }
}

async function isEntered(entrantData) {
    const entrants = await fetchEntrants();

    // Normalize entrant data for comparison
    const normalizedForename = entrantData.forename.trim().toLowerCase();
    const normalizedSurname = entrantData.surname.trim().toLowerCase();

    // Check if the entrant already exists
    const entrantExists = entrants.some(entrant => {
        const existingForename = entrant.forename.trim().toLowerCase();
        const existingSurname = entrant.surname.trim().toLowerCase();
        return existingForename === normalizedForename && existingSurname === normalizedSurname;
    });

    return entrantExists;
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return (parseInt(hours, 10) * 3600 * 1000) + 
           (parseInt(minutes, 10) * 60 * 1000);
}

function orderTime(races) {
    return races.sort((a, b) => {
        const timeA = parseTime(a.time);
        const timeB = parseTime(b.time);
        return timeA - timeB;
    });
}

export { formatDate , formatRaceGender, isMember, formatTime, getAgeGroup, filterAcceptable, filterAcceptableRaces, isEntered, formatRaceName, orderTime};
