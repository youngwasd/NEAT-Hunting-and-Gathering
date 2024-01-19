class NeuralNet {

    constructor(genome) {
        this.genome = genome;
        this.nodes = this.genome.nodeGenes;
        this.edges = this.genome.connectionGenes;
        this.sortedNodes = NeuralNetUtil.topoSort(this.nodes, this.edges);
    };

    processInput(input, output = []) {
        //console.log(input);
        let inputIndex = 0;
        

        this.sortedNodes.forEach(nodeId => {
            let currNode = this.nodes.get(nodeId);
            if (currNode.type === Genome.NODE_TYPES.input) { // assign values to input neurons
                currNode.value = input[inputIndex];
                inputIndex++;
            } else { // hidden or output neurons
                let value = 0;
                currNode.inIds.forEach(inId => {
                    this.edges.get([inId, nodeId]).forEach(connection => {
                        if (connection.isEnabled) {
                            value += this.nodes.get(inId).value * connection.weight;
                        }
                    });
                });
                if (!params.EVOLVE_K_AND_M){
                    currNode.value = this.sigmoid(value);
                }
                else{
                    currNode.value = this.sigmoid(value, currNode.kValue, currNode.mValue);
                }
                if (currNode.type === Genome.NODE_TYPES.output) {
                    output.push(currNode.value);
                }
            }
        }); 

        if (input.length != inputIndex) {
            console.error("input length: " + input.length + "\nDesired Length: " + inputIndex + "\nInputs recieved: " + input);
            output.fill(0);
        }

        

        return output;
    };

    //Sigmoid function
    sigmoid(x, k = params.GENOME_DEFAULT_K_VAL, m = 0) {
        // if ((PopulationManager.IS_LAST_TICK)){
        //     console.log("k:", k, "m:", m, PopulationManager.GEN_NUM);
        // }
        //Name the parameters to easily adjust them
        let l = 2;
        let n = 1;
        return l / (1 + Math.E ** (k * -(x - m))) - n;
    };
};