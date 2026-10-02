# Ukiyo-e CycleGAN

Status: ready-for-agent

## Problem

The local machine cannot train a CycleGAN. Colab's free plan does not connect the editor extension, so the run has to be a single notebook uploaded to Colab.

## Outcome

One Colab session produces a trained photo-to-Ukiyo-e generator, a loss chart, and eight translated test photos. The chart and the images are shown in the notebook. The weights and the loss log stay on Google Drive.

## Decisions

- The only file to upload is `ukiyoe_cyclegan.ipynb`. It contains the generator, discriminator, dataset loader, and training step. It does not clone a repository and it does not run shell commands or `train.py`.
- That code follows the CycleGAN pieces of `junyanz/pytorch-CycleGAN-and-pix2pix`: a 9-block ResNet generator, a 70×70 PatchGAN, least-squares GAN loss, a replay buffer of 50 images, cycle-loss weight 10, and identity-loss weight 0.5.
- The dataset is official `ukiyoe2photo`, downloaded in a notebook cell with Python onto the Colab disk. Domain A is Ukiyo-e. Domain B is landscape photos. One epoch walks the larger domain, about 6,853 photos. The dataset is not copied to Drive.
- Direction is `BtoA`: a photo becomes Ukiyo-e. In the saved test images, `real_A` is the photo, `fake_B` is the Ukiyo-e translation, and `rec_A` is the reconstructed photo.
- The run is sized for one free T4 session: 3 epochs at learning rate 0.0002, then 3 epochs of linear decay (6 epochs, about 3.5–6 hours). The notebook does not resume a previous run.
- Numbered checkpoints are written every 3 epochs (epochs 3 and 6). `latest` is also written every 5,000 steps. Both go under `MyDrive/ukiyoe-cyclegan/checkpoints/ukiyoe2photo/`, along with `loss_log.txt`.
- After training, the notebook plots `D_A`, `G_A`, `cycle_A`, `idt_A`, `D_B`, `G_B`, `cycle_B`, and `idt_B`. It then translates 8 test photos and shows each photo beside its Ukiyo-e result and its reconstruction. Those images also go to `MyDrive/ukiyoe-cyclegan/results/ukiyoe2photo/test_latest/images/`.
- Colab already provides PyTorch, torchvision, and Pillow. The notebook does not install packages.

## Run

1. Upload `ukiyoe_cyclegan.ipynb` to Colab.
2. Set the runtime to a T4 GPU.
3. Run the cells from the top. Leave the session open until the last cell finishes.

## Out of scope

- A second code file, a cloned training repo, or a shell call to `train.py`.
- The paper's 200-epoch schedule, and resuming a run across Colab sessions.
- Loading the generator on this machine.
- Pix2pix and the other datasets shipped with the official repo.
- A live loss chart while training is still running.
