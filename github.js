/* github.js — live repo feed for the placeholder account, graceful fallback. */
(function () {
  "use strict";
  var USER = "NOOBboy786"; // your GitHub username (wired)
  var grid = document.getElementById("repoGrid"); if (!grid) return;
  var note = document.getElementById("ghNote");
  function card(r) {
    var a = document.createElement("article"); a.className = "card reveal in";
    a.innerHTML = "<p class='tag'>" + (r.language ? r.language : "repo") + " · ★ " + r.stargazers_count + "</p>" +
      "<h3></h3><p></p><p class='meta'></p>";
    a.querySelector("h3").textContent = r.name;
    a.querySelectorAll("p")[1].textContent = r.description || "No description yet.";
    a.querySelector(".meta").textContent = "Updated " + new Date(r.updated_at).toLocaleDateString("en-IN");
    var link = document.createElement("a"); link.href = r.html_url; link.textContent = "Open →";
    link.target = "_blank"; link.rel = "noopener"; a.appendChild(link);
    return a;
  }
  function fallback() {
    grid.innerHTML = "";
    [["fractal-playground", "Canvas", "Interactive Mandelbrot, IFS fern and L-system sketches."],
     ["courtyard-house", "Architecture", "Hot-dry climate home: sections, sun charts, material palette."],
     ["waste-to-wall", "Research", "Notes on stabilised earth and construction-waste blocks."]].forEach(function (p) {
      var a = document.createElement("article"); a.className = "card";
      a.innerHTML = "<p class='tag'>" + p[1] + "</p><h3>" + p[0] + "</h3><p>" + p[2] + "</p><p class='meta'>sample card</p>";
      grid.appendChild(a);
    });
    if (note) note.textContent = "Live feed unavailable (placeholder username or offline) — showing sample cards. Set your username in github.js.";
  }
  fetch("https://api.github.com/users/" + USER + "/repos?sort=updated&per_page=9")
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (repos) {
      if (!repos.length) return fallback();
      grid.innerHTML = "";
      repos.slice(0, 9).forEach(function (r) { grid.appendChild(card(r)); });
      if (note) note.innerHTML = "Live from <a href='https://github.com/" + USER + "'>@ " + USER + "</a> via the GitHub API.";
    })
    .catch(fallback);
})();
