// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    // create an object store (table) called 'budget-update', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('budget-update', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run updateBudget() function to send all local db data to api
    if (navigator.onLine) {
        // not created yet, commented out
        updateBudget();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit an updated budget and there's no internet connection
function saveRecord(record) {
    // open a new transaction witht he database with read and write permissions
    const transaction = db.transaction(['budget_update'], 'readwrite');

    // access the object store for 'budget_update'
    const budgetObjectStore = transaction.objectStore('budget_update');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function updateBudget() {
    // open a transaction on your db
    const transaction = db.transaction(['budget_update'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('budget_udpate');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['budget_update'], 'readwrite');

                    // access the budget_update object store
                    const budgetObjectStore = transaction.objectStore('budget_update');

                    // clear all items in your store
                    budgetObjectStore.clear();

                    alert('All budget updates have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', updateBudget);