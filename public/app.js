const API = ""; // same origin (karena frontend diserve oleh Express yang sama)

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

// LOGIN PAGE
(async function initLogin(){
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
  const roleBadge = document.getElementById("roleBadge");
  if (!roleBadge) return;

  const user = getUser();
  if (!user || !getToken()){
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("hello").textContent = `Halo, ${user.name}`;
  roleBadge.textContent = `Role: ${user.role}`;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  });

  // Ambil produk (public)
  const productsRes = await api("/products");
  const products = productsRes.data || [];
  document.getElementById("numProducts").textContent = products.length;

  // “Slow moving” demo: ambil stok besar (top 5)
  const slow = [...products].sort((a,b)=> (b.stock||0) - (a.stock||0)).slice(0,5);
  const tbody = document.getElementById("slowTable");
  tbody.innerHTML = slow.length ? slow.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.stock}</td>
      <td>${rupiah(p.price)}</td>
    </tr>
  `).join("") : `<tr><td colspan="3" class="muted">Belum ada produk</td></tr>`;

  // Orders: tergantung role (customer lihat /orders/me, staff/admin bisa /orders)
  let orders = [];
  try{
    const path = (user.role === "customer") ? "/orders/me" : "/orders";
    const ordersRes = await api(path);
    orders = ordersRes.data || [];
  }catch{
    // kalau role tidak punya akses, biarin kosong
    orders = [];
  }

  document.getElementById("numOrders").textContent = orders.length;

  // Hitung “omset” sederhana: total_amount dari order status paid/processing/shipped/completed
  const paidStatuses = new Set(["paid","processing","shipped","completed"]);
  const paidOrders = orders.filter(o => paidStatuses.has(o.status));
  const revenue = paidOrders.reduce((sum,o)=> sum + Number(o.total_amount||0), 0);

  // HPP demo (misal 70% dari revenue), profit demo (30%)
  const cost = Math.round(revenue * 0.7);
  const profit = revenue - cost;
  const margin = revenue ? Math.round((profit / revenue) * 100) : 0;

  document.getElementById("kpiRevenue").textContent = rupiah(revenue);
  document.getElementById("kpiCost").textContent = rupiah(cost);
  document.getElementById("kpiProfit").textContent = rupiah(profit);
  document.getElementById("kpiMargin").textContent = `Margin: ${margin}%`;

  document.getElementById("numPaid").textContent = paidOrders.length;

  // Bar progress (biar keliatan “dashboard”)
  const pct = (x, max) => max ? Math.min(100, Math.round((x/max)*100)) : 0;
  const maxA = Math.max(1, products.length, orders.length, paidOrders.length);
  document.getElementById("barProducts").style.width = pct(products.length, maxA) + "%";
  document.getElementById("barOrders").style.width = pct(orders.length, maxA) + "%";
  document.getElementById("barPaid").style.width = pct(paidOrders.length, maxA) + "%";
})();
