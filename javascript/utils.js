export function validateType(arg, name, typeExpected) {
    if (typeof arg != typeExpected){throw Error(`Expecting ${typeExpected} for ${name}, got ${typeof arg}!`)};
}

export class Layer {
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

export function get_transformation_matrix(diagramWidth, diagramHeight) {
    /*
    Build an SVG transform matrix that fits a diagram with the given dimensions to the height of the screen
    */
    let height = self.innerHeight;
    let margin = .025;
    pixPerNode = (1 - 2 * margin) * height / diagramHeight;
    let translateRatio = pixPerNode / 2 / (1 - margin);
    translateX = translateRatio * diagramWidth;
    translateY = translateRatio * diagramHeight;
    transform = `matrix(${pixPerNode} 0 0 ${pixPerNode} ${translateX} ${translateY})`;
    return transform;
}

export function downloadSVG () {
    let svg = document.getElementById("svgContainer");

    // Create element with <a> tag
    let link = document.createElement("a");

    let serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //convert svg source to URI data scheme.
    let url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

    //set url value to a element's href attribute.
    link.href = url;

    // Add file name
    link.download = `good-diagram.svg`;

    // Add click event to tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
}
