const dbName = "toDoDb";
let dbVersion = 1;

// set indexedDB
if (!window.indexedDB) {
    window.alert("Votre navigateur ne supporte pas une version stable d'IndexeDB. Quelques fonctionnalités ne seront pas disponibles hors connection.")
} else {
    fetch ("/test")
        .then (response => response.json())
        .then (data => {
            console.log(data);
            // if fetch succeded => online => update DB     /!\ does not work... it clear indexedDB even when offline 
            // clear indexedDB
            let clearDb = window.indexedDB.deleteDatabase("toDoDb");
            
            ///// vvv Need to be cleaned up vvv /////
            clearDb.onsuccess = (evt) => {
                console.log("db deleted");

                setTimeout(() => {
                    // copy online db
                    let request = indexedDB.open(dbName, dbVersion);
                            
                    request.onerror = (evt) => { // manage error
                        console.log("error: ", evt);
                    }

                    request.onupgradeneeded = (evt) => {
                        const db = evt.target.result;

                        // create object to store the data (use unique value)
                        let objectStore = db.createObjectStore("toDo", {keyPath: "_id"});
                        objectStore.createIndex("content", "content", {unique: false});

                        objectStore.transaction.oncomplete = (evt) => {
                            let customerObjectStore = db.transaction("toDo", "readwrite").objectStore("toDo");

                            for (let i in data) {
                                customerObjectStore.add(data[i]);
                            }
                        }

                        socket.on("db changes", (data) => {
                            const objectStore = db.transaction("toDo", "readwrite").objectStore("toDo");
                            let newrequest = objectStore.get(data._id)

                            newrequest.onerror = (err) => {
                                console.log(err);
                            }

                            newrequest.onsuccess = (evt) => {
                                console.log("request result: ", newrequest.result);
                                let toChange = newrequest.result;
                                toChange.content = data.content

                                let requestUpdate = objectStore.put(toChange);

                                requestUpdate.onerror = (err) => {
                                    console.log(err);
                                }

                                requestUpdate.onsuccess = (evt) => {
                                    console.log("db updated");
                                }
                            }

                            console.log(data);
                        });
                    }         
                }, 1);
            }   
        });
}
