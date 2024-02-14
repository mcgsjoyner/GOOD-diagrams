from collections import namedtuple

import plotly.graph_objects as go
import numpy as np

RELU = "\U0001D4E1"
SIGMA = "\u03C3"

LayerSpec = namedtuple(
    "LayerSpec",
    field_names=[
        "node_count",  # Number of nodes per layer for each subsequent layer
        "activation",  # The activation "letters" shown lower right corner in each node
        "show_bias",  # Whether we include bias at every layer
    ],
    defaults=[1, "", True],
)

STYLE_LINE = go.scatter.Line(color="black", width=0.5)
WIDTH_SOMA = 0.85
HEIGHT_SOMA = 0.65
WIDTH_AXON = 0.8 * WIDTH_SOMA
# OK, so only issue with fixing it at this is that the BIAS arrows can cross some nodes... so look into that
WIDTH_SYNAPSE = 3.5  # 2.5


def draw_input(count_inputs, x_center):
    """Function to draw the input layer and create hooks to it"""
    traces = []
    annotations = []
    for i in range(count_inputs):
        index_node = count_inputs - i
        trace, annotation = draw_response(
            x_center=x_center,
            y_center=i - count_inputs / 2 + 1,
            str_response=f"<i>x<sub>{index_node}</sub></i>",
        )
        traces.append(trace)
        annotation.font.family = "Times"
        annotations.append(annotation)
    count_nodes_previous = count_inputs
    x_previous = x_center + WIDTH_SOMA / 2 + WIDTH_AXON
    return count_nodes_previous, x_previous, traces, annotations


def draw_node(x_center, y_center, str_activation):
    """Function to draw the "D"-shaped node for GOOD diagrams"""
    rotation = np.pi * np.arange(start=1 / 2, step=1 / 50, stop=3 / 2 + 1 / 50)
    trace = go.Scatter(
        x=WIDTH_SOMA / 2 * np.stack([1] + list(np.cos(rotation)) + [1, 1]) + x_center,
        y=HEIGHT_SOMA / 2 * np.stack([1] + list(np.sin(rotation)) + [-1, 1]) + y_center,
        line=go.scatter.Line(color="black", width=0.5),
    )
    annotation = go.layout.Annotation(
        x=x_center + WIDTH_SOMA / 2,
        y=y_center - HEIGHT_SOMA / 2,
        text=str_activation,
        showarrow=False,
        xanchor="right",
        yanchor="bottom",
        # TODO: italic
        font=go.layout.annotation.Font(family="Script MT Bold", size=8),
    )
    return trace, annotation


def draw_response(
    x_center: float, y_center: float, str_response: str
) -> (go.Trace, go.Annotation):
    trace = go.Scatter(
        x=x_center + WIDTH_SOMA / 2 + np.array([0, WIDTH_AXON]),
        y=[y_center, y_center],
        line=STYLE_LINE,
        marker=go.scatter.Marker(opacity=0),
    )
    annotation = go.layout.Annotation(
        x=x_center + WIDTH_SOMA / 2,
        y=y_center + HEIGHT_SOMA / 2,
        text=str_response,
        showarrow=False,
        xanchor="left",
        yanchor="middle",
        font=go.layout.annotation.Font(family="Times"),
    )
    return trace, annotation


def draw_connection(x_start, x_center, y_start, y_center):
    marker_style = go.scatter.Marker(
        color="black", angleref="previous", symbol="arrow", opacity=[0, 1]
    )
    angle_to_layer = np.arctan((y_start - y_center) / (x_start - x_center))
    trace = go.Scatter(
        x=[x_start, x_center - WIDTH_SOMA / 2 * np.cos(angle_to_layer)],
        y=[y_start, y_center - HEIGHT_SOMA / 2 * np.sin(angle_to_layer)],
        line=STYLE_LINE,
        marker=marker_style,
    )
    return trace


def build_figure(layers, count_inputs):
    count_layers = len(layers)
    max_count_nodes = max(layer.node_count for layer in layers)
    spacing_layer = [WIDTH_SYNAPSE] * count_layers

    xaxis = go.layout.XAxis(
        range=[0, sum(spacing_layer) * (1 + 1 / (2 * len(spacing_layer)))],
        visible=False,
    )
    yaxis = go.layout.YAxis(
        range=[-max_count_nodes / 2, max_count_nodes / 2 + 1],
        visible=False,
    )
    layout = go.Layout(
        xaxis=xaxis,
        yaxis=yaxis,
        width=1000,
        height=600,
        showlegend=False,
    )
    fig = go.Figure(layout=layout)

    x_center = 0
    count_nodes_previous, x_previous, traces, annotations = draw_input(count_inputs, x_center)

    for index_layer, layer in enumerate(layers):
        count_nodes = layer.node_count
        x_center = sum(spacing_layer[: index_layer + 1])
        str_activation = layer.activation

        for i in range(count_nodes):
            trace, annotation = draw_node(
                x_center=x_center,
                y_center=i - count_nodes / 2 + 1,
                str_activation=f"<i>{str_activation}</i>",
            )
            traces.append(trace)
            annotations.append(annotation)

        for i in range(count_nodes):
            index_node = count_nodes - i
            trace, annotation = draw_response(
                x_center=x_center,
                y_center=i - count_nodes / 2 + 1,
                str_response=f"a<sub>{index_node}</sub><sup>[{index_layer + 1}]</sup>",
            )
            traces.append(trace)
            annotations.append(annotation)

        for i in range(count_nodes):
            y_center = i - count_nodes / 2 + 1
            for x in range(count_nodes_previous):
                y_previous = x - count_nodes_previous / 2 + 1
                trace = draw_connection(x_previous, x_center, y_previous, y_center)
                traces.append(trace)

        if layer.show_bias:
            for i in range(count_nodes):
                y_center = i - count_nodes / 2 + 1
                previous, current = -count_nodes_previous / 2 + 0.4, -count_nodes / 2 + 1
                x_start = 0.7 * x_previous + 0.3 * x_center
                y_start = min(previous, sum([previous, current]) / 2)
                trace = draw_connection(x_start, x_center, y_start, y_center)
                traces.append(trace)

                # place "1" on a line for arrows entering layer
                trace, annotation = draw_response(
                    x_center=x_start - WIDTH_SOMA / 2 - WIDTH_AXON,
                    y_center=y_start,
                    str_response="1",
                )
                annotation.font.family = "Cambria Math"
                annotation.font.size = 8
                traces.append(trace)
                annotations.append(annotation)

        count_nodes_previous = count_nodes
        x_previous = x_center + WIDTH_SOMA / 2 + WIDTH_AXON

    for ann in annotations:
        fig.add_annotation(ann)
    fig.add_traces(traces)

    return fig
