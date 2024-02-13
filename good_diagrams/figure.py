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


def draw_input(L, cx):
    """Function to draw the input layer and create hooks to it"""
    w, h = 0.85, 0.65
    l = L
    traces = []
    annotations = []
    line_style = go.scatter.Line(color="black", width=0.5)
    marker_style = go.scatter.Marker(opacity=0)
    for cy in np.arange(start=-L / 2 + 1, stop=L / 2 + 1, step=1):
        trace = go.Scatter(
            x=[cx + w / 2, cx + w], y=[cy, cy], line=line_style, marker=marker_style
        )
        annotation = go.layout.Annotation(
            x=cx + w / 2,
            y=cy + h / 2,
            text=f"<i>x<sub>{l}</sub></i>",
            showarrow=False,
            xanchor="left",
            font_family="Times",
        )
        traces.append(trace)
        annotations.append(annotation)
        l = l - 1
    Lprev = L
    px = cx + w
    return Lprev, px, traces, annotations


def good_node(w, h, cx, cy):
    """Function to draw the "D"-shaped node for GOOD diagrams"""
    line_style = go.scatter.Line(color="black", width=0.5)
    tmp = np.pi * np.arange(start=1 / 2, step=1 / 50, stop=3 / 2 + 1 / 50)
    x = w / 2 * np.stack([1] + list(np.cos(tmp)) + [1, 1]) + cx
    y = h / 2 * np.stack([1] + list(np.sin(tmp)) + [-1, 1]) + cy
    myobj = go.Scatter(x=x, y=y, line=line_style)
    return myobj


def draw_layer(Lprev, px, L, cx, activation, nthLayer, biasFlag=1):
    w = 0.85  # width
    h = 0.65  # height
    l = L
    traces, annotations = [], []
    line_style = go.scatter.Line(color="black", width=0.5)
    marker_style = go.scatter.Marker(
        color="black", angleref="previous", symbol="arrow", opacity=[0, 1]
    )
    for cy in np.arange(-L / 2 + 1, L / 2 + 1, step=1):
        traces.append(good_node(w, h, cx, cy))
        trace = go.Scatter(
            x=cx + w * np.array([0.5, 1.3]),
            y=[cy, cy],
            line=line_style,
            marker=go.scatter.Marker(opacity=0),
        )  # draw line activation label goes on top of
        traces.append(trace)
        annotation = go.layout.Annotation(
            x=cx + w / 2,
            y=cy + h / 2,
            text=f"a<sub>{l}</sub><sup>[{nthLayer+1}]</sup>",
            showarrow=False,
            xanchor="left",
            yanchor="middle",
            font_family="Times",
        )
        annotations.append(annotation)
        l = l - 1

        # TODO: italic
        annotation = go.layout.Annotation(
            x=cx + w / 2,
            y=cy - h / 2,
            text=f"<i>{activation}</i>",
            showarrow=False,
            xanchor="right",
            yanchor="bottom",
            font_family="Script MT Bold",
            font_size=8,
        )
        annotations.append(annotation)
        # Show connections from previous layer and for bias
        for py in np.arange(-Lprev / 2, Lprev / 2 + 1, step=1):  # previous y
            if (py == -Lprev / 2) and (biasFlag == 1):
                my_x = 0.7 * px + 0.3 * cx
                # lower of (1) previous layer -L/2 or (2) average of -Lprev/2 and -L/2
                previous, current = -Lprev / 2 + 0.4, -L / 2 + 1
                my_y = min(previous, sum([previous, current]) / 2)

                tmp = np.arctan((py - cy) / (px - cx))
                trace = go.Scatter(
                    x=[my_x, cx - w / 2 * np.cos(tmp)],
                    y=[my_y, cy - h / 2 * np.sin(tmp)],
                    line=line_style,
                    marker=marker_style,
                )
                traces.append(trace)

                # place "1" on a line for arrows entering layer
                trace = go.Scatter(
                    x=[my_x - 0.3 * w, my_x],
                    y=[my_y, my_y],
                    line=line_style,
                    marker=go.scatter.Marker(opacity=0),
                )
                traces.append(trace)

                annotation = go.layout.Annotation(
                    x=my_x - 0.3 * w,
                    y=my_y + h / 4,
                    font=go.layout.annotation.Font(family="Cambria Math", size=8),
                    text="1",
                    showarrow=False,
                    xanchor="left",
                )
                annotations.append(annotation)
            else:  # regular node
                tmp = np.arctan((py - cy) / (px - cx))
                trace = go.Scatter(
                    x=[px, cx - w / 2 * np.cos(tmp)],
                    y=[py, cy - h / 2 * np.sin(tmp)],
                    line=go.scatter.Line(color="black", width=0.5),
                    marker=marker_style,
                )
                traces.append(trace)
    Lprev = L
    px = cx + 1.3 * w
    return Lprev, px, traces, annotations


def build_figure(layers, inputDims):
    Nlayers = len(layers)
    maxNodesInOneLayer = max(layer.node_count for layer in layers)
    # OK, so only issue with fixing it at this is that the BIAS arrows can cross some nodes... so look into that
    baselineSpacing = 3.5  # 2.5
    layerSpacing = [baselineSpacing] * Nlayers

    xaxis = go.layout.XAxis(
        range=[0, sum(layerSpacing) * (1 + 1 / (2 * len(layerSpacing)))],
        visible=False,
    )
    yaxis = go.layout.YAxis(
        range=[-maxNodesInOneLayer / 2, maxNodesInOneLayer / 2 + 1],
        visible=False,
    )
    layout = go.Layout(
        xaxis=xaxis,
        yaxis=yaxis,
        width=1000,
        height=600,
        showlegend=False,
    )
    hFig = go.Figure(layout=layout)

    Lprev, px, traces, annotations = draw_input(inputDims, 0)
    for ann in annotations:
        hFig.add_annotation(ann)
    hFig.add_traces(traces)

    for i, layer in enumerate(layers):
        Lprev, px, traces, annotations = draw_layer(
            Lprev=Lprev,
            px=px,
            L=layer.node_count,
            cx=sum(layerSpacing[: i + 1]),
            activation=layer.activation,
            nthLayer=i,
            biasFlag=layer.show_bias,
        )
        for ann in annotations:
            hFig.add_annotation(ann)
        hFig.add_traces(traces)

    return hFig
