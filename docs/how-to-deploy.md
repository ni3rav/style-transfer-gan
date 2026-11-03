# How to deploy

The same page you can run locally is already hosted at https://ukiyoe-gan-ni3ravs-projects.vercel.app. Someone who opens that address downloads the photo-to-print network and runs it in their own browser. The server is only serving files. It does not translate the photograph.

The Vercel project is `ukiyoe-gan`, on the team `ni3ravs-projects`. Production follows the `master` branch of https://github.com/ni3rav/style-transfer-gan. A push to that branch builds the page and publishes it.

## What actually gets published

Vercel does not build the Python training code. The project root is `src/client`, so the build sees only the website.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | 24.x |
| Production branch | `master` |

The build copies `src/client/public/g_a.onnx` into `dist`. That file is `G_A` only, the photo-to-print network, about 45 MB. The published site is about 58 MB once the page and the browser runtime are included. The training checkpoint, `src/server/ukiyoe_cyclegan.pt`, is left out. It is listed in `.gitignore`, and the page never asks for it.

The dashboard for this project is https://vercel.com/ni3ravs-projects/ukiyoe-gan.

## Use the hosted page

Open the address above and choose one photo. The browser stretches it to 256×256, runs `G_A`, and shows that square picture beside the print. The first translation downloads the model, so it waits on the download as well as on the translation. Later translations in the same visit reuse the model.

## Replace the network on the site

When a new checkpoint should become the public translator, export `G_A` again from the repository root:

```sh
PYTHONPATH=src uv run python src/server/export_onnx.py
```

That overwrites `src/client/public/g_a.onnx`. Commit that file and push `master`. Vercel rebuilds `src/client`, and the new file replaces the one visitors download.
