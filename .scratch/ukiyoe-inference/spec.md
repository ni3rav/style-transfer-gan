# Ukiyo-e inference

Status: ready-for-agent

## Problem

The finished photo-to-Ukiyo-e generator is the Colab checkpoint saved as `src/server/ukiyoe_cyclegan.pt`. This machine has no GPU. The notebooks train and show eight test photos. There is no way to translate one chosen photo from a local page.

## Outcome

A local FastAPI server loads `netG_A` from that checkpoint and translates one 256×256 photo. A React page, built with Vite, TypeScript, Tailwind, and shadcn, stretches the chosen photo to 256×256, shows that image beside the Ukiyo-e result, and downloads the result. FastAPI serves the built page. While the page is being designed, the Vite dev server proxies the API.

## Decisions

- Code lives in `src/server` and `src/client`. The notebooks stay as they are. The root project keeps this uv environment. Add FastAPI, Uvicorn, Python-Multipart, Pillow, and the CPU build of PyTorch to it. Remove the console script that points at the removed `style_transfer_gan` package, and set the project so uv installs dependencies without expecting that package.
- The checkpoint path is `src/server/ukiyoe_cyclegan.pt`, next to the server code. It is the finished `latest.pt` and stays gitignored. Startup loads it on CPU and builds the same 9-block ResNet generator the notebook uses for `netG_A`: 3 input channels, 3 output channels, 64 filters, instance norm, no dropout. Only `nets["G_A"]` is copied in. The discriminators, `netG_B`, and the optimizer stay unused. A missing file or a missing `G_A` weight fails startup with a clear error.
- The browser does the resize. It stretches the chosen photo onto a 256×256 canvas and uploads that canvas as a PNG. The page shows that 256×256 image on the left and the Ukiyo-e PNG on the right, with a control to download the result. Canvas scaling does not have to match the notebook's bicubic resize.
- The server does not resize. `POST /api/translate` takes one image file. The image must be 256×256. The server converts it to RGB, normalizes it the way the notebook does (mean 0.5, standard deviation 0.5), runs `netG_A` in eval mode, and returns a PNG. Any other width or height is a 400. One translation runs at a time. A second request waits. About 30 seconds on CPU is acceptable.
- Development is two processes. Uvicorn serves the API on port 8000. Vite proxies `/api` to that port. A missing client build does not stop the API.
- One process is the built page. `src/client` builds into its `dist` directory, and FastAPI serves that directory at `/`. API routes stay available.
- `AGENTS.md` gains one sentence: this inference server may load `netG_A` on this machine. Training stays off this machine.
- Tests cover the size check and the RGB conversion without reading the checkpoint. The real forward pass is checked by opening the page with the checkpoint present.

## Run

From the repo root, `./start` installs the Python and npm dependencies, builds the client, and serves the page at http://127.0.0.1:8000.

## Out of scope

- Training, or loading `netD_A`, `netD_B`, or `netG_B` for a translation.
- A Ukiyo-e-to-photo control, a batch upload, accounts, or a history of results.
- A GPU wheel or a deploy beyond this machine.
- Changing the training notebooks.
- Pixel-identical preprocessing with the notebook's bicubic resize.
