# UX Planner Memory Index

- [Project UX Baseline](project_ux_baseline.md) — visual-preservation constraints + non-obvious UX/perf/a11y gaps from the roadmap audit; roadmap at portfolio/docs/roadmap.md
- [Focus-return dependency](project_focus_return_dependency.md) — Task 7 modal focus-return only works because Task 8 made the about trigger a real button
- [Header scale tap target](project_header_scale_taptarget.md) — about button is 44px at rest but scale-75 on scroll shrinks effective hit area to ~33px
- [Reduced-motion pattern](project_reduced_motion_pattern.md) — codebase honors prefers-reduced-motion via CSS motion-reduce: Tailwind variants, not JS matchMedia
- [Sanity useCdn false](project_sanity_usecdn.md) — useCdn intentionally false to avoid homepage "fetch failed"; don't flip back without re-testing
