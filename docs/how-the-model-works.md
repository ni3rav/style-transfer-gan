# How the model works

This is a CycleGAN trained on the official unpaired `ukiyoe2photo` set. Domain A is Ukiyo-e prints. Domain B is landscape photos. Nothing in the training set is a before-and-after pair, so the model cannot copy a paired example.

The finished run is the 20-epoch checkpoint described in `src/notebooks/trained_fin.ipynb`. That notebook is the record of the run. The notes below were read from it.

## The four networks

The model learns two translators and two critics.

- `G_A`, about 11.378 million parameters, turns a photo into a Ukiyo-e image. This is the network used after training.
- `G_B`, the same size, turns a Ukiyo-e image back into a photo.
- `D_A`, about 2.765 million parameters, judges whether an image belongs to the Ukiyo-e set.
- `D_B`, the same size, judges whether an image belongs to the photo set.

Each generator is a 9-block ResNet: reflect-pad, a 7×7 convolution, two stride-2 downsamplings, nine residual blocks, two transposed convolutions, and a `tanh` output. Each critic is a 70×70 PatchGAN with three layers. Normalization is instance norm without an affine scale, and dropout is off. Weights start from a normal distribution with standard deviation 0.02.

Direction `BtoA` swaps the loaded batches before the loss. In the saved test pictures, `real_A` is the photo, `fake_B` is the Ukiyo-e translation, and `rec_A` is the photo reconstructed from that translation.

## One training step

One step draws a photo and a print independently. The batch size is 1.

1. The photo goes through `G_A` and then `G_B`. The result should match the original photo.
2. The print goes through `G_B` and then `G_A`. The result should match the original print.
3. `G_A` is also shown a real print and asked to leave it alone. `G_B` is shown a real photo and asked to leave it alone. That identity term keeps the generator from repainting color when the input is already in the target style.
4. `D_A` tries to accept real prints and reject generated prints. `D_B` does the same for photos. The generators try to make the critics accept their fakes.
5. The critic is not trained only on the latest fake. A replay buffer of 50 images sometimes substitutes an older fake, so the critic does not forget earlier generator mistakes.

The adversarial term is least-squares GAN loss: mean squared error against 1 for a real target and 0 for a fake target. The cycle and identity terms are L1. Cycle loss is multiplied by 10. Identity loss is that cycle term multiplied by 0.5, so its logged weight is 5.

There is no paired reconstruction loss against a ground-truth print of the same scene. A close reconstructed photo means the two generators kept the content. It does not by itself mean the print looks like a woodblock.

After training, inference uses `G_A` only.

## Configuration of the finished run

| Choice | Value |
| --- | --- |
| Dataset | `ukiyoe2photo`, downloaded in the notebook |
| Steps per epoch | 6,287, the size of the larger domain |
| Epochs | 10 at learning rate 0.0002, then 10 of linear decay |
| Optimizer | Adam, β1 0.5, β2 0.999 |
| Batch | 1 |
| Train crop | resize to 286, random crop to 256, random horizontal flip |
| Test crop | resize to 256, no flip |
| GAN | least squares |
| Replay buffer | 50 images |
| Cycle weight | 10 |
| Identity weight | 0.5 |
| Logged | every 100 iterations |
| Checkpoint | `latest.pt`, three times per epoch |
| Machine in the saved run | Tesla T4 |

The saved notebook ends with the learning rate moving from 0.0000182 to 0, then `latest.pt` saved at the end of epoch 20. The last epoch took 4,910 seconds. The learning rate is now zero, so running the training notebook again does not continue training.

The paper's usual schedule is 200 epochs. This run is the 20-epoch schedule above.

## What each loss is pushing on

- The GAN loss is the style pressure. It asks the translation to look like the other collection.
- Cycle loss is the content anchor. It asks a round trip to come back to the same picture.
- Identity loss is the color anchor. It asks a generator to leave an image alone when that image is already in the target style.

Instance norm, a PatchGAN, least-squares loss, and the replay buffer are the CycleGAN defaults this training kept.
