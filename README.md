# RUDHIRA — A world of life

An interactive microscopic world around blood donation, plasma, and human connection. Built with React, TypeScript, React Three Fiber, Drei, Three.js, and GSAP. Geometry, lighting, ribbons, and optional audio are generated locally.

**Life flows through us.** Connecting donors, plasma partners, and possibilities for life.

## Run locally

```sh
cd experience
npm install
npm run dev
```

## Build

Run `npm run build` inside `experience`. The production site is written to `website`. Serve the repository over HTTP and visit `/website/`. The root page redirects there. The checked-in production assets also work when the repository is served from a subdirectory.

- [Setup and architecture](experience/README.md)
- [Editable content, colours, links, and contact details](experience/src/config.ts)
- [Browser verification](experience/VERIFICATION.md)
- [Independent accessible HTML guide](website/accessible.html)

## Experience

Explore five destinations: Blood Donation, Plasma Donation, Plasma Fractionation, Stories of Life, and About Rudhira. Drag with inertia, select a destination to move the camera, and close it to return. Keyboard navigation, Escape, reduced motion, optional sound, a 2D list, and a WebGL-free fallback are included.

The network portal at `/network` provides separate donor, hospital and plasma fractionator accounts, verified contribution records and donor recognition. Neon Auth handles verified email/password sign-in, Neon Postgres stores network data, and Vercel runs the role-scoped API. Hospital and fractionator access requires organization approval. See [network architecture and setup](NETWORK.md) for configuration, rewards, administration and backend tests.

Verification emails use Brevo SMTP configured directly in Neon Auth. The SMTP key is stored in Neon and is never committed to this repository. Production delivery has been verified. Story cards remain fictional editorial samples; content requiring owner or clinical review is flagged in the configuration.

One connected world. Many ways to give life.

## Deploy on Vercel

Import this repository into Vercel with the repository root selected. `vercel.json` installs the locked dependencies at the root and in `experience`, builds the source, and publishes `website` at the deployment root together with `/api/network`. Node.js 24 is specified in the root package. Configure database and authentication variables using [.env.example](.env.example) and [NETWORK.md](NETWORK.md); keep real credentials in the service configuration. The production site is [rudhira-2-experience.vercel.app](https://rudhira-2-experience.vercel.app/).
