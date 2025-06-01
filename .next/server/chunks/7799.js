exports.id=7799,exports.ids=[7799],exports.modules={28303:t=>{function e(t){var e=Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}e.keys=()=>[],e.resolve=e,e.id=28303,t.exports=e},30035:(t,e,r)=>{"use strict";r.r(e),r.d(e,{"6089447028175c0572b15a7e03e70f832d763fe00d":()=>a.P});var a=r(75365)},31155:(t,e,r)=>{"use strict";r.d(e,{AS:()=>l,M$:()=>o,QU:()=>i,bP:()=>n,pI:()=>_});var a=r(75365);let i=async()=>{try{return(await (0,a.P)(`SELECT DISTINCT 
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
       ORDER BY g.name ASC`)).map(t=>({id:t.id,name:t.name,slug:t.slug,description:t.description,min_price:parseFloat(t.min_price)||0,imageUrl:(t.imageUrl||`https://placehold.co/800x400.png?text=${encodeURIComponent(t.name)}`).trim(),logoUrl:(t.logoUrl||`https://placehold.co/150x150.png?text=${encodeURIComponent(t.name.substring(0,3))}`).trim(),banner_url:t.banner_url?t.banner_url.trim():null,platform:t.platform,tags:"string"==typeof t.tags?t.tags.split(",").map(t=>t.trim()).filter(Boolean):[],dataAiHint:`${t.dataAiHint||t.name.toLowerCase()} game icon`,hero_bullet_points:"string"==typeof t.hero_bullet_points?t.hero_bullet_points.split("\n").map(t=>t.trim()).filter(Boolean):[],product_count:parseInt(t.product_count)||0}))}catch(t){return console.error("Error fetching categories:",t),[]}},_=async t=>{try{let e=await (0,a.P)(`SELECT DISTINCT 
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
       WHERE g.slug = ?`,[t]);if(0===e.length)return;let r=e[0];return{id:r.id,name:r.name,slug:r.slug,description:r.description,min_price:parseFloat(r.min_price)||0,imageUrl:(r.imageUrl||`https://placehold.co/800x400.png?text=${encodeURIComponent(r.name)}`).trim(),logoUrl:(r.logoUrl||`https://placehold.co/150x150.png?text=${encodeURIComponent(r.name.substring(0,3))}`).trim(),banner_url:r.banner_url?r.banner_url.trim():null,platform:r.platform,tags:"string"==typeof r.tags?r.tags.split(",").map(t=>t.trim()).filter(t=>t):[],dataAiHint:`${r.dataAiHint||r.name.toLowerCase()} game icon`,hero_bullet_points:"string"==typeof r.hero_bullet_points?r.hero_bullet_points.split("\n").map(t=>t.trim()).filter(Boolean):[],product_count:parseInt(r.product_count)||0}}catch(e){console.error(`Error fetching category by slug ${t}:`,e);return}},l=async()=>{try{return(await (0,a.P)(`SELECT 
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
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id) as min_price_rub_calculated,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id) as min_price_gh_calculated,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       ORDER BY p.name ASC`)).map(t=>({id:t.id,name:t.name,slug:t.slug,game_slug:t.game_slug,image_url:t.image_url?t.image_url.trim():null,imageUrl:(t.image_url||`https://placehold.co/300x350.png?text=${encodeURIComponent(t.name)}`).trim(),status:t.status?String(t.status).toLowerCase():"unknown",status_text:t.status_text,price:parseFloat(t.min_price_rub_calculated||"0"),min_price_rub:t.min_price_rub_calculated?parseFloat(t.min_price_rub_calculated):void 0,min_price_gh:t.min_price_gh_calculated?parseFloat(t.min_price_gh_calculated):void 0,price_text:t.price_text,short_description:t.short_description,long_description:t.long_description,data_ai_hint:t.data_ai_hint||`${t.name.toLowerCase()} product`,mode:t.mode,gallery_image_urls:t.gallery_image_urls?t.gallery_image_urls.split(",").map(t=>t.trim()).filter(Boolean):[],functions_aim_title:t.functions_aim_title,functions_aim:t.functions_aim?t.functions_aim.split(",").map(t=>t.trim()).filter(Boolean):[],functions_aim_description:t.functions_aim_description,functions_esp_title:t.functions_esp_title,functions_wallhack:t.functions_wallhack?t.functions_wallhack.split(",").map(t=>t.trim()).filter(Boolean):[],functions_esp_description:t.functions_esp_description,functions_misc_title:t.functions_misc_title,functions_misc:t.functions_misc?t.functions_misc.split(",").map(t=>t.trim()).filter(Boolean):[],functions_misc_description:t.functions_misc_description,system_os:t.system_os,system_build:t.system_build,system_gpu:t.system_gpu,system_cpu:t.system_cpu,retrieval_modal_intro_text:t.retrieval_modal_intro_text,retrieval_modal_antivirus_text:t.retrieval_modal_antivirus_text,retrieval_modal_antivirus_link_text:t.retrieval_modal_antivirus_link_text,retrieval_modal_antivirus_link_url:t.retrieval_modal_antivirus_link_url,retrieval_modal_launcher_text:t.retrieval_modal_launcher_text,retrieval_modal_launcher_link_text:t.retrieval_modal_launcher_link_text,retrieval_modal_launcher_link_url:t.retrieval_modal_launcher_link_url,retrieval_modal_key_paste_text:t.retrieval_modal_key_paste_text,retrieval_modal_support_text:t.retrieval_modal_support_text,retrieval_modal_support_link_text:t.retrieval_modal_support_link_text,retrieval_modal_support_link_url:t.retrieval_modal_support_link_url,retrieval_modal_how_to_run_link:t.retrieval_modal_how_to_run_link,created_at:t.created_at,updated_at:t.updated_at,gameName:t.gameName,gameLogoUrl:t.gameLogoUrl?t.gameLogoUrl.trim():null,gamePlatform:t.gamePlatform}))}catch(t){return console.error("Error fetching products:",t),[]}},o=async t=>{try{let e=await (0,a.P)(`SELECT 
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
       WHERE p.slug = ?`,[t]);if(0===e.length)return;let r=e[0],i=await (0,a.P)("SELECT id, product_id, duration_days, price_rub, price_gh, payment_link, mode_label, created_at FROM product_pricing_options WHERE product_id = ? ORDER BY duration_days ASC, mode_label ASC",[r.id]),_=Array.isArray(i)?i.map(t=>({id:t.id,product_id:t.product_id,duration_days:parseInt(t.duration_days,10),price_rub:parseFloat(t.price_rub),price_gh:parseFloat(t.price_gh),payment_link:t.payment_link||null,mode_label:t.mode_label||null,created_at:t.created_at})):[],l=_.length>0?_.reduce((t,e)=>e.price_rub<t?e.price_rub:t,_[0].price_rub):0,o=_.length>0?_.reduce((t,e)=>e.price_gh<t?e.price_gh:t,_[0].price_gh):0;return{id:r.id,name:r.name,slug:r.slug,game_slug:r.game_slug,image_url:r.image_url?r.image_url.trim():null,imageUrl:(r.image_url||`https://placehold.co/600x400.png?text=${encodeURIComponent(r.name)}`).trim(),status:r.status?String(r.status).toLowerCase():"unknown",status_text:r.status_text||"Статус неизвестен",price:l,min_price_rub:l,min_price_gh:o,price_text:r.price_text,short_description:r.short_description,long_description:r.long_description,data_ai_hint:r.data_ai_hint||`${r.name.toLowerCase()} product`,mode:r.mode,gallery_image_urls:r.gallery_image_urls?r.gallery_image_urls.split(",").map(t=>t.trim()).filter(Boolean):[],functions_aim_title:r.functions_aim_title,functions_aim:r.functions_aim?r.functions_aim.split(",").map(t=>t.trim()).filter(Boolean):[],functions_aim_description:r.functions_aim_description,functions_esp_title:r.functions_esp_title,functions_wallhack:r.functions_wallhack?r.functions_wallhack.split(",").map(t=>t.trim()).filter(Boolean):[],functions_esp_description:r.functions_esp_description,functions_misc_title:r.functions_misc_title,functions_misc:r.functions_misc?r.functions_misc.split(",").map(t=>t.trim()).filter(Boolean):[],functions_misc_description:r.functions_misc_description,system_os:r.system_os,system_build:r.system_build,system_gpu:r.system_gpu,system_cpu:r.system_cpu,pricing_options:_.length>0?_:[],retrieval_modal_intro_text:r.retrieval_modal_intro_text,retrieval_modal_antivirus_text:r.retrieval_modal_antivirus_text,retrieval_modal_antivirus_link_text:r.retrieval_modal_antivirus_link_text,retrieval_modal_antivirus_link_url:r.retrieval_modal_antivirus_link_url,retrieval_modal_launcher_text:r.retrieval_modal_launcher_text,retrieval_modal_launcher_link_text:r.retrieval_modal_launcher_link_text,retrieval_modal_launcher_link_url:r.retrieval_modal_launcher_link_url,retrieval_modal_key_paste_text:r.retrieval_modal_key_paste_text,retrieval_modal_support_text:r.retrieval_modal_support_text,retrieval_modal_support_link_text:r.retrieval_modal_support_link_text,retrieval_modal_support_link_url:r.retrieval_modal_support_link_url,retrieval_modal_how_to_run_link:r.retrieval_modal_how_to_run_link,created_at:r.created_at,updated_at:r.updated_at,gameName:r.gameName,gameLogoUrl:r.gameLogoUrl?r.gameLogoUrl.trim():null,gamePlatform:r.gamePlatform}}catch(e){console.error(`Error fetching product by slug ${t}:`,e);return}},n=async t=>{try{return(await (0,a.P)(`SELECT 
         p.id, p.name, p.slug, p.game_slug, p.image_url, 
         p.status, p.status_text, 
         p.short_description, p.long_description, p.data_ai_hint,
         (SELECT MIN(ppo.price_rub) FROM product_pricing_options ppo WHERE ppo.product_id = p.id) as min_price_rub,
         (SELECT MIN(ppo.price_gh) FROM product_pricing_options ppo WHERE ppo.product_id = p.id) as min_price_gh,
         p.price_text,
         COALESCE(g.name, p.game_slug) as gameName,
         g.logo_url as gameLogoUrl,
         g.platform as gamePlatform 
       FROM products p
       LEFT JOIN games g ON p.game_slug = g.slug 
       WHERE p.game_slug = ?
       ORDER BY p.name ASC`,[t])).map(t=>({id:t.id,name:t.name,slug:t.slug,game_slug:t.game_slug,image_url:t.image_url?t.image_url.trim():null,imageUrl:(t.image_url||`https://placehold.co/300x350.png?text=${encodeURIComponent(t.name)}`).trim(),status:t.status?String(t.status).toLowerCase():"unknown",status_text:t.status_text||"Статус неизвестен",price:parseFloat(t.min_price_rub)||0,min_price_rub:t.min_price_rub?parseFloat(t.min_price_rub):void 0,min_price_gh:t.min_price_gh?parseFloat(t.min_price_gh):void 0,price_text:t.price_text,short_description:t.short_description,long_description:t.long_description,data_ai_hint:t.data_ai_hint||`${t.name.toLowerCase()} product`,gameName:t.gameName,gameLogoUrl:t.gameLogoUrl?t.gameLogoUrl.trim():null,gamePlatform:t.gamePlatform}))}catch(e){return console.error(`Error fetching products for game slug ${t}:`,e),[]}}},75365:(t,e,r)=>{"use strict";r.d(e,{P:()=>n});var a=r(67218);r(79130);var i=r(46101),_=r(17478);let l={host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:10,namedPlaceholders:!0},o=null;async function n(t,e){let r;let a=function(){if(!o){if(!process.env.DB_HOST||!process.env.DB_USER||!process.env.DB_NAME)throw console.error("Database environment variables DB_HOST, DB_USER, or DB_NAME are not set."),Error("Database environment variables are not fully set. Please check your .env.local file.");try{o=i.createPool(l),console.log("MySQL connection pool created successfully."),o.getConnection().then(t=>{console.log("Successfully connected to database via pool."),t.release()}).catch(t=>{console.error("Failed to get a connection from pool on startup:",t)})}catch(t){throw console.error("Failed to create MySQL connection pool:",t),o=null,Error("Database connection pool could not be created.")}}return o}();try{r=await a.getConnection(),console.log(`Executing SQL: ${t} with params: ${e?JSON.stringify(e):"No params"}`);let[i]=await r.execute(t,e);return i}catch(t){throw console.error("Database query error:",t.message,t.code,t.sqlMessage,t.sql),Error(`Database query failed: ${t.message}`)}finally{r&&r.release()}}(0,_.D)([n]),(0,a.A)(n,"6089447028175c0572b15a7e03e70f832d763fe00d",null)}};