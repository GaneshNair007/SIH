# UI audit — Material 3 redesign proposal

Status: proposal only. No global visual redesign has been applied yet.

## Route inventory

Public routes:

- `/` — project overview, research context, roles, and team
- `/working` — flowchart, images, chemistry, and comparison tabs
- `/login` — production sign-in plus three clearly separated demo roles
- `/pipeline` — redirect to `/working`
- `/readme` — legacy project explainer
- `/worker` — legacy redirect to `/login`

Shift Manager routes:

- `/manager`, `/manager/scan`, `/manager/workers`, `/manager/workers/new`
- `/manager/workers/[workerId]`, `/manager/bands`, `/manager/shifts`
- `/manager/shifts/[shiftId]`, `/manager/reading/[readingId]`

Control Room routes:

- `/control-room`, `/control-room/workers`, `/control-room/workers/[workerId]`
- `/control-room/regions`, `/control-room/regions/[regionId]`
- `/control-room/bands`, `/control-room/bands/[bandId]`
- `/control-room/shifts`, `/control-room/analytics`, `/control-room/alerts`, `/control-room/reports`

Admin routes:

- `/admin`, `/admin/users`, `/admin/company`, `/admin/locations`
- `/admin/calibration`, `/admin/thresholds`, `/admin/audit`

## What already works well

- Pages remain readable and overflow-free at phone, tablet, and desktop widths.
- The application has clear H1 headings, visible form labels, keyboard focus rings, reduced-motion support, and mostly semantic controls.
- Safety and demo states use explicit text rather than relying on colour alone.
- The public pages are restrained: no parallax, glass-heavy panels, or gratuitous motion.
- Manager and Control Room workflows preserve a clear split between scan-first operations and review/analysis.

Reference captures: `screenshots/home.png`, `screenshots/working.png`, `screenshots/login.png`, `screenshots/manager.png`, and `screenshots/control-room.png`.

## Findings

### High priority

1. **Two visual identities compete.** Public headings and several app labels use an editorial serif, while forms, tables, and dashboards use sans serif. `/readme` introduces a third red/black/monospace identity. The result feels assembled from separate templates rather than one product.

2. **The legacy `/readme` page is the strongest “AI-generated” tell.** It uses hard-coded red, black, slate, uppercase numbering, monospace labels, and a stale Worker View link. It should be restyled into the same documentation surface or redirected after its useful content is merged.

3. **The dashboards are over-carded.** Every metric, quick action, chart, table, and notice is boxed. Equal visual weight makes the primary task harder to identify. Material 3 would use a tonal page surface, fewer elevated containers, and clearer section grouping.

4. **Typography is more decorative than product-like.** `Source Serif 4`, Inter, Space Grotesk, and a local Geist font are all present. External font imports duplicate the local font setup and add avoidable loading risk. One local/system sans stack should serve the whole product.

5. **Icon style is inconsistent.** Navigation uses outlined icons, login demo choices use emoji, and the brand mark is a hand-built circular badge. Replace emoji with one outlined icon family and retain a simplified, distinct H₂S product mark.

### Medium priority

6. **The teal system is coherent but not aligned with the requested Google-like direction.** Move primary interactions to a calm Material blue while keeping safety colours reserved for safety meaning. Teal should not compete with green safe states.

7. **Badges and uppercase micro-labels are overused.** “Research Prototype,” role labels, demo labels, section eyebrows, chart timestamps, and statuses frequently appear as pills. Keep pills for discrete states; use plain supporting text for context.

8. **Some effects feel template-driven.** The blurred fixed navigation, hover elevation, pulsing critical dot, floating circular assistant button, and repeated transition-all utilities can be quieter. Retain motion only where it confirms interaction or state.

9. **Several sections lack one dominant action.** The home hero presents three similar destinations, manager quick actions are equally weighted, and the login page gives the production form and demo roles similar visual mass. Each section needs one clear primary action and quieter alternatives.

10. **Dense navigation needs hierarchy.** The Control Room sidebar is appropriate on desktop, but its logo, two role badges, eight navigation entries, user block, and sign-out action compete. Use a simpler app bar, one selected-state treatment, and a low-emphasis account area.

### Accessibility and responsive follow-ups

- Add explicit accessible names to every icon-only menu/close control and verify all target sizes are at least 44×44 px.
- Preserve the existing visible focus treatment but standardize it to one blue focus ring.
- Confirm chart meaning is available in adjacent tables or summaries; never depend on colour alone.
- Keep the pipeline tab row horizontally scrollable on narrow screens and expose its selected state semantically.
- Check the final blue, red, amber, and green combinations against WCAG AA before implementation.
- Preserve `prefers-reduced-motion` behavior and remove nonessential pulsing.

## Recommended redesign order

1. Foundations and shared components
2. Public navigation, homepage, and footer
3. Working/pipeline page
4. Login and authentication states
5. Manager shell and scan workflow
6. Control Room shell, charts, tables, alerts, and reports
7. Admin and legacy `/readme` cleanup

This order changes presentation only; role logic, data behavior, and content remain intact.
