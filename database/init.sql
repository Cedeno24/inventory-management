-- ===============================================
-- SISTEMA DE INVENTARIO - SCHEMA COMPLETO
-- ===============================================

-- Crear base de datos (si no existe)
-- CREATE DATABASE inventory_management;
-- \c inventory_management;

-- ===============================================
-- LIMPIAR TABLAS SI EXISTEN (PARA REINSTALAR)
-- ===============================================
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===============================================
-- TABLA DE USUARIOS
-- ===============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA DE CATEGORÍAS
-- ===============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA DE PRODUCTOS
-- ===============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    min_stock INTEGER DEFAULT 10 CHECK (min_stock >= 0),
    barcode VARCHAR(50) UNIQUE,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA DE MOVIMIENTOS DE INVENTARIO
-- ===============================================
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('CREATE', 'UPDATE', 'DELETE', 'STOCK_IN', 'STOCK_OUT')),
    quantity_before INTEGER,
    quantity_after INTEGER,
    quantity_changed INTEGER,
    reason VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_movements_user ON inventory_movements(user_id);
CREATE INDEX idx_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ===============================================
-- FUNCIÓN PARA AUTO-ACTUALIZAR updated_at
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===============================================
-- TRIGGERS PARA AUTO-ACTUALIZAR updated_at
-- ===============================================
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Usuarios por defecto (contraseñas: admin123 y user123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@inventory.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/GTTnxYfFa', 'admin'),
('usuario', 'user@inventory.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/GTTnxYfFa', 'user');

-- Categorías por defecto
INSERT INTO categories (name, description) VALUES 
('Electrónicos', 'Dispositivos electrónicos y tecnología'),
('Ropa y Accesorios', 'Vestimenta y complementos'),
('Hogar y Jardín', 'Artículos para el hogar y jardín'),
('Deportes y Fitness', 'Equipamiento deportivo y fitness'),
('Libros y Educación', 'Material educativo y libros'),
('Salud y Belleza', 'Productos de salud y cuidado personal'),
('Automóviles', 'Repuestos y accesorios para vehículos'),
('Herramientas', 'Herramientas manuales y eléctricas'),
('Oficina', 'Suministros y equipos de oficina'),
('Otros', 'Productos diversos no categorizados');

-- Productos de ejemplo
INSERT INTO products (name, description, category_id, price, quantity, min_stock, barcode, created_by) VALUES 
('Laptop Dell XPS 13', 'Laptop ultrabook de alta gama con procesador Intel i7', 1, 1299.99, 15, 5, '7501234567890', 1),
('iPhone 14 Pro', 'Smartphone Apple con cámara de 48MP y chip A16', 1, 999.99, 25, 10, '7501234567891', 1),
('Camiseta Nike Dri-FIT', 'Camiseta deportiva de alta tecnología', 2, 29.99, 50, 20, '7501234567892', 1),
('Silla Gamer RGB', 'Silla ergonómica para gaming con iluminación LED', 3, 299.99, 8, 5, '7501234567893', 1),
('Mancuernas 10kg', 'Par de mancuernas ajustables de 10kg cada una', 4, 89.99, 30, 15, '7501234567894', 1),
('Libro JavaScript', 'Guía completa de programación en JavaScript', 5, 45.50, 12, 5, '7501234567895', 2),
('Crema Facial', 'Crema hidratante facial con protección solar', 6, 25.99, 40, 15, '7501234567896', 2),
('Aceite Motor 5W-30', 'Aceite sintético para motor de automóvil', 7, 35.00, 20, 10, '7501234567897', 1),
('Taladro Bosch', 'Taladro percutor inalámbrico 18V', 8, 150.00, 6, 3, '7501234567898', 1),
('Papel Bond A4', 'Resma de papel bond blanco tamaño carta', 9, 4.99, 100, 25, '7501234567899', 2);

-- ===============================================
-- VISTAS ÚTILES
-- ===============================================

-- Vista completa de productos
CREATE VIEW products_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    c.name as category_name,
    p.price,
    p.quantity,
    p.min_stock,
    (p.price * p.quantity) as total_value,
    CASE 
        WHEN p.quantity <= p.min_stock THEN 'LOW'
        WHEN p.quantity <= (p.min_stock * 2) THEN 'MEDIUM'
        ELSE 'HIGH'
    END as stock_status,
    p.barcode,
    p.is_active,
    u.username as created_by_user,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.created_by = u.id;

-- Vista de estadísticas generales
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*) FROM categories WHERE is_active = true) as total_categories,
    (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
    (SELECT COALESCE(SUM(price * quantity), 0) FROM products WHERE is_active = true) as total_inventory_value,
    (SELECT COUNT(*) FROM products WHERE is_active = true AND quantity <= min_stock) as low_stock_products;

-- ===============================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ===============================================
SELECT 'Base de datos configurada correctamente!' as status,
       COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';