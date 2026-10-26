# How to read the results

Open `src/notebooks/trained_fin.ipynb`. The loss chart is the figure after the training cell. The eight test rows are the last figure. This file is the finished run. Do not treat a single printed log line as the result of the whole training.

The notebook's own training output resumed at epoch 17 and ended at epoch 20. The chart still contains all 20 epochs, because the checkpoint restores the earlier loss history.

## What was measured

Eight training losses, plus a visual check of eight test photos. No FID, LPIPS, SSIM, or classification accuracy was computed.

A printed line is one image at one step, not an average over the epoch. The training cell prints only the latest five lines, and those windows overlap from one print to the next. Use the chart for the history.

The names follow the code after the `BtoA` swap:

- `D_A` and `G_A` are the Ukiyo-e critic and the generator trying to fool it.
- `D_B` and `G_B` are the photo critic and the generator trying to fool it.
- `cycle_A` is photo → print → photo, already multiplied by 10.
- `cycle_B` is print → photo → print, already multiplied by 10.
- `idt_A` is `G_A` asked to leave a real print unchanged, already multiplied by 5.
- `idt_B` is `G_B` asked to leave a real photo unchanged, already multiplied by 5.

The last logged step is epoch 20, iteration 125,700:

`D_A` 0.037, `G_A` 0.695, `cycle_A` 0.822, `idt_A` 0.356, `D_B` 0.105, `G_B` 0.534, `cycle_B` 0.570, `idt_B` 0.258.

Quote the shape of the chart. Quote that line only as an example of one step.

## How to read the eight graphs

Each panel is one loss. The horizontal axis is a log step, not an epoch. One point is written every 100 training iterations. An epoch of 6,287 images is about 63 points. Twenty epochs are about 1,257 points, which is why the axis runs to roughly 1,250. The first half of the axis is the constant learning rate. The second half is the decay.

The vertical scales are not the same. A cycle value near 1 and a discriminator value near 0.2 are not the same kind of number. The cycle and identity panels already include their weights.

Read the panels in two groups.

The adversarial panels, `D_A`, `G_A`, `D_B`, and `G_B`, stay jagged for the whole run. `D_A` and `D_B` sit mostly between about 0.05 and 0.3, with spikes above 0.5. `G_A` and `G_B` sit mostly between about 0.2 and 1.0, with spikes near 1.75. They do not fall toward zero. For a least-squares GAN that is a balance: the critic keeps detecting some fakes, and the generator keeps fooling it on others. A spike is one difficult image, because the point is one batch of size 1.

The cycle and identity panels are the content curves. `cycle_A` starts near 8 and `cycle_B` near 4.5. Both fall within the first few epochs, about the first 200 log steps, and then sit in a noisy band around 1. `idt_A` starts near 2 and `idt_B` near 2.5, fall on the same early schedule, and then stay mostly below 1. `idt_B` has one sharp spike near 4 later in training. The early drop means the round trip started preserving the input. The later flat band means that part of training had settled. The line does not become smooth at the end, because each point is still one image.

## The eight test rows

The last figure shows eight test photos. Each row is the photo, the `G_A` translation, and the reconstructed photo.

The reconstructions generally keep the scene. That matches the cycle loss settling near 1. The middle column is uneven. Some rows, such as the canal and the duck, read as painted. Others look closer to a grain laid over the photograph. The last landscape loses the hills. That is the quality this 20-epoch checkpoint reached. The figure is a sample of eight images, not a score over the whole test set.

## Points worth saying

- The training signal for style is unpaired. The cycle forces content to survive a round trip. The critic forces the output onto the look of the other set.
- Identity loss is a color anchor. Cycle loss is a content anchor. The GAN loss is the style pressure.
- The displayed adversarial losses are supposed to look noisy. The cycle and identity losses are the ones that should fall and then level off.
- After epoch 20 the learning rate is zero and `latest.pt` is the finished checkpoint.
