
(() => {
  "use strict";
  const data = window.PORTFOLIO;
  if (!data || !Array.isArray(data.projects)) return;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
  const safeImage = value => {
    if (!value || typeof value !== "string") return "";
    try {
      const parsed = new URL(value, location.href);
      return ["http:", "https:", "file:"].includes(parsed.protocol) ? value : "";
    } catch { return ""; }
  };
  const art = {x5:"X5 / ДИАЛОГ",medical:"AstraZeneca / Bayer<br>НООП / МОСОП",school21:"21",monastery:"ON AIR",theatre:"ПРЕМЬЕРА"};
  const grid = $("#project-grid");
  const dialog = $("#project-dialog");
  let project = null;
  let photoIndex = 0;
  let trigger = null;

  function artHTML(p, index) {
    return '<span class="art-grid" aria-hidden="true"></span><span class="art-geometry" aria-hidden="true"></span>' +
      '<span class="art-id" aria-hidden="true">PROJECT / 0' + (index+1) + '</span>' +
      '<span class="art-title" aria-hidden="true">' + (art[p.id] || escape(p.title)) + '</span>' +
      '<span class="photo-label">Место для фото проекта</span><span class="art-open" aria-hidden="true">↗</span>';
  }
  data.projects.forEach((p, index) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.category = p.category;
    card.innerHTML = '<button class="project-art art-' + escape(p.id) + '" data-open="' + escape(p.id) +
      '" aria-haspopup="dialog" aria-label="Открыть проект: ' + escape(p.title) + '">' + artHTML(p, index) +
      '</button><div class="project-copy"><p class="project-type">' + escape(p.type) + '</p><h3>' +
      escape(p.title) + '</h3><p class="project-subtitle">' + escape(p.subtitle) +
      '</p><button class="project-open" data-open="' + escape(p.id) + '" aria-haspopup="dialog">О проекте и галерея <span aria-hidden="true">↗</span></button></div>';
    const cover = (p.photos || []).find(photo => safeImage(photo.src));
    if (cover) {
      const poster = $(".project-art", card);
      poster.classList.add("has-cover");
      const img = document.createElement("img");
      img.alt = cover.alt || p.title;
      img.src = safeImage(cover.src);
      img.loading = "lazy";
      img.decoding = "async";
      img.style.objectPosition = cover.position || "50% 50%";
      const label = $(".photo-label", card);
      label.textContent = "Галерея проекта";
      img.addEventListener("error", () => { img.remove(); label.textContent = "Место для фото проекта"; });
      poster.insertBefore(img, $(".photo-label", poster));
    }
    grid.append(card);
  });

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      let shown = 0;
      document.querySelectorAll(".project-card").forEach(card => {
        card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter;
        if (!card.hidden) shown++;
      });
      $("#filter-status").textContent = "Показано проектов: " + shown;
    });
  });

  const emptyPhoto = '<div class="gallery-empty"><span aria-hidden="true">⊞</span><span>Место для фотографии проекта</span></div>';
  function currentPhotos() {
    return project.photos?.length ? project.photos : [{src:"",caption:"Фотографии проекта",alt:project.title}];
  }
  function showPhoto(index) {
    const photos = currentPhotos();
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    const frame = $("#gallery-frame");
    frame.innerHTML = emptyPhoto;
    const url = safeImage(photo.src);
    if (url) {
      const img = document.createElement("img");
      img.alt = photo.alt || project.title;
      img.src = url;
      img.addEventListener("error", () => { frame.innerHTML = emptyPhoto; });
      frame.replaceChildren(img);
    }
    $("#gallery-caption").textContent = photo.caption || project.title;
    $("#gallery-count").textContent = (photoIndex + 1) + " / " + photos.length;
    $("#gallery-prev").disabled = photos.length < 2;
    $("#gallery-next").disabled = photos.length < 2;
    document.querySelectorAll(".gallery-thumb").forEach((thumb, i) => thumb.setAttribute("aria-pressed", String(i === photoIndex)));
  }
  function openProject(id, opener) {
    project = data.projects.find(p => p.id === id);
    if (!project) return;
    trigger = opener;
    const photos = currentPhotos();
    $("#dialog-content").innerHTML = '<p class="dialog-kicker">' + escape(project.type) + '</p>' +
      '<h2 id="dialog-title">' + escape(project.title) + '</h2>' +
      '<p class="dialog-summary">' + escape(project.summary) + '</p>' +
      (project.context ? '<p class="project-context">' + escape(project.context) + '</p>' : "") +
      '<div class="gallery-stage" role="region" aria-label="Галерея проекта">' +
      '<div id="gallery-frame" class="gallery-frame"></div><div class="gallery-toolbar">' +
      '<p class="gallery-caption" id="gallery-caption" aria-live="polite"></p>' +
      '<div class="gallery-controls"><button id="gallery-prev" aria-label="Предыдущая фотография">←</button>' +
      '<span class="gallery-count" id="gallery-count" aria-live="polite"></span>' +
      '<button id="gallery-next" aria-label="Следующая фотография">→</button></div></div>' +
      '<div class="gallery-thumbs" role="group" aria-label="Выбор фотографии"></div></div>' +
      '<div class="dialog-details">' + (project.role ? '<div><p class="detail-label">РОЛЬ В ПРОЕКТЕ</p><p class="detail-role">' + escape(project.role) + '</p></div>' : '') +
      (project.tasks?.length ? '<div><p class="detail-label">ЗОНА ОТВЕТСТВЕННОСТИ</p><ul>' + project.tasks.map(task => '<li>' + escape(task) + '</li>').join("") + '</ul>' +
      (project.result ? '<p class="detail-result">' + escape(project.result) + '</p>' : "") + '</div>' : "") + '</div>';
    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.className = "gallery-thumb";
      button.setAttribute("aria-label", "Кадр " + (index+1) + ": " + (photo.caption || project.title));
      button.setAttribute("aria-pressed", String(index === 0));
      button.textContent = String(index+1).padStart(2,"0");
      const url = safeImage(photo.src);
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.addEventListener("error", () => { button.textContent = String(index+1).padStart(2,"0"); });
        button.replaceChildren(img);
      }
      button.addEventListener("click", () => showPhoto(index));
      $(".gallery-thumbs").append(button);
    });
    $("#gallery-prev").addEventListener("click", () => showPhoto(photoIndex-1));
    $("#gallery-next").addEventListener("click", () => showPhoto(photoIndex+1));
    showPhoto(0);
    document.body.classList.add("modal-open");
    dialog.showModal();
    dialog.scrollTop = 0;
    $(".dialog-close").focus();
  }
  grid.addEventListener("click", event => {
    const opener = event.target.closest("[data-open]");
    if (opener) openProject(opener.dataset.open, opener);
  });
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    trigger?.focus();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); showPhoto(photoIndex+1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); showPhoto(photoIndex-1); }
  });

  const menu = $(".menu-toggle");
  const nav = $("#navigation");
  function closeMenu() {
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Открыть меню");
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") { closeMenu(); menu.focus(); } });
  document.addEventListener("click", event => { if (!event.target.closest(".header")) closeMenu(); });
  window.matchMedia("(min-width: 761px)").addEventListener("change", event => { if (event.matches) closeMenu(); });

  const portrait = data.profile?.portrait;
  if (safeImage(portrait?.src)) {
    const figure = $("#portrait");
    const img = document.createElement("img");
    img.src = safeImage(portrait.src);
    img.alt = portrait.alt || "Александр Тюрин";
    img.style.objectPosition = portrait.position || "50% 35%";
    img.decoding = "async";
    img.addEventListener("load", () => { $(".portrait-art", figure).hidden = true; $(".portrait-status", figure).textContent = "Руководитель событийных проектов"; });
    img.addEventListener("error", () => { img.remove(); $(".portrait-art", figure).hidden = false; $(".portrait-status", figure).textContent = "Место для портрета"; });
    figure.prepend(img);
  }

  const contacts = data.profile?.contacts || {};
  const links = [];
  const email = String(contacts.email || "").trim();
  const phone = String(contacts.phone || "").trim();
  const telegram = String(contacts.telegram || "").trim().replace(/^@/, "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) links.push({label:email,url:"mailto:" + email});
  if (/^\+?[\d ()-]{7,25}$/.test(phone)) links.push({label:phone,url:"tel:" + phone.replace(/[^+\d]/g,"")});
  if (/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) links.push({label:"Telegram",url:"https://t.me/" + telegram});
  if (links.length) {
    const block = $("#contact-links");
    block.replaceChildren();
    links.forEach(item => {
      const a = document.createElement("a");
      a.className = "contact-link";
      a.href = item.url;
      a.textContent = item.label;
      const arrow = document.createElement("span");
      arrow.textContent = "↗"; arrow.setAttribute("aria-hidden","true"); a.append(arrow);
      if (item.url.startsWith("https:")) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      block.append(a);
    });
  }
  $("#print-projects").innerHTML = '<h2>Избранные проекты</h2>' + data.projects.map(p => '<article><h3>' + escape(p.title) + '</h3><p class="print-role">' + escape(p.role) + '</p><p>' + escape(p.summary) + '</p>' + (p.tasks?.length ? '<ul>' + p.tasks.map(t=>'<li>'+escape(t)+'</li>').join("") + '</ul>' : "") + '</article>').join("");
  document.querySelectorAll(".print-button").forEach(button => button.addEventListener("click", () => window.print()));
})();
