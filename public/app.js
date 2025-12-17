const API = ""; // same origin

function rupiah(n){
  const x = Number(n || 0);
  return "Rp " + x.toLocaleString("id-ID");
}

function getToken(){ return localStorage.getItem("token"); }
function getUser(){ try { return JSON.parse(localStorage.getItem("user")||"null"); } catch { return null; } }

async function api(path, opts={}){
  const headers = opts.headers || {};
  if (getToken()) headers["Authorization"] = `Bearer ${getToken()}`;
  if (!headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(data?.message || `Request failed ${res.status}`);
  return data;
}

function requireAuth(){
  const u = getUser();
  if (!u || !getToken()){
    window.location.href = "/login.html";
    return null;
  }
  return u;
}

function setCommonUI(user){
  const hello = document.getElementById("hello");
  if (hello) hello.textContent = `Halo, ${user.name}`;
  const roleBadge = document.getElementById("roleBadge");
  if (roleBadge) roleBadge.textContent = `Role: ${user.role}`;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  });
}

function show(el, yes=true){ if (el) el.style.display = yes ? "" : "none"; }

// LOGIN PAGE
(function initLogin(){
  const form = document.getElementById("loginForm");
  if (!form) return;

  const msg = document.getElementById("msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Logging in…";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try{
      const r = await api("/auth/login", {
        method:"POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem("token", r.data.token);
      localStorage.setItem("user", JSON.stringify(r.data.user));

      window.location.href = "/dashboard.html";
    }catch(err){
      msg.textContent = err.message;
    }
  });
})();

// DASHBOARD PAGE
(async function initDashboard(){
  const isDashboard = document.getElementById("barProducts");
  if (!isDashboard) return;

  const user = requireAuth(); if (!user) return;
  setCommonUI(user);

  const productsRes = await api("/products");
  const products = productsRes.data || [];
  document.getElementById("numProducts").textContent = products.length;

  const slow = [...products].sort((a,b)=> (b.stock||0) - (a.stock||0)).slice(0,5);
  const tbody = document.getElementById("slowTable");
  tbody.innerHTML = slow.length ? slow.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.stock}</td>
      <td>${rupiah(p.price)}</td>
    </tr>
  `).join("") : `<tr><td colspan="3" class="muted">Belum ada produk</td></tr>`;

  let orders = [];
  try{
    const path = (user.role === "customer") ? "/orders/me" : "/orders";
    const ordersRes = await api(path);
    orders = ordersRes.data || [];
  }catch{
    orders = [];
  }

  document.getElementById("numOrders").textContent = orders.length;

  const paidStatuses = new Set(["paid","processing","shipped","completed"]);
  const paidOrders = orders.filter(o => paidStatuses.has(o.status));
  const revenue = paidOrders.reduce((sum,o)=> sum + Number(o.total_amount||0), 0);

  const cost = Math.round(revenue * 0.7);
  const profit = revenue - cost;
  const margin = revenue ? Math.round((profit / revenue) * 100) : 0;

  document.getElementById("kpiRevenue").textContent = rupiah(revenue);
  document.getElementById("kpiCost").textContent = rupiah(cost);
  document.getElementById("kpiProfit").textContent = rupiah(profit);
  document.getElementById("kpiMargin").textContent = `Margin: ${margin}%`;

  document.getElementById("numPaid").textContent = paidOrders.length;

  const pct = (x, max) => max ? Math.min(100, Math.round((x/max)*100)) : 0;
  const maxA = Math.max(1, products.length, orders.length, paidOrders.length);
  document.getElementById("barProducts").style.width = pct(products.length, maxA) + "%";
  document.getElementById("barOrders").style.width = pct(orders.length, maxA) + "%";
  document.getElementById("barPaid").style.width = pct(paidOrders.length, maxA) + "%";
})();

// PRODUCTS PAGE (CRUD admin, read all)
(async function initProducts(){
  const tbody = document.getElementById("productsTbody");
  if (!tbody) return;

  const user = requireAuth(); if (!user) return;
  setCommonUI(user);

  const formCard = document.getElementById("productFormCard");
  show(formCard, user.role === "admin");

  const msg = document.getElementById("productMsg");
  const q = document.getElementById("qProducts");
  const btnReload = document.getElementById("btnReloadProducts");

  const form = document.getElementById("productForm");
  const btnClear = document.getElementById("btnClearProduct");

  let cache = [];

  async function load(){
    msg && (msg.textContent = "");
    const res = await api("/products");
    cache = res.data || [];
    render();
  }

  function render(){
    const keyword = (q?.value || "").toLowerCase();
    const rows = cache.filter(p =>
      !keyword || `${p.sku} ${p.name}`.toLowerCase().includes(keyword)
    );

    tbody.innerHTML = rows.length ? rows.map(p => `
      <tr>
        <td>${p.sku}</td>
        <td>${p.name}</td>
        <td>${rupiah(p.price)}</td>
        <td>${p.stock}</td>
        <td>
          ${user.role === "admin" ? `
            <button class="btn mini" data-act="edit" data-id="${p.id}">Edit</button>
            <button class="btn ghost mini" data-act="del" data-id="${p.id}">Delete</button>
          ` : `<span class="muted">-</span>`}
        </td>
      </tr>
    `).join("") : `<tr><td colspan="5" class="muted">Tidak ada data</td></tr>`;
  }

  function fillForm(p){
    document.getElementById("p_id").value = p?.id || "";
    document.getElementById("p_sku").value = p?.sku || "";
    document.getElementById("p_name").value = p?.name || "";
    document.getElementById("p_price").value = p?.price ?? "";
    document.getElementById("p_stock").value = p?.stock ?? "";
    document.getElementById("p_desc").value = p?.description || "";
  }

  btnReload?.addEventListener("click", load);
  q?.addEventListener("input", render);

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;

    const p = cache.find(x => String(x.id) === String(id));
    if (!p) return;

    if (act === "edit"){
      fillForm(p);
      msg.textContent = "Mode edit aktif.";
    }

    if (act === "del"){
      if (!confirm("Yakin hapus produk ini?")) return;
      try{
        await api(`/products/${id}`, { method:"DELETE" });
        msg.textContent = "Deleted ✅";
        await load();
      }catch(err){
        msg.textContent = err.message;
      }
    }
  });

  btnClear?.addEventListener("click", () => {
    fillForm(null);
    msg.textContent = "";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (user.role !== "admin") return;

    msg.textContent = "Saving…";

    const id = document.getElementById("p_id").value.trim();
    const payload = {
      sku: document.getElementById("p_sku").value.trim(),
      name: document.getElementById("p_name").value.trim(),
      price: Number(document.getElementById("p_price").value),
      stock: Number(document.getElementById("p_stock").value),
      description: document.getElementById("p_desc").value.trim()
    };

    try{
      if (id){
        await api(`/products/${id}`, { method:"PATCH", body: JSON.stringify(payload) });
        msg.textContent = "Updated ✅";
      } else {
        await api(`/products`, { method:"POST", body: JSON.stringify(payload) });
        msg.textContent = "Created ✅";
      }
      fillForm(null);
      await load();
    }catch(err){
      msg.textContent = err.message;
    }
  });

  await load();
})();

// ORDERS PAGE (customer create + cancel; staff/admin update status)
(async function initOrders(){
  const tbody = document.getElementById("ordersTbody");
  if (!tbody) return;

  const user = requireAuth(); if (!user) return;
  setCommonUI(user);

  const createCard = document.getElementById("orderCreateCard");
  show(createCard, user.role === "customer");

  const msg = document.getElementById("orderMsg");
  const btnReload = document.getElementById("btnReloadOrders");
  const form = document.getElementById("orderForm");

  let orders = [];

  async function load(){
    msg && (msg.textContent = "");
    const path = (user.role === "customer") ? "/orders/me" : "/orders";
    const res = await api(path);
    orders = res.data || [];
    render();
  }

  function render(){
    tbody.innerHTML = orders.length ? orders.map(o => `
      <tr>
        <td>${o.id}</td>
        <td>${o.order_code || "-"}</td>
        <td>${o.user_id ?? "-"}</td>
        <td>${rupiah(o.total_amount)}</td>
        <td>${o.status}</td>
        <td>
          ${user.role === "customer" ? `
            <button class="btn ghost mini" data-act="cancel" data-id="${o.id}">Cancel</button>
          ` : `
            <select class="input mini" data-act="status" data-id="${o.id}">
              ${["pending","paid","processing","shipped","completed","cancelled"].map(s =>
                `<option value="${s}" ${s===o.status?"selected":""}>${s}</option>`
              ).join("")}
            </select>
          `}
        </td>
      </tr>
    `).join("") : `<tr><td colspan="6" class="muted">Tidak ada data</td></tr>`;
  }

  btnReload?.addEventListener("click", load);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (user.role !== "customer") return;

    msg.textContent = "Creating…";
    const product_id = Number(document.getElementById("o_productId").value);
    const qty = Number(document.getElementById("o_qty").value);

    try{
      // endpoint create order yang umum (kalau backend kamu beda, tinggal sesuaikan di sini)
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({ items: [{ product_id, qty }] })
      });
      msg.textContent = "Created ✅";
      await load();
    }catch(err){
      msg.textContent = err.message;
    }
  });

  tbody.addEventListener("change", async (e) => {
    const sel = e.target.closest("select");
    if (!sel) return;
    const id = sel.dataset.id;
    const status = sel.value;

    try{
      // endpoint update status yang umum (kalau backend kamu beda, sesuaikan)
      await api(`/orders/${id}`, { method:"PATCH", body: JSON.stringify({ status }) });
      await load();
    }catch(err){
      alert(err.message);
      await load();
    }
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    if (act === "cancel"){
      if (!confirm("Yakin cancel order?")) return;
      try{
        // “Delete” versi aman: ubah status cancelled (kalau kamu punya DELETE beneran, ganti method DELETE)
        await api(`/orders/${id}`, { method:"PATCH", body: JSON.stringify({ status: "cancelled" }) });
        await load();
      }catch(err){
        alert(err.message);
      }
    }
  });

  await load();
})();

// PAYMENTS PAGE (customer create; admin verify/reject)
(async function initPayments(){
  const tbody = document.getElementById("paymentsTbody");
  if (!tbody) return;

  const user = requireAuth(); if (!user) return;
  setCommonUI(user);

  const createCard = document.getElementById("paymentCreateCard");
  show(createCard, user.role === "customer");

  const msg = document.getElementById("payMsg");
  const btnReload = document.getElementById("btnReloadPayments");
  const form = document.getElementById("paymentForm");

  let pays = [];

  async function load(){
    msg && (msg.textContent = "");
    // asumsi: admin bisa lihat semua, customer mungkin lihat miliknya (kalau backend belum ada, admin aja yang bisa list)
    const path = (user.role === "admin") ? "/payments" : "/payments/me";
    const res = await api(path);
    pays = res.data || [];
    render();
  }

  function render(){
    tbody.innerHTML = pays.length ? pays.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.order_id}</td>
        <td>${p.method}</td>
        <td>${rupiah(p.amount)}</td>
        <td>${p.status}</td>
        <td>
          ${user.role === "admin" ? `
            <button class="btn mini" data-act="verify" data-id="${p.id}">Verify</button>
            <button class="btn ghost mini" data-act="reject" data-id="${p.id}">Reject</button>
          ` : `<span class="muted">-</span>`}
        </td>
      </tr>
    `).join("") : `<tr><td colspan="6" class="muted">Tidak ada data</td></tr>`;
  }

  btnReload?.addEventListener("click", load);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (user.role !== "customer") return;

    msg.textContent = "Submitting…";
    const order_id = Number(document.getElementById("pay_orderId").value);
    const method = document.getElementById("pay_method").value.trim();
    const amount = Number(document.getElementById("pay_amount").value);

    try{
      await api("/payments", {
        method: "POST",
        body: JSON.stringify({ order_id, method, amount })
      });
      msg.textContent = "Created ✅";
      await load();
    }catch(err){
      msg.textContent = err.message;
    }
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (user.role !== "admin") return;

    try{
      // asumsi endpoint update payment status
      const status = (act === "verify") ? "verified" : "rejected";
      await api(`/payments/${id}`, { method:"PATCH", body: JSON.stringify({ status }) });
      await load();
    }catch(err){
      alert(err.message);
    }
  });

  try{
    await load();
  }catch(err){
    // kalau backend kamu belum punya /payments/me, minimal admin bisa
    if (user.role !== "admin"){
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Endpoint /payments/me belum ada di backend. (Admin bisa lihat lewat /payments)</td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">${err.message}</td></tr>`;
    }
  }
})();
