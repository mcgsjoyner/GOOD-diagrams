const downloadButton = document.querySelector("#downloadButton");
downloadButton.addEventListener("click", (event) => {downloadSVG();});

const submitNetwork = document.querySelector("#submitNetwork");
submitNetwork.addEventListener("click", (event) => {
    let networkContainer = document.getElementById("networkContainer");
    var layers = Array.from(networkContainer.children).map(
        child => new Layer(Number(child.children[2].value), child.children[4].value, child.children[6].checked)
    );
    const countInputs = document.querySelector("#countInputs");
    var network = {"countInputs": Number(countInputs.value), "layers": layers}
    let svg = make_svg_diagram(network);
    let svgContainer = document.getElementById("svgContainer");
    svgContainer.replaceChildren(svg);
});

const countLayers = document.querySelector("#countLayers");
countLayers.addEventListener("input", (event) => {
    let networkContainer = document.getElementById("networkContainer");
    while (networkContainer.children.length > countLayers.value) {
        networkContainer.removeChild(networkContainer.lastChild);
    }
    for (var indexLayer = networkContainer.children.length; indexLayer < countLayers.value; indexLayer++) {
        var div = document.createElement("div");
        var label = document.createElement("label");
        label.innerHTML = `Layer #${indexLayer + 1}\t`;
        div.appendChild(label);

        var label = document.createElement("label");
        label.innerHTML = "Number of nodes";
        div.appendChild(label);

        var input = document.createElement("input");
        input.type = "number";
        input.value = 1;
        input.min = 1;
        input.id = `countNodes${indexLayer}`;
        div.appendChild(input);

        var label = document.createElement("label");
        label.innerHTML = "Activation";
        div.appendChild(label);

        var select = document.createElement("select");
        const reluOption = document.createElement("option");
        reluOption.text = RELU;
        reluOption.value = RELU;
        const sigmaOption = document.createElement("option");
        sigmaOption.text = SIGMA;
        sigmaOption.value = SIGMA;
        select.id = `activation{indexLayer}`;
        select.appendChild(reluOption);
        select.appendChild(sigmaOption);
        div.appendChild(select);

        var label = document.createElement("label");
        label.innerHTML = "Show bias";
        div.appendChild(label);

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        div.appendChild(checkbox);

        networkContainer.appendChild(div);
    }
});
