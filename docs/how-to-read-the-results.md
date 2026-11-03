# How to read the results

Open `src/notebooks/trained_fin.ipynb`. Two pictures matter. The loss chart is the figure drawn after the training cell. The eight test rows are the last figure in the notebook. This file is the finished run. A single printed log line is one image at one step, so use the chart when you want the history and the test figure when you want to talk about picture quality.

The notebook's own training output starts again at epoch 17 and ends at epoch 20. The chart still contains all 20 epochs. The checkpoint restores the earlier loss history, and the plot is drawn from that full history.

Nothing else was measured. There is no FID, LPIPS, SSIM, or classification accuracy. The evidence is the eight curves, plus those eight test photographs.

## What one printed line is

Every 100 training steps, the cell prints the latest five log lines. The next print overlaps that window, so reading the printed text as a sequence will count the same steps more than once. The chart is the clean history.

Because the batch size is 1, a line is one photograph and one print. A spike is one difficult image. It is not an epoch average.

The names are the ones left after the `BtoA` swap, explained in `docs/how-the-model-works.md`. In short:

- `D_A` is the print critic. `G_A` is the photo-to-print network trying to fool that critic.
- `D_B` is the photo critic. `G_B` is the print-to-photo network trying to fool that critic.
- `cycle_A` is photo, then print, then back to photo. The number already includes the weight of 10.
- `cycle_B` is print, then photo, then back to print. The number already includes the weight of 10.
- `idt_A` is `G_A` asked to leave a real print unchanged. The number already includes the weight of 5.
- `idt_B` is `G_B` asked to leave a real photograph unchanged. The number already includes the weight of 5.

The last logged step is epoch 20, iteration 125,700:

`D_A` 0.037, `G_A` 0.695, `cycle_A` 0.822, `idt_A` 0.356, `D_B` 0.105, `G_B` 0.534, `cycle_B` 0.570, `idt_B` 0.258.

Treat that line as an example of one step near the end. Describe the shape of the chart when you describe the run.

## How the chart is laid out

Each panel is one of those eight numbers, drawn for the whole run.

The horizontal axis is a log step, not an epoch. One point is written every 100 training iterations. An epoch of 6,287 images is about 63 points. Twenty epochs are about 1,257 points, which is why the axis runs to roughly 1,250. The left half of the axis is the ten epochs at learning rate 0.0002. The right half is the ten epochs in which that rate falls to zero.

The vertical scales are separate. A cycle value near 1 and a critic value near 0.2 are different kinds of number. The cycle and identity panels already include their weights, so they sit on a larger scale than the raw pixel error.

Read the eight panels as two groups.

## The four jagged curves

`D_A`, `G_A`, `D_B`, and `G_B` stay jagged for the whole run.

`D_A` and `D_B` sit mostly between about 0.05 and 0.3, with spikes above 0.5. `G_A` and `G_B` sit mostly between about 0.2 and 1.0, with spikes near 1.75. None of them trends down toward zero.

For a least-squares GAN, that shape is a balance. The critic keeps catching some fakes, and the translator keeps getting others accepted. If the critic's curve fell to zero and stayed there, the critic would have given up. If the translator's curve fell to zero and stayed there, the critic would no longer be providing a useful target. The noise is one image at a time: a hard photograph makes a spike, and the next photograph does not.

## The four curves that fall, then level off

`cycle_A`, `cycle_B`, `idt_A`, and `idt_B` are the content curves.

`cycle_A` starts near 8 and `cycle_B` near 4.5. Both fall within the first few epochs, about the first 200 points on the chart, and then sit in a noisy band around 1. On the network's -1 to 1 pixel scale, a plotted value near 1 means the average absolute error of the round trip is about 0.1, because the plot includes the factor of 10.

`idt_A` starts near 2 and `idt_B` near 2.5. They fall on the same early schedule and then stay mostly below 1. `idt_B` has one sharp spike near 4 later in training, one photograph that the print-to-photo network failed to leave alone.

The early drop means the round trip started keeping the input. The later flat band means that part of training had settled. The line stays noisy at the end because each point is still one image.

## The eight test rows

The last figure shows eight photographs the training loop did not use for those steps. Each row has three pictures:

1. The photograph, labeled `real_A` in the code.
2. The print `G_A` made from it, labeled `fake_B`.
3. The photograph reconstructed by sending that print through `G_B`, labeled `rec_A`.

Look at the third column first. The scenes mostly survive: the layout you see on the left is still there on the right. That matches the cycle curves settling near 1.

Then look at the middle column, which is the actual product. It is uneven. Some rows, such as the canal and the duck, read as painted. Others look closer to the original photograph with a grain and a palette laid over it. The last landscape loses the hills. That spread is the quality this 20-epoch checkpoint reached.

The figure is eight examples. It is not a score over the whole test set, and the run did not compute one.

## If you are explaining the figure

- The prints and the photographs were never pairs. The round trip is what kept the scene, and the print critic is what pushed the look.
- The jagged critic and translator curves are the healthy ones. The cycle and identity curves are the ones that should fall and then sit still.
- A cycle value on the chart is already multiplied by 10. Near 1 means a small pixel error on the way home, on the -1 to 1 scale the network uses.
- The middle picture in each test row is the thing the project is for. Some of them look like prints. Some of them mostly restyle the photograph. The reconstructed photo can look faithful either way.
- After epoch 20 the learning rate is zero, and `latest.pt` is the finished checkpoint.
