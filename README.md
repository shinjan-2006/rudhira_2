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

The donation and enquiry pages are labeled demos and send no data. Story cards are fictional editorial samples. Content requiring owner or clinical review is flagged in the configuration. Connect approved service links and contact details before launch. No eligibility rules, partnerships, certifications, outcomes, or impact statistics are claimed.

One connected world. Many ways to give life.
