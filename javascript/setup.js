import { update_svg_diagram, update_dynamic_layer_form } from './good_diagram.js';
import { downloadSVG } from './utils.js';

function set_up_event_listeners() {
    document.getElementById("downloadButton").addEventListener("click", downloadSVG);
    document.getElementById("submitNetwork").addEventListener("click", update_svg_diagram);
    document.getElementById("countLayers").addEventListener("input", update_dynamic_layer_form);
}

window.onload = set_up_event_listeners();
