<<<<<<< HEAD
# Warehouse Management (Node + TypeScript + TypeORM)

Quick scaffold for a warehouse/inventory management API using MySQL and TypeORM.

- Language: TypeScript
- Framework: Express
- ORM: TypeORM
- DB: MySQL (sample docker-compose included)

Getting started

1) Copy `.env.example` to `.env` and adjust DB settings.

2) Start MySQL (docker-compose):

```bash
docker-compose up -d
```

3) Install dependencies:

```bash
npm install
```

4) Run in dev mode:

```bash
npm run dev
```

Notes

- Entities: `src/entity/Product.ts`, `src/entity/Warehouse.ts`
- DB config: `src/data-source.ts`
- API routes: `/api/products`

Next steps you might want:
- Add migrations and enable `synchronize: false` in production
- Add auth, pagination, validation, and more entities (stock movements, users)

1 user có nhiều cửa hàng (warehouses)
khi đăng nhập sẽ chọn cửa hàng muốn quản lý để lấy danh sách sản phẩm của cửa hàng đó
=======
# MNG
>>>>>>> 4a8ad251c478f1071145825ee4feac7f29f16d7e
