from good_diagrams import figure as gd


def main():
    # The input dimensionality (how many nodes)
    inputDims = 2

    layers = [
        gd.LayerSpec(6, gd.RELU, True),
        gd.LayerSpec(10, gd.RELU, True),
        gd.LayerSpec(7, gd.RELU, True),
        gd.LayerSpec(5, gd.RELU, True),
        gd.LayerSpec(9, gd.RELU, True),
        gd.LayerSpec(1, gd.SIGMA, True),
    ]

    hFig = gd.build_figure(layers, inputDims)
    hFig.show(renderer="browser")


if __name__ == "__main__":
    main()
