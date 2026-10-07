const FEE = 6;

const restaurants = [
  {
    id: "caldo",
    name: "Casa do Caldo",
    kind: "Caldos e sopas",
    time: "30 a 40 min",
    items: [
      { id: "abobora", name: "Caldo de abóbora", desc: "Abóbora e gengibre", price: 28 },
      { id: "lentilha", name: "Sopa de lentilha", desc: "Lentilha e legumes", price: 26 },
      { id: "verde", name: "Caldo verde", desc: "Couve e batata", price: 24 }
    ]
  },
  {
    id: "massa",
    name: "Massa da Vila",
    kind: "Massas",
    time: "40 a 50 min",
    items: [
      { id: "sugo", name: "Espaguete ao sugo", desc: "Tomate e manjericão", price: 32 },
      { id: "lasanha", name: "Lasanha", desc: "Carne e molho branco", price: 36 },
      { id: "nhoque", name: "Nhoque", desc: "Batata e molho", price: 30 }
    ]
  },
  {
    id: "folha",
    name: "Verde Folha",
    kind: "Saladas",
    time: "25 a 35 min",
    items: [
      { id: "salada", name: "Salada verde", desc: "Folhas e limão", price: 22 },
      { id: "grao", name: "Bowl de grão", desc: "Grão-de-bico e legumes", price: 26 },
      { id: "quinoa", name: "Salada de quinoa", desc: "Quinoa e tomate", price: 28 }
    ]
  }
];

const payments = ["Cartão final 4291", "Pix"];
const stepNames = ["Onde pedir", "O que pedir", "Conferir", "Confirmado"];

const state = {
  step: "home",
  query: "",
  calm: localStorage.getItem("prato-calmo") !== "0",
  restaurantId: null,
  itemId: null,
  address: "Rua das Acácias, 120",
  payment: payments[0],
  editing: null,
  code: ""
};

const app = document.querySelector("#app");
let previousStep = state.step;

function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function restaurant() {
  return restaurants.find((item) => item.id === state.restaurantId) || null;
}

function dish() {
  const place = restaurant();
  if (!place) return null;
  return place.items.find((item) => item.id === state.itemId) || null;
}

function total() {
  const item = dish();
  return item ? item.price + FEE : 0;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stepIndex() {
  if (state.step === "menu") return 2;
  if (state.step === "review") return 3;
  if (state.step === "done") return 4;
  return 1;
}

function shell(body) {
  const current = stepIndex();
  const steps = stepNames.map((name, index) => {
    const number = index + 1;
    const on = number <= current ? "on" : "";
    const here = number === current ? ' aria-current="step"' : "";
    return `<li class="${on}"${here}>${number}. ${escapeHtml(name)}</li>`;
  }).join("");

  return `
    <header class="bar">
      <div class="bar-top">
        <div class="brand-wrap">
          <span class="mark" aria-hidden="true">P</span>
          <p class="brand">Prato</p>
        </div>
        <ol class="steps" aria-label="Etapas do pedido">${steps}</ol>
        <p class="now">Passo ${current} de 4 · ${escapeHtml(stepNames[current - 1])}</p>
        <p class="total"><span>Total</span><strong>${money(total())}</strong></p>
      </div>
      <div class="bar-sub">
        <p class="chip">Entregar em <strong>${escapeHtml(state.address)}</strong></p>
        <button type="button" class="switch" role="switch" aria-checked="${state.calm}" data-action="calm">
          <span>
            <strong>Menos estímulos</strong>
            <small>${state.calm ? "Ligado para as próximas vezes" : "Desligado. A tela continua sem avisos piscando."}</small>
          </span>
          <span class="knob" aria-hidden="true"><span></span></span>
        </button>
      </div>
    </header>
    <main class="page" id="conteudo">${body}</main>`;
}

function home() {
  const q = state.query.trim().toLocaleLowerCase("pt-BR");
  const list = restaurants.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(q));
  const cards = list.length
    ? `<div class="grid">${list.map((item) => `
        <button type="button" class="restaurant" data-restaurant="${item.id}">
          <span class="mono" aria-hidden="true">${escapeHtml(item.name[0])}</span>
          <span class="grow">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.kind)}</span>
            <span>${escapeHtml(item.time)}</span>
          </span>
          <span class="chev" aria-hidden="true">›</span>
        </button>`).join("")}</div>`
    : `<p class="empty" role="status">Nenhum restaurante com esse nome.</p>`;

  return shell(`
    <h1 tabindex="-1">Onde você quer pedir?</h1>
    <p class="lead">Escolha um restaurante. O pedido leva um item por vez.</p>
    <div class="toolbar">
      <div class="search">
        <label for="busca">Buscar restaurante</label>
        <input id="busca" type="search" placeholder="Nome do restaurante" value="${escapeHtml(state.query)}" autocomplete="off">
      </div>
    </div>
    ${cards}
  `);
}

function menu() {
  const place = restaurant();
  const cards = place.items.map((item) => `
    <article class="dish">
      <span class="mono" aria-hidden="true">${escapeHtml(item.name[0])}</span>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="desc">${escapeHtml(item.desc)}</p>
      <p class="price">${money(item.price)}</p>
      <button type="button" class="btn" data-item="${item.id}">
        Adicionar ${escapeHtml(item.name.toLocaleLowerCase("pt-BR"))} ao carrinho
      </button>
    </article>`).join("");

  return shell(`
    <button type="button" class="btn ghost" data-action="home">Trocar restaurante</button>
    <h1 tabindex="-1">Escolha o pedido</h1>
    <p class="help">${escapeHtml(place.name)} · ${escapeHtml(place.kind)} · ${escapeHtml(place.time)} · um item por vez</p>
    <div class="grid">${cards}</div>
  `);
}

function review() {
  const item = dish();
  const addressField = state.editing === "address"
    ? `<input id="endereco" type="text" value="${escapeHtml(state.address)}" aria-label="Endereço de entrega">`
    : `<strong>${escapeHtml(state.address)}</strong>`;
  const paymentField = state.editing === "payment"
    ? `<div class="choices">${payments.map((option) => `
        <label><input type="radio" name="pagamento" value="${escapeHtml(option)}" ${option === state.payment ? "checked" : ""}> ${escapeHtml(option)}</label>
      `).join("")}</div>`
    : `<strong>${escapeHtml(state.payment)}</strong>`;

  return shell(`
    <h1 tabindex="-1">Confira antes de pagar</h1>
    <div class="split">
      <div class="summary card">
        <div class="line"><div><small>Pedido</small><strong>${escapeHtml(item.name)}</strong></div>
          <button type="button" class="btn ghost" data-action="menu">Alterar</button></div>
        <div class="line"><div><small>Valor do item</small><strong>${money(item.price)}</strong></div></div>
        <div class="line"><div><small>Entrega</small><strong>${money(FEE)}</strong></div></div>
        <div class="line"><div><small>Total</small><strong>${money(total())}</strong></div></div>
        <div class="line"><div><small>Endereço</small>${addressField}</div>
          <button type="button" class="btn ghost" data-action="address">Alterar</button></div>
        <div class="line"><div><small>Pagamento</small>${paymentField}</div>
          <button type="button" class="btn ghost" data-action="payment">Alterar</button></div>
      </div>
      <aside class="card aside">
        <p class="help" id="cobranca">Finalizar pedido cobra ${money(total())} em ${escapeHtml(state.payment)}.</p>
        <button type="button" class="btn" data-action="finish">Finalizar pedido</button>
      </aside>
    </div>
  `);
}

function done() {
  const place = restaurant();
  const item = dish();
  return shell(`
    <section class="done">
      <span class="ok" aria-hidden="true">OK</span>
      <h1 tabindex="-1">Pedido enviado</h1>
      <p>${escapeHtml(place.name)} vai preparar ${escapeHtml(item.name.toLocaleLowerCase("pt-BR"))}. Nada mais será cobrado.</p>
      <div class="summary card">
        <div class="line"><span>Pedido</span><strong>${escapeHtml(item.name)}</strong></div>
        <div class="line"><span>Total pago</span><strong>${money(total())}</strong></div>
        <div class="line"><span>Pagamento</span><strong>${escapeHtml(state.payment)}</strong></div>
        <div class="line"><span>Entrega</span><strong>${escapeHtml(state.address)}</strong></div>
        <div class="line"><span>Previsão</span><strong>${escapeHtml(place.time)}</strong></div>
        <div class="line"><span>Código</span><strong>${escapeHtml(state.code)}</strong></div>
      </div>
      <button type="button" class="btn" data-action="reset">Voltar ao início</button>
    </section>
  `);
}

function render(options = {}) {
  app.classList.toggle("calm", state.calm);
  const stepChanged = previousStep !== state.step;
  previousStep = state.step;
  const view = state.step === "menu" ? menu()
    : state.step === "review" ? review()
    : state.step === "done" ? done()
    : home();
  app.innerHTML = view;

  const field = app.querySelector("#busca, #endereco");
  if (field && state.editing === "address") {
    field.focus();
    return;
  }
  if (field && state.step === "home" && state.query) {
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    return;
  }
  if (options.focus === "calm") {
    app.querySelector("[data-action=calm]")?.focus();
    return;
  }
  if (stepChanged) app.querySelector("h1")?.focus();
}

app.addEventListener("click", (event) => {
  const restaurantButton = event.target.closest("[data-restaurant]");
  if (restaurantButton) {
    state.restaurantId = restaurantButton.dataset.restaurant;
    state.itemId = null;
    state.step = "menu";
    render();
    return;
  }

  const itemButton = event.target.closest("[data-item]");
  if (itemButton) {
    state.itemId = itemButton.dataset.item;
    state.editing = null;
    state.step = "review";
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;
  const typed = app.querySelector("#endereco");
  if (typed) state.address = typed.value.trim() || state.address;
  const chosen = app.querySelector("input[name=pagamento]:checked");
  if (chosen) state.payment = chosen.value;
  const name = action.dataset.action;

  if (name === "calm") {
    state.calm = !state.calm;
    localStorage.setItem("prato-calmo", state.calm ? "1" : "0");
    render({ focus: "calm" });
    return;
  }
  if (name === "home" || name === "menu") {
    state.step = name === "home" ? "home" : "menu";
    state.editing = null;
  } else if (name === "address") {
    state.editing = state.editing === "address" ? null : "address";
  } else if (name === "payment") {
    state.editing = state.editing === "payment" ? null : "payment";
  } else if (name === "finish") {
    state.code = String(1000 + Math.floor(Math.random() * 9000));
    state.editing = null;
    state.step = "done";
  } else if (name === "reset") {
    state.step = "home";
    state.restaurantId = null;
    state.itemId = null;
    state.query = "";
    state.editing = null;
    state.code = "";
  }
  render();
});

app.addEventListener("input", (event) => {
  if (event.target.id === "busca") {
    state.query = event.target.value;
    render();
  }
  if (event.target.id === "endereco") {
    state.address = event.target.value;
    const chip = app.querySelector(".chip strong");
    if (chip) chip.textContent = state.address;
  }
  if (event.target.name === "pagamento") {
    state.payment = event.target.value;
    const charge = app.querySelector("#cobranca");
    if (charge) charge.textContent = `Finalizar pedido cobra ${money(total())} em ${state.payment}.`;
  }
});

render();
