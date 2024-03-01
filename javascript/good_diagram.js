import { validateType, get_transformation_matrix, Layer } from './utils.js';

const svgNS = "http://www.w3.org/2000/svg";

const RELU = "\ud835\udce1";
const SIGMA = "\u03C3";

// The diagram is sized based on a grid of tiles, one for each node.
// The following numbers should be in the unit interval.
const WIDTH_SOMA = 0.85;
const HEIGHT_SOMA = 0.65;

const WIDTH_AXON = 0.8 * WIDTH_SOMA;
// Aaron: OK, so only issue with fixing it at this is that the BIAS arrows can cross some nodes... so look into that
const WIDTH_SYNAPSE = 3.5;

// Styling
const STROKE_WIDTH = 1 / 60;
const STROKE_COLOR = "black";

const FONT_SIZE_DEFAULT = 1 / 3;
const FONT_SIZE_ACTIVATION = HEIGHT_SOMA / 3;
const FONT_SIZE_RESPONSE = FONT_SIZE_DEFAULT;
const FONT_SIZE_NODE_LABEL = HEIGHT_SOMA / 4;
const FONT_SIZE_BIAS = FONT_SIZE_DEFAULT;

const FONT_FAMILY_DEFAULT = "Times";
const FONT_FAMILY_ACTIVATION = "Script MT Bold";
const FONT_FAMILY_BIAS = "Cambria Math";


function parse_xml_to_svg_nodes(xml_str, font_size) {
    /*
    This is quite annoying. SVG doesn't handle superscripts and subscripts,
    so we need a bunch of custom code to handle them.
    This code assumes an XML string with optional tags for <sub> or <sup>,
    and it converts the entire string to an SVG text element.
    */

    // construct the parent text container with an empty node
    let newText = document.createElementNS(svgNS,"text");
    newText.appendChild(document.createTextNode(""))

    let alignment_baseline = "middle";
    while (xml_str.length > 0) {
        let chunks = xml_str.split("<");

        let tspan = document.createElementNS(svgNS, "tspan");
        tspan.textContent = chunks[0];
        tspan.setAttributeNS(null,"alignment-baseline", alignment_baseline);
        tspan.setAttributeNS(null,"font-size", (alignment_baseline == "middle") ? font_size : font_size*.7);
        newText.appendChild(tspan);

        alignment_baseline = "middle";
        if (chunks.length == 1) {
            // only standard text remains
            xml_str = "";
            continue;
        }

        xml_str = chunks.slice(1,).join("<");
        let tag = xml_str.slice(0,3);
        xml_str = xml_str.slice(4,);

        switch (tag) {
            case "sub":
                alignment_baseline = "hanging";
                break;
            case "sup":
                alignment_baseline = "baseline";
                break;
            case "/su":
                xml_str = xml_str.slice(1,);
                break;
            default:
                throw new Error('Did not understand XML tag!');
        }
    }
    return newText;
}

function define_svg_arrow(size) {
    let arrow = document.createElementNS(svgNS, 'marker');
    arrow.setAttributeNS(null, "id", "arrow");
    arrow.setAttributeNS(null, "markerHeight", size);
    arrow.setAttributeNS(null, "markerWidth", size);
    arrow.setAttributeNS(null, "refX", size);
    arrow.setAttributeNS(null, "refY", size/2);
    arrow.setAttributeNS(null, "orient", "auto-start-reverse");
    let path = document.createElementNS(svgNS, "path");
    path.setAttributeNS(null, "d", `M 0 0 L ${size} ${size/2} L 0 ${size} z`);
    arrow.appendChild(path);
    return arrow;
}

function define_svg_node_path() {
    let path = document.createElementNS(svgNS, 'path');
    const right = WIDTH_SOMA / 2;
    const top = -HEIGHT_SOMA / 2;
    const bottom = -top;
    const radius_x = WIDTH_SOMA / 2;
    const radius_y = HEIGHT_SOMA / 2;

    const start = `M ${right} ${top}`;
    const top_ray = `L 0 ${top}`;
    const left_arc = `A ${radius_x} ${radius_y} 0 1 0 0 ${bottom}`;
    const bottom_ray = `L ${right} ${bottom}`;
    let d = [start, top_ray, left_arc, bottom_ray, "Z"].join(" ");
    path.setAttribute('d', d);
    path.setAttribute('stroke', STROKE_COLOR);
    path.setAttribute('stroke-width', STROKE_WIDTH);
    path.setAttribute('fill', 'none');
    path.setAttribute('id', 'nodepath');
    return path;
}

function make_svg_response_line(xCenter, yCenter) {
    let trace = document.createElementNS(svgNS, 'line');
    trace.setAttributeNS(null, "x1", xCenter + WIDTH_SOMA / 2);
    trace.setAttributeNS(null, "x2", xCenter + WIDTH_SOMA / 2 + WIDTH_AXON);
    trace.setAttributeNS(null, "y1", yCenter);
    trace.setAttributeNS(null, "y2", yCenter);
    trace.setAttribute('stroke', STROKE_COLOR);
    trace.setAttribute('stroke-width', STROKE_WIDTH);
    return trace
}

function make_svg_response_text(xCenter, yCenter, str_response) {
    let annotation = parse_xml_to_svg_nodes(str_response, FONT_SIZE_RESPONSE);
    annotation.setAttributeNS(null,"x", xCenter + WIDTH_SOMA / 2 + FONT_SIZE_RESPONSE / 2);
    annotation.setAttributeNS(null,"y", yCenter - .7*FONT_SIZE_RESPONSE);
    annotation.setAttributeNS(null,"font-size", FONT_SIZE_RESPONSE);
    return annotation;
}

function make_svg_node_text(xml_str, xCenter, yCenter) {
    annotation = parse_xml_to_svg_nodes(xml_str, FONT_SIZE_NODE_LABEL);
    annotation.setAttributeNS(null,"x", xCenter + WIDTH_SOMA / 2 + .1 * FONT_SIZE_NODE_LABEL);
    annotation.setAttributeNS(null,"y", yCenter - HEIGHT_SOMA / 2);
    annotation.setAttributeNS(null,"dominant-baseline", "middle");
    return annotation;
}

function make_svg_node_path(xCenter, yCenter) {
    // define parameters of shape
    const right = xCenter + WIDTH_SOMA / 2;
    const top = yCenter - HEIGHT_SOMA / 2;
    const bottom = yCenter + HEIGHT_SOMA / 2;
    const radius_x = WIDTH_SOMA / 2;
    const radius_y = HEIGHT_SOMA / 2;

    // define path
    const start = `M ${right} ${top}`;
    const top_ray = `L ${xCenter} ${top}`;
    const left_arc = `A ${radius_x} ${radius_y} 0 1 0 ${xCenter} ${bottom}`;
    const bottom_ray = `L ${right} ${bottom}`;
    d = [start, top_ray, left_arc, bottom_ray, "Z"].join(" ");

    // set properties
    let path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', STROKE_COLOR);
    path.setAttribute('stroke-width', STROKE_WIDTH);
    path.setAttribute('fill', 'none');

    return path;
}

function make_svg_node_activation_text(str, xCenter, yCenter) {
    let newText = document.createElementNS(svgNS,"text");
    newText.setAttributeNS(null,"font-size", FONT_SIZE_ACTIVATION);
    newText.setAttributeNS(null,"font-family", FONT_FAMILY_ACTIVATION);
    newText.setAttributeNS(null,"font-style", "italic");
    newText.setAttributeNS(null,"x", xCenter + WIDTH_SOMA / 2 - 1.2 * FONT_SIZE_ACTIVATION);
    newText.setAttributeNS(null,"y", yCenter + HEIGHT_SOMA / 2 - .2 * FONT_SIZE_ACTIVATION);

    let textNode = document.createTextNode(str);
    newText.appendChild(textNode);
    return newText;
}

function make_svg_connection_line(x_start, xCenter, y_start, y_center) {
    let trace = document.createElementNS(svgNS, 'line');
    let angle_to_layer = Math.atan((y_start - y_center) / (x_start - xCenter));
    let x2 = xCenter - WIDTH_SOMA / 2 * Math.cos(angle_to_layer);
    let y2 = y_center - HEIGHT_SOMA / 2 * Math.sin(angle_to_layer);
    trace.setAttributeNS(null, "x1", x_start);
    trace.setAttributeNS(null, "x2", x2);
    trace.setAttributeNS(null, "y1", y_start);
    trace.setAttributeNS(null, "y2", y2);
    trace.setAttribute('stroke', STROKE_COLOR);
    trace.setAttribute('stroke-width', STROKE_WIDTH);
    trace.setAttribute("marker-end", "url(#arrow)");
    return trace
}

function make_svg_diagram(network){
    // note: there's some good validation here to prevent JSON formatting errors...
    const layers = network.layers.map((a) => {return new Layer(a.countNodes, a.activation, a.show_bias)});
    validateType(network.countInputs, "countInputs", "number");

    let arrayLayerSpec = network.layers;
    let countInputs = network.countInputs;

    let svg = document.createElementNS(svgNS, "svg");
    let defs = document.createElementNS(svgNS, "defs");
    defs.appendChild(define_svg_arrow(10));
    defs.appendChild(define_svg_node_path());
    svg.appendChild(defs);

    let countLayers = arrayLayerSpec.length;
    const maxCountNodes = arrayLayerSpec.reduce((a, b) => Math.max(a, b.countNodes), 0);
    let spacingLayer = Array(countLayers).fill(WIDTH_SYNAPSE);
    const sum = spacingLayer.reduce((partialSum, a) => partialSum + a, 0);
    let diagram_width = sum + WIDTH_AXON + 1.5 * WIDTH_SOMA;
    let diagram_height = maxCountNodes + 1;

    svg.setAttribute("aria-hidden","true");
    svg.setAttribute('viewBox', `0 -${diagram_height/2} ${diagram_width} ${diagram_height}`);

    // build inputs
    let xCenter = 0;
    for (let i = 0; i < countInputs; i++){
        let yCenter = i - (countInputs - 1) / 2;
        let indexNode = countInputs - i;
        let str_response = `x<sub>${indexNode}</sub>`;
        let trace = make_svg_response_line(xCenter, yCenter);
        let annotation = make_svg_response_text(xCenter, yCenter, str_response);
        annotation.setAttributeNS(null,"font-family", FONT_FAMILY_DEFAULT);
        annotation.setAttributeNS(null,"font-style", "italic");
        svg.appendChild(annotation);
        svg.appendChild(trace);
    }
    let countNodesPrevious = countInputs;
    let xPrevious = xCenter + WIDTH_SOMA / 2 + WIDTH_AXON;

    for (let indexLayer = 0; indexLayer < countLayers; indexLayer++) {
        const layer = arrayLayerSpec[indexLayer];
        let countNodes = layer.countNodes;
        let str_activation = layer.activation;

        xCenter += spacingLayer[indexLayer];

        for (let indexNode = 0; indexNode < countNodes; indexNode++) {
            let yCenter = indexNode - (countNodes - 1) / 2;
            let response_text = `a<sub>${indexNode+1}</sub><sup>[${indexLayer+1}]</sup>`;

            let nodePath = document.createElementNS(svgNS, "use");
            nodePath.setAttributeNS(null, "href", "#nodepath");
            nodePath.setAttributeNS(null, "transform", `translate(${xCenter} ${yCenter})`);

            svg.appendChild(nodePath);
            svg.appendChild(make_svg_node_activation_text(layer.activation, xCenter, yCenter));
            svg.appendChild(make_svg_response_text(xCenter, yCenter, response_text));
            svg.appendChild(make_svg_response_line(xCenter, yCenter));

            for (let indexNodePrevious = 0; indexNodePrevious < countNodesPrevious; indexNodePrevious++){
                let connection_svg_path = make_svg_connection_line(
                    xCenter - WIDTH_SYNAPSE + WIDTH_SOMA / 2 + WIDTH_AXON,
                    xCenter,
                    indexNodePrevious - (countNodesPrevious - 1) / 2,
                    yCenter,
                );
                svg.appendChild(connection_svg_path);
            }

            if (layer.show_bias) {
                let previous = (countNodesPrevious + 1) / 2 - WIDTH_SOMA / 2;
                let current = (countNodes + 1) / 2 - 1;
                let yCenter = indexNode - (countNodes - 1) / 2;
                let xPrevious = 0.3 * xCenter + 0.7 * (xCenter - WIDTH_SYNAPSE + WIDTH_SOMA / 2 + WIDTH_AXON);
                let yPrevious = Math.max(previous, (previous + current) / 2);
                let connection_svg_path = make_svg_connection_line(xPrevious, xCenter, yPrevious, yCenter);
                svg.appendChild(connection_svg_path);

                // place "1" on a line for arrows entering layer
                let xStart = xPrevious - WIDTH_SOMA / 2 - WIDTH_AXON;
                let trace = make_svg_response_line(xStart, yPrevious);
                let annotation = make_svg_response_text(xStart, yPrevious, "1");
                trace.setAttributeNS(null, "x1", xStart + (WIDTH_SOMA + WIDTH_AXON) / 2);
                annotation.setAttributeNS(null, "x", xStart + (WIDTH_SOMA + WIDTH_AXON) / 2 + FONT_SIZE_RESPONSE / 4);
                annotation.setAttributeNS(null,"font-size", FONT_SIZE_BIAS);
                annotation.setAttributeNS(null,"font-family", FONT_FAMILY_BIAS);
                svg.appendChild(trace);;
                svg.appendChild(annotation);
            }
        }
        countNodesPrevious = countNodes;
    }
    return svg;
}

export function update_svg_diagram() {
    let networkContainer = document.getElementById("networkContainer");
    let layers = Array.from(networkContainer.children).map(
        child => new Layer(Number(child.children[2].value), child.children[4].value, child.children[6].checked)
    );
    const countInputs = document.getElementById("countInputs");
    let network = {"countInputs": Number(countInputs.value), "layers": layers}
    let svg = make_svg_diagram(network);
    let svgContainer = document.getElementById("svgContainer");
    svgContainer.replaceChildren(svg);
}

export function update_dynamic_layer_form() {
    let networkContainer = document.getElementById("networkContainer");
    let countLayers = document.getElementById("countLayers");
    while (networkContainer.children.length > countLayers.value) {
        networkContainer.removeChild(networkContainer.lastChild);
    }
    for (let indexLayer = networkContainer.children.length; indexLayer < countLayers.value; indexLayer++) {
        let div = document.createElement("div");
        let label = document.createElement("label");
        label.innerHTML = `Layer #${indexLayer + 1}\t`;
        div.appendChild(label);

        label = document.createElement("label");
        label.innerHTML = "Number of nodes";
        div.appendChild(label);

        let input = document.createElement("input");
        input.type = "number";
        input.value = 1;
        input.min = 1;
        input.id = `countNodes${indexLayer}`;
        div.appendChild(input);

        label = document.createElement("label");
        label.innerHTML = "Activation";
        div.appendChild(label);

        let select = document.createElement("select");
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

        label = document.createElement("label");
        label.innerHTML = "Show bias";
        div.appendChild(label);

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        div.appendChild(checkbox);

        networkContainer.appendChild(div);
    }
}
