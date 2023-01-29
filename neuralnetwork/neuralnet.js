class NeuralNet {

    constructor(genome) {
        this.genome = genome;
        this.nodes = this.genome.nodeGenes;
        this.edges = this.genome.connectionGenes;
        this.sortedNodes = NeuralNetUtil.topoSort(this.nodes, this.edges);
    };

    processInput(input) {
        //console.log(input);

        let output = [];
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
                currNode.value = this.sigmoid(value);
                if (currNode.type === Genome.NODE_TYPES.output) {
                    output.push(currNode.value);
                }
            }
        });

        return output;
    };

    sigmoid(x) {
        let k = 5/3;
        return 2 / (1 + Math.E ** (-x * k)) - 1;
    };
};