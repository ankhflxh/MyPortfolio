import * as THREE from "three";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================
   1. Boot line typing effect
   ========================================================== */
(function bootLine() {
  const el = document.getElementById("boot");
  if (!el) return;
  const text = "$ ./hello_world --from portsmouth";
  if (reduceMotion) {
    el.textContent = text;
    return;
  }
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, i) + (i < text.length ? "█" : "");
    if (i++ < text.length) setTimeout(tick, 45 + Math.random() * 40);
  };
  setTimeout(tick, 350);
})();

/* ==========================================================
   2. Scroll reveal (added by JS so content still shows without JS)
   ========================================================== */
(function reveal() {
  const targets = document.querySelectorAll(
    ".section-title, .about-text, .stat, .job, .project, .stack-group, .terminal"
  );
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  targets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => io.observe(el));
})();

/* ==========================================================
   3. Pixel-art project icons (drawn from tiny pixel maps)
   ========================================================== */
const ICONS = {
  calendar: {
    palette: { C: "#ff4fb8", W: "#ece8ff", K: "#3a2d6e", P: "#39e5ff", R: "#7b6cd9" },
    map: [
      "..R......R..",
      ".RRR....RRR.",
      "CCCCCCCCCCCC",
      "CCCCCCCCCCCC",
      "CWWWWWWWWWWC",
      "CWKWKWKWKWWC",
      "CWWWWWWWWWWC",
      "CWKWPPWKWKWC",
      "CWWWPPWWWWWC",
      "CWKWKWKWKWWC",
      "CWWWWWWWWWWC",
      "CCCCCCCCCCCC",
    ],
  },
  stopwatch: {
    palette: { C: "#39e5ff", W: "#ece8ff", K: "#ff4fb8", P: "#7b6cd9" },
    map: [
      "....PPPP....",
      ".....CC.....",
      "...CCCCCC...",
      "..CWWWWWWC..",
      ".CWWWWKWWWC.",
      ".CWWWWKWWWC.",
      ".CWWWWKKKWC.",
      ".CWWWWWWWWC.",
      ".CWWWWWWWWC.",
      "..CWWWWWWC..",
      "...CCCCCC...",
      "............",
    ],
  },
  leaf: {
    palette: { G: "#39d98a", L: "#9dff5c", D: "#1f8a5a" },
    map: [
      ".........GG.",
      "......GGGGG.",
      "....GGGLLGG.",
      "...GGLLGGGD.",
      "..GGLGGGGGD.",
      "..GLGGGGGD..",
      ".GLGGGGGD...",
      ".GLGGGDD....",
      ".LDDDD......",
      "L...........",
      "............",
      "............",
    ],
  },
  switch: {
    palette: { C: "#7b6cd9", K: "#0d0a1a", G: "#9dff5c", A: "#ffc94d", P: "#ff4fb8" },
    map: [
      "............",
      "CCCCCCCCCCCC",
      "CKKKKKKKKKKC",
      "CKGKGKGKAKKC",
      "CKKKKKKKKKKC",
      "CCCCCCCCCCCC",
      "CKKKKKKKKKKC",
      "CKGKAKGKGKKC",
      "CKKKKKKKKKKC",
      "CCCCCCCCCCCC",
      ".P........P.",
      ".P........P.",
    ],
  },
};

document.querySelectorAll("[data-icon]").forEach((el) => {
  const icon = ICONS[el.dataset.icon];
  if (!icon) return;
  const size = 12;
  let rects = "";
  icon.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = icon.palette[ch];
      if (fill) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    });
  });
  el.innerHTML = `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
});

/* ==========================================================
   4. Hero: pixelated 3D voxel island (three.js)
   A floating island with a desk + monitor, a network switch
   rack, a cherry tree, and data packets travelling the cable.
   ========================================================== */
(function voxelHero() {
  const canvas = document.getElementById("voxel");
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  } catch (err) {
    canvas.remove(); // no WebGL: the CSS gradient hero still looks fine
    return;
  }
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);

  // ---- lighting: flat, punchy, pixel-art friendly
  scene.add(new THREE.HemisphereLight(0xcfc6ff, 0x2a1840, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(8, 14, 6);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff4fb8, 0.8);
  rim.position.set(-10, 4, -8);
  scene.add(rim);

  // ---- voxel builder: collect cubes per colour, then one InstancedMesh per colour
  const solid = new Map(); // color -> [[x,y,z], ...]
  const glow = new Map();
  const put = (map, x, y, z, color) => {
    if (!map.has(color)) map.set(color, []);
    map.get(color).push([x, y, z]);
  };
  const v = (x, y, z, c) => put(solid, x, y, z, c);
  const g = (x, y, z, c) => put(glow, x, y, z, c);

  // deterministic pseudo-random so the island looks the same every visit
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // island: top surface + tapered rock underneath
  const R = 6.6;
  for (let x = -7; x <= 7; x++) {
    for (let z = -7; z <= 7; z++) {
      const d = Math.hypot(x, z) + rand() * 0.9;
      if (d < R) {
        v(x, 0, z, rand() > 0.35 ? "#3b2f73" : "#46388a");
        for (let k = 1; k <= 5; k++) {
          if (d < R - k * 1.25) v(x, -k, z, k % 2 ? "#271d50" : "#1e163f");
        }
        // flowers / grass tufts
        const r = rand();
        if (d < R - 1 && r > 0.93) v(x, 1, z, r > 0.965 ? "#ff9ad8" : "#39e5ff");
      }
    }
  }

  // desk
  for (let x = -5; x <= 0; x++) for (let z = -3; z <= -1; z++) v(x, 3, z, "#6b4a8f");
  [[-5, -3], [0, -3], [-5, -1], [0, -1]].forEach(([x, z]) => {
    v(x, 1, z, "#4a3166");
    v(x, 2, z, "#4a3166");
  });
  // keyboard
  for (let x = -4; x <= -1; x++) v(x, 4, -1, "#cfc6ff");
  // monitor stand + frame
  v(-3, 4, -3, "#1a1430");
  v(-2, 4, -3, "#1a1430");
  for (let x = -5; x <= 0; x++) for (let y = 5; y <= 8; y++) {
    const inner = x >= -4 && x <= -1 && y >= 6 && y <= 7;
    if (!inner) v(x, y, -3, "#1a1430");
  }
  // screen "code lines" (glowing)
  const code = [["#ff4fb8", "#ff4fb8", "#2a2150", "#39e5ff"], ["#39e5ff", "#9dff5c", "#9dff5c", "#2a2150"]];
  code.forEach((row, i) => row.forEach((c, j) => g(-4 + j, 7 - i, -3, c)));

  // switch rack (three 1U switches)
  for (let y = 1; y <= 3; y++) for (let x = 2; x <= 4; x++) for (let z = -3; z <= -2; z++) v(x, y, z, "#2b2840");
  for (let x = 2; x <= 4; x++) for (let z = -3; z <= -2; z++) v(x, 4, z, "#3d3a5c");
  v(3, 5, -3, "#3d3a5c"); // little access point on top

  // cherry tree
  for (let y = 1; y <= 4; y++) v(4, y, 3, "#6b3e2e");
  for (let x = 1; x <= 7; x++) for (let y = 4; y <= 8; y++) for (let z = 0; z <= 6; z++) {
    const d = Math.hypot(x - 4, (y - 6) * 1.15, z - 3) + rand() * 0.8;
    if (d < 2.7) {
      const r = rand();
      v(x, y, z, r > 0.66 ? "#ff7ac8" : r > 0.33 ? "#ff4fb8" : "#ffb3e0");
    }
  }

  // small server-room "chair"
  v(-3, 1, 1, "#39e5ff");
  v(-3, 2, 1, "#2a6c80");
  v(-3, 2, 2, "#2a6c80");
  v(-3, 3, 2, "#2a6c80");

  const box = new THREE.BoxGeometry(1, 1, 1);
  const buildInstanced = (map, makeMat) => {
    map.forEach((cells, color) => {
      const mesh = new THREE.InstancedMesh(box, makeMat(color), cells.length);
      const m = new THREE.Matrix4();
      cells.forEach(([x, y, z], i) => {
        m.setPosition(x, y, z);
        mesh.setMatrixAt(i, m);
      });
      world.add(mesh);
    });
  };
  buildInstanced(solid, (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  buildInstanced(glow, (c) => new THREE.MeshBasicMaterial({ color: c }));

  // ---- blinking port LEDs on the switches
  const ledGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ledPositions = [];
  for (let y = 1; y <= 3; y++) for (let i = 0; i < 5; i++) ledPositions.push([1.75 + i * 0.6, y, -1.45]);
  const leds = new THREE.InstancedMesh(ledGeo, ledMat, ledPositions.length);
  const tmp = new THREE.Matrix4();
  ledPositions.forEach((p, i) => {
    tmp.setPosition(p[0], p[1], p[2]);
    leds.setMatrixAt(i, tmp);
    leds.setColorAt(i, new THREE.Color("#9dff5c"));
  });
  world.add(leds);
  const ledOn = [new THREE.Color("#9dff5c"), new THREE.Color("#ffc94d")];
  const ledOff = new THREE.Color("#1d3a14");

  // ---- network cable from rack to desk, with packets travelling along it
  const path = [
    new THREE.Vector3(3, 0.65, -1.2),
    new THREE.Vector3(3, 0.65, 1.6),
    new THREE.Vector3(-1.5, 0.65, 1.6),
    new THREE.Vector3(-1.5, 0.65, -0.6),
  ];
  const cableMat = new THREE.MeshLambertMaterial({ color: "#39e5ff", flatShading: true });
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const len = a.distanceTo(b);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), cableMat);
    seg.scale.set(a.x === b.x ? 1 : (len + 0.22) / 0.22, 1, a.z === b.z ? 1 : (len + 0.22) / 0.22);
    seg.position.copy(a).add(b).multiplyScalar(0.5);
    world.add(seg);
  }
  const segLens = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const l = path[i].distanceTo(path[i + 1]);
    segLens.push(l);
    total += l;
  }
  const pointAt = (t, out) => {
    let dist = (t % 1) * total;
    for (let i = 0; i < segLens.length; i++) {
      if (dist <= segLens[i]) return out.lerpVectors(path[i], path[i + 1], dist / segLens[i]);
      dist -= segLens[i];
    }
    return out.copy(path[path.length - 1]);
  };
  const packets = ["#ff4fb8", "#ffffff", "#9dff5c", "#ff4fb8"].map((c, i) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.MeshBasicMaterial({ color: c }));
    p.userData.offset = i / 4;
    world.add(p);
    return p;
  });

  // ---- floating cubes around the island
  const floaters = [
    [-8, 6, 4, "#39e5ff", 0.9],
    [7, 9, -5, "#ff4fb8", 0.7],
    [-6, 10, -6, "#9dff5c", 0.6],
    [9, 3, 5, "#7b6cd9", 1.1],
    [-9, 1, -2, "#ff9ad8", 0.5],
  ].map(([x, y, z, c, s], i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
    m.position.set(x, y, z);
    m.userData = { baseY: y, phase: i * 1.3 };
    world.add(m);
    return m;
  });

  // centre the island vertically a little
  world.position.y = -1.5;

  // ---- camera: orthographic isometric view
  const camera = new THREE.OrthographicCamera();
  camera.position.set(22, 18, 22);
  camera.lookAt(0, 0, 0);

  const FRUSTUM = 26;
  let pixel = 4;
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    pixel = w < 640 ? 3 : 4;
    renderer.setSize(Math.ceil(w / pixel), Math.ceil(h / pixel), false);

    const aspect = w / h;
    let halfH = FRUSTUM / 2;
    let halfW = halfH * aspect;
    if (aspect <= 1.1) {
      // portrait / narrow: fit the island to the width instead of the height
      halfW = 14;
      halfH = halfW / aspect;
    }
    // wide screens: push the island right so the text has room; narrow: push it up
    const shiftX = aspect > 1.1 ? halfW * 0.42 : 0;
    const shiftY = aspect > 1.1 ? 0 : halfH * 0.45;
    camera.left = -halfW - shiftX;
    camera.right = halfW - shiftX;
    camera.top = halfH - shiftY;
    camera.bottom = -halfH - shiftY;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- mouse parallax
  const target = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.18;
  });

  const tmpV = new THREE.Vector3();
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  let ledTimer = 0;

  function frame() {
    const dt = clock.getDelta();
    const t = clock.elapsedTime;

    world.rotation.y += (target.x + t * 0.12 - world.rotation.y) * 0.05;
    world.rotation.x += (target.y - world.rotation.x) * 0.05;

    packets.forEach((p) => pointAt(t * 0.18 + p.userData.offset, p.position));

    floaters.forEach((f) => {
      f.position.y = f.userData.baseY + Math.round(Math.sin(t * 1.4 + f.userData.phase) * 4) / 8; // stepped bob
      f.rotation.y = t * 0.6 + f.userData.phase;
    });

    ledTimer += dt;
    if (ledTimer > 0.12) {
      ledTimer = 0;
      for (let i = 0; i < ledPositions.length; i++) {
        const on = Math.random() > 0.3;
        leds.setColorAt(i, on ? ledOn[i % 7 === 0 ? 1 : 0] : ledOff);
      }
      leds.instanceColor.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    world.rotation.y = 0.35;
    renderer.render(scene, camera);
    window.addEventListener("resize", () => renderer.render(scene, camera));
    return;
  }

  renderer.setAnimationLoop(() => {
    if (visible) frame();
  });
})();