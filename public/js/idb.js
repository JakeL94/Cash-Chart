let db;
const request = indexedDB.open('transaction', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.online) {
        completeTransaction();
    }
};

request.err = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const moneyObjectStore = transaction.objectStore('new_transaction');

    moneyObjectStore.add(record);
}

function completeTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const moneyObjectStore = transaction.objectStore('new_transaction');

    const getMoney = moneyObjectStore.getAll();

    getMoney.onsuccess = function() {
        if (getMoney.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getMoney.result),
                headers: {                
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'                
                }
            })
            .then(response => response.json())
            .then(ServerResponse => {
                if (ServerResponse.message) {
                    throw new Error(ServerResponse);
                }

                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const moneyObjectStore = transaction.objectStore('new_transaction');
                moneyObjectStore.clear();
            })
            .catch(err => {
                console.log(err);
            })
        }

    };
}

window.addEventListener('online', completeTransaction);