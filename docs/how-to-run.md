# How to run

## Train

Training does not run on this machine. Upload `src/notebooks/ukiyoe_cyclegan.ipynb` to Colab, set the runtime to a T4 GPU, and run the cells from the top.

The schedule is 20 epochs: 10 at learning rate 0.0002, then 10 of linear decay. One free session will not finish that. If the session drops, start a new one and run the cells from the top again. Training continues from `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/latest.pt`. A file saved at the end of an epoch resumes at the next epoch. A file saved partway through resumes the rest of that epoch.

The finished run is already stored. `src/notebooks/trained_fin.ipynb` shows epoch 20 ending with the learning rate at 0. Running the training notebook again on that checkpoint does not train further.

During training, every 100 iterations the cell prints the last five stat lines and overwrites `checkpoints/ukiyoe2photo/loss_plot.png` with the full loss history. How to read that chart is in `docs/how-to-read-the-results.md`.

## Translate a photo locally

The local app loads `G_A` from `src/server/ukiyoe_cyclegan.pt`. That file is the finished checkpoint and is not committed.

From the repo root:

```sh
./start
```

The script installs the Python and npm dependencies, builds the page, and serves it at http://127.0.0.1:8000.

On the page, choose one photo. The browser stretches it to 256×256 and uploads that PNG. The page shows the 256×256 picture beside the Ukiyo-e result. A 256×256 pass on this machine's CPU can take about half a minute. A second request waits for the first. An upload that is not 256×256 is rejected. The server does not resize.

Stop the server with Ctrl+C in the terminal that ran `./start`.
