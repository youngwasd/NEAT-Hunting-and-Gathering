let socket = null;
if (window.io) {
	socket = io.connect('http://73.225.31.4:8888');
	console.log("Database connected!");
}

let histograms = {
    histoAvgFitness: []
}

const downloadData = (e) => {
    //Get relevant variables
    let ctx = document.getElementById("chart").getContext("2d");
    db = document.getElementById("db").value;
    db_collection = document.getElementById("db_collection").value;

    console.log(`db: ${db} collection: ${db_collection}`);
    socket.emit("find", 
    {
        db: db, 
        collection: db_collection
    });

    socket.on("find", (data) => {
        console.log("processing query...");
        if(data.length > 0) parseData(data);
        else console.log("Empty Data...");
    });
}

const parseData = (data) => {
    let avgRawFitness = [];
    download("avgRawFitness" + db + db.collection + ".csv", serializeAvgFitness(data));
}

const download = (filename, text) => {
    let pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

const serializeAvgFitness = (data) => {
    var str = "";
    for(let i = 0; i < data.length; i++) {
        if(!data[i].avgFitness.includes(null)) str += data[i].avgFitness + "\n";
    }
    return str;
}

document.getElementById("download_data").addEventListener("click", downloadData, false);