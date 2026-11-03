# How the model works

A landscape photo goes in. What comes out is meant to be the same place, drawn in the manner of a Japanese woodblock print: heavier outlines, flatter color, the grain and palette of the prints in the training set. That print style is the Ukiyo-e side of this project.

You already know a generator and a discriminator. The rest of this note is about why this particular model needs two of each, what one training step is asking them to do, and how the names in the notebook line up with those jobs.

The finished run is the 20-epoch checkpoint recorded in `src/notebooks/trained_fin.ipynb`. The numbers below were read from that notebook.

## Two collections, and no matched pairs

A normal image-to-image network wants a correct answer for each input. You would show it a photo and the woodblock print of that same photo, and ask it to match the print.

This training set does not work that way. It is the public `ukiyoe2photo` collection: one folder of woodblock prints, and another folder of landscape photographs. A print in the first folder is not the woodblock version of a photograph in the second. They are two separate piles of pictures.

Training can therefore ask for two things only. The output should look as if it belongs in the print pile. And the place in the photograph should still be recognizable after the translation. There is no third image that says "this is the correct print of this exact scene."

## Translate both ways, so the scene has a way home

The model learns the translation in both directions at the same time.

One network turns photographs into prints. Another turns prints back into photographs. Take a photo, make a print, then turn that print back into a photo. You should get the photo you started with. Take a print, make a photo, then turn that photo back into a print. You should get the print you started with.

That round trip is the stand-in for a paired answer. If the bridge, the hill, or the boat disappeared on the way out, the way back would fail. Each direction is what keeps the other one honest about content.

Style is still a GAN problem, played once for each pile. A critic of prints tries to tell real prints from generated ones. A critic of photographs does the same for photos. The translators try to make those critics accept what they made.

## The four networks

After the naming swap described in the next section, the four networks are these.

The photo-to-print network is `G_A`. It has about 11.378 million parameters. The website uses this network and no other.

The print-to-photo network is `G_B`. It is the same size. It exists so the round trip can be checked, and so the model also learns the reverse translation while training.

The print critic is `D_A`. It has about 2.765 million parameters. It looks at real prints and at the prints `G_A` just made.

The photo critic is `D_B`. It is the same size. It looks at real photographs and at the photographs `G_B` just made.

## Why the letters in the notebook feel backwards

In the dataset, domain A is the prints and domain B is the photographs. The training option is called `BtoA`, which means "translate B into A": photographs into prints.

Before each loss is computed, the code swaps the two loaded batches. Inside that loss, the photograph is stored under the name `real_A`, and the print is stored under the name `real_B`. `G_A` reads `real_A` and writes a print. So the letter A on the dataset means "prints," while the letter A on `real_A` in the saved pictures means "the photo we are translating."

Read the saved test grid with that swap in mind:

- `real_A` is the photograph.
- `fake_B` is the print made by `G_A`.
- `rec_A` is that print sent back through `G_B`, the reconstructed photograph.
- `real_B` is a real print from the other folder.
- `fake_A` is the photograph made from that print by `G_B`.
- `rec_B` is that photograph sent back through `G_A`, the reconstructed print.

## What one training step does

Each step draws one photograph and one print, independently. They are not a pair. The batch size is 1, so a line in the log is the story of a single image, not an average over the epoch.

1. The photograph goes through `G_A`, which tries to make a print. That print goes through `G_B`, which tries to recover the photograph. The difference between the recovery and the original photograph is `cycle_A`.
2. The print goes through `G_B`, which tries to make a photograph. That photograph goes through `G_A`, which tries to recover the print. The difference from the original print is `cycle_B`.
3. `G_A` is also handed a real print and asked to give that print back unchanged. `G_B` is handed a real photograph and asked to give that photograph back unchanged. These are `idt_A` and `idt_B`. They stop a translator from recoloring an image that is already in the style it is supposed to produce.
4. `D_A` tries to accept real prints and reject generated prints. `D_B` does the same for photographs. The translators are trained to make the critics accept their fakes. For that step the critics are frozen, then the critics are trained while the translators are held still. That is the usual one-step GAN alternation.
5. The critic is not always shown the fake from this exact step. A replay buffer keeps 50 recent fakes. Sometimes an older one is substituted, so the critic does not forget mistakes the translator has already moved on from.

## How hard each pressure pulls

The critic uses least-squares loss. A real image is asked to score 1, a fake is asked to score 0, and the penalty is the squared distance from that target. When the critic is already very sure, this still gives the translator a usable push, which is why this setup uses it in place of the original log loss.

The round trip and the identity check use L1: the average absolute difference between pixel values. Pixel values inside the network run from -1 to 1.

The round-trip error is multiplied by 10 before it is added in. That 10 is the cycle weight. The identity error uses half of that weight, so it is multiplied by 5. The chart and the log already include those multipliers. A plotted cycle value near 1 means the underlying average absolute error is about 0.1 on that -1 to 1 scale.

A small round-trip error means the two translators preserved the picture well enough to come home. It does not, by itself, mean the print looks like a woodblock. Looking like a woodblock is the critics' job. The test pictures at the end of the notebook are where you judge that by eye.

## What the networks are made of

Both translators are a ResNet with nine residual blocks, the usual CycleGAN generator. The image is padded by mirroring its own edges, so the border is a reflection of the picture rather than a strip of black. A first convolution reads a wide neighborhood of each pixel. Two stride-2 layers shrink the map to a quarter of the width and height. Nine residual blocks then change that map while each block can also pass its input through, which is what lets a deep stack edit the picture without being forced to rebuild the layout from nothing. Two transposed convolutions restore the full size. The last layer is `tanh`, so every output sits between -1 and 1.

Both critics are 70×70 PatchGANs with three layers. They do not give one score for the whole frame. They score overlapping patches about 70 pixels across. The translator is therefore pushed on local texture: the line, the flat color, the grain.

Inside the translator, normalization is instance norm. Each image is centered and scaled using its own statistics, and there is no learned scale or shift on top of that. Dropout is off. Weights start from a normal distribution with standard deviation 0.02. Those are the CycleGAN defaults this run kept.

## The schedule that was actually run

The CycleGAN paper often trains for 200 epochs. This run uses 20.

One epoch is one pass over the larger folder, 6,287 images. The smaller folder is sampled so that every step still has one image from each side.

| Choice | What it means here |
| --- | --- |
| Dataset | `ukiyoe2photo`, two unpaired folders, downloaded in the notebook |
| Steps per epoch | 6,287 |
| Epochs | 10 at learning rate 0.0002, then 10 in which the learning rate falls in a straight line to 0 |
| Optimizer | Adam, β1 0.5, β2 0.999 |
| Batch | 1 image from each folder |
| Training crop | stretch to 286×286, random 256 crop, random left-right flip |
| Test size | stretch to 256×256, no flip |
| GAN loss | least squares, targets 1 and 0 |
| Replay buffer | 50 generated images |
| Cycle weight | 10, already included in the plotted cycle values |
| Identity weight | 0.5, so the plotted identity values include a factor of 5 |
| Log | one line every 100 steps |
| Checkpoint | one file, `latest.pt`, overwritten three times per epoch, carrying the full loss history |
| Machine in the saved run | Tesla T4 |

The saved notebook ends with the learning rate moving from 0.0000182 to 0, then `latest.pt` written at the end of epoch 20. That last epoch took 4,910 seconds. The learning rate is now zero, so opening the training notebook and running it again on this checkpoint does not continue training.

## What is left once training is over

Inference uses `G_A` only. `G_B` and both critics stay inside the checkpoint because that is how the training code saves the whole model, and the page does not load them. The browser copy of `G_A` is described in `docs/how-to-run.md`.
