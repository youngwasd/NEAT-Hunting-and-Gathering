let socket = null;
let downloader = 0;
if (window.io) {
	socket = io.connect('http://73.225.31.4:8888');
	console.log("Database connected!");
}

let histograms = {
    histoAvgFitness: []
}

socket.on("find", (data) => {
    console.log("processing query...");
    if(data.length > 0) parseData(data);
    else console.log("Empty Data...");
    console.log("finished query.");
});

const downloadData = (e) => {
    //Get relevant variables
    db = document.getElementById("db").value;
    db_collection = document.getElementById("db_collection").value;

    console.log(`db: ${db}\ncollection: ${db_collection}`);
    socket.emit("find", 
    {
        db: db, 
        collection: db_collection
    });
    console.log("Download successfully");
}

const parseData = (data) => {
    let serializedData = serializeData(data);
    download("AvgRawFitness-" + db + "-" + db_collection + ".csv", serializedData.avgFit);
    download("Consumption-" + db + "-" + db_collection + ".csv", serializedData.cons);
}

const download = (filename, text) => {
    console.log("should work now...");
    let pom = document.createElement('a');
    downloader++;
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
    pom.remove();
    console.log("Downloading: " + filename);
}

/*const serializeAvgFitness = (data) => {
    var str = "";
    for(let i = 0; i < data.length; i++) {
        if(!data[i].avgFitness.includes(null)) str += data[i].avgFitness + "\n";
    }
    return str;
}*/

const serializeData = (data) => {
    var avgFitStr = "";
    var consStr = "";
    let foundRow = false;
    let j = 0;
    do{
        foundRow = false;
        af = "";
        c = "";
        for(let i = 0; i < data.length; i++) {
            if(j < data[i].avgFitness.length){
                af += data[i].avgFitness[j];
                c += data[i].consumption[j];
                foundRow = true;
                console.log("success");
            }else{
                console.log(data[i].avgFitness.length);
            }
            if(i < data.length - 1){
                af += ",";
                c += ",";
            }
        }
        if(foundRow) {
            avgFitStr += af;
            consStr += c;
            avgFitStr += "\n";
            consStr += "\n";
        }
        j++;
    }while(foundRow);

    return {avgFit: avgFitStr, cons: consStr};
    
}

const serializeFoodConsump = (data) => {

}

