"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./src/data-source");
const product_service_1 = require("./src/services/product.service");
async function test() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('Database connected');
        const result = await (0, product_service_1.createProduct)({
            PD_NM: 'Test Product',
            STORE_ID: 'ST001',
            QUANTITY: 10,
            USER_LOGIN: 'admin'
        });
        console.log('Success:', result);
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        await data_source_1.AppDataSource.destroy();
    }
}
test();
