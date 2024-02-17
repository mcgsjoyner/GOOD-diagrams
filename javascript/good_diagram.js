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

function validateType(arg, name, typeExpected) {
    if (typeof arg != typeExpected){throw Error(`Expecting ${typeExpected} for ${name}, got ${typeof arg}!`)};
}

class Layer {
    constructor(countNodes, activation, show_bias) {
        validateType(countNodes, "countNodes", "number");
        if (!Number.isInteger(countNodes)){throw Error(`Input {countNodes} is not an integer!`)};
        this.countNodes = countNodes;

        validateType(activation, "activation", "string");
        this.activation = activation;

        validateType(show_bias, "show_bias", "boolean");
        this.show_bias = show_bias;
    }
}


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

    baseline_shift = 0;
    while (xml_str.length > 0) {
        let chunks = xml_str.split("<");

        let tspan = document.createElementNS(svgNS, "tspan");
        tspan.textContent = chunks[0];
        tspan.setAttributeNS(null,"baseline-shift", baseline_shift);
        tspan.setAttributeNS(null,"font-size", (baseline_shift == 0) ? font_size : font_size*.7);
        newText.appendChild(tspan);

        baseline_shift = 0;
        if (chunks.length == 1) {
            // only standard text remains
            xml_str = "";
            continue;
        }

        xml_str = chunks.slice(1,).join("<");
        tag = xml_str.slice(0,3);
        xml_str = xml_str.slice(4,);

        switch (tag) {
            case "sub":
                baseline_shift = "sub";
                break;
            case "sup":
                baseline_shift = "super";
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

function get_transformation_matrix(diagram_width, diagram_height) {
    let height = self.innerHeight;
    let margin = .025;
    PIX_PER_NODE = (1 - 2 * margin) * height / diagram_height;
    translateX = PIX_PER_NODE * diagram_width / 2 / (1 - margin);
    translateY = PIX_PER_NODE * diagram_height / 2 / (1 - margin);
    transform = `matrix(${PIX_PER_NODE} 0 0 ${PIX_PER_NODE} ${translateX} ${translateY})`;
    return transform;
}

function define_svg_arrow(size) {
    let arrow = document.createElementNS(svgNS, 'marker');
    arrow.setAttributeNS(null, "id", "arrow");
    arrow.setAttributeNS(null, "markerHeight", size);
    arrow.setAttributeNS(null, "markerWidth", size);
    arrow.setAttributeNS(null, "refX", size);
    arrow.setAttributeNS(null, "refY", size/2);
    arrow.setAttributeNS(null, "orient", "auto-start-reverse");
    path = document.createElementNS(svgNS, "path");
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
    d = [start, top_ray, left_arc, bottom_ray, "Z"].join(" ");
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
    annotation.setAttributeNS(null,"y", yCenter - FONT_SIZE_RESPONSE/2);
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
    angle_to_layer = Math.atan((y_start - y_center) / (x_start - xCenter));
    x2 = xCenter - WIDTH_SOMA / 2 * Math.cos(angle_to_layer);
    y2 = y_center - HEIGHT_SOMA / 2 * Math.sin(angle_to_layer);
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
    defs.appendChild(define_svg_arrow(size=10));
    defs.appendChild(define_svg_node_path());
    svg.appendChild(defs);

    countLayers = arrayLayerSpec.length;
    const maxCountNodes = arrayLayerSpec.reduce((a, b) => Math.max(a, b.countNodes), 0);
    spacingLayer = Array(countLayers).fill(WIDTH_SYNAPSE);
    const sum = spacingLayer.reduce((partialSum, a) => partialSum + a, 0);
    diagram_width = sum + WIDTH_AXON + 1.5 * WIDTH_SOMA;
    diagram_height = maxCountNodes + 1;

    svg.setAttribute('transform', get_transformation_matrix(diagram_width, diagram_height));
    svg.setAttribute("aria-hidden","true");
    svg.setAttribute('width', `${diagram_width}px`);
    svg.setAttribute('height', `${diagram_height}px`);
    svg.setAttribute('viewBox', `0 -${diagram_height/2} ${diagram_width} ${diagram_height}`);

    // build inputs
    let xCenter = 0;
    for (i = 0; i < countInputs; i++){
        let yCenter = i - (countInputs - 1) / 2;
        indexNode = countInputs - i;
        str_response = `x<sub>${indexNode}</sub>`;
        trace = make_svg_response_line(xCenter, yCenter);
        annotation = make_svg_response_text(xCenter, yCenter, str_response);
        annotation.setAttributeNS(null,"font-family", FONT_FAMILY_DEFAULT);
        annotation.setAttributeNS(null,"font-style", "italic");
        svg.appendChild(annotation);
        svg.appendChild(trace);
    }
    countNodesPrevious = countInputs;
    xPrevious = xCenter + WIDTH_SOMA / 2 + WIDTH_AXON;

    for (indexLayer = 0; indexLayer < countLayers; indexLayer++) {
        const layer = arrayLayerSpec[indexLayer];
        let countNodes = layer.countNodes;
        let str_activation = layer.activation;

        xCenter += spacingLayer[indexLayer];

        for (indexNode = 0; indexNode < countNodes; indexNode++) {
            let yCenter = indexNode - (countNodes - 1) / 2;
            let response_text = `a<sub>${indexNode+1}</sub><sup>[${indexLayer+1}]</sup>`;

            let nodePath = document.createElementNS(svgNS, "use");
            nodePath.setAttributeNS(null, "href", "#nodepath");
            nodePath.setAttributeNS(null, "transform", `translate(${xCenter} ${yCenter})`);

            svg.appendChild(nodePath);
            svg.appendChild(make_svg_node_activation_text(layer.activation, xCenter, yCenter));
            svg.appendChild(make_svg_response_text(xCenter, yCenter, response_text));
            svg.appendChild(make_svg_response_line(xCenter, yCenter));

            for (indexNodePrevious = 0; indexNodePrevious < countNodesPrevious; indexNodePrevious++){
                connection_svg_path = make_svg_connection_line(
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
                connection_svg_path = make_svg_connection_line(xPrevious, xCenter, yPrevious, yCenter);
                svg.appendChild(connection_svg_path);

                // place "1" on a line for arrows entering layer
                let xStart = xPrevious - WIDTH_SOMA / 2 - WIDTH_AXON;
                trace = make_svg_response_line(xStart, yPrevious);
                annotation = make_svg_response_text(xStart, yPrevious, str_response="1");
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
