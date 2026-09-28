# Subam Shrestha — Portfolio
Static site (GitHub Pages ready). Three.js loads from jsDelivr; the sword is `assets/shusui.glb`.

**Run locally:** the GLB won't load from `file://`. Use `python3 -m http.server` and open http://localhost:8000.
**Deploy:** push to a repo, Settings → Pages → deploy from `main` / root.

## Edit
- Email / LinkedIn: replace `you@example.com` and `YOUR-HANDLE` in `index.html` (Contact).
- Add a Journey milestone: copy an `<li class="rv">` in `#journey`.
- Sword tip pointing down? Set `FLIP = true` in `js/three-scene.js`.
- Project screenshots: none yet. Add images to `assets/images/` and extend `.proj` when you have real ones.
- GLB is ~8 MB; compress textures (e.g. `gltf-transform optimize --texture-compress webp`) for faster loads.
