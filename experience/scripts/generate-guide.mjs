import { writeFileSync } from "node:fs";
import { config } from "../src/config.ts";
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const sections = config.destinations
  .map(
    (d) =>
      `<section id="${d.id}"><p class="label">${escape(d.number)} / ${escape(d.eyebrow)}</p><h2>${escape(d.label)}</h2><p class="lead">${escape(d.intro)}</p>${d.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("")}${d.id === "stories" ? config.stories.map((s) => `<article><small>FICTIONAL EDITORIAL SAMPLE</small><h3>${escape(s.title)}</h3><p>${escape(s.body)}</p></article>`).join("") : ""}<p class="review">Draft content for review: ${escape(d.review)}</p><a href="${escape(config.actions[d.action.route].url || `./#${d.action.route}`)}">${escape(d.action.label)} ↗</a><p><small>${escape(config.actions[d.action.route].review)}</small></p></section>`,
  )
  .join("");
writeFileSync(
  new URL("../public/accessible.html", import.meta.url),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6efdf"><title>RUDHIRA — Accessible guide</title><style>*{box-sizing:border-box}body{margin:0;background:#f6efdf;color:#401322;font:16px/1.8 Arial,sans-serif}header,main,footer{max-width:950px;margin:auto;padding:35px 6%}header{border-bottom:1px solid #d7c7b6}nav{display:flex;flex-wrap:wrap;gap:18px;margin-top:20px}a{color:#8b3050}h1,h2,h3{font-family:Georgia,serif;font-weight:400;line-height:1.15}h1{font-size:clamp(42px,7vw,76px);letter-spacing:-.05em}h2{font-size:38px}h3{font-size:26px}section{border-top:1px solid #d7c7b6;padding:45px 0}.label,small{font-size:11px;color:#926f50}.label{letter-spacing:.12em;text-transform:uppercase}.lead{font-size:19px}.review{border-left:2px solid #b99a67;padding-left:16px;font-size:13px}article{padding:20px;border:1px solid #d7c7b6;margin:15px 0}a:focus-visible{outline:3px solid #8b3050;outline-offset:5px}footer{font-size:12px;color:#805f62}</style></head><body><header><a href="./#world">RUDHIRA / RETURN TO THE WORLD ↗</a><nav aria-label="Destinations">${config.destinations.map((d) => `<a href="#${d.id}">${escape(d.label)}</a>`).join("")}</nav></header><main><p class="label">A world of life / accessible edition</p><h1>Life flows through us.</h1><p class="lead">${escape(config.supporting)}</p><p>The world is an artistic educational interpretation. The content below is available without WebGL or JavaScript. Donation and contact actions lead to editable demo pages unless a verified link has been configured.</p>${sections}<section id="contact"><h2>Contact Rudhira</h2><p>${escape(config.contact.email || config.contact.label)}</p><p class="review">${escape(config.contact.review)}</p></section></main><footer>${escape(config.closing)}</footer></body></html>`,
);
