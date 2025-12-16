# Online Sales DB API (3 Roles)

## Setup
1) npm install
2) copy .env.example -> .env (ubah JWT_SECRET kalau mau)
3) npm run db:init
4) npm run db:seed
5) npm run dev

API: http://localhost:3000

## Login default
- admin@mail.com / admin123
- staff@mail.com / staff123
- cust@mail.com / cust123

## Flow demo cepat
1) POST /auth/login -> ambil token
2) Customer:
   - GET /products
   - POST /orders  { items: [{product_id:1, qty:2}] }
   - POST /payments { order_id:1, method:"transfer", amount:500000, proof_url:"https://..." }
3) Admin:
   - PATCH /payments/:id/verify
4) Staff:
   - GET /orders
   - PATCH /orders/:id/status { status:"shipped" }
