# RUDHIRA — A world of life

An original interactive experience built with React 19, TypeScript, React Three Fiber 9, Drei, Three.js, and GSAP. All forms, geometries, ribbons, lighting, and particles are generated locally. No API keys, model downloads, paid assets, tracking, or runtime AI services are used.

## Run and build

```sh
npm install
npm run dev
npm run build
```

Development preview: `http://127.0.0.1:5173`. The build writes to `../website`, keeping the repository's existing `/website/` deployment path. Relative asset URLs work with subdirectory hosting. Serve the repository with an HTTP server and open `/website/` for the production preview. Opening HTML directly from disk will not load ES modules.

The generated `website/accessible.html` contains the full essential content without JavaScript or WebGL. Rebuild after editing copy to regenerate it. `?view=2d` opens the accessible React edition directly and bypasses WebGL. Actual WebGL detection and a scene error boundary provide the same fallback when rendering is unavailable.

## Editing the experience

- `src/config.ts`: brand copy, palette, five destinations, sample stories, review flags, action links, contact email.
- `src/geometry.ts`: procedural biconcave cells, textured white cells, life sculpture, gold ribbons, branching connections, and particle positions.
- `src/World.tsx`: render quality, positions, drag controls, hover states, camera transitions, HTML labels.
- `src/App.tsx`: navigation, content panels, accessible list, action pages, demo forms, sound, focus management.
- `src/styles.css`: editorial typography, responsive compositions, ivory panels, visible focus, motion preferences.
- `scripts/generate-guide.mjs`: generates the independent plain HTML guide from the same configuration.

Empty action URLs route to local editable destination pages: `#opportunities`, `#plasma-guide`, and `#connect`. Set `config.actions.<id>.url` to an approved URL to route directly to a real service. The demo forms send and save nothing. There is no database or booking service. Add a verified endpoint, privacy policy, and consent flow before collecting personal information.

## Interaction and accessibility

Drag the canvas to explore with damping. A click is accepted only below a five-pixel drag threshold. HTML labels and main navigation offer keyboard access. Opening a destination locks exploration and animates the camera. New selections cancel the prior tween. Closing restores the original camera position, including after rapid repeated selections. Back/Forward and direct destination hashes are supported.

Dialogs focus the close button, trap Tab/Shift+Tab, support Escape, and make background controls inert. A skip link switches to the accessible list. Reduced motion removes ambient movement and transition animation. A separate pause control stops ambient movement and dragging. Mobile uses fewer cells and particles, lower pixel density, and a scrolling bottom content sheet. Audio is generated with Web Audio and remains off until explicitly enabled. Audio fades out when the document is hidden.

Loading progress reflects seven completed geometry preparation stages, followed by actual rendered frames; no fake timed progress is used. The previous video design is preserved in the original local workspace at `C:/Users/User/Desktop/rudhira/website/classic/`; it is not part of this new repository.

## Before publishing

Review all `review` fields in `src/config.ts`. Approve mission and audience copy; have educational text reviewed by a qualified clinical reviewer; connect verified donation and contact links; add approved contact details. The three story cards are fictional samples and must remain labeled until replaced with verified, consented stories. No partnerships, eligibility rules, certifications, patient outcomes, or impact statistics are claimed.
