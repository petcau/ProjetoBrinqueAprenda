"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    R = Raizes,
    A = VivaArt;
  const phases = [
    {
      id: 1,
      name: "Floresta em Chamas",
      npc: "Carlos",
      job: "Guarda florestal",
      region: [77, 24],
      icon: "fire",
      map: "floresta",
      color: "vermelho",
      items: "Mangueira e kit de cuidado",
      situation:
        "O fogo se espalhou. Carlos precisa de ajuda para proteger a floresta e os animais.",
      goals: [
        "Apague os oito focos de incêndio.",
        "Cuide dos três animais e libere as trilhas.",
        "Volte a Carlos para celebrar.",
      ],
      row: 0,
    },
    {
      id: 2,
      name: "Rio Poluído",
      npc: "Antônio",
      job: "Cuidador do rio",
      region: [82, 49],
      icon: "water",
      map: "rio",
      color: "azul",
      items: "Traje de proteção, rede e bolsa",
      situation:
        "Resíduos poluem a água. Antônio vai orientar Kai a cuidar do rio e de seus moradores.",
      goals: [
        "Vista a proteção e recolha os resíduos.",
        "Ajude os peixes e a tartaruga.",
        "Devolva a vida ao rio.",
      ],
      row: 1,
    },
    {
      id: 3,
      name: "Resgate da Fauna",
      npc: "Marina",
      job: "Cuidadora dos animais",
      region: [76, 78],
      icon: "paw",
      map: "fauna",
      color: "amarelo",
      items: "Kit de resgate e chave dos abrigos",
      situation:
        "Alguns amigos precisam de cuidado. Marina ensina a respeitar cada espécie e seu habitat.",
      goals: [
        "Encontre a chave dos abrigos.",
        "Liberte e cuide dos nove animais.",
        "Acompanhe os amigos aos lugares seguros.",
      ],
      row: 2,
    },
    {
      id: 4,
      name: "Reflorestamento",
      npc: "Rafael",
      job: "Guardião das sementes",
      region: [27, 75],
      icon: "leaf",
      map: "plantio",
      color: "verde",
      items: "Mudas nativas e regador",
      situation:
        "A terra perdeu suas árvores. Rafael trouxe mudas nativas para fazer a vida voltar.",
      goals: [
        "Plante as seis mudas.",
        "Regue com o mesmo botão de cuidado.",
        "Veja a natureza crescer.",
      ],
      row: 3,
    },
    {
      id: 5,
      name: "Cidade Sustentável",
      npc: "Luciana",
      job: "Organizadora da comunidade",
      region: [25, 25],
      icon: "sun",
      map: "cidade",
      color: "violeta",
      items: "Bolsa de coleta e materiais da comunidade",
      situation:
        "A comunidade quer uma cidade mais saudável. Luciana convida Kai a cuidar dos espaços de todos.",
      goals: [
        "Separe os resíduos nas lixeiras.",
        "Ajuste os painéis e cuide dos jardins.",
        "Reúna o último cristal do colar.",
      ],
      row: 4,
    },
  ];
  const biomes = [
    [
      "Amazônia",
      "Árvores, rios e chuvas formam uma grande rede de vida. Floresta protegida também significa água cuidada.",
      "Por lá: tucanos, peixes e muitas outras espécies.",
    ],
    [
      "Mata Atlântica",
      "Essa floresta guarda muitas espécies que só vivem no Brasil. Preservar os pequenos trechos e conectá-los protege seus moradores.",
      "Por lá: mico-leão-dourado e preguiças.",
    ],
    [
      "Cerrado",
      "Árvores de raízes profundas ajudam a guardar água no solo. Suas nascentes alimentam grandes rios do Brasil.",
      "Por lá: lobo-guará, tamanduá e muitas aves.",
    ],
    [
      "Caatinga",
      "A vida se adapta ao tempo seco. Plantas e animais sabem aproveitar a água e precisam de seu ambiente preservado.",
      "Por lá: tatu-bola e ararinha-azul.",
    ],
    [
      "Pantanal",
      "As águas mudam a paisagem ao longo do ano. Proteger os rios ajuda os campos alagados e seus animais.",
      "Por lá: tuiuiú, onça-pintada e capivaras.",
    ],
    [
      "Pampa",
      "Campos e pequenas plantas também são natureza. Muitas espécies dependem desse espaço aberto para viver.",
      "Por lá: veado-campeiro e aves dos campos.",
    ],
  ];
  const advice = [
    "Encontrou lixo no caminho? Avise um adulto. Use proteção para recolher resíduos seguros e separe no lugar certo.",
    "Leve uma garrafinha reutilizável. Menos descartáveis significam menos resíduos perto dos rios.",
    "Cuide de uma planta com um adulto. Observe o solo e regue na medida certa.",
    "Animal silvestre não é bichinho de gaiola. Respeite sua distância e proteja o lugar onde ele vive.",
    "Fogo na natureza é perigoso. Afaste-se e peça ajuda a um adulto; não tente apagar sozinho.",
    "Feche a torneira enquanto escova os dentes. Cada pequena economia ajuda a cuidar da água.",
  ];
  let view = "inicio",
    selected = 1,
    activeAbout = "historia",
    adviceIndex = 0,
    last = 0,
    raf = 0,
    time = 0,
    ready = false,
    restoreTimer = 0,
    captionTimer = 0;
  const reduced = () =>
    R.prefs().reduceMotion ||
    matchMedia("(prefers-reduced-motion:reduce)").matches;
  const progress = () => GuardiaoProgresso.read();
  const file = (path) =>
    new URL(window.GuardiaoArquivosLeves?.[path] || path, R.root).href;
  const unlocked = (id) => id === 1 || progress().completed.includes(id - 1);
  function setIcon(id, name) {
    $(id).innerHTML = R.icon(name) + $(id).innerHTML;
  }
  function mapDraw(restoring = 0) {
    const p = progress();
    MapaFerido.prepare();
    document.body.dataset.mapRestored = String(p.completed.length === 5);
    $("map-hotspots").innerHTML = phases
      .map(
        (d) =>
          `<button type="button" class="map-hotspot ${p.completed.includes(d.id) ? "is-complete" : ""}" data-phase="${d.id}" data-region-state="${MapaFerido.regionState(d.id, p)}" style="--x:${d.region[0]}%;--y:${d.region[1]}%" aria-label="${d.name}. ${unlocked(d.id) ? (p.completed.includes(d.id) ? "Natureza recuperada" : "Disponível") : "Complete a região anterior"}" aria-disabled="${!unlocked(d.id)}"><span class="number">${d.id}</span>${R.icon(d.icon)}<span class="map-region-name">${MapaFerido.label(d.id)}</span><small>${p.completed.includes(d.id) ? "Natureza recuperada" : unlocked(d.id) ? "Vamos cuidar?" : "Complete a região anterior"}</small></button>`,
      )
      .join("");
    BosqueMapa.update(
      p.completed,
      restoring,
      R.won() &&
        localStorage.getItem("guardiao.viva.final.v1") === "visto" &&
        !window.VivaFinal?.active,
    );
    $("island-restoration").innerHTML = "";
    const current = phases.find((d) => d.id === p.current) || phases[0];
    $("map-current").innerHTML = R.icon(current.icon) + current.name;
    $("map-fragments").textContent = p.completed.length + " / 5 cristais";
    $("tree-state").textContent =
      p.completed.length === 0
        ? "Árvore Guardiã enfraquecida"
        : p.completed.length === 5
          ? "A ilha pode florescer de novo"
          : `A árvore recupera forças · ${p.completed.length}/5`;
    $("tree-restoration").innerHTML = "";
    $("map-reset").hidden = !p.completed.length;
    $("replay-ending").hidden = !R.won();
  }
  function maybeRestore() {
    const p = progress(),
      query = new URLSearchParams(location.search);
    const id = Number(query.get("restaurar") || p.pendingRestoration);
    if (id && p.completed.includes(id)) {
      mapDraw(id);
      clearTimeout(restoreTimer);
      Promise.resolve(BosqueMapa.ready())
        .catch(() => {})
        .then(() => {
          if (view !== "mapa" || !progress().completed.includes(id)) return;
          clearTimeout(restoreTimer);
          restoreTimer = setTimeout(
            () => {
              if (view !== "mapa" || !progress().completed.includes(id)) return;
              const s = progress();
              delete s.pendingRestoration;
              try {
                localStorage.setItem(
                  "guardiao.mapa.progresso.v1",
                  JSON.stringify(s),
                );
              } catch {}
              history.replaceState(null, "", location.pathname + "#mapa");
              if (R.won()) window.VivaFinal?.start();
              else mapDraw();
            },
            reduced() ? 300 : (BosqueMapa.duration || 2.1) * 1000 + 200,
          );
        });
    } else if (
      R.won() &&
      localStorage.getItem("guardiao.viva.final.v1") !== "visto"
    ) {
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (view === "mapa" && R.won()) window.VivaFinal?.start();
      }, 900);
    }
  }
  function brief(id) {
    selected = id;
    const d = phases[id - 1];
    $("phase-number").textContent = "FASE " + id;
    $("phase-title").textContent = d.name;
    $("phase-npc").textContent = d.npc;
    $("phase-job").textContent = d.job;
    $("phase-situation").textContent = d.situation;
    $("phase-goals").innerHTML = d.goals
      .map((g) => "<li>" + R.icon("leaf") + "<span>" + g + "</span></li>")
      .join("");
    $("phase-items").textContent = d.items;
    $("phase-reward").innerHTML = GuardiaoRelicario.fragment(id - 1, true);
    $("phase-reward-copy").textContent = "Cristal " + d.color + " do colar";
    $("start-phase").href = new URL(
      id === 1
        ? "jogo/floresta-viva/index.html"
        : "jogo/jornada/index.html?fase=" + id,
      R.root,
    ).href;
    $("start-phase").textContent = unlocked(id)
      ? "Iniciar fase"
      : "Conclua a região anterior";
    $("start-phase").setAttribute("aria-disabled", String(!unlocked(id)));
    A.load(["npcs", "encontros"]);
    document.querySelector(".phase-scene").style.backgroundImage = "none";
    $("phase-dialog").showModal();
    document.body.dataset.phasePreview = String(id);
  }
  function show() {
    const next = location.hash.slice(1).split("?")[0] || "inicio";
    view = ["inicio", "mapa", "sobre", "configuracoes", "final"].includes(next)
      ? next
      : "inicio";
    if (view === "final" && !R.won()) {
      location.replace("#mapa");
      return;
    }
    const playEnding = view === "final";
    if (playEnding) {
      view = "mapa";
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#mapa",
      );
    }
    document.querySelectorAll("#app > [data-view]").forEach((el) => {
      el.hidden = el.dataset.view !== view;
      el.classList.toggle("entering", !el.hidden && !reduced());
    });
    document.body.dataset.view = view;
    $("back-home").hidden = view === "inicio";
    $("back-home").innerHTML = R.icon("back") + "Início";
    if ($("phase-dialog").open) $("phase-dialog").close();
    clearTimeout(restoreTimer);
    if (view === "mapa") {
      A.load(["acoes", "flora", "kai"]);
      mapDraw();
      maybeRestore();
      const line = $("flora-map-line");
      line.textContent = "Cada cuidado fortalece a Árvore Guardiã.";
      line.hidden = false;
      clearTimeout(captionTimer);
      captionTimer = setTimeout(() => (line.hidden = true), 4500);
    }
    if (view === "configuracoes") A.load(["flora", "encontros"]);
    if (view === "sobre")
      A.load([
        "kai",
        "acoes",
        "flora",
        "encontros",
        ...(activeAbout === "equipe" ? ["professor"] : []),
      ]);
    if (playEnding) window.VivaFinal?.start();
    else if (view !== "mapa") window.VivaFinal?.stop();
    document.title =
      (view === "inicio"
        ? "Guardião da Natureza"
        : {
            mapa: "Mapa das fases",
            sobre: "Sobre o jogo",
            configuracoes: "Configurações",
            final: "A Árvore Guardiã",
          }[view]) + " · Jornada de Kai";
  }
  function biome(i) {
    const d = biomes[i];
    $("biome-title").textContent = d[0];
    $("biome-copy").textContent = d[1];
    $("biome-friend").textContent = d[2];
    document
      .querySelectorAll("[data-biome]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(Number(b.dataset.biome) === i)),
      );
  }
  const demo = {
    x: 0.53,
    y: 0.81,
    direction: 6,
    movingUntil: 0,
    actionUntil: 0,
  };
  function demoMove(dx, dy) {
    demo.x = Math.max(0.2, Math.min(0.8, demo.x + dx * 0.06));
    demo.y = Math.max(0.65, Math.min(0.9, demo.y + dy * 0.03));
    demo.direction = (Math.round(-Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
    demo.movingUntil = time + 0.8;
    A.load(["kai"]);
  }
  function render(now) {
    raf = requestAnimationFrame(render);
    if (
      now - last < 15 ||
      document.hidden ||
      window.GuardiaoOrientacao?.blocked
    )
      return;
    last = now;
    time = now / 1000;
    if (!ready) return;
    if (view === "mapa") {
      BosqueMapa.paint(time, reduced());
      A.canvas($("map-flora"), (c, w, h) => {
        A.owl(
          c,
          w * 0.48,
          h * 0.91,
          h * 0.7,
          time,
          time % 9 > 7.8 ? "fala" : "ombro",
          true,
        );
      });
      A.canvas($("map-kai"), (c, w, h) => {
        if (window.VivaFinal?.active) {
          VivaFinal.paint(c, w, h, time);
          return;
        }
        const completed = progress().completed;
        if (!reduced()) {
          c.save();
          c.lineWidth = 0.8;
          c.strokeStyle = "#b0e4e376";
          for (let i = 0; i < 9; i++) {
            const x = w * (0.05 + ((i * 137) % 89) / 100),
              y = h * (0.87 + (i % 3) * 0.025),
              r = 4 + ((time * 5 + i * 3) % 18);
            c.globalAlpha = 1 - r / 24;
            c.beginPath();
            c.ellipse(x, y, r, r * 0.24, 0, 0, Math.PI * 2);
            c.stroke();
          }
          if (!completed.includes(1))
            for (let i = 0; i < 13; i++) {
              const k = (time * 0.18 + i * 0.27) % 1;
              c.globalAlpha = (1 - k) * 0.8;
              c.fillStyle = i % 2 ? "#f2b45f" : "#eb7846";
              c.beginPath();
              c.arc(
                w * (0.72 + (i % 5) * 0.033) + Math.sin(time + i) * 3,
                h * (0.24 - k * 0.14),
                1.5,
                0,
                Math.PI * 2,
              );
              c.fill();
            }
          c.restore();
        }
        const d = phases[(progress().current || 1) - 1],
          x = (w * d.region[0]) / 100,
          y = (h * d.region[1]) / 100 - 57;
        if (MapaFerido.portrait(c, x, y, w < 900 ? 17 : 19)) return;
        c.fillStyle = "#305a39";
        c.strokeStyle = "#edce7a";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x, y, 19, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.save();
        c.beginPath();
        c.arc(x, y, 17, 0, Math.PI * 2);
        c.clip();
        BosqueKai.draw(c, "explorador", 25, x, y + 78, 102);
        c.restore();
        c.fillStyle = "#e4c77d";
        c.beginPath();
        c.moveTo(x - 5, y + 21);
        c.lineTo(x + 5, y + 21);
        c.lineTo(x, y + 29);
        c.fill();
      });
    }
    if (view === "sobre") {
      A.canvas($("about-friends"), (c, w, h) => A.friends(c, w, h, time));
      if (activeAbout === "equipe")
        A.canvas($("professor-portrait"), (c, w, h) => {
          const frame = document.body.classList.contains("reduce-motion")
            ? 8
            : time % 5 > 4.65
              ? 10
              : 8;
          A.draw(c, "professor", frame, w * 0.5, h * 0.99, h * 0.95);
        });
      if (activeAbout === "comandos")
        A.canvas($("how-kai"), (c, w, h) => {
          A.scenery(c, 5, w, h);
          const hh = Math.min(h * 0.64, 168),
            x = w * demo.x,
            y = h * demo.y;
          c.fillStyle = "#214b3333";
          c.beginPath();
          c.ellipse(x, y, hh * 0.25, hh * 0.07, 0, 0, Math.PI * 2);
          c.fill();
          if (time < demo.actionUntil) A.draw(c, "acoes", 7, x, y, hh);
          else if (time < demo.movingUntil)
            A.draw(
              c,
              "kai",
              demo.direction * 2 + (reduced() ? 0 : Math.floor(time * 7) % 2),
              x,
              y,
              hh,
            );
          else A.draw(c, "acoes", 1, x, y, hh);
          A.owl(c, w * 0.84, h * 0.48, hh * 0.24, time, "voo", true);
        });
    }
    if (view === "configuracoes") {
      A.canvas($("settings-flora"), (c, w, h) =>
        A.owl(c, w * 0.5, h * 0.9, h * 0.69, time, "ombro", false),
      );
      A.canvas($("settings-preview"), (c, w, h) => {
        ArteVivaContextos.settings(c, w, h, time);
      });
    }
    if ($("phase-dialog").open)
      A.canvas($("phase-conversation"), (c, w, h) =>
        A.meeting(c, w, h, selected, time),
      );
  }
  function init() {
    setIcon("play-game", "leaf");
    setIcon("about-game", "book");
    $("settings-game").innerHTML = R.icon("gear");
    $("close-phase").innerHTML = R.icon("close");
    R.bindSettings($("settings-form"));
    $("back-home").onclick = () =>
      VivaTransicao.run(() => (location.hash = "inicio"));
    $("phase-back").onclick = () => $("phase-dialog").close();
    $("close-phase").onclick = () => $("phase-dialog").close();
    $("start-phase").onclick = (e) => {
      if (!unlocked(selected)) {
        e.preventDefault();
        R.notice("Complete a região anterior para continuar.");
      }
    };
    $("map-hotspots").onclick = (e) => {
      const b = e.target.closest("[data-phase]");
      if (b) brief(Number(b.dataset.phase));
    };
    $("map-reset").onclick = R.askReset;
    $("reset-journey").onclick = R.askReset;
    $("ending-restart").onclick = R.askReset;
    $("replay-ending").onclick = () => window.VivaFinal?.start();
    $("defaults-settings").onclick = () => {
      R.save({
        music: true,
        musicVolume: 40,
        effects: true,
        effectsVolume: 60,
        reduceMotion: false,
        largeText: false,
        contextHints: true,
        leftHanded: false,
        controlMode: "auto",
        controlSize: 0,
        fallingLeaves: true,
        screenTransitions: true,
        graphicsQuality: "equilibrada",
        highContrast: false,
        showKeyHelp: true,
      });
      $("settings-form").replaceWith($("settings-form").cloneNode(false));
      R.bindSettings($("settings-form"));
    };
    document.querySelector(".about-tabs").onclick = (e) => {
      const b = e.target.closest("[data-about-tab]");
      if (!b) return;
      activeAbout = b.dataset.aboutTab;
      document
        .querySelectorAll("[data-about-tab]")
        .forEach((t) => t.setAttribute("aria-selected", String(t === b)));
      document
        .querySelectorAll("[data-about-panel]")
        .forEach((p) => (p.hidden = p.dataset.aboutPanel !== activeAbout));
      $("about-content").scrollTop = 0;
      if (activeAbout === "comandos") A.load(["kai", "encontros"]);
      if (activeAbout === "equipe") A.load(["professor"]);
      if (!reduced())
        document.getElementById(activeAbout).animate(
          [
            { opacity: 0, transform: "translateY(7px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 240 },
        );
    };
    document.querySelector(".about-tabs").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const tabs = [...document.querySelectorAll("[data-about-tab]")],
        i = tabs.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : 4)) % tabs.length];
      next.click();
      next.focus();
    });
    $("five-care").innerHTML = phases
      .map((d) => `<article>${R.icon(d.icon)}<h3>${d.name}</h3></article>`)
      .join("");
    $("about-necklace").innerHTML = GuardiaoRelicario.necklace(
      [1, 2, 3, 4, 5],
      "about",
    );
    $("biome-tabs").innerHTML = biomes
      .map(
        (d, i) =>
          `<button type="button" data-biome="${i}" aria-pressed="${i === 0}">${d[0]}</button>`,
      )
      .join("");
    $("biome-tabs").onclick = (e) => {
      const b = e.target.closest("[data-biome]");
      if (b) biome(Number(b.dataset.biome));
    };
    biome(0);
    $("nature-advice").textContent = advice[0];
    $("next-advice").onclick = () =>
      ($("nature-advice").textContent = advice[++adviceIndex % advice.length]);
    $("how-kai").addEventListener("keydown", (e) => {
      const moves = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        w: [0, -1],
        a: [-1, 0],
        s: [0, 1],
        d: [1, 0],
      };
      if (moves[e.key]) {
        e.preventDefault();
        demoMove(...moves[e.key]);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        demo.actionUntil = time + 1.4;
      }
    });
    $("how-kai").addEventListener("pointerdown", (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      demoMove(e.clientX < r.x + r.width / 2 ? -1 : 1, 0);
      demo.actionUntil = 0;
    });
    A.load([])
      .then(() => {
        ready = true;
        document.body.dataset.uiReady = "true";
      })
      .catch(() => R.notice("Uma imagem não carregou. Atualize a página."));
    const fit = () => {
      const island = document.querySelector(".island"),
        stage = document.querySelector(".map-stage"),
        r = island.getBoundingClientRect(),
        k = Math.min(r.width / 1280, r.height / 721);
      stage.style.width = k * 1280 + "px";
      stage.style.height = k * 721 + "px";
      document.body.dataset.mapFit = "inteiro";
    };
    new ResizeObserver(fit).observe(document.querySelector(".island"));
    window.addEventListener("resize", fit);
    fit();
    $("demo-action").innerHTML = R.icon("hand") + "<span>Enter</span>";
    $("demo-action").onclick = () => {
      demo.actionUntil = time + 1.4;
      $("demo-feedback").textContent = "Kai cuida da natureza.";
    };
    const pad = $("demo-joystick"),
      knob = pad.querySelector("i");
    let pointer = null,
      stickX = 0,
      stickY = 0;
    const drag = (e) => {
      const r = pad.getBoundingClientRect(),
        dx = (e.clientX - r.x - r.width / 2) / (r.width * 0.35),
        dy = (e.clientY - r.y - r.height / 2) / (r.height * 0.35),
        d = Math.max(1, Math.hypot(dx, dy));
      stickX = dx / d;
      stickY = dy / d;
      knob.style.translate = `${stickX * 16}px ${stickY * 16}px`;
      demoMove(stickX * 0.34, stickY * 0.34);
      $("demo-feedback").textContent = "Você está movendo Kai.";
    };
    pad.onpointerdown = (e) => {
      pointer = e.pointerId;
      pad.setPointerCapture(pointer);
      drag(e);
    };
    pad.onpointermove = (e) => {
      if (pointer === e.pointerId) drag(e);
    };
    const release = () => {
      pointer = null;
      stickX = stickY = 0;
      knob.style.translate = "0 0";
    };
    pad.onpointerup = release;
    pad.onpointercancel = release;
    pad.onlostpointercapture = release;
    pad.onkeydown = (e) => {
      const d = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[e.key];
      if (d) {
        e.preventDefault();
        demoMove(...d);
      }
    };
    const updateSettings = (tab) => {
      const p = R.prefs();
      $("settings-summary").textContent =
        (p.controlMode === "keyboard"
          ? "Teclado"
          : p.controlMode === "touch"
            ? "Toque"
            : "Modo automático") +
        " · " +
        ({
          leve: "Gráficos leves",
          equilibrada: "Gráficos equilibrados",
          alta: "Mais detalhes",
        }[p.graphicsQuality] || "Gráficos equilibrados");
      if (tab)
        $("settings-explainer").textContent = {
          audio: "Uma trilha suave e os sons dos seus cuidados.",
          conforto:
            "Ajuste leitura, contraste e orientações para explorar com calma.",
          controles:
            "Escolha teclado ou toque. O joystick só aparece no modo celular.",
          imagem:
            "A prévia acompanha as folhas e o movimento que você escolher.",
        }[tab];
    };
    window.addEventListener("viva:settings-tab", (e) =>
      updateSettings(e.detail),
    );
    window.addEventListener("guardiao:preferencias", () => updateSettings());
    updateSettings();
    show();
    raf = requestAnimationFrame(render);
  }
  window.addEventListener("hashchange", show);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    clearTimeout(restoreTimer);
    clearTimeout(captionTimer);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "guardiao.mapa.progresso.v1" && view === "mapa") mapDraw();
  });
  window.RaizesApp = {
    phases,
    show,
    progress,
    refreshMap: mapDraw,
    view: () => view,
  };
  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
