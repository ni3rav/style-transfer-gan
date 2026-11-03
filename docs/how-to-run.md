# How to run

## Train

Training stays off this machine. The notebook that trains is `src/notebooks/ukiyoe_cyclegan.ipynb`. Upload that file to Colab, choose a T4 GPU runtime, and run the cells from the top.

The schedule is 20 epochs. For the first 10, the learning rate stays at 0.0002. For the next 10, it falls in a straight line to zero. One free Colab session will not finish that. If the session drops, start a new one and run the cells from the top again. The notebook looks for `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/latest.pt` and continues from whatever that file contains. A file saved at the end of an epoch resumes at the next epoch. A file saved partway through an epoch resumes the rest of that epoch.

The finished run is already stored. `src/notebooks/trained_fin.ipynb` shows epoch 20 ending with the learning rate at 0. Running the training notebook again on that checkpoint does not train further, because a learning rate of zero takes steps of size zero.

During training, every 100 steps the cell prints the last five stat lines and overwrites `checkpoints/ukiyoe2photo/loss_plot.png` with the chart of the whole history. How to read that chart is in `docs/how-to-read-the-results.md`.

## Translate a photo on this machine

The page people use does not load PyTorch, and it does not load the training checkpoint. It runs one network, the photo-to-print translator `G_A`, inside the browser.

That network is stored as `src/client/public/g_a.onnx`, about 45 MB. ONNX here is just a frozen copy of `G_A` that the browser's runtime can execute. The full training checkpoint, about 340 MB, stays at `src/server/ukiyoe_cyclegan.pt`. That file holds all four networks and the loss history. It is not committed. If you replace the checkpoint and want the page to match it, export `G_A` again from the repository root:

```sh
PYTHONPATH=src uv run python src/server/export_onnx.py
```

To build and open the page locally, from the repository root:

```sh
./start
```

The script installs the Python and npm dependencies, builds the page, and serves it at http://127.0.0.1:8000.

On the page, choose one photo. The browser stretches it to 256×256, because that is the size `G_A` was trained to see. A wide photo is squashed to a square as part of that stretch. The page then shows that 256×256 picture beside the print. The first translation also downloads the model file, about 45 MB. Later translations reuse it.

The hosted copy of the same page is described in `docs/how-to-deploy.md`.
