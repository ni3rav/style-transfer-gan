# Agent notes

## Project

This repo holds one Colab notebook that trains a photo-to-Ukiyo-e CycleGAN. Training happens on a Colab GPU. Do not train here, and do not load the generator on this machine.

`README.md` states the objective only. The plan is `.scratch/ukiyoe-cyclegan/spec.md`. Read that spec before changing the notebook.

## Issue tracker

Plans and specs live as local markdown under `.scratch/`. One feature per directory. The spec for a feature is `.scratch/<feature-slug>/spec.md`.

## Working agreement

- `ukiyoe_cyclegan.ipynb` is the only file that runs. Upload that file to Colab. The free plan does not connect the editor extension, and the Colab kernel cannot see this working tree.
- The generator, discriminator, dataset, and training step live in the notebook. Do not clone a repo or shell out to `train.py` at runtime.
- The notebook may download the `ukiyoe2photo` zip with Python. That is the dataset, not a second code file.
- `src/style_transfer_gan` is an unused package stub. Leave it alone unless the spec says otherwise.
- This environment is Python 3.13 via uv. Colab uses its own interpreter. Do not pin the notebook to this repo's Python.
- Keep new plan notes in `.scratch/`, not in `README.md`.
