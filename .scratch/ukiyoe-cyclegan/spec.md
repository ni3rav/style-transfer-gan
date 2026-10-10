# Ukiyo-e CycleGAN

Status: ready-for-agent

## Problem

The local machine cannot train a CycleGAN. Colab's free plan does not connect the editor extension, so the run has to be a single notebook uploaded to Colab. When Colab is unavailable, the same training runs from `ukiyoe_cyclegan_kaggle.ipynb`.

## Outcome

Training runs for 20 epochs, across more than one Colab session if the runtime drops. The notebook shows a loss chart and eight translated test photos. During training that chart is one image, overwritten every 100 iterations from the full loss history. The resumable checkpoint and the loss log stay on Google Drive.

## Decisions

- The Colab file to upload is `ukiyoe_cyclegan.ipynb`. The Kaggle file is `ukiyoe_cyclegan_kaggle.ipynb`. Each contains the generator, discriminator, dataset loader, and training step. Neither clones a repository or runs shell commands or `train.py`.
- That code follows the CycleGAN pieces of `junyanz/pytorch-CycleGAN-and-pix2pix`: a 9-block ResNet generator, a 70×70 PatchGAN, least-squares GAN loss, a replay buffer of 50 images, cycle-loss weight 10, and identity-loss weight 0.5.
- The dataset is official `ukiyoe2photo`, downloaded in a notebook cell with Python onto the Colab disk. Domain A is Ukiyo-e. Domain B is landscape photos. One epoch walks the larger domain, about 6,853 photos. The dataset is not copied to Drive.
- Direction is `BtoA`: a photo becomes Ukiyo-e. In the saved test images, `real_A` is the photo, `fake_B` is the Ukiyo-e translation, and `rec_A` is the reconstructed photo.
- The run is 20 epochs: `N_EPOCHS` 10 at learning rate 0.0002, then `N_EPOCHS_DECAY` 10 of linear decay. One free Colab session will not finish that. Run the notebook from the top again after a drop.
- The only checkpoint kept is `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/latest.pt`. `SAVES_PER_EPOCH` is 3, so each epoch writes it at one third, two thirds, and the end. The same write stores `loss_log.txt`. The file holds the network weights, optimizer state, learning-rate schedule, loss history, log text, and how far into the epoch training got. A file from the previous once-per-epoch schedule has no mid-epoch mark, so it still means that epoch finished. A newer mid-epoch file resumes the rest of that epoch. The loader shuffles, so the remaining steps see a new random sample. Finished epochs are not repeated.
- The Kaggle notebook uses that same path under `/kaggle/working/drive/MyDrive/ukiyoe-cyclegan/`. It copies `latest.pt` and `loss_log.txt` from an attached input dataset whose folder is `checkpoints/ukiyoe2photo/`. The dataset zip is downloaded to `/tmp/datasets/ukiyoe2photo` and is not part of the notebook output. Kaggle does not mount Drive, so the new checkpoint has to be copied back to `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/` before the next session.
- Every 100 iterations the training cell prints the last five stat lines. The loss log still stores every line. The same step overwrites `checkpoints/ukiyoe2photo/loss_plot.png` with all losses recorded so far, and refreshes that one image in the cell output. The plot is not a second checkpoint.
- After training, the notebook plots `D_A`, `G_A`, `cycle_A`, `idt_A`, `D_B`, `G_B`, `cycle_B`, and `idt_B`. It then translates 8 test photos and shows each photo beside its Ukiyo-e result and its reconstruction. Those images also go to `MyDrive/ukiyoe-cyclegan/results/ukiyoe2photo/test_latest/images/`.
- Colab already provides PyTorch, torchvision, and Pillow. The notebook does not install packages.

## Run

1. Upload `ukiyoe_cyclegan.ipynb` to Colab.
2. Set the runtime to a T4 GPU.
3. Run the cells from the top. If the session drops before epoch 20, start a new session and run the cells from the top again.

Kaggle, when Colab is unavailable:

1. Import `ukiyoe_cyclegan_kaggle.ipynb`.
2. Turn Internet on and set the accelerator to GPU.
3. Add a dataset that contains `checkpoints/ukiyoe2photo/latest.pt` and `loss_log.txt` from `MyDrive/ukiyoe-cyclegan/`.
4. Run the cells from the top. Before the session ends, copy the new `latest.pt` and `loss_log.txt` from `/kaggle/working/drive/MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/` back to that Drive folder.

## Out of scope

- A second code file, a cloned training repo, or a shell call to `train.py`.
- The paper's 200-epoch schedule.
- Loading the generator on this machine.
- Pix2pix and the other datasets shipped with the official repo.
