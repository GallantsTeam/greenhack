module.exports = {

"[externals]/events [external] (events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}}),
"[externals]/process [external] (process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}}),
"[externals]/net [external] (net, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}}),
"[externals]/tls [external] (tls, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}}),
"[externals]/timers [external] (timers, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("timers", () => require("timers"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/buffer [external] (buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}}),
"[externals]/string_decoder [external] (string_decoder, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[project]/src/lib/mysql.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ {"6058d2186d06199210990ee590d0261587c858a217":"query"} */ __turbopack_context__.s({
    "query": (()=>query)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mysql2$2f$promise$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mysql2/promise.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    namedPlaceholders: true
};
let pool = null;
function getPool() {
    if (!pool) {
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
            console.error("Database environment variables DB_HOST, DB_USER, or DB_NAME are not set.");
            throw new Error("Database environment variables are not fully set. Please check your .env.local file.");
        }
        try {
            pool = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mysql2$2f$promise$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].createPool(connectionConfig);
            console.log("MySQL connection pool created successfully.");
            // Test the pool by getting a connection (optional, but good for early feedback)
            pool.getConnection().then((connection)=>{
                console.log("Successfully connected to database via pool.");
                connection.release();
            }).catch((err)=>{
                console.error("Failed to get a connection from pool on startup:", err);
            // Depending on severity, you might want to invalidate the pool or exit
            // For now, we'll let further queries fail if the pool is truly unusable.
            });
        } catch (error) {
            console.error("Failed to create MySQL connection pool:", error);
            // Ensure pool remains null if creation fails
            pool = null;
            throw new Error("Database connection pool could not be created.");
        }
    }
    return pool;
}
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ query(sql, params) {
    const currentPool = getPool(); // This will throw if pool cannot be initialized
    let connection;
    try {
        connection = await currentPool.getConnection();
        console.log(`Executing SQL: ${sql} with params: ${params ? JSON.stringify(params) : 'No params'}`);
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message, error.code, error.sqlMessage, error.sql);
        throw new Error(`Database query failed: ${error.message}`);
    } finally{
        if (connection) {
            connection.release();
        }
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    query
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(query, "6058d2186d06199210990ee590d0261587c858a217", null);
}}),
"[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/mysql.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
}}),
"[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/mysql.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mysql.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$games$2f5b$gameId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/mysql.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/mysql.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "6058d2186d06199210990ee590d0261587c858a217": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mysql.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$games$2f5b$gameId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/mysql.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/mysql.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "6058d2186d06199210990ee590d0261587c858a217": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$games$2f5b$gameId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6058d2186d06199210990ee590d0261587c858a217"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$games$2f5b$gameId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/mysql.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$games$2f5b$gameId$5d2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/games/[gameId]/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/mysql.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/lib/data.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "getAllCategories": (()=>getAllCategories),
    "getAllProducts": (()=>getAllProducts),
    "getBalanceTransactions": (()=>getBalanceTransactions),
    "getCaseById": (()=>getCaseById),
    "getCaseOpeningsHistory": (()=>getCaseOpeningsHistory),
    "getCategoryBySlug": (()=>getCategoryBySlug),
    "getProductBySlug": (()=>getProductBySlug),
    "getProductsByCategorySlug": (()=>getProductsByCategorySlug),
    "getPurchaseHistory": (()=>getPurchaseHistory),
    "getReferralData": (()=>getReferralData),
    "getUserInventory": (()=>getUserInventory)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mysql.ts [app-rsc] (ecmascript)");
;
const getAllCategories = async ()=>{
    try {
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])(`SELECT DISTINCT 
         g.id as id, 
         g.slug as slug,
         g.name as name, 
         g.description as description,
         g.min_price as min_price,
         g.image_url as imageUrl, 
         g.logo_url as logoUrl, 
         g.banner_url as banner_url,
         g.platform as platform,
         g.tags as tags,
         g.data_ai_hint as dataAiHint,
         g.hero_bullet_points as hero_bullet_points,
         (SELECT COUNT(*) FROM products p WHERE p.game_slug = g.slug) as product_count 
       FROM games g
       ORDER BY g.name ASC`);
        return results.map((row)=>({
                id: row.id,
                name: row.name,
                slug: String(row.slug).trim(),
                description: row.description,
                min_price: parseFloat(row.min_price) || 0,
                imageUrl: (row.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(row.name)}`).trim(),
                logoUrl: (row.logoUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(row.name.substring(0, 3))}`).trim(),
                banner_url: row.banner_url ? String(row.banner_url).trim() : null,
                platform: row.platform,
                tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag)=>tag.trim()).filter(Boolean) : [],
                dataAiHint: `${row.dataAiHint || String(row.name).toLowerCase()} game icon`,
                hero_bullet_points: typeof row.hero_bullet_points === 'string' ? row.hero_bullet_points.split('\n').map((bp)=>bp.trim()).filter(Boolean) : [],
                product_count: parseInt(row.product_count) || 0
            }));
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};
const getCategoryBySlug = async (slug)=>{
    try {
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])(`SELECT DISTINCT 
         g.id as id,
         g.slug as slug,
         g.name as name,
         g.description as description,
         g.min_price as min_price,
         g.image_url as imageUrl,
         g.logo_url as logoUrl,
         g.banner_url as banner_url,
         g.platform as platform,
         g.tags as tags,
         g.data_ai_hint as dataAiHint,
         g.hero_bullet_points as hero_bullet_points,
         (SELECT COUNT(*) FROM products p WHERE p.game_slug = g.slug) as product_count
       FROM games g
       WHERE g.slug = ?`, [
            slug.trim()
        ] // Trim slug before query
        );
        if (results.length === 0) return undefined;
        const row = results[0];
        return {
            id: row.id,
            name: row.name,
            slug: String(row.slug).trim(),
            description: row.description,
            min_price: parseFloat(row.min_price) || 0,
            imageUrl: (row.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(row.name)}`).trim(),
            logoUrl: (row.logoUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(row.name.substring(0, 3))}`).trim(),
            banner_url: row.banner_url ? String(row.banner_url).trim() : null,
            platform: row.platform,
            tags: typeof row.tags === 'string' ? row.tags.split(',').map((tag)=>tag.trim()).filter((tag)=>tag) : [],
            dataAiHint: `${row.dataAiHint || String(row.name).toLowerCase()} game icon`,
            hero_bullet_points: typeof row.hero_bullet_points === 'string' ? row.hero_bullet_points.split('\n').map((bp)=>bp.trim()).filter(Boolean) : [],
            product_count: parseInt(row.product_count) || 0
        };
    } catch (error) {
        console.error(`Error fetching category by slug ${slug}:`, error);
        return undefined;
    }
};
const getAllProducts = async ()=>{
    try {
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])(`SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         p.mode, p.gallery_image_urls,
         p.functions_aim_title, p.functions_aim, p.functions_aim_description,
         p.functions_esp_title, p.functions_wallhack, p.functions_esp_description,
         p.functions_misc_title, p.functions_misc, p.functions_misc_description,
         p.system_os, p.system_build, p.system_gpu, p.system_cpu,
         p.price_text,
         p.retrieval_modal_intro_text,
         p.retrieval_modal_antivirus_text,
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         p.retrieval_modal_how_to_run_link,
         p.created_at, p.updated_at,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_rub_payment_visible = TRUE) as min_price_rub_calculated,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_gh_payment_visible = TRUE) as min_price_gh_calculated,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       ORDER BY p.name ASC`);
        return results.map((row)=>({
                id: String(row.id).trim(),
                name: row.name,
                slug: String(row.slug).trim(),
                game_slug: String(row.game_slug).trim(),
                image_url: row.image_url ? String(row.image_url).trim() : null,
                imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
                status: row.status ? String(row.status).toLowerCase() : 'unknown',
                status_text: row.status_text,
                price: parseFloat(row.min_price_rub_calculated || '0'),
                min_price_rub: row.min_price_rub_calculated ? parseFloat(row.min_price_rub_calculated) : undefined,
                min_price_gh: row.min_price_gh_calculated ? parseFloat(row.min_price_gh_calculated) : undefined,
                price_text: row.price_text,
                short_description: row.short_description,
                long_description: row.long_description,
                data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
                mode: row.mode,
                gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url)=>url.trim()).filter(Boolean) : [],
                functions_aim_title: row.functions_aim_title,
                functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
                functions_aim_description: row.functions_aim_description,
                functions_esp_title: row.functions_esp_title,
                functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
                functions_esp_description: row.functions_esp_description,
                functions_misc_title: row.functions_misc_title,
                functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
                functions_misc_description: row.functions_misc_description,
                system_os: row.system_os,
                system_build: row.system_build,
                system_gpu: row.system_gpu,
                system_cpu: row.system_cpu,
                retrieval_modal_intro_text: row.retrieval_modal_intro_text,
                retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
                retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text,
                retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,
                retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
                retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text,
                retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,
                retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
                retrieval_modal_support_text: row.retrieval_modal_support_text,
                retrieval_modal_support_link_text: row.retrieval_modal_support_link_text,
                retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,
                retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
                created_at: row.created_at,
                updated_at: row.updated_at,
                gameName: row.gameName,
                gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
                gamePlatform: row.gamePlatform
            }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};
const getProductBySlug = async (slug)=>{
    try {
        const productResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])(`SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         p.mode, p.gallery_image_urls,
         p.functions_aim_title, p.functions_aim, p.functions_aim_description,
         p.functions_esp_title, p.functions_wallhack, p.functions_esp_description,
         p.functions_misc_title, p.functions_misc, p.functions_misc_description,
         p.system_os, p.system_build, p.system_gpu, p.system_cpu,
         p.price_text,
         p.retrieval_modal_intro_text, 
         p.retrieval_modal_antivirus_text, 
         p.retrieval_modal_antivirus_link_text,
         p.retrieval_modal_antivirus_link_url,
         p.retrieval_modal_launcher_text,
         p.retrieval_modal_launcher_link_text,
         p.retrieval_modal_launcher_link_url,
         p.retrieval_modal_key_paste_text,
         p.retrieval_modal_support_text,
         p.retrieval_modal_support_link_text,
         p.retrieval_modal_support_link_url,
         p.retrieval_modal_how_to_run_link,
         p.created_at, p.updated_at,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       WHERE p.slug = ?`, [
            slug.trim()
        ] // Trim slug before query
        );
        if (productResults.length === 0) return undefined;
        const row = productResults[0];
        const pricingOptionsResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])('SELECT * FROM product_pricing_options WHERE product_id = ? ORDER BY duration_days ASC, mode_label ASC', [
            String(row.id).trim()
        ] // Trim product.id when fetching options
        );
        const pricing_options = Array.isArray(pricingOptionsResults) ? pricingOptionsResults.map((opt)=>({
                id: opt.id,
                product_id: String(opt.product_id).trim(),
                duration_days: parseInt(opt.duration_days, 10),
                price_rub: parseFloat(opt.price_rub),
                price_gh: parseFloat(opt.price_gh),
                payment_link: opt.payment_link || null,
                mode_label: opt.mode_label || null,
                created_at: opt.created_at,
                // Added new fields with defaults
                is_rub_payment_visible: opt.is_rub_payment_visible === undefined ? true : Boolean(opt.is_rub_payment_visible),
                is_gh_payment_visible: opt.is_gh_payment_visible === undefined ? true : Boolean(opt.is_gh_payment_visible),
                custom_payment_1_label: opt.custom_payment_1_label || null,
                custom_payment_1_price_rub: opt.custom_payment_1_price_rub ? parseFloat(opt.custom_payment_1_price_rub) : null,
                custom_payment_1_link: opt.custom_payment_1_link || null,
                custom_payment_1_is_visible: opt.custom_payment_1_is_visible === undefined ? false : Boolean(opt.custom_payment_1_is_visible),
                custom_payment_2_label: opt.custom_payment_2_label || null,
                custom_payment_2_price_rub: opt.custom_payment_2_price_rub ? parseFloat(opt.custom_payment_2_price_rub) : null,
                custom_payment_2_link: opt.custom_payment_2_link || null,
                custom_payment_2_is_visible: opt.custom_payment_2_is_visible === undefined ? false : Boolean(opt.custom_payment_2_is_visible)
            })) : [];
        const minRubOption = pricing_options.length > 0 ? pricing_options.filter((o)=>o.is_rub_payment_visible).reduce((min, p)=>p.price_rub < min ? p.price_rub : min, pricing_options.filter((o)=>o.is_rub_payment_visible)[0]?.price_rub ?? Infinity) : 0;
        const minGhOption = pricing_options.length > 0 ? pricing_options.filter((o)=>o.is_gh_payment_visible).reduce((min, p)=>p.price_gh < min ? p.price_gh : min, pricing_options.filter((o)=>o.is_gh_payment_visible)[0]?.price_gh ?? Infinity) : 0;
        return {
            id: String(row.id).trim(),
            name: row.name,
            slug: String(row.slug).trim(),
            game_slug: String(row.game_slug).trim(),
            image_url: row.image_url ? String(row.image_url).trim() : null,
            imageUrl: (row.image_url || `https://placehold.co/600x400.png?text=${encodeURIComponent(row.name)}`).trim(),
            status: row.status ? String(row.status).toLowerCase() : 'unknown',
            status_text: row.status_text || 'Статус неизвестен',
            price: minRubOption === Infinity ? 0 : minRubOption,
            min_price_rub: minRubOption === Infinity ? undefined : minRubOption,
            min_price_gh: minGhOption === Infinity ? undefined : minGhOption,
            price_text: row.price_text,
            short_description: row.short_description,
            long_description: row.long_description,
            data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
            mode: row.mode,
            gallery_image_urls: row.gallery_image_urls ? String(row.gallery_image_urls).split(',').map((url)=>url.trim()).filter(Boolean) : [],
            functions_aim_title: row.functions_aim_title,
            functions_aim: row.functions_aim ? String(row.functions_aim).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
            functions_aim_description: row.functions_aim_description,
            functions_esp_title: row.functions_esp_title,
            functions_wallhack: row.functions_wallhack ? String(row.functions_wallhack).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
            functions_esp_description: row.functions_esp_description,
            functions_misc_title: row.functions_misc_title,
            functions_misc: row.functions_misc ? String(row.functions_misc).split(',').map((fn)=>fn.trim()).filter(Boolean) : [],
            functions_misc_description: row.functions_misc_description,
            system_os: row.system_os,
            system_build: row.system_build,
            system_gpu: row.system_gpu,
            system_cpu: row.system_cpu,
            pricing_options: pricing_options.length > 0 ? pricing_options : [],
            retrieval_modal_intro_text: row.retrieval_modal_intro_text,
            retrieval_modal_antivirus_text: row.retrieval_modal_antivirus_text,
            retrieval_modal_antivirus_link_text: row.retrieval_modal_antivirus_link_text,
            retrieval_modal_antivirus_link_url: row.retrieval_modal_antivirus_link_url,
            retrieval_modal_launcher_text: row.retrieval_modal_launcher_text,
            retrieval_modal_launcher_link_text: row.retrieval_modal_launcher_link_text,
            retrieval_modal_launcher_link_url: row.retrieval_modal_launcher_link_url,
            retrieval_modal_key_paste_text: row.retrieval_modal_key_paste_text,
            retrieval_modal_support_text: row.retrieval_modal_support_text,
            retrieval_modal_support_link_text: row.retrieval_modal_support_link_text,
            retrieval_modal_support_link_url: row.retrieval_modal_support_link_url,
            retrieval_modal_how_to_run_link: row.retrieval_modal_how_to_run_link,
            created_at: row.created_at,
            updated_at: row.updated_at,
            gameName: row.gameName,
            gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
            gamePlatform: row.gamePlatform
        };
    } catch (error) {
        console.error(`Error fetching product by slug ${slug}:`, error);
        return undefined;
    }
};
const getProductsByCategorySlug = async (gameSlug)=>{
    try {
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])(`SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_rub_payment_visible = TRUE) as min_price_rub,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id AND ppo.is_gh_payment_visible = TRUE) as min_price_gh,
         p.price_text,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       WHERE p.game_slug = ?
       ORDER BY p.name ASC`, [
            gameSlug.trim()
        ] // Trim gameSlug before query
        );
        return results.map((row)=>({
                id: String(row.id).trim(),
                name: row.name,
                slug: String(row.slug).trim(),
                game_slug: String(row.game_slug).trim(),
                image_url: row.image_url ? String(row.image_url).trim() : null,
                imageUrl: (row.image_url || `https://placehold.co/300x350.png?text=${encodeURIComponent(row.name)}`).trim(),
                status: row.status ? String(row.status).toLowerCase() : 'unknown',
                status_text: row.status_text || 'Статус неизвестен',
                price: parseFloat(row.min_price_rub || '0'),
                min_price_rub: row.min_price_rub ? parseFloat(row.min_price_rub) : undefined,
                min_price_gh: row.min_price_gh ? parseFloat(row.min_price_gh) : undefined,
                price_text: row.price_text,
                short_description: row.short_description,
                long_description: row.long_description,
                data_ai_hint: row.data_ai_hint || `${String(row.name).toLowerCase()} product`,
                gameName: row.gameName,
                gameLogoUrl: row.gameLogoUrl ? String(row.gameLogoUrl).trim() : null,
                gamePlatform: row.gamePlatform
            }));
    } catch (error) {
        console.error(`Error fetching products for game slug ${gameSlug}:`, error);
        return [];
    }
};
const getCaseById = async (caseId)=>{
    try {
        const caseResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])('SELECT * FROM cases WHERE id = ? AND is_active = TRUE', [
            caseId.trim()
        ]); // Trim caseId
        if (caseResults.length === 0) {
            console.warn(`Case with ID ${caseId} not found or not active.`);
            return null;
        }
        const caseRow = caseResults[0];
        const prizeResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mysql$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["query"])('SELECT * FROM case_prizes WHERE case_id = ?', [
            caseId.trim()
        ]); // Trim caseId
        const prizes = prizeResults.map((pRow)=>({
                id: String(pRow.id).trim(),
                case_id: String(pRow.case_id).trim(),
                name: pRow.name,
                prize_type: pRow.prize_type,
                related_product_id: pRow.related_product_id ? String(pRow.related_product_id).trim() : null,
                duration_days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
                days: pRow.duration_days ? parseInt(pRow.duration_days, 10) : null,
                balance_gh_amount: pRow.balance_gh_amount ? parseFloat(pRow.balance_gh_amount) : undefined,
                image_url: pRow.image_url ? String(pRow.image_url).trim() : null,
                imageUrl: (pRow.image_url || `https://placehold.co/120x120.png?text=${encodeURIComponent(pRow.id)}`).trim(),
                chance: parseFloat(pRow.chance),
                sell_value_gh: pRow.sell_value_gh ? parseFloat(pRow.sell_value_gh) : undefined,
                data_ai_hint: pRow.data_ai_hint || `${String(pRow.name).toLowerCase()} prize`,
                mode_label: pRow.mode_label
            }));
        return {
            id: String(caseRow.id).trim(),
            name: caseRow.name,
            image_url: caseRow.image_url ? String(caseRow.image_url).trim() : null,
            imageUrl: (caseRow.image_url || `https://placehold.co/300x300.png?text=Case`).trim(),
            prizes: prizes,
            base_price_gh: parseFloat(caseRow.base_price_gh),
            description: caseRow.description,
            data_ai_hint: caseRow.data_ai_hint || `${String(caseRow.name).toLowerCase()} case`,
            is_active: Boolean(caseRow.is_active),
            is_hot_offer: Boolean(caseRow.is_hot_offer),
            timer_enabled: Boolean(caseRow.timer_enabled),
            timer_ends_at: caseRow.timer_ends_at ? new Date(caseRow.timer_ends_at).toISOString() : null,
            created_at: caseRow.created_at
        };
    } catch (error) {
        console.error(`Error fetching case by ID ${caseId}:`, error);
        return null;
    }
};
const getPurchaseHistory = async (userId)=>{
    return [];
};
const getCaseOpeningsHistory = async (userId)=>{
    return [];
};
const getUserInventory = async (userId)=>{
    return [];
};
const getReferralData = async (userId)=>{
    return {
        referrals: [],
        totalEarned: 0
    };
};
const getBalanceTransactions = async (userId)=>{
    return [];
};
}}),
"[project]/src/lib/utils.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-rsc] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}}),
"[project]/src/components/ui/card.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Card": (()=>Card),
    "CardContent": (()=>CardContent),
    "CardDescription": (()=>CardDescription),
    "CardFooter": (()=>CardFooter),
    "CardHeader": (()=>CardHeader),
    "CardTitle": (()=>CardTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("rounded-lg border bg-card text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 10,
        columnNumber: 3
    }, this));
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 25,
        columnNumber: 3
    }, this));
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("text-xl font-normal uppercase tracking-wider leading-none", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 37,
        columnNumber: 3
    }, this));
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 52,
        columnNumber: 3
    }, this));
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 64,
        columnNumber: 3
    }, this));
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 72,
        columnNumber: 3
    }, this));
CardFooter.displayName = "CardFooter";
;
}}),
"[project]/src/components/ui/badge.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Badge": (()=>Badge),
    "badgeVariants": (()=>badgeVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/badge.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
;
}}),
"[project]/src/components/ui/button.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button),
    "buttonVariants": (()=>buttonVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary/90",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 47,
        columnNumber: 7
    }, this);
});
Button.displayName = "Button";
;
}}),
"[project]/src/components/ProductCard.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-rsc] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-rsc] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-rsc] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-rsc] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/badge.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
const ProductCard = ({ product, className })=>{
    const statusDetailsMap = {
        safe: {
            text: 'Безопасен',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"],
            glow: 'primary',
            iconColor: 'text-icon-color',
            badgeClass: 'bg-primary/20 text-primary border-primary/40'
        },
        updating: {
            text: 'На обновлении',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
            glow: 'sky',
            iconColor: 'text-sky-400',
            badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse'
        },
        risky: {
            text: 'Не безопасен',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
            glow: 'red',
            iconColor: 'text-red-400',
            badgeClass: 'bg-red-600/20 text-red-400 border-red-600/40'
        },
        unknown: {
            text: 'На обновлении',
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
            glow: 'sky',
            iconColor: 'text-sky-400',
            badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40 animate-pulse'
        }
    };
    const currentStatus = statusDetailsMap[product.status] || statusDetailsMap.unknown;
    const StatusIcon = currentStatus.icon;
    const glowClasses = {
        primary: 'hover:shadow-[0_0_15px_3px_hsl(var(--icon-color-hsl)/0.4)] border-icon-color',
        orange: 'hover:shadow-[0_0_15px_3px_rgba(251,146,60,0.4)] border-orange-500/70',
        red: 'hover:shadow-[0_0_15px_3px_rgba(239,68,68,0.4)] border-red-500/70',
        sky: 'hover:shadow-[0_0_15px_3px_rgba(56,189,248,0.4)] border-sky-500/70'
    };
    const effectiveGlowClass = currentStatus.glow ? glowClasses[currentStatus.glow] : 'hover:border-icon-color/50';
    const formatValue = (value)=>{
        if (typeof value !== 'number' || value === null || isNaN(value)) {
            return '';
        }
        if (value % 1 === 0) {
            return value.toLocaleString('ru-RU', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
        return value.toLocaleString('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };
    const formatPriceDisplay = (product)=>{
        const hasRubPrice = product.min_price_rub !== undefined && product.min_price_rub !== null && product.min_price_rub >= 0;
        const hasGhPrice = product.min_price_gh !== undefined && product.min_price_gh !== null && product.min_price_gh >= 0;
        const rubPriceFormatted = hasRubPrice ? `${formatValue(product.min_price_rub)} ₽` : '';
        const ghPriceFormatted = hasGhPrice ? `${formatValue(product.min_price_gh)} GH` : '';
        if (hasRubPrice && hasGhPrice) {
            return `от ${rubPriceFormatted} / ${ghPriceFormatted}`;
        }
        if (hasRubPrice) {
            return `от ${rubPriceFormatted}`;
        }
        if (hasGhPrice) {
            return `от ${ghPriceFormatted}`;
        }
        return product.price_text || 'Подробнее';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Card"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full flex flex-col border-2 border-card hover:border-icon-color/70 rounded-xl group", effectiveGlowClass, className),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
            href: `/products/${product.slug}`,
            className: "block flex flex-col flex-grow",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative w-full h-52 md:h-56 overflow-hidden",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            src: product.imageUrl || product.image_url || 'https://placehold.co/400x300.png',
                            alt: product.name,
                            layout: "fill",
                            objectFit: "cover",
                            className: "transition-transform duration-500 ease-out group-hover:scale-110",
                            "data-ai-hint": product.data_ai_hint || `${product.name} game art`
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductCard.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this),
                        product.gameLogoUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-3 right-3 bg-background/80 p-1.5 rounded-md shadow-md",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                src: product.gameLogoUrl,
                                alt: `${product.gameName || 'Game'} logo`,
                                width: 28,
                                height: 28,
                                "data-ai-hint": "game logo icon"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProductCard.tsx",
                                lineNumber: 86,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductCard.tsx",
                            lineNumber: 85,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProductCard.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 flex flex-col flex-grow justify-between bg-card/50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CardTitle"], {
                                    className: "text-lg md:text-xl font-semibold text-icon-color group-hover:text-primary transition-colors mb-1 truncate",
                                    title: product.name,
                                    children: product.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductCard.tsx",
                                    lineNumber: 93,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                    variant: currentStatus.badgeClass?.includes('primary') ? 'default' : currentStatus.badgeClass?.includes('orange') || currentStatus.badgeClass?.includes('sky') ? 'secondary' : currentStatus.badgeClass?.includes('red') ? 'destructive' : 'outline',
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("text-xs py-0.5 px-2 mb-2", currentStatus.badgeClass),
                                    children: [
                                        StatusIcon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusIcon, {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("h-3 w-3 mr-1", currentStatus.iconColor, product.status === 'updating' || product.status === 'unknown' ? 'animate-pulse' : '')
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProductCard.tsx",
                                            lineNumber: 97,
                                            columnNumber: 32
                                        }, this),
                                        currentStatus.text
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProductCard.tsx",
                                    lineNumber: 96,
                                    columnNumber: 13
                                }, this),
                                product.short_description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2 p-0",
                                    children: product.short_description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductCard.tsx",
                                    lineNumber: 101,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProductCard.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-auto flex items-center justify-between pt-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-base md:text-lg font-bold text-icon-color",
                                    children: formatPriceDisplay(product)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductCard.tsx",
                                    lineNumber: 107,
                                    columnNumber: 14
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "text-icon-color hover:text-primary/80 hover:bg-transparent p-0 h-auto text-sm",
                                    children: [
                                        "Перейти ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                            className: "ml-1.5 h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProductCard.tsx",
                                            lineNumber: 109,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProductCard.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ProductCard.tsx",
                            lineNumber: 106,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProductCard.tsx",
                    lineNumber: 91,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ProductCard.tsx",
            lineNumber: 74,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ProductCard.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = ProductCard;
}}),
"[project]/src/components/CategoryScroller.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/components/CategoryScroller.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/CategoryScroller.tsx <module evaluation>", "default");
}}),
"[project]/src/components/CategoryScroller.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/components/CategoryScroller.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/CategoryScroller.tsx", "default");
}}),
"[project]/src/components/CategoryScroller.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryScroller$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/CategoryScroller.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryScroller$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/CategoryScroller.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryScroller$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/games/[gameId]/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>GameDetailPage),
    "generateStaticParams": (()=>generateStaticParams)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-rsc] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-rsc] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevrons-right.js [app-rsc] (ecmascript) <export default as ChevronsRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$question$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldQuestion$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield-question.js [app-rsc] (ecmascript) <export default as ShieldQuestion>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-rsc] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductCard$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProductCard.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryScroller$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/CategoryScroller.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
async function generateStaticParams() {
    const categories = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllCategories"])();
    return categories.map((category)=>({
            gameId: category.slug
        }));
}
const statusDetailsMap = {
    safe: {
        text: 'Безопасен',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"],
        colorClass: 'text-primary',
        badgeClass: 'bg-primary/20 text-primary border-primary/40'
    },
    updating: {
        text: 'Обновляется',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"],
        colorClass: 'text-orange-400',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    },
    risky: {
        text: 'Рискованно',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
        colorClass: 'text-red-400',
        badgeClass: 'bg-red-600/20 text-red-400 border-red-600/40'
    },
    unknown: {
        text: 'Неизвестно',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2d$question$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ShieldQuestion$3e$__["ShieldQuestion"],
        colorClass: 'text-muted-foreground',
        badgeClass: 'bg-muted/50 text-muted-foreground border-muted-foreground/30'
    }
};
async function GameDetailPage({ params }) {
    const category = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCategoryBySlug"])(params.gameId);
    if (!category) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    }
    const products = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProductsByCategorySlug"])(category.slug);
    const allCategoriesForScroller = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllCategories"])();
    // Breadcrumb items definition removed
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-background text-foreground",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "relative h-[40vh] md:h-[50vh] lg:h-[60vh] flex items-end px-6 pb-6 md:px-10 md:pb-10 text-white overflow-hidden",
                children: [
                    " ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        src: category.banner_url || category.imageUrl,
                        alt: `${category.name} Banner`,
                        layout: "fill",
                        objectFit: "cover",
                        style: {
                            objectPosition: 'center top'
                        },
                        priority: true,
                        className: "absolute inset-0 z-0 opacity-40",
                        "data-ai-hint": `${category.slug} game banner`
                    }, void 0, false, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-10"
                    }, void 0, false, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "container mx-auto relative z-20 flex flex-col md:flex-row items-end justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    category.logoUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative w-20 h-20 md:w-28 md:h-28 rounded-md overflow-hidden shadow-lg border-2 border-primary/30 bg-card/50 p-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                            src: category.logoUrl,
                                            alt: `${category.name} Logo`,
                                            layout: "fill",
                                            objectFit: "contain",
                                            "data-ai-hint": `${category.slug} game logo`
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                            lineNumber: 60,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wider text-foreground [text-shadow:_2px_2px_8px_hsl(var(--background)/0.8)] mt-4 md:mt-0",
                                            children: category.name
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                            lineNumber: 71,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                        lineNumber: 69,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 md:mt-0 md:ml-8 text-muted-foreground max-w-md md:text-right",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-1.5",
                                    children: [
                                        category.hero_bullet_points && category.hero_bullet_points.length > 0 ? category.hero_bullet_points.map((point, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "flex items-center justify-end text-lg md:text-xl",
                                                children: [
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__["ChevronsRight"], {
                                                        className: "h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                                        lineNumber: 79,
                                                        columnNumber: 21
                                                    }, this),
                                                    " ",
                                                    point
                                                ]
                                            }, index, true, {
                                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                                lineNumber: 78,
                                                columnNumber: 19
                                            }, this)) : category.description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex items-center justify-end text-lg md:text-xl",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__["ChevronsRight"], {
                                                    className: "h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                                    lineNumber: 85,
                                                    columnNumber: 21
                                                }, this),
                                                category.description.length > 100 ? `${category.description.substring(0, 97)}...` : category.description
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                            lineNumber: 84,
                                            columnNumber: 18
                                        }, this) : null,
                                        category.min_price > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex items-center justify-end text-lg md:text-xl",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$right$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsRight$3e$__["ChevronsRight"], {
                                                    className: "h-5 w-5 md:h-6 md:w-6 text-primary mr-1.5 shrink-0"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                                    lineNumber: 91,
                                                    columnNumber: 21
                                                }, this),
                                                "Цены от ",
                                                category.min_price.toFixed(0),
                                                "₽"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                            lineNumber: 90,
                                            columnNumber: 18
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                    lineNumber: 75,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 74,
                                columnNumber: 12
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CategoryScroller$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                categories: allCategoriesForScroller,
                currentSlug: category.slug
            }, void 0, false, {
                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto px-4 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-muted-foreground mb-6",
                        children: [
                            products.length,
                            " ",
                            products.length === 1 ? 'продукт' : products.length >= 2 && products.length <= 4 ? 'продукта' : 'продуктов'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    products && products.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
                        children: products.map((product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProductCard$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                product: product
                            }, product.id, false, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 112,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center py-10 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                className: "h-12 w-12 text-muted-foreground mb-4"
                            }, void 0, false, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-muted-foreground text-lg",
                                children: "Товары для этой игры еще не добавлены."
                            }, void 0, false, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-muted-foreground",
                                children: "Загляните позже!"
                            }, void 0, false, {
                                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                                lineNumber: 119,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/games/[gameId]/page.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/games/[gameId]/page.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/games/[gameId]/page.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/games/[gameId]/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/games/[gameId]/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__8d0ef1a5._.js.map