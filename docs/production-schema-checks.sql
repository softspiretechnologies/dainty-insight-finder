-- Read-only production checks. Run after a MySQL backup/export.
-- Empty result = that object is missing.

SHOW COLUMNS FROM admin_users LIKE 'session_version';
SHOW COLUMNS FROM admin_users LIKE 'email';
SHOW COLUMNS FROM admin_users LIKE 'password_hash';

SHOW COLUMNS FROM products LIKE 'is_active';
SHOW COLUMNS FROM products LIKE 'featured_on_homepage';
SHOW COLUMNS FROM products LIKE 'homepage_sort_order';
SHOW COLUMNS FROM products LIKE 'slug';

SHOW COLUMNS FROM site_settings LIKE 'services_intro';
SHOW COLUMNS FROM site_settings LIKE 'services_footer_title';
SHOW COLUMNS FROM site_settings LIKE 'services_footer_blurb';
SHOW COLUMNS FROM site_settings LIKE 'testimonials_heading';

SHOW TABLES LIKE 'admin_login_attempts';
SHOW TABLES LIKE 'blog_posts';
SHOW TABLES LIKE 'enquiries';
SHOW TABLES LIKE 'services';
SHOW TABLES LIKE 'testimonials';
SHOW TABLES LIKE 'categories';
SHOW TABLES LIKE 'site_settings';

SHOW COLUMNS FROM enquiries LIKE 'status';
SHOW COLUMNS FROM enquiries LIKE 'admin_notes';
SHOW COLUMNS FROM enquiries LIKE 'product_name_snapshot';
SHOW COLUMNS FROM enquiries LIKE 'service_title_snapshot';
SHOW COLUMNS FROM enquiries LIKE 'phone';
SHOW COLUMNS FROM enquiries LIKE 'message';

SHOW INDEX FROM admin_users WHERE Non_unique = 0 AND Column_name = 'email';
SHOW INDEX FROM products WHERE Non_unique = 0 AND Column_name = 'slug';
SHOW INDEX FROM blog_posts WHERE Non_unique = 0 AND Column_name = 'slug';
SHOW INDEX FROM admin_login_attempts WHERE Key_name = 'admin_login_attempts_scope_key';

SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at, id;
