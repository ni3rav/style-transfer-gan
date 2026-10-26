# How to run

## Train

Training does not run on this machine. Upload `src/notebooks/ukiyoe_cyclegan.ipynb` to Colab, set the runtime to a T4 GPU, and run the cells from the top.

The schedule is 20 epochs: 10 at learning rate 0.0002, then 10 of linear decay. One free session will not finish that. If the session drops, start a new one and run the cells from the top again. Training continues from `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/latest.pt`. A file saved at the end of an epoch resumes at the next epoch. A file saved partway through resumes the rest of that epoch.

The finished run is already stored. `src/notebooks/trained_fin.ipynb` shows epoch 20 ending with the learning rate at 0. Running the training notebook again on that checkpoint does not train further.

During training, every 100 iterations the cell prints the last five stat lines and overwrites `checkpoints/ukiyoe2photo/loss_plot.png` with the full loss history. How to read that chart is in `docs/how-to-read-the-results.md`.

## Translate a photo locally

The page runs `G_A` in the browser from `src/client/public/g_a.onnx`. That file is the generator only, about 45 MB. The 340 MB training checkpoint stays at `src/server/ukiyoe_cyclegan.pt` and is not committed. Rebuild the ONNX file from it with:

```sh
PYTHONPATH=src uv run python src/server/export_onnx.py
```

From the repo root:

```sh
./start
```

The script installs the Python and npm dependencies, builds the page, and serves it at http://127.0.0.1:8000.

On the page, choose one photo. The browser stretches it to 256×256, runs the ONNX model, and shows that picture beside the Ukiyo-e result. The first translation also downloads the model file.

To put the page on Vercel, set the project root to `src/client`, the framework to Vite, the build command to `npm run build`, and the output directory to `dist`. The ONNX file has to be in the deployment. The training checkpoint does not.
