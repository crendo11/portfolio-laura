---
name: focus-return-dependency
description: Task 7 modal focus-return only works because Task 8 made the about trigger a real button; mouse-focus edge case remains
metadata:
  type: project
---

InfoModal restores focus on close by capturing `document.activeElement` at mount (`previousFocusRef`) and refocusing it on unmount inside `requestAnimationFrame`. This only works if the opener is focusable.

**Why:** Task 7 AC2 (focus returns to the "about" trigger) was blocked while the trigger was a `<span onClick>` — a span is not focusable, so `activeElement` at mount was `<body>`. Task 8 converting it to a real `<button>` is the piece that makes AC2 pass for keyboard users. The two tasks are coupled.

**How to apply:** When reviewing/altering either Header's about control or InfoModal's focus logic, treat them as linked. Residual edge: mouse-click on a button does not focus it in some browsers (historically Safari/Firefox), so `activeElement` may be `<body>` and focus returns there — affects mouse users only, not keyboard. See [[lightbox-gestures]] for the parallel return-focus-to-opener pattern in the gallery lightbox.
