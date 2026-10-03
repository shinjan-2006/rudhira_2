# Browser verification

Local production build checked on 4 October 2026.

- TypeScript compilation and Vite production build passed.
- Procedural WebGL scene rendered; actual progress reached 100%; audio initially off.
- Sound could be enabled and disabled; pause/resume controls reflected their state.
- Canvas dragging moved the world without triggering a destination click.
- All five destinations opened and closed; rapid repeated transitions showed one dialog at a time.
- Opening focused the close button; Shift+Tab stayed inside the dialog; Escape closed it.
- Back/Forward restored the correct destination and action page.
- Donation search, plasma guidance, and partner enquiry routes worked. Demo submission showed explicit no-send/no-save feedback.
- All three sample stories were visibly labeled illustrative samples.
- Mobile layouts at 390×844 and 320×700 had no horizontal overflow. Mobile dragging, destination selection, and scrolling content panels worked.
- The WebGL-free `?view=2d` edition contained five destinations and opened sample story content without a canvas.
- The independent HTML guide contained all five destinations plus contact information, and used no JavaScript.
- No application console errors were seen during these checks.

Checks use the local production output. Live donation providers, bookings, contact delivery, and factual content approval are intentionally outside this demo. Browser controls tested dragging at mobile viewport sizes; device hardware and assistive-technology testing remain appropriate before publication.

Layout regression check: hero, interaction hint, and footer stayed separate at 1536x824, 1920x1030, 1280x720, and 1280x500. Both desktop Explore donation buttons opened the opportunities page; the mobile button worked at 390x844 with no horizontal overflow.
