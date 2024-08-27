// state.js
let entrants = [];

export const getEntrants = () => entrants;

export const setEntrants = (newEntrants) => {
    entrants = newEntrants;
}

export const removeEntrant = (entrantNumber) => {
    const entrantId = parseInt(entrantNumber, 10);
    console.log(entrantId);
    console.log(entrants);
    // Filter the list, ensuring each item is also converted to integer for comparison
    entrants = entrants.filter(number => {
        const numberId = parseInt(number, 10);
        return numberId !== entrantId;
    });
    console.log(entrants);
}
