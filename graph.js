let socket = null;
let downloader = 0;
if (window.io) {
	socket = io.connect('http://73.225.31.4:8888');
	console.log("Database connected!");
}

socket.on("find", (data) => {
    console.log("processing query...");
    if(data.length > 0) parseData(data);
    else console.log("Empty Data...");
    console.log("finished query.");
});

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
}

const parseData = (data) => {
    download("AvgRawFitness-" + db + "-" + db_collection + ".csv", serializeData(data, "avgFitness", true));
    download("Consumption-" + db + "-" + db_collection + ".csv", serializeData(data, "consumption", true));
}

const download = (filename, text) => {
    if(!txt) return;
    console.log("should work now...");
    let pom = document.createElement('a');
    downloader++;
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
    pom.remove();
    console.log("Downloading: " + filename);
}

const serializeData = (data, key, avgColumn = false) => {
    if(!data[0][key]) return undefined;
    let str = "";
    let j = 0;
    let foundRow = true;
    do{
        if(j == 0){
            for(let i = 0; i < data.length; i++){
                str += "Trial " + (i+1);
                if(i+1 < data.length) str += ",";
            }
            if(avgColumn) str+= ",Average";
            str += "\n";
            j++;
        }else{
            foundRow = false;
            ds = "";
            let total = 0;
            for(let i = 0; i < data.length; i++) {
                if(j < data[i][key].length){
                    let v = data[i][key][j];
                    ds += v;
                    total += v;
                    foundRow = true;
                }else{
                    console.log(data[i][key].length);
                }
                if(i < data.length - 1){
                    ds += ",";
                }
            }
            if(foundRow) {
                str += ds;
                if(avgColumn) str += "," + total/data.length;
                str += "\n";
                console.log("ds: " + ds);
            }
            j++;
        }
    }while(foundRow);
    return str;
}

document.getElementById("download_data").addEventListener("click", downloadData);