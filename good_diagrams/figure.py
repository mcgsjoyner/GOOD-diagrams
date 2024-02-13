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


def draw_input(count_inputs, x_center, width, height):
    """Function to draw the input layer and create hooks to it"""
    index_node = count_inputs
    traces = []
    annotations = []
    line_style = go.scatter.Line(color="black", width=0.5)
    marker_style = go.scatter.Marker(opacity=0)
    for y_center in np.arange(start=-count_inputs / 2 + 1, stop=count_inputs / 2 + 1, step=1):
        trace = go.Scatter(
            x=[x_center + width / 2, x_center + width],
            y=[y_center, y_center],
            line=line_style,
            marker=marker_style,
        )
        annotation = go.layout.Annotation(
            x=x_center + width / 2,
            y=y_center + height / 2,
            text=f"<i>x<sub>{index_node}</sub></i>",
            showarrow=False,
            xanchor="left",
            font_family="Times",
        )
        traces.append(trace)
        annotations.append(annotation)
        index_node = index_node - 1
    count_nodes_previous = count_inputs
    x_previous = x_center + width
    return count_nodes_previous, x_previous, traces, annotations


def draw_node(width, height, x_center, y_center):
    """Function to draw the "D"-shaped node for GOOD diagrams"""
    rotation = np.pi * np.arange(start=1 / 2, step=1 / 50, stop=3 / 2 + 1 / 50)
    outline_node = go.Scatter(
        x=width / 2 * np.stack([1] + list(np.cos(rotation)) + [1, 1]) + x_center,
        y=height / 2 * np.stack([1] + list(np.sin(rotation)) + [-1, 1]) + y_center,
        line=go.scatter.Line(color="black", width=0.5),
    )
    return outline_node


def draw_layer(
    count_nodes_previous,
    x_previous,
    count_nodes,
    x_center,
    activation_str,
    index_layer,
    show_bias=1,
):
    width, height = 0.85, 0.65
    index_node = count_nodes
    traces, annotations = [], []
    line_style = go.scatter.Line(color="black", width=0.5)
    marker_style = go.scatter.Marker(
        color="black", angleref="previous", symbol="arrow", opacity=[0, 1]
    )
    for y_center in np.arange(-count_nodes / 2 + 1, count_nodes / 2 + 1, step=1):
        traces.append(draw_node(width, height, x_center, y_center))
        trace = go.Scatter(
            x=x_center + width * np.array([0.5, 1.3]),
            y=[y_center, y_center],
            line=line_style,
            marker=go.scatter.Marker(opacity=0),
        )  # draw line activation label goes on top of
        traces.append(trace)
        annotation = go.layout.Annotation(
            x=x_center + width / 2,
            y=y_center + height / 2,
            text=f"a<sub>{index_node}</sub><sup>[{index_layer + 1}]</sup>",
            showarrow=False,
            xanchor="left",
            yanchor="middle",
            font_family="Times",
        )
        annotations.append(annotation)
        index_node = index_node - 1

        # TODO: italic
        annotation = go.layout.Annotation(
            x=x_center + width / 2,
            y=y_center - height / 2,
            text=f"<i>{activation_str}</i>",
            showarrow=False,
            xanchor="right",
            yanchor="bottom",
            font_family="Script MT Bold",
            font_size=8,
        )
        annotations.append(annotation)
        # Show connections from previous layer and for bias
        for y_previous in np.arange(
            -count_nodes_previous / 2, count_nodes_previous / 2 + 1, step=1
        ):
            if (y_previous == -count_nodes_previous / 2) and (show_bias == 1):
                x_bias = 0.7 * x_previous + 0.3 * x_center

                previous, current = -count_nodes_previous / 2 + 0.4, -count_nodes / 2 + 1
                y_bias = min(previous, sum([previous, current]) / 2)

                angle_to_layer = np.arctan((y_previous - y_center) / (x_previous - x_center))
                trace = go.Scatter(
                    x=[x_bias, x_center - width / 2 * np.cos(angle_to_layer)],
                    y=[y_bias, y_center - height / 2 * np.sin(angle_to_layer)],
                    line=line_style,
                    marker=marker_style,
                )
                traces.append(trace)

                # place "1" on a line for arrows entering layer
                trace = go.Scatter(
                    x=[x_bias - 0.3 * width, x_bias],
                    y=[y_bias, y_bias],
                    line=line_style,
                    marker=go.scatter.Marker(opacity=0),
                )
                traces.append(trace)

                annotation = go.layout.Annotation(
                    x=x_bias - 0.3 * width,
                    y=y_bias + height / 4,
                    font=go.layout.annotation.Font(family="Cambria Math", size=8),
                    text="1",
                    showarrow=False,
                    xanchor="left",
                )
                annotations.append(annotation)
            else:  # regular node
                tmp = np.arctan((y_previous - y_center) / (x_previous - x_center))
                trace = go.Scatter(
                    x=[x_previous, x_center - width / 2 * np.cos(tmp)],
                    y=[y_previous, y_center - height / 2 * np.sin(tmp)],
                    line=go.scatter.Line(color="black", width=0.5),
                    marker=marker_style,
                )
                traces.append(trace)
    count_nodes_previous = count_nodes
    x_previous = x_center + 1.3 * width
    return count_nodes_previous, x_previous, traces, annotations


def build_figure(layers, count_inputs):
    count_layers = len(layers)
    max_count_nodes = max(layer.node_count for layer in layers)
    node_width, node_height = 0.85, 0.65
    # OK, so only issue with fixing it at this is that the BIAS arrows can cross some nodes... so look into that
    spacing_baseline = 3.5  # 2.5
    spacing_layer = [spacing_baseline] * count_layers

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
    count_nodes_previous, x_previous, traces, annotations = draw_input(
        count_inputs, x_center, node_width, node_height
    )
    for ann in annotations:
        fig.add_annotation(ann)
    fig.add_traces(traces)

    for i, layer in enumerate(layers):
        count_nodes_previous, x_previous, traces, annotations = draw_layer(
            count_nodes_previous=count_nodes_previous,
            x_previous=x_previous,
            count_nodes=layer.node_count,
            x_center=sum(spacing_layer[: i + 1]),
            activation_str=layer.activation,
            index_layer=i,
            show_bias=layer.show_bias,
        )
        for ann in annotations:
            fig.add_annotation(ann)
        fig.add_traces(traces)

    return fig
