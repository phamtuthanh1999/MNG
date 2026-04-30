import { Brackets } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Product } from '../entity/Product';
import { getStockBalanceMap } from './stock-balance.service';

interface SearchProductParams {
  keyword?: string;
  storeId?: string;
  stockFilter?: string;
  page?: number;
  pageSize?: number;
}

// Helper to access Product repository
const productRepo = () => AppDataSource.getRepository(Product);

/**
 * Create and persist a new product.
 * Tạo sản phẩm mới với các field theo cấu trúc TB_PRODUCT
 */
export const createProduct = async (data: Partial<Product>) => {
  const repo = productRepo();
  const product = repo.create(data);
  return repo.save(product);
};

/**
 * List all products
 * Lấy danh sách tất cả sản phẩm
 */
export const listProducts = async () => {
  return productRepo().find({
    order: { ID: 'DESC' }
  });
};

/**
 * Get a single product by ID
 * Lấy thông tin sản phẩm theo ID
 */
export const getProduct = async (id: number) => {
  return productRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Get product by product code (PD_CD)
 * Lấy sản phẩm theo mã sản phẩm
 */
export const getProductByCode = async (productCode: string) => {
  return productRepo().findOne({
    where: { PD_CD: productCode }
  });
};

/**
 * Update product fields and return the updated entity.
 * Cập nhật thông tin sản phẩm
 */
export const updateProduct = async (id: number, data: Partial<Product>) => {
  await productRepo().update(id, data);
  return getProduct(id);
};

/**
 * Delete a product by ID
 * Xóa sản phẩm theo ID
 */
export const deleteProduct = async (id: number) => {
  return productRepo().delete(id);
};

/**
 * Search products by keyword with pagination and filters
 */
export const searchProducts = async (params: SearchProductParams) => {
  const keyword = params.keyword?.trim();
  const storeId = params.storeId?.trim();
  const stockFilter = params.stockFilter?.trim();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));

  const query = productRepo()
    .createQueryBuilder('product')
    .orderBy('product.ID', 'DESC');

  if (keyword) {
    query.andWhere(
      new Brackets((sub) => {
        sub
          .where('product.PD_CD LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('product.PD_NM LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('product.DESCRIPTION LIKE :keyword', { keyword: `%${keyword}%` });
      })
    );
  }

  if (storeId) {
    query.andWhere('product.STORE_ID = :storeId', { storeId });
  }

  if (stockFilter === 'out-of-stock') {
    query.andWhere('product.QUANTITY = 0');
  } else if (stockFilter === 'low-stock') {
    query.andWhere('product.QUANTITY > 0 AND product.QUANTITY < 10');
  } else if (stockFilter === 'in-stock') {
    query.andWhere('product.QUANTITY >= 10');
  }

  const total = await query.getCount();
  const data = await query
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();

  const stockMap = await getStockBalanceMap(data.map((product) => product.PD_CD));
  const dataWithStock = data.map((product) => ({
    ...product,
    CURRENT_STOCK: stockMap.get(product.PD_CD)?.currentStock ?? (Number(product.QUANTITY) || 0),
  }));

  return {
    data: dataWithStock,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

